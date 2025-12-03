"""Football Performance Dashboard - Main FastAPI Application."""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy import text

from app.config import settings
from app.db.database import engine, Base, get_db
from app.routers import players, sessions, stats, health, teams, schedule, analytics, admin
from app.routers import auth
from app.models.models import User, Team
from app.utils.auth import get_password_hash

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# Configure Application Insights if connection string is provided
if settings.applicationinsights_connection_string:
    try:
        from opencensus.ext.azure.log_exporter import AzureLogHandler

        logger.addHandler(
            AzureLogHandler(
                connection_string=settings.applicationinsights_connection_string
            )
        )
        logger.info("Application Insights logging configured")
    except Exception as e:
        logger.warning(f"Failed to configure Application Insights: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    try:
        # Log available ODBC drivers
        try:
            import pyodbc
            logger.info(f"Available ODBC drivers: {pyodbc.drivers()}")
        except Exception as e:
            logger.warning(f"Could not list ODBC drivers: {e}")

        logger.info("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        
        # Schema Migration: Add missing columns
        try:
            is_sqlite = "sqlite" in str(engine.url).lower()
            is_mssql = engine.dialect.name == "mssql" or "mssql" in str(engine.url)
            
            logger.info(f"Database type - SQLite: {is_sqlite}, MSSQL: {is_mssql}")
            
            if is_mssql:
                logger.info("Running SQL Server schema migrations...")
                with engine.begin() as connection:
                    # Try to drop old photo_url column if it's the wrong type (VARCHAR)
                    try:
                        logger.info("Attempting to drop old VARCHAR photo_url column...")
                        connection.execute(text("ALTER TABLE dbo.players DROP COLUMN photo_url"))
                        logger.info("Old photo_url column dropped")
                    except Exception as e:
                        logger.debug(f"Could not drop photo_url (may not exist): {e}")
                    
                    # Add player columns - ignore if they already exist
                    player_migrations = [
                        ("surname", "ALTER TABLE dbo.players ADD surname VARCHAR(100) NULL"),
                        ("aka", "ALTER TABLE dbo.players ADD aka VARCHAR(100) NULL"),
                        ("birth_date", "ALTER TABLE dbo.players ADD birth_date VARCHAR(10) NULL"),
                        ("jersey_number", "ALTER TABLE dbo.players ADD jersey_number INT NULL"),
                        ("photo_url", "ALTER TABLE dbo.players ADD photo_url TEXT NULL"),
                    ]
                    
                    for col_name, sql in player_migrations:
                        try:
                            logger.info(f"Attempting to add column '{col_name}' to players...")
                            connection.execute(text(sql))
                            logger.info(f"Column '{col_name}' added successfully")
                        except Exception as e:
                            # Column likely already exists, which is fine
                            logger.debug(f"Column '{col_name}' add failed (may already exist): {e}")
                    
                    # Add team user_id column
                    try:
                        logger.info("Attempting to add column 'user_id' to teams...")
                        connection.execute(text("ALTER TABLE dbo.teams ADD user_id INT NULL"))
                        logger.info("Column 'user_id' added to teams")
                    except Exception as e:
                        logger.debug(f"Column 'user_id' add failed (may already exist): {e}")
                    
                    # Add user role column
                    try:
                        logger.info("Attempting to add column 'role' to users...")
                        connection.execute(text("ALTER TABLE dbo.users ADD role VARCHAR(50) DEFAULT 'coach' NULL"))
                        logger.info("Column 'role' added to users")
                    except Exception as e:
                        logger.debug(f"Column 'role' add failed (may already exist): {e}")
                
            elif is_sqlite:
                logger.info("Running SQLite schema migrations...")
                with engine.begin() as connection:
                    cursor = connection.execute(text("PRAGMA table_info(players)"))
                    existing_columns = {row[1] for row in cursor.fetchall()}
                    logger.info(f"Existing columns: {existing_columns}")
                    
                    player_migrations = [
                        ("surname", "ALTER TABLE players ADD COLUMN surname VARCHAR(100) NULL"),
                        ("aka", "ALTER TABLE players ADD COLUMN aka VARCHAR(100) NULL"),
                        ("birth_date", "ALTER TABLE players ADD COLUMN birth_date VARCHAR(10) NULL"),
                        ("jersey_number", "ALTER TABLE players ADD COLUMN jersey_number INTEGER NULL"),
                        ("photo_url", "ALTER TABLE players ADD COLUMN photo_url TEXT NULL"),
                    ]
                    
                    for col_name, sql in player_migrations:
                        if col_name not in existing_columns:
                            try:
                                logger.info(f"Adding column '{col_name}' to SQLite...")
                                connection.execute(text(sql))
                                logger.info(f"Column '{col_name}' added successfully")
                            except Exception as e:
                                logger.warning(f"Failed to add column '{col_name}': {e}")
                    
                    # Add team user_id column
                    cursor = connection.execute(text("PRAGMA table_info(teams)"))
                    team_columns = {row[1] for row in cursor.fetchall()}
                    if "user_id" not in team_columns:
                        try:
                            logger.info("Adding column 'user_id' to SQLite teams...")
                            connection.execute(text("ALTER TABLE teams ADD COLUMN user_id INTEGER NULL"))
                            logger.info("Column 'user_id' added to teams")
                        except Exception as e:
                            logger.warning(f"Failed to add column 'user_id': {e}")
                    
                    # Add user role column
                    cursor = connection.execute(text("PRAGMA table_info(users)"))
                    user_columns = {row[1] for row in cursor.fetchall()}
                    if "role" not in user_columns:
                        try:
                            logger.info("Adding column 'role' to SQLite users...")
                            connection.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'coach' NULL"))
                            logger.info("Column 'role' added to users")
                        except Exception as e:
                            logger.warning(f"Failed to add column 'role': {e}")
            
            logger.info("Schema migrations completed")
        except Exception as e:
            logger.error(f"Schema migration error: {e}", exc_info=True)
        
        # Create demo user if not exists
        try:
            db = next(get_db())
            
            # Create or get demo admin user
            admin_user = db.query(User).filter(User.email == "admin@dashboard.com").first()
            if not admin_user:
                admin_user = User(
                    username="admin",
                    email="admin@dashboard.com",
                    password_hash=get_password_hash("Admin1234"),
                    role="admin",
                    is_active=1
                )
                db.add(admin_user)
                db.commit()
                logger.info("Admin user created: admin@dashboard.com / Admin1234")
            else:
                logger.info("Admin user already exists")
            
            # Create or get demo coach user
            demo_user = db.query(User).filter(User.email == "demo@coach.com").first()
            if not demo_user:
                demo_user = User(
                    username="demo",
                    email="demo@coach.com",
                    password_hash=get_password_hash("Demo1234"),
                    role="coach",
                    is_active=1
                )
                db.add(demo_user)
                db.commit()
                logger.info("Demo user created: demo@coach.com / Demo1234")
            else:
                logger.info("Demo user already exists")
            
            # Assign orphaned teams (with NULL user_id) to demo user
            orphaned_teams = db.query(Team).filter(Team.user_id is None).all()
            if orphaned_teams:
                logger.info(f"Found {len(orphaned_teams)} teams without user_id, assigning to demo user...")
                for team in orphaned_teams:
                    team.user_id = demo_user.id
                    db.add(team)
                db.commit()
                logger.info(f"Assigned {len(orphaned_teams)} teams to demo user")
            
            db.close()
        except Exception as e:
            logger.warning(f"Failed to create/update demo user: {e}")
            
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        logger.info("App will continue without database initialization")
    yield
    # Shutdown (nothing to do currently)


# Create FastAPI application
app = FastAPI(
    title=settings.app_name,
    description=(
        "A professional trainer dashboard that ingests football athletes' data "
        "and transforms it into helpful insights to prevent injury and optimize workload."
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Include routers
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(teams.router)
app.include_router(players.router)
app.include_router(sessions.router)
app.include_router(stats.router)
app.include_router(schedule.router)
app.include_router(analytics.router)
app.include_router(admin.router)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": str(exc)},
    )


@app.get("/")
async def read_root():
    return FileResponse("app/static/index.html")

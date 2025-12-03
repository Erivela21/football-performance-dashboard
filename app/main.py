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
from app.routers import players, sessions, stats, health, teams, schedule, analytics
from app.routers import auth
from app.models.models import User
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
                    # Add columns - ignore if they already exist
                    migrations = [
                        ("surname", "ALTER TABLE dbo.players ADD surname VARCHAR(100) NULL"),
                        ("aka", "ALTER TABLE dbo.players ADD aka VARCHAR(100) NULL"),
                        ("birth_date", "ALTER TABLE dbo.players ADD birth_date VARCHAR(10) NULL"),
                        ("jersey_number", "ALTER TABLE dbo.players ADD jersey_number INT NULL"),
                        ("photo_url", "ALTER TABLE dbo.players ADD photo_url TEXT NULL"),
                    ]
                    
                    for col_name, sql in migrations:
                        try:
                            logger.info(f"Attempting to add column '{col_name}'...")
                            connection.execute(text(sql))
                            logger.info(f"Column '{col_name}' added successfully")
                        except Exception as e:
                            # Column likely already exists, which is fine
                            logger.debug(f"Column '{col_name}' add failed (may already exist): {e}")
                
            elif is_sqlite:
                logger.info("Running SQLite schema migrations...")
                with engine.begin() as connection:
                    cursor = connection.execute(text("PRAGMA table_info(players)"))
                    existing_columns = {row[1] for row in cursor.fetchall()}
                    logger.info(f"Existing columns: {existing_columns}")
                    
                    migrations = [
                        ("surname", "ALTER TABLE players ADD COLUMN surname VARCHAR(100) NULL"),
                        ("aka", "ALTER TABLE players ADD COLUMN aka VARCHAR(100) NULL"),
                        ("birth_date", "ALTER TABLE players ADD COLUMN birth_date VARCHAR(10) NULL"),
                        ("jersey_number", "ALTER TABLE players ADD COLUMN jersey_number INTEGER NULL"),
                        ("photo_url", "ALTER TABLE players ADD COLUMN photo_url TEXT NULL"),
                    ]
                    
                    for col_name, sql in migrations:
                        if col_name not in existing_columns:
                            try:
                                logger.info(f"Adding column '{col_name}' to SQLite...")
                                connection.execute(text(sql))
                                logger.info(f"Column '{col_name}' added successfully")
                            except Exception as e:
                                logger.warning(f"Failed to add column '{col_name}': {e}")
            
            logger.info("Schema migrations completed")
        except Exception as e:
            logger.error(f"Schema migration error: {e}", exc_info=True)
        
        # Create demo user if not exists
        try:
            db = next(get_db())
            demo_user = db.query(User).filter(User.email == "demo@coach.com").first()
            if not demo_user:
                demo_user = User(
                    username="demo",
                    email="demo@coach.com",
                    password_hash=get_password_hash("Demo1234"),
                    is_active=1
                )
                db.add(demo_user)
                db.commit()
                logger.info("Demo user created: demo@coach.com / Demo1234")
            else:
                logger.info("Demo user already exists")
            db.close()
        except Exception as e:
            logger.warning(f"Failed to create demo user: {e}")
            
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

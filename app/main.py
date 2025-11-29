"""Football Performance Dashboard - Main FastAPI Application."""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.db.database import engine, Base
from app.routers import players, sessions, stats, health

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
    logger.info("Creating database tables...")
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")
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

# Include routers
app.include_router(health.router)
app.include_router(players.router)
app.include_router(sessions.router)
app.include_router(stats.router)


@app.get("/")
def root():
    """Root endpoint returning API information."""
    return {
        "message": "Welcome to the Football Performance Dashboard API",
        "docs": "/docs",
        "health": "/health",
    }

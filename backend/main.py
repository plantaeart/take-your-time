"""
FastAPI application for Take Your Time booking system.
"""
import os
import sys
import asyncio
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from fastapi import FastAPI
import logging

from app.config.settings import get_settings
from app.config.cors import setup_cors
from app.config.database import db_manager
from app.routers.products import router as products_router
from app.routers.auth import router as auth_router
from app.routers.cart import router as cart_router
from app.routers.wishlist import router as wishlist_router
from app.routers.admin_users import router as admin_users_router
from app.startup import initialize_database
from app.version import __version__

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("🚀 Starting up Take Your Time API...")
    logger.info("🤔 Connecting to database...")
    await db_manager.connect_to_mongo()
    logger.info("✅ Database connected successfully")
    
    # Initialize database with admin user and indexes
    logger.info("🔧 Initializing database...")
    await initialize_database()
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down Take Your Time API...")
    await db_manager.close_mongo_connection()


async def verify_database_connection():
    """Verify database connection before starting the app."""
    try:
        logger.info("🤔 Verifying database connection before startup...")
        await db_manager.connect_to_mongo()
        logger.info("✅ Database connection verified successfully")
        return True
    except Exception as e:
        logger.error("💥 Database connection verification failed")
        logger.error("🛑 Cannot start application without database connection")
        return False


def create_app() -> FastAPI:
    """Create and configure FastAPI application."""
    
    # Load environment-specific settings using lazy initialization
    settings = get_settings()
    
    # Create FastAPI app
    app = FastAPI(
        title="Take Your Time API",
        description="Product management system for inventory and catalog operations",
        version=__version__,
        docs_url="/docs",
        redoc_url="/redoc",
        lifespan=lifespan,
        debug=settings.debug,
    )
    
    # Setup CORS
    setup_cors(app)
    
    # Add health check endpoint
    @app.get("/health")
    async def health_check():
        """Health check endpoint to verify the API is running."""
        return {
            "status": "healthy",
            "message": "Take Your Time Product API is running",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": __version__
        }
    
    # Include routers
    app.include_router(auth_router, prefix="/api")
    app.include_router(products_router, prefix="/api")
    app.include_router(cart_router, prefix="/api")
    app.include_router(wishlist_router, prefix="/api")
    app.include_router(admin_users_router, prefix="/api")
    
    return app


# Create app instance
app = create_app()


if __name__ == "__main__":
    import uvicorn
    
    # Load settings using lazy initialization
    settings = get_settings()
    
    # Start the server - database connection will be handled in lifespan
    logger.info("🎯 Starting FastAPI server...")
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=settings.debug,
        log_level="info"
    )

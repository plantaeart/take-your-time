"""
CORS configuration for FastAPI application.
"""
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from app.config.settings import get_settings


def setup_cors(app: FastAPI) -> None:
    """Configure CORS middleware for the FastAPI application."""
    
    settings = get_settings()
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.frontend_origins,  # Angular frontend URLs
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allow_headers=[
            "Accept",
            "Accept-Language",
            "Content-Language",
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "X-CSRFToken",
            "X-Forwarded-For",
            "X-Forwarded-Proto",
            "Cache-Control",
            "Pragma",
        ],
        expose_headers=[
            "Content-Type",
            "Authorization", 
            "X-Total-Count",
            "X-Page-Size",
            "X-Current-Page",
        ],
        max_age=3600,  # Cache preflight requests for 1 hour
    )

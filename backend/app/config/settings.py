"""
Settings configuration for the FastAPI application.
"""
from pydantic_settings import BaseSettings
from pydantic import ConfigDict
from typing import List, Optional


class Settings(BaseSettings):
    """Application settings."""
    
    # Environment
    environment: str = "local"
    debug: bool = True
    
    # MongoDB
    mongodb_url: str
    database_name: str
    
    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    
    # JWT Configuration
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # CORS
    frontend_urls: str
    
    @property
    def frontend_origins(self) -> List[str]:
        """Parse frontend URLs into a list."""
        return [url.strip() for url in self.frontend_urls.split(",")]
    
    model_config = ConfigDict(
        env_file=".env.local",  # Default, can be overridden
        env_file_encoding="utf-8"
    )


# Global settings instance - will be initialized when needed
settings: Optional[Settings] = None


def get_settings() -> Settings:
    """Get or create settings instance."""
    global settings
    if settings is None:
        import os
        env_file = os.getenv("ENV_FILE", ".env.local")
        settings = Settings(_env_file=env_file)
    return settings

"""
Token blacklist model for JWT token management.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class TokenBlacklistModel(BaseModel):
    """Model for blacklisted JWT tokens."""
    
    token: str = Field(..., description="The JWT token to blacklist")
    userId: int = Field(..., description="ID of the user who owns the token")
    blacklistedAt: datetime = Field(default_factory=datetime.now, description="When the token was blacklisted")
    reason: Optional[str] = Field(default="logout", description="Reason for blacklisting (logout, security, etc.)")
    expiresAt: datetime = Field(..., description="When the original token would have expired")
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

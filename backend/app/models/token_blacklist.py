"""
Token blacklist model for JWT token management.
"""
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, Field, ConfigDict, field_serializer


class TokenBlacklistModel(BaseModel):
    """Model for blacklisted JWT tokens."""
    
    token: str = Field(..., description="The JWT token to blacklist")
    userId: int = Field(..., description="ID of the user who owns the token")
    blacklistedAt: datetime = Field(default_factory=datetime.now, description="When the token was blacklisted")
    reason: Optional[str] = Field(default="logout", description="Reason for blacklisting (logout, security, etc.)")
    expiresAt: datetime = Field(..., description="When the original token would have expired")
    
    model_config = ConfigDict()
    
    @field_serializer('blacklistedAt', 'expiresAt', when_used='json')
    def serialize_datetime(self, value: datetime) -> str:
        """Serialize datetime to ISO format."""
        return value.isoformat()

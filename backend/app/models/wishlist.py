"""
Wishlist model for MongoDB.
"""
from datetime import datetime
from typing import List, Any
from pydantic import BaseModel, Field, ConfigDict, field_serializer


class WishlistItem(BaseModel):
    """Wishlist item model."""
    productId: int = Field(..., description="Product ID")
    addedAt: datetime = Field(default_factory=datetime.now, description="When the item was added to wishlist")
    schemaVersion: int = Field(default=1, description="Schema version for database upgrade management")
    
    @field_serializer('addedAt', when_used='json')
    def serialize_datetime(self, value: datetime) -> str:
        """Serialize datetime to ISO format."""
        return value.isoformat()


class WishlistModel(BaseModel):
    """Wishlist document model for MongoDB."""
    userId: int = Field(..., description="User ID who owns the wishlist")
    items: List[WishlistItem] = Field(default_factory=list, description="List of wishlist items")
    createdAt: datetime = Field(default_factory=datetime.now)
    updatedAt: datetime = Field(default_factory=datetime.now)
    schemaVersion: int = Field(default=1, description="Schema version for database upgrade management")
    
    model_config = ConfigDict()
    
    @field_serializer('createdAt', 'updatedAt', when_used='json')
    def serialize_datetime(self, value: datetime) -> str:
        """Serialize datetime to ISO format."""
        return value.isoformat()

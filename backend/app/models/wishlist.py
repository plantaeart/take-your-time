"""
Wishlist model for MongoDB.
"""
from datetime import datetime
from typing import List
from pydantic import BaseModel, Field


class WishlistItem(BaseModel):
    """Wishlist item model."""
    productId: int = Field(..., description="Product ID")
    addedAt: datetime = Field(default_factory=datetime.now, description="When the item was added to wishlist")


class WishlistModel(BaseModel):
    """Wishlist document model for MongoDB."""
    userId: int = Field(..., description="User ID who owns the wishlist")
    items: List[WishlistItem] = Field(default_factory=list, description="List of wishlist items")
    createdAt: datetime = Field(default_factory=datetime.now)
    updatedAt: datetime = Field(default_factory=datetime.now)
    
    class Config:
        """Pydantic model configuration."""
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

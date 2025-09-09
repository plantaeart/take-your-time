"""
Wishlist schemas for request/response validation.
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class WishlistItemResponse(BaseModel):
    """Wishlist item response schema."""
    productId: int
    addedAt: datetime
    # Optional product details (can be populated via join)
    productName: Optional[str] = None
    productPrice: Optional[float] = None
    productImage: Optional[str] = None
    schemaVersion: int = Field(default=1, description="Schema version for database upgrade management")


class WishlistItemCreate(BaseModel):
    """Schema for adding item to wishlist."""
    productId: int = Field(..., description="Product ID to add to wishlist")


class WishlistItemUpdate(BaseModel):
    """Schema for updating wishlist item - can change product."""
    productId: int = Field(..., description="New product ID")


class WishlistResponse(BaseModel):
    """Wishlist response schema."""
    userId: int
    items: List[WishlistItemResponse]
    totalItems: int = Field(..., description="Total number of items in wishlist")
    createdAt: datetime
    updatedAt: datetime
    schemaVersion: int = Field(default=1, description="Schema version for database upgrade management")

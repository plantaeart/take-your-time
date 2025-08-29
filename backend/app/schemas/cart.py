"""
Cart schemas for request/response validation.
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class CartItemResponse(BaseModel):
    """Cart item response schema."""
    productId: int
    quantity: int
    addedAt: datetime
    updatedAt: datetime
    # Optional product details (can be populated via join)
    productName: Optional[str] = None
    productPrice: Optional[float] = None
    productImage: Optional[str] = None
    schemaVersion: int = Field(default=1, description="Schema version for database upgrade management")


class CartItemCreate(BaseModel):
    """Schema for adding item to cart."""
    productId: int = Field(..., description="Product ID to add to cart")
    quantity: int = Field(1, ge=1, description="Quantity to add")


class CartItemUpdate(BaseModel):
    """Schema for updating cart item quantity."""
    quantity: int = Field(..., ge=1, description="New quantity")


class CartResponse(BaseModel):
    """Cart response schema."""
    userId: int
    items: List[CartItemResponse]
    totalItems: int = Field(..., description="Total number of items in cart")
    createdAt: datetime
    updatedAt: datetime
    schemaVersion: int = Field(default=1, description="Schema version for database upgrade management")

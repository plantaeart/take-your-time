"""
Cart model for MongoDB.
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class CartItem(BaseModel):
    """Cart item model."""
    productId: int = Field(..., description="Product ID")
    quantity: int = Field(..., ge=1, description="Quantity of the product")
    addedAt: datetime = Field(default_factory=datetime.now, description="When the item was added to cart")
    updatedAt: datetime = Field(default_factory=datetime.now, description="When the item was last updated")


class CartModel(BaseModel):
    """Cart document model for MongoDB."""
    userId: int = Field(..., description="User ID who owns the cart")
    items: List[CartItem] = Field(default_factory=list, description="List of cart items")
    createdAt: datetime = Field(default_factory=datetime.now)
    updatedAt: datetime = Field(default_factory=datetime.now)
    
    class Config:
        """Pydantic model configuration."""
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

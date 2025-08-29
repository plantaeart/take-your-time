"""
Cart model for MongoDB.
"""
from datetime import datetime
from typing import List, Optional, Any
from pydantic import BaseModel, Field, ConfigDict, field_serializer


class CartItem(BaseModel):
    """Cart item model."""
    productId: int = Field(..., description="Product ID")
    quantity: int = Field(..., ge=1, description="Quantity of the product")
    addedAt: datetime = Field(default_factory=datetime.now, description="When the item was added to cart")
    updatedAt: datetime = Field(default_factory=datetime.now, description="When the item was last updated")
    schemaVersion: int = Field(default=1, description="Schema version for database upgrade management")
    
    @field_serializer('addedAt', 'updatedAt', when_used='json')
    def serialize_datetime(self, value: datetime) -> str:
        """Serialize datetime to ISO format."""
        return value.isoformat()


class CartModel(BaseModel):
    """Cart document model for MongoDB."""
    userId: int = Field(..., description="User ID who owns the cart")
    items: List[CartItem] = Field(default_factory=list, description="List of cart items")
    createdAt: datetime = Field(default_factory=datetime.now)
    updatedAt: datetime = Field(default_factory=datetime.now)
    schemaVersion: int = Field(default=1, description="Schema version for database upgrade management")
    
    model_config = ConfigDict()
    
    @field_serializer('createdAt', 'updatedAt', when_used='json')
    def serialize_datetime(self, value: datetime) -> str:
        """Serialize datetime to ISO format."""
        return value.isoformat()

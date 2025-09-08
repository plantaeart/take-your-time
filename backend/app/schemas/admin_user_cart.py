"""
Admin user cart schemas for enhanced search with user information.
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class AdminUserCartItem(BaseModel):
    """Cart item with essential product details."""
    productId: int
    productName: str
    quantity: int
    productPrice: float
    productStockQuantity: int


class AdminUserCartData(BaseModel):
    """Flattened user cart data structure as requested."""
    userId: int
    userName: str
    email: str
    firstname: Optional[str] = None
    isActive: bool
    cart: List[AdminUserCartItem]


class AdminUserCartListResponse(BaseModel):
    """Paginated admin user cart search response."""
    items: List[AdminUserCartData]
    total: int
    page: int
    limit: int
    totalPages: int
    hasNext: bool
    hasPrev: bool

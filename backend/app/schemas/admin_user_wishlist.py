"""
Admin user wishlist schemas for enhanced search with user information.
"""
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field


class AdminUserWishlistItem(BaseModel):
    """Wishlist item with essential product details."""
    productId: int
    productName: str
    productPrice: float
    productStockQuantity: int
    category: str
    inventoryStatus: str


class AdminUserWishlistData(BaseModel):
    """Flattened user wishlist data structure as requested."""
    id: int
    username: str
    email: str
    firstname: Optional[str] = None
    isActive: bool
    wishlist: List[AdminUserWishlistItem]
    wishlistItemCount: int = Field(default=0, description="Total number of items in wishlist")


class AdminUserWishlistListResponse(BaseModel):
    """Paginated admin user wishlist search response."""
    items: List[AdminUserWishlistData]
    total: int
    page: int
    limit: int
    totalPages: int
    hasNext: bool
    hasPrev: bool

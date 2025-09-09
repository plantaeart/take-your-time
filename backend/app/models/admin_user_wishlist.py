"""
Admin User Wishlist Model for flattened wishlist management structure.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class AdminUserWishlistItemModel(BaseModel):
    """Simple wishlist item model with essential product details."""
    productId: int
    productName: str
    productPrice: float = Field(ge=0, description="Product price must be non-negative")
    productStockQuantity: int = Field(ge=0, description="Quantity stock available of the product")
    category: str
    inventoryStatus: str


class AdminUserWishlistModel(BaseModel):
    """Flattened admin user wishlist model as requested."""
    userId: int
    userName: str
    email: str
    firstname: Optional[str] = None
    isActive: bool = Field(default=True)
    wishlist: List[AdminUserWishlistItemModel] = Field(default_factory=list)

    @classmethod
    def from_wishlist_document(
        cls, 
        wishlist_doc: Dict[str, Any], 
        user_info: Dict[str, Any],
        wishlist_items: List[AdminUserWishlistItemModel]
    ) -> "AdminUserWishlistModel":
        """
        Create AdminUserWishlistModel from wishlist document and user information.
        
        Args:
            wishlist_doc: Wishlist document from MongoDB
            user_info: User document from MongoDB  
            wishlist_items: List of wishlist items with product details
            
        Returns:
            AdminUserWishlistModel instance
        """
        return cls(
            userId=user_info["id"],
            userName=user_info.get("username", f"User {user_info['id']}"),
            email=user_info.get("email", f"user{user_info['id']}@example.com"),
            firstname=user_info.get("firstname"),
            isActive=user_info.get("isActive", True),
            wishlist=wishlist_items
        )

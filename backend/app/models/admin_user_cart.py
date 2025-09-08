"""
Admin User Cart Model for flattened cart management structure.
"""
from datetime import datetime
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class AdminUserCartItemModel(BaseModel):
    """Simple cart item model with essential product details."""
    productId: int
    productName: str
    quantity: int = Field(ge=1, description="Quantity must be at least 1")
    productPrice: float = Field(ge=0, description="Product price must be non-negative")
    productStockQuantity: int = Field(ge=0, description="Quantity stock available of the product")


class AdminUserCartModel(BaseModel):
    """Flattened admin user cart model as requested."""
    userId: int
    userName: str
    email: str
    firstname: Optional[str] = None
    isActive: bool = Field(default=True)
    cart: List[AdminUserCartItemModel] = Field(default_factory=list)

    @classmethod
    def from_cart_document(
        cls, 
        cart_doc: Dict[str, Any], 
        user_info: Dict[str, Any],
        cart_items: List[AdminUserCartItemModel]
    ) -> "AdminUserCartModel":
        """
        Create AdminUserCartModel from cart document and user information.
        
        Args:
            cart_doc: Cart document from MongoDB
            user_info: User document from MongoDB  
            cart_items: List of cart items with product details
            
        Returns:
            AdminUserCartModel instance
        """
        return cls(
            userId=user_info["id"],
            userName=user_info.get("username", f"User {user_info['id']}"),
            email=user_info.get("email", f"user{user_info['id']}@example.com"),
            firstname=user_info.get("firstname"),
            isActive=user_info.get("isActive", True),
            cart=cart_items
        )

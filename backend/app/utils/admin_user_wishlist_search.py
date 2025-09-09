"""
Admin user wishlist search implementation.
"""
from typing import Dict, Any, List, Optional
from pymongo.collection import Collection
from app.config.database import db_manager
from app.schemas.admin_user_wishlist import AdminUserWishlistData, AdminUserWishlistItem

async def _transform_user_wishlist_simple(wishlist_doc: Dict[str, Any], user_doc: Dict[str, Any]) -> AdminUserWishlistData:
    """Transform user wishlist document to flattened structure."""
    # Fetch product details for wishlist items
    wishlist_items = []
    products_collection: Collection = db_manager.get_collection("products")
    
    for item in wishlist_doc.get("items", []):
        # Get product details
        product_doc: Optional[Dict[str, Any]] = await products_collection.find_one(
            {"id": item["productId"]}
        )
        
        if product_doc:
            # Create wishlist item with required fields
            wishlist_item = AdminUserWishlistItem(
                productId=item["productId"],
                productName=product_doc.get("name", "Product Not Found"),
                productPrice=product_doc.get("price", 0.0),
                productStockQuantity=product_doc.get("quantity", 0),
                category=product_doc.get("category", "Unknown"),
                inventoryStatus=product_doc.get("inventoryStatus", "UNKNOWN")
            )
            wishlist_items.append(wishlist_item)
    
    # Create flattened user wishlist data structure
    return AdminUserWishlistData(
        id=user_doc["id"],
        username=user_doc.get("username", f"User {user_doc['id']}"),
        email=user_doc.get("email", f"user{user_doc['id']}@example.com"),
        firstname=user_doc.get("firstname"),
        isActive=user_doc.get("isActive", True),
        wishlist=wishlist_items,
        wishlistItemCount=len(wishlist_items)
    )

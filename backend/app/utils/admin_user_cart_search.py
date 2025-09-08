"""
Admin user cart search implementation.
"""
from typing import Dict, Any, List, Optional
from pymongo.collection import Collection
from app.config.database import db_manager
from app.schemas.admin_user_cart import AdminUserCartData, AdminUserCartItem

async def _transform_user_cart_simple(cart_doc: Dict[str, Any], user_doc: Dict[str, Any]) -> AdminUserCartData:
    """Transform user cart document to flattened structure."""
    # Fetch product details for cart items
    cart_items = []
    products_collection: Collection = db_manager.get_collection("products")
    
    for item in cart_doc.get("items", []):
        # Get product details
        product_doc: Optional[Dict[str, Any]] = await products_collection.find_one(
            {"id": item["productId"]}
        )
        
        if product_doc:
            # Create cart item with required fields including stock quantity
            cart_item = AdminUserCartItem(
                productId=item["productId"],
                productName=product_doc.get("name", "Product Not Found"),
                quantity=item["quantity"],
                productPrice=product_doc.get("price", 0.0),
                productStockQuantity=product_doc.get("quantity", 0)
            )
            cart_items.append(cart_item)
    
    # Calculate cart total value
    cart_total_value = sum(item.quantity * item.productPrice for item in cart_items)
    
    # Create flattened user cart data structure
    return AdminUserCartData(
        id=user_doc["id"],
        username=user_doc.get("username", f"User {user_doc['id']}"),
        email=user_doc.get("email", f"user{user_doc['id']}@example.com"),
        firstname=user_doc.get("firstname"),
        isActive=user_doc.get("isActive", True),
        cart=cart_items,
        cartTotalValue=cart_total_value
    )

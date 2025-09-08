"""
Admin user cart search implementation.
"""
from typing import Dict, Any, List, Optional
from pymongo.collection import Collection
from app.config.database import db_manager
from app.schemas.admin_user_cart import AdminUserCartData, AdminUserCartItem


async def admin_search_user_carts_with_user_info(
    page: int,
    limit: int,
    filters: Dict[str, Any],
    sorts: List[Dict[str, str]]
) -> Dict[str, Any]:
    """
    User cart search using find() instead of aggregate().
    """
    carts_collection: Collection = db_manager.get_collection("carts")
    users_collection: Collection = db_manager.get_collection("users")
    
    # Build simple query for carts
    cart_query = {}
    if "userId" in filters and filters["userId"]:
        cart_query["userId"] = filters["userId"]
    
    # Get total count
    total_count: int = await carts_collection.count_documents(cart_query)
    
    # Get carts with pagination
    skip = (page - 1) * limit
    cursor = carts_collection.find(cart_query)
    
    # Apply sorting
    if sorts:
        sort_list = []
        for sort_item in sorts:
            direction = 1 if sort_item.get("direction", "asc") == "asc" else -1
            sort_list.append((sort_item["field"], direction))
        cursor = cursor.sort(sort_list)
    
    cursor = cursor.skip(skip).limit(limit)
    cart_docs: List[Dict[str, Any]] = await cursor.to_list(length=None)
    
    # Enhanced transformation with user lookup
    enhanced_user_carts = []
    for cart_doc in cart_docs:
        # Get user info separately
        user_doc: Optional[Dict[str, Any]] = await users_collection.find_one({
            "id": cart_doc["userId"]
        })
        
        if user_doc and not user_doc.get("isAdmin", False):
            enhanced_user_cart = await _transform_user_cart_simple(cart_doc, user_doc)
            enhanced_user_carts.append(enhanced_user_cart)
    
    # Calculate pagination info
    total_pages = (total_count + limit - 1) // limit
    has_next = page < total_pages
    has_prev = page > 1
    
    return {
        "items": enhanced_user_carts,  # Changed from 'carts' to 'items'
        "total": len(enhanced_user_carts),  # Actual count after filtering admins
        "page": page,
        "limit": limit,
        "totalPages": total_pages,
        "hasNext": has_next,
        "hasPrev": has_prev
    }


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
    
    # Create flattened user cart data structure
    return AdminUserCartData(
        userId=user_doc["id"],
        userName=user_doc.get("username", f"User {user_doc['id']}"),
        email=user_doc.get("email", f"user{user_doc['id']}@example.com"),
        firstname=user_doc.get("firstname"),
        isActive=user_doc.get("isActive", True),
        cart=cart_items
    )

"""
Admin object sorting and filtering endpoints.
Provides advanced search capabilities for all admin-managed objects.
"""
from typing import Optional, Annotated, List, Dict, Any
from fastapi import APIRouter, HTTPException, Query, Depends
import json

from app.auth.dependencies import admin_required
from app.models.user import UserModel
from app.schemas.product import ProductListResponse
from app.schemas.user import UserListResponse
from app.schemas.contact import ContactSubmissionsResponse
from app.schemas.admin_user_cart import AdminUserCartListResponse
from app.schemas.admin_user_wishlist import AdminUserWishlistListResponse
from app.models.enums.http_status import HTTPStatus
from app.utils.admin_search import admin_search_objects
from app.utils.admin_user_cart_search import _transform_user_cart_simple
from app.utils.admin_user_wishlist_search import _transform_user_wishlist_simple
from app.config.database import db_manager

router = APIRouter(tags=["admin-search"])


@router.get("/admin/products/search", response_model=ProductListResponse)
async def search_products_admin(
    currentAdmin: Annotated[UserModel, Depends(admin_required)],
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    filters: str = Query("", description="JSON string of filters object"),
    sorts: str = Query("", description="JSON string of sorts array")
):
    """
    Advanced admin product search with flexible filtering.
    
    Filters format: {"id": 123, "name": "mouse", "price": [10, 50], "category": "ELECTRONICS"}
    Sorts format: [{"field": "name", "direction": "asc"}]
    """
    # Parse JSON filters and sorts
    try:
        parsed_filters = json.loads(filters) if filters else {}
        parsed_sorts = json.loads(sorts) if sorts else []
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST.value, 
            detail="Invalid JSON format in filters or sorts"
        )
    
    # Define allowed fields for products
    allowed_fields = [
        "id", "code", "name", "description", "image", "category", 
        "price", "quantity", "internalReference", "shellId", 
        "inventoryStatus", "rating", "createdAt", "updatedAt"
    ]
    
    try:
        # Use generic admin search utility
        result = await admin_search_objects(
            collection_name="products",
            page=page,
            limit=limit,
            filters=parsed_filters,
            sorts=parsed_sorts,
            allowed_fields=allowed_fields
        )
        
        # Convert to ProductListResponse format
        products = []
        for item in result["items"]:
            # Remove MongoDB _id field
            if "_id" in item:
                del item["_id"]
            products.append(item)
        
        return ProductListResponse(
            products=products,
            total=result["total"],
            page=result["page"],
            limit=result["limit"],
            totalPages=result["totalPages"],
            hasNext=result["hasNext"],
            hasPrev=result["hasPrev"]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR.value,
            detail=f"Failed to search products: {str(e)}"
        )


@router.get("/admin/users/search", response_model=UserListResponse)
async def search_users_admin(
    currentAdmin: Annotated[UserModel, Depends(admin_required)],
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    filters: str = Query("", description="JSON string of filters object"),
    sorts: str = Query("", description="JSON string of sorts array")
):
    """
    Advanced admin user search with flexible filtering.
    
    Note: This endpoint automatically excludes admin users (isAdmin=true) 
    from search results to separate regular user management from admin management.
    
    Filters format: {"id": 123, "username": "john", "email": "user@example.com", "isActive": true}
    Sorts format: [{"field": "username", "direction": "asc"}]
    """
    # Parse JSON filters and sorts
    try:
        parsed_filters = json.loads(filters) if filters else {}
        parsed_sorts = json.loads(sorts) if sorts else []
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST.value, 
            detail="Invalid JSON format in filters or sorts"
        )
    
    # Define allowed fields for users (exclude sensitive fields)
    allowed_fields = [
        "id", "username", "email", "isActive", "isAdmin", "createdAt", "updatedAt"
    ]
    
    try:
        # Add filter to exclude admin users from regular user management
        # Admin users should only be managed through special admin management endpoints
        if "isAdmin" not in parsed_filters:
            parsed_filters["isAdmin"] = False
        
        # Use generic admin search utility
        result = await admin_search_objects(
            collection_name="users",
            page=page,
            limit=limit,
            filters=parsed_filters,
            sorts=parsed_sorts,
            allowed_fields=allowed_fields
        )
        
        # Remove sensitive fields from results
        sanitized_items = []
        for item in result["items"]:
            # Remove MongoDB _id and sensitive fields
            if "_id" in item:
                del item["_id"]
            if "hashedPassword" in item:
                del item["hashedPassword"]
            sanitized_items.append(item)
        
        return UserListResponse(
            users=sanitized_items,
            total=result["total"],
            page=result["page"],
            limit=result["limit"],
            totalPages=result["totalPages"],
            hasNext=result["hasNext"],
            hasPrev=result["hasPrev"]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR.value,
            detail=f"Failed to search users: {str(e)}"
        )


@router.get("/admin/cart/search", response_model=AdminUserCartListResponse)
async def search_cart_admin(
    currentAdmin: Annotated[UserModel, Depends(admin_required)],
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    filters: str = Query("", description="JSON string of filters object"),
    sorts: str = Query("", description="JSON string of sorts array")
):
    """
    Enhanced admin user cart search with user information and product details.
    
    Uses the same generic search utility as products and users for consistency.
    Automatically excludes admin users (isAdmin=true) from results.
    
    Filters format: {"search": "john", "userId": 123, "isActive": true}
    Sorts format: [{"field": "username", "direction": "asc"}]
    
    Available search fields: username, email, firstname (via global search)
    Available filter fields: id, username, email, firstname, isActive, cartTotalValue, createdAt, updatedAt
    Available sort fields: id, username, email, firstname, isActive, cartTotalValue, createdAt, updatedAt
    """
    # Parse JSON filters and sorts
    try:
        parsed_filters = json.loads(filters) if filters else {}
        parsed_sorts = json.loads(sorts) if sorts else []
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST.value, 
            detail="Invalid JSON format in filters or sorts"
        )
    
    # Separate user fields from cart-specific fields
    user_fields = ["id", "username", "email", "firstname", "isActive", "isAdmin", "createdAt", "updatedAt"]
    cart_fields = ["cartTotalValue"]
    
    # Split filters into user and cart categories
    user_filters = {k: v for k, v in parsed_filters.items() if k in user_fields or k == "search"}
    cart_filters = {k: v for k, v in parsed_filters.items() if k in cart_fields}
    
    # Split sorts into user and cart categories
    user_sorts = [s for s in parsed_sorts if s.get("field") in user_fields]
    cart_sorts = [s for s in parsed_sorts if s.get("field") in cart_fields]
    
    try:
        # Add filter to exclude admin users
        if "isAdmin" not in user_filters:
            user_filters["isAdmin"] = False
        
        # First, search users with user-specific filters and sorts
        result = await admin_search_objects(
            collection_name="users",
            page=page,
            limit=limit,
            filters=user_filters,
            sorts=user_sorts,
            allowed_fields=user_fields
        )
        
        # Transform user results to cart format by adding cart information
        enhanced_user_carts = []
        carts_collection = db_manager.get_collection("carts")
        
        for user_doc in result["items"]:
            # Get user's cart
            cart_doc = await carts_collection.find_one({"userId": user_doc["id"]})
            
            if cart_doc:
                # Transform to cart format with user info
                enhanced_user_cart = await _transform_user_cart_simple(cart_doc, user_doc)
                enhanced_user_carts.append(enhanced_user_cart)
            else:
                # User has no cart, create empty cart entry
                from app.schemas.admin_user_cart import AdminUserCartData
                empty_cart = AdminUserCartData(
                    id=user_doc["id"],
                    username=user_doc.get("username", f"User {user_doc['id']}"),
                    email=user_doc.get("email", f"user{user_doc['id']}@example.com"),
                    firstname=user_doc.get("firstname"),
                    isActive=user_doc.get("isActive", True),
                    cart=[],
                    cartTotalValue=0.0
                )
                enhanced_user_carts.append(empty_cart)
        
        # Apply cart-specific filters
        if cart_filters:
            filtered_carts = []
            for cart_data in enhanced_user_carts:
                include_cart = True
                
                for field, value in cart_filters.items():
                    if field == "cartTotalValue":
                        cart_total = cart_data.cartTotalValue
                        if isinstance(value, list) and len(value) == 2:
                            # Range filter [min, max]
                            min_val, max_val = value
                            if cart_total < min_val or cart_total > max_val:
                                include_cart = False
                                break
                        elif isinstance(value, (int, float)):
                            # Exact match
                            if cart_total != value:
                                include_cart = False
                                break
                
                if include_cart:
                    filtered_carts.append(cart_data)
            
            enhanced_user_carts = filtered_carts
        
        # Apply cart-specific sorting
        if cart_sorts:
            for sort_config in reversed(cart_sorts):  # Apply in reverse order for stable sorting
                field = sort_config.get("field")
                direction = sort_config.get("direction", "asc")
                
                if field == "cartTotalValue":
                    enhanced_user_carts.sort(
                        key=lambda x: x.cartTotalValue,
                        reverse=(direction == "desc")
                    )
        
        # Update pagination info based on filtered results
        total_filtered = len(enhanced_user_carts)
        
        return AdminUserCartListResponse(
            items=enhanced_user_carts,
            total=total_filtered,
            page=page,
            limit=limit,
            totalPages=(total_filtered + limit - 1) // limit,
            hasNext=page * limit < total_filtered,
            hasPrev=page > 1
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR.value,
            detail=f"Failed to search user carts: {str(e)}"
        )


@router.get("/admin/wishlist/search", response_model=AdminUserWishlistListResponse)
async def search_wishlist_admin(
    currentAdmin: Annotated[UserModel, Depends(admin_required)],
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    filters: str = Query("", description="JSON string of filters object"),
    sorts: str = Query("", description="JSON string of sorts array")
):
    """
    Enhanced admin user wishlist search with user information and product details.
    
    Uses the same generic search utility as products and users for consistency.
    Automatically excludes admin users (isAdmin=true) from results.
    
    Filters format: {"search": "john", "userId": 123, "isActive": true}
    Sorts format: [{"field": "username", "direction": "asc"}]
    
    Available search fields: username, email, firstname (via global search)
    Available filter fields: id, username, email, firstname, isActive, wishlistItemCount, createdAt, updatedAt
    Available sort fields: id, username, email, firstname, isActive, wishlistItemCount, createdAt, updatedAt
    """
    # Parse JSON filters and sorts
    try:
        parsed_filters = json.loads(filters) if filters else {}
        parsed_sorts = json.loads(sorts) if sorts else []
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST.value, 
            detail="Invalid JSON format in filters or sorts"
        )
    
    # Separate user fields from wishlist-specific fields
    user_fields = ["id", "username", "email", "firstname", "isActive", "isAdmin", "createdAt", "updatedAt"]
    wishlist_fields = ["wishlistItemCount"]
    
    # Split filters into user and wishlist categories
    user_filters = {k: v for k, v in parsed_filters.items() if k in user_fields or k == "search"}
    wishlist_filters = {k: v for k, v in parsed_filters.items() if k in wishlist_fields}
    
    # Split sorts into user and wishlist categories
    user_sorts = [s for s in parsed_sorts if s.get("field") in user_fields]
    wishlist_sorts = [s for s in parsed_sorts if s.get("field") in wishlist_fields]
    
    try:
        # Add filter to exclude admin users
        if "isAdmin" not in user_filters:
            user_filters["isAdmin"] = False
        
        # First, search users with user-specific filters and sorts
        result = await admin_search_objects(
            collection_name="users",
            page=page,
            limit=limit,
            filters=user_filters,
            sorts=user_sorts,
            allowed_fields=user_fields
        )
        
        # Transform user results to wishlist format by adding wishlist information
        enhanced_user_wishlists = []
        wishlists_collection = db_manager.get_collection("wishlists")
        
        for user_doc in result["items"]:
            # Get user's wishlist
            wishlist_doc = await wishlists_collection.find_one({"userId": user_doc["id"]})
            
            if wishlist_doc:
                # Transform to wishlist format with user info
                enhanced_user_wishlist = await _transform_user_wishlist_simple(wishlist_doc, user_doc)
                enhanced_user_wishlists.append(enhanced_user_wishlist)
            else:
                # User has no wishlist, create empty wishlist entry
                from app.schemas.admin_user_wishlist import AdminUserWishlistData
                empty_wishlist = AdminUserWishlistData(
                    id=user_doc["id"],
                    username=user_doc.get("username", f"User {user_doc['id']}"),
                    email=user_doc.get("email", f"user{user_doc['id']}@example.com"),
                    firstname=user_doc.get("firstname"),
                    isActive=user_doc.get("isActive", True),
                    wishlist=[],
                    wishlistItemCount=0
                )
                enhanced_user_wishlists.append(empty_wishlist)
        
        # Apply wishlist-specific filters
        if wishlist_filters:
            filtered_wishlists = []
            for wishlist_data in enhanced_user_wishlists:
                match = True
                for field, value in wishlist_filters.items():
                    if field == "wishlistItemCount":
                        if isinstance(value, list) and len(value) == 2:
                            # Range filter [min, max]
                            if not (value[0] <= wishlist_data.wishlistItemCount <= value[1]):
                                match = False
                                break
                        elif isinstance(value, (int, float)):
                            # Exact match
                            if wishlist_data.wishlistItemCount != value:
                                match = False
                                break
                
                if match:
                    filtered_wishlists.append(wishlist_data)
            
            enhanced_user_wishlists = filtered_wishlists
        
        # Apply wishlist-specific sorting
        if wishlist_sorts:
            for sort_config in reversed(wishlist_sorts):  # Apply in reverse order for stable sorting
                field = sort_config.get("field")
                direction = sort_config.get("direction", "asc")
                reverse = direction.lower() == "desc"
                
                if field == "wishlistItemCount":
                    enhanced_user_wishlists.sort(key=lambda x: x.wishlistItemCount, reverse=reverse)
        
        # Update pagination info based on filtered results
        total_filtered = len(enhanced_user_wishlists)
        
        return AdminUserWishlistListResponse(
            items=enhanced_user_wishlists,
            total=total_filtered,
            page=page,
            limit=limit,
            totalPages=(total_filtered + limit - 1) // limit,
            hasNext=page * limit < total_filtered,
            hasPrev=page > 1
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR.value,
            detail=f"Failed to search user wishlists: {str(e)}"
        )


@router.get("/admin/contacts/search", response_model=ContactSubmissionsResponse)
async def search_contact_submissions_admin(
    currentAdmin: Annotated[UserModel, Depends(admin_required)],
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    filters: str = Query("", description="JSON string of filters object"),
    sorts: str = Query("", description="JSON string of sorts array")
) -> ContactSubmissionsResponse:
    """
    Advanced admin contact submissions search with flexible filtering.
    
    Filters format: {"email": "user@example.com", "status": "PENDING", "message": "help", "userId": 123}
    Sorts format: [{"field": "createdAt", "direction": "desc"}]
    """
    # Parse JSON filters and sorts
    try:
        parsed_filters = json.loads(filters) if filters else {}
        parsed_sorts = json.loads(sorts) if sorts else []
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST.value, 
            detail="Invalid JSON format in filters or sorts"
        )
    
    # Define allowed fields for contacts
    allowed_fields = [
        "id", "email", "message", "userId", "status", 
        "createdAt", "updatedAt", "messageId", "errorMessage", "adminNotes"
    ]
    
    try:
        # Use generic admin search utility
        result = await admin_search_objects(
            collection_name="contacts",
            page=page,
            limit=limit,
            filters=parsed_filters,
            sorts=parsed_sorts,
            allowed_fields=allowed_fields
        )
        
        # Convert to ContactSubmissionsResponse format
        submissions = []
        for item in result["items"]:
            # Remove MongoDB _id field
            if "_id" in item:
                del item["_id"]
            submissions.append(item)
        
        return ContactSubmissionsResponse(
            submissions=submissions,
            total=result["total"],
            skip=(result["page"] - 1) * result["limit"],
            limit=result["limit"]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR.value,
            detail=f"Failed to search contact submissions: {str(e)}"
        )
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST.value, 
            detail="Invalid JSON format in filters or sorts"
        )
    
    # Define allowed fields for contacts
    allowed_fields = [
        "id", "email", "message", "userId", "status", 
        "createdAt", "updatedAt", "messageId", "errorMessage", "adminNotes"
    ]
    
    try:
        # Use generic admin search utility
        result = await admin_search_objects(
            collection_name="contacts",
            page=page,
            limit=limit,
            filters=parsed_filters,
            sorts=parsed_sorts,
            allowed_fields=allowed_fields
        )
        
        # Convert to ContactSubmissionsResponse format
        submissions = []
        for item in result["items"]:
            # Remove MongoDB _id field
            if "_id" in item:
                del item["_id"]
            submissions.append(item)
        
        return ContactSubmissionsResponse(
            submissions=submissions,
            total=result["total"],
            skip=(result["page"] - 1) * result["limit"],
            limit=result["limit"]
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR.value,
            detail=f"Failed to search contact submissions: {str(e)}"
        )

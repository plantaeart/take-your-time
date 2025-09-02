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
from app.models.enums.http_status import HTTPStatus
from app.utils.admin_search import admin_search_objects

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


@router.get("/admin/cart/search")
async def search_cart_admin(
    currentAdmin: Annotated[UserModel, Depends(admin_required)],
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    filters: str = Query("", description="JSON string of filters object"),
    sorts: str = Query("", description="JSON string of sorts array")
):
    """
    Advanced admin cart search with flexible filtering.
    
    Filters format: {"userId": 123, "createdAt": ["2024-01-01", "2024-12-31"]}
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
    
    # Define allowed fields for cart
    allowed_fields = [
        "userId", "items", "createdAt", "updatedAt"
    ]
    
    try:
        # Use generic admin search utility
        result = await admin_search_objects(
            collection_name="carts",
            page=page,
            limit=limit,
            filters=parsed_filters,
            sorts=parsed_sorts,
            allowed_fields=allowed_fields
        )
        
        # Remove MongoDB _id field
        sanitized_items = []
        for item in result["items"]:
            if "_id" in item:
                del item["_id"]
            sanitized_items.append(item)
        
        return {
            "carts": sanitized_items,
            "total": result["total"],
            "page": result["page"],
            "limit": result["limit"],
            "totalPages": result["totalPages"],
            "hasNext": result["hasNext"],
            "hasPrev": result["hasPrev"]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR.value,
            detail=f"Failed to search carts: {str(e)}"
        )


@router.get("/admin/wishlist/search")
async def search_wishlist_admin(
    currentAdmin: Annotated[UserModel, Depends(admin_required)],
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    filters: str = Query("", description="JSON string of filters object"),
    sorts: str = Query("", description="JSON string of sorts array")
):
    """
    Advanced admin wishlist search with flexible filtering.
    
    Filters format: {"userId": 123, "createdAt": ["2024-01-01", "2024-12-31"]}
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
    
    # Define allowed fields for wishlist
    allowed_fields = [
        "userId", "items", "createdAt", "updatedAt"
    ]
    
    try:
        # Use generic admin search utility
        result = await admin_search_objects(
            collection_name="wishlists",
            page=page,
            limit=limit,
            filters=parsed_filters,
            sorts=parsed_sorts,
            allowed_fields=allowed_fields
        )
        
        # Remove MongoDB _id field
        sanitized_items = []
        for item in result["items"]:
            if "_id" in item:
                del item["_id"]
            sanitized_items.append(item)
        
        return {
            "wishlists": sanitized_items,
            "total": result["total"],
            "page": result["page"],
            "limit": result["limit"],
            "totalPages": result["totalPages"],
            "hasNext": result["hasNext"],
            "hasPrev": result["hasPrev"]
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR.value,
            detail=f"Failed to search wishlists: {str(e)}"
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

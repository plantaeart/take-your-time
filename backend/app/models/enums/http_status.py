"""
Centralized HTTP status codes for consistent API responses.

This module provides a centralized way to manage HTTP status codes used throughout
the application, ensuring consistency and making it easier to maintain status code
usage across all routes.
"""
from enum import Enum


class HTTPStatus(Enum):
    """
    HTTP status codes used throughout the application.
    
    This enum centralizes all HTTP status codes to ensure consistency
    and make it easier to maintain and update status codes across the application.
    """
    
    # 2xx Success Status Codes
    OK = 200
    CREATED = 201
    NO_CONTENT = 204
    
    # 4xx Client Error Status Codes
    BAD_REQUEST = 400
    UNAUTHORIZED = 401
    FORBIDDEN = 403
    NOT_FOUND = 404
    METHOD_NOT_ALLOWED = 405
    CONFLICT = 409
    UNPROCESSABLE_ENTITY = 422
    
    # 5xx Server Error Status Codes
    INTERNAL_SERVER_ERROR = 500
    NOT_IMPLEMENTED = 501
    BAD_GATEWAY = 502
    SERVICE_UNAVAILABLE = 503


class AuthHTTPStatus(Enum):
    """Authentication-specific HTTP status codes."""
    UNAUTHORIZED = 401
    FORBIDDEN = 403
    TOKEN_EXPIRED = 401
    INVALID_CREDENTIALS = 401


class ProductHTTPStatus(Enum):
    """Product-specific HTTP status codes."""
    PRODUCT_NOT_FOUND = 404
    PRODUCT_CREATED = 201
    PRODUCT_UPDATED = 200
    PRODUCT_DELETED = 200
    INVALID_PRODUCT_DATA = 400
    PRODUCT_CONFLICT = 409


class UserHTTPStatus(Enum):
    """User-specific HTTP status codes."""
    USER_NOT_FOUND = 404
    USER_CREATED = 201
    USER_UPDATED = 200
    USER_DELETED = 200
    USER_DEACTIVATED = 200
    USER_ACTIVATED = 200
    INVALID_USER_DATA = 400
    USER_CONFLICT = 409
    CANNOT_MODIFY_SELF = 400


class CartHTTPStatus(Enum):
    """Cart-specific HTTP status codes."""
    CART_ITEM_ADDED = 201
    CART_ITEM_UPDATED = 200
    CART_ITEM_REMOVED = 200
    CART_CLEARED = 200
    CART_NOT_FOUND = 404
    ITEM_NOT_IN_CART = 404
    INSUFFICIENT_STOCK = 400
    INVALID_QUANTITY = 400


class WishlistHTTPStatus(Enum):
    """Wishlist-specific HTTP status codes."""
    WISHLIST_ITEM_ADDED = 201
    WISHLIST_ITEM_REMOVED = 200
    WISHLIST_CLEARED = 200
    WISHLIST_NOT_FOUND = 404
    ITEM_NOT_IN_WISHLIST = 404
    ITEM_ALREADY_IN_WISHLIST = 400


# Utility functions for easy access
def get_status_code(status_enum) -> int:
    """
    Extract the integer status code from an enum value.
    
    Args:
        status_enum: An enum value from any of the status classes
        
    Returns:
        int: The HTTP status code
        
    Example:
        status_code = get_status_code(HTTPStatus.NOT_FOUND)  # Returns 404
    """
    return status_enum.value


def get_fastapi_status(status_enum):
    """
    Get the FastAPI status code object for the given status enum.
    
    This function can be used to get the appropriate status code for FastAPI
    responses while maintaining centralized status code management.
    
    Args:
        status_enum: An enum value from any of the status classes
        
    Returns:
        int: The HTTP status code for use with FastAPI
        
    Example:
        from fastapi import HTTPException
        raise HTTPException(
            status_code=get_fastapi_status(HTTPStatus.NOT_FOUND),
            detail="Resource not found"
        )
    """
    return status_enum.value


# Common status code combinations for quick access
class CommonStatusCodes:
    """Commonly used status code combinations for quick access."""
    
    # Success responses
    SUCCESS_OK = HTTPStatus.OK.value
    SUCCESS_CREATED = HTTPStatus.CREATED.value
    SUCCESS_NO_CONTENT = HTTPStatus.NO_CONTENT.value
    
    # Error responses
    ERROR_BAD_REQUEST = HTTPStatus.BAD_REQUEST.value
    ERROR_UNAUTHORIZED = HTTPStatus.UNAUTHORIZED.value
    ERROR_FORBIDDEN = HTTPStatus.FORBIDDEN.value
    ERROR_NOT_FOUND = HTTPStatus.NOT_FOUND.value
    ERROR_CONFLICT = HTTPStatus.CONFLICT.value
    ERROR_UNPROCESSABLE = HTTPStatus.UNPROCESSABLE_ENTITY.value
    ERROR_INTERNAL = HTTPStatus.INTERNAL_SERVER_ERROR.value

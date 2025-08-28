"""
Centralized error messages and warnings using enums for consistency.
"""
from enum import Enum


class AuthErrorMessages(Enum):
    """Authentication related error messages."""
    INVALID_CREDENTIALS = "Could not validate credentials"
    INCORRECT_EMAIL_PASSWORD = "Incorrect email or password"
    TOKEN_INVALIDATED = "Token has been invalidated"
    INACTIVE_USER = "Inactive user"
    ADMIN_ACCESS_REQUIRED = "Admin access required. Only administrators can perform this action."
    LEGACY_ADMIN_ACCESS_REQUIRED = "Admin access required"
    LOGOUT_FAILED = "Failed to logout user"
    LOGOUT_ALL_DEVICES_FAILED = "Failed to logout from all devices"
    BLACKLIST_CLEANUP_FAILED = "Failed to cleanup blacklist"


class UserErrorMessages(Enum):
    """User management related error messages."""
    USER_NOT_FOUND = "User not found"
    EMAIL_ALREADY_REGISTERED = "Email already registered"
    USERNAME_ALREADY_TAKEN = "Username already taken"
    CANNOT_DELETE_OWN_ACCOUNT = "Cannot delete your own account"
    CANNOT_DEACTIVATE_OWN_ACCOUNT = "Cannot deactivate your own account"
    ADMIN_SELF_MANAGEMENT_FORBIDDEN = "Administrators cannot manage their own account through user management endpoints"


class ProductErrorMessages(Enum):
    """Product management related error messages."""
    PRODUCT_NOT_FOUND = "Product not found"
    OUT_OF_STOCK = "Product '{productName}' is out of stock"
    INSUFFICIENT_STOCK = "Cannot add {requestedQuantity} items. Only {availableQuantity} items available (you already have {cartQuantity} in cart, stock: {stockQuantity})"
    INSUFFICIENT_STOCK_UPDATE = "Cannot update to {requestedQuantity} items. Only {stockQuantity} items available in stock"
    FAILED_TO_GENERATE_CODE = "Failed to generate unique product code"
    PRODUCT_CODE_EXISTS = "Product with this code already exists"
    FAILED_TO_GENERATE_REFERENCE = "Failed to generate unique internal reference"
    PRODUCT_REFERENCE_EXISTS = "Product with this internal reference already exists"
    PRODUCT_DUPLICATE = "Product with this code or internal reference already exists"
    FAILED_TO_CREATE = "Failed to create product: {error}"
    NO_UPDATE_DATA = "No data provided for update"
    FAILED_TO_UPDATE = "Failed to update product: {error}"
    FAILED_TO_DELETE = "Failed to delete product: {error}"
    NEGATIVE_QUANTITY = "Quantity cannot be negative"
    FAILED_TO_UPDATE_INVENTORY = "Failed to update inventory: {error}"


class CartErrorMessages(Enum):
    """Shopping cart related error messages."""
    ITEM_NOT_FOUND_IN_CART = "Item not found in cart"
    USER_CART_NOT_FOUND = "User cart not found"


class WishlistErrorMessages(Enum):
    """Wishlist related error messages."""
    ITEM_NOT_FOUND_IN_WISHLIST = "Item not found in wishlist"
    USER_WISHLIST_NOT_FOUND = "User wishlist not found"
    PRODUCT_ALREADY_IN_WISHLIST = "Product already in wishlist"


class SuccessMessages(Enum):
    """Success messages for various operations."""
    # Authentication
    LOGOUT_SUCCESS = "Successfully logged out"
    LOGOUT_TOKEN_BLACKLISTED = "Token has been invalidated and added to blacklist"
    LOGOUT_ALL_DEVICES_SUCCESS = "Successfully logged out from all devices"
    LOGOUT_ALL_DEVICES_DETAIL = "All tokens for this user have been invalidated"
    BLACKLIST_CLEANUP_SUCCESS = "Blacklist cleanup completed"
    
    # User Management
    USER_ACTIVATED = "User {userId} activated successfully"
    USER_DEACTIVATED = "User {userId} deactivated successfully"
    USER_DELETED = "User {userId} and all associated data deleted successfully"
    
    # Cart Operations
    ITEM_ADDED_TO_CART = "Item added to cart successfully"
    CART_ITEM_UPDATED = "Cart item updated successfully"
    ITEM_REMOVED_FROM_CART = "Item removed from cart successfully"
    CART_CLEARED = "Cart cleared successfully"
    
    # Wishlist Operations
    ITEM_ADDED_TO_WISHLIST = "Item added to wishlist successfully"
    ITEM_REMOVED_FROM_WISHLIST = "Item removed from wishlist successfully"
    WISHLIST_CLEARED = "Wishlist cleared successfully"
    
    # Product Operations
    PRODUCT_CREATED = "Product created successfully"
    PRODUCT_UPDATED = "Product updated successfully"
    PRODUCT_DELETED = "Product deleted successfully"
    
    # Admin Operations
    ITEM_ADDED_TO_USER_CART = "Item added to user's cart successfully"
    ITEM_REMOVED_FROM_USER_CART = "Item removed from user's cart successfully"
    USER_CART_CLEARED = "User's cart cleared successfully"
    ITEM_ADDED_TO_USER_WISHLIST = "Item added to user's wishlist successfully"
    ITEM_REMOVED_FROM_USER_WISHLIST = "Item removed from user's wishlist successfully"
    USER_WISHLIST_CLEARED = "User's wishlist cleared successfully"


class HTTPErrorMessages(Enum):
    """Standard HTTP error messages."""
    INTERNAL_SERVER_ERROR = "Internal server error"
    BAD_REQUEST = "Bad request"
    UNAUTHORIZED = "Unauthorized"
    FORBIDDEN = "Forbidden"
    NOT_FOUND = "Not found"
    CONFLICT = "Conflict"
    UNPROCESSABLE_ENTITY = "Unprocessable entity"


class ValidationMessages(Enum):
    """Data validation messages."""
    INVALID_EMAIL_FORMAT = "Invalid email format"
    PASSWORD_TOO_SHORT = "Password must be at least 6 characters long"
    USERNAME_TOO_SHORT = "Username must be at least 3 characters long"
    USERNAME_TOO_LONG = "Username cannot exceed 50 characters"
    FIRSTNAME_REQUIRED = "First name is required"
    FIRSTNAME_TOO_LONG = "First name cannot exceed 100 characters"
    INVALID_QUANTITY = "Quantity must be greater than 0"
    INVALID_PRICE = "Price must be greater than or equal to 0"
    INVALID_RATING = "Rating must be between 0 and 5"


class SystemMessages(Enum):
    """System and application messages."""
    HEALTH_CHECK = "Take Your Time Product API is running"
    STARTUP_SUCCESS = "Take Your Time API started successfully"
    SHUTDOWN_SUCCESS = "Take Your Time API shut down successfully"
    DATABASE_CONNECTED = "Database connected successfully"
    DATABASE_DISCONNECTED = "Disconnected from MongoDB"
    DATABASE_CONNECTION_FAILED = "Database connection failed"
    
    
def format_message(messageEnum: Enum, **kwargs) -> str:
    """
    Format a message enum with dynamic values.
    
    Args:
        messageEnum: The enum message to format
        **kwargs: Values to substitute in the message
        
    Returns:
        Formatted message string
        
    Example:
        format_message(ProductErrorMessages.OUT_OF_STOCK, productName="iPhone")
        # Returns: "Product 'iPhone' is out of stock"
    """
    message = messageEnum.value
    if kwargs:
        try:
            return message.format(**kwargs)
        except KeyError as e:
            # If formatting fails, return the original message
            return f"{message} (formatting error: missing {e})"
    return message


def get_error_detail(messageEnum: Enum, **kwargs) -> dict:
    """
    Get error detail dictionary for HTTPException.
    
    Args:
        messageEnum: The enum message
        **kwargs: Values to substitute in the message
        
    Returns:
        Dictionary with detail key for HTTPException
        
    Example:
        get_error_detail(UserErrorMessages.USER_NOT_FOUND)
        # Returns: {"detail": "User not found"}
    """
    return {"detail": format_message(messageEnum, **kwargs)}


def get_success_response(messageEnum: Enum, **kwargs) -> dict:
    """
    Get success response dictionary.
    
    Args:
        messageEnum: The enum message
        **kwargs: Values to substitute in the message
        
    Returns:
        Dictionary with message key for success responses
        
    Example:
        get_success_response(SuccessMessages.USER_ACTIVATED, userId=123)
        # Returns: {"message": "User 123 activated successfully"}
    """
    return {"message": format_message(messageEnum, **kwargs)}

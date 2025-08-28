"""
Authentication dependencies for FastAPI.
"""
from datetime import datetime
from typing import Annotated, Optional, Dict, Any
from pymongo.collection import Collection
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from app.auth.jwt import get_token_subject, decode_token
from app.auth.blacklist import is_token_blacklisted, is_user_tokens_invalidated
from app.config.database import db_manager
from app.models.user import UserModel
from app.models.enums.messages import AuthErrorMessages

# OAuth2 scheme for token authentication
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")


async def get_user_by_email(email: str) -> Optional[UserModel]:
    """Get a user by email from the database."""
    collection: Collection = db_manager.get_collection("users")
    userDoc: Optional[Dict[str, Any]] = await collection.find_one({"email": email})
    
    if userDoc:
        return UserModel(**userDoc)
    return None


async def get_user_by_username(username: str) -> Optional[UserModel]:
    """Get a user by username from the database."""
    collection: Collection = db_manager.get_collection("users")
    userDoc: Optional[Dict[str, Any]] = await collection.find_one({"username": username})
    
    if userDoc:
        return UserModel(**userDoc)
    return None


async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> UserModel:
    """Get the current authenticated user from JWT token."""
    credentialsException: HTTPException = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=AuthErrorMessages.INVALID_CREDENTIALS.value,
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        # Check if token is blacklisted
        if await is_token_blacklisted(token):
            raise credentialsException
        
        # Extract username from token
        username: Optional[str] = get_token_subject(token)
        if username is None:
            raise credentialsException
        
        # Get user from database
        user: Optional[UserModel] = await get_user_by_username(username)
        if user is None:
            raise credentialsException
        
        return user
        
    except HTTPException:
        raise
    except Exception:
        raise credentialsException


async def get_current_active_user(
    currentUser: Annotated[UserModel, Depends(get_current_user)]
) -> UserModel:
    """Get the current authenticated and active user."""
    if not currentUser.isActive:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail=AuthErrorMessages.INACTIVE_USER.value
        )
    return currentUser


async def admin_required(
    currentUser: Annotated[UserModel, Depends(get_current_active_user)]
) -> UserModel:
    """Require admin privileges - checks the isAdmin flag."""
    if not currentUser.isAdmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=AuthErrorMessages.ADMIN_ACCESS_REQUIRED.value
        )
    return currentUser


# Legacy admin check for backwards compatibility (email-based)
async def legacy_admin_required(
    currentUser: Annotated[UserModel, Depends(get_current_active_user)]
) -> UserModel:
    """Legacy admin check using email (for backwards compatibility)."""
    if currentUser.email != "admin@admin.com" and not currentUser.isAdmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=AuthErrorMessages.LEGACY_ADMIN_ACCESS_REQUIRED.value
        )
    return currentUser

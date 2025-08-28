"""
Authentication routes for user registration and login.
"""
from datetime import timedelta
from typing import Annotated, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.collection import Collection
from fastapi.security import OAuth2PasswordRequestForm
from app.auth.password import verify_password, get_password_hash
from app.auth.jwt import create_access_token
from app.auth.dependencies import get_user_by_email, get_user_by_username, get_current_active_user, oauth2_scheme
from app.auth.blacklist import add_token_to_blacklist, blacklist_all_user_tokens, cleanup_expired_blacklist_tokens
from app.config.database import db_manager
from app.config.settings import get_settings
from app.models.user import UserModel, get_next_user_id
from app.models.enums.http_status import HTTPStatus, AuthHTTPStatus
from app.schemas.auth import Token, LoginRequest
from app.schemas.user import UserCreate, UserResponse
from app.models.enums.messages import AuthErrorMessages, UserErrorMessages, SuccessMessages, format_message

router = APIRouter(tags=["auth"])


async def authenticate_user(email: str, password: str) -> UserModel | None:
    """Authenticate a user by email and password."""
    user: Optional[UserModel] = await get_user_by_email(email)
    if not user:
        return None
    if not verify_password(password, user.hashedPassword):
        return None
    return user


@router.post("/account", response_model=UserResponse, status_code=HTTPStatus.CREATED.value)
async def create_account(userData: UserCreate):
    """Create a new user account."""
    collection: Collection = db_manager.get_collection("users")
    
    # Check if user already exists
    existingUserEmail: Optional[Dict[str, Any]] = await collection.find_one({"email": userData.email})
    if existingUserEmail:
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST.value,
            detail=UserErrorMessages.EMAIL_ALREADY_REGISTERED.value
        )
    
    existingUserUsername: Optional[Dict[str, Any]] = await collection.find_one({"username": userData.username})
    if existingUserUsername:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=UserErrorMessages.USERNAME_ALREADY_TAKEN.value
        )
    
    # Hash password
    hashedPassword: str = get_password_hash(userData.password)
    
    # Create user
    user: UserModel = UserModel(
        id=await get_next_user_id(collection),
        username=userData.username,
        firstname=userData.firstname,
        email=userData.email,
        hashedPassword=hashedPassword,
        isActive=True,
        isAdmin=False  # Regular users are not admin by default
    )
    
    # Insert user into database
    await collection.insert_one(user.model_dump())
    
    return UserResponse(**user.model_dump())


@router.post("/token", response_model=Token)
async def login_for_access_token(
    formData: Annotated[OAuth2PasswordRequestForm, Depends()]
) -> Token:
    """Login endpoint using OAuth2 form (username/password) - supports email as username."""
    # OAuth2PasswordRequestForm uses 'username' field, but we'll treat it as email
    user: Optional[UserModel] = await authenticate_user(formData.username, formData.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=AuthErrorMessages.INCORRECT_EMAIL_PASSWORD.value,
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    settings = get_settings()
    accessTokenExpires: timedelta = timedelta(minutes=settings.access_token_expire_minutes)
    accessToken: str = create_access_token(
        data={"sub": user.username}, expiresDelta=accessTokenExpires
    )
    return Token(access_token=accessToken, token_type="bearer")


@router.post("/login", response_model=Token)
async def login_with_email(loginData: LoginRequest) -> Token:
    """Alternative login endpoint using email directly."""
    user: Optional[UserModel] = await authenticate_user(loginData.email, loginData.password)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=AuthErrorMessages.INCORRECT_EMAIL_PASSWORD.value,
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    settings = get_settings()
    accessTokenExpires: timedelta = timedelta(minutes=settings.access_token_expire_minutes)
    accessToken: str = create_access_token(
        data={"sub": user.username}, expiresDelta=accessTokenExpires
    )
    return Token(access_token=accessToken, token_type="bearer")


@router.get("/users/me", response_model=UserResponse)
async def read_users_me(
    currentUser: Annotated[UserModel, Depends(get_current_active_user)]
):
    """Get current user information."""
    return UserResponse(**currentUser.model_dump())


@router.post("/logout")
async def logout(
    currentUser: Annotated[UserModel, Depends(get_current_active_user)],
    token: Annotated[str, Depends(oauth2_scheme)]
):
    """
    Logout endpoint - invalidates the current token by adding it to blacklist.
    
    This provides immediate token invalidation for better security.
    """
    try:
        await add_token_to_blacklist(token, currentUser.id, "logout")
        return {
            "message": SuccessMessages.LOGOUT_SUCCESS.value,
            "detail": SuccessMessages.LOGOUT_TOKEN_BLACKLISTED.value
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=AuthErrorMessages.LOGOUT_FAILED.value
        )


@router.post("/logout-all-devices")
async def logout_all_devices(
    currentUser: Annotated[UserModel, Depends(get_current_active_user)]
):
    """
    Logout from all devices - invalidates all tokens for the current user.
    
    Useful for security incidents or password changes.
    """
    try:
        await blacklist_all_user_tokens(currentUser.id, "logout_all_devices")
        return {
            "message": SuccessMessages.LOGOUT_ALL_DEVICES_SUCCESS.value,
            "detail": SuccessMessages.LOGOUT_ALL_DEVICES_DETAIL.value
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=AuthErrorMessages.LOGOUT_ALL_DEVICES_FAILED.value
        )


@router.post("/admin/cleanup-blacklist")
async def cleanup_blacklist(
    currentUser: Annotated[UserModel, Depends(get_current_active_user)]
):
    """
    Admin endpoint to cleanup expired tokens from blacklist.
    
    This helps prevent database bloat by removing expired tokens.
    """
    # Check if user is admin
    if not currentUser.isAdmin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=AuthErrorMessages.ADMIN_ACCESS_REQUIRED.value
        )
    
    try:
        deletedCount: int = await cleanup_expired_blacklist_tokens()
        return {
            "message": SuccessMessages.BLACKLIST_CLEANUP_SUCCESS.value,
            "deleted_tokens": deletedCount
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=AuthErrorMessages.BLACKLIST_CLEANUP_FAILED.value
        )

"""
Token blacklist management utilities.
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from pymongo.collection import Collection
from app.config.database import db_manager
from app.models.token_blacklist import TokenBlacklistModel
import jwt
from app.config.settings import get_settings


async def add_token_to_blacklist(token: str, userId: int, reason: str = "logout") -> None:
    """
    Add a token to the blacklist.
    
    Args:
        token: JWT token to blacklist
        userId: ID of the user who owns the token
        reason: Reason for blacklisting
    """
    collection: Collection = db_manager.get_collection("token_blacklist")
    
    # Decode token to get expiration time
    settings = get_settings()
    try:
        payload: Dict[str, Any] = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        expiresAt: datetime = datetime.fromtimestamp(payload.get("exp", 0))
    except jwt.InvalidTokenError:
        # If token is invalid, set expiration to now + default time
        expiresAt = datetime.now() + timedelta(minutes=settings.access_token_expire_minutes)
    
    blacklistEntry: TokenBlacklistModel = TokenBlacklistModel(
        token=token,
        userId=userId,
        reason=reason,
        expiresAt=expiresAt
    )
    
    await collection.insert_one(blacklistEntry.model_dump())


async def is_token_blacklisted(token: str) -> bool:
    """
    Check if a token is blacklisted.
    
    Args:
        token: JWT token to check
        
    Returns:
        True if token is blacklisted, False otherwise
    """
    collection: Collection = db_manager.get_collection("token_blacklist")
    
    blacklistEntry: Optional[Dict[str, Any]] = await collection.find_one({"token": token})
    return blacklistEntry is not None


async def cleanup_expired_blacklist_tokens() -> int:
    """
    Remove expired tokens from blacklist to prevent database bloat.
    
    Returns:
        Number of tokens removed
    """
    collection: Collection = db_manager.get_collection("token_blacklist")
    
    result = await collection.delete_many({
        "expiresAt": {"$lt": datetime.now()}
    })
    
    return result.deleted_count


async def blacklist_all_user_tokens(userId: int, reason: str = "security") -> int:
    """
    Blacklist all active tokens for a specific user.
    Useful for security incidents or when user changes password.
    
    Args:
        userId: ID of the user
        reason: Reason for blacklisting
        
    Returns:
        Number of tokens blacklisted (this is a placeholder - in real implementation
        you'd need to track active tokens or use a different approach)
    """
    
    # For now, we'll just create a user-level blacklist entry
    collection: Collection = db_manager.get_collection("user_token_invalidation")
    
    invalidationEntry: Dict[str, Any] = {
        "userId": userId,
        "invalidatedAt": datetime.now(),
        "reason": reason
    }
    
    await collection.update_one(
        {"userId": userId},
        {"$set": invalidationEntry},
        upsert=True
    )
    
    return 1  # Placeholder return value


async def is_user_tokens_invalidated(userId: int, tokenIssuedAt: datetime) -> bool:
    """
    Check if user's tokens were invalidated after the token was issued.
    
    Args:
        userId: ID of the user
        tokenIssuedAt: When the token was issued
        
    Returns:
        True if tokens were invalidated after token issue time
    """
    collection: Collection = db_manager.get_collection("user_token_invalidation")
    
    invalidation: Optional[Dict[str, Any]] = await collection.find_one({"userId": userId})
    
    if not invalidation:
        return False
    
    invalidatedAt: Optional[datetime] = invalidation.get("invalidatedAt")
    return invalidatedAt and invalidatedAt > tokenIssuedAt

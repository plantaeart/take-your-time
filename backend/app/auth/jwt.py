"""
JWT token utilities for authentication.
"""
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
import jwt
from jwt.exceptions import InvalidTokenError
from app.config.settings import get_settings


def create_access_token(data: Dict[str, Any], expiresDelta: Optional[timedelta] = None) -> str:
    """Create a JWT access token."""
    settings = get_settings()
    toEncode: Dict[str, Any] = data.copy()
    
    now: datetime = datetime.now(timezone.utc)
    if expiresDelta:
        expire: datetime = now + expiresDelta
    else:
        expire = now + timedelta(minutes=settings.access_token_expire_minutes)
    
    toEncode.update({
        "exp": expire,
        "iat": now  # Issued at time
    })
    encodedJwt: str = jwt.encode(toEncode, settings.secret_key, algorithm=settings.algorithm)
    return encodedJwt


def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """Verify and decode a JWT token."""
    try:
        settings = get_settings()
        payload: Dict[str, Any] = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        return payload
    except InvalidTokenError:
        return None


def decode_token(token: str) -> Dict[str, Any]:
    """Decode a JWT token without verification (for extracting payload data)."""
    settings = get_settings()
    return jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])


def get_token_subject(token: str) -> Optional[str]:
    """Extract the subject (username) from a JWT token."""
    payload: Optional[Dict[str, Any]] = verify_token(token)
    if payload:
        return payload.get("sub")
    return None

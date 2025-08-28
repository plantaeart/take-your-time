"""
Password hashing utilities using bcrypt.
"""
from passlib.context import CryptContext

# Create PassLib context for password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plainPassword: str, hashedPassword: str) -> bool:
    """Verify a plain password against its hash."""
    return pwd_context.verify(plainPassword, hashedPassword)


def get_password_hash(password: str) -> str:
    """Hash a password using bcrypt."""
    return pwd_context.hash(password)

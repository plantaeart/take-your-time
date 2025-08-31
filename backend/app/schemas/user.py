"""
User schemas for request/response validation.
"""
from datetime import datetime
from typing import Optional, List
import re
from pydantic import BaseModel, EmailStr, Field, field_validator


class UserCreate(BaseModel):
    """Schema for creating a new user."""
    username: str = Field(..., min_length=3, max_length=50, description="Username for the user")
    firstname: str = Field(..., min_length=1, max_length=100, description="First name of the user")
    email: EmailStr = Field(..., description="Email address of the user")
    password: str = Field(..., min_length=8, description="Password for the user (min 8 chars, 1 uppercase, 2 special chars)")
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        """Validate password complexity requirements."""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        
        # Check for at least 1 uppercase letter
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least 1 uppercase letter')
        
        # Check for at least 1 special character
        special_chars = re.findall(r'[!@#$%^&*(),.?":{}|<>]', v)
        if len(special_chars) < 1:
            raise ValueError('Password must contain at least 1 special character (!@#$%^&*(),.?":{}|<>)')
        
        return v


class UserResponse(BaseModel):
    """Schema for user response (without sensitive data)."""
    id: int
    username: str
    firstname: str
    email: EmailStr
    isActive: bool
    isAdmin: bool
    createdAt: datetime
    updatedAt: datetime
    schemaVersion: int = Field(default=1, description="Schema version for database upgrade management")


class UserUpdate(BaseModel):
    """Schema for updating user information."""
    username: Optional[str] = Field(None, min_length=3, max_length=50, description="Username for the user")
    firstname: Optional[str] = Field(None, min_length=1, max_length=100, description="First name of the user")
    email: Optional[EmailStr] = Field(None, description="Email address of the user")
    password: Optional[str] = Field(None, min_length=8, description="New password for the user (min 8 chars, 1 uppercase, 2 special chars)")
    isActive: Optional[bool] = Field(None, description="Whether the user account is active")
    isAdmin: Optional[bool] = Field(None, description="Whether the user has admin privileges")
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: Optional[str]) -> Optional[str]:
        """Validate password complexity requirements."""
        if v is None:
            return v
            
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        
        # Check for at least 1 uppercase letter
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least 1 uppercase letter')
        
        # Check for at least 1 special character
        special_chars = re.findall(r'[!@#$%^&*(),.?":{}|<>]', v)
        if len(special_chars) < 1:
            raise ValueError('Password must contain at least 1 special character (!@#$%^&*(),.?":{}|<>)')
        
        return v


class UserInDB(UserResponse):
    """Schema for user data stored in database (includes hashed password)."""
    hashedPassword: str
    schemaVersion: int = Field(default=1, description="Schema version for database upgrade management")


class UserListResponse(BaseModel):
    """Schema for paginated user list responses."""
    users: List[UserResponse] = Field(..., description="List of users")
    total: int = Field(..., description="Total number of users")
    page: int = Field(..., description="Current page number")
    limit: int = Field(..., description="Number of users per page")
    totalPages: int = Field(..., description="Total number of pages")
    hasNext: bool = Field(..., description="Whether there are more pages")
    hasPrev: bool = Field(..., description="Whether there are previous pages")

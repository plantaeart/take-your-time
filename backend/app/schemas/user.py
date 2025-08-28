"""
User schemas for request/response validation.
"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """Schema for creating a new user."""
    username: str = Field(..., min_length=3, max_length=50, description="Username for the user")
    firstname: str = Field(..., min_length=1, max_length=100, description="First name of the user")
    email: EmailStr = Field(..., description="Email address of the user")
    password: str = Field(..., min_length=6, description="Password for the user")


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


class UserUpdate(BaseModel):
    """Schema for updating user information."""
    username: Optional[str] = Field(None, min_length=3, max_length=50, description="Username for the user")
    firstname: Optional[str] = Field(None, min_length=1, max_length=100, description="First name of the user")
    email: Optional[EmailStr] = Field(None, description="Email address of the user")
    password: Optional[str] = Field(None, min_length=6, description="New password for the user")
    isActive: Optional[bool] = Field(None, description="Whether the user account is active")
    isAdmin: Optional[bool] = Field(None, description="Whether the user has admin privileges")


class UserInDB(UserResponse):
    """Schema for user data stored in database (includes hashed password)."""
    hashedPassword: str

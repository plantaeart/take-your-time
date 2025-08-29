"""
User model for MongoDB.
"""
from datetime import datetime
from typing import Optional, Any
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_serializer
from pymongo import ASCENDING
import secrets
import string


def generate_user_id() -> int:
    """Generate a unique user ID."""
    # This is a simple implementation - in production, you'd query the database
    # for the highest ID and increment it
    from app.config.database import db_manager
    import asyncio
    
    async def get_next_id():
        collection = db_manager.get_collection("users")
        # Find the user with the highest ID
        last_user = await collection.find_one(
            {},
            sort=[("id", -1)]
        )
        return (last_user["id"] if last_user else 0) + 1
    
    # For sync context, we'll use a simple approach
    # In production, this should be handled properly with async
    return int(datetime.now().timestamp() * 1000) % 1000000


class UserModel(BaseModel):
    """User document model for MongoDB."""
    
    id: int = Field(default_factory=generate_user_id)
    username: str = Field(..., min_length=3, max_length=50)
    firstname: str = Field(..., min_length=1, max_length=100)
    email: EmailStr = Field(...)
    hashedPassword: str = Field(...)
    isActive: bool = Field(default=True)
    isAdmin: bool = Field(default=False)  # Admin flag for secure role management
    createdAt: datetime = Field(default_factory=datetime.now)
    updatedAt: datetime = Field(default_factory=datetime.now)
    schemaVersion: int = Field(default=1, description="Schema version for database upgrade management")
    
    model_config = ConfigDict()
    
    @field_serializer('createdAt', 'updatedAt', when_used='json')
    def serialize_datetime(self, value: datetime) -> str:
        """Serialize datetime to ISO format."""
        return value.isoformat()


async def get_next_user_id(collection) -> int:
    """Get the next user ID from the database."""
    # Find the user with the highest ID
    last_user = await collection.find_one(
        {},
        sort=[("id", -1)]
    )
    return (last_user["id"] if last_user else 0) + 1


async def create_indexes(collection):
    """Create database indexes for users collection."""
    # Create unique indexes
    await collection.create_index([("email", ASCENDING)], unique=True)
    await collection.create_index([("username", ASCENDING)], unique=True)
    await collection.create_index([("id", ASCENDING)], unique=True)


async def create_admin_user(collection, hashed_password: str) -> UserModel:
    """Create the default admin user if it doesn't exist."""
    # Check if admin user already exists
    existing_admin = await collection.find_one({"email": "admin@admin.com"})
    
    if existing_admin:
        return UserModel(**existing_admin)
    
    # Create admin user
    admin_user = UserModel(
        id=await get_next_user_id(collection),
        username="admin",
        firstname="Administrator",
        email="admin@admin.com",
        hashedPassword=hashed_password,
        isActive=True,
        isAdmin=True,  # This is the key admin flag
        createdAt=datetime.now(),
        updatedAt=datetime.now()
    )
    
    # Insert admin user
    await collection.insert_one(admin_user.model_dump())
    
    return admin_user

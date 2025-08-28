from typing import Optional
import random
import string
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from bson import ObjectId
from pymongo import ASCENDING
from app.models.enums.category import Category
from app.models.enums.inventoryStatus import InventoryStatus

def generate_product_code() -> str:
    """Generate a unique product code in format: f230fh0g3"""
    # Generate 9 characters using lowercase letters and digits
    characters = string.ascii_lowercase + string.digits
    return ''.join(random.choice(characters) for _ in range(9))

def generate_internal_reference() -> str:
    """Generate a unique internal reference in format: REF-123-456"""
    # Generate two 3-digit numbers
    part1 = ''.join(random.choice(string.digits) for _ in range(3))
    part2 = ''.join(random.choice(string.digits) for _ in range(3))
    return f"REF-{part1}-{part2}"

async def get_next_product_id(collection) -> int:
    """Get the next available product ID."""
    # Find the product with the highest ID
    result = await collection.find_one({}, sort=[("id", -1)])
    if result and "id" in result:
        return result["id"] + 1
    return 1

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if isinstance(v, ObjectId):
            return v
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return ObjectId(v)

class ProductModel(BaseModel):
    id: Optional[int] = Field(None, description="Product ID (auto-generated)")
    code: str = Field(default_factory=generate_product_code)
    name: str
    description: str
    image: Optional[str] = Field(None, description="Product image URL (optional)")
    category: Category
    price: float
    quantity: int
    internalReference: str = Field(default_factory=generate_internal_reference)
    shellId: int
    inventoryStatus: InventoryStatus
    rating: Optional[float] = Field(None, description="Product rating (0-5), can be null")
    createdAt: datetime
    updatedAt: datetime

    model_config = ConfigDict(
        populate_by_name=True,
        arbitrary_types_allowed=True,
        json_encoders={ObjectId: str}
    )


async def create_product_indexes(collection):
    """Create database indexes for the products collection."""
    # Create unique indexes for critical fields
    await collection.create_index([("name", ASCENDING)], unique=True)
    await collection.create_index([("code", ASCENDING)], unique=True)
    await collection.create_index([("id", ASCENDING)], unique=True)
    await collection.create_index([("internalReference", ASCENDING)], unique=True)
    
    # Create non-unique indexes for query performance
    await collection.create_index([("category", ASCENDING)])
    await collection.create_index([("inventoryStatus", ASCENDING)])
    await collection.create_index([("shellId", ASCENDING)])

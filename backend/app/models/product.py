from typing import Optional
import random
import string
from pydantic import BaseModel, Field
from bson import ObjectId
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
    id: Optional[PyObjectId] = Field(default_factory=PyObjectId, alias="_id")
    code: str = Field(default_factory=generate_product_code)
    name: str
    description: str
    image: str
    category: Category
    price: float
    quantity: int
    internalReference: str = Field(default_factory=generate_internal_reference)
    shellId: int
    inventoryStatus: InventoryStatus
    rating: float
    createdAt: int
    updatedAt: int

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

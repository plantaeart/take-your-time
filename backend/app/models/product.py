from typing import Optional
from pydantic import BaseModel, Field
from enum import Enum
from bson import ObjectId
from backend.app.models.enums.category import Category
from backend.app.models.enums.inventoryStatus import InventoryStatus

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
    code: str
    name: str
    description: str
    image: str
    category: Category
    price: float
    quantity: int
    internalReference: str
    shellId: int
    inventoryStatus: InventoryStatus
    rating: float
    createdAt: int
    updatedAt: int

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

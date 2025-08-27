"""
Product Pydantic schemas for request/response validation.
"""
from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field
from app.models.enums.category import Category
from app.models.enums.inventoryStatus import InventoryStatus


class ProductCreate(BaseModel):
    """Schema for creating a new product."""
    code: Optional[str] = Field(None, min_length=9, max_length=9, description="Product code (auto-generated if not provided)")
    name: str = Field(..., min_length=1, max_length=200, description="Product name")
    description: str = Field(..., max_length=1000, description="Product description")
    image: str = Field(..., description="Product image URL")
    category: Category = Field(..., description="Product category")
    price: float = Field(..., gt=0, description="Product price")
    quantity: int = Field(..., ge=0, description="Product quantity")
    internalReference: Optional[str] = Field(None, pattern=r"^REF-\d{3}-\d{3}$", description="Internal reference (auto-generated if not provided)")
    shellId: int = Field(..., ge=0, description="Shell ID")
    inventoryStatus: InventoryStatus = Field(..., description="Inventory status")
    rating: float = Field(..., ge=0, le=5, description="Product rating (0-5)")


class ProductUpdate(BaseModel):
    """Schema for updating an existing product."""
    code: Optional[str] = Field(None, min_length=9, max_length=9, description="Product code")
    name: Optional[str] = Field(None, min_length=1, max_length=200, description="Product name")
    description: Optional[str] = Field(None, max_length=1000, description="Product description")
    image: Optional[str] = Field(None, description="Product image URL")
    category: Optional[str] = Field(None, min_length=1, max_length=100, description="Product category")
    price: Optional[float] = Field(None, gt=0, description="Product price")
    quantity: Optional[int] = Field(None, ge=0, description="Product quantity")
    internalReference: Optional[str] = Field(None, pattern=r"^REF-\d{3}-\d{3}$", description="Internal reference")
    shellId: Optional[int] = Field(None, ge=0, description="Shell ID")
    inventoryStatus: Optional[InventoryStatus] = Field(None, description="Inventory status")
    rating: Optional[float] = Field(None, ge=0, le=5, description="Product rating (0-5)")


class ProductResponse(BaseModel):
    """Schema for product response."""
    id: int = Field(..., description="Product ID")
    code: str
    name: str
    description: str
    image: str
    category: str
    price: float
    quantity: int
    internalReference: str
    shellId: int
    inventoryStatus: InventoryStatus
    rating: float
    createdAt: datetime
    updatedAt: datetime


class ProductListResponse(BaseModel):
    """Schema for product list response."""
    products: list[ProductResponse]
    total: int
    page: int
    limit: int

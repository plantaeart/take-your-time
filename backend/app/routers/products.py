"""
Product API endpoints for CRUD operations.
"""
from typing import Optional
import time
from fastapi import APIRouter, HTTPException, Query, Path
from bson import ObjectId
from pymongo.errors import DuplicateKeyError

from app.config.database import db_manager
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, ProductListResponse
from app.models.product import ProductModel, InventoryStatus

router = APIRouter(tags=["products"])


@router.get("/products", response_model=ProductListResponse)
async def get_products(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    category: Optional[str] = Query(None, description="Filter by category"),
    inventory_status: Optional[InventoryStatus] = Query(None, description="Filter by inventory status"),
    search: Optional[str] = Query(None, description="Search in name and description")
):
    """Get all products with pagination and filters."""
    collection = db_manager.get_collection("products")
    
    # Build filter query
    filter_query = {}
    if category:
        filter_query["category"] = category
    if inventory_status:
        filter_query["inventoryStatus"] = inventory_status.value
    if search:
        filter_query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    # Calculate skip for pagination
    skip = (page - 1) * limit
    
    # Get total count
    total = await collection.count_documents(filter_query)
    
    # Get products with pagination
    cursor = collection.find(filter_query).skip(skip).limit(limit).sort("createdAt", -1)
    products = await cursor.to_list(length=limit)
    
    # Convert to response format
    product_responses = []
    for product in products:
        product["id"] = str(product["_id"])
        del product["_id"]
        product_responses.append(ProductResponse(**product))
    
    return ProductListResponse(
        products=product_responses,
        total=total,
        page=page,
        limit=limit
    )


@router.get("/products/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: str = Path(..., description="Product ID")
):
    """Get a specific product by ID."""
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail="Invalid product ID format")
    
    collection = db_manager.get_collection("products")
    product = await collection.find_one({"_id": ObjectId(product_id)})
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    product["id"] = str(product["_id"])
    del product["_id"]
    return ProductResponse(**product)


@router.post("/products", response_model=ProductResponse, status_code=201)
async def create_product(product_data: ProductCreate):
    """Create a new product."""
    collection = db_manager.get_collection("products")
    
    # Check if product code already exists
    existing_product = await collection.find_one({"code": product_data.code})
    if existing_product:
        raise HTTPException(status_code=400, detail="Product with this code already exists")
    
    # Create product with timestamps
    current_time = int(time.time())
    product_dict = product_data.model_dump()
    product_dict.update({
        "createdAt": current_time,
        "updatedAt": current_time
    })
    
    try:
        result = await collection.insert_one(product_dict)
        
        # Return the created product
        created_product = await collection.find_one({"_id": result.inserted_id})
        created_product["id"] = str(created_product["_id"])
        del created_product["_id"]
        
        return ProductResponse(**created_product)
        
    except DuplicateKeyError:
        raise HTTPException(status_code=400, detail="Product with this code already exists")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create product: {str(e)}")


@router.put("/products/{product_id}", response_model=ProductResponse)
async def update_product(
    product_data: ProductUpdate,
    product_id: str = Path(..., description="Product ID")
):
    """Update an existing product."""
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail="Invalid product ID format")
    
    collection = db_manager.get_collection("products")
    
    # Check if product exists
    existing_product = await collection.find_one({"_id": ObjectId(product_id)})
    if not existing_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    # Prepare update data (only non-None fields)
    update_data = {k: v for k, v in product_data.model_dump().items() if v is not None}
    
    if not update_data:
        raise HTTPException(status_code=400, detail="No data provided for update")
    
    # Check if code is being updated and doesn't conflict
    if "code" in update_data and update_data["code"] != existing_product["code"]:
        code_exists = await collection.find_one({
            "code": update_data["code"],
            "_id": {"$ne": ObjectId(product_id)}
        })
        if code_exists:
            raise HTTPException(status_code=400, detail="Product with this code already exists")
    
    # Add updated timestamp
    update_data["updatedAt"] = int(time.time())
    
    try:
        await collection.update_one(
            {"_id": ObjectId(product_id)},
            {"$set": update_data}
        )
        
        # Return updated product
        updated_product = await collection.find_one({"_id": ObjectId(product_id)})
        updated_product["id"] = str(updated_product["_id"])
        del updated_product["_id"]
        
        return ProductResponse(**updated_product)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update product: {str(e)}")


@router.delete("/products/{product_id}")
async def delete_product(
    product_id: str = Path(..., description="Product ID")
):
    """Delete a product."""
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail="Invalid product ID format")
    
    collection = db_manager.get_collection("products")
    
    # Check if product exists
    existing_product = await collection.find_one({"_id": ObjectId(product_id)})
    if not existing_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    try:
        await collection.delete_one({"_id": ObjectId(product_id)})
        return {"message": "Product deleted successfully", "product_id": product_id}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete product: {str(e)}")


@router.get("/products/categories", response_model=list[str])
async def get_categories():
    """Get all unique product categories."""
    collection = db_manager.get_collection("products")
    
    try:
        categories = await collection.distinct("category")
        return sorted(categories)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get categories: {str(e)}")


@router.patch("/products/{product_id}/inventory", response_model=ProductResponse)
async def update_inventory(
    inventory_status: InventoryStatus,
    quantity: int,
    product_id: str = Path(..., description="Product ID")
):
    """Update product inventory status and quantity."""
    if not ObjectId.is_valid(product_id):
        raise HTTPException(status_code=400, detail="Invalid product ID format")
    
    if quantity < 0:
        raise HTTPException(status_code=400, detail="Quantity cannot be negative")
    
    collection = db_manager.get_collection("products")
    
    # Check if product exists
    existing_product = await collection.find_one({"_id": ObjectId(product_id)})
    if not existing_product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    try:
        await collection.update_one(
            {"_id": ObjectId(product_id)},
            {
                "$set": {
                    "inventoryStatus": inventory_status.value,
                    "quantity": quantity,
                    "updatedAt": int(time.time())
                }
            }
        )
        
        # Return updated product
        updated_product = await collection.find_one({"_id": ObjectId(product_id)})
        updated_product["id"] = str(updated_product["_id"])
        del updated_product["_id"]
        
        return ProductResponse(**updated_product)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update inventory: {str(e)}")

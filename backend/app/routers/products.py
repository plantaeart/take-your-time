"""
Product API endpoints for CRUD operations.
"""
from typing import Optional, Annotated, List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query, Path, Depends
from pymongo.collection import Collection
from pymongo.cursor import Cursor
from pymongo.errors import DuplicateKeyError

from app.config.database import db_manager
from app.config.schema_versions import get_schema_version
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, ProductListResponse
from app.models.product import generate_product_code, generate_internal_reference, get_next_product_id
from app.models.enums.category import Category
from app.models.enums.inventoryStatus import InventoryStatus
from app.models.enums.http_status import HTTPStatus, ProductHTTPStatus
from app.auth.dependencies import admin_required
from app.models.user import UserModel
from app.models.enums.messages import ProductErrorMessages, SuccessMessages, format_message

router = APIRouter(tags=["products"])


async def cleanup_deleted_products_from_carts_and_wishlists(productIds: List[int]) -> Dict[str, int]:
    """
    Remove deleted products from all users' carts and wishlists.
    
    Args:
        productIds: List of product IDs that were deleted
        
    Returns:
        Dictionary with cleanup statistics
    """
    cartsCollection: Collection = db_manager.get_collection("carts")
    wishlistsCollection: Collection = db_manager.get_collection("wishlists")
    
    # Cleanup statistics
    stats: Dict[str, int] = {
        "cartsUpdated": 0,
        "cartItemsRemoved": 0,
        "wishlistsUpdated": 0,
        "wishlistItemsRemoved": 0
    }
    
    try:
        # Remove products from carts
        cartUpdateResult = await cartsCollection.update_many(
            {"items.productId": {"$in": productIds}},
            {
                "$pull": {"items": {"productId": {"$in": productIds}}},
                "$set": {"updatedAt": datetime.now()}
            }
        )
        stats["cartsUpdated"] = cartUpdateResult.modified_count
        
        # Remove products from wishlists  
        wishlistUpdateResult = await wishlistsCollection.update_many(
            {"items.productId": {"$in": productIds}},
            {
                "$pull": {"items": {"productId": {"$in": productIds}}},
                "$set": {"updatedAt": datetime.now()}
            }
        )
        stats["wishlistsUpdated"] = wishlistUpdateResult.modified_count
        
        # Count removed items (for logging purposes)
        # Note: We can't get exact counts from update_many with $pull, so these are estimates
        stats["cartItemsRemoved"] = len(productIds) * stats["cartsUpdated"]
        stats["wishlistItemsRemoved"] = len(productIds) * stats["wishlistsUpdated"]
        
    except Exception as e:
        # Log error but don't fail the product deletion
        print(f"Warning: Failed to cleanup carts/wishlists for deleted products {productIds}: {e}")
    
    return stats


@router.get("/products", response_model=ProductListResponse)
async def get_products(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    category: Optional[Category] = Query(None, description="Filter by category"),
    inventoryStatus: Optional[InventoryStatus] = Query(None, description="Filter by inventory status"),
    search: Optional[str] = Query(None, description="Search in name and description"),
    sortBy: Optional[str] = Query("createdAt", description="Sort field (name, price, quantity, createdAt, updatedAt)"),
    sortOrder: Optional[str] = Query("desc", description="Sort direction (asc, desc)"),
    priceMin: Optional[float] = Query(None, ge=0, description="Minimum price filter"),
    priceMax: Optional[float] = Query(None, ge=0, description="Maximum price filter")
):
    """Get all products with pagination and filters."""
    collection: Collection = db_manager.get_collection("products")
    
    # Build filter query
    filterQuery: Dict[str, Any] = {}
    if category:
        filterQuery["category"] = category.value
    if inventoryStatus:
        filterQuery["inventoryStatus"] = inventoryStatus.value
    if search:
        filterQuery["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    # Price range filtering
    if priceMin is not None or priceMax is not None:
        priceFilter: Dict[str, Any] = {}
        if priceMin is not None:
            priceFilter["$gte"] = priceMin
        if priceMax is not None:
            priceFilter["$lte"] = priceMax
        filterQuery["price"] = priceFilter
    
    # Calculate skip for pagination
    skip: int = (page - 1) * limit
    
    # Validate and set up sorting
    validSortFields = ["name", "price", "quantity", "createdAt", "updatedAt"]
    if sortBy not in validSortFields:
        sortBy = "createdAt"
    
    sortDirection = 1 if sortOrder == "asc" else -1
    
    # Get total count
    total: int = await collection.count_documents(filterQuery)
    
    # Get products with pagination and sorting
    cursor: Cursor = collection.find(filterQuery).skip(skip).limit(limit).sort(sortBy, sortDirection)
    products: List[Dict[str, Any]] = await cursor.to_list(length=limit)
    
    # Convert to response format
    productResponses: List[ProductResponse] = []
    for product in products:
        # Remove MongoDB's _id field, keep our integer id
        del product["_id"]
        productResponses.append(ProductResponse(**product))
    
    # Calculate pagination info
    totalPages: int = (total + limit - 1) // limit if total > 0 else 0
    hasNext: bool = page < totalPages
    hasPrev: bool = page > 1
    
    return ProductListResponse(
        products=productResponses,
        total=total,
        page=page,
        limit=limit,
        totalPages=totalPages,
        hasNext=hasNext,
        hasPrev=hasPrev
    )


@router.get("/products/categories", response_model=list[str])
async def get_categories():
    """Get all available product categories from enum."""
    return [category.value for category in Category]


@router.get("/products/max-price", response_model=float)
async def get_max_price():
    """Get the maximum price from all products for filter initialization."""
    collection: Collection = db_manager.get_collection("products")
    
    try:
        # Simple approach: sort by price descending and get the first document
        document = await collection.find_one({}, sort=[('price', -1)])
        
        if document is None:
            return 1000.0
        else:
            max_price = document.get('price', 1000.0)
            import math
            return float(math.ceil(max_price))
            
    except Exception as e:
        return 1000.0


@router.get("/products/{productId}", response_model=ProductResponse)
async def get_product(
    productId: int = Path(..., description="Product ID")
):
    """Get a specific product by ID."""
    collection: Collection = db_manager.get_collection("products")
    product: Optional[Dict[str, Any]] = await collection.find_one({"id": productId})
    
    if not product:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND.value, detail=ProductErrorMessages.PRODUCT_NOT_FOUND.value)
    
    del product["_id"]
    return ProductResponse(**product)


@router.post("/products", response_model=ProductResponse, status_code=HTTPStatus.CREATED.value)
async def create_product(
    productData: ProductCreate,
    currentAdmin: Annotated[UserModel, Depends(admin_required)]
):
    """Create a new product. Requires admin privileges."""
    collection: Collection = db_manager.get_collection("products")
    
    # Check if product name already exists
    existingProductName: Optional[Dict[str, Any]] = await collection.find_one({"name": productData.name})
    if existingProductName:
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST.value, 
            detail=f"Product with name '{productData.name}' already exists"
        )
    
    # Generate code if not provided
    productCode: Optional[str] = productData.code
    if not productCode:
        # Generate a unique code
        maxAttempts: int = 10
        for _ in range(maxAttempts):
            productCode = generate_product_code()
            existingProduct: Optional[Dict[str, Any]] = await collection.find_one({"code": productCode})
            if not existingProduct:
                break
        else:
            raise HTTPException(status_code=HTTPStatus.INTERNAL_SERVER_ERROR.value, detail=ProductErrorMessages.FAILED_TO_GENERATE_CODE.value)
    else:
        # Check if provided code already exists
        existingProduct: Optional[Dict[str, Any]] = await collection.find_one({"code": productCode})
        if existingProduct:
            raise HTTPException(status_code=HTTPStatus.BAD_REQUEST.value, detail=ProductErrorMessages.PRODUCT_CODE_EXISTS.value)
    
    # Generate internal reference if not provided
    internalRef: Optional[str] = productData.internalReference
    if not internalRef:
        # Generate a unique internal reference
        maxAttempts: int = 10
        for _ in range(maxAttempts):
            internalRef = generate_internal_reference()
            existingProduct: Optional[Dict[str, Any]] = await collection.find_one({"internalReference": internalRef})
            if not existingProduct:
                break
        else:
            raise HTTPException(status_code=HTTPStatus.INTERNAL_SERVER_ERROR.value, detail=ProductErrorMessages.FAILED_TO_GENERATE_CODE.value)
    else:
        # Check if provided internal reference already exists
        existingProduct: Optional[Dict[str, Any]] = await collection.find_one({"internalReference": internalRef})
        if existingProduct:
            raise HTTPException(status_code=HTTPStatus.BAD_REQUEST.value, detail=ProductErrorMessages.PRODUCT_CODE_EXISTS.value)
    
    # Generate next product ID
    nextId: int = await get_next_product_id(collection)
    
    # Create product with timestamps
    currentTime: datetime = datetime.now()
    productDict: Dict[str, Any] = productData.model_dump()
    productDict["id"] = nextId  # Use generated integer ID
    productDict["code"] = productCode  # Use generated or provided code
    productDict["internalReference"] = internalRef  # Use generated or provided internal reference
    productDict.update({
        "createdAt": currentTime,
        "updatedAt": currentTime,
        "schemaVersion": get_schema_version("products")  # Current schema version
    })
    
    try:
        result = await collection.insert_one(productDict)
        
        # Return the created product
        createdProduct: Optional[Dict[str, Any]] = await collection.find_one({"_id": result.inserted_id})
        del createdProduct["_id"]
        
        return ProductResponse(**createdProduct)
        
    except DuplicateKeyError:
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST.value, detail=ProductErrorMessages.PRODUCT_CODE_EXISTS.value)
    except Exception as e:
        raise HTTPException(status_code=HTTPStatus.INTERNAL_SERVER_ERROR.value, detail=format_message(ProductErrorMessages.FAILED_TO_CREATE, error=str(e)))


@router.put("/products/{productId}", response_model=ProductResponse)
async def update_product(
    productId: int = Path(..., description="Product ID"),
    *,  # Force keyword-only arguments after this
    productData: ProductUpdate,
    currentAdmin: Annotated[UserModel, Depends(admin_required)]
):
    """Update an existing product. Requires admin privileges."""
    collection: Collection = db_manager.get_collection("products")
    
    # Check if product exists
    existingProduct: Optional[Dict[str, Any]] = await collection.find_one({"id": productId})
    if not existingProduct:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND.value, detail=ProductErrorMessages.PRODUCT_NOT_FOUND.value)
    
    # Prepare update data (only non-None fields)
    updateData: Dict[str, Any] = {k: v for k, v in productData.model_dump().items() if v is not None}
    
    if not updateData:
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST.value, detail=ProductErrorMessages.NO_UPDATE_DATA.value)
    
    # Check if code is being updated and doesn't conflict
    if "code" in updateData and updateData["code"] != existingProduct["code"]:
        codeExists: Optional[Dict[str, Any]] = await collection.find_one({
            "code": updateData["code"],
            "id": {"$ne": productId}
        })
        if codeExists:
            raise HTTPException(status_code=HTTPStatus.BAD_REQUEST.value, detail=ProductErrorMessages.PRODUCT_CODE_EXISTS.value)
    
    # Check if name is being updated and doesn't conflict
    if "name" in updateData and updateData["name"] != existingProduct["name"]:
        nameExists: Optional[Dict[str, Any]] = await collection.find_one({
            "name": updateData["name"],
            "id": {"$ne": productId}
        })
        if nameExists:
            raise HTTPException(
                status_code=HTTPStatus.BAD_REQUEST.value, 
                detail=f"Product with name '{updateData['name']}' already exists"
            )
    
    # Add updated timestamp
    updateData["updatedAt"] = datetime.now()
    
    try:
        await collection.update_one(
            {"id": productId},
            {"$set": updateData}
        )
        
        # Return updated product
        updatedProduct: Optional[Dict[str, Any]] = await collection.find_one({"id": productId})
        del updatedProduct["_id"]
        
        return ProductResponse(**updatedProduct)
        
    except Exception as e:
        raise HTTPException(status_code=HTTPStatus.INTERNAL_SERVER_ERROR.value, detail=format_message(ProductErrorMessages.FAILED_TO_UPDATE, error=str(e)))


@router.delete("/products/{productId}")
async def delete_product(
    productId: int = Path(..., description="Product ID"),
    *,  # Force keyword-only arguments after this
    currentAdmin: Annotated[UserModel, Depends(admin_required)]
):
    """Delete a product. Requires admin privileges."""
    collection: Collection = db_manager.get_collection("products")
    
    # Check if product exists
    existingProduct: Optional[Dict[str, Any]] = await collection.find_one({"id": productId})
    if not existingProduct:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND.value, detail=ProductErrorMessages.PRODUCT_NOT_FOUND.value)
    
    # Store product name before deletion
    productName: str = existingProduct.get("name", "Unknown Product")
    
    try:
        # Delete the product
        await collection.delete_one({"id": productId})
        
        # Cleanup product from carts and wishlists
        cleanupStats: Dict[str, int] = await cleanup_deleted_products_from_carts_and_wishlists([productId])
        
        return {
            "message": SuccessMessages.PRODUCT_DELETED.value, 
            "productId": productId,
            "productName": productName,
            "cleanup": cleanupStats
        }
        
    except Exception as e:
        raise HTTPException(status_code=HTTPStatus.INTERNAL_SERVER_ERROR.value, detail=format_message(ProductErrorMessages.FAILED_TO_DELETE, error=str(e)))


@router.delete("/admin/products/bulk")
async def bulk_delete_products(
    productIds: List[int],
    *,  # Force keyword-only arguments after this
    currentAdmin: Annotated[UserModel, Depends(admin_required)]
):
    """Bulk delete products. Requires admin privileges."""
    if not productIds:
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST.value, detail="Product IDs list cannot be empty")
    
    if len(productIds) > 100:
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST.value, detail="Cannot delete more than 100 products at once")
    
    collection: Collection = db_manager.get_collection("products")
    
    # Check which products exist
    existingProducts: List[Dict[str, Any]] = await collection.find({"id": {"$in": productIds}}).to_list(length=len(productIds))
    existingIds: List[int] = [product["id"] for product in existingProducts]
    
    if not existingIds:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND.value, detail="No products found with the provided IDs")
    
    try:
        # Delete the products
        deleteResult = await collection.delete_many({"id": {"$in": existingIds}})
        
        # Cleanup deleted products from carts and wishlists
        cleanupStats: Dict[str, int] = await cleanup_deleted_products_from_carts_and_wishlists(existingIds)
        
        notFoundIds: List[int] = [pid for pid in productIds if pid not in existingIds]
        
        return {
            "message": SuccessMessages.PRODUCTS_BULK_DELETED.value,
            "deletedCount": deleteResult.deleted_count,
            "deletedIds": existingIds,
            "notFoundIds": notFoundIds,
            "requestedCount": len(productIds),
            "cleanup": cleanupStats
        }
        
    except Exception as e:
        raise HTTPException(status_code=HTTPStatus.INTERNAL_SERVER_ERROR.value, detail=format_message(ProductErrorMessages.FAILED_TO_BULK_DELETE, error=str(e)))


@router.patch("/products/{productId}/inventory", response_model=ProductResponse)
async def update_inventory(
    productId: int = Path(..., description="Product ID"),
    *,
    inventoryStatus: InventoryStatus,
    quantity: int,
    currentAdmin: Annotated[UserModel, Depends(admin_required)]
):
    """Update product inventory status and quantity. Requires admin privileges."""
    if quantity < 0:
        raise HTTPException(status_code=HTTPStatus.BAD_REQUEST.value, detail=ProductErrorMessages.NEGATIVE_QUANTITY.value)
    
    collection: Collection = db_manager.get_collection("products")
    
    # Check if product exists
    existingProduct: Optional[Dict[str, Any]] = await collection.find_one({"id": productId})
    if not existingProduct:
        raise HTTPException(status_code=HTTPStatus.NOT_FOUND.value, detail=ProductErrorMessages.PRODUCT_NOT_FOUND.value)
    
    try:
        await collection.update_one(
            {"id": productId},
            {
                "$set": {
                    "inventoryStatus": inventoryStatus.value,
                    "quantity": quantity,
                    "updatedAt": datetime.now()
                }
            }
        )
        
        # Return updated product
        updatedProduct: Optional[Dict[str, Any]] = await collection.find_one({"id": productId})
        del updatedProduct["_id"]
        
        return ProductResponse(**updatedProduct)
        
    except Exception as e:
        raise HTTPException(status_code=HTTPStatus.INTERNAL_SERVER_ERROR.value, detail=format_message(ProductErrorMessages.FAILED_TO_UPDATE_INVENTORY, error=str(e)))


@router.post("/products/bulk", response_model=List[ProductResponse])
async def create_products_bulk(
    productsData: List[ProductCreate],
    currentAdmin: Annotated[UserModel, Depends(admin_required)]
):
    """Create multiple products at once. Requires admin privileges."""
    collection: Collection = db_manager.get_collection("products")
    
    createdProducts: List[ProductResponse] = []
    errors: List[str] = []
    
    # Track names in this batch to avoid duplicates within the batch
    batchNames: set[str] = set()
    
    for i, productData in enumerate(productsData):
        try:
            # Check for duplicate name within the batch
            if productData.name in batchNames:
                errors.append(f"Product {i+1}: Duplicate name '{productData.name}' within this batch")
                continue
            
            # Check for duplicate name in database
            existingProduct: Optional[Dict[str, Any]] = await collection.find_one({"name": productData.name})
            if existingProduct:
                errors.append(f"Product {i+1}: Product with name '{productData.name}' already exists")
                continue
            
            # Add name to batch tracking
            batchNames.add(productData.name)
            
            # Generate auto-fields if not provided
            if not productData.code:
                # Generate a unique code
                maxAttempts: int = 10
                for _ in range(maxAttempts):
                    productCode = generate_product_code()
                    existingProduct: Optional[Dict[str, Any]] = await collection.find_one({"code": productCode})
                    if not existingProduct:
                        productData.code = productCode
                        break
                else:
                    errors.append(f"Product {i+1}: Failed to generate unique product code")
                    continue
            
            if not productData.internalReference:
                # Generate a unique internal reference
                maxAttempts: int = 10
                for _ in range(maxAttempts):
                    internalRef = generate_internal_reference()
                    existingProduct: Optional[Dict[str, Any]] = await collection.find_one({"internalReference": internalRef})
                    if not existingProduct:
                        productData.internalReference = internalRef
                        break
                else:
                    errors.append(f"Product {i+1}: Failed to generate unique internal reference")
                    continue
            
            # Create product with auto-generated ID
            productId: int = await get_next_product_id(collection)
            productDict: Dict[str, Any] = productData.model_dump()
            productDict["id"] = productId
            productDict["createdAt"] = datetime.now()
            productDict["updatedAt"] = datetime.now()
            productDict["schemaVersion"] = get_schema_version("products")  # Current schema version
            
            # Insert product
            await collection.insert_one(productDict)
            
            # Remove MongoDB _id for response
            if "_id" in productDict:
                del productDict["_id"]
            
            createdProducts.append(ProductResponse(**productDict))
            
        except DuplicateKeyError:
            errors.append(f"Product {i+1}: Code or internal reference already exists")
        except Exception as e:
            errors.append(f"Product {i+1}: {str(e)}")
    
    # If there were errors but some products were created, include error info
    if errors and createdProducts:
        # Log errors but return successfully created products
        # In a real application, you might want to handle this differently
        pass
    elif errors and not createdProducts:
        # If no products were created, raise an error
        raise HTTPException(
            status_code=HTTPStatus.BAD_REQUEST.value,
            detail=f"Failed to create products: {'; '.join(errors)}"
        )
    
    return createdProducts

"""
Cart routes for shopping cart management.
"""
from datetime import datetime
from typing import Annotated, List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Path
from pymongo.collection import Collection
from app.auth.dependencies import get_current_active_user
from app.config.database import db_manager
from app.models.user import UserModel
from app.models.cart import CartModel, CartItem
from app.models.enums.http_status import HTTPStatus, CartHTTPStatus
from app.schemas.cart import CartResponse, CartItemCreate, CartItemUpdate, CartItemResponse
from app.models.enums.messages import ProductErrorMessages, CartErrorMessages, SuccessMessages, format_message
from pymongo.collection import Collection
from app.auth.dependencies import get_current_active_user
from app.config.database import db_manager
from app.models.user import UserModel
from app.models.cart import CartModel, CartItem
from app.models.enums.http_status import HTTPStatus, CartHTTPStatus
from app.schemas.cart import CartResponse, CartItemCreate, CartItemUpdate, CartItemResponse
from app.models.enums.messages import ProductErrorMessages, CartErrorMessages, SuccessMessages, format_message

router = APIRouter(tags=["cart"])


async def get_user_cart(userId: int) -> CartModel:
    """Get or create user's cart."""
    collection: Collection = db_manager.get_collection("carts")
    
    cartDoc: Optional[Dict[str, Any]] = await collection.find_one({"userId": userId})
    
    if cartDoc:
        return CartModel(**cartDoc)
    
    # Create new cart if doesn't exist
    newCart: CartModel = CartModel(userId=userId, items=[])
    await collection.insert_one(newCart.model_dump())
    return newCart


async def validate_product_stock(productId: int, requestedQuantity: int, currentCartQuantity: int = 0):
    """
    Validate if the requested quantity is available in stock.
    
    Args:
        productId: ID of the product to check
        requestedQuantity: Quantity being requested
        currentCartQuantity: Current quantity already in cart (for add operations)
    
    Raises:
        HTTPException: If product not found or insufficient stock
    """
    productsCollection: Collection = db_manager.get_collection("products")
    product: Optional[Dict[str, Any]] = await productsCollection.find_one({"id": productId})
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ProductErrorMessages.PRODUCT_NOT_FOUND.value
        )
    
    productStock: int = product.get("quantity", 0)
    
    # Check if product is in stock
    if productStock <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=format_message(ProductErrorMessages.OUT_OF_STOCK, productName=product.get('name', 'Unknown'))
        )
    
    # For add operations, calculate total quantity including existing cart items
    if currentCartQuantity > 0:
        totalRequestedQuantity: int = currentCartQuantity + requestedQuantity
        if totalRequestedQuantity > productStock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=format_message(
                    ProductErrorMessages.INSUFFICIENT_STOCK,
                    requestedQuantity=requestedQuantity,
                    availableQuantity=productStock - currentCartQuantity,
                    cartQuantity=currentCartQuantity,
                    stockQuantity=productStock
                )
            )
    else:
        # For update operations, check direct quantity
        if requestedQuantity > productStock:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=format_message(
                    ProductErrorMessages.INSUFFICIENT_STOCK_UPDATE,
                    requestedQuantity=requestedQuantity,
                    stockQuantity=productStock
                )
            )


async def populate_cart_items(cartItems: List[CartItem]) -> tuple[List[CartItemResponse], List[int]]:
    """Populate cart items with product details, filtering out deleted products."""
    productsCollection: Collection = db_manager.get_collection("products")
    populatedItems: List[CartItemResponse] = []
    validProductIds: List[int] = []
    
    for item in cartItems:
        # Get product details
        product: Optional[Dict[str, Any]] = await productsCollection.find_one({"id": item.productId})
        
        # Only include items where the product still exists
        if product:
            cartItemResponse: CartItemResponse = CartItemResponse(
                productId=item.productId,
                quantity=item.quantity,
                addedAt=item.addedAt,
                updatedAt=item.updatedAt,
                productName=product.get("name"),
                productPrice=product.get("price"),
                productImage=product.get("image")
            )
            populatedItems.append(cartItemResponse)
            validProductIds.append(item.productId)
        # If product doesn't exist, skip this item (don't add "Product Not Found")
    
    return populatedItems, validProductIds


async def cleanup_orphaned_cart_items(userId: int, validProductIds: List[int], originalItemCount: int) -> None:
    """Remove orphaned cart items that reference deleted products."""
    if len(validProductIds) < originalItemCount:
        # Some items were filtered out, clean up the database
        cartsCollection: Collection = db_manager.get_collection("carts")
        await cartsCollection.update_one(
            {"userId": userId},
            {
                "$pull": {"items": {"productId": {"$nin": validProductIds}}},
                "$set": {"updatedAt": datetime.now()}
            }
        )


@router.get("/cart", response_model=CartResponse)
async def get_cart(
    currentUser: Annotated[UserModel, Depends(get_current_active_user)]
):
    """Get user's shopping cart."""
    cart: CartModel = await get_user_cart(currentUser.id)
    originalItemCount: int = len(cart.items)
    result = await populate_cart_items(cart.items)
    populatedItems: List[CartItemResponse] = result[0]
    validProductIds: List[int] = result[1]
    
    # Clean up orphaned items from database if any were filtered out
    await cleanup_orphaned_cart_items(currentUser.id, validProductIds, originalItemCount)
    
    return CartResponse(
        userId=cart.userId,
        items=populatedItems,
        totalItems=sum(item.quantity for item in populatedItems),  # Use populated items for accurate count
        createdAt=cart.createdAt,
        updatedAt=cart.updatedAt
    )


@router.post("/cart/items", status_code=HTTPStatus.CREATED.value)
async def add_to_cart(
    itemData: CartItemCreate,
    currentUser: Annotated[UserModel, Depends(get_current_active_user)]
):
    """Add an item to the user's cart."""
    collection: Collection = db_manager.get_collection("carts")
    cart: CartModel = await get_user_cart(currentUser.id)
    
    # Check if item already exists in cart
    existingItemIndex: Optional[int] = None
    currentCartQuantity: int = 0
    for i, item in enumerate(cart.items):
        if item.productId == itemData.productId:
            existingItemIndex = i
            currentCartQuantity = item.quantity
            break
    
    # Validate stock availability using the shared function
    await validate_product_stock(
        itemData.productId, 
        itemData.quantity, 
        currentCartQuantity
    )
    
    if existingItemIndex is not None:
        # Update quantity if item exists
        cart.items[existingItemIndex].quantity += itemData.quantity
    else:
        # Add new item
        newItem: CartItem = CartItem(
            productId=itemData.productId,
            quantity=itemData.quantity,
            addedAt=datetime.now()
        )
        cart.items.append(newItem)
    
    # Update cart in database
    cart.updatedAt = datetime.now()
    await collection.update_one(
        {"userId": currentUser.id},
        {"$set": cart.model_dump()},
        upsert=True
    )
    
    return {"message": SuccessMessages.ITEM_ADDED_TO_CART.value}


@router.put("/cart/items/{productId}")
async def update_cart_item(
    productId: int = Path(..., description="Product ID"),
    *,
    itemData: CartItemUpdate,
    currentUser: Annotated[UserModel, Depends(get_current_active_user)]
):
    """Update quantity of an item in the cart."""
    # Validate stock availability using the shared function
    await validate_product_stock(
        productId, 
        itemData.quantity
    )
    
    collection: Collection = db_manager.get_collection("carts")
    cart: CartModel = await get_user_cart(currentUser.id)
    
    # Find item in cart
    itemFound: bool = False
    for item in cart.items:
        if item.productId == productId:
            item.quantity = itemData.quantity
            itemFound = True
            break
    
    if not itemFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=CartErrorMessages.ITEM_NOT_FOUND_IN_CART.value
        )
    
    # Update cart in database
    cart.updatedAt = datetime.now()
    await collection.update_one(
        {"userId": currentUser.id},
        {"$set": cart.model_dump()}
    )
    
    return {"message": SuccessMessages.CART_ITEM_UPDATED.value}


@router.delete("/cart/items/{productId}")
async def remove_from_cart(
    productId: int = Path(..., description="Product ID"),
    *,
    currentUser: Annotated[UserModel, Depends(get_current_active_user)]
):
    """Remove an item from the cart."""
    collection: Collection = db_manager.get_collection("carts")
    cart: CartModel = await get_user_cart(currentUser.id)
    
    # Remove item from cart
    originalLength: int = len(cart.items)
    cart.items = [item for item in cart.items if item.productId != productId]
    
    if len(cart.items) == originalLength:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=CartErrorMessages.ITEM_NOT_FOUND_IN_CART.value
        )
    
    # Update cart in database
    cart.updatedAt = datetime.now()
    await collection.update_one(
        {"userId": currentUser.id},
        {"$set": cart.model_dump()}
    )
    
    return {"message": SuccessMessages.ITEM_REMOVED_FROM_CART.value}


@router.delete("/cart")
async def clear_cart(
    currentUser: Annotated[UserModel, Depends(get_current_active_user)]
):
    """Clear all items from the cart."""
    collection: Collection = db_manager.get_collection("carts")
    
    cart: CartModel = CartModel(userId=currentUser.id, items=[])
    cart.updatedAt = datetime.now()
    
    await collection.update_one(
        {"userId": currentUser.id},
        {"$set": cart.model_dump()},
        upsert=True
    )
    
    return {"message": SuccessMessages.CART_CLEARED.value}

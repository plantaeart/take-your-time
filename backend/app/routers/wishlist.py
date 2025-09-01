"""
Wishlist routes for wishlist management.
"""
from datetime import datetime
from typing import Annotated, List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Path
from pymongo.collection import Collection
from app.auth.dependencies import get_current_active_user
from app.config.database import db_manager
from app.models.user import UserModel
from app.models.wishlist import WishlistModel, WishlistItem
from app.models.enums.messages import ProductErrorMessages, WishlistErrorMessages, SuccessMessages
from app.schemas.wishlist import WishlistResponse, WishlistItemCreate, WishlistItemResponse

router = APIRouter(tags=["wishlist"])


async def get_user_wishlist(userId: int) -> WishlistModel:
    """Get or create user's wishlist."""
    collection: Collection = db_manager.get_collection("wishlists")
    
    wishlistDoc: Optional[Dict[str, Any]] = await collection.find_one({"userId": userId})
    
    if wishlistDoc:
        return WishlistModel(**wishlistDoc)
    
    # Create new wishlist if doesn't exist
    newWishlist: WishlistModel = WishlistModel(userId=userId, items=[])
    await collection.insert_one(newWishlist.model_dump())
    return newWishlist


async def populate_wishlist_items(wishlistItems: List[WishlistItem]) -> tuple[List[WishlistItemResponse], List[int]]:
    """Populate wishlist items with product details, filtering out deleted products."""
    productsCollection: Collection = db_manager.get_collection("products")
    populatedItems: List[WishlistItemResponse] = []
    validProductIds: List[int] = []
    
    for item in wishlistItems:
        # Get product details
        product: Optional[Dict[str, Any]] = await productsCollection.find_one({"id": item.productId})
        
        # Only include items where the product still exists
        if product:
            wishlistItemResponse: WishlistItemResponse = WishlistItemResponse(
                productId=item.productId,
                addedAt=item.addedAt,
                productName=product.get("name"),
                productPrice=product.get("price"),
                productImage=product.get("image")
            )
            populatedItems.append(wishlistItemResponse)
            validProductIds.append(item.productId)
        # If product doesn't exist, skip this item (don't add "Product Not Found")
    
    return populatedItems, validProductIds


async def cleanup_orphaned_wishlist_items(userId: int, validProductIds: List[int], originalItemCount: int) -> None:
    """Remove orphaned wishlist items that reference deleted products."""
    if len(validProductIds) < originalItemCount:
        # Some items were filtered out, clean up the database
        wishlistsCollection: Collection = db_manager.get_collection("wishlists")
        await wishlistsCollection.update_one(
            {"userId": userId},
            {
                "$pull": {"items": {"productId": {"$nin": validProductIds}}},
                "$set": {"updatedAt": datetime.now()}
            }
        )


@router.get("/wishlist", response_model=WishlistResponse)
async def get_wishlist(
    currentUser: Annotated[UserModel, Depends(get_current_active_user)]
):
    """Get user's wishlist."""
    wishlist: WishlistModel = await get_user_wishlist(currentUser.id)
    originalItemCount: int = len(wishlist.items)
    result = await populate_wishlist_items(wishlist.items)
    populatedItems: List[WishlistItemResponse] = result[0]
    validProductIds: List[int] = result[1]
    
    # Clean up orphaned items from database if any were filtered out
    await cleanup_orphaned_wishlist_items(currentUser.id, validProductIds, originalItemCount)
    
    return WishlistResponse(
        userId=wishlist.userId,
        items=populatedItems,
        totalItems=len(populatedItems),  # Use populated items for accurate count
        createdAt=wishlist.createdAt,
        updatedAt=wishlist.updatedAt
    )


@router.post("/wishlist/items", status_code=status.HTTP_201_CREATED)
async def add_to_wishlist(
    itemData: WishlistItemCreate,
    currentUser: Annotated[UserModel, Depends(get_current_active_user)]
):
    """Add an item to the user's wishlist."""
    # Verify product exists
    productsCollection: Collection = db_manager.get_collection("products")
    product: Optional[Dict[str, Any]] = await productsCollection.find_one({"id": itemData.productId})
    
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ProductErrorMessages.PRODUCT_NOT_FOUND.value
        )
    
    collection: Collection = db_manager.get_collection("wishlists")
    wishlist: WishlistModel = await get_user_wishlist(currentUser.id)
    
    # Check if item already exists in wishlist
    for item in wishlist.items:
        if item.productId == itemData.productId:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=WishlistErrorMessages.PRODUCT_ALREADY_IN_WISHLIST.value
            )
    
    # Add new item
    newItem: WishlistItem = WishlistItem(
        productId=itemData.productId,
        addedAt=datetime.now()
    )
    wishlist.items.append(newItem)
    
    # Update wishlist in database
    wishlist.updatedAt = datetime.now()
    await collection.update_one(
        {"userId": currentUser.id},
        {"$set": wishlist.model_dump()},
        upsert=True
    )
    
    return {"message": SuccessMessages.ITEM_ADDED_TO_WISHLIST.value}


@router.delete("/wishlist/items/{productId}")
async def remove_from_wishlist(
    productId: int = Path(..., description="Product ID"),
    *,
    currentUser: Annotated[UserModel, Depends(get_current_active_user)]
):
    """Remove an item from the wishlist."""
    collection: Collection = db_manager.get_collection("wishlists")
    wishlist: WishlistModel = await get_user_wishlist(currentUser.id)
    
    # Remove item from wishlist
    originalLength: int = len(wishlist.items)
    wishlist.items = [item for item in wishlist.items if item.productId != productId]
    
    if len(wishlist.items) == originalLength:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=WishlistErrorMessages.ITEM_NOT_FOUND_IN_WISHLIST.value
        )
    
    # Update wishlist in database
    wishlist.updatedAt = datetime.now()
    await collection.update_one(
        {"userId": currentUser.id},
        {"$set": wishlist.model_dump()}
    )
    
    return {"message": SuccessMessages.ITEM_REMOVED_FROM_WISHLIST.value}


@router.delete("/wishlist")
async def clear_wishlist(
    currentUser: Annotated[UserModel, Depends(get_current_active_user)]
):
    """Clear all items from the wishlist."""
    collection: Collection = db_manager.get_collection("wishlists")
    
    wishlist: WishlistModel = WishlistModel(userId=currentUser.id, items=[])
    wishlist.updatedAt = datetime.now()
    
    await collection.update_one(
        {"userId": currentUser.id},
        {"$set": wishlist.model_dump()},
        upsert=True
    )
    
    return {"message": SuccessMessages.WISHLIST_CLEARED.value}

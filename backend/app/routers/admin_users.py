"""
Admin routes for user management including CRUD operations on users, carts, and wishlists.
"""
from datetime import datetime
from typing import Annotated, List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Path, Query
from pymongo.collection import Collection
from pymongo.cursor import Cursor
from app.auth.dependencies import admin_required
from app.auth.blacklist import blacklist_all_user_tokens
from app.config.database import db_manager
from app.models.user import UserModel
from app.models.cart import CartModel, CartItem
from app.models.wishlist import WishlistModel, WishlistItem
from app.models.enums.messages import UserErrorMessages, ProductErrorMessages, CartErrorMessages, WishlistErrorMessages, SuccessMessages, get_success_response
from app.schemas.user import UserResponse, UserCreate, UserUpdate
from app.schemas.cart import CartResponse, CartItemResponse, CartItemCreate, CartItemUpdate
from app.schemas.wishlist import WishlistResponse, WishlistItemResponse, WishlistItemCreate, WishlistItemUpdate
from app.models.enums.messages import (
    AuthErrorMessages, UserErrorMessages, ProductErrorMessages, 
    CartErrorMessages, WishlistErrorMessages, SuccessMessages,
    format_message, get_success_response
)
from app.auth.password import get_password_hash

router = APIRouter(prefix="/admin", tags=["admin-users"])


# ================== USER MANAGEMENT ==================

@router.get("/users/admins", response_model=List[Dict[str, Any]])
async def get_admin_users(
    adminUser: Annotated[UserModel, Depends(admin_required)]
):
    """Get all admin users for assignment purposes."""
    collection: Collection = db_manager.get_collection("users")
    
    # Find all admin users
    cursor = collection.find({"isAdmin": True}, {"id": 1, "username": 1, "email": 1})
    admin_users = await cursor.to_list(length=None)
    
    # Format response
    result = []
    for admin in admin_users:
        result.append({
            "id": admin["id"],
            "username": admin["username"], 
            "email": admin["email"]
        })
    
    return result


@router.get("/users", response_model=List[UserResponse])
async def get_all_users(
    adminUser: Annotated[UserModel, Depends(admin_required)],
    skip: int = Query(0, ge=0, description="Number of users to skip"),
    limit: int = Query(50, ge=1, le=100, description="Number of users to return"),
    activeOnly: bool = Query(False, description="Filter only active users"),
    search: Optional[str] = Query(None, description="Search by username, email, or name")
):
    """Get all users with pagination and filtering."""
    collection: Collection = db_manager.get_collection("users")
    
    # Build query - exclude admin's own account
    query: Dict[str, Any] = {"id": {"$ne": adminUser.id}}
    if activeOnly:
        query["isActive"] = True
    
    if search:
        query["$or"] = [
            {"username": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}},
            {"firstname": {"$regex": search, "$options": "i"}}
        ]
    
    # Get users with pagination
    cursor: Cursor = collection.find(query).skip(skip).limit(limit)
    users: List[Dict[str, Any]] = await cursor.to_list(length=limit)
    
    return [UserResponse(**user) for user in users]


@router.get("/users/{userId}", response_model=UserResponse)
async def get_user_by_id(
    userId: int = Path(..., description="User ID"),
    adminUser: Annotated[UserModel, Depends(admin_required)] = None
):
    """Get a specific user by ID."""
    # Prevent admin from viewing their own account
    if userId == adminUser.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=UserErrorMessages.ADMIN_SELF_MANAGEMENT_FORBIDDEN.value
        )
    
    collection: Collection = db_manager.get_collection("users")
    user: Optional[Dict[str, Any]] = await collection.find_one({"id": userId})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=UserErrorMessages.USER_NOT_FOUND.value
        )
    
    return UserResponse(**user)


@router.put("/users/{userId}", response_model=UserResponse)
async def update_user(
    userId: int = Path(..., description="User ID"),
    *,
    userData: UserUpdate,
    adminUser: Annotated[UserModel, Depends(admin_required)]
):
    """Update a user's information."""
    # Prevent admin from updating their own account
    if userId == adminUser.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=UserErrorMessages.ADMIN_SELF_MANAGEMENT_FORBIDDEN.value
        )
    
    collection: Collection = db_manager.get_collection("users")
    
    # Check if user exists
    existingUser: Optional[Dict[str, Any]] = await collection.find_one({"id": userId})
    if not existingUser:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=UserErrorMessages.USER_NOT_FOUND.value
        )
    
    # Prepare update data
    updateData: Dict[str, Any] = {}
    if userData.username is not None:
        # Check if username already exists
        existingUsername: Optional[Dict[str, Any]] = await collection.find_one({
            "username": userData.username,
            "id": {"$ne": userId}
        })
        if existingUsername:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=UserErrorMessages.USERNAME_ALREADY_TAKEN.value
            )
        updateData["username"] = userData.username
    
    if userData.email is not None:
        # Check if email already exists
        existingEmail: Optional[Dict[str, Any]] = await collection.find_one({
            "email": userData.email,
            "id": {"$ne": userId}
        })
        if existingEmail:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=UserErrorMessages.EMAIL_ALREADY_REGISTERED.value
            )
        updateData["email"] = userData.email
    
    if userData.firstname is not None:
        updateData["firstname"] = userData.firstname
    
    if userData.isActive is not None:
        updateData["isActive"] = userData.isActive
        # If deactivating user, invalidate all their tokens
        if not userData.isActive:
            await blacklist_all_user_tokens(userId, "admin_deactivation")
    
    if userData.isAdmin is not None:
        updateData["isAdmin"] = userData.isAdmin
    
    if userData.password is not None:
        updateData["hashedPassword"] = get_password_hash(userData.password)
        # If password changed, invalidate all tokens
        await blacklist_all_user_tokens(userId, "password_change")
    
    if updateData:
        updateData["updatedAt"] = datetime.now()
        await collection.update_one(
            {"id": userId},
            {"$set": updateData}
        )
    
    # Return updated user
    updatedUser: Optional[Dict[str, Any]] = await collection.find_one({"id": userId})
    return UserResponse(**updatedUser)


@router.delete("/users/{userId}")
async def delete_user(
    userId: int = Path(..., description="User ID"),
    adminUser: Annotated[UserModel, Depends(admin_required)] = None
):
    """Delete a user and all their associated data."""
    # Prevent admin from deleting themselves
    if userId == adminUser.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=UserErrorMessages.CANNOT_DELETE_OWN_ACCOUNT.value
        )
    
    usersCollection: Collection = db_manager.get_collection("users")
    user: Optional[Dict[str, Any]] = await usersCollection.find_one({"id": userId})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=UserErrorMessages.USER_NOT_FOUND.value
        )
    
    # Invalidate all user tokens
    await blacklist_all_user_tokens(userId, "account_deletion")
    
    # Delete user's cart
    cartsCollection: Collection = db_manager.get_collection("carts")
    await cartsCollection.delete_many({"userId": userId})
    
    # Delete user's wishlist
    wishlistsCollection: Collection = db_manager.get_collection("wishlists")
    await wishlistsCollection.delete_many({"userId": userId})
    
    # Delete user
    await usersCollection.delete_one({"id": userId})
    
    return get_success_response(SuccessMessages.USER_DELETED, userId=userId)


@router.post("/users/{userId}/deactivate")
async def deactivate_user(
    userId: int = Path(..., description="User ID"),
    adminUser: Annotated[UserModel, Depends(admin_required)] = None
):
    """Deactivate a user account and invalidate all their tokens."""
    if userId == adminUser.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=UserErrorMessages.CANNOT_DEACTIVATE_OWN_ACCOUNT.value
        )
    
    collection: Collection = db_manager.get_collection("users")
    user: Optional[Dict[str, Any]] = await collection.find_one({"id": userId})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=UserErrorMessages.USER_NOT_FOUND.value
        )
    
    # Deactivate user and invalidate tokens
    await collection.update_one(
        {"id": userId},
        {"$set": {"isActive": False, "updatedAt": datetime.now()}}
    )
    
    await blacklist_all_user_tokens(userId, "admin_deactivation")
    
    return get_success_response(SuccessMessages.USER_DEACTIVATED, userId=userId)


@router.post("/users/{userId}/activate")
async def activate_user(
    userId: int = Path(..., description="User ID"),
    adminUser: Annotated[UserModel, Depends(admin_required)] = None
):
    """Activate a user account."""
    # Prevent admin from activating their own account
    if userId == adminUser.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=UserErrorMessages.ADMIN_SELF_MANAGEMENT_FORBIDDEN.value
        )
    
    collection: Collection = db_manager.get_collection("users")
    user: Optional[Dict[str, Any]] = await collection.find_one({"id": userId})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=UserErrorMessages.USER_NOT_FOUND.value
        )
    
    await collection.update_one(
        {"id": userId},
        {"$set": {"isActive": True, "updatedAt": datetime.now()}}
    )
    
    return get_success_response(SuccessMessages.USER_ACTIVATED, userId=userId)


# ================== CART MANAGEMENT ==================

@router.get("/users/{userId}/cart", response_model=CartResponse)
async def get_user_cart(
    userId: int = Path(..., description="User ID"),
    adminUser: Annotated[UserModel, Depends(admin_required)] = None
):
    """Get a user's cart."""
    # Prevent admin from managing their own cart
    if userId == adminUser.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=UserErrorMessages.ADMIN_SELF_MANAGEMENT_FORBIDDEN.value
        )
    
    # Verify user exists
    usersCollection: Collection = db_manager.get_collection("users")
    user: Optional[Dict[str, Any]] = await usersCollection.find_one({"id": userId})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=UserErrorMessages.USER_NOT_FOUND.value
        )
    
    # Get cart
    cartsCollection: Collection = db_manager.get_collection("carts")
    cartDoc: Optional[Dict[str, Any]] = await cartsCollection.find_one({"userId": userId})
    
    if not cartDoc:
        # Return empty cart
        return CartResponse(
            userId=userId,
            items=[],
            totalItems=0,
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
    
    cart: CartModel = CartModel(**cartDoc)
    
    # Populate cart items with product details
    populatedItems: List[CartItemResponse] = []
    productsCollection: Collection = db_manager.get_collection("products")
    
    for item in cart.items:
        product: Optional[Dict[str, Any]] = await productsCollection.find_one({"id": item.productId})
        cartItemResponse: CartItemResponse = CartItemResponse(
            productId=item.productId,
            quantity=item.quantity,
            addedAt=item.addedAt,
            updatedAt=item.updatedAt,
            productName=product.get("name") if product else "Product Not Found",
            productPrice=product.get("price") if product else None,
            productImage=product.get("image") if product else None
        )
        populatedItems.append(cartItemResponse)
    
    return CartResponse(
        userId=cart.userId,
        items=populatedItems,
        totalItems=sum(item.quantity for item in cart.items),
        createdAt=cart.createdAt,
        updatedAt=cart.updatedAt
    )


@router.post("/users/{userId}/cart/items")
async def add_item_to_user_cart(
    userId: int = Path(..., description="User ID"),
    *,
    itemData: CartItemCreate,
    adminUser: Annotated[UserModel, Depends(admin_required)]
):
    """Add an item to a user's cart."""
    # Prevent admin from managing their own cart
    if userId == adminUser.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=UserErrorMessages.ADMIN_SELF_MANAGEMENT_FORBIDDEN.value
        )
    
    # Verify user exists
    usersCollection: Collection = db_manager.get_collection("users")
    user: Optional[Dict[str, Any]] = await usersCollection.find_one({"id": userId})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=UserErrorMessages.USER_NOT_FOUND.value
        )
    
    # Verify product exists
    productsCollection: Collection = db_manager.get_collection("products")
    product: Optional[Dict[str, Any]] = await productsCollection.find_one({"id": itemData.productId})
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ProductErrorMessages.PRODUCT_NOT_FOUND.value
        )
    
    # Get or create cart
    cartsCollection: Collection = db_manager.get_collection("carts")
    cartDoc: Optional[Dict[str, Any]] = await cartsCollection.find_one({"userId": userId})
    
    if cartDoc:
        cart: CartModel = CartModel(**cartDoc)
    else:
        cart: CartModel = CartModel(userId=userId, items=[])
    
    # Check if item already exists
    existingItemIndex: Optional[int] = None
    for i, item in enumerate(cart.items):
        if item.productId == itemData.productId:
            existingItemIndex = i
            break
    
    if existingItemIndex is not None:
        cart.items[existingItemIndex].quantity += itemData.quantity
    else:
        newItem: CartItem = CartItem(
            productId=itemData.productId,
            quantity=itemData.quantity,
            addedAt=datetime.now(),
            updatedAt=datetime.now()
        )
        cart.items.append(newItem)
    
    # Update cart
    cart.updatedAt = datetime.now()
    await cartsCollection.update_one(
        {"userId": userId},
        {"$set": cart.model_dump()},
        upsert=True
    )
    
    return get_success_response(SuccessMessages.ITEM_ADDED_TO_USER_CART)


@router.delete("/users/{userId}/cart/items/{productId}")
async def remove_item_from_user_cart(
    userId: int = Path(..., description="User ID"),
    productId: int = Path(..., description="Product ID"),
    adminUser: Annotated[UserModel, Depends(admin_required)] = None
):
    """Remove an item from a user's cart."""
    # Prevent admin from managing their own cart
    if userId == adminUser.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=UserErrorMessages.ADMIN_SELF_MANAGEMENT_FORBIDDEN.value
        )
    
    cartsCollection: Collection = db_manager.get_collection("carts")
    cartDoc: Optional[Dict[str, Any]] = await cartsCollection.find_one({"userId": userId})
    
    if not cartDoc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=CartErrorMessages.USER_CART_NOT_FOUND.value
        )
    
    cart: CartModel = CartModel(**cartDoc)
    
    # Remove item
    originalLength: int = len(cart.items)
    cart.items = [item for item in cart.items if item.productId != productId]
    
    if len(cart.items) == originalLength:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=CartErrorMessages.ITEM_NOT_FOUND_IN_CART.value
        )
    
    # Update cart
    cart.updatedAt = datetime.now()
    await cartsCollection.update_one(
        {"userId": userId},
        {"$set": cart.model_dump()}
    )
    
    return get_success_response(SuccessMessages.ITEM_REMOVED_FROM_USER_CART)


@router.put("/users/{userId}/cart/items/{productId}")
async def update_user_cart_item(
    userId: int = Path(..., description="User ID"),
    productId: int = Path(..., description="Original Product ID"),
    *,
    itemData: CartItemUpdate,
    adminUser: Annotated[UserModel, Depends(admin_required)]
):
    """Update cart item - can update quantity and/or replace with different product."""
    # Prevent admin from managing their own cart
    if userId == adminUser.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=UserErrorMessages.ADMIN_SELF_MANAGEMENT_FORBIDDEN.value
        )
    
    # Verify user exists
    usersCollection: Collection = db_manager.get_collection("users")
    user: Optional[Dict[str, Any]] = await usersCollection.find_one({"id": userId})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=UserErrorMessages.USER_NOT_FOUND.value
        )
    
    # Determine target product ID (could be different if product is being changed)
    targetProductId: int = itemData.productId if itemData.productId is not None else productId
    
    # Verify target product exists and check stock
    productsCollection: Collection = db_manager.get_collection("products")
    product: Optional[Dict[str, Any]] = await productsCollection.find_one({"id": targetProductId})
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ProductErrorMessages.PRODUCT_NOT_FOUND.value
        )
    
    if product["quantity"] < itemData.quantity:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=format_message(
                ProductErrorMessages.INSUFFICIENT_STOCK_UPDATE,
                requestedQuantity=itemData.quantity,
                stockQuantity=product["quantity"]
            )
        )
    
    # Get user's cart
    cartsCollection: Collection = db_manager.get_collection("carts")
    cartDoc: Optional[Dict[str, Any]] = await cartsCollection.find_one({"userId": userId})
    
    if not cartDoc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=CartErrorMessages.USER_CART_NOT_FOUND.value
        )
    
    cart: CartModel = CartModel(**cartDoc)
    
    # Find the original item to update
    itemFound: bool = False
    for item in cart.items:
        if item.productId == productId:
            # If changing product, check that new product isn't already in cart
            if itemData.productId is not None and itemData.productId != productId:
                # Check if target product already exists in cart
                for existingItem in cart.items:
                    if existingItem.productId == targetProductId:
                        raise HTTPException(
                            status_code=status.HTTP_409_CONFLICT,
                            detail=f"Product {targetProductId} is already in cart"
                        )
                # Update to new product
                item.productId = targetProductId
            
            # Update quantity
            item.quantity = itemData.quantity
            item.updatedAt = datetime.now()
            itemFound = True
            break
    
    if not itemFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=CartErrorMessages.ITEM_NOT_FOUND_IN_CART.value
        )
    
    # Update cart
    cart.updatedAt = datetime.now()
    await cartsCollection.update_one(
        {"userId": userId},
        {"$set": cart.model_dump()}
    )
    
    return get_success_response(SuccessMessages.CART_ITEM_UPDATED)


@router.delete("/users/{userId}/cart")
async def clear_user_cart(
    userId: int = Path(..., description="User ID"),
    adminUser: Annotated[UserModel, Depends(admin_required)] = None
):
    """Clear all items from a user's cart."""
    # Prevent admin from managing their own cart
    if userId == adminUser.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=UserErrorMessages.ADMIN_SELF_MANAGEMENT_FORBIDDEN.value
        )
    
    cartsCollection: Collection = db_manager.get_collection("carts")
    
    cart: CartModel = CartModel(userId=userId, items=[])
    cart.updatedAt = datetime.now()
    
    await cartsCollection.update_one(
        {"userId": userId},
        {"$set": cart.model_dump()},
        upsert=True
    )
    
    return get_success_response(SuccessMessages.USER_CART_CLEARED)


# ================== WISHLIST MANAGEMENT ==================

@router.get("/users/{userId}/wishlist", response_model=WishlistResponse)
async def get_user_wishlist(
    userId: int = Path(..., description="User ID"),
    adminUser: Annotated[UserModel, Depends(admin_required)] = None
):
    """Get a user's wishlist."""
    # Prevent admin from managing their own wishlist
    if userId == adminUser.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=UserErrorMessages.ADMIN_SELF_MANAGEMENT_FORBIDDEN.value
        )
    
    # Verify user exists
    usersCollection: Collection = db_manager.get_collection("users")
    user: Optional[Dict[str, Any]] = await usersCollection.find_one({"id": userId})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=UserErrorMessages.USER_NOT_FOUND.value
        )
    
    # Get wishlist
    wishlistsCollection: Collection = db_manager.get_collection("wishlists")
    wishlistDoc: Optional[Dict[str, Any]] = await wishlistsCollection.find_one({"userId": userId})
    
    if not wishlistDoc:
        return WishlistResponse(
            userId=userId,
            items=[],
            totalItems=0,
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
    
    wishlist: WishlistModel = WishlistModel(**wishlistDoc)
    
    # Populate wishlist items with product details
    populatedItems: List[WishlistItemResponse] = []
    productsCollection: Collection = db_manager.get_collection("products")
    
    for item in wishlist.items:
        product: Optional[Dict[str, Any]] = await productsCollection.find_one({"id": item.productId})
        wishlistItemResponse: WishlistItemResponse = WishlistItemResponse(
            productId=item.productId,
            addedAt=item.addedAt,
            productName=product.get("name") if product else "Product Not Found",
            productPrice=product.get("price") if product else None,
            productImage=product.get("image") if product else None
        )
        populatedItems.append(wishlistItemResponse)
    
    return WishlistResponse(
        userId=wishlist.userId,
        items=populatedItems,
        totalItems=len(wishlist.items),
        createdAt=wishlist.createdAt,
        updatedAt=wishlist.updatedAt
    )


@router.post("/users/{userId}/wishlist/items")
async def add_item_to_user_wishlist(
    userId: int = Path(..., description="User ID"),
    *,
    itemData: WishlistItemCreate,
    adminUser: Annotated[UserModel, Depends(admin_required)]
):
    """Add an item to a user's wishlist."""
    # Prevent admin from managing their own wishlist
    if userId == adminUser.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=UserErrorMessages.ADMIN_SELF_MANAGEMENT_FORBIDDEN.value
        )
    
    # Verify user exists
    usersCollection: Collection = db_manager.get_collection("users")
    user: Optional[Dict[str, Any]] = await usersCollection.find_one({"id": userId})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=UserErrorMessages.USER_NOT_FOUND.value
        )
    
    # Verify product exists
    productsCollection: Collection = db_manager.get_collection("products")
    product: Optional[Dict[str, Any]] = await productsCollection.find_one({"id": itemData.productId})
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ProductErrorMessages.PRODUCT_NOT_FOUND.value
        )
    
    # Get or create wishlist
    wishlistsCollection: Collection = db_manager.get_collection("wishlists")
    wishlistDoc: Optional[Dict[str, Any]] = await wishlistsCollection.find_one({"userId": userId})
    
    if wishlistDoc:
        wishlist: WishlistModel = WishlistModel(**wishlistDoc)
    else:
        wishlist: WishlistModel = WishlistModel(userId=userId, items=[])
    
    # Check if item already exists
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
    
    # Update wishlist
    wishlist.updatedAt = datetime.now()
    await wishlistsCollection.update_one(
        {"userId": userId},
        {"$set": wishlist.model_dump()},
        upsert=True
    )
    
    return get_success_response(SuccessMessages.ITEM_ADDED_TO_USER_WISHLIST)


@router.put("/users/{userId}/wishlist/items/{productId}")
async def update_user_wishlist_item(
    userId: int = Path(..., description="User ID"),
    productId: int = Path(..., description="Original Product ID"),
    *,
    itemData: WishlistItemUpdate,
    adminUser: Annotated[UserModel, Depends(admin_required)]
):
    """Update wishlist item - replace with different product."""
    # Prevent admin from managing their own wishlist
    if userId == adminUser.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=UserErrorMessages.ADMIN_SELF_MANAGEMENT_FORBIDDEN.value
        )
    
    # Verify user exists
    usersCollection: Collection = db_manager.get_collection("users")
    user: Optional[Dict[str, Any]] = await usersCollection.find_one({"id": userId})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=UserErrorMessages.USER_NOT_FOUND.value
        )
    
    # Verify new product exists
    productsCollection: Collection = db_manager.get_collection("products")
    product: Optional[Dict[str, Any]] = await productsCollection.find_one({"id": itemData.productId})
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=ProductErrorMessages.PRODUCT_NOT_FOUND.value
        )
    
    # Get user's wishlist
    wishlistsCollection: Collection = db_manager.get_collection("wishlists")
    wishlistDoc: Optional[Dict[str, Any]] = await wishlistsCollection.find_one({"userId": userId})
    
    if not wishlistDoc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=WishlistErrorMessages.USER_WISHLIST_NOT_FOUND.value
        )
    
    wishlist: WishlistModel = WishlistModel(**wishlistDoc)
    
    # Find the original item to update
    itemFound: bool = False
    for item in wishlist.items:
        if item.productId == productId:
            # Check if new product already exists in wishlist
            if itemData.productId != productId:
                for existingItem in wishlist.items:
                    if existingItem.productId == itemData.productId:
                        raise HTTPException(
                            status_code=status.HTTP_409_CONFLICT,
                            detail=f"Product {itemData.productId} is already in wishlist"
                        )
            
            # Update to new product
            item.productId = itemData.productId
            item.addedAt = datetime.now()  # Update timestamp since it's a new product
            itemFound = True
            break
    
    if not itemFound:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=WishlistErrorMessages.ITEM_NOT_FOUND_IN_WISHLIST.value
        )
    
    # Update wishlist
    wishlist.updatedAt = datetime.now()
    await wishlistsCollection.update_one(
        {"userId": userId},
        {"$set": wishlist.model_dump()}
    )
    
    return get_success_response(SuccessMessages.WISHLIST_ITEM_UPDATED)


@router.delete("/users/{userId}/wishlist/items/{productId}")
async def remove_item_from_user_wishlist(
    userId: int = Path(..., description="User ID"),
    productId: int = Path(..., description="Product ID"),
    adminUser: Annotated[UserModel, Depends(admin_required)] = None
):
    """Remove an item from a user's wishlist."""
    # Prevent admin from managing their own wishlist
    if userId == adminUser.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=UserErrorMessages.ADMIN_SELF_MANAGEMENT_FORBIDDEN.value
        )
    
    wishlistsCollection: Collection = db_manager.get_collection("wishlists")
    wishlistDoc: Optional[Dict[str, Any]] = await wishlistsCollection.find_one({"userId": userId})
    
    if not wishlistDoc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=WishlistErrorMessages.USER_WISHLIST_NOT_FOUND.value
        )
    
    wishlist: WishlistModel = WishlistModel(**wishlistDoc)
    
    # Remove item
    originalLength: int = len(wishlist.items)
    wishlist.items = [item for item in wishlist.items if item.productId != productId]
    
    if len(wishlist.items) == originalLength:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=WishlistErrorMessages.ITEM_NOT_FOUND_IN_WISHLIST.value
        )
    
    # Update wishlist
    wishlist.updatedAt = datetime.now()
    await wishlistsCollection.update_one(
        {"userId": userId},
        {"$set": wishlist.model_dump()}
    )
    
    return get_success_response(SuccessMessages.ITEM_REMOVED_FROM_USER_WISHLIST)


@router.delete("/users/{userId}/wishlist")
async def clear_user_wishlist(
    userId: int = Path(..., description="User ID"),
    adminUser: Annotated[UserModel, Depends(admin_required)] = None
):
    """Clear all items from a user's wishlist."""
    # Prevent admin from managing their own wishlist
    if userId == adminUser.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=UserErrorMessages.ADMIN_SELF_MANAGEMENT_FORBIDDEN.value
        )
    
    wishlistsCollection: Collection = db_manager.get_collection("wishlists")
    
    wishlist: WishlistModel = WishlistModel(userId=userId, items=[])
    wishlist.updatedAt = datetime.now()
    
    await wishlistsCollection.update_one(
        {"userId": userId},
        {"$set": wishlist.model_dump()},
        upsert=True
    )
    
    return get_success_response(SuccessMessages.USER_WISHLIST_CLEARED)

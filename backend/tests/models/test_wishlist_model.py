"""
Test WishlistModel functionality and validation.
"""
import pytest
from typing import Dict, Any, List
from datetime import datetime
from app.models.wishlist import WishlistModel, WishlistItem
from app.schemas.wishlist import WishlistResponse, WishlistItemCreate, WishlistItemResponse
from pydantic import ValidationError


class TestWishlistModel:
    """Test WishlistModel functionality."""

    def test_wishlist_model_creation(self) -> None:
        """Test creating a WishlistModel instance."""
        wishlistItem: WishlistItem = WishlistItem(
            productId=1,
            addedAt=datetime.now()
        )
        
        wishlist: WishlistModel = WishlistModel(
            userId=1,
            items=[wishlistItem],
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        assert wishlist.userId == 1
        assert len(wishlist.items) == 1
        assert wishlist.items[0].productId == 1

    def test_wishlist_model_empty_wishlist(self) -> None:
        """Test creating an empty wishlist."""
        wishlist: WishlistModel = WishlistModel(
            userId=1,
            items=[],
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        assert wishlist.userId == 1
        assert len(wishlist.items) == 0
        assert wishlist.items == []

    def test_wishlist_model_multiple_items(self) -> None:
        """Test wishlist with multiple items."""
        wishlistItems: List[WishlistItem] = [
            WishlistItem(productId=1, addedAt=datetime.now()),
            WishlistItem(productId=2, addedAt=datetime.now()),
            WishlistItem(productId=3, addedAt=datetime.now())
        ]
        
        wishlist: WishlistModel = WishlistModel(
            userId=1,
            items=wishlistItems,
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        assert len(wishlist.items) == 3
        assert wishlist.items[0].productId == 1
        assert wishlist.items[1].productId == 2
        assert wishlist.items[2].productId == 3

    def test_wishlist_model_to_dict(self) -> None:
        """Test converting WishlistModel to dictionary."""
        wishlistItem: WishlistItem = WishlistItem(
            productId=1,
            addedAt=datetime.now()
        )
        
        wishlist: WishlistModel = WishlistModel(
            userId=1,
            items=[wishlistItem],
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        wishlistDict: Dict[str, Any] = wishlist.model_dump()
        assert isinstance(wishlistDict, dict)
        assert wishlistDict["userId"] == 1
        assert len(wishlistDict["items"]) == 1
        assert wishlistDict["items"][0]["productId"] == 1

    def test_wishlist_model_defaults(self) -> None:
        """Test WishlistModel default values."""
        wishlist: WishlistModel = WishlistModel(userId=1)
        
        # Should have empty items by default
        assert wishlist.items == []
        assert wishlist.createdAt is not None
        assert wishlist.updatedAt is not None

    def test_wishlist_model_timestamps(self) -> None:
        """Test that timestamps are automatically set."""
        wishlist: WishlistModel = WishlistModel(userId=1)
        
        assert isinstance(wishlist.createdAt, datetime)
        assert isinstance(wishlist.updatedAt, datetime)
        # Timestamps should be very close to now
        now = datetime.now()
        assert abs((now - wishlist.createdAt).total_seconds()) < 1
        assert abs((now - wishlist.updatedAt).total_seconds()) < 1


class TestWishlistItem:
    """Test WishlistItem functionality."""

    def test_wishlist_item_creation(self) -> None:
        """Test creating a WishlistItem instance."""
        wishlistItem: WishlistItem = WishlistItem(
            productId=123,
            addedAt=datetime.now()
        )
        
        assert wishlistItem.productId == 123
        assert isinstance(wishlistItem.addedAt, datetime)

    def test_wishlist_item_to_dict(self) -> None:
        """Test converting WishlistItem to dictionary."""
        wishlistItem: WishlistItem = WishlistItem(
            productId=456,
            addedAt=datetime.now()
        )
        
        itemDict: Dict[str, Any] = wishlistItem.model_dump()
        assert isinstance(itemDict, dict)
        assert itemDict["productId"] == 456
        assert "addedAt" in itemDict

    def test_wishlist_item_defaults(self) -> None:
        """Test WishlistItem default values."""
        wishlistItem: WishlistItem = WishlistItem(productId=789)
        
        # addedAt should be set automatically
        assert wishlistItem.addedAt is not None
        assert isinstance(wishlistItem.addedAt, datetime)


class TestWishlistSchemas:
    """Test Wishlist Pydantic schemas."""

    def test_wishlist_item_create_valid(self) -> None:
        """Test creating a valid WishlistItemCreate schema."""
        itemData: Dict[str, int] = {
            "productId": 1
        }
        
        wishlistItem: WishlistItemCreate = WishlistItemCreate(**itemData)
        assert wishlistItem.productId == 1

    def test_wishlist_item_create_missing_product_id(self) -> None:
        """Test WishlistItemCreate with missing productId."""
        itemData: Dict[str, Any] = {}
        
        with pytest.raises(ValidationError):
            WishlistItemCreate(**itemData)

    def test_wishlist_item_response_serialization(self) -> None:
        """Test WishlistItemResponse serialization."""
        responseData: Dict[str, Any] = {
            "productId": 1,
            "addedAt": datetime.now().isoformat(),
            "productName": "Test Product",
            "productPrice": 99.99,
            "productImage": "https://example.com/image.jpg"
        }
        
        wishlistItem: WishlistItemResponse = WishlistItemResponse(**responseData)
        assert wishlistItem.productId == 1
        assert wishlistItem.productName == "Test Product"
        assert wishlistItem.productPrice == 99.99
        assert wishlistItem.productImage == "https://example.com/image.jpg"

    def test_wishlist_item_response_with_null_values(self) -> None:
        """Test WishlistItemResponse with null product details."""
        responseData: Dict[str, Any] = {
            "productId": 1,
            "addedAt": datetime.now().isoformat(),
            "productName": "Product Not Found",
            "productPrice": None,
            "productImage": None
        }
        
        wishlistItem: WishlistItemResponse = WishlistItemResponse(**responseData)
        assert wishlistItem.productId == 1
        assert wishlistItem.productName == "Product Not Found"
        assert wishlistItem.productPrice is None
        assert wishlistItem.productImage is None

    def test_wishlist_response_serialization(self) -> None:
        """Test WishlistResponse serialization."""
        responseData: Dict[str, Any] = {
            "userId": 1,
            "items": [],
            "totalItems": 0,
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat()
        }
        
        wishlist: WishlistResponse = WishlistResponse(**responseData)
        assert wishlist.userId == 1
        assert wishlist.items == []
        assert wishlist.totalItems == 0

    def test_wishlist_response_with_items(self) -> None:
        """Test WishlistResponse with items."""
        itemData: Dict[str, Any] = {
            "productId": 1,
            "addedAt": datetime.now().isoformat(),
            "productName": "Test Product",
            "productPrice": 99.99,
            "productImage": "https://example.com/image.jpg"
        }
        
        responseData: Dict[str, Any] = {
            "userId": 1,
            "items": [itemData],
            "totalItems": 1,
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat()
        }
        
        wishlist: WishlistResponse = WishlistResponse(**responseData)
        assert wishlist.userId == 1
        assert len(wishlist.items) == 1
        assert wishlist.totalItems == 1
        assert wishlist.items[0].productId == 1


class TestWishlistValidation:
    """Test wishlist validation rules."""

    def test_product_id_validation(self) -> None:
        """Test productId validation - no specific validation in schema."""
        # Valid productId
        itemData: Dict[str, int] = {
            "productId": 1
        }
        wishlistItem: WishlistItemCreate = WishlistItemCreate(**itemData)
        assert wishlistItem.productId == 1
        
        # Test zero productId (allowed by schema)
        itemData["productId"] = 0
        wishlistItem = WishlistItemCreate(**itemData)
        assert wishlistItem.productId == 0
        
        # Test negative productId (allowed by schema)
        itemData["productId"] = -1
        wishlistItem = WishlistItemCreate(**itemData)
        assert wishlistItem.productId == -1

    def test_user_id_validation(self) -> None:
        """Test userId validation in WishlistModel."""
        # Valid userId
        wishlist: WishlistModel = WishlistModel(userId=1)
        assert wishlist.userId == 1
        
        # Test that userId is required (this would be caught by Pydantic)
        with pytest.raises(ValidationError):
            WishlistModel()  # Missing required userId parameter

    def test_wishlist_uniqueness_simulation(self) -> None:
        """Test simulation of unique product constraint in wishlist."""
        # This simulates business logic that should prevent duplicate products
        wishlistItems: List[WishlistItem] = [
            WishlistItem(productId=1, addedAt=datetime.now()),
            WishlistItem(productId=2, addedAt=datetime.now())
        ]
        
        wishlist: WishlistModel = WishlistModel(
            userId=1,
            items=wishlistItems
        )
        
        # Simulate checking for duplicates before adding
        newProductId: int = 1  # This would be a duplicate
        existingProductIds = [item.productId for item in wishlist.items]
        
        # Business logic should prevent this
        assert newProductId in existingProductIds
        
        # Test with non-duplicate
        newProductId = 3
        assert newProductId not in existingProductIds


class TestWishlistItemComparison:
    """Test WishlistItem comparison and equality."""

    def test_wishlist_item_equality_by_product_id(self) -> None:
        """Test that items with same productId can be considered equal for business logic."""
        item1: WishlistItem = WishlistItem(productId=1, addedAt=datetime.now())
        item2: WishlistItem = WishlistItem(productId=1, addedAt=datetime.now())
        item3: WishlistItem = WishlistItem(productId=2, addedAt=datetime.now())
        
        # Items with same productId should have same productId (for duplicate checking)
        assert item1.productId == item2.productId
        assert item1.productId != item3.productId

    def test_wishlist_item_find_by_product_id(self) -> None:
        """Test finding items by productId (common operation)."""
        wishlistItems: List[WishlistItem] = [
            WishlistItem(productId=1, addedAt=datetime.now()),
            WishlistItem(productId=2, addedAt=datetime.now()),
            WishlistItem(productId=3, addedAt=datetime.now())
        ]
        
        # Find item by productId
        targetProductId: int = 2
        foundItem = next((item for item in wishlistItems if item.productId == targetProductId), None)
        
        assert foundItem is not None
        assert foundItem.productId == targetProductId
        
        # Test not found
        targetProductId = 999
        foundItem = next((item for item in wishlistItems if item.productId == targetProductId), None)
        assert foundItem is None

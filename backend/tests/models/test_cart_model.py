"""
Test CartModel functionality and validation.
"""
import pytest
from typing import Dict, Any, List
from datetime import datetime
from app.models.cart import CartModel, CartItem
from app.schemas.cart import CartResponse, CartItemCreate, CartItemResponse, CartItemUpdate
from pydantic import ValidationError


class TestCartModel:
    """Test CartModel functionality."""

    def test_cart_model_creation(self) -> None:
        """Test creating a CartModel instance."""
        cartItem: CartItem = CartItem(
            productId=1,
            quantity=2,
            addedAt=datetime.now()
        )
        
        cart: CartModel = CartModel(
            userId=1,
            items=[cartItem],
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        assert cart.userId == 1
        assert len(cart.items) == 1
        assert cart.items[0].productId == 1
        assert cart.items[0].quantity == 2

    def test_cart_model_empty_cart(self) -> None:
        """Test creating an empty cart."""
        cart: CartModel = CartModel(
            userId=1,
            items=[],
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        assert cart.userId == 1
        assert len(cart.items) == 0
        assert cart.items == []

    def test_cart_model_multiple_items(self) -> None:
        """Test cart with multiple items."""
        cartItems: List[CartItem] = [
            CartItem(productId=1, quantity=2, addedAt=datetime.now()),
            CartItem(productId=2, quantity=1, addedAt=datetime.now()),
            CartItem(productId=3, quantity=5, addedAt=datetime.now())
        ]
        
        cart: CartModel = CartModel(
            userId=1,
            items=cartItems,
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        assert len(cart.items) == 3
        assert cart.items[0].productId == 1
        assert cart.items[1].productId == 2
        assert cart.items[2].productId == 3
        assert cart.items[0].quantity == 2
        assert cart.items[1].quantity == 1
        assert cart.items[2].quantity == 5

    def test_cart_model_to_dict(self) -> None:
        """Test converting CartModel to dictionary."""
        cartItem: CartItem = CartItem(
            productId=1,
            quantity=3,
            addedAt=datetime.now()
        )
        
        cart: CartModel = CartModel(
            userId=1,
            items=[cartItem],
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        cartDict: Dict[str, Any] = cart.model_dump()
        assert isinstance(cartDict, dict)
        assert cartDict["userId"] == 1
        assert len(cartDict["items"]) == 1
        assert cartDict["items"][0]["productId"] == 1
        assert cartDict["items"][0]["quantity"] == 3

    def test_cart_model_defaults(self) -> None:
        """Test CartModel default values."""
        cart: CartModel = CartModel(userId=1)
        
        # Should have empty items by default
        assert cart.items == []
        assert cart.createdAt is not None
        assert cart.updatedAt is not None

    def test_cart_model_timestamps(self) -> None:
        """Test that timestamps are automatically set."""
        cart: CartModel = CartModel(userId=1)
        
        assert isinstance(cart.createdAt, datetime)
        assert isinstance(cart.updatedAt, datetime)
        # Timestamps should be very close to now
        now = datetime.now()
        assert abs((now - cart.createdAt).total_seconds()) < 1
        assert abs((now - cart.updatedAt).total_seconds()) < 1


class TestCartItem:
    """Test CartItem functionality."""

    def test_cart_item_creation(self) -> None:
        """Test creating a CartItem instance."""
        cartItem: CartItem = CartItem(
            productId=123,
            quantity=5,
            addedAt=datetime.now()
        )
        
        assert cartItem.productId == 123
        assert cartItem.quantity == 5
        assert isinstance(cartItem.addedAt, datetime)

    def test_cart_item_to_dict(self) -> None:
        """Test converting CartItem to dictionary."""
        cartItem: CartItem = CartItem(
            productId=456,
            quantity=2,
            addedAt=datetime.now()
        )
        
        itemDict: Dict[str, Any] = cartItem.model_dump()
        assert isinstance(itemDict, dict)
        assert itemDict["productId"] == 456
        assert itemDict["quantity"] == 2
        assert "addedAt" in itemDict

    def test_cart_item_defaults(self) -> None:
        """Test CartItem default values."""
        cartItem: CartItem = CartItem(productId=789, quantity=1)
        
        # addedAt should be set automatically
        assert cartItem.addedAt is not None
        assert isinstance(cartItem.addedAt, datetime)


class TestCartSchemas:
    """Test Cart Pydantic schemas."""

    def test_cart_item_create_valid(self) -> None:
        """Test creating a valid CartItemCreate schema."""
        itemData: Dict[str, int] = {
            "productId": 1,
            "quantity": 3
        }
        
        cartItem: CartItemCreate = CartItemCreate(**itemData)
        assert cartItem.productId == 1
        assert cartItem.quantity == 3

    def test_cart_item_create_invalid_quantity(self) -> None:
        """Test CartItemCreate with invalid quantity."""
        itemData: Dict[str, int] = {
            "productId": 1,
            "quantity": 0  # Invalid quantity (should be >= 1)
        }
        
        with pytest.raises(ValidationError):
            CartItemCreate(**itemData)
        
        # Test negative quantity
        itemData["quantity"] = -1
        with pytest.raises(ValidationError):
            CartItemCreate(**itemData)

    def test_cart_item_update_valid(self) -> None:
        """Test CartItemUpdate schema."""
        updateData: Dict[str, int] = {
            "quantity": 5
        }
        
        cartItemUpdate: CartItemUpdate = CartItemUpdate(**updateData)
        assert cartItemUpdate.quantity == 5

    def test_cart_item_update_invalid_quantity(self) -> None:
        """Test CartItemUpdate with invalid quantity."""
        updateData: Dict[str, int] = {
            "quantity": 0  # Invalid quantity
        }
        
        with pytest.raises(ValidationError):
            CartItemUpdate(**updateData)

    def test_cart_item_response_serialization(self) -> None:
        """Test CartItemResponse serialization."""
        responseData: Dict[str, Any] = {
            "productId": 1,
            "quantity": 2,
            "addedAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat(),
            "productName": "Test Product",
            "productPrice": 99.99,
            "productImage": "https://example.com/image.jpg"
        }
        
        cartItem: CartItemResponse = CartItemResponse(**responseData)
        assert cartItem.productId == 1
        assert cartItem.quantity == 2
        assert cartItem.productName == "Test Product"
        assert cartItem.productPrice == 99.99

    def test_cart_response_serialization(self) -> None:
        """Test CartResponse serialization."""
        responseData: Dict[str, Any] = {
            "userId": 1,
            "items": [],
            "totalItems": 0,
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat()
        }
        
        cart: CartResponse = CartResponse(**responseData)
        assert cart.userId == 1
        assert cart.items == []
        assert cart.totalItems == 0


class TestCartValidation:
    """Test cart validation rules."""

    def test_product_id_validation(self) -> None:
        """Test productId validation - no specific validation in schema."""
        # Valid productId
        itemData: Dict[str, int] = {
            "productId": 1,
            "quantity": 1
        }
        cartItem: CartItemCreate = CartItemCreate(**itemData)
        assert cartItem.productId == 1
        
        # Test zero productId (allowed by schema)
        itemData["productId"] = 0
        cartItem = CartItemCreate(**itemData)
        assert cartItem.productId == 0
        
        # Test negative productId (allowed by schema)
        itemData["productId"] = -1
        cartItem = CartItemCreate(**itemData)
        assert cartItem.productId == -1

    def test_quantity_bounds(self) -> None:
        """Test quantity validation bounds."""
        baseData: Dict[str, int] = {
            "productId": 1
        }
        
        # Valid quantities
        validQuantities = [1, 5, 10, 100]
        for quantity in validQuantities:
            itemData: Dict[str, int] = baseData.copy()
            itemData["quantity"] = quantity
            cartItem: CartItemCreate = CartItemCreate(**itemData)
            assert cartItem.quantity == quantity
        
        # Invalid quantities
        invalidQuantities = [0, -1, -10]
        for quantity in invalidQuantities:
            itemData = baseData.copy()
            itemData["quantity"] = quantity
            with pytest.raises(ValidationError):
                CartItemCreate(**itemData)

    def test_user_id_validation(self) -> None:
        """Test userId validation in CartModel."""
        # Valid userId
        cart: CartModel = CartModel(userId=1)
        assert cart.userId == 1
        
        # Test that userId is required (this would be caught by Pydantic)
        with pytest.raises(ValidationError):
            CartModel()  # Missing required userId parameter

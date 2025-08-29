"""
User cart management tests.
"""
import pytest
from typing import Dict, Any, List
from fastapi.testclient import TestClient
from app.models.enums.category import Category
from app.models.enums.inventoryStatus import InventoryStatus


class TestUserCartManagement:
    """Test user cart management functionality."""

    def test_get_own_cart_requires_authentication(self, client: TestClient) -> None:
        """Test getting cart requires authentication."""
        response = client.get("/api/cart")
        assert response.status_code == 401

    def test_get_empty_cart(self, client: TestClient, user_token: str) -> None:
        """Test getting empty cart for authenticated user."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        response = client.get("/api/cart", headers=headers)
        assert response.status_code == 200
        data: Dict[str, Any] = response.json()
        assert "userId" in data
        assert data["totalItems"] == 0
        assert len(data["items"]) == 0
        assert "createdAt" in data
        assert "updatedAt" in data

    def test_add_item_to_cart(self, client: TestClient, user_token: str, admin_token: str) -> None:
        """Test adding item to user's cart."""
        userHeaders: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        adminHeaders: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create a test product (admin required)
        productData: Dict[str, Any] = {
            "name": "User Cart Test Product",
            "description": "Product for user cart testing",
            "category": Category.ELECTRONICS.value,
            "price": 149.99,
            "quantity": 20,
            "shellId": 700,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        productResponse = client.post("/api/products", json=productData, headers=adminHeaders)
        productId: int = productResponse.json()["id"]
        
        # Add item to cart
        itemData: Dict[str, int] = {
            "productId": productId,
            "quantity": 3
        }
        response = client.post("/api/cart/items", json=itemData, headers=userHeaders)
        assert response.status_code == 201
        
        # Verify item was added
        response = client.get("/api/cart", headers=userHeaders)
        assert response.status_code == 200
        data: Dict[str, Any] = response.json()
        assert data["totalItems"] == 3
        assert len(data["items"]) == 1
        assert data["items"][0]["productId"] == productId
        assert data["items"][0]["quantity"] == 3

    def test_add_multiple_items_to_cart(self, client: TestClient, user_token: str, admin_token: str) -> None:
        """Test adding multiple different items to cart."""
        userHeaders: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        adminHeaders: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create multiple products
        productIds: List[int] = []
        for i in range(3):
            productData: Dict[str, Any] = {
                "name": f"Multi Item Product {i+1}",
                "description": f"Product {i+1} for multi-item testing",
                "category": Category.FITNESS.value,
                "price": 49.99 + i * 10,
                "quantity": 15,
                "shellId": 710 + i,
                "inventoryStatus": InventoryStatus.INSTOCK.value
            }
            productResponse = client.post("/api/products", json=productData, headers=adminHeaders)
            productIds.append(productResponse.json()["id"])
        
        # Add each product to cart with different quantities
        totalExpectedItems: int = 0
        for i, productId in enumerate(productIds):
            quantity: int = i + 2  # 2, 3, 4
            itemData: Dict[str, int] = {"productId": productId, "quantity": quantity}
            response = client.post("/api/cart/items", json=itemData, headers=userHeaders)
            assert response.status_code == 201
            totalExpectedItems += quantity
        
        # Verify all items are in cart
        response = client.get("/api/cart", headers=userHeaders)
        data: Dict[str, Any] = response.json()
        assert data["totalItems"] == totalExpectedItems  # 2 + 3 + 4 = 9
        assert len(data["items"]) == 3

    def test_update_cart_item_quantity(self, client: TestClient, user_token: str, admin_token: str) -> None:
        """Test updating quantity of item in cart."""
        userHeaders: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        adminHeaders: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create product and add to cart
        productData: Dict[str, Any] = {
            "name": "Update Quantity Product",
            "description": "Product for quantity update testing",
            "category": Category.CLOTHING.value,
            "price": 79.99,
            "quantity": 30,
            "shellId": 720,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        productResponse = client.post("/api/products", json=productData, headers=adminHeaders)
        productId: int = productResponse.json()["id"]
        
        # Add item to cart
        itemData: Dict[str, int] = {"productId": productId, "quantity": 2}
        client.post("/api/cart/items", json=itemData, headers=userHeaders)
        
        # Update quantity
        updateData: Dict[str, int] = {"quantity": 5}
        response = client.put(f"/api/cart/items/{productId}", json=updateData, headers=userHeaders)
        assert response.status_code == 200
        
        # Verify update
        response = client.get("/api/cart", headers=userHeaders)
        data: Dict[str, Any] = response.json()
        assert data["totalItems"] == 5
        assert data["items"][0]["quantity"] == 5

    def test_remove_item_from_cart(self, client: TestClient, user_token: str, admin_token: str) -> None:
        """Test removing item from cart."""
        userHeaders: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        adminHeaders: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create product and add to cart
        productData: Dict[str, Any] = {
            "name": "Remove Item Product",
            "description": "Product for removal testing",
            "category": Category.ACCESSORIES.value,
            "price": 39.99,
            "quantity": 25,
            "shellId": 730,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        productResponse = client.post("/api/products", json=productData, headers=adminHeaders)
        productId: int = productResponse.json()["id"]
        
        # Add item to cart
        itemData: Dict[str, int] = {"productId": productId, "quantity": 4}
        client.post("/api/cart/items", json=itemData, headers=userHeaders)
        
        # Remove item
        response = client.delete(f"/api/cart/items/{productId}", headers=userHeaders)
        assert response.status_code == 200
        
        # Verify removal
        response = client.get("/api/cart", headers=userHeaders)
        data: Dict[str, Any] = response.json()
        assert data["totalItems"] == 0
        assert len(data["items"]) == 0

    def test_clear_entire_cart(self, client: TestClient, user_token: str, admin_token: str) -> None:
        """Test clearing entire cart."""
        userHeaders: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        adminHeaders: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Add multiple items to cart
        productIds: List[int] = []
        for i in range(3):
            productData: Dict[str, Any] = {
                "name": f"Clear Cart Product {i+1}",
                "description": f"Product {i+1} for cart clearing",
                "category": Category.ELECTRONICS.value,
                "price": 99.99 + i * 25,
                "quantity": 20,
                "shellId": 740 + i,
                "inventoryStatus": InventoryStatus.INSTOCK.value
            }
            productResponse = client.post("/api/products", json=productData, headers=adminHeaders)
            productId: int = productResponse.json()["id"]
            
            # Add to cart
            itemData: Dict[str, int] = {"productId": productId, "quantity": 2}
            client.post("/api/cart/items", json=itemData, headers=userHeaders)
        
        # Verify cart has items
        response = client.get("/api/cart", headers=userHeaders)
        data: Dict[str, Any] = response.json()
        assert data["totalItems"] == 6  # 3 items ÁE2 each
        assert len(data["items"]) == 3
        
        # Clear cart
        response = client.delete("/api/cart", headers=userHeaders)
        assert response.status_code == 200
        
        # Verify cart is empty
        response = client.get("/api/cart", headers=userHeaders)
        data: Dict[str, Any] = response.json()
        assert data["totalItems"] == 0
        assert len(data["items"]) == 0

    def test_add_same_item_twice_updates_quantity(self, client: TestClient, user_token: str, admin_token: str) -> None:
        """Test adding same item twice updates quantity instead of creating duplicate."""
        userHeaders: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        adminHeaders: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create product
        productData: Dict[str, Any] = {
            "name": "Duplicate Add Product",
            "description": "Product for duplicate addition testing",
            "category": Category.FITNESS.value,
            "price": 69.99,
            "quantity": 50,
            "shellId": 750,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        productResponse = client.post("/api/products", json=productData, headers=adminHeaders)
        productId: int = productResponse.json()["id"]
        
        # Add item first time
        itemData: Dict[str, int] = {"productId": productId, "quantity": 3}
        response = client.post("/api/cart/items", json=itemData, headers=userHeaders)
        assert response.status_code == 201
        
        # Add same item again
        itemData = {"productId": productId, "quantity": 2}
        response = client.post("/api/cart/items", json=itemData, headers=userHeaders)
        # Should either update quantity or return appropriate response
        assert response.status_code in [200, 201]
        
        # Verify only one item exists with combined quantity
        response = client.get("/api/cart", headers=userHeaders)
        data: Dict[str, Any] = response.json()
        assert len(data["items"]) == 1
        # Quantity should be updated (could be 5 if additive, or 2 if replaced)
        assert data["items"][0]["quantity"] in [2, 5]

    def test_cart_operations_with_invalid_product(self, client: TestClient, user_token: str) -> None:
        """Test cart operations with non-existent product."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        
        # Try adding non-existent product
        itemData: Dict[str, int] = {"productId": 99999, "quantity": 1}
        response = client.post("/api/cart/items", json=itemData, headers=headers)
        assert response.status_code == 404
        
        # Try updating non-existent item
        updateData: Dict[str, int] = {"quantity": 2}
        response = client.put("/api/cart/items/99999", json=updateData, headers=headers)
        assert response.status_code == 404
        
        # Try removing non-existent item
        response = client.delete("/api/cart/items/99999", headers=headers)
        assert response.status_code == 404

    def test_cart_operations_with_invalid_quantity(self, client: TestClient, user_token: str, admin_token: str) -> None:
        """Test cart operations with invalid quantities."""
        userHeaders: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        adminHeaders: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create product
        productData: Dict[str, Any] = {
            "name": "Invalid Quantity Product",
            "description": "Product for invalid quantity testing",
            "category": Category.ELECTRONICS.value,
            "price": 129.99,
            "quantity": 10,
            "shellId": 760,
            "inventoryStatus": InventoryStatus.LOWSTOCK.value
        }
        productResponse = client.post("/api/products", json=productData, headers=adminHeaders)
        productId: int = productResponse.json()["id"]
        
        # Try adding with zero quantity
        itemData: Dict[str, int] = {"productId": productId, "quantity": 0}
        response = client.post("/api/cart/items", json=itemData, headers=userHeaders)
        assert response.status_code == 422  # Validation error
        
        # Try adding with negative quantity
        itemData = {"productId": productId, "quantity": -1}
        response = client.post("/api/cart/items", json=itemData, headers=userHeaders)
        assert response.status_code == 422  # Validation error

    def test_cart_isolation_between_users(self, client: TestClient, admin_token: str) -> None:
        """Test that user carts are properly isolated."""
        adminHeaders: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create two test users
        user1Data: Dict[str, str] = {
            "username": "cartuser1",
            "firstname": "Cart",
            "email": "cartuser1@example.com",
            "password": "TestPass123!"
        }
        user1Response = client.post("/api/account", json=user1Data)
        
        user2Data: Dict[str, str] = {
            "username": "cartuser2",
            "firstname": "Cart",
            "email": "cartuser2@example.com",
            "password": "TestPass123!"
        }
        user2Response = client.post("/api/account", json=user2Data)
        
        # Login both users to get tokens
        loginData1: Dict[str, str] = {"username": "cartuser1@example.com", "password": "TestPass123!"}
        token1Response = client.post("/api/token", data=loginData1)
        user1Token: str = token1Response.json()["access_token"]
        
        loginData2: Dict[str, str] = {"username": "cartuser2@example.com", "password": "TestPass123!"}
        token2Response = client.post("/api/token", data=loginData2)
        user2Token: str = token2Response.json()["access_token"]
        
        user1Headers: Dict[str, str] = {"Authorization": f"Bearer {user1Token}"}
        user2Headers: Dict[str, str] = {"Authorization": f"Bearer {user2Token}"}
        
        # Create a product
        productData: Dict[str, Any] = {
            "name": "Isolation Test Product",
            "description": "Product for cart isolation testing",
            "category": Category.CLOTHING.value,
            "price": 59.99,
            "quantity": 30,
            "shellId": 770,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        productResponse = client.post("/api/products", json=productData, headers=adminHeaders)
        productId: int = productResponse.json()["id"]
        
        # Add item to user1's cart only
        itemData: Dict[str, int] = {"productId": productId, "quantity": 3}
        client.post("/api/cart/items", json=itemData, headers=user1Headers)
        
        # Verify user1 has the item
        response = client.get("/api/cart", headers=user1Headers)
        data: Dict[str, Any] = response.json()
        assert data["totalItems"] == 3
        assert len(data["items"]) == 1
        
        # Verify user2's cart is empty
        response = client.get("/api/cart", headers=user2Headers)
        data = response.json()
        assert data["totalItems"] == 0
        assert len(data["items"]) == 0

    def test_cart_persistence_across_sessions(self, client: TestClient, admin_token: str) -> None:
        """Test that cart persists for the user."""
        adminHeaders: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test user
        userData: Dict[str, str] = {
            "username": "persistenceuser",
            "firstname": "Persistence",
            "email": "persistence@example.com",
            "password": "TestPass123!"
        }
        client.post("/api/account", json=userData)
        
        # Login user
        loginData: Dict[str, str] = {"username": "persistence@example.com", "password": "TestPass123!"}
        tokenResponse = client.post("/api/token", data=loginData)
        userToken: str = tokenResponse.json()["access_token"]
        userHeaders: Dict[str, str] = {"Authorization": f"Bearer {userToken}"}
        
        # Create product and add to cart
        productData: Dict[str, Any] = {
            "name": "Persistence Test Product",
            "description": "Product for persistence testing",
            "category": Category.ACCESSORIES.value,
            "price": 44.99,
            "quantity": 15,
            "shellId": 780,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        productResponse = client.post("/api/products", json=productData, headers=adminHeaders)
        productId: int = productResponse.json()["id"]
        
        itemData: Dict[str, int] = {"productId": productId, "quantity": 2}
        client.post("/api/cart/items", json=itemData, headers=userHeaders)
        
        # Verify cart has the item
        response = client.get("/api/cart", headers=userHeaders)
        assert response.status_code == 200
        data: Dict[str, Any] = response.json()
        assert data["totalItems"] == 2
        assert len(data["items"]) == 1
        assert data["items"][0]["productId"] == productId
        
        # Create another session with same user credentials
        newTokenResponse = client.post("/api/token", data=loginData)
        newUserToken: str = newTokenResponse.json()["access_token"]
        newUserHeaders: Dict[str, str] = {"Authorization": f"Bearer {newUserToken}"}
        
        # Verify cart still has the item in new session
        response = client.get("/api/cart", headers=newUserHeaders)
        assert response.status_code == 200
        data = response.json()
        assert data["totalItems"] == 2
        assert len(data["items"]) == 1
        assert data["items"][0]["productId"] == productId

    def test_cart_update_timestamps(self, client: TestClient, user_token: str, admin_token: str) -> None:
        """Test that cart timestamps are properly updated."""
        userHeaders: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        adminHeaders: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Get initial cart (empty)
        response = client.get("/api/cart", headers=userHeaders)
        initialData: Dict[str, Any] = response.json()
        initialUpdatedAt: str = initialData["updatedAt"]
        
        # Create product and add to cart
        productData: Dict[str, Any] = {
            "name": "Timestamp Test Product",
            "description": "Product for timestamp testing",
            "category": Category.FITNESS.value,
            "price": 89.99,
            "quantity": 25,
            "shellId": 790,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        productResponse = client.post("/api/products", json=productData, headers=adminHeaders)
        productId: int = productResponse.json()["id"]
        
        itemData: Dict[str, int] = {"productId": productId, "quantity": 1}
        client.post("/api/cart/items", json=itemData, headers=userHeaders)
        
        # Verify updatedAt changed
        response = client.get("/api/cart", headers=userHeaders)
        updatedData: Dict[str, Any] = response.json()
        assert updatedData["updatedAt"] != initialUpdatedAt

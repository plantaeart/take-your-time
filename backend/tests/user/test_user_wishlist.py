"""
User wishlist management tests.
"""
import pytest
from typing import Dict, Any, List
from fastapi.testclient import TestClient
from app.models.enums.category import Category
from app.models.enums.inventoryStatus import InventoryStatus


class TestUserWishlistManagement:
    """Test user wishlist management functionality."""

    def test_get_own_wishlist_requires_authentication(self, client: TestClient) -> None:
        """Test getting wishlist requires authentication."""
        response = client.get("/api/wishlist")
        assert response.status_code == 401

    def test_get_empty_wishlist(self, client: TestClient, user_token: str) -> None:
        """Test getting empty wishlist for authenticated user."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        response = client.get("/api/wishlist", headers=headers)
        assert response.status_code == 200
        data: Dict[str, Any] = response.json()
        assert "userId" in data
        assert len(data["items"]) == 0
        assert "createdAt" in data
        assert "updatedAt" in data

    def test_add_item_to_wishlist(self, client: TestClient, user_token: str, admin_token: str) -> None:
        """Test adding item to user's wishlist."""
        userHeaders: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        adminHeaders: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create a test product (admin required)
        productData: Dict[str, Any] = {
            "name": "User Wishlist Test Product",
            "description": "Product for user wishlist testing",
            "category": Category.ELECTRONICS.value,
            "price": 299.99,
            "quantity": 15,
            "shellId": 800,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        productResponse = client.post("/api/products", json=productData, headers=adminHeaders)
        productId: int = productResponse.json()["id"]
        
        # Add item to wishlist
        itemData: Dict[str, int] = {"productId": productId}
        response = client.post("/api/wishlist/items", json=itemData, headers=userHeaders)
        assert response.status_code == 201
        
        # Verify item was added
        response = client.get("/api/wishlist", headers=userHeaders)
        assert response.status_code == 200
        data: Dict[str, Any] = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["productId"] == productId

    def test_add_multiple_items_to_wishlist(self, client: TestClient, user_token: str, admin_token: str) -> None:
        """Test adding multiple different items to wishlist."""
        userHeaders: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        adminHeaders: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create multiple products
        productIds: List[int] = []
        for i in range(4):
            productData: Dict[str, Any] = {
                "name": f"Multi Wishlist Product {i+1}",
                "description": f"Product {i+1} for multi-wishlist testing",
                "category": Category.CLOTHING.value,
                "price": 89.99 + i * 15,
                "quantity": 20,
                "shellId": 810 + i,
                "inventoryStatus": InventoryStatus.INSTOCK.value
            }
            productResponse = client.post("/api/products", json=productData, headers=adminHeaders)
            productIds.append(productResponse.json()["id"])
        
        # Add each product to wishlist
        for productId in productIds:
            itemData: Dict[str, int] = {"productId": productId}
            response = client.post("/api/wishlist/items", json=itemData, headers=userHeaders)
            assert response.status_code == 201
        
        # Verify all items are in wishlist
        response = client.get("/api/wishlist", headers=userHeaders)
        data: Dict[str, Any] = response.json()
        assert len(data["items"]) == 4
        
        # Verify all product IDs are present
        wishlistProductIds: List[int] = [item["productId"] for item in data["items"]]
        for productId in productIds:
            assert productId in wishlistProductIds

    def test_remove_item_from_wishlist(self, client: TestClient, user_token: str, admin_token: str) -> None:
        """Test removing item from wishlist."""
        userHeaders: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        adminHeaders: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create product and add to wishlist
        productData: Dict[str, Any] = {
            "name": "Remove Wishlist Product",
            "description": "Product for wishlist removal testing",
            "category": Category.FITNESS.value,
            "price": 149.99,
            "quantity": 10,
            "shellId": 820,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        productResponse = client.post("/api/products", json=productData, headers=adminHeaders)
        productId: int = productResponse.json()["id"]
        
        # Add item to wishlist
        itemData: Dict[str, int] = {"productId": productId}
        client.post("/api/wishlist/items", json=itemData, headers=userHeaders)
        
        # Remove item
        response = client.delete(f"/api/wishlist/items/{productId}", headers=userHeaders)
        assert response.status_code == 200
        
        # Verify removal
        response = client.get("/api/wishlist", headers=userHeaders)
        data: Dict[str, Any] = response.json()
        assert len(data["items"]) == 0

    def test_clear_entire_wishlist(self, client: TestClient, user_token: str, admin_token: str) -> None:
        """Test clearing entire wishlist."""
        userHeaders: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        adminHeaders: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Add multiple items to wishlist
        productIds: List[int] = []
        for i in range(3):
            productData: Dict[str, Any] = {
                "name": f"Clear Wishlist Product {i+1}",
                "description": f"Product {i+1} for wishlist clearing",
                "category": Category.ACCESSORIES.value,
                "price": 29.99 + i * 10,
                "quantity": 25,
                "shellId": 830 + i,
                "inventoryStatus": InventoryStatus.INSTOCK.value
            }
            productResponse = client.post("/api/products", json=productData, headers=adminHeaders)
            productId: int = productResponse.json()["id"]
            
            # Add to wishlist
            itemData: Dict[str, int] = {"productId": productId}
            client.post("/api/wishlist/items", json=itemData, headers=userHeaders)
        
        # Verify wishlist has items
        response = client.get("/api/wishlist", headers=userHeaders)
        data: Dict[str, Any] = response.json()
        assert len(data["items"]) == 3
        
        # Clear wishlist
        response = client.delete("/api/wishlist", headers=userHeaders)
        assert response.status_code == 200
        
        # Verify wishlist is empty
        response = client.get("/api/wishlist", headers=userHeaders)
        data = response.json()
        assert len(data["items"]) == 0

    def test_add_duplicate_item_to_wishlist(self, client: TestClient, user_token: str, admin_token: str) -> None:
        """Test adding duplicate item to wishlist."""
        userHeaders: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        adminHeaders: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create product
        productData: Dict[str, Any] = {
            "name": "Duplicate Wishlist Product",
            "description": "Product for duplicate wishlist testing",
            "category": Category.ELECTRONICS.value,
            "price": 199.99,
            "quantity": 30,
            "shellId": 840,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        productResponse = client.post("/api/products", json=productData, headers=adminHeaders)
        productId: int = productResponse.json()["id"]
        
        # Add item first time
        itemData: Dict[str, int] = {"productId": productId}
        response = client.post("/api/wishlist/items", json=itemData, headers=userHeaders)
        assert response.status_code == 201
        
        # Try adding same item again
        response = client.post("/api/wishlist/items", json=itemData, headers=userHeaders)
        # Should return 400 for duplicate item
        assert response.status_code == 400
        assert "already in wishlist" in response.json()["detail"].lower()
        
        # Verify only one item exists
        response = client.get("/api/wishlist", headers=userHeaders)
        data: Dict[str, Any] = response.json()
        assert len(data["items"]) == 1

    def test_wishlist_operations_with_invalid_product(self, client: TestClient, user_token: str) -> None:
        """Test wishlist operations with non-existent product."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        
        # Try adding non-existent product
        itemData: Dict[str, int] = {"productId": 99999}
        response = client.post("/api/wishlist/items", json=itemData, headers=headers)
        assert response.status_code == 404
        
        # Try removing non-existent item
        response = client.delete("/api/wishlist/items/99999", headers=headers)
        assert response.status_code == 404

    def test_wishlist_isolation_between_users(self, client: TestClient, admin_token: str) -> None:
        """Test that user wishlists are properly isolated."""
        adminHeaders: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create two test users
        user1Data: Dict[str, str] = {
            "username": "wishlistuser1",
            "firstname": "Wishlist",
            "email": "wishlistuser1@example.com",
            "password": "testpassword"
        }
        client.post("/api/account", json=user1Data)
        
        user2Data: Dict[str, str] = {
            "username": "wishlistuser2",
            "firstname": "Wishlist",
            "email": "wishlistuser2@example.com",
            "password": "testpassword"
        }
        client.post("/api/account", json=user2Data)
        
        # Login both users to get tokens
        loginData1: Dict[str, str] = {"username": "wishlistuser1@example.com", "password": "testpassword"}
        token1Response = client.post("/api/token", data=loginData1)
        user1Token: str = token1Response.json()["access_token"]
        
        loginData2: Dict[str, str] = {"username": "wishlistuser2@example.com", "password": "testpassword"}
        token2Response = client.post("/api/token", data=loginData2)
        user2Token: str = token2Response.json()["access_token"]
        
        user1Headers: Dict[str, str] = {"Authorization": f"Bearer {user1Token}"}
        user2Headers: Dict[str, str] = {"Authorization": f"Bearer {user2Token}"}
        
        # Create a product
        productData: Dict[str, Any] = {
            "name": "Wishlist Isolation Product",
            "description": "Product for wishlist isolation testing",
            "category": Category.FITNESS.value,
            "price": 119.99,
            "quantity": 40,
            "shellId": 850,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        productResponse = client.post("/api/products", json=productData, headers=adminHeaders)
        productId: int = productResponse.json()["id"]
        
        # Add item to user1's wishlist only
        itemData: Dict[str, int] = {"productId": productId}
        client.post("/api/wishlist/items", json=itemData, headers=user1Headers)
        
        # Verify user1 has the item
        response = client.get("/api/wishlist", headers=user1Headers)
        data: Dict[str, Any] = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["productId"] == productId
        
        # Verify user2's wishlist is empty
        response = client.get("/api/wishlist", headers=user2Headers)
        data = response.json()
        assert len(data["items"]) == 0

    def test_wishlist_persistence_across_sessions(self, client: TestClient, admin_token: str) -> None:
        """Test that wishlist persists for the user."""
        adminHeaders: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test user
        userData: Dict[str, str] = {
            "username": "wishlistpersistenceuser",
            "firstname": "Persistence",
            "email": "wishlistpersistence@example.com",
            "password": "testpassword"
        }
        client.post("/api/account", json=userData)
        
        # Login user
        loginData: Dict[str, str] = {"username": "wishlistpersistence@example.com", "password": "testpassword"}
        tokenResponse = client.post("/api/token", data=loginData)
        userToken: str = tokenResponse.json()["access_token"]
        userHeaders: Dict[str, str] = {"Authorization": f"Bearer {userToken}"}
        
        # Create product and add to wishlist
        productData: Dict[str, Any] = {
            "name": "Wishlist Persistence Product",
            "description": "Product for wishlist persistence testing",
            "category": Category.CLOTHING.value,
            "price": 79.99,
            "quantity": 12,
            "shellId": 860,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        productResponse = client.post("/api/products", json=productData, headers=adminHeaders)
        productId: int = productResponse.json()["id"]
        
        itemData: Dict[str, int] = {"productId": productId}
        client.post("/api/wishlist/items", json=itemData, headers=userHeaders)
        
        # Verify wishlist has the item
        response = client.get("/api/wishlist", headers=userHeaders)
        assert response.status_code == 200
        data: Dict[str, Any] = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["productId"] == productId
        
        # Create another session with same user credentials
        newTokenResponse = client.post("/api/token", data=loginData)
        newUserToken: str = newTokenResponse.json()["access_token"]
        newUserHeaders: Dict[str, str] = {"Authorization": f"Bearer {newUserToken}"}
        
        # Verify wishlist still has the item in new session
        response = client.get("/api/wishlist", headers=newUserHeaders)
        assert response.status_code == 200
        data = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["productId"] == productId

    def test_move_item_from_wishlist_to_cart(self, client: TestClient, user_token: str, admin_token: str) -> None:
        """Test moving item from wishlist to cart."""
        userHeaders: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        adminHeaders: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create product and add to wishlist
        productData: Dict[str, Any] = {
            "name": "Move to Cart Product",
            "description": "Product for wishlist to cart testing",
            "category": Category.ACCESSORIES.value,
            "price": 69.99,
            "quantity": 18,
            "shellId": 870,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        productResponse = client.post("/api/products", json=productData, headers=adminHeaders)
        productId: int = productResponse.json()["id"]
        
        # Add to wishlist
        itemData: Dict[str, int] = {"productId": productId}
        client.post("/api/wishlist/items", json=itemData, headers=userHeaders)
        
        # Verify item is in wishlist
        response = client.get("/api/wishlist", headers=userHeaders)
        data: Dict[str, Any] = response.json()
        assert len(data["items"]) == 1
        
        # Add to cart (simulating move)
        cartItemData: Dict[str, int] = {"productId": productId, "quantity": 2}
        client.post("/api/cart/items", json=cartItemData, headers=userHeaders)
        
        # Remove from wishlist
        client.delete(f"/api/wishlist/items/{productId}", headers=userHeaders)
        
        # Verify item is now in cart but not in wishlist
        cartResponse = client.get("/api/cart", headers=userHeaders)
        cartData: Dict[str, Any] = cartResponse.json()
        assert cartData["totalItems"] == 2
        assert len(cartData["items"]) == 1
        
        wishlistResponse = client.get("/api/wishlist", headers=userHeaders)
        wishlistData: Dict[str, Any] = wishlistResponse.json()
        assert len(wishlistData["items"]) == 0

    def test_wishlist_update_timestamps(self, client: TestClient, user_token: str, admin_token: str) -> None:
        """Test that wishlist timestamps are properly updated."""
        userHeaders: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        adminHeaders: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Get initial wishlist (empty)
        response = client.get("/api/wishlist", headers=userHeaders)
        initialData: Dict[str, Any] = response.json()
        initialUpdatedAt: str = initialData["updatedAt"]
        
        # Create product and add to wishlist
        productData: Dict[str, Any] = {
            "name": "Wishlist Timestamp Product",
            "description": "Product for wishlist timestamp testing",
            "category": Category.ELECTRONICS.value,
            "price": 249.99,
            "quantity": 8,
            "shellId": 880,
            "inventoryStatus": InventoryStatus.LOWSTOCK.value
        }
        productResponse = client.post("/api/products", json=productData, headers=adminHeaders)
        productId: int = productResponse.json()["id"]
        
        itemData: Dict[str, int] = {"productId": productId}
        client.post("/api/wishlist/items", json=itemData, headers=userHeaders)
        
        # Verify updatedAt changed
        response = client.get("/api/wishlist", headers=userHeaders)
        updatedData: Dict[str, Any] = response.json()
        assert updatedData["updatedAt"] != initialUpdatedAt

    def test_wishlist_with_out_of_stock_products(self, client: TestClient, user_token: str, admin_token: str) -> None:
        """Test adding out of stock products to wishlist."""
        userHeaders: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        adminHeaders: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create out of stock product
        productData: Dict[str, Any] = {
            "name": "Out of Stock Wishlist Product",
            "description": "Out of stock product for wishlist testing",
            "category": Category.FITNESS.value,
            "price": 159.99,
            "quantity": 0,
            "shellId": 890,
            "inventoryStatus": InventoryStatus.OUTOFSTOCK.value
        }
        productResponse = client.post("/api/products", json=productData, headers=adminHeaders)
        productId: int = productResponse.json()["id"]
        
        # Should be able to add out of stock items to wishlist
        itemData: Dict[str, int] = {"productId": productId}
        response = client.post("/api/wishlist/items", json=itemData, headers=userHeaders)
        assert response.status_code == 201
        
        # Verify item was added
        response = client.get("/api/wishlist", headers=userHeaders)
        data: Dict[str, Any] = response.json()
        assert len(data["items"]) == 1
        assert data["items"][0]["productId"] == productId

    def test_wishlist_item_product_details(self, client: TestClient, user_token: str, admin_token: str) -> None:
        """Test that wishlist items include product details."""
        userHeaders: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        adminHeaders: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create product
        productData: Dict[str, Any] = {
            "name": "Detailed Wishlist Product",
            "description": "Product with details for wishlist testing",
            "category": Category.CLOTHING.value,
            "price": 99.99,
            "quantity": 20,
            "shellId": 900,
            "inventoryStatus": InventoryStatus.INSTOCK.value,
            "rating": 4.5
        }
        productResponse = client.post("/api/products", json=productData, headers=adminHeaders)
        productId: int = productResponse.json()["id"]
        
        # Add to wishlist
        itemData: Dict[str, int] = {"productId": productId}
        client.post("/api/wishlist/items", json=itemData, headers=userHeaders)
        
        # Get wishlist and verify product details are included
        response = client.get("/api/wishlist", headers=userHeaders)
        data: Dict[str, Any] = response.json()
        assert len(data["items"]) == 1
        
        item: Dict[str, Any] = data["items"][0]
        assert item["productId"] == productId
        # Depending on implementation, product details might be included
        # This test can be adjusted based on actual API response structure

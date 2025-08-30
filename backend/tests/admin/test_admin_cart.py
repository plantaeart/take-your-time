"""
Admin cart management tests.
"""
import pytest
from typing import Dict, Any, List
from fastapi.testclient import TestClient
from app.models.enums.category import Category
from app.models.enums.inventoryStatus import InventoryStatus
from app.models.enums.http_status import HTTPStatus


class TestAdminCartManagement:
    """Test admin cart management functionality."""

    def test_get_user_cart_admin_required(self, client: TestClient) -> None:
        """Test getting user cart requires admin privileges."""
        response = client.get("/api/admin/users/1/cart")
        assert response.status_code == HTTPStatus.UNAUTHORIZED.value

    def test_get_user_cart_regular_user_forbidden(self, client: TestClient, user_token: str) -> None:
        """Test regular users cannot access other users' carts."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        response = client.get("/api/admin/users/1/cart", headers=headers)
        assert response.status_code == HTTPStatus.FORBIDDEN.value

    def test_get_user_cart_admin_success(self, client: TestClient, admin_token: str) -> None:
        """Test admin can successfully get any user's cart."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create a test user first
        userData: Dict[str, str] = {
            "username": "cartuser",
            "firstname": "Cart",
            "email": "cartuser@example.com",
            "password": "TestPass123!"
        }
        userResponse = client.post("/api/account", json=userData)
        userId: int = userResponse.json()["id"]
        
        # Get the user's cart (should be empty initially)
        response = client.get(f"/api/admin/users/{userId}/cart", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        cartData: Dict[str, Any] = response.json()
        assert cartData["userId"] == userId
        assert cartData["totalItems"] == 0
        assert len(cartData["items"]) == 0

    def test_get_user_cart_not_found(self, client: TestClient, admin_token: str) -> None:
        """Test getting cart for non-existent user."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        response = client.get("/api/admin/users/99999/cart", headers=headers)
        assert response.status_code == HTTPStatus.NOT_FOUND.value

    def test_add_item_to_user_cart_admin(self, client: TestClient, admin_token: str) -> None:
        """Test admin can add items to any user's cart."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create a test user
        userData: Dict[str, str] = {
            "username": "cartadduser",
            "firstname": "CartAdd",
            "email": "cartadd@example.com",
            "password": "TestPass123!"
        }
        userResponse = client.post("/api/account", json=userData)
        userId: int = userResponse.json()["id"]
        
        # Create a test product
        productData: Dict[str, Any] = {
            "name": "Cart Test Product",
            "description": "Product for cart testing",
            "category": Category.ELECTRONICS.value,
            "price": 99.99,
            "quantity": 10,
            "shellId": 500,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        productResponse = client.post("/api/products", json=productData, headers=headers)
        productId: int = productResponse.json()["id"]
        
        # Add item to user's cart
        itemData: Dict[str, int] = {
            "productId": productId,
            "quantity": 2
        }
        response = client.post(f"/api/admin/users/{userId}/cart/items", json=itemData, headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        # Verify item was added
        response = client.get(f"/api/admin/users/{userId}/cart", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        cartData: Dict[str, Any] = response.json()
        assert cartData["totalItems"] == 2
        assert len(cartData["items"]) == 1
        assert cartData["items"][0]["productId"] == productId
        assert cartData["items"][0]["quantity"] == 2

    def test_update_user_cart_item_admin(self, client: TestClient, admin_token: str) -> None:
        """Test admin can update items in any user's cart."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test user and product
        userData: Dict[str, str] = {
            "username": "cartupdateuser",
            "firstname": "CartUpdate",
            "email": "cartupdate@example.com",
            "password": "TestPass123!"
        }
        userResponse = client.post("/api/account", json=userData)
        userId: int = userResponse.json()["id"]
        
        productData: Dict[str, Any] = {
            "name": "Cart Update Product",
            "description": "Product for cart update testing",
            "category": Category.FITNESS.value,
            "price": 79.99,
            "quantity": 20,
            "shellId": 501,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        productResponse = client.post("/api/products", json=productData, headers=headers)
        productId: int = productResponse.json()["id"]
        
        # Add item to cart first
        itemData: Dict[str, int] = {"productId": productId, "quantity": 3}
        client.post(f"/api/admin/users/{userId}/cart/items", json=itemData, headers=headers)
        
        # Update item quantity
        updateData: Dict[str, int] = {"quantity": 5}
        response = client.put(f"/api/admin/users/{userId}/cart/items/{productId}", json=updateData, headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        # Verify update
        response = client.get(f"/api/admin/users/{userId}/cart", headers=headers)
        cartData: Dict[str, Any] = response.json()
        assert cartData["totalItems"] == 5
        assert cartData["items"][0]["quantity"] == 5

    def test_remove_item_from_user_cart_admin(self, client: TestClient, admin_token: str) -> None:
        """Test admin can remove items from any user's cart."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test user and product
        userData: Dict[str, str] = {
            "username": "cartremoveuser",
            "firstname": "CartRemove",
            "email": "cartremove@example.com",
            "password": "TestPass123!"
        }
        userResponse = client.post("/api/account", json=userData)
        userId: int = userResponse.json()["id"]
        
        productData: Dict[str, Any] = {
            "name": "Cart Remove Product",
            "description": "Product for cart removal testing",
            "category": Category.CLOTHING.value,
            "price": 49.99,
            "quantity": 15,
            "shellId": 502,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        productResponse = client.post("/api/products", json=productData, headers=headers)
        productId: int = productResponse.json()["id"]
        
        # Add item to cart first
        itemData: Dict[str, int] = {"productId": productId, "quantity": 4}
        client.post(f"/api/admin/users/{userId}/cart/items", json=itemData, headers=headers)
        
        # Remove item from cart
        response = client.delete(f"/api/admin/users/{userId}/cart/items/{productId}", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        # Verify removal
        response = client.get(f"/api/admin/users/{userId}/cart", headers=headers)
        cartData: Dict[str, Any] = response.json()
        assert cartData["totalItems"] == 0
        assert len(cartData["items"]) == 0

    def test_clear_user_cart_admin(self, client: TestClient, admin_token: str) -> None:
        """Test admin can clear any user's cart."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test user and products
        userData: Dict[str, str] = {
            "username": "cartclearuser",
            "firstname": "CartClear",
            "email": "cartclear@example.com",
            "password": "TestPass123!"
        }
        userResponse = client.post("/api/account", json=userData)
        userId: int = userResponse.json()["id"]
        
        # Create multiple products and add to cart
        for i in range(3):
            productData: Dict[str, Any] = {
                "name": f"Clear Test Product {i+1}",
                "description": f"Product {i+1} for cart clearing test",
                "category": Category.ACCESSORIES.value,
                "price": 19.99 + i * 10,
                "quantity": 10,
                "shellId": 510 + i,
                "inventoryStatus": InventoryStatus.INSTOCK.value
            }
            productResponse = client.post("/api/products", json=productData, headers=headers)
            productId: int = productResponse.json()["id"]
            
            # Add to cart
            itemData: Dict[str, int] = {"productId": productId, "quantity": i + 1}
            client.post(f"/api/admin/users/{userId}/cart/items", json=itemData, headers=headers)
        
        # Verify cart has items
        response = client.get(f"/api/admin/users/{userId}/cart", headers=headers)
        cartData: Dict[str, Any] = response.json()
        assert cartData["totalItems"] == 6  # 1 + 2 + 3
        assert len(cartData["items"]) == 3
        
        # Clear cart
        response = client.delete(f"/api/admin/users/{userId}/cart", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        # Verify cart is empty
        response = client.get(f"/api/admin/users/{userId}/cart", headers=headers)
        cartData = response.json()
        assert cartData["totalItems"] == 0
        assert len(cartData["items"]) == 0

    def test_admin_cart_operations_user_not_found(self, client: TestClient, admin_token: str) -> None:
        """Test cart operations on non-existent user."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Try adding item to non-existent user's cart
        itemData: Dict[str, int] = {"productId": 1, "quantity": 1}
        response = client.post("/api/admin/users/99999/cart/items", json=itemData, headers=headers)
        assert response.status_code == HTTPStatus.NOT_FOUND.value
        
        # Try updating item in non-existent user's cart
        updateData: Dict[str, int] = {"quantity": 2}
        response = client.put("/api/admin/users/99999/cart/items/1", json=updateData, headers=headers)
        assert response.status_code == HTTPStatus.NOT_FOUND.value
        
        # Try removing item from non-existent user's cart
        response = client.delete("/api/admin/users/99999/cart/items/1", headers=headers)
        assert response.status_code == HTTPStatus.NOT_FOUND.value
        
        # Try clearing non-existent user's cart
        response = client.delete("/api/admin/users/99999/cart", headers=headers)
        assert response.status_code == HTTPStatus.OK.value  # Cart clearing returns 200 even for non-existent users

    def test_admin_cart_operations_product_not_found(self, client: TestClient, admin_token: str) -> None:
        """Test cart operations with non-existent product."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test user
        userData: Dict[str, str] = {
            "username": "productnotfounduser",
            "firstname": "ProductNotFound",
            "email": "productnotfound@example.com",
            "password": "TestPass123!"
        }
        userResponse = client.post("/api/account", json=userData)
        userId: int = userResponse.json()["id"]
        
        # Try adding non-existent product to cart
        itemData: Dict[str, int] = {"productId": 99999, "quantity": 1}
        response = client.post(f"/api/admin/users/{userId}/cart/items", json=itemData, headers=headers)
        assert response.status_code == HTTPStatus.NOT_FOUND.value

    def test_admin_cart_operations_invalid_quantity(self, client, admin_token):
        """Test cart operations with invalid quantity."""
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test user and product
        userData = {
            "username": "invalidquantityuser",
            "firstname": "InvalidQuantity",
            "email": "invalidquantity@example.com",
            "password": "TestPass123!"
        }
        userResponse = client.post("/api/account", json=userData)
        userId = userResponse.json()["id"]
        
        productData = {
            "name": "Invalid Quantity Product",
            "description": "Product for invalid quantity testing",
            "category": Category.ELECTRONICS.value,
            "price": 99.99,
            "quantity": 5,
            "shellId": 520,
            "inventoryStatus": InventoryStatus.LOWSTOCK.value
        }
        productResponse = client.post("/api/products", json=productData, headers=headers)
        productId = productResponse.json()["id"]
        
        # Try adding with zero quantity
        itemData: Dict[str, int] = {"productId": productId, "quantity": 0}
        response = client.post(f"/api/admin/users/{userId}/cart/items", json=itemData, headers=headers)
        assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY.value  # Validation error
        
        # Try adding with negative quantity
        itemData = {"productId": productId, "quantity": -1}
        response = client.post(f"/api/admin/users/{userId}/cart/items", json=itemData, headers=headers)
        assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY.value  # Validation error

    def test_admin_can_view_multiple_user_carts(self, client: TestClient, admin_token: str) -> None:
        """Test admin can manage multiple users' carts."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create multiple test users
        userIds: List[int] = []
        for i in range(2):
            userData: Dict[str, str] = {
                "username": f"multiuser{i}",
                "firstname": f"Multi{i}",
                "email": f"multiuser{i}@example.com",
                "password": "TestPass123!"
            }
            userResponse = client.post("/api/account", json=userData)
            userIds.append(userResponse.json()["id"])
        
        # Create a test product
        productData: Dict[str, Any] = {
            "name": "Multi User Product",
            "description": "Product for multiple users",
            "category": Category.FITNESS.value,
            "price": 59.99,
            "quantity": 20,
            "shellId": 530,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        productResponse = client.post("/api/products", json=productData, headers=headers)
        productId: int = productResponse.json()["id"]
        
        # Add different quantities to each user's cart
        for i, userId in enumerate(userIds):
            itemData: Dict[str, int] = {"productId": productId, "quantity": i + 2}  # 2, 3
            response = client.post(f"/api/admin/users/{userId}/cart/items", json=itemData, headers=headers)
            assert response.status_code == HTTPStatus.OK.value
        
        # Verify each cart has correct items
        for i, userId in enumerate(userIds):
            response = client.get(f"/api/admin/users/{userId}/cart", headers=headers)
            assert response.status_code == HTTPStatus.OK.value
            cartData: Dict[str, Any] = response.json()
            assert cartData["totalItems"] == i + 2
            assert cartData["items"][0]["quantity"] == i + 2

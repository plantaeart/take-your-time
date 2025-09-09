"""
Admin wishlist management tests.
"""
import pytest
from typing import Dict, Any, List
from fastapi.testclient import TestClient
from app.models.enums.category import Category
from app.models.enums.inventoryStatus import InventoryStatus
from app.models.enums.http_status import HTTPStatus


class TestAdminWishlistManagement:
    """Test admin wishlist management functionality."""

    def test_get_user_wishlist_admin_required(self, client: TestClient) -> None:
        """Test getting user wishlist requires admin privileges."""
        response = client.get("/api/admin/users/1/wishlist")
        assert response.status_code == HTTPStatus.UNAUTHORIZED.value

    def test_get_user_wishlist_regular_user_forbidden(self, client: TestClient, user_token: str) -> None:
        """Test regular users cannot access other users' wishlists."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        response = client.get("/api/admin/users/1/wishlist", headers=headers)
        assert response.status_code == HTTPStatus.FORBIDDEN.value

    def test_get_user_wishlist_admin_success(self, client: TestClient, admin_token: str) -> None:
        """Test admin can successfully get any user's wishlist."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create a test user first
        userData: Dict[str, str] = {
            "username": "wishlistuser",
            "firstname": "Wishlist",
            "email": "wishlistuser@example.com",
            "password": "TestPass123!"
        }
        userResponse = client.post("/api/account", json=userData)
        userId: int = userResponse.json()["id"]
        
        # Get the user's wishlist (should be empty initially)
        response = client.get(f"/api/admin/users/{userId}/wishlist", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        responseData: Dict[str, Any] = response.json()
        assert responseData["userId"] == userId
        assert len(responseData["items"]) == 0

    def test_get_user_wishlist_not_found(self, client: TestClient, admin_token: str) -> None:
        """Test getting wishlist for non-existent user."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        response = client.get("/api/admin/users/99999/wishlist", headers=headers)
        assert response.status_code == HTTPStatus.NOT_FOUND.value

    def test_add_item_to_user_wishlist_admin(self, client: TestClient, admin_token: str) -> None:
        """Test admin can add items to any user's wishlist."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create a test user
        userData: Dict[str, str] = {
            "username": "wishlistadduser",
            "firstname": "WishlistAdd",
            "email": "wishlistadd@example.com",
            "password": "TestPass123!"
        }
        userResponse = client.post("/api/account", json=userData)
        userId: int = userResponse.json()["id"]
        
        # Create a test product
        productData: Dict[str, Any] = {
            "name": "Wishlist Test Product",
            "description": "Product for wishlist testing",
            "category": Category.ELECTRONICS.value,
            "price": 199.99,
            "quantity": 5,
            "shellId": 600,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        productResponse = client.post("/api/products", json=productData, headers=headers)
        productId: int = productResponse.json()["id"]
        
        # Add item to user's wishlist
        itemData: Dict[str, int] = {"productId": productId}
        response = client.post(f"/api/admin/users/{userId}/wishlist/items", json=itemData, headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        # Verify item was added
        response = client.get(f"/api/admin/users/{userId}/wishlist", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        responseData: Dict[str, Any] = response.json()
        assert len(responseData["items"]) == 1
        assert responseData["items"][0]["productId"] == productId

    def test_remove_item_from_user_wishlist_admin(self, client: TestClient, admin_token: str) -> None:
        """Test admin can remove items from any user's wishlist."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test user and product
        userData: Dict[str, str] = {
            "username": "wishlistremoveuser",
            "firstname": "WishlistRemove",
            "email": "wishlistremove@example.com",
            "password": "TestPass123!"
        }
        userResponse = client.post("/api/account", json=userData)
        userId: int = userResponse.json()["id"]
        
        productData: Dict[str, Any] = {
            "name": "Wishlist Remove Product",
            "description": "Product for wishlist removal testing",
            "category": Category.CLOTHING.value,
            "price": 89.99,
            "quantity": 10,
            "shellId": 601,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        productResponse = client.post("/api/products", json=productData, headers=headers)
        productId: int = productResponse.json()["id"]
        
        # Add item to wishlist first
        itemData: Dict[str, int] = {"productId": productId}
        client.post(f"/api/admin/users/{userId}/wishlist/items", json=itemData, headers=headers)
        
        # Remove item from wishlist
        response = client.delete(f"/api/admin/users/{userId}/wishlist/items/{productId}", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        # Verify removal
        response = client.get(f"/api/admin/users/{userId}/wishlist", headers=headers)
        responseData: Dict[str, Any] = response.json()
        assert len(responseData["items"]) == 0

    def test_clear_user_wishlist_admin(self, client: TestClient, admin_token: str) -> None:
        """Test admin can clear any user's wishlist."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test user and products
        userData: Dict[str, str] = {
            "username": "wishlistclearuser",
            "firstname": "WishlistClear",
            "email": "wishlistclear@example.com",
            "password": "TestPass123!"
        }
        userResponse = client.post("/api/account", json=userData)
        userId: int = userResponse.json()["id"]
        
        # Create multiple products and add to wishlist
        productIds: List[int] = []
        for i in range(3):
            productData: Dict[str, Any] = {
                "name": f"Clear Wishlist Product {i+1}",
                "description": f"Product {i+1} for wishlist clearing test",
                "category": Category.FITNESS.value,
                "price": 39.99 + i * 20,
                "quantity": 8,
                "shellId": 610 + i,
                "inventoryStatus": InventoryStatus.INSTOCK.value
            }
            productResponse = client.post("/api/products", json=productData, headers=headers)
            productId: int = productResponse.json()["id"]
            productIds.append(productId)
            
            # Add to wishlist
            itemData: Dict[str, int] = {"productId": productId}
            client.post(f"/api/admin/users/{userId}/wishlist/items", json=itemData, headers=headers)
        
        # Verify wishlist has items
        response = client.get(f"/api/admin/users/{userId}/wishlist", headers=headers)
        responseData: Dict[str, Any] = response.json()
        assert len(responseData["items"]) == 3
        
        # Clear wishlist
        response = client.delete(f"/api/admin/users/{userId}/wishlist", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        # Verify wishlist is empty
        response = client.get(f"/api/admin/users/{userId}/wishlist", headers=headers)
        responseData = response.json()
        assert len(responseData["items"]) == 0

    def test_admin_wishlist_operations_user_not_found(self, client: TestClient, admin_token: str) -> None:
        """Test wishlist operations on non-existent user."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Try adding item to non-existent user's wishlist
        itemData: Dict[str, int] = {"productId": 1}
        response = client.post("/api/admin/users/99999/wishlist/items", json=itemData, headers=headers)
        assert response.status_code == HTTPStatus.NOT_FOUND.value
        
        # Try removing item from non-existent user's wishlist
        response = client.delete("/api/admin/users/99999/wishlist/items/1", headers=headers)
        assert response.status_code == HTTPStatus.NOT_FOUND.value
        
        # Try clearing non-existent user's wishlist
        response = client.delete("/api/admin/users/99999/wishlist", headers=headers)
        assert response.status_code == HTTPStatus.OK.value

    def test_admin_wishlist_operations_product_not_found(self, client: TestClient, admin_token: str) -> None:
        """Test wishlist operations with non-existent product."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test user
        userData: Dict[str, str] = {
            "username": "wishlistproductnotfound",
            "firstname": "WishlistProductNotFound",
            "email": "wishlistproductnotfound@example.com",
            "password": "TestPass123!"
        }
        userResponse = client.post("/api/account", json=userData)
        userId: int = userResponse.json()["id"]
        
        # Try adding non-existent product to wishlist
        itemData: Dict[str, int] = {"productId": 99999}
        response = client.post(f"/api/admin/users/{userId}/wishlist/items", json=itemData, headers=headers)
        assert response.status_code == HTTPStatus.NOT_FOUND.value

    def test_admin_wishlist_duplicate_item_handling(self, client: TestClient, admin_token: str) -> None:
        """Test handling of duplicate items in wishlist."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test user and product
        userData: Dict[str, str] = {
            "username": "wishlistduplicateuser",
            "firstname": "WishlistDuplicate",
            "email": "wishlistduplicate@example.com",
            "password": "TestPass123!"
        }
        userResponse = client.post("/api/account", json=userData)
        userId: int = userResponse.json()["id"]
        
        productData: Dict[str, Any] = {
            "name": "Duplicate Wishlist Product",
            "description": "Product for duplicate testing",
            "category": Category.ACCESSORIES.value,
            "price": 29.99,
            "quantity": 12,
            "shellId": 620,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        productResponse = client.post("/api/products", json=productData, headers=headers)
        productId: int = productResponse.json()["id"]
        
        # Add item to wishlist
        itemData: Dict[str, int] = {"productId": productId}
        response = client.post(f"/api/admin/users/{userId}/wishlist/items", json=itemData, headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        # Try adding same item again (should handle gracefully)
        response = client.post(f"/api/admin/users/{userId}/wishlist/items", json=itemData, headers=headers)
        assert response.status_code == HTTPStatus.BAD_REQUEST.value
        
        # Verify only one item in wishlist
        response = client.get(f"/api/admin/users/{userId}/wishlist", headers=headers)
        responseData: Dict[str, Any] = response.json()
        assert len(responseData["items"]) == 1

    def test_admin_can_view_multiple_user_wishlists(self, client: TestClient, admin_token: str) -> None:
        """Test admin can manage multiple users' wishlists."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create multiple test users
        userIds: List[int] = []
        for i in range(2):
            userData: Dict[str, str] = {
                "username": f"multiwishlistuser{i}",
                "firstname": f"MultiWishlist{i}",
                "email": f"multiwishlistuser{i}@example.com",
                "password": "TestPass123!"
            }
            userResponse = client.post("/api/account", json=userData)
            userIds.append(userResponse.json()["id"])
        
        # Create different products for each user
        for i, userId in enumerate(userIds):
            productData: Dict[str, Any] = {
                "name": f"Multi Wishlist Product {i+1}",
                "description": f"Product {i+1} for user {userId}",
                "category": Category.ELECTRONICS.value,
                "price": 99.99 + i * 50,
                "quantity": 15,
                "shellId": 630 + i,
                "inventoryStatus": InventoryStatus.INSTOCK.value
            }
            productResponse = client.post("/api/products", json=productData, headers=headers)
            productId: int = productResponse.json()["id"]
            
            # Add to user's wishlist
            itemData: Dict[str, int] = {"productId": productId}
            response = client.post(f"/api/admin/users/{userId}/wishlist/items", json=itemData, headers=headers)       
            assert response.status_code == HTTPStatus.OK.value        # Verify each wishlist has correct items
        for i, userId in enumerate(userIds):
            response = client.get(f"/api/admin/users/{userId}/wishlist", headers=headers)
            assert response.status_code == HTTPStatus.OK.value
            responseData: Dict[str, Any] = response.json()
            assert len(responseData["items"]) == 1
            assert responseData["userId"] == userId

    def test_admin_wishlist_item_removal_not_found(self, client: TestClient, admin_token: str) -> None:
        """Test removing non-existent item from wishlist."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test user
        userData: Dict[str, str] = {
            "username": "wishlistremovenotfound",
            "firstname": "WishlistRemoveNotFound",
            "email": "wishlistremovenotfound@example.com",
            "password": "TestPass123!"
        }
        userResponse = client.post("/api/account", json=userData)
        userId: int = userResponse.json()["id"]
        
        # Try removing non-existent item from wishlist
        response = client.delete(f"/api/admin/users/{userId}/wishlist/items/99999", headers=headers)
        assert response.status_code == HTTPStatus.NOT_FOUND.value

    def test_admin_wishlist_permissions_check(self, client: TestClient, admin_token: str, user_token: str) -> None:
        """Test admin permissions are properly checked for wishlist operations."""
        adminHeaders: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        userHeaders: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        
        # Create test user
        userData: Dict[str, str] = {
            "username": "wishlistpermissionuser",
            "firstname": "WishlistPermission",
            "email": "wishlistpermission@example.com",
            "password": "TestPass123!"
        }
        userResponse = client.post("/api/account", json=userData, headers=adminHeaders)
        userId: int = userResponse.json()["id"]
        
        # Regular user should not be able to access admin wishlist endpoints
        response = client.get(f"/api/admin/users/{userId}/wishlist", headers=userHeaders)
        assert response.status_code == HTTPStatus.FORBIDDEN.value
        
        itemData: Dict[str, int] = {"productId": 1}
        response = client.post(f"/api/admin/users/{userId}/wishlist/items", json=itemData, headers=userHeaders)
        assert response.status_code == HTTPStatus.FORBIDDEN.value
        
        response = client.delete(f"/api/admin/users/{userId}/wishlist/items/1", headers=userHeaders)
        assert response.status_code == HTTPStatus.FORBIDDEN.value
        
        response = client.delete(f"/api/admin/users/{userId}/wishlist", headers=userHeaders)
        assert response.status_code == HTTPStatus.FORBIDDEN.value

    def test_admin_wishlist_cross_user_isolation(self, client: TestClient, admin_token: str) -> None:
        """Test that user wishlists are properly isolated."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create two test users
        user1Data: Dict[str, str] = {
            "username": "wishlistuser1",
            "firstname": "WishlistUser1",
            "email": "wishlistuser1@example.com",
            "password": "TestPass123!"
        }
        user1Response = client.post("/api/account", json=user1Data, headers=headers)
        user1Id: int = user1Response.json()["id"]
        
        user2Data: Dict[str, str] = {
            "username": "wishlistuser2",
            "firstname": "WishlistUser2",
            "email": "wishlistuser2@example.com",
            "password": "TestPass123!"
        }
        user2Response = client.post("/api/account", json=user2Data, headers=headers)
        user2Id: int = user2Response.json()["id"]
        
        # Create a product and add to user1's wishlist
        productData: Dict[str, Any] = {
            "name": "Isolation Test Product",
            "description": "Product for isolation testing",
            "category": Category.FITNESS.value,
            "price": 79.99,
            "quantity": 20,
            "shellId": 640,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        productResponse = client.post("/api/products", json=productData, headers=headers)
        productId: int = productResponse.json()["id"]
        
        itemData: Dict[str, int] = {"productId": productId}
        client.post(f"/api/admin/users/{user1Id}/wishlist/items", json=itemData, headers=headers)
        
        # Verify user1 has the item
        response = client.get(f"/api/admin/users/{user1Id}/wishlist", headers=headers)
        responseData: Dict[str, Any] = response.json()
        assert len(responseData["items"]) == 1
        
        # Verify user2 doesn't have the item
        response = client.get(f"/api/admin/users/{user2Id}/wishlist", headers=headers)
        responseData = response.json()
        assert len(responseData["items"]) == 0

    def test_update_user_wishlist_item_unauthorized(self, client: TestClient) -> None:
        """Test that updating wishlist item requires authentication."""
        updateData: Dict[str, int] = {"productId": 2}
        response = client.put("/api/admin/users/1/wishlist/items/1", json=updateData)
        assert response.status_code == HTTPStatus.UNAUTHORIZED.value

    def test_update_user_wishlist_item_forbidden(self, client: TestClient, user_token: str) -> None:
        """Test that regular users cannot update other users' wishlist items."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        updateData: Dict[str, int] = {"productId": 2}
        response = client.put("/api/admin/users/1/wishlist/items/1", json=updateData, headers=headers)
        assert response.status_code == HTTPStatus.FORBIDDEN.value

    def test_update_user_wishlist_item_success(self, client: TestClient, admin_token: str) -> None:
        """Test successful wishlist item update (product replacement)."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test user
        userData: Dict[str, str] = {
            "username": "wishlistupdateuser",
            "firstname": "Update",
            "email": "wishlistupdate@example.com",
            "password": "TestPass123!"
        }
        userResponse = client.post("/api/account", json=userData)
        userId: int = userResponse.json()["id"]
        
        # Create two test products
        product1Data: Dict[str, Any] = {
            "name": "Original Wishlist Product",
            "description": "Original product in wishlist",
            "category": Category.ELECTRONICS.value,
            "price": 49.99,
            "quantity": 20,
            "shellId": 1001,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        product1Response = client.post("/api/products", json=product1Data, headers=headers)
        product1Id: int = product1Response.json()["id"]
        
        product2Data: Dict[str, Any] = {
            "name": "Replacement Wishlist Product",
            "description": "New product to replace the original",
            "category": Category.CLOTHING.value,
            "price": 79.99,
            "quantity": 15,
            "shellId": 1002,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        product2Response = client.post("/api/products", json=product2Data, headers=headers)
        product2Id: int = product2Response.json()["id"]
        
        # Add original product to wishlist
        itemData: Dict[str, int] = {"productId": product1Id}
        addResponse = client.post(f"/api/admin/users/{userId}/wishlist/items", json=itemData, headers=headers)
        assert addResponse.status_code == HTTPStatus.OK.value
        
        # Verify original product is in wishlist
        getResponse = client.get(f"/api/admin/users/{userId}/wishlist", headers=headers)
        wishlistData: Dict[str, Any] = getResponse.json()
        assert len(wishlistData["items"]) == 1
        assert wishlistData["items"][0]["productId"] == product1Id
        
        # Update wishlist item to new product
        updateData: Dict[str, int] = {"productId": product2Id}
        updateResponse = client.put(f"/api/admin/users/{userId}/wishlist/items/{product1Id}", json=updateData, headers=headers)
        assert updateResponse.status_code == HTTPStatus.OK.value
        
        # Verify product was updated
        getResponse = client.get(f"/api/admin/users/{userId}/wishlist", headers=headers)
        updatedWishlistData: Dict[str, Any] = getResponse.json()
        assert len(updatedWishlistData["items"]) == 1
        assert updatedWishlistData["items"][0]["productId"] == product2Id

    def test_update_user_wishlist_item_user_not_found(self, client: TestClient, admin_token: str) -> None:
        """Test updating wishlist item for non-existent user."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        updateData: Dict[str, int] = {"productId": 2}
        response = client.put("/api/admin/users/99999/wishlist/items/1", json=updateData, headers=headers)
        assert response.status_code == HTTPStatus.NOT_FOUND.value

    def test_update_user_wishlist_item_product_not_found(self, client: TestClient, admin_token: str) -> None:
        """Test updating wishlist item with non-existent new product."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test user
        userData: Dict[str, str] = {
            "username": "updateprodnotfound",
            "firstname": "Update",
            "email": "updateprodnotfound@example.com",
            "password": "TestPass123!"
        }
        userResponse = client.post("/api/account", json=userData)
        userId: int = userResponse.json()["id"]
        
        # Create test product for wishlist
        productData: Dict[str, Any] = {
            "name": "Wishlist Product",
            "description": "Product for wishlist",
            "category": Category.FITNESS.value,
            "price": 29.99,
            "quantity": 10,
            "shellId": 2001,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        productResponse = client.post("/api/products", json=productData, headers=headers)
        productId: int = productResponse.json()["id"]
        
        # Add product to wishlist
        itemData: Dict[str, int] = {"productId": productId}
        client.post(f"/api/admin/users/{userId}/wishlist/items", json=itemData, headers=headers)
        
        # Try to update with non-existent product
        updateData: Dict[str, int] = {"productId": 99999}
        response = client.put(f"/api/admin/users/{userId}/wishlist/items/{productId}", json=updateData, headers=headers)
        assert response.status_code == HTTPStatus.NOT_FOUND.value

    def test_update_user_wishlist_item_not_found(self, client: TestClient, admin_token: str) -> None:
        """Test updating non-existent wishlist item."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test user
        userData: Dict[str, str] = {
            "username": "updateitemnotfound",
            "firstname": "Update",
            "email": "updateitemnotfound@example.com",
            "password": "TestPass123!"
        }
        userResponse = client.post("/api/account", json=userData)
        userId: int = userResponse.json()["id"]
        
        # Create test product
        productData: Dict[str, Any] = {
            "name": "Replacement Product",
            "description": "Product for replacement",
            "category": Category.ACCESSORIES.value,
            "price": 19.99,
            "quantity": 5,
            "shellId": 3001,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        productResponse = client.post("/api/products", json=productData, headers=headers)
        productId: int = productResponse.json()["id"]
        
        # Try to update non-existent wishlist item
        updateData: Dict[str, int] = {"productId": productId}
        response = client.put(f"/api/admin/users/{userId}/wishlist/items/99999", json=updateData, headers=headers)
        assert response.status_code == HTTPStatus.NOT_FOUND.value

    def test_update_user_wishlist_item_duplicate_product(self, client: TestClient, admin_token: str) -> None:
        """Test updating wishlist item to a product that's already in the wishlist."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test user
        userData: Dict[str, str] = {
            "username": "duplicateupdate",
            "firstname": "Duplicate",
            "email": "duplicateupdate@example.com",
            "password": "TestPass123!"
        }
        userResponse = client.post("/api/account", json=userData)
        userId: int = userResponse.json()["id"]
        
        # Create two test products
        product1Data: Dict[str, Any] = {
            "name": "First Wishlist Product",
            "description": "First product",
            "category": Category.ELECTRONICS.value,
            "price": 99.99,
            "quantity": 10,
            "shellId": 4001,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        product1Response = client.post("/api/products", json=product1Data, headers=headers)
        product1Id: int = product1Response.json()["id"]
        
        product2Data: Dict[str, Any] = {
            "name": "Second Wishlist Product",
            "description": "Second product",
            "category": Category.CLOTHING.value,
            "price": 59.99,
            "quantity": 8,
            "shellId": 4002,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        product2Response = client.post("/api/products", json=product2Data, headers=headers)
        product2Id: int = product2Response.json()["id"]
        
        # Add both products to wishlist
        itemData1: Dict[str, int] = {"productId": product1Id}
        client.post(f"/api/admin/users/{userId}/wishlist/items", json=itemData1, headers=headers)
        
        itemData2: Dict[str, int] = {"productId": product2Id}
        client.post(f"/api/admin/users/{userId}/wishlist/items", json=itemData2, headers=headers)
        
        # Try to update first product to second product (should conflict)
        updateData: Dict[str, int] = {"productId": product2Id}
        response = client.put(f"/api/admin/users/{userId}/wishlist/items/{product1Id}", json=updateData, headers=headers)
        assert response.status_code == HTTPStatus.CONFLICT.value

    def test_update_user_wishlist_item_same_product(self, client: TestClient, admin_token: str) -> None:
        """Test updating wishlist item to the same product (should succeed)."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test user
        userData: Dict[str, str] = {
            "username": "sameproductupdate",
            "firstname": "Same",
            "email": "sameproductupdate@example.com",
            "password": "TestPass123!"
        }
        userResponse = client.post("/api/account", json=userData)
        userId: int = userResponse.json()["id"]
        
        # Create test product
        productData: Dict[str, Any] = {
            "name": "Same Product Update Test",
            "description": "Product for same update test",
            "category": Category.FITNESS.value,
            "price": 39.99,
            "quantity": 12,
            "shellId": 5001,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        productResponse = client.post("/api/products", json=productData, headers=headers)
        productId: int = productResponse.json()["id"]
        
        # Add product to wishlist
        itemData: Dict[str, int] = {"productId": productId}
        client.post(f"/api/admin/users/{userId}/wishlist/items", json=itemData, headers=headers)
        
        # Update to same product (should succeed)
        updateData: Dict[str, int] = {"productId": productId}
        response = client.put(f"/api/admin/users/{userId}/wishlist/items/{productId}", json=updateData, headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        # Verify wishlist still has the product
        getResponse = client.get(f"/api/admin/users/{userId}/wishlist", headers=headers)
        wishlistData: Dict[str, Any] = getResponse.json()
        assert len(wishlistData["items"]) == 1
        assert wishlistData["items"][0]["productId"] == productId

    def test_update_user_wishlist_item_no_wishlist(self, client: TestClient, admin_token: str) -> None:
        """Test updating wishlist item when user has no wishlist."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test user
        userData: Dict[str, str] = {
            "username": "nowishlistupdate",
            "firstname": "NoWishlist",
            "email": "nowishlistupdate@example.com",
            "password": "TestPass123!"
        }
        userResponse = client.post("/api/account", json=userData)
        userId: int = userResponse.json()["id"]
        
        # Create test product
        productData: Dict[str, Any] = {
            "name": "No Wishlist Product",
            "description": "Product for no wishlist test",
            "category": Category.ACCESSORIES.value,
            "price": 15.99,
            "quantity": 20,
            "shellId": 6001,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        productResponse = client.post("/api/products", json=productData, headers=headers)
        productId: int = productResponse.json()["id"]
        
        # Try to update item in non-existent wishlist
        updateData: Dict[str, int] = {"productId": productId}
        response = client.put(f"/api/admin/users/{userId}/wishlist/items/1", json=updateData, headers=headers)
        assert response.status_code == HTTPStatus.NOT_FOUND.value

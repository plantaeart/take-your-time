"""
Tests for admin user wishlist search functionality with flattened data structure.
"""
import json
from typing import Dict, Any, List
from fastapi.testclient import TestClient

from app.models.enums.http_status import HTTPStatus


class TestAdminUserWishlistSearch:
    """Test admin user wishlist search functionality with new flattened structure."""

    def test_search_wishlists_unauthorized(self, client: TestClient) -> None:
        """Test that wishlist search requires authentication."""
        response = client.get("/api/admin/wishlist/search")
        assert response.status_code == HTTPStatus.UNAUTHORIZED.value

    def test_search_wishlists_forbidden(self, client: TestClient, user_token: str) -> None:
        """Test that regular users cannot search wishlists."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        response = client.get("/api/admin/wishlist/search", headers=headers)
        assert response.status_code == HTTPStatus.FORBIDDEN.value

    def test_search_wishlists_empty_database(self, client: TestClient, admin_token: str) -> None:
        """Test wishlist search with empty database."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        response = client.get("/api/admin/wishlist/search", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        assert "items" in responseData
        assert responseData["items"] == []
        assert responseData["total"] == 0
        assert responseData["page"] == 1
        assert responseData["limit"] == 10
        assert responseData["totalPages"] == 0
        assert responseData["hasNext"] is False
        assert responseData["hasPrev"] is False

    def test_search_wishlists_basic_pagination(self, client: TestClient, admin_token: str) -> None:
        """Test wishlist search with basic pagination."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test custom page and limit
        response = client.get("/api/admin/wishlist/search?page=2&limit=5", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        assert responseData["page"] == 2
        assert responseData["limit"] == 5

    def test_search_wishlists_excludes_admin_users(self, client: TestClient, admin_token: str) -> None:
        """Test that wishlist search excludes admin users from results."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create regular user
        regularUserResponse = client.post("/api/account", json={
            "username": "regular_user",
            "email": "regular@example.com",
            "firstname": "Regular",
            "password": "RegularPass123!"
        })
        assert regularUserResponse.status_code == HTTPStatus.CREATED.value
        
        # Search wishlists
        response = client.get("/api/admin/wishlist/search", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        
        # Verify no admin users in results
        for item in responseData["items"]:
            # Should not find admin email
            assert item["email"] != "admin@admin.com"

    def test_search_wishlists_with_filters(self, client: TestClient, admin_token: str) -> None:
        """Test wishlist search with various filters."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test user
        userResponse = client.post("/api/account", json={
            "username": "filter_test_user",
            "email": "filter@example.com",
            "firstname": "Filter",
            "password": "FilterPass123!"
        })
        assert userResponse.status_code == HTTPStatus.CREATED.value
        userData: Dict[str, Any] = userResponse.json()
        userId: int = userData["id"]
        
        # Test username filter
        usernameFilter = {"username": "filter_test_user"}
        response = client.get(
            f"/api/admin/wishlist/search?filters={json.dumps(usernameFilter)}", 
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        responseData: Dict[str, Any] = response.json()
        
        if responseData["total"] > 0:
            found_user = False
            for item in responseData["items"]:
                if item["id"] == userId:
                    found_user = True
                    assert item["username"] == "filter_test_user"
                    break
            assert found_user

    def test_search_wishlists_with_invalid_filters(self, client: TestClient, admin_token: str) -> None:
        """Test wishlist search with invalid filter format."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test invalid JSON in filters
        response = client.get("/api/admin/wishlist/search?filters=invalid_json", headers=headers)
        assert response.status_code == HTTPStatus.BAD_REQUEST.value
        
        responseData: Dict[str, Any] = response.json()
        assert "Invalid JSON format" in responseData["detail"]

    def test_search_wishlists_response_structure(self, client: TestClient, admin_token: str) -> None:
        """Test that wishlist search returns correct response structure."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        response = client.get("/api/admin/wishlist/search", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        
        # Verify response structure
        assert "items" in responseData
        assert "total" in responseData
        assert "page" in responseData
        assert "limit" in responseData
        assert "totalPages" in responseData
        assert "hasNext" in responseData
        assert "hasPrev" in responseData
        
        # Verify data types
        assert isinstance(responseData["items"], list)
        assert isinstance(responseData["total"], int)
        assert isinstance(responseData["page"], int)
        assert isinstance(responseData["limit"], int)
        assert isinstance(responseData["totalPages"], int)
        assert isinstance(responseData["hasNext"], bool)
        assert isinstance(responseData["hasPrev"], bool)

    def test_search_wishlists_item_structure(self, client: TestClient, admin_token: str) -> None:
        """Test that wishlist items have correct structure."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test user
        userResponse = client.post("/api/account", json={
            "username": "structure_test_user",
            "email": "structure@example.com",
            "firstname": "Structure",
            "password": "StructurePass123!"
        })
        assert userResponse.status_code == HTTPStatus.CREATED.value
        
        response = client.get("/api/admin/wishlist/search", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        
        if responseData["items"]:
            item = responseData["items"][0]
            
            # Verify user fields
            assert "id" in item
            assert "username" in item
            assert "email" in item
            assert "isActive" in item
            assert "wishlist" in item
            assert "wishlistItemCount" in item
            
            # Verify data types
            assert isinstance(item["id"], int)
            assert isinstance(item["username"], str)
            assert isinstance(item["email"], str)
            assert isinstance(item["isActive"], bool)
            assert isinstance(item["wishlist"], list)
            assert isinstance(item["wishlistItemCount"], int)

    def test_search_wishlists_empty_wishlist_handling(self, client: TestClient, admin_token: str) -> None:
        """Test that users with empty wishlists are handled correctly."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test user (will have empty wishlist)
        userResponse = client.post("/api/account", json={
            "username": "empty_wishlist_user",
            "email": "empty@example.com",
            "firstname": "Empty",
            "password": "EmptyPass123!"
        })
        assert userResponse.status_code == HTTPStatus.CREATED.value
        userData: Dict[str, Any] = userResponse.json()
        userId: int = userData["id"]
        
        # Search wishlists
        response = client.get("/api/admin/wishlist/search", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        
        # Find our user with empty wishlist
        userWishlist = None
        for item in responseData["items"]:
            if item["id"] == userId:
                userWishlist = item
                break
        
        # Should still appear in results with empty wishlist
        assert userWishlist is not None
        assert userWishlist["wishlist"] == []
        assert userWishlist["wishlistItemCount"] == 0
"""
Tests for admin wishlist search functionality.
"""
import json
from typing import Dict, Any, List
from fastapi.testclient import TestClient

from app.models.enums.http_status import HTTPStatus


class TestAdminWishlistSearch:
    """Test admin wishlist search functionality."""

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
        assert "wishlists" in responseData
        assert responseData["wishlists"] == []
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
        response = client.get("/api/admin/wishlist/search?page=3&limit=15", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        assert responseData["page"] == 3
        assert responseData["limit"] == 15

    def test_search_wishlists_with_filters(self, client: TestClient, admin_token: str) -> None:
        """Test wishlist search with filters."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test user ID filter
        filters: Dict[str, Any] = {"userId": 456}
        filtersJson: str = json.dumps(filters)
        
        response = client.get(
            f"/api/admin/wishlist/search?filters={filtersJson}",
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        assert "wishlists" in responseData

    def test_search_wishlists_with_date_range_filter(self, client: TestClient, admin_token: str) -> None:
        """Test wishlist search with date range filter."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test date range filter for creation date
        filters: Dict[str, Any] = {
            "createdAt": ["2024-03-01", "2024-09-30"]
        }
        filtersJson: str = json.dumps(filters)
        
        response = client.get(
            f"/api/admin/wishlist/search?filters={filtersJson}",
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value

    def test_search_wishlists_with_updated_date_filter(self, client: TestClient, admin_token: str) -> None:
        """Test wishlist search with updated date filter."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test date range filter for updated date
        filters: Dict[str, Any] = {
            "updatedAt": ["2024-06-01", "2024-12-31"]
        }
        filtersJson: str = json.dumps(filters)
        
        response = client.get(
            f"/api/admin/wishlist/search?filters={filtersJson}",
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value

    def test_search_wishlists_with_sorting(self, client: TestClient, admin_token: str) -> None:
        """Test wishlist search with sorting."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test sorting by user ID
        sorts: List[Dict[str, str]] = [{"field": "userId", "direction": "asc"}]
        sortsJson: str = json.dumps(sorts)
        
        response = client.get(
            f"/api/admin/wishlist/search?sorts={sortsJson}",
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        assert "wishlists" in responseData

    def test_search_wishlists_with_multiple_sorts(self, client: TestClient, admin_token: str) -> None:
        """Test wishlist search with multiple sort fields."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test multiple sort fields
        sorts: List[Dict[str, str]] = [
            {"field": "userId", "direction": "desc"},
            {"field": "updatedAt", "direction": "asc"},
            {"field": "createdAt", "direction": "desc"}
        ]
        sortsJson: str = json.dumps(sorts)
        
        response = client.get(
            f"/api/admin/wishlist/search?sorts={sortsJson}",
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value

    def test_search_wishlists_invalid_json_filters(self, client: TestClient, admin_token: str) -> None:
        """Test wishlist search with invalid JSON filters."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test malformed JSON
        response = client.get(
            "/api/admin/wishlist/search?filters={userId:123,invalid}",
            headers=headers
        )
        assert response.status_code == HTTPStatus.BAD_REQUEST.value
        assert "Invalid JSON format" in response.json()["detail"]

    def test_search_wishlists_invalid_json_sorts(self, client: TestClient, admin_token: str) -> None:
        """Test wishlist search with invalid JSON sorts."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test malformed JSON
        response = client.get(
            "/api/admin/wishlist/search?sorts=[{field:userId}]",
            headers=headers
        )
        assert response.status_code == HTTPStatus.BAD_REQUEST.value
        assert "Invalid JSON format" in response.json()["detail"]

    def test_search_wishlists_complex_filters_and_sorts(self, client: TestClient, admin_token: str) -> None:
        """Test wishlist search with complex filters and sorts."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test complex filtering and sorting
        filters: Dict[str, Any] = {
            "userId": 789,
            "createdAt": ["2024-01-15", "2024-08-15"],
            "updatedAt": ["2024-02-01", "2024-09-01"]
        }
        sorts: List[Dict[str, str]] = [
            {"field": "updatedAt", "direction": "desc"},
            {"field": "userId", "direction": "asc"}
        ]
        
        filtersJson: str = json.dumps(filters)
        sortsJson: str = json.dumps(sorts)
        
        response = client.get(
            f"/api/admin/wishlist/search?page=2&limit=25&filters={filtersJson}&sorts={sortsJson}",
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        assert "wishlists" in responseData
        assert responseData["page"] == 2
        assert responseData["limit"] == 25

    def test_search_wishlists_pagination_limits(self, client: TestClient, admin_token: str) -> None:
        """Test wishlist search pagination limits."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test minimum values
        response = client.get("/api/admin/wishlist/search?page=1&limit=1", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        assert responseData["page"] == 1
        assert responseData["limit"] == 1
        
        # Test maximum limit
        response = client.get("/api/admin/wishlist/search?page=5&limit=100", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        responseData = response.json()
        assert responseData["page"] == 5
        assert responseData["limit"] == 100

    def test_search_wishlists_response_structure(self, client: TestClient, admin_token: str) -> None:
        """Test wishlist search response structure."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        response = client.get("/api/admin/wishlist/search", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        
        # Verify required fields exist
        required_fields = ["wishlists", "total", "page", "limit", "totalPages", "hasNext", "hasPrev"]
        for field in required_fields:
            assert field in responseData, f"Missing required field: {field}"
        
        # Verify data types
        assert isinstance(responseData["wishlists"], list)
        assert isinstance(responseData["total"], int)
        assert isinstance(responseData["page"], int)
        assert isinstance(responseData["limit"], int)
        assert isinstance(responseData["totalPages"], int)
        assert isinstance(responseData["hasNext"], bool)
        assert isinstance(responseData["hasPrev"], bool)

    def test_search_wishlists_empty_filters_and_sorts(self, client: TestClient, admin_token: str) -> None:
        """Test wishlist search with empty filters and sorts."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test empty JSON objects
        response = client.get(
            "/api/admin/wishlist/search?filters={}&sorts=[]",
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        assert "wishlists" in responseData

    def test_search_wishlists_no_params(self, client: TestClient, admin_token: str) -> None:
        """Test wishlist search with no parameters (defaults)."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        response = client.get("/api/admin/wishlist/search", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        
        # Verify default values
        assert responseData["page"] == 1
        assert responseData["limit"] == 10
        assert isinstance(responseData["wishlists"], list)

    def test_search_wishlists_items_filter(self, client: TestClient, admin_token: str) -> None:
        """Test wishlist search with items filter."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test filtering by items (though this might be complex)
        filters: Dict[str, Any] = {"items": []}  # Empty items list
        filtersJson: str = json.dumps(filters)
        
        response = client.get(
            f"/api/admin/wishlist/search?filters={filtersJson}",
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value

    def test_search_wishlists_multiple_user_filter(self, client: TestClient, admin_token: str) -> None:
        """Test wishlist search with multiple criteria."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test multiple user criteria (might not find results, but should work)
        filters: Dict[str, Any] = {
            "userId": 999,
            "createdAt": ["2024-01-01", "2024-12-31"]
        }
        sorts: List[Dict[str, str]] = [
            {"field": "createdAt", "direction": "desc"}
        ]
        
        filtersJson: str = json.dumps(filters)
        sortsJson: str = json.dumps(sorts)
        
        response = client.get(
            f"/api/admin/wishlist/search?filters={filtersJson}&sorts={sortsJson}",
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        assert "wishlists" in responseData

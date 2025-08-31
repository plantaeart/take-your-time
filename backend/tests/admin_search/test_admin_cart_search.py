"""
Tests for admin cart search functionality.
"""
import json
from typing import Dict, Any, List
from fastapi.testclient import TestClient

from app.models.enums.http_status import HTTPStatus


class TestAdminCartSearch:
    """Test admin cart search functionality."""

    def test_search_carts_unauthorized(self, client: TestClient) -> None:
        """Test that cart search requires authentication."""
        response = client.get("/api/admin/cart/search")
        assert response.status_code == HTTPStatus.UNAUTHORIZED.value

    def test_search_carts_forbidden(self, client: TestClient, user_token: str) -> None:
        """Test that regular users cannot search carts."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        response = client.get("/api/admin/cart/search", headers=headers)
        assert response.status_code == HTTPStatus.FORBIDDEN.value

    def test_search_carts_empty_database(self, client: TestClient, admin_token: str) -> None:
        """Test cart search with empty database."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        response = client.get("/api/admin/cart/search", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        assert "carts" in responseData
        assert responseData["carts"] == []
        assert responseData["total"] == 0
        assert responseData["page"] == 1
        assert responseData["limit"] == 10
        assert responseData["totalPages"] == 0
        assert responseData["hasNext"] is False
        assert responseData["hasPrev"] is False

    def test_search_carts_basic_pagination(self, client: TestClient, admin_token: str) -> None:
        """Test cart search with basic pagination."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test custom page and limit
        response = client.get("/api/admin/cart/search?page=2&limit=5", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        assert responseData["page"] == 2
        assert responseData["limit"] == 5

    def test_search_carts_with_filters(self, client: TestClient, admin_token: str) -> None:
        """Test cart search with filters."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test user ID filter
        filters: Dict[str, Any] = {"userId": 123}
        filtersJson: str = json.dumps(filters)
        
        response = client.get(
            f"/api/admin/cart/search?filters={filtersJson}",
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        assert "carts" in responseData

    def test_search_carts_with_date_range_filter(self, client: TestClient, admin_token: str) -> None:
        """Test cart search with date range filter."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test date range filter
        filters: Dict[str, Any] = {
            "createdAt": ["2024-01-01", "2024-12-31"]
        }
        filtersJson: str = json.dumps(filters)
        
        response = client.get(
            f"/api/admin/cart/search?filters={filtersJson}",
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value

    def test_search_carts_with_sorting(self, client: TestClient, admin_token: str) -> None:
        """Test cart search with sorting."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test sorting by creation date
        sorts: List[Dict[str, str]] = [{"field": "createdAt", "direction": "desc"}]
        sortsJson: str = json.dumps(sorts)
        
        response = client.get(
            f"/api/admin/cart/search?sorts={sortsJson}",
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        assert "carts" in responseData

    def test_search_carts_with_multiple_sorts(self, client: TestClient, admin_token: str) -> None:
        """Test cart search with multiple sort fields."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test multiple sort fields
        sorts: List[Dict[str, str]] = [
            {"field": "userId", "direction": "asc"},
            {"field": "createdAt", "direction": "desc"}
        ]
        sortsJson: str = json.dumps(sorts)
        
        response = client.get(
            f"/api/admin/cart/search?sorts={sortsJson}",
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value

    def test_search_carts_invalid_json_filters(self, client: TestClient, admin_token: str) -> None:
        """Test cart search with invalid JSON filters."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test invalid JSON
        response = client.get(
            "/api/admin/cart/search?filters={invalid-json}",
            headers=headers
        )
        assert response.status_code == HTTPStatus.BAD_REQUEST.value
        assert "Invalid JSON format" in response.json()["detail"]

    def test_search_carts_invalid_json_sorts(self, client: TestClient, admin_token: str) -> None:
        """Test cart search with invalid JSON sorts."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test invalid JSON
        response = client.get(
            "/api/admin/cart/search?sorts={invalid-json}",
            headers=headers
        )
        assert response.status_code == HTTPStatus.BAD_REQUEST.value
        assert "Invalid JSON format" in response.json()["detail"]

    def test_search_carts_complex_filters_and_sorts(self, client: TestClient, admin_token: str) -> None:
        """Test cart search with complex filters and sorts."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test complex filtering and sorting
        filters: Dict[str, Any] = {
            "userId": 123,
            "createdAt": ["2024-01-01", "2024-06-30"]
        }
        sorts: List[Dict[str, str]] = [
            {"field": "updatedAt", "direction": "desc"}
        ]
        
        filtersJson: str = json.dumps(filters)
        sortsJson: str = json.dumps(sorts)
        
        response = client.get(
            f"/api/admin/cart/search?page=1&limit=20&filters={filtersJson}&sorts={sortsJson}",
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        assert "carts" in responseData
        assert responseData["page"] == 1
        assert responseData["limit"] == 20

    def test_search_carts_pagination_limits(self, client: TestClient, admin_token: str) -> None:
        """Test cart search pagination limits."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test minimum page and limit
        response = client.get("/api/admin/cart/search?page=1&limit=1", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        # Test maximum limit
        response = client.get("/api/admin/cart/search?page=1&limit=100", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        assert responseData["limit"] == 100

    def test_search_carts_response_structure(self, client: TestClient, admin_token: str) -> None:
        """Test cart search response structure."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        response = client.get("/api/admin/cart/search", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        
        # Verify response structure
        assert "carts" in responseData
        assert "total" in responseData
        assert "page" in responseData
        assert "limit" in responseData
        assert "totalPages" in responseData
        assert "hasNext" in responseData
        assert "hasPrev" in responseData
        
        # Verify data types
        assert isinstance(responseData["carts"], list)
        assert isinstance(responseData["total"], int)
        assert isinstance(responseData["page"], int)
        assert isinstance(responseData["limit"], int)
        assert isinstance(responseData["totalPages"], int)
        assert isinstance(responseData["hasNext"], bool)
        assert isinstance(responseData["hasPrev"], bool)

    def test_search_carts_empty_filters_and_sorts(self, client: TestClient, admin_token: str) -> None:
        """Test cart search with empty filters and sorts."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test empty filters and sorts
        response = client.get(
            "/api/admin/cart/search?filters={}&sorts=[]",
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        assert "carts" in responseData

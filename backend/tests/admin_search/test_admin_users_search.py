"""
Tests for admin users search functionality.
Tests the /admin/users/search endpoint with various filter and sort combinations.
"""
import json
from typing import Dict, Any, List
from fastapi.testclient import TestClient

from app.models.enums.http_status import HTTPStatus


class TestAdminUsersSearch:
    """Test admin users search endpoint."""

    def test_admin_users_search_unauthorized(self, client: TestClient) -> None:
        """Test that admin users search requires authentication."""
        response = client.get("/api/admin/users/search")
        assert response.status_code == HTTPStatus.UNAUTHORIZED.value

    def test_admin_users_search_forbidden(self, client: TestClient, user_token: str) -> None:
        """Test that regular users cannot access admin users search."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        response = client.get("/api/admin/users/search", headers=headers)
        assert response.status_code == HTTPStatus.FORBIDDEN.value

    def test_admin_users_search_basic(self, client: TestClient, admin_token: str) -> None:
        """Test basic admin users search without filters."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}

        response = client.get("/api/admin/users/search", headers=headers)
        assert response.status_code == HTTPStatus.OK.value

        responseData: Dict[str, Any] = response.json()
        
        # Validate response structure
        assert "users" in responseData
        assert "total" in responseData
        assert "page" in responseData
        assert "limit" in responseData
        assert "totalPages" in responseData
        assert "hasNext" in responseData
        assert "hasPrev" in responseData
        
        # Validate data types
        assert isinstance(responseData["users"], list)
        assert isinstance(responseData["total"], int)
        assert isinstance(responseData["page"], int)
        assert isinstance(responseData["limit"], int)
        
        # Verify users don't contain sensitive fields
        users: List[Dict[str, Any]] = responseData["users"]
        for user in users:
            assert "hashedPassword" not in user
            assert "_id" not in user
            # Should contain safe fields
            assert "id" in user
            assert "username" in user
            assert "email" in user

    def test_admin_users_search_with_username_filter(self, client: TestClient, admin_token: str) -> None:
        """Test admin users search with username filter."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}

        # Create test user first
        userData: Dict[str, str] = {
            "username": "testuser123",
            "firstname": "Test",
            "email": "testuser123@example.com",
            "password": "TestPass123!"
        }

        createResponse = client.post("/api/account", json=userData)
        assert createResponse.status_code == HTTPStatus.CREATED.value

        # Test username filter
        filters: Dict[str, Any] = {"username": "testuser123"}
        filtersJson: str = json.dumps(filters)
        
        response = client.get(
            "/api/admin/users/search",
            params={"filters": filtersJson},
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        users: List[Dict[str, Any]] = responseData["users"]
        
        # Verify filtered results contain the username
        found: bool = False
        for user in users:
            if "testuser123" in user["username"]:
                found = True
                assert "hashedPassword" not in user  # Verify sensitive data removed
                break
        assert found, "User with username 'testuser123' not found"

    def test_admin_users_search_with_email_filter(self, client: TestClient, admin_token: str) -> None:
        """Test admin users search with email filter."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test user
        userData: Dict[str, str] = {
            "username": "emailtest",
            "firstname": "Email",
            "email": "unique.email.test@example.com",
            "password": "TestPass123!"
        }
        
        createResponse = client.post("/api/account", json=userData)
        assert createResponse.status_code == HTTPStatus.CREATED.value

        # Test email filter
        filters: Dict[str, Any] = {"email": "unique.email.test"}
        filtersJson: str = json.dumps(filters)

        response = client.get(
            "/api/admin/users/search",
            params={"filters": filtersJson},
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value

        responseData: Dict[str, Any] = response.json()
        users: List[Dict[str, Any]] = responseData["users"]

        # Verify filtered results
        found: bool = False
        for user in users:
            if "unique.email.test" in user["email"]:
                found = True
                break
        assert found, "User with email containing 'unique.email.test' not found"

    def test_admin_users_search_with_isactive_filter(self, client: TestClient, admin_token: str) -> None:
        """Test admin users search with isActive filter."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test isActive filter (true)
        filters: Dict[str, Any] = {"isActive": True}
        filtersJson: str = json.dumps(filters)
        
        response = client.get(
            "/api/admin/users/search",
            params={"filters": filtersJson},
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        users: List[Dict[str, Any]] = responseData["users"]
        
        # Verify all returned users are active
        for user in users:
            assert user["isActive"] is True

    def test_admin_users_search_with_isadmin_filter(self, client: TestClient, admin_token: str) -> None:
        """Test admin users search with isAdmin filter."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test isAdmin filter (true) - should find admin users
        filters: Dict[str, Any] = {"isAdmin": True}
        filtersJson: str = json.dumps(filters)
        
        response = client.get(
            "/api/admin/users/search",
            params={"filters": filtersJson},
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        users: List[Dict[str, Any]] = responseData["users"]
        
        # Should find at least one admin user (the one making the request)
        assert len(users) >= 1
        
        # Verify all returned users are admin
        for user in users:
            assert user["isAdmin"] is True

    def test_admin_users_search_with_sorting(self, client: TestClient, admin_token: str) -> None:
        """Test admin users search with sorting."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test users with different usernames for sorting
        userA: Dict[str, str] = {
            "username": "aaa_first_user",
            "firstname": "First",
            "email": "a.first@example.com",
            "password": "TestPass123!"
        }

        userZ: Dict[str, str] = {
            "username": "zzz_last_user",
            "firstname": "Last",
            "email": "z.last@example.com",
            "password": "TestPass123!"
        }

        client.post("/api/account", json=userA)
        client.post("/api/account", json=userZ)
        
        # Test ascending sort by username
        sorts: List[Dict[str, str]] = [{"field": "username", "direction": "asc"}]
        sortsJson: str = json.dumps(sorts)
        
        response = client.get(
            "/api/admin/users/search",
            params={"sorts": sortsJson, "limit": "20"},
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        users: List[Dict[str, Any]] = responseData["users"]
        
        # Find our test users in results
        testUsers: List[Dict[str, Any]] = [
            u for u in users 
            if u["username"] in ["aaa_first_user", "zzz_last_user"]
        ]
        
        if len(testUsers) >= 2:
            # Verify ascending order
            usernames: List[str] = [u["username"] for u in testUsers]
            assert usernames == sorted(usernames), f"Users not sorted ascending: {usernames}"

    def test_admin_users_search_pagination(self, client: TestClient, admin_token: str) -> None:
        """Test admin users search pagination."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test pagination parameters
        response = client.get(
            "/api/admin/users/search",
            params={"page": "1", "limit": "5"},
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        
        # Validate pagination info
        assert responseData["page"] == 1
        assert responseData["limit"] == 5
        assert responseData["totalPages"] >= 1
        assert isinstance(responseData["hasNext"], bool)
        assert isinstance(responseData["hasPrev"], bool)
        
        # For page 1, hasPrev should be False
        assert responseData["hasPrev"] is False

    def test_admin_users_search_multiple_filters(self, client: TestClient, admin_token: str) -> None:
        """Test admin users search with multiple combined filters."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test user that matches multiple criteria
        userData: Dict[str, str] = {
            "username": "multifilter_test_user",
            "firstname": "Multi",
            "email": "multifilter@example.com",
            "password": "TestPass123!"
        }
        
        createResponse = client.post("/api/account", json=userData)
        assert createResponse.status_code == HTTPStatus.CREATED.value
        
        # Test multiple filters
        filters: Dict[str, Any] = {
            "username": "multifilter",
            "isActive": True,
            "isAdmin": False
        }
        filtersJson: str = json.dumps(filters)
        
        response = client.get(
            "/api/admin/users/search",
            params={"filters": filtersJson},
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        users: List[Dict[str, Any]] = responseData["users"]
        
        # Verify users match all criteria
        for user in users:
            if "multifilter" in user["username"]:
                assert user["isActive"] is True
                assert user["isAdmin"] is False

    def test_admin_users_search_invalid_json_filters(self, client: TestClient, admin_token: str) -> None:
        """Test admin users search with invalid JSON filters."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test invalid JSON
        response = client.get(
            "/api/admin/users/search",
            params={"filters": "invalid-json{"},
            headers=headers
        )
        assert response.status_code == HTTPStatus.BAD_REQUEST.value
        
        responseData: Dict[str, Any] = response.json()
        assert "Invalid JSON format" in responseData["detail"]

    def test_admin_users_search_invalid_json_sorts(self, client: TestClient, admin_token: str) -> None:
        """Test admin users search with invalid JSON sorts."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test invalid JSON
        response = client.get(
            "/api/admin/users/search",
            params={"sorts": "invalid-json["},
            headers=headers
        )
        assert response.status_code == HTTPStatus.BAD_REQUEST.value
        
        responseData: Dict[str, Any] = response.json()
        assert "Invalid JSON format" in responseData["detail"]

    def test_admin_users_search_empty_filters_and_sorts(self, client: TestClient, admin_token: str) -> None:
        """Test admin users search with empty filters and sorts."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        response = client.get(
            "/api/admin/users/search",
            params={"filters": "", "sorts": ""},
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        
        # Should return all users with default pagination
        assert "users" in responseData
        assert responseData["page"] == 1
        assert responseData["limit"] == 10

    def test_admin_users_search_sensitive_data_exclusion(self, client: TestClient, admin_token: str) -> None:
        """Test that admin users search excludes sensitive data."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        response = client.get("/api/admin/users/search", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        users: List[Dict[str, Any]] = responseData["users"]
        
        # Verify no sensitive fields are present
        for user in users:
            # Should NOT contain sensitive fields
            assert "hashedPassword" not in user
            assert "_id" not in user
            
            # Should contain safe fields
            expectedFields = ["id", "username", "email", "isActive", "isAdmin"]
            for field in expectedFields:
                assert field in user

    def test_admin_users_search_global_search_filter(self, client: TestClient, admin_token: str) -> None:
        """Test admin users search with global search filter."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test user with unique identifier
        userData: Dict[str, str] = {
            "username": "uniquesearchtest",
            "firstname": "Unique",
            "email": "uniquesearch@example.com",
            "password": "TestPass123!"
        }

        createResponse = client.post("/api/account", json=userData)
        assert createResponse.status_code == HTTPStatus.CREATED.value
        
        # Test global search - should search in username and email
        filters: Dict[str, Any] = {"search": "uniquesearch"}
        filtersJson: str = json.dumps(filters)
        
        response = client.get(
            "/api/admin/users/search",
            params={"filters": filtersJson},
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        users: List[Dict[str, Any]] = responseData["users"]
        
        # Should find the user we created
        found: bool = False
        for user in users:
            if ("uniquesearch" in user["username"].lower() or 
                "uniquesearch" in user["email"].lower()):
                found = True
                break
        assert found, "User with 'uniquesearch' not found in global search"

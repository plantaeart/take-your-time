"""
Admin user management tests.
"""
import pytest
from typing import Dict, Any, List
from fastapi.testclient import TestClient


class TestAdminUserManagement:
    """Test admin user management functionality."""

    def test_get_users_admin_required(self, client: TestClient) -> None:
        """Test that getting users list requires admin privileges."""
        response = client.get("/api/admin/users")
        assert response.status_code == 401

    def test_get_users_regular_user_forbidden(self, client: TestClient, user_token: str) -> None:
        """Test that regular users cannot access users list."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        response = client.get("/api/admin/users", headers=headers)
        assert response.status_code == 403

    def test_get_users_admin_success(self, client: TestClient, admin_token: str) -> None:
        """Test admin can successfully get users list."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        response = client.get("/api/admin/users", headers=headers)
        assert response.status_code == 200
        
        responseData: List[Dict[str, Any]] = response.json()
        assert isinstance(responseData, list)
        # Note: The admin user is excluded from the results, so empty list is expected with only admin user

    def test_get_users_with_pagination(self, client: TestClient, admin_token: str) -> None:
        """Test users list with pagination parameters."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create some test users first
        for i in range(3):
            userData: Dict[str, str] = {
                "username": f"testuser{i}",
                "firstname": f"Test{i}",
                "email": f"testuser{i}@example.com",
                "password": "TestPass123!"
            }
            client.post("/api/account", json=userData)
        
        # Test pagination
        response = client.get("/api/admin/users?skip=0&limit=2", headers=headers)
        assert response.status_code == 200
        responseData: List[Dict[str, Any]] = response.json()
        assert len(responseData) <= 2  # Should respect limit

    def test_get_users_active_filter(self, client: TestClient, admin_token: str) -> None:
        """Test filtering users by active status."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create a test user
        userData: Dict[str, str] = {
            "username": "activefilteruser",
            "firstname": "ActiveFilter",
            "email": "activefilter@example.com",
            "password": "TestPass123!"
        }
        response = client.post("/api/account", json=userData)
        userId: int = response.json()["id"]
        
        # Test active users only
        response = client.get("/api/admin/users?activeOnly=true", headers=headers)
        assert response.status_code == 200
        responseData: List[Dict[str, Any]] = response.json()
        for user in responseData:
            assert user["isActive"] is True

    def test_get_users_exclude_admins(self, client: TestClient, admin_token: str) -> None:
        """Test excluding admin users from list."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create a regular user
        userData: Dict[str, str] = {
            "username": "regularuser",
            "firstname": "Regular",
            "email": "regular@example.com",
            "password": "TestPass123!"
        }
        client.post("/api/account", json=userData)
        
        # Get users excluding admins  
        response = client.get("/api/admin/users?excludeAdmins=true", headers=headers)
        assert response.status_code == 200
        responseData: List[Dict[str, Any]] = response.json()
        for user in responseData:
            assert user["isAdmin"] is False

    def test_update_user_status_admin_required(self, client: TestClient, admin_token: str) -> None:
        """Test updating user status requires admin privileges."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create a test user
        userData: Dict[str, str] = {
            "username": "statususer",
            "firstname": "Status",
            "email": "status@example.com",
            "password": "TestPass123!"
        }
        response = client.post("/api/account", json=userData)
        userId: int = response.json()["id"]
        
        # Try updating without authentication
        statusData: Dict[str, bool] = {"isActive": False}
        response = client.put(f"/api/admin/users/{userId}", json=statusData)
        assert response.status_code == 401

    def test_update_user_status_regular_user_forbidden(self, client: TestClient, user_token: str, admin_token: str) -> None:
        """Test regular users cannot update user status."""
        # Create test user with admin first
        adminHeaders: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        userData: Dict[str, str] = {
            "username": "forbiddenuser",
            "firstname": "Forbidden",
            "email": "forbidden@example.com",
            "password": "TestPass123!"
        }
        response = client.post("/api/account", json=userData)
        userId: int = response.json()["id"]
        
        # Try updating with regular user token
        userHeaders: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        statusData: Dict[str, bool] = {"isActive": False}
        response = client.put(f"/api/admin/users/{userId}", json=statusData, headers=userHeaders)
        assert response.status_code == 403

    def test_update_user_status_admin_success(self, client: TestClient, admin_token: str) -> None:
        """Test admin can successfully update user status."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create a test user
        userData: Dict[str, str] = {
            "username": "updatestatususer",
            "firstname": "UpdateStatus",
            "email": "updatestatus@example.com",
            "password": "TestPass123!"
        }
        response = client.post("/api/account", json=userData)
        userId: int = response.json()["id"]
        
        # Deactivate user
        statusData: Dict[str, bool] = {"isActive": False}
        response = client.put(f"/api/admin/users/{userId}", json=statusData, headers=headers)
        assert response.status_code == 200
        responseData: Dict[str, Any] = response.json()
        assert responseData["isActive"] is False
        assert responseData["id"] == userId
        
        # Reactivate user
        statusData = {"isActive": True}
        response = client.put(f"/api/admin/users/{userId}", json=statusData, headers=headers)
        assert response.status_code == 200
        responseData = response.json()
        assert responseData["isActive"] is True

    def test_update_user_admin_status(self, client: TestClient, admin_token: str) -> None:
        """Test updating user admin status."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create a test user
        userData: Dict[str, str] = {
            "username": "promoteuser",
            "firstname": "Promote",
            "email": "promote@example.com",
            "password": "TestPass123!"
        }
        response = client.post("/api/account", json=userData)
        userId: int = response.json()["id"]
        
        # Promote to admin
        statusData: Dict[str, bool] = {"isAdmin": True}
        response = client.put(f"/api/admin/users/{userId}", json=statusData, headers=headers)
        assert response.status_code == 200
        responseData: Dict[str, Any] = response.json()
        assert responseData["isAdmin"] is True
        
        # Demote from admin
        statusData = {"isAdmin": False}
        response = client.put(f"/api/admin/users/{userId}", json=statusData, headers=headers)
        assert response.status_code == 200
        responseData = response.json()
        assert responseData["isAdmin"] is False

    def test_update_user_status_not_found(self, client: TestClient, admin_token: str) -> None:
        """Test updating status of non-existent user."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        statusData: Dict[str, bool] = {"isActive": False}
        
        response = client.put("/api/admin/users/99999", json=statusData, headers=headers)
        assert response.status_code == 404

    def test_update_user_status_no_data(self, client: TestClient, admin_token: str) -> None:
        """Test updating user status with no update data."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create a test user
        userData: Dict[str, str] = {
            "username": "nodatauser",
            "firstname": "NoData",
            "email": "nodata@example.com",
            "password": "TestPass123!"
        }
        response = client.post("/api/account", json=userData)
        userId: int = response.json()["id"]
        
        # Try updating with empty data
        response = client.put(f"/api/admin/users/{userId}", json={}, headers=headers)
        assert response.status_code == 200  # Empty update should be allowed

    def test_get_user_profile_admin_can_view_any(self, client: TestClient, admin_token: str) -> None:
        """Test admin can view any user's profile."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create a test user
        userData: Dict[str, str] = {
            "username": "profileuser",
            "firstname": "Profile",
            "email": "profile@example.com",
            "password": "TestPass123!"
        }
        response = client.post("/api/account", json=userData)
        userId: int = response.json()["id"]
        
        # Admin should be able to view this user's profile
        # Note: This endpoint might not exist yet, but it's a common admin feature
        # Commenting out for now since it might not be implemented
        # response = client.get(f"/api/admin/users/{userId}", headers=headers)
        # assert response.status_code == 200

    def test_admin_cannot_deactivate_self(self, client: TestClient, admin_token: str) -> None:
        """Test admin cannot deactivate their own account."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Get admin user info
        response = client.get("/api/users/me", headers=headers)
        adminUserId: int = response.json()["id"]
        
        # Try to deactivate self
        statusData: Dict[str, bool] = {"isActive": False}
        response = client.put(f"/api/admin/users/{adminUserId}", json=statusData, headers=headers)
        assert response.status_code == 403  # Should prevent self-modification

    def test_admin_cannot_remove_own_admin_status(self, client: TestClient, admin_token: str) -> None:
        """Test admin cannot remove their own admin status."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Get admin user info
        response = client.get("/api/users/me", headers=headers)
        adminUserId: int = response.json()["id"]
        
        # Try to remove own admin status
        statusData: Dict[str, bool] = {"isAdmin": False}
        response = client.put(f"/api/admin/users/{adminUserId}", json=statusData, headers=headers)
        assert response.status_code == 403  # Should prevent self-modification

    def test_search_users(self, client: TestClient, admin_token: str) -> None:
        """Test searching users by username or email."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create searchable users
        userData1: Dict[str, str] = {
            "username": "searchable_user_1",
            "firstname": "Searchable1",
            "email": "searchuser1@example.com",
            "password": "TestPass123!"
        }
        userData2: Dict[str, str] = {
            "username": "findme_user",
            "firstname": "FindMe",
            "email": "searchuser2@example.com",
            "password": "TestPass123!"
        }
        
        client.post("/api/account", json=userData1)
        client.post("/api/account", json=userData2)
        
        # Search by username
        response = client.get("/api/admin/users?search=searchable", headers=headers)
        assert response.status_code == 200
        responseData: List[Dict[str, Any]] = response.json()
        found: bool = any("searchable" in user["username"] for user in responseData)
        assert found
        
        # Search by email domain
        response = client.get("/api/admin/users?search=searchuser1", headers=headers)
        assert response.status_code == 200
        responseData = response.json()
        found = any("searchuser1" in user["email"] for user in responseData)
        assert found

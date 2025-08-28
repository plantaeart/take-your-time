"""
Authentication tests.
"""
import pytest
from typing import Dict, Any
from fastapi.testclient import TestClient


class TestAuthentication:
    """Test authentication functionality."""

    def test_register_new_user(self, client: TestClient) -> None:
        """Test user registration."""
        userData: Dict[str, str] = {
            "username": "testuser",
            "firstname": "Test",
            "email": "test@example.com",
            "password": "testpassword123"
        }

        response = client.post("/api/account", json=userData)
        assert response.status_code == 201
        
        responseData: Dict[str, Any] = response.json()
        assert responseData["username"] == "testuser"
        assert responseData["firstname"] == "Test"
        assert responseData["email"] == "test@example.com"
        assert responseData["isActive"] is True
        assert responseData["isAdmin"] is False
        assert "hashedPassword" not in responseData

    def test_register_duplicate_email(self, client: TestClient) -> None:
        """Test registration with duplicate email fails."""
        userData: Dict[str, str] = {
            "username": "user1",
            "firstname": "User",
            "email": "duplicate@example.com",
            "password": "password123"
        }
        
        # First registration should succeed
        response = client.post("/api/account", json=userData)
        assert response.status_code == 201
        
        # Second registration with same email should fail
        userData2: Dict[str, str] = {
            "username": "user2",
            "firstname": "User2",
            "email": "duplicate@example.com",
            "password": "password456"
        }
        response = client.post("/api/account", json=userData2)
        assert response.status_code == 400

    def test_register_duplicate_username(self, client: TestClient) -> None:
        """Test registration with duplicate username fails."""
        userData: Dict[str, str] = {
            "username": "duplicateuser",
            "firstname": "User",
            "email": "user1@example.com",
            "password": "password123"
        }
        
        # First registration should succeed
        response = client.post("/api/account", json=userData)
        assert response.status_code == 201
        
        # Second registration with same username should fail
        userData2: Dict[str, str] = {
            "username": "duplicateuser",
            "firstname": "User2",
            "email": "user2@example.com", 
            "password": "password456"
        }
        response = client.post("/api/account", json=userData2)
        assert response.status_code == 400

    def test_login_oauth2_format(self, client: TestClient) -> None:
        """Test user login with OAuth2 form data format."""
        # Register user first
        userData: Dict[str, str] = {
            "username": "loginuser",
            "firstname": "Login",
            "email": "login@example.com",
            "password": "loginpassword123"
        }
        client.post("/api/account", json=userData)
        
        # Login with OAuth2 format (form data) using /token endpoint
        loginData: Dict[str, str] = {
            "username": "login@example.com",
            "password": "loginpassword123"
        }
        response = client.post("/api/token", data=loginData)
        assert response.status_code == 200
        
        responseData: Dict[str, Any] = response.json()
        assert "access_token" in responseData
        assert responseData["token_type"] == "bearer"

    def test_login_email_format(self, client: TestClient) -> None:
        """Test user login with email as username using JSON endpoint."""
        # Register user first
        userData: Dict[str, str] = {
            "username": "emailuser",
            "firstname": "Email",
            "email": "email@example.com",
            "password": "emailpassword123"
        }
        client.post("/api/account", json=userData)
        
        # Login with JSON format using /login endpoint
        loginData: Dict[str, str] = {
            "email": "email@example.com",
            "password": "emailpassword123"
        }
        response = client.post("/api/login", json=loginData)
        assert response.status_code == 200
        
        responseData: Dict[str, Any] = response.json()
        assert "access_token" in responseData
        assert responseData["token_type"] == "bearer"

    def test_login_invalid_credentials(self, client: TestClient) -> None:
        """Test login with invalid credentials."""
        loginData: Dict[str, str] = {
            "username": "nonexistent@example.com",
            "password": "wrongpassword"
        }
        response = client.post("/api/token", data=loginData)
        assert response.status_code == 401

    def test_login_wrong_password(self, client: TestClient) -> None:
        """Test login with correct email but wrong password."""
        # Register user first
        userData: Dict[str, str] = {
            "username": "wrongpassuser",
            "firstname": "Wrong",
            "email": "wrongpass@example.com",
            "password": "correctpassword123"
        }
        client.post("/api/account", json=userData)
        
        # Try login with wrong password
        loginData: Dict[str, str] = {
            "email": "wrongpass@example.com",
            "password": "wrongpassword123"
        }
        response = client.post("/api/login", json=loginData)
        assert response.status_code == 401

    def test_logout_functionality(self, client: TestClient, user_token: str) -> None:
        """Test user logout functionality."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        
        # First verify token works
        response = client.get("/api/users/me", headers=headers)
        assert response.status_code == 200
        
        # Logout
        response = client.post("/api/logout", headers=headers)
        assert response.status_code == 200
        
        # Verify token is blacklisted (should not work anymore)
        response = client.get("/api/users/me", headers=headers)
        assert response.status_code == 401

    def test_access_protected_route_without_token(self, client: TestClient) -> None:
        """Test accessing protected route without token."""
        response = client.get("/api/users/me")
        assert response.status_code == 401

    def test_access_protected_route_with_invalid_token(self, client: TestClient) -> None:
        """Test accessing protected route with invalid token."""
        headers: Dict[str, str] = {"Authorization": "Bearer invalid_token"}
        response = client.get("/api/users/me", headers=headers)
        assert response.status_code == 401

    def test_get_current_user_info(self, client: TestClient, user_token: str) -> None:
        """Test getting current user information."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        response = client.get("/api/users/me", headers=headers)
        assert response.status_code == 200
        
        responseData: Dict[str, Any] = response.json()
        assert "username" in responseData
        assert "email" in responseData
        assert "firstname" in responseData
        assert "isActive" in responseData
        assert "isAdmin" in responseData
        assert responseData["isActive"] is True
        assert "hashedPassword" not in responseData

    def test_admin_login(self, client: TestClient) -> None:
        """Test regular user login (since admin users are created via create_admin_user)."""
        # Register regular user
        userData: Dict[str, str] = {
            "username": "admin",
            "firstname": "Admin",
            "email": "admin@example.com",
            "password": "adminpassword123"
        }
        client.post("/api/account", json=userData)
        
        # Login user
        loginData: Dict[str, str] = {
            "email": "admin@example.com",
            "password": "adminpassword123"
        }
        response = client.post("/api/login", json=loginData)
        assert response.status_code == 200
        
        responseData: Dict[str, Any] = response.json()
        assert "access_token" in responseData

    def test_token_refresh_after_login(self, client: TestClient) -> None:
        """Test that each login generates a new token."""
        import time
        # Register user
        userData: Dict[str, str] = {
            "username": "refreshuser",
            "firstname": "Refresh", 
            "email": "refresh@example.com",
            "password": "refreshpassword123"
        }
        client.post("/api/account", json=userData)
        
        # First login
        loginData: Dict[str, str] = {
            "email": "refresh@example.com",
            "password": "refreshpassword123"
        }
        response1 = client.post("/api/login", json=loginData)
        token1: str = response1.json()["access_token"]
        
        # Small delay to ensure different timestamps
        time.sleep(1)
        
        # Second login
        response2 = client.post("/api/login", json=loginData)
        token2: str = response2.json()["access_token"]
        
        # Tokens should be different (each login generates new token)
        assert token1 != token2

    def test_blacklisted_token_rejection(self, client: TestClient) -> None:
        """Test that blacklisted tokens are properly rejected."""
        # Register and login user
        userData: Dict[str, str] = {
            "username": "blacklistuser",
            "firstname": "Blacklist",
            "email": "blacklist@example.com", 
            "password": "blacklistpassword123"
        }
        client.post("/api/account", json=userData)
        
        loginData: Dict[str, str] = {
            "email": "blacklist@example.com",
            "password": "blacklistpassword123"
        }
        response = client.post("/api/login", json=loginData)
        token: str = response.json()["access_token"]
        headers: Dict[str, str] = {"Authorization": f"Bearer {token}"}
        
        # Verify token works
        response = client.get("/api/users/me", headers=headers)
        assert response.status_code == 200
        
        # Logout (blacklist token)
        client.post("/api/logout", headers=headers)
        
        # Try using blacklisted token
        response = client.get("/api/users/me", headers=headers)
        assert response.status_code == 401

    def test_multiple_logout_handling(self, client: TestClient) -> None:
        """Test multiple logout attempts with same token."""
        # Register and login user
        userData: Dict[str, str] = {
            "username": "multilogoutuser",
            "firstname": "Multi",
            "email": "multilogout@example.com",
            "password": "multilogoutpassword123"
        }
        client.post("/api/account", json=userData)
        
        loginData: Dict[str, str] = {
            "email": "multilogout@example.com",
            "password": "multilogoutpassword123"
        }
        response = client.post("/api/login", json=loginData)
        token: str = response.json()["access_token"]
        headers: Dict[str, str] = {"Authorization": f"Bearer {token}"}
        
        # First logout should succeed
        response = client.post("/api/logout", headers=headers)
        assert response.status_code == 200
        
        # Second logout with same token should fail (token already blacklisted)
        response = client.post("/api/logout", headers=headers)
        assert response.status_code == 401

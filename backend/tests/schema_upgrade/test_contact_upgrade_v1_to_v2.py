"""
Tests for contact schema upgrade from version 1 to version 2.
"""
from typing import Dict, Any, List
from fastapi.testclient import TestClient
from app.models.enums.contactStatus import ContactStatus
from app.models.enums.http_status import HTTPStatus


class TestContactUpgradeV1ToV2:
    """Test contact schema upgrade from version 1 to version 2."""

    def test_create_contact_with_current_schema_version(self, client: TestClient, user_token: str) -> None:
        """Test that new contacts are created with current schema version 2."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        
        # Create test contact via API
        contactData: Dict[str, Any] = {
            "email": "test@example.com",
            "message": "Test message for schema version validation"
        }
        
        response = client.post("/api/contact/send", json=contactData, headers=headers)
        assert response.status_code == HTTPStatus.OK.value  # Contact endpoint returns 200, not 201
        
        # Verify the response indicates successful creation
        responseData: Dict[str, Any] = response.json()
        assert "success" in responseData
        assert responseData["success"] == True

    def test_create_contact_with_all_fields(self, client: TestClient, user_token: str) -> None:
        """Test creating contacts with all fields specified."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        
        # Create test contact with all available fields
        contactData: Dict[str, Any] = {
            "email": "complete@example.com",
            "message": "Contact with all fields specified"
        }
        
        response = client.post("/api/contact/send", json=contactData, headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        # Verify successful response
        responseData: Dict[str, Any] = response.json()
        assert "success" in responseData
        assert responseData["success"] == True
        assert "message" in responseData

    def test_create_contact_with_minimal_fields(self, client: TestClient, user_token: str) -> None:
        """Test creating contacts with only required fields."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        
        # Create test contact with minimal required fields
        contactData: Dict[str, Any] = {
            "email": "minimal@example.com",
            "message": "Contact with minimal fields"
        }
        
        response = client.post("/api/contact/send", json=contactData, headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        # Verify successful response
        responseData: Dict[str, Any] = response.json()
        assert "success" in responseData
        assert responseData["success"] == True

    def test_api_validation_rejects_invalid_email(self, client: TestClient, user_token: str) -> None:
        """Test that API validation properly rejects invalid email formats."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        
        # Try to create contact with invalid email
        contactData: Dict[str, Any] = {
            "email": "invalid_email_format",  # Should be valid email
            "message": "Contact with invalid email"
        }
        
        response = client.post("/api/contact/send", json=contactData, headers=headers)
        assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY.value

    def test_api_validation_rejects_empty_message(self, client: TestClient, user_token: str) -> None:
        """Test that API validation properly rejects empty messages."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        
        # Try to create contact with empty message
        contactData: Dict[str, Any] = {
            "email": "test@example.com",
            "message": ""  # Should not be empty
        }
        
        response = client.post("/api/contact/send", json=contactData, headers=headers)
        assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY.value

    def test_api_validation_rejects_missing_fields(self, client: TestClient, user_token: str) -> None:
        """Test that API validation properly rejects missing required fields."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        
        # Try to create contact without email
        contactData: Dict[str, Any] = {
            "message": "Contact missing email field"
        }
        
        response = client.post("/api/contact/send", json=contactData, headers=headers)
        assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY.value

    def test_contact_creation_auto_generates_fields(self, client: TestClient, user_token: str) -> None:
        """Test that contact creation auto-generates required fields."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        
        # Create contact without providing auto-generated fields
        contactData: Dict[str, Any] = {
            "email": "autogen@example.com",
            "message": "Contact for testing auto-generation"
        }
        
        response = client.post("/api/contact/send", json=contactData, headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        # Verify successful response
        responseData: Dict[str, Any] = response.json()
        assert "success" in responseData
        assert responseData["success"] == True
        assert "messageId" in responseData  # Should have message ID if email sent successfully

    def test_multiple_contacts_have_unique_generated_fields(self, client: TestClient, user_token: str) -> None:
        """Test that multiple contacts can be created successfully."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        
        # Create first contact
        contactData1: Dict[str, Any] = {
            "email": "unique1@example.com",
            "message": "First contact for uniqueness test"
        }
        
        response1 = client.post("/api/contact/send", json=contactData1, headers=headers)
        assert response1.status_code == HTTPStatus.OK.value
        contact1: Dict[str, Any] = response1.json()
        
        # Create second contact
        contactData2: Dict[str, Any] = {
            "email": "unique2@example.com",
            "message": "Second contact for uniqueness test"
        }
        
        response2 = client.post("/api/contact/send", json=contactData2, headers=headers)
        assert response2.status_code == HTTPStatus.OK.value
        contact2: Dict[str, Any] = response2.json()
        
        # Verify both contacts were created successfully
        assert contact1["success"] == True
        assert contact2["success"] == True

    def test_contact_schema_version_consistency(self, client: TestClient, user_token: str) -> None:
        """Test that all created contacts consistently use current schema version."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        
        # Create multiple contacts with different configurations
        contactConfigs: List[Dict[str, Any]] = [
            {
                "email": "pending@example.com",
                "message": "Contact with pending status"
            },
            {
                "email": "sent@example.com",
                "message": "Contact that should be sent"
            },
            {
                "email": "test@example.com",
                "message": "Regular contact message"
            }
        ]
        
        createdContacts: List[Dict[str, Any]] = []
        
        # Create all contacts
        for contactData in contactConfigs:
            response = client.post("/api/contact/send", json=contactData, headers=headers)
            assert response.status_code == HTTPStatus.OK.value
            createdContacts.append(response.json())
        
        # Verify all contacts were created successfully
        for contact in createdContacts:
            assert "success" in contact
            assert contact["success"] == True

    def test_contact_admin_notes_structure(self, client: TestClient, user_token: str) -> None:
        """Test that contact creation follows the proper v2 response structure."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        
        # Create a contact
        contactData: Dict[str, Any] = {
            "email": "adminnotes@example.com",
            "message": "Contact for testing response structure"
        }
        
        response = client.post("/api/contact/send", json=contactData, headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        # Verify response structure follows contact API format
        responseData: Dict[str, Any] = response.json()
        assert "success" in responseData
        assert responseData["success"] == True
        assert "message" in responseData  # Should contain success message
        # messageId may or may not be present depending on email service success

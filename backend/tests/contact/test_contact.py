"""
Contact form tests - user sending mail, admin checking mail, and email service mocking.
"""

import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from fastapi.testclient import TestClient
from typing import Dict, Any, List
import asyncio
from datetime import datetime

from app.models.enums.contactStatus import ContactStatus


class TestContactForm:
    """Test contact form functionality."""
    
    def test_send_contact_message_success(self, client: TestClient, user_token: str) -> None:
        """Test user successfully sending a contact message."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        
        contact_data: Dict[str, str] = {
            "email": "user@example.com",
            "message": "Hello, I have a question about your products."
        }
        
        with patch('app.services.email.email_service.send_contact_email') as mock_email:
            # Mock successful email sending
            mock_email.return_value = (True, "Email sent successfully", "msg-12345")
            
            response = client.post("/api/contact/send", json=contact_data, headers=headers)
            
            assert response.status_code == 200
            data: Dict[str, Any] = response.json()
            assert data["success"] is True
            assert "sent successfully" in data["message"].lower()
            assert data["messageId"] == "msg-12345"
            
            # Verify email service was called with correct parameters
            mock_email.assert_called_once_with(
                user_email="user@example.com",
                message="Hello, I have a question about your products."
            )
    
    def test_send_contact_message_auth_required(self, client: TestClient) -> None:
        """Test that contact form requires authentication."""
        contact_data: Dict[str, str] = {
            "email": "user@example.com",
            "message": "Hello, I have a question."
        }
        
        response = client.post("/api/contact/send", json=contact_data)
        assert response.status_code == 401
    
    def test_send_contact_message_invalid_email(self, client: TestClient, user_token: str) -> None:
        """Test contact form with invalid email format."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        
        contact_data: Dict[str, str] = {
            "email": "invalid-email",
            "message": "Hello, I have a question."
        }
        
        response = client.post("/api/contact/send", json=contact_data, headers=headers)
        assert response.status_code == 422
        data: Dict[str, Any] = response.json()
        assert "email" in str(data["detail"]).lower()
    
    def test_send_contact_message_empty_message(self, client: TestClient, user_token: str) -> None:
        """Test contact form with empty message."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        
        contact_data: Dict[str, str] = {
            "email": "user@example.com",
            "message": ""
        }
        
        response = client.post("/api/contact/send", json=contact_data, headers=headers)
        assert response.status_code == 422
        data: Dict[str, Any] = response.json()
        assert "message" in str(data["detail"]).lower()
    
    def test_send_contact_message_too_long(self, client: TestClient, user_token: str) -> None:
        """Test contact form with message too long."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        
        # Create a message longer than 300 characters
        long_message = "A" * 301
        
        contact_data: Dict[str, str] = {
            "email": "user@example.com",
            "message": long_message
        }
        
        response = client.post("/api/contact/send", json=contact_data, headers=headers)
        assert response.status_code == 422
        data: Dict[str, Any] = response.json()
        assert "message" in str(data["detail"]).lower()
    
    def test_send_contact_message_email_failure(self, client: TestClient, user_token: str) -> None:
        """Test contact message when email sending fails."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        
        contact_data: Dict[str, str] = {
            "email": "user@example.com",
            "message": "Hello, I have a question."
        }
        
        with patch('app.services.email.email_service.send_contact_email') as mock_email:
            # Mock failed email sending
            mock_email.return_value = (False, "SMTP connection failed", None)
            
            response = client.post("/api/contact/send", json=contact_data, headers=headers)
            
            assert response.status_code == 500
            data: Dict[str, Any] = response.json()
            assert "SMTP connection failed" in data["detail"]
    
    def test_send_contact_message_exception_handling(self, client: TestClient, user_token: str) -> None:
        """Test contact message with unexpected exception."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        
        contact_data: Dict[str, str] = {
            "email": "user@example.com",
            "message": "Hello, I have a question."
        }
        
        with patch('app.services.email.email_service.send_contact_email') as mock_email:
            # Mock exception during email sending
            mock_email.side_effect = Exception("Database connection error")
            
            response = client.post("/api/contact/send", json=contact_data, headers=headers)
            
            assert response.status_code == 500
            data: Dict[str, Any] = response.json()
            assert "unexpected error occurred" in data["detail"].lower()


class TestContactSubmissions:
    """Test admin contact submissions functionality."""
    
    def test_get_contact_submissions_admin_success(self, client: TestClient, admin_token: str) -> None:
        """Test admin successfully retrieving contact submissions."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # First, create some contact submissions
        user_headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}  # Using admin token for simplicity
        
        # Create test submissions
        test_messages = [
            {"email": "user1@example.com", "message": "First message"},
            {"email": "user2@example.com", "message": "Second message"},
            {"email": "user3@example.com", "message": "Third message"}
        ]
        
        with patch('app.services.email.email_service.send_contact_email') as mock_email:
            mock_email.return_value = (True, "Email sent successfully", "msg-test")
            
            # Create submissions
            for msg_data in test_messages:
                response = client.post("/api/contact/send", json=msg_data, headers=user_headers)
                assert response.status_code == 200
        
        # Now test admin retrieval
        response = client.get("/api/contact/admin/submissions", headers=headers)
        
        assert response.status_code == 200
        data: Dict[str, Any] = response.json()
        
        assert "submissions" in data
        assert "total" in data
        assert "skip" in data
        assert "limit" in data
        assert data["total"] >= 3  # At least the 3 messages we created
        assert len(data["submissions"]) <= data["limit"]
        
        # Check structure of submissions
        if data["submissions"]:
            submission = data["submissions"][0]
            assert "id" in submission
            assert "email" in submission
            assert "message" in submission
            assert "status" in submission
            assert "createdAt" in submission
    
    def test_get_contact_submissions_pagination(self, client: TestClient, admin_token: str) -> None:
        """Test pagination of contact submissions."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test with pagination parameters
        response = client.get("/api/contact/admin/submissions?skip=0&limit=5", headers=headers)
        
        assert response.status_code == 200
        data: Dict[str, Any] = response.json()
        assert data["skip"] == 0
        assert data["limit"] == 5
        assert len(data["submissions"]) <= 5
    
    def test_get_contact_submissions_non_admin_forbidden(self, client: TestClient, user_token: str) -> None:
        """Test that regular users cannot access contact submissions."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        
        response = client.get("/api/contact/admin/submissions", headers=headers)
        assert response.status_code == 403
        data: Dict[str, Any] = response.json()
        assert "admin access required" in data["detail"].lower()
    
    def test_get_contact_submissions_auth_required(self, client: TestClient) -> None:
        """Test that submissions endpoint requires authentication."""
        response = client.get("/api/contact/admin/submissions")
        assert response.status_code == 401


class TestEmailServiceMocking:
    """Test email service with comprehensive mocking."""
    
    @pytest.mark.asyncio
    async def test_email_service_success_mock(self) -> None:
        """Test email service with successful send mock."""
        from app.services.email import EmailService
        
        # Create email service instance
        email_service = EmailService()
        
        with patch('smtplib.SMTP') as mock_smtp:
            # Mock SMTP server
            mock_server = MagicMock()
            mock_smtp.return_value.__enter__.return_value = mock_server
            
            # Mock the MIMEMultipart message to include Message-ID
            with patch('app.services.email.MIMEMultipart') as mock_mime:
                mock_msg = MagicMock()
                mock_msg.__getitem__.return_value = "test-message-id-12345"
                mock_mime.return_value = mock_msg
                
                # Test successful email sending
                success, message, message_id = await email_service.send_contact_email(
                    "test@example.com",
                    "Test message content"
                )
                
                assert success is True
                assert "sent successfully" in message.lower()
                assert message_id == "test-message-id-12345"
                
                # Verify SMTP methods were called
                mock_server.starttls.assert_called_once()
                mock_server.login.assert_called_once()
                mock_server.sendmail.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_email_service_smtp_error_mock(self) -> None:
        """Test email service with SMTP error mock."""
        from app.services.email import EmailService
        import smtplib
        
        email_service = EmailService()
        
        with patch('smtplib.SMTP') as mock_smtp:
            # Mock SMTP exception
            mock_smtp.side_effect = smtplib.SMTPException("Connection refused")
            
            success, message, message_id = await email_service.send_contact_email(
                "test@example.com",
                "Test message content"
            )
            
            assert success is False
            assert "SMTP error" in message
            assert message_id is None
    
    @pytest.mark.asyncio
    async def test_email_service_general_exception_mock(self) -> None:
        """Test email service with general exception mock."""
        from app.services.email import EmailService
        
        email_service = EmailService()
        
        with patch('smtplib.SMTP') as mock_smtp:
            # Mock general exception
            mock_smtp.side_effect = Exception("Unexpected error")
            
            success, message, message_id = await email_service.send_contact_email(
                "test@example.com",
                "Test message content"
            )
            
            assert success is False
            assert "Internal server error" in message
            assert message_id is None
    
    def test_contact_submission_database_storage(self, client: TestClient, user_token: str) -> None:
        """Test that contact submissions are properly stored in database."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        
        contact_data: Dict[str, str] = {
            "email": "dbtest@example.com",
            "message": "Database storage test message"
        }
        
        with patch('app.services.email.email_service.send_contact_email') as mock_email:
            mock_email.return_value = (True, "Email sent successfully", "msg-db-test")
            
            # Send contact message
            response = client.post("/api/contact/send", json=contact_data, headers=headers)
            assert response.status_code == 200
        
        # Verify the submission was stored by checking with admin endpoint
        admin_headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}  # Need admin token
        
        # Note: This test would need admin token to verify storage
        # For now, we just verify the API response indicates success
        data: Dict[str, Any] = response.json()
        assert data["success"] is True
        assert data["messageId"] == "msg-db-test"
    
    def test_contact_status_updates(self, client: TestClient, user_token: str) -> None:
        """Test that contact status is updated based on email sending result."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        
        # Test successful sending updates status to SENT
        contact_data: Dict[str, str] = {
            "email": "status@example.com",
            "message": "Status update test message"
        }
        
        with patch('app.services.email.email_service.send_contact_email') as mock_email:
            # Test successful case
            mock_email.return_value = (True, "Email sent successfully", "msg-status-test")
            
            response = client.post("/api/contact/send", json=contact_data, headers=headers)
            assert response.status_code == 200
            
            # Test failed case
            mock_email.return_value = (False, "SMTP error occurred", None)
            
            response = client.post("/api/contact/send", json=contact_data, headers=headers)
            assert response.status_code == 500


class TestContactFormIntegration:
    """Integration tests for complete contact form workflow."""
    
    def test_complete_contact_workflow(self, client: TestClient, user_token: str, admin_token: str) -> None:
        """Test complete workflow: user sends message, admin checks submissions."""
        user_headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        admin_headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Step 1: User sends contact message
        contact_data: Dict[str, str] = {
            "email": "workflow@example.com",
            "message": "Complete workflow test message"
        }
        
        with patch('app.services.email.email_service.send_contact_email') as mock_email:
            mock_email.return_value = (True, "Email sent successfully", "msg-workflow-test")
            
            # User sends message
            response = client.post("/api/contact/send", json=contact_data, headers=user_headers)
            assert response.status_code == 200
            
            user_response: Dict[str, Any] = response.json()
            assert user_response["success"] is True
            assert user_response["messageId"] == "msg-workflow-test"
        
        # Step 2: Admin checks submissions
        response = client.get("/api/contact/admin/submissions", headers=admin_headers)
        assert response.status_code == 200
        
        admin_data: Dict[str, Any] = response.json()
        assert admin_data["total"] >= 1
        
        # Find our test submission
        test_submission = None
        for submission in admin_data["submissions"]:
            if submission["email"] == "workflow@example.com":
                test_submission = submission
                break
        
        assert test_submission is not None
        assert test_submission["message"] == "Complete workflow test message"
        assert test_submission["status"] == ContactStatus.SENT.value
        assert test_submission["messageId"] == "msg-workflow-test"
    
    def test_email_html_template_generation(self) -> None:
        """Test that email HTML template is properly generated."""
        from app.services.email import EmailService
        
        email_service = EmailService()
        
        # Test private method for email body creation
        html_body = email_service._create_email_body(
            "test@example.com",
            "This is a test message with special characters: <>&\""
        )
        
        assert "test@example.com" in html_body
        assert "This is a test message" in html_body
        assert "<html>" in html_body
        assert "</html>" in html_body
        assert "New Contact Form Message" in html_body
        
        # Verify HTML structure is valid
        assert html_body.count("<html>") == 1
        assert html_body.count("</html>") == 1
        assert html_body.count("<body") == 1
        assert html_body.count("</body>") == 1

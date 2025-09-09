"""
Tests for contact admin operations: assign admin, add note, and get admin users.
"""

import pytest
from typing import Dict, Any, List
from fastapi.testclient import TestClient
from app.models.enums.http_status import HTTPStatus
from app.models.enums.contactStatus import ContactStatus


class TestContactAdminOperations:
    """Test admin operations on contact submissions."""
    
    def test_assign_admin_to_contact_unauthorized(self, client: TestClient) -> None:
        """Test that assigning admin requires authentication."""
        assignData: Dict[str, int] = {"adminId": 1}
        
        response = client.post("/api/contact/admin/1/assign", json=assignData)
        assert response.status_code == HTTPStatus.UNAUTHORIZED.value
    
    def test_assign_admin_to_contact_forbidden(self, client: TestClient, user_token: str) -> None:
        """Test that regular users cannot assign admins to contacts."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        assignData: Dict[str, int] = {"adminId": 1}
        
        response = client.post("/api/contact/admin/1/assign", json=assignData, headers=headers)
        assert response.status_code == HTTPStatus.FORBIDDEN.value
    
    def test_assign_admin_to_nonexistent_contact(self, client: TestClient, admin_token: str) -> None:
        """Test assigning admin to non-existent contact."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        assignData: Dict[str, int] = {"adminId": 1}
        
        response = client.post("/api/contact/admin/99999/assign", json=assignData, headers=headers)
        assert response.status_code == HTTPStatus.NOT_FOUND.value
        assert "Contact submission not found" in response.json()["detail"]
    
    def test_assign_nonexistent_admin_to_contact(self, client: TestClient, admin_token: str) -> None:
        """Test assigning non-existent admin to contact."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # First create a contact
        contactData: Dict[str, str] = {
            "email": "test@example.com",
            "message": "Test message for admin assignment"
        }
        
        # Create contact (need user token first)
        userHeaders: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}  # Admin is also a user
        createResponse = client.post("/api/contact/send", json=contactData, headers=userHeaders)
        assert createResponse.status_code == HTTPStatus.OK.value
        
        # Get the contact ID from the submissions list
        submissionsResponse = client.get("/api/contact/admin/submissions", headers=headers)
        assert submissionsResponse.status_code == HTTPStatus.OK.value
        submissions: List[Dict[str, Any]] = submissionsResponse.json()["submissions"]
        assert len(submissions) > 0
        contactId: int = submissions[0]["id"]
        
        # Try to assign non-existent admin
        assignData: Dict[str, int] = {"adminId": 99999}
        response = client.post(f"/api/contact/admin/{contactId}/assign", json=assignData, headers=headers)
        assert response.status_code == HTTPStatus.NOT_FOUND.value
        assert "Admin user not found" in response.json()["detail"]
    
    def test_assign_admin_to_contact_success(self, client: TestClient, admin_token: str) -> None:
        """Test successfully assigning admin to contact."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # First create a contact
        contactData: Dict[str, str] = {
            "email": "test@example.com",
            "message": "Test message for admin assignment"
        }
        
        # Create contact
        createResponse = client.post("/api/contact/send", json=contactData, headers=headers)
        assert createResponse.status_code == HTTPStatus.OK.value
        
        # Get the contact ID
        submissionsResponse = client.get("/api/contact/admin/submissions", headers=headers)
        submissions: List[Dict[str, Any]] = submissionsResponse.json()["submissions"]
        contactId: int = submissions[0]["id"]
        
        # Get an admin user to assign (use the current admin)
        adminsResponse = client.get("/api/admin/users/admins", headers=headers)
        assert adminsResponse.status_code == HTTPStatus.OK.value
        adminUsers: List[Dict[str, Any]] = adminsResponse.json()
        assert len(adminUsers) > 0
        adminToAssign: int = adminUsers[0]["id"]
        
        # Assign admin to contact
        assignData: Dict[str, int] = {"adminId": adminToAssign}
        response = client.post(f"/api/contact/admin/{contactId}/assign", json=assignData, headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        assert responseData["success"] is True
        assert "assigned successfully" in responseData["message"]
        
        # Verify the assignment by checking the contact
        verifyResponse = client.get("/api/contact/admin/submissions", headers=headers)
        updatedSubmissions: List[Dict[str, Any]] = verifyResponse.json()["submissions"]
        updatedContact = next(s for s in updatedSubmissions if s["id"] == contactId)
        assert updatedContact["adminId"] == adminToAssign
    
    def test_add_admin_note_to_contact_unauthorized(self, client: TestClient) -> None:
        """Test that adding admin note requires authentication."""
        noteData: Dict[str, str] = {"note": "Test note"}
        
        response = client.post("/api/contact/admin/1/note", json=noteData)
        assert response.status_code == HTTPStatus.UNAUTHORIZED.value
    
    def test_add_admin_note_to_contact_forbidden(self, client: TestClient, user_token: str) -> None:
        """Test that regular users cannot add admin notes to contacts."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        noteData: Dict[str, str] = {"note": "Test note"}
        
        response = client.post("/api/contact/admin/1/note", json=noteData, headers=headers)
        assert response.status_code == HTTPStatus.FORBIDDEN.value
    
    def test_add_admin_note_to_nonexistent_contact(self, client: TestClient, admin_token: str) -> None:
        """Test adding admin note to non-existent contact."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        noteData: Dict[str, str] = {"note": "Test note"}
        
        response = client.post("/api/contact/admin/99999/note", json=noteData, headers=headers)
        assert response.status_code == HTTPStatus.NOT_FOUND.value
        assert "Contact submission not found" in response.json()["detail"]
    
    def test_add_empty_admin_note_validation(self, client: TestClient, admin_token: str) -> None:
        """Test validation for empty admin note."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create a contact first
        contactData: Dict[str, str] = {
            "email": "test@example.com",
            "message": "Test message for note"
        }
        createResponse = client.post("/api/contact/send", json=contactData, headers=headers)
        contactId: int = 1  # Assuming first contact
        
        # Try to add empty note
        emptyNoteData: Dict[str, str] = {"note": ""}
        response = client.post(f"/api/contact/admin/{contactId}/note", json=emptyNoteData, headers=headers)
        assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY.value
    
    def test_add_admin_note_success(self, client: TestClient, admin_token: str) -> None:
        """Test successfully adding admin note to contact."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create a contact
        contactData: Dict[str, str] = {
            "email": "test@example.com",
            "message": "Test message for note"
        }
        createResponse = client.post("/api/contact/send", json=contactData, headers=headers)
        assert createResponse.status_code == HTTPStatus.OK.value
        
        # Get the contact ID
        submissionsResponse = client.get("/api/contact/admin/submissions", headers=headers)
        submissions: List[Dict[str, Any]] = submissionsResponse.json()["submissions"]
        contactId: int = submissions[0]["id"]
        
        # Add admin note
        noteText: str = "This is a test admin note for validation"
        noteData: Dict[str, str] = {"note": noteText}
        response = client.post(f"/api/contact/admin/{contactId}/note", json=noteData, headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        assert responseData["success"] is True
        assert "note added successfully" in responseData["message"]
        
        # Verify the note was added by checking the contact
        verifyResponse = client.get("/api/contact/admin/submissions", headers=headers)
        updatedSubmissions: List[Dict[str, Any]] = verifyResponse.json()["submissions"]
        updatedContact = next(s for s in updatedSubmissions if s["id"] == contactId)
        assert len(updatedContact["adminNotes"]) > 0
        assert updatedContact["adminNotes"][0]["note"] == noteText
    
    def test_get_admin_users_unauthorized(self, client: TestClient) -> None:
        """Test that getting admin users requires authentication."""
        response = client.get("/api/admin/users/admins")
        assert response.status_code == HTTPStatus.UNAUTHORIZED.value
    
    def test_get_admin_users_forbidden(self, client: TestClient, user_token: str) -> None:
        """Test that regular users cannot get admin users list."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        
        response = client.get("/api/admin/users/admins", headers=headers)
        assert response.status_code == HTTPStatus.FORBIDDEN.value
    
    def test_get_admin_users_success(self, client: TestClient, admin_token: str) -> None:
        """Test successfully getting admin users list."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        response = client.get("/api/admin/users/admins", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        adminUsers: List[Dict[str, Any]] = response.json()
        assert isinstance(adminUsers, list)
        assert len(adminUsers) >= 1  # At least the current admin user
        
        # Verify structure of admin user data
        if len(adminUsers) > 0:
            adminUser = adminUsers[0]
            assert "id" in adminUser
            assert "username" in adminUser
            assert "email" in adminUser
            assert isinstance(adminUser["id"], int)
            assert isinstance(adminUser["username"], str)
            assert isinstance(adminUser["email"], str)
    
    def test_unassign_admin_from_contact_unauthorized(self, client: TestClient) -> None:
        """Test that unassigning admin requires authentication."""
        response = client.post("/api/contact/admin/1/unassign", json={})
        assert response.status_code == HTTPStatus.UNAUTHORIZED.value
    
    def test_unassign_admin_from_contact_forbidden(self, client: TestClient, user_token: str) -> None:
        """Test that regular users cannot unassign admins from contacts."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        
        response = client.post("/api/contact/admin/1/unassign", json={}, headers=headers)
        assert response.status_code == HTTPStatus.FORBIDDEN.value
    
    def test_unassign_admin_from_nonexistent_contact(self, client: TestClient, admin_token: str) -> None:
        """Test unassigning admin from non-existent contact."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        response = client.post("/api/contact/admin/99999/unassign", json={}, headers=headers)
        assert response.status_code == HTTPStatus.NOT_FOUND.value
        assert "Contact submission not found" in response.json()["detail"]
    
    def test_unassign_admin_from_contact_success(self, client: TestClient, admin_token: str) -> None:
        """Test successfully unassigning admin from contact."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create a contact and assign admin first
        contactData: Dict[str, str] = {
            "email": "test@example.com",
            "message": "Test message for unassignment"
        }
        createResponse = client.post("/api/contact/send", json=contactData, headers=headers)
        assert createResponse.status_code == HTTPStatus.OK.value
        
        # Get contact ID
        submissionsResponse = client.get("/api/contact/admin/submissions", headers=headers)
        submissions: List[Dict[str, Any]] = submissionsResponse.json()["submissions"]
        contactId: int = submissions[0]["id"]
        
        # Assign admin first
        adminsResponse = client.get("/api/admin/users/admins", headers=headers)
        adminUsers: List[Dict[str, Any]] = adminsResponse.json()
        adminToAssign: int = adminUsers[0]["id"]
        
        assignData: Dict[str, int] = {"adminId": adminToAssign}
        assignResponse = client.post(f"/api/contact/admin/{contactId}/assign", json=assignData, headers=headers)
        assert assignResponse.status_code == HTTPStatus.OK.value
        
        # Now unassign admin
        response = client.post(f"/api/contact/admin/{contactId}/unassign", json={}, headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        assert responseData["success"] is True
        assert "assignment removed successfully" in responseData["message"]
        
        # Verify the unassignment
        verifyResponse = client.get("/api/contact/admin/submissions", headers=headers)
        updatedSubmissions: List[Dict[str, Any]] = verifyResponse.json()["submissions"]
        updatedContact = next(s for s in updatedSubmissions if s["id"] == contactId)
        assert updatedContact["adminId"] is None


class TestContactAdminOperationsIntegration:
    """Integration tests for admin operations workflow."""
    
    def test_complete_admin_workflow(self, client: TestClient, admin_token: str) -> None:
        """Test complete workflow: create contact, assign admin, add note, unassign."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # 1. Create contact
        contactData: Dict[str, str] = {
            "email": "workflow@example.com",
            "message": "Test message for complete workflow"
        }
        createResponse = client.post("/api/contact/send", json=contactData, headers=headers)
        assert createResponse.status_code == HTTPStatus.OK.value
        
        # 2. Get contact ID
        submissionsResponse = client.get("/api/contact/admin/submissions", headers=headers)
        submissions: List[Dict[str, Any]] = submissionsResponse.json()["submissions"]
        contactId: int = submissions[0]["id"]
        
        # 3. Get admin users and assign one
        adminsResponse = client.get("/api/admin/users/admins", headers=headers)
        adminUsers: List[Dict[str, Any]] = adminsResponse.json()
        adminToAssign: int = adminUsers[0]["id"]
        
        assignData: Dict[str, int] = {"adminId": adminToAssign}
        assignResponse = client.post(f"/api/contact/admin/{contactId}/assign", json=assignData, headers=headers)
        assert assignResponse.status_code == HTTPStatus.OK.value
        
        # 4. Add admin note
        noteText: str = "Initial review - customer inquiry about products"
        noteData: Dict[str, str] = {"note": noteText}
        noteResponse = client.post(f"/api/contact/admin/{contactId}/note", json=noteData, headers=headers)
        assert noteResponse.status_code == HTTPStatus.OK.value
        
        # 5. Add another admin note
        secondNoteText: str = "Follow-up note - sent product information"
        secondNoteData: Dict[str, str] = {"note": secondNoteText}
        secondNoteResponse = client.post(f"/api/contact/admin/{contactId}/note", json=secondNoteData, headers=headers)
        assert secondNoteResponse.status_code == HTTPStatus.OK.value
        
        # 6. Verify all changes
        finalResponse = client.get("/api/contact/admin/submissions", headers=headers)
        finalSubmissions: List[Dict[str, Any]] = finalResponse.json()["submissions"]
        finalContact = next(s for s in finalSubmissions if s["id"] == contactId)
        
        # Verify admin assignment
        assert finalContact["adminId"] == adminToAssign
        
        # Verify admin notes
        assert len(finalContact["adminNotes"]) == 2
        notes = [note["note"] for note in finalContact["adminNotes"]]
        assert noteText in notes
        assert secondNoteText in notes
        
        # 7. Unassign admin
        unassignResponse = client.post(f"/api/contact/admin/{contactId}/unassign", json={}, headers=headers)
        assert unassignResponse.status_code == HTTPStatus.OK.value
        
        # 8. Verify unassignment (notes should remain)
        verifyResponse = client.get("/api/contact/admin/submissions", headers=headers)
        verifySubmissions: List[Dict[str, Any]] = verifyResponse.json()["submissions"]
        verifyContact = next(s for s in verifySubmissions if s["id"] == contactId)
        
        assert verifyContact["adminId"] is None
        assert len(verifyContact["adminNotes"]) == 2  # Notes should remain
    
    def test_multiple_admin_notes_ordering(self, client: TestClient, admin_token: str) -> None:
        """Test that admin notes are properly ordered by creation time."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create contact
        contactData: Dict[str, str] = {
            "email": "notes@example.com",
            "message": "Test message for note ordering"
        }
        createResponse = client.post("/api/contact/send", json=contactData, headers=headers)
        contactId: int = 1  # Assuming first contact
        
        # Add multiple notes in sequence
        notes: List[str] = [
            "First note - initial contact",
            "Second note - customer details verified",
            "Third note - issue resolved"
        ]
        
        for note in notes:
            noteData: Dict[str, str] = {"note": note}
            response = client.post(f"/api/contact/admin/{contactId}/note", json=noteData, headers=headers)
            assert response.status_code == HTTPStatus.OK.value
        
        # Verify note ordering
        submissionsResponse = client.get("/api/contact/admin/submissions", headers=headers)
        submissions: List[Dict[str, Any]] = submissionsResponse.json()["submissions"]
        contact = next(s for s in submissions if s["id"] == contactId)
        
        assert len(contact["adminNotes"]) == len(notes)
        
        # Verify notes are in chronological order
        for i, expectedNote in enumerate(notes):
            assert contact["adminNotes"][i]["note"] == expectedNote

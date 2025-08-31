"""
Tests for contact model changes focusing on AdminNote structure.
"""

import pytest
from typing import Dict, Any, List
from fastapi.testclient import TestClient
from datetime import datetime
from app.models.enums.http_status import HTTPStatus
from app.models.enums.contactStatus import ContactStatus
from app.models.contact import ContactModel, AdminNote


class TestContactAdminNotes:
    """Test AdminNote functionality in contact submissions."""
    
    def test_admin_note_creation(self) -> None:
        """Test AdminNote class creation and serialization."""
        adminId: int = 123
        noteText: str = "This is a test admin note"
        
        # Create admin note
        adminNote = AdminNote(adminId=adminId, note=noteText)
        
        # Verify properties
        assert adminNote.adminId == adminId
        assert adminNote.note == noteText
        assert isinstance(adminNote.createdAt, datetime)
        
        # Test to_dict conversion
        noteDict: Dict[str, Any] = adminNote.to_dict()
        assert noteDict["adminId"] == adminId
        assert noteDict["note"] == noteText
        assert "createdAt" in noteDict
        assert isinstance(noteDict["createdAt"], datetime)
        
    def test_admin_note_from_dict(self) -> None:
        """Test AdminNote creation from dictionary."""
        noteData: Dict[str, Any] = {
            "adminId": 456,
            "note": "Test note from dict",
            "createdAt": datetime.now()
        }
        
        adminNote = AdminNote.from_dict(noteData)
        
        assert adminNote.adminId == noteData["adminId"]
        assert adminNote.note == noteData["note"]
        assert adminNote.createdAt == noteData["createdAt"]
        
    def test_contact_model_admin_notes_initialization(self) -> None:
        """Test ContactModel initialization with admin notes."""
        contactId: int = 1
        email: str = "test@example.com"
        message: str = "Test contact message"
        
        # Test with empty admin notes
        contact = ContactModel(id=contactId, email=email, message=message)
        assert len(contact.adminNotes) == 0
        assert isinstance(contact.adminNotes, list)
        
        # Test with provided admin notes
        adminNotes: List[AdminNote] = [
            AdminNote(adminId=1, note="First note"),
            AdminNote(adminId=2, note="Second note")
        ]
        contact_with_notes = ContactModel(
            id=contactId, 
            email=email, 
            message=message, 
            adminNotes=adminNotes
        )
        assert len(contact_with_notes.adminNotes) == 2
        assert contact_with_notes.adminNotes[0].note == "First note"
        assert contact_with_notes.adminNotes[1].note == "Second note"
        
    def test_contact_model_add_admin_note(self) -> None:
        """Test adding admin notes to contact model."""
        contact = ContactModel(
            id=1,
            email="test@example.com", 
            message="Test message"
        )
        
        # Initially no notes
        assert len(contact.adminNotes) == 0
        
        # Add first note
        contact.add_admin_note(adminId=100, note="First admin note")
        assert len(contact.adminNotes) == 1
        assert contact.adminNotes[0].adminId == 100
        assert contact.adminNotes[0].note == "First admin note"
        
        # Add second note
        contact.add_admin_note(adminId=200, note="Second admin note")
        assert len(contact.adminNotes) == 2
        assert contact.adminNotes[1].adminId == 200
        assert contact.adminNotes[1].note == "Second admin note"
        
        # Verify notes are in order
        assert contact.adminNotes[0].note == "First admin note"
        assert contact.adminNotes[1].note == "Second admin note"
        
    def test_contact_model_to_dict_with_admin_notes(self) -> None:
        """Test ContactModel to_dict conversion with admin notes."""
        contact = ContactModel(
            id=1,
            email="test@example.com",
            message="Test message"
        )
        
        # Add admin notes
        contact.add_admin_note(adminId=123, note="Admin note 1")
        contact.add_admin_note(adminId=456, note="Admin note 2")
        
        # Convert to dict
        contactDict: Dict[str, Any] = contact.to_dict()
        
        # Verify admin notes structure
        assert "adminNotes" in contactDict
        assert isinstance(contactDict["adminNotes"], list)
        assert len(contactDict["adminNotes"]) == 2
        
        # Verify first note
        firstNote: Dict[str, Any] = contactDict["adminNotes"][0]
        assert firstNote["adminId"] == 123
        assert firstNote["note"] == "Admin note 1"
        assert "createdAt" in firstNote
        
        # Verify second note
        secondNote: Dict[str, Any] = contactDict["adminNotes"][1]
        assert secondNote["adminId"] == 456
        assert secondNote["note"] == "Admin note 2"
        assert "createdAt" in secondNote
        
    def test_contact_model_from_dict_with_admin_notes(self) -> None:
        """Test ContactModel creation from dict with admin notes."""
        contactData: Dict[str, Any] = {
            "id": 1,
            "email": "test@example.com",
            "message": "Test message",
            "userId": None,
            "status": ContactStatus.PENDING,
            "messageId": None,
            "errorMessage": None,
            "adminNotes": [
                {
                    "adminId": 111,
                    "note": "First reconstructed note",
                    "createdAt": datetime.now()
                },
                {
                    "adminId": 222,
                    "note": "Second reconstructed note", 
                    "createdAt": datetime.now()
                }
            ],
            "schemaVersion": 2,
            "createdAt": datetime.now(),
            "updatedAt": datetime.now()
        }
        
        # Create contact from dict
        contact = ContactModel.from_dict(contactData)
        
        # Verify contact properties
        assert contact.id == 1
        assert contact.email == "test@example.com"
        assert contact.message == "Test message"
        
        # Verify admin notes were reconstructed properly
        assert len(contact.adminNotes) == 2
        assert isinstance(contact.adminNotes[0], AdminNote)
        assert isinstance(contact.adminNotes[1], AdminNote)
        
        assert contact.adminNotes[0].adminId == 111
        assert contact.adminNotes[0].note == "First reconstructed note"
        assert contact.adminNotes[1].adminId == 222
        assert contact.adminNotes[1].note == "Second reconstructed note"
        
    def test_contact_model_round_trip_conversion(self) -> None:
        """Test full round-trip conversion: Model -> Dict -> Model."""
        # Create original contact
        originalContact = ContactModel(
            id=1,
            email="roundtrip@example.com",
            message="Round trip test message"
        )
        
        # Add admin notes
        originalContact.add_admin_note(adminId=333, note="Round trip note 1")
        originalContact.add_admin_note(adminId=444, note="Round trip note 2")
        
        # Convert to dict
        contactDict: Dict[str, Any] = originalContact.to_dict()
        
        # Convert back to model
        reconstructedContact = ContactModel.from_dict(contactDict)
        
        # Verify all properties match
        assert reconstructedContact.id == originalContact.id
        assert reconstructedContact.email == originalContact.email
        assert reconstructedContact.message == originalContact.message
        assert len(reconstructedContact.adminNotes) == len(originalContact.adminNotes)
        
        # Verify admin notes match
        for i in range(len(originalContact.adminNotes)):
            original_note = originalContact.adminNotes[i]
            reconstructed_note = reconstructedContact.adminNotes[i]
            
            assert reconstructed_note.adminId == original_note.adminId
            assert reconstructed_note.note == original_note.note
            # Note: createdAt might have slight differences due to serialization


class TestContactEndpointAdminNotes:
    """Test contact endpoints with admin notes functionality."""
    
    def test_contact_update_add_admin_note(self, client: TestClient, admin_token: str) -> None:
        """Test adding admin notes through contact update endpoint."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # First create a contact submission (simulate contact form submission)
        contactData: Dict[str, Any] = {
            "email": "adminnote@test.com",
            "message": "Test message for admin notes"
        }
        
        # Send contact message
        response = client.post("/api/contact/send", json=contactData, headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        # Get contact submissions to find the created contact
        response = client.get("/api/contact/admin/submissions", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        submissions: Dict[str, Any] = response.json()
        contactSubmission = None
        for submission in submissions["submissions"]:
            if submission["email"] == contactData["email"]:
                contactSubmission = submission
                break
        
        assert contactSubmission is not None
        contactId: int = contactSubmission["id"]
        
        # Update contact with admin note
        updateData: Dict[str, Any] = {
            "adminNote": "This is a test admin note added via API"
        }
        
        response = client.put(f"/api/contact/admin/{contactId}", json=updateData, headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        # Verify the admin note was added by getting submissions again
        response = client.get("/api/contact/admin/submissions", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        updatedSubmissions: Dict[str, Any] = response.json()
        updatedContact = None
        for submission in updatedSubmissions["submissions"]:
            if submission["id"] == contactId:
                updatedContact = submission
                break
        
        assert updatedContact is not None
        assert "adminNotes" in updatedContact
        assert len(updatedContact["adminNotes"]) == 1
        assert updatedContact["adminNotes"][0]["note"] == updateData["adminNote"]
        assert "adminId" in updatedContact["adminNotes"][0]
        assert "createdAt" in updatedContact["adminNotes"][0]
        
    def test_contact_update_multiple_admin_notes(self, client: TestClient, admin_token: str) -> None:
        """Test adding multiple admin notes to the same contact."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create contact submission
        contactData: Dict[str, Any] = {
            "email": "multinotes@test.com",
            "message": "Test message for multiple admin notes"
        }
        
        response = client.post("/api/contact/send", json=contactData, headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        # Get the contact ID
        response = client.get("/api/contact/admin/submissions", headers=headers)
        submissions: Dict[str, Any] = response.json()
        contactId: int = None
        for submission in submissions["submissions"]:
            if submission["email"] == contactData["email"]:
                contactId = submission["id"]
                break
        
        assert contactId is not None
        
        # Add first admin note
        updateData1: Dict[str, Any] = {
            "adminNote": "First admin note"
        }
        response = client.put(f"/api/contact/admin/{contactId}", json=updateData1, headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        # Add second admin note
        updateData2: Dict[str, Any] = {
            "adminNote": "Second admin note"
        }
        response = client.put(f"/api/contact/admin/{contactId}", json=updateData2, headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        # Verify both notes exist
        response = client.get("/api/contact/admin/submissions", headers=headers)
        submissions: Dict[str, Any] = response.json()
        updatedContact = None
        for submission in submissions["submissions"]:
            if submission["id"] == contactId:
                updatedContact = submission
                break
        
        assert updatedContact is not None
        assert len(updatedContact["adminNotes"]) == 2
        
        # Verify notes are in chronological order
        notes = updatedContact["adminNotes"]
        assert notes[0]["note"] == "First admin note"
        assert notes[1]["note"] == "Second admin note"
        
    def test_contact_update_status_and_admin_note(self, client: TestClient, admin_token: str) -> None:
        """Test updating both status and adding admin note in single request."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create contact submission
        contactData: Dict[str, Any] = {
            "email": "statusnote@test.com",
            "message": "Test message for status and admin note update"
        }
        
        response = client.post("/api/contact/send", json=contactData, headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        # Get contact ID
        response = client.get("/api/contact/admin/submissions", headers=headers)
        submissions: Dict[str, Any] = response.json()
        contactId: int = None
        for submission in submissions["submissions"]:
            if submission["email"] == contactData["email"]:
                contactId = submission["id"]
                break
        
        assert contactId is not None
        
        # Update both status and add admin note
        updateData: Dict[str, Any] = {
            "status": ContactStatus.SENT.value,
            "adminNote": "Contact has been processed and resolved"
        }
        
        response = client.put(f"/api/contact/admin/{contactId}", json=updateData, headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        # Verify both status and admin note were updated
        response = client.get("/api/contact/admin/submissions", headers=headers)
        submissions: Dict[str, Any] = response.json()
        updatedContact = None
        for submission in submissions["submissions"]:
            if submission["id"] == contactId:
                updatedContact = submission
                break
        
        assert updatedContact is not None
        assert updatedContact["status"] == ContactStatus.SENT.value
        assert len(updatedContact["adminNotes"]) == 1
        assert updatedContact["adminNotes"][0]["note"] == updateData["adminNote"]
        
    def test_contact_admin_note_unauthorized(self, client: TestClient, user_token: str) -> None:
        """Test that regular users cannot add admin notes."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        
        updateData: Dict[str, Any] = {
            "adminNote": "Unauthorized note attempt"
        }
        
        response = client.put("/api/contact/admin/999", json=updateData, headers=headers)
        assert response.status_code == HTTPStatus.FORBIDDEN.value
        
    def test_contact_admin_note_no_auth(self, client: TestClient) -> None:
        """Test that unauthenticated users cannot add admin notes."""
        updateData: Dict[str, Any] = {
            "adminNote": "Unauthenticated note attempt"
        }
        
        response = client.put("/api/contact/admin/999", json=updateData)
        assert response.status_code == HTTPStatus.UNAUTHORIZED.value

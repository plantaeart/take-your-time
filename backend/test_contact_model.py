#!/usr/bin/env python3

from app.models.contact import ContactModel, AdminNote
from datetime import datetime

def test_admin_notes():
    """Test ContactModel admin notes functionality."""
    # Create a contact with admin notes
    contact = ContactModel(
        id=1,
        email='test@test.com',
        message='Test message'
    )
    
    # Add admin notes
    contact.add_admin_note(1, 'First admin note')
    contact.add_admin_note(2, 'Second admin note')
    
    # Test to_dict conversion
    data = contact.to_dict()
    print('Contact data with admin notes:')
    print(f'Admin notes count: {len(data["adminNotes"])}')
    print(f'First note: {data["adminNotes"][0]}')
    
    # Test from_dict conversion
    new_contact = ContactModel.from_dict(data)
    print(f'Reconstructed contact admin notes count: {len(new_contact.adminNotes)}')
    print(f'First note adminId: {new_contact.adminNotes[0].adminId}')
    print('✅ Admin notes structure working correctly!')
    
    # Assertions for pytest
    assert len(data["adminNotes"]) == 2
    assert data["adminNotes"][0]["adminId"] == 1
    assert data["adminNotes"][0]["note"] == 'First admin note'
    assert len(new_contact.adminNotes) == 2
    assert new_contact.adminNotes[0].adminId == 1

if __name__ == "__main__":
    test_admin_notes()

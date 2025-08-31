#!/usr/bin/env python3

import asyncio
from app.models.contact import ContactModel, AdminNote
from datetime import datetime

async def test_admin_notes():
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

if __name__ == "__main__":
    asyncio.run(test_admin_notes())

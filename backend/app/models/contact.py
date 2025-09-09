"""
Contact model for storing contact form submissions in MongoDB.
"""

from datetime import datetime
from typing import Optional, Dict, Any, List
from pymongo import IndexModel, ASCENDING
from pymongo.collection import Collection

from app.config.database import db_manager
from app.models.enums.contactStatus import ContactStatus
from app.config.schema_versions import get_schema_version


class AdminNote:
    """Admin note entry for contact submissions."""
    
    def __init__(
        self,
        adminId: int,
        note: str,
        createdAt: Optional[datetime] = None
    ):
        self.adminId = adminId
        self.note = note
        self.createdAt = createdAt or datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert admin note to dictionary."""
        return {
            "adminId": self.adminId,
            "note": self.note,
            "createdAt": self.createdAt
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "AdminNote":
        """Create admin note from dictionary."""
        return cls(
            adminId=data["adminId"],
            note=data["note"],
            createdAt=data.get("createdAt")
        )


class ContactModel:
    """Contact form submission model for MongoDB storage."""
    
    def __init__(
        self,
        id: int,
        email: str,
        message: str,
        userId: Optional[int] = None,
        status: ContactStatus = ContactStatus.SENT,
        adminId: Optional[int] = None,
        messageId: Optional[str] = None,
        errorMessage: Optional[str] = None,
        adminNotes: Optional[List[AdminNote]] = None,
        schemaVersion: Optional[int] = None,
        createdAt: Optional[datetime] = None,
        updatedAt: Optional[datetime] = None
    ):
        self.id = id
        self.email = email
        self.message = message
        self.userId = userId
        self.status = status
        self.adminId = adminId
        self.messageId = messageId
        self.errorMessage = errorMessage
        self.adminNotes = adminNotes or []
        self.schemaVersion = schemaVersion or get_schema_version("contacts")
        self.createdAt = createdAt or datetime.now()
        self.updatedAt = updatedAt or datetime.now()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary for MongoDB storage."""
        return {
            "id": self.id,
            "email": self.email,
            "message": self.message,
            "userId": self.userId,
            "status": self.status,
            "adminId": self.adminId,
            "messageId": self.messageId,
            "errorMessage": self.errorMessage,
            "adminNotes": [note.to_dict() for note in self.adminNotes] if self.adminNotes else [],
            "schemaVersion": self.schemaVersion,
            "createdAt": self.createdAt,
            "updatedAt": self.updatedAt
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ContactModel":
        """Create model instance from MongoDB document."""
        # Handle admin notes conversion
        admin_notes_data = data.get("adminNotes", [])
        admin_notes = []
        if admin_notes_data:
            for note_data in admin_notes_data:
                if isinstance(note_data, dict):
                    admin_notes.append(AdminNote.from_dict(note_data))
                
        # Create new data dict with converted admin notes
        converted_data = data.copy()
        converted_data["adminNotes"] = admin_notes
        
        # Remove MongoDB's _id field if present
        if "_id" in converted_data:
            del converted_data["_id"]
        
        return cls(**converted_data)
    
    def update_status(self, status: ContactStatus, adminId: Optional[int] = None, message_id: Optional[str] = None, error_message: Optional[str] = None):
        """Update contact submission status and optionally assign admin."""
        self.status = status
        if adminId is not None:
            self.adminId = adminId
        self.messageId = message_id
        self.errorMessage = error_message
        self.updatedAt = datetime.now()
    
    def assign_admin(self, adminId: int):
        """Assign an admin to this contact submission."""
        self.adminId = adminId
        self.updatedAt = datetime.now()
    
    def unassign_admin(self):
        """Remove admin assignment from this contact submission."""
        self.adminId = None
        self.updatedAt = datetime.now()
    
    def add_admin_note(self, adminId: int, note: str):
        """Add an admin note to the contact submission."""
        admin_note = AdminNote(adminId=adminId, note=note)
        self.adminNotes.append(admin_note)
        self.updatedAt = datetime.now()


async def get_next_contact_id(collection: Optional[Collection] = None) -> int:
    """Get the next auto-incrementing ID for contact submissions."""
    if collection is None:
        collection = db_manager.get_collection("contacts")
    
    # Find the highest ID
    last_contact = await collection.find_one(
        {},
        sort=[("id", -1)],
        projection={"id": 1}
    )
    
    return (last_contact["id"] + 1) if last_contact else 1


async def create_contact_indexes():
    """Create indexes for the contacts collection."""
    collection: Collection = db_manager.get_collection("contacts")
    
    indexes = [
        IndexModel([("id", ASCENDING)], unique=True),
        IndexModel([("email", ASCENDING)]),
        IndexModel([("userId", ASCENDING)]),
        IndexModel([("status", ASCENDING)]),
        IndexModel([("createdAt", ASCENDING)]),
        IndexModel([("email", ASCENDING), ("createdAt", ASCENDING)])  # Compound index for user contact history
    ]
    
    await collection.create_indexes(indexes)

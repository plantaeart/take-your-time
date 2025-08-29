"""
Contact model for storing contact form submissions in MongoDB.
"""

from datetime import datetime
from typing import Optional, Dict, Any
from pymongo import IndexModel, ASCENDING
from pymongo.collection import Collection

from app.config.database import db_manager
from app.models.enums.contactStatus import ContactStatus


class ContactModel:
    """Contact form submission model for MongoDB storage."""
    
    def __init__(
        self,
        id: int,
        email: str,
        message: str,
        userId: Optional[int] = None,
        status: ContactStatus = ContactStatus.PENDING,
        messageId: Optional[str] = None,
        errorMessage: Optional[str] = None,
        schemaVersion: int = 1,
        createdAt: Optional[datetime] = None,
        updatedAt: Optional[datetime] = None
    ):
        self.id = id
        self.email = email
        self.message = message
        self.userId = userId
        self.status = status
        self.messageId = messageId
        self.errorMessage = errorMessage
        self.schemaVersion = schemaVersion
        self.createdAt = createdAt or datetime.utcnow()
        self.updatedAt = updatedAt or datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert model to dictionary for MongoDB storage."""
        return {
            "id": self.id,
            "email": self.email,
            "message": self.message,
            "userId": self.userId,
            "status": self.status,
            "messageId": self.messageId,
            "errorMessage": self.errorMessage,
            "schemaVersion": self.schemaVersion,
            "createdAt": self.createdAt,
            "updatedAt": self.updatedAt
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "ContactModel":
        """Create model instance from MongoDB document."""
        return cls(**data)
    
    def update_status(self, status: ContactStatus, message_id: Optional[str] = None, error_message: Optional[str] = None):
        """Update contact submission status."""
        self.status = status
        self.messageId = message_id
        self.errorMessage = error_message
        self.updatedAt = datetime.utcnow()


async def get_next_contact_id() -> int:
    """Get the next auto-incrementing ID for contact submissions."""
    collection: Collection = db_manager.get_collection("contacts")
    
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

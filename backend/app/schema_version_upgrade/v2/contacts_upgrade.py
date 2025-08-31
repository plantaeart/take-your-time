"""
Schema upgrade for contacts from version 1 to version 2.

Upgrade Details:
- Migrated adminNotes from simple string array to structured AdminNote objects
- Added adminId tracking for accountability
- Added createdAt timestamps for each admin note
- Ensured proper status field with ContactStatus enum values
"""

from datetime import datetime
from typing import Dict, Any, List
from pymongo.collection import Collection

from app.config.database import db_manager
from app.models.enums.contactStatus import ContactStatus


async def upgrade() -> Dict[str, Any]:
    """
    Upgrade contacts collection from version 1 to version 2.
    
    Returns:
        Dict containing upgrade results and statistics.
    """
    collection: Collection = db_manager.get_collection("contacts")
    target_version = 2
    
    upgrade_results = {
        "collection": "contacts",
        "from_version": 1,
        "to_version": target_version,
        "documents_processed": 0,
        "documents_upgraded": 0,
        "errors": [],
        "started_at": datetime.now()
    }
    
    try:
        # Find all documents with version 1 or no version
        documents_to_upgrade = await collection.find({
            "$or": [
                {"schemaVersion": 1},
                {"schemaVersion": {"$exists": False}}
            ]
        }).to_list(length=None)
        
        upgrade_results["documents_processed"] = len(documents_to_upgrade)
        
        for doc in documents_to_upgrade:
            try:
                update_fields: Dict[str, Any] = {
                    "schemaVersion": target_version,
                    "updatedAt": datetime.now()
                }
                
                # Migrate adminNotes from string array to structured AdminNote objects
                if "adminNotes" in doc:
                    admin_notes = doc["adminNotes"]
                    if admin_notes and isinstance(admin_notes, list):
                        # Convert string notes to AdminNote structure
                        structured_notes = []
                        for i, note in enumerate(admin_notes):
                            if isinstance(note, str):
                                # Convert string to AdminNote structure
                                structured_note = {
                                    "adminId": 1,  # Default admin ID for legacy notes
                                    "note": note,
                                    "createdAt": doc.get("updatedAt", doc.get("createdAt", datetime.now()))
                                }
                                structured_notes.append(structured_note)
                            elif isinstance(note, dict) and "adminId" in note:
                                # Already structured, keep as is
                                structured_notes.append(note)
                        
                        update_fields["adminNotes"] = structured_notes
                else:
                    # Ensure adminNotes field exists as empty array
                    update_fields["adminNotes"] = []
                
                # Ensure status field exists with proper enum value
                if "status" not in doc or not doc["status"]:
                    update_fields["status"] = ContactStatus.PENDING.value
                elif doc["status"] not in [status.value for status in ContactStatus]:
                    # Fix invalid status values
                    update_fields["status"] = ContactStatus.PENDING.value
                
                # Ensure required fields exist
                if "messageId" not in doc:
                    update_fields["messageId"] = None
                
                if "errorMessage" not in doc:
                    update_fields["errorMessage"] = None
                
                # Ensure userId field exists (can be null for anonymous contacts)
                if "userId" not in doc:
                    update_fields["userId"] = None
                
                # Update the document
                await collection.update_one(
                    {"_id": doc["_id"]},
                    {"$set": update_fields}
                )
                
                upgrade_results["documents_upgraded"] += 1
                
            except Exception as e:
                error_msg = f"Failed to upgrade contact {doc.get('id', 'unknown')}: {str(e)}"
                upgrade_results["errors"].append(error_msg)
    
    except Exception as e:
        upgrade_results["errors"].append(f"Upgrade process failed: {str(e)}")
    
    upgrade_results["completed_at"] = datetime.now()
    return upgrade_results

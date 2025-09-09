"""
Schema upgrade for contacts from version 2 to version 3.

Upgrade Details:
- Add adminId field to track which admin is assigned to review each contact submission
- Default adminId to None for existing submissions
- Update schemaVersion to 3
"""

from datetime import datetime
from typing import Dict, Any
from pymongo.collection import Collection
from app.config.database import db_manager


async def upgrade() -> Dict[str, Any]:
    """Upgrade contacts collection from version 2 to version 3."""
    collection: Collection = db_manager.get_collection("contacts")
    target_version = 3
    
    upgrade_results = {
        "collection": "contacts",
        "from_version": 2,
        "to_version": target_version,
        "documents_processed": 0,
        "documents_upgraded": 0,
        "errors": [],
        "started_at": datetime.now()
    }
    
    try:
        # Find documents with version 2
        documents_to_upgrade = await collection.find({
            "schemaVersion": 2
        }).to_list(length=None)
        
        upgrade_results["documents_processed"] = len(documents_to_upgrade)
        
        for doc in documents_to_upgrade:
            try:
                update_fields: Dict[str, Any] = {
                    "schemaVersion": target_version,
                    "updatedAt": datetime.now()
                }
                
                # Add adminId field with default value None
                if "adminId" not in doc:
                    update_fields["adminId"] = None
                
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

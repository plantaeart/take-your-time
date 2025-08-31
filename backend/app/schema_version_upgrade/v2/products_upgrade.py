"""
Schema upgrade for products from version 1 to version 2.

Upgrade Details:
- Enhanced pagination support with totalPages, hasNext, hasPrev fields
- Improved product response structure for better frontend integration
- Added proper field validation and type checking
"""

from datetime import datetime
from typing import Dict, Any, List
from pymongo.collection import Collection

from app.config.database import db_manager
from app.models.enums.category import Category
from app.models.enums.inventoryStatus import InventoryStatus


async def upgrade() -> Dict[str, Any]:
    """
    Upgrade products collection from version 1 to version 2.
    
    Returns:
        Dict containing upgrade results and statistics.
    """
    collection: Collection = db_manager.get_collection("products")
    target_version = 2
    
    upgrade_results = {
        "collection": "products",
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
                
                # Ensure all required fields exist with proper defaults
                if "category" not in doc or not doc["category"]:
                    update_fields["category"] = Category.ELECTRONICS.value
                
                if "inventoryStatus" not in doc or not doc["inventoryStatus"]:
                    update_fields["inventoryStatus"] = InventoryStatus.INSTOCK.value
                
                if "rating" not in doc:
                    update_fields["rating"] = None
                
                if "image" not in doc:
                    update_fields["image"] = None
                
                # Ensure numeric fields have proper types for pagination calculations
                if "price" in doc and not isinstance(doc["price"], (int, float)):
                    try:
                        update_fields["price"] = float(doc["price"])
                    except (ValueError, TypeError):
                        update_fields["price"] = 0.0
                
                if "quantity" in doc and not isinstance(doc["quantity"], int):
                    try:
                        update_fields["quantity"] = int(doc["quantity"])
                    except (ValueError, TypeError):
                        update_fields["quantity"] = 0
                
                # Update the document
                await collection.update_one(
                    {"_id": doc["_id"]},
                    {"$set": update_fields}
                )
                
                upgrade_results["documents_upgraded"] += 1
                
            except Exception as e:
                error_msg = f"Failed to upgrade product {doc.get('id', 'unknown')}: {str(e)}"
                upgrade_results["errors"].append(error_msg)
    
    except Exception as e:
        upgrade_results["errors"].append(f"Upgrade process failed: {str(e)}")
    
    upgrade_results["completed_at"] = datetime.now()
    return upgrade_results

"""
Database migration system for schema updates.

This module provides a comprehensive migration system that runs during app startup
to update database schemas when the application launches.
"""

import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
from pymongo.collection import Collection
from pymongo.cursor import Cursor

from app.config.database import db_manager
from app.config.schema_versions import SchemaVersions
from app.models.enums.category import Category
from app.models.enums.inventoryStatus import InventoryStatus
from app.models.enums.contactStatus import ContactStatus


class DatabaseMigrator:
    """Handles database schema migrations during application startup."""
    
    def __init__(self):
        self.migration_log: List[str] = []
    
    async def run_all_migrations(self) -> Dict[str, Any]:
        """
        Run all necessary migrations during application startup.
        
        Returns:
            Dict containing migration results and statistics.
        """
        migration_results: Dict[str, Any] = {
            "migrations_run": [],
            "collections_updated": [],
            "total_documents_migrated": 0,
            "errors": [],
            "started_at": datetime.now(),
            "completed_at": None
        }
        
        try:
            # Run migrations for each collection
            await self._migrate_products(migration_results)
            await self._migrate_contacts(migration_results)
            await self._migrate_carts(migration_results)
            await self._migrate_wishlists(migration_results)
            await self._migrate_users(migration_results)
            await self._migrate_token_blacklist(migration_results)
            
            # Create/update indexes after migrations
            await self._ensure_all_indexes(migration_results)
            
        except Exception as e:
            migration_results["errors"].append(f"Migration failed: {str(e)}")
        
        migration_results["completed_at"] = datetime.now()
        return migration_results
    
    async def _migrate_products(self, results: Dict[str, Any]) -> None:
        """Migrate products collection to schema version 2."""
        collection: Collection = db_manager.get_collection("products")
        current_version = SchemaVersions.PRODUCTS
        
        # Find documents that need migration
        cursor: Cursor = collection.find({
            "$or": [
                {"schemaVersion": {"$exists": False}},
                {"schemaVersion": {"$lt": current_version}}
            ]
        })
        
        documents_to_update: List[Dict[str, Any]] = await cursor.to_list(length=None)
        
        if not documents_to_update:
            return
        
        migration_count = 0
        for doc in documents_to_update:
            try:
                update_fields: Dict[str, Any] = {
                    "schemaVersion": current_version,
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
                
                # Ensure numeric fields have proper types
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
                
                await collection.update_one(
                    {"_id": doc["_id"]},
                    {"$set": update_fields}
                )
                migration_count += 1
                
            except Exception as e:
                results["errors"].append(f"Failed to migrate product {doc.get('id', 'unknown')}: {str(e)}")
        
        if migration_count > 0:
            results["migrations_run"].append(f"Products: {migration_count} documents updated to schema v{current_version}")
            results["collections_updated"].append("products")
            results["total_documents_migrated"] += migration_count
    
    async def _migrate_contacts(self, results: Dict[str, Any]) -> None:
        """Migrate contacts collection to schema version 2."""
        collection: Collection = db_manager.get_collection("contacts")
        current_version = SchemaVersions.CONTACTS
        
        # Find documents that need migration
        cursor: Cursor = collection.find({
            "$or": [
                {"schemaVersion": {"$exists": False}},
                {"schemaVersion": {"$lt": current_version}}
            ]
        })
        
        documents_to_update: List[Dict[str, Any]] = await cursor.to_list(length=None)
        
        if not documents_to_update:
            return
        
        migration_count = 0
        for doc in documents_to_update:
            try:
                update_fields: Dict[str, Any] = {
                    "schemaVersion": current_version,
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
                                    "adminId": 1,  # Default admin ID
                                    "note": note,
                                    "createdAt": doc.get("updatedAt", datetime.now())
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
                
                # Ensure required fields exist
                if "messageId" not in doc:
                    update_fields["messageId"] = None
                
                if "errorMessage" not in doc:
                    update_fields["errorMessage"] = None
                
                await collection.update_one(
                    {"_id": doc["_id"]},
                    {"$set": update_fields}
                )
                migration_count += 1
                
            except Exception as e:
                results["errors"].append(f"Failed to migrate contact {doc.get('id', 'unknown')}: {str(e)}")
        
        if migration_count > 0:
            results["migrations_run"].append(f"Contacts: {migration_count} documents updated to schema v{current_version}")
            results["collections_updated"].append("contacts")
            results["total_documents_migrated"] += migration_count
    
    async def _migrate_carts(self, results: Dict[str, Any]) -> None:
        """Migrate carts collection to current schema version."""
        collection: Collection = db_manager.get_collection("carts")
        current_version = SchemaVersions.CARTS
        
        # Find documents that need migration
        cursor: Cursor = collection.find({
            "$or": [
                {"schemaVersion": {"$exists": False}},
                {"schemaVersion": {"$lt": current_version}}
            ]
        })
        
        documents_to_update: List[Dict[str, Any]] = await cursor.to_list(length=None)
        
        if not documents_to_update:
            return
        
        migration_count = 0
        for doc in documents_to_update:
            try:
                update_fields: Dict[str, Any] = {
                    "schemaVersion": current_version,
                    "updatedAt": datetime.now()
                }
                
                # Ensure items field exists and has proper structure
                if "items" not in doc:
                    update_fields["items"] = []
                elif doc["items"]:
                    # Ensure each cart item has required fields
                    updated_items = []
                    for item in doc["items"]:
                        if isinstance(item, dict):
                            # Ensure item has all required fields
                            if "addedAt" not in item:
                                item["addedAt"] = datetime.now()
                            if "updatedAt" not in item:
                                item["updatedAt"] = datetime.now()
                            if "schemaVersion" not in item:
                                item["schemaVersion"] = current_version
                            updated_items.append(item)
                    update_fields["items"] = updated_items
                
                await collection.update_one(
                    {"_id": doc["_id"]},
                    {"$set": update_fields}
                )
                migration_count += 1
                
            except Exception as e:
                results["errors"].append(f"Failed to migrate cart {doc.get('userId', 'unknown')}: {str(e)}")
        
        if migration_count > 0:
            results["migrations_run"].append(f"Carts: {migration_count} documents updated to schema v{current_version}")
            results["collections_updated"].append("carts")
            results["total_documents_migrated"] += migration_count
    
    async def _migrate_wishlists(self, results: Dict[str, Any]) -> None:
        """Migrate wishlists collection to current schema version."""
        collection: Collection = db_manager.get_collection("wishlists")
        current_version = SchemaVersions.WISHLISTS
        
        # Find documents that need migration
        cursor: Cursor = collection.find({
            "$or": [
                {"schemaVersion": {"$exists": False}},
                {"schemaVersion": {"$lt": current_version}}
            ]
        })
        
        documents_to_update: List[Dict[str, Any]] = await cursor.to_list(length=None)
        
        if not documents_to_update:
            return
        
        migration_count = 0
        for doc in documents_to_update:
            try:
                update_fields: Dict[str, Any] = {
                    "schemaVersion": current_version,
                    "updatedAt": datetime.now()
                }
                
                # Ensure items field exists and has proper structure
                if "items" not in doc:
                    update_fields["items"] = []
                elif doc["items"]:
                    # Ensure each wishlist item has required fields
                    updated_items = []
                    for item in doc["items"]:
                        if isinstance(item, dict):
                            # Ensure item has all required fields
                            if "addedAt" not in item:
                                item["addedAt"] = datetime.now()
                            if "schemaVersion" not in item:
                                item["schemaVersion"] = current_version
                            updated_items.append(item)
                    update_fields["items"] = updated_items
                
                await collection.update_one(
                    {"_id": doc["_id"]},
                    {"$set": update_fields}
                )
                migration_count += 1
                
            except Exception as e:
                results["errors"].append(f"Failed to migrate wishlist {doc.get('userId', 'unknown')}: {str(e)}")
        
        if migration_count > 0:
            results["migrations_run"].append(f"Wishlists: {migration_count} documents updated to schema v{current_version}")
            results["collections_updated"].append("wishlists")
            results["total_documents_migrated"] += migration_count
    
    async def _migrate_users(self, results: Dict[str, Any]) -> None:
        """Migrate users collection to current schema version."""
        collection: Collection = db_manager.get_collection("users")
        current_version = SchemaVersions.USERS
        
        # Find documents that need migration
        cursor: Cursor = collection.find({
            "$or": [
                {"schemaVersion": {"$exists": False}},
                {"schemaVersion": {"$lt": current_version}}
            ]
        })
        
        documents_to_update: List[Dict[str, Any]] = await cursor.to_list(length=None)
        
        if not documents_to_update:
            return
        
        migration_count = 0
        for doc in documents_to_update:
            try:
                update_fields: Dict[str, Any] = {
                    "schemaVersion": current_version,
                    "updatedAt": datetime.now()
                }
                
                # Ensure boolean fields have proper defaults
                if "isActive" not in doc:
                    update_fields["isActive"] = True
                
                if "isAdmin" not in doc:
                    update_fields["isAdmin"] = False
                
                await collection.update_one(
                    {"_id": doc["_id"]},
                    {"$set": update_fields}
                )
                migration_count += 1
                
            except Exception as e:
                results["errors"].append(f"Failed to migrate user {doc.get('id', 'unknown')}: {str(e)}")
        
        if migration_count > 0:
            results["migrations_run"].append(f"Users: {migration_count} documents updated to schema v{current_version}")
            results["collections_updated"].append("users")
            results["total_documents_migrated"] += migration_count
    
    async def _migrate_token_blacklist(self, results: Dict[str, Any]) -> None:
        """Migrate token_blacklist collection to current schema version."""
        collection: Collection = db_manager.get_collection("token_blacklist")
        current_version = SchemaVersions.TOKEN_BLACKLIST
        
        # Find documents that need migration
        cursor: Cursor = collection.find({
            "$or": [
                {"schemaVersion": {"$exists": False}},
                {"schemaVersion": {"$lt": current_version}}
            ]
        })
        
        documents_to_update: List[Dict[str, Any]] = await cursor.to_list(length=None)
        
        if not documents_to_update:
            return
        
        migration_count = 0
        for doc in documents_to_update:
            try:
                update_fields: Dict[str, Any] = {
                    "schemaVersion": current_version
                }
                
                await collection.update_one(
                    {"_id": doc["_id"]},
                    {"$set": update_fields}
                )
                migration_count += 1
                
            except Exception as e:
                results["errors"].append(f"Failed to migrate token blacklist entry {doc.get('jti', 'unknown')}: {str(e)}")
        
        if migration_count > 0:
            results["migrations_run"].append(f"Token Blacklist: {migration_count} documents updated to schema v{current_version}")
            results["collections_updated"].append("token_blacklist")
            results["total_documents_migrated"] += migration_count
    
    async def _ensure_all_indexes(self, results: Dict[str, Any]) -> None:
        """Ensure all collections have proper indexes after migration."""
        try:
            # Import index creation functions
            from app.models.product import create_product_indexes
            from app.models.user import create_user_indexes
            from app.models.contact import create_contact_indexes
            
            # Create indexes for all collections
            await create_product_indexes()
            await create_user_indexes()
            await create_contact_indexes()
            
            results["migrations_run"].append("Indexes: All collection indexes ensured")
            
        except Exception as e:
            results["errors"].append(f"Failed to ensure indexes: {str(e)}")


# Global migrator instance
migrator = DatabaseMigrator()


async def run_startup_migrations() -> Dict[str, Any]:
    """
    Run database migrations during application startup.
    
    This function should be called from the startup event handler.
    
    Returns:
        Dict containing migration results and statistics.
    """
    return await migrator.run_all_migrations()


async def get_collection_schema_status() -> Dict[str, Dict[str, Any]]:
    """
    Get current schema status for all collections.
    
    Returns:
        Dict with collection names as keys and status info as values.
    """
    collections = ["products", "contacts", "carts", "wishlists", "users", "token_blacklist"]
    status: Dict[str, Dict[str, Any]] = {}
    
    for collection_name in collections:
        collection: Collection = db_manager.get_collection(collection_name)
        current_version = SchemaVersions.get_version(collection_name)
        
        # Count documents by schema version
        pipeline = [
            {
                "$group": {
                    "_id": "$schemaVersion",
                    "count": {"$sum": 1}
                }
            },
            {"$sort": {"_id": 1}}
        ]
        
        version_counts = {}
        async for doc in collection.aggregate(pipeline):
            version = doc["_id"] if doc["_id"] is not None else "no_version"
            version_counts[str(version)] = doc["count"]
        
        total_documents = await collection.count_documents({})
        
        status[collection_name] = {
            "current_version": current_version,
            "total_documents": total_documents,
            "version_distribution": version_counts,
            "needs_migration": any(
                int(v) < current_version for v in version_counts.keys() 
                if v != "no_version" and v.isdigit()
            ) or "no_version" in version_counts
        }
    
    return status

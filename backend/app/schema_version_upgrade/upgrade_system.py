"""
Main upgrade system that manages step-by-step schema upgrades.

This system checks all records and upgrades them one by one until they reach the current version.
"""

import importlib
from datetime import datetime
from typing import Dict, Any, List
from pymongo.collection import Collection

from app.config.database import db_manager
from app.config.schema_versions import SchemaVersions


class SchemaUpgradeSystem:
    """Manages step-by-step schema upgrades for all collections."""
    
    def __init__(self):
        self.upgrade_log: List[str] = []
    
    async def run_all_upgrades(self) -> Dict[str, Any]:
        """
        Run all necessary upgrades for all collections.
        
        Returns:
            Dict containing complete upgrade results.
        """
        upgrade_results = {
            "upgrades_run": [],
            "collections_upgraded": [],
            "total_documents_upgraded": 0,
            "errors": [],
            "started_at": datetime.now(),
            "completed_at": None
        }
        
        try:
            # Get all collections and their target versions
            collections_to_upgrade = {
                "products": SchemaVersions.PRODUCTS,
                "contacts": SchemaVersions.CONTACTS,
                "users": SchemaVersions.USERS,
                "carts": SchemaVersions.CARTS,
                "wishlists": SchemaVersions.WISHLISTS,
                "token_blacklist": SchemaVersions.TOKEN_BLACKLIST
            }
            
            for collection_name, target_version in collections_to_upgrade.items():
                collection_results = await self._upgrade_collection(collection_name, target_version)
                
                if collection_results["documents_upgraded"] > 0:
                    upgrade_results["upgrades_run"].extend(collection_results["upgrade_details"])
                    upgrade_results["collections_upgraded"].append(collection_name)
                    upgrade_results["total_documents_upgraded"] += collection_results["total_documents_upgraded"]
                
                if collection_results["errors"]:
                    upgrade_results["errors"].extend(collection_results["errors"])
        
        except Exception as e:
            upgrade_results["errors"].append(f"Upgrade system failed: {str(e)}")
        
        upgrade_results["completed_at"] = datetime.now()
        return upgrade_results
    
    async def _upgrade_collection(self, collection_name: str, target_version: int) -> Dict[str, Any]:
        """
        Upgrade a specific collection step by step to target version.
        
        Args:
            collection_name: Name of the collection to upgrade
            target_version: Target schema version
            
        Returns:
            Dict containing upgrade results for this collection.
        """
        collection: Collection = db_manager.get_collection(collection_name)
        
        results = {
            "collection": collection_name,
            "target_version": target_version,
            "documents_upgraded": 0,
            "total_documents_upgraded": 0,
            "upgrade_details": [],
            "errors": []
        }
        
        try:
            # Find the lowest version in the collection
            min_version_doc = await collection.find_one(
                {},
                sort=[("schemaVersion", 1)],
                projection={"schemaVersion": 1}
            )
            
            if not min_version_doc:
                # No documents in collection
                return results
            
            min_version = min_version_doc.get("schemaVersion", 1)
            
            # Upgrade step by step from min_version to target_version
            for version in range(min_version, target_version):
                from_version = version
                to_version = version + 1
                
                # Check if there are documents that need this upgrade
                docs_needing_upgrade = await collection.count_documents({
                    "$or": [
                        {"schemaVersion": from_version},
                        {"schemaVersion": {"$exists": False}} if from_version == 1 else {}
                    ]
                })
                
                if docs_needing_upgrade == 0:
                    continue
                
                # Run the specific version upgrade
                upgrade_result = await self._run_version_upgrade(collection_name, to_version)
                
                if upgrade_result:
                    results["upgrade_details"].append(
                        f"{collection_name}: {upgrade_result['documents_upgraded']} documents upgraded from v{from_version} to v{to_version}"
                    )
                    results["documents_upgraded"] += upgrade_result["documents_upgraded"]
                    results["total_documents_upgraded"] += upgrade_result["documents_upgraded"]
                    
                    if upgrade_result["errors"]:
                        results["errors"].extend(upgrade_result["errors"])
        
        except Exception as e:
            results["errors"].append(f"Failed to upgrade {collection_name}: {str(e)}")
        
        return results
    
    async def _run_version_upgrade(self, collection_name: str, target_version: int) -> Dict[str, Any]:
        """
        Run a specific version upgrade for a collection.
        
        Args:
            collection_name: Name of the collection
            target_version: Target version to upgrade to
            
        Returns:
            Dict containing upgrade results.
        """
        try:
            # Dynamically import the upgrade module
            module_path = f"app.schema_version_upgrade.v{target_version}.{collection_name}_upgrade"
            upgrade_module = importlib.import_module(module_path)
            
            # Call the upgrade function
            upgrade_result = await upgrade_module.upgrade()
            return upgrade_result
            
        except ImportError:
            # No upgrade module exists for this version/collection combination
            # This is normal for collections that don't need upgrades
            return {
                "collection": collection_name,
                "to_version": target_version,
                "documents_upgraded": 0,
                "errors": []
            }
        except Exception as e:
            return {
                "collection": collection_name,
                "to_version": target_version,
                "documents_upgraded": 0,
                "errors": [f"Upgrade failed: {str(e)}"]
            }


# Global upgrade system instance
upgrade_system = SchemaUpgradeSystem()


async def run_schema_upgrades() -> Dict[str, Any]:
    """
    Run all necessary schema upgrades during application startup.
    
    Returns:
        Dict containing upgrade results and statistics.
    """
    return await upgrade_system.run_all_upgrades()

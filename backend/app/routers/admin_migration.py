"""
Admin endpoints for database migration management.
"""
from typing import Annotated, Dict, Any
from fastapi import APIRouter, Depends, HTTPException

from app.auth.dependencies import admin_required
from app.models.user import UserModel
from app.models.enums.http_status import HTTPStatus
from app.schema_version_upgrade.upgrade_system import run_schema_upgrades, upgrade_system
from app.config.schema_versions import SchemaVersions

router = APIRouter(tags=["admin-migration"])


@router.get("/admin/migration/status")
async def get_migration_status(
    currentAdmin: Annotated[UserModel, Depends(admin_required)]
) -> Dict[str, Any]:
    """
    Get current database schema migration status.
    
    Returns information about schema versions and migration needs.
    """
    try:
        # Get current schema versions
        current_versions = SchemaVersions.get_all_versions()
        
        # Get collection status (simplified version for the new system)
        collections_to_check = ["products", "contacts", "users", "carts", "wishlists", "token_blacklist"]
        collection_status = {}
        needs_migration = False
        
        for collection_name in collections_to_check:
            target_version = SchemaVersions.get_version(collection_name)
            # This is a simplified status check
            collection_status[collection_name] = {
                "current_version": target_version,
                "needs_migration": False,  # Will be determined by the upgrade system
                "target_version": target_version
            }
        
        return {
            "current_schema_versions": current_versions,
            "collection_status": collection_status,
            "needs_migration": needs_migration,
            "migration_available": True,
            "upgrade_system": "structured_version_upgrades"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR.value,
            detail=f"Failed to get migration status: {str(e)}"
        )


@router.post("/admin/migration/run")
async def run_migration(
    currentAdmin: Annotated[UserModel, Depends(admin_required)]
) -> Dict[str, Any]:
    """
    Manually trigger database schema upgrades.
    
    This endpoint allows admins to run structured upgrades manually if needed.
    """
    try:
        # Run structured schema upgrades
        upgrade_results = await run_schema_upgrades()
        
        return {
            "success": True,
            "upgrade_results": upgrade_results,
            "message": "Database schema upgrades completed successfully"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR.value,
            detail=f"Schema upgrade failed: {str(e)}"
        )


@router.get("/admin/migration/schema-versions")
async def get_schema_versions(
    currentAdmin: Annotated[UserModel, Depends(admin_required)]
) -> Dict[str, Any]:
    """
    Get current schema versions for all collections.
    """
    try:
        current_versions = SchemaVersions.get_all_versions()
        
        return {
            "schema_versions": current_versions,
            "version_info": {
                "products": {
                    "version": current_versions["products"],
                    "changes": "Enhanced pagination with totalPages, hasNext, hasPrev fields"
                },
                "contacts": {
                    "version": current_versions["contacts"],
                    "changes": "AdminNote structure with adminId, note, createdAt fields"
                },
                "users": {
                    "version": current_versions["users"],
                    "changes": "Basic user structure with authentication fields"
                },
                "carts": {
                    "version": current_versions["carts"],
                    "changes": "Cart items with proper schema versioning"
                },
                "wishlists": {
                    "version": current_versions["wishlists"],
                    "changes": "Wishlist items with proper schema versioning"
                },
                "token_blacklist": {
                    "version": current_versions["token_blacklist"],
                    "changes": "JWT token blacklist for logout functionality"
                }
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=HTTPStatus.INTERNAL_SERVER_ERROR.value,
            detail=f"Failed to get schema versions: {str(e)}"
        )

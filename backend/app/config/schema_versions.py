"""
Schema version management for database collections.

This file defines the current schema version for each collection.
When updating schemas, increment the version number here.
"""

from typing import Dict


class SchemaVersions:
    """Centralized schema version management for all collections."""
    
    # Collection schema versions
    USERS = 1
    PRODUCTS = 2  # Updated for pagination enhancements and totalPages/hasNext/hasPrev fields
    CONTACTS = 3  # Updated to include adminId field for tracking admin assignments
    CARTS = 1
    WISHLISTS = 1
    TOKEN_BLACKLIST = 1
    
    @classmethod
    def get_version(cls, collection_name: str) -> int:
        """Get the current schema version for a collection."""
        collection_versions: Dict[str, int] = {
            "users": cls.USERS,
            "products": cls.PRODUCTS,
            "contacts": cls.CONTACTS,
            "carts": cls.CARTS,
            "wishlists": cls.WISHLISTS,
            "token_blacklist": cls.TOKEN_BLACKLIST,
        }
        
        return collection_versions.get(collection_name.lower(), 1)
    
    @classmethod
    def get_all_versions(cls) -> Dict[str, int]:
        """Get all collection schema versions."""
        return {
            "users": cls.USERS,
            "products": cls.PRODUCTS,
            "contacts": cls.CONTACTS,
            "carts": cls.CARTS,
            "wishlists": cls.WISHLISTS,
            "token_blacklist": cls.TOKEN_BLACKLIST,
        }


# For backward compatibility and easy access
def get_schema_version(collection_name: str) -> int:
    """Get the current schema version for a collection."""
    return SchemaVersions.get_version(collection_name)

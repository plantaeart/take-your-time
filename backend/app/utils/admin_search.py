"""
Admin Search Utilities - Generic search functionality for admin endpoints
"""

from typing import Dict, Any, List, Optional, Tuple
from app.config.database import db_manager


async def admin_search_objects(
    collection_name: str,
    page: int,
    limit: int,
    filters: Dict[str, Any],
    sorts: List[Dict[str, str]],
    allowed_fields: List[str]
) -> Dict[str, Any]:
    """
    Generic admin search function for any MongoDB collection
    
    Args:
        collection_name: Name of the MongoDB collection
        page: Page number (1-based)
        limit: Items per page
        filters: Dictionary of field filters
        sorts: List of sort configurations [{"field": "name", "direction": "asc"}]
        allowed_fields: List of fields that are allowed to be filtered/sorted
        
    Returns:
        Dictionary with items, pagination info, etc.
    """
    collection = db_manager.get_collection(collection_name)
    
    # Build MongoDB query from filters
    mongo_query = _build_mongo_query(filters, allowed_fields)
    
    # Build MongoDB sort from sorts
    mongo_sort = _build_mongo_sort(sorts, allowed_fields)
    
    # Calculate skip for pagination
    skip = (page - 1) * limit
    
    # Get total count for pagination
    total_count: int = await collection.count_documents(mongo_query)
    
    # Execute query with pagination and sorting
    cursor = collection.find(mongo_query)
    
    if mongo_sort:
        cursor = cursor.sort(mongo_sort)
    
    cursor = cursor.skip(skip).limit(limit)
    
    # Convert cursor to list
    items: List[Dict[str, Any]] = await cursor.to_list(length=None)
    
    # Calculate pagination info
    total_pages = (total_count + limit - 1) // limit
    has_next = page < total_pages
    has_prev = page > 1
    
    return {
        "items": items,
        "total": total_count,
        "page": page,
        "limit": limit,
        "totalPages": total_pages,
        "hasNext": has_next,
        "hasPrev": has_prev
    }


def _build_mongo_query(filters: Dict[str, Any], allowed_fields: List[str]) -> Dict[str, Any]:
    """
    Convert frontend filters to MongoDB query
    
    Supported filter types:
    - Text: {"name": "mouse"} -> {"name": {"$regex": "mouse", "$options": "i"}}
    - Number: {"id": 123} -> {"id": 123}
    - Range: {"price": [10, 50]} -> {"price": {"$gte": 10, "$lte": 50}}
    - Exact: {"category": "ELECTRONICS"} -> {"category": "ELECTRONICS"}
    - Global search: {"search": "text"} -> searches in name and description
    """
    query = {}
    
    for field, value in filters.items():
        # Skip if field not allowed
        if field not in allowed_fields and field != "search":
            continue
            
        # Handle global search specially
        if field == "search" and value:
            # Determine search fields based on allowed fields
            search_fields = []
            if "name" in allowed_fields:
                search_fields.append({"name": {"$regex": value, "$options": "i"}})
            if "description" in allowed_fields:
                search_fields.append({"description": {"$regex": value, "$options": "i"}})
            if "username" in allowed_fields:
                search_fields.append({"username": {"$regex": value, "$options": "i"}})
            if "email" in allowed_fields:
                search_fields.append({"email": {"$regex": value, "$options": "i"}})
            
            if search_fields:
                query["$or"] = search_fields
            continue
        
        # Skip empty values
        if value is None or value == "" or value == []:
            continue
            
        # Handle range filters (arrays with 2 elements)
        if isinstance(value, list) and len(value) == 2:
            min_val, max_val = value
            query[field] = {"$gte": min_val, "$lte": max_val}
        
        # Handle text fields (case-insensitive contains)
        elif isinstance(value, str) and field in ["name", "description", "email", "username"]:
            query[field] = {"$regex": value, "$options": "i"}
        
        # Handle exact matches (numbers, enums, etc.)
        else:
            query[field] = value
    
    return query


def _build_mongo_sort(sorts: List[Dict[str, str]], allowed_fields: List[str]) -> List[Tuple[str, int]]:
    """
    Convert frontend sorts to MongoDB sort list
    
    Args:
        sorts: [{"field": "name", "direction": "asc"}]
        allowed_fields: Fields allowed for sorting
        
    Returns:
        [("name", 1), ("price", -1)] for MongoDB sort()
    """
    mongo_sort = []
    
    for sort_config in sorts:
        field = sort_config.get("field")
        direction = sort_config.get("direction", "asc")
        
        # Skip if field not allowed
        if field not in allowed_fields:
            continue
            
        # Convert direction to MongoDB format
        sort_direction = 1 if direction == "asc" else -1
        mongo_sort.append((field, sort_direction))
    
    return mongo_sort

"""
Tests for admin search utility functions.
Tests the generic admin_search_objects function and query building utilities.
"""
import pytest
from typing import Dict, Any, List, Tuple

from app.utils.admin_search import admin_search_objects, _build_mongo_query, _build_mongo_sort
from app.models.enums.category import Category
from app.models.enums.inventoryStatus import InventoryStatus


class TestAdminSearchUtility:
    """Test admin search utility functions."""

    def test_build_mongo_query_text_filter(self) -> None:
        """Test building MongoDB query for text filters."""
        filters: Dict[str, Any] = {"name": "gaming"}
        allowed_fields: List[str] = ["name", "description", "price"]
        
        query: Dict[str, Any] = _build_mongo_query(filters, allowed_fields)
        
        expected: Dict[str, Any] = {
            "name": {"$regex": "gaming", "$options": "i"}
        }
        assert query == expected

    def test_build_mongo_query_exact_filter(self) -> None:
        """Test building MongoDB query for exact match filters."""
        filters: Dict[str, Any] = {
            "id": 123,
            "category": Category.ELECTRONICS.value,
            "isActive": True
        }
        allowed_fields: List[str] = ["id", "category", "isActive"]
        
        query: Dict[str, Any] = _build_mongo_query(filters, allowed_fields)
        
        expected: Dict[str, Any] = {
            "id": 123,
            "category": Category.ELECTRONICS.value,
            "isActive": True
        }
        assert query == expected

    def test_build_mongo_query_range_filter(self) -> None:
        """Test building MongoDB query for range filters."""
        filters: Dict[str, Any] = {
            "price": [10.0, 50.0],
            "quantity": [5, 20]
        }
        allowed_fields: List[str] = ["price", "quantity"]
        
        query: Dict[str, Any] = _build_mongo_query(filters, allowed_fields)
        
        expected: Dict[str, Any] = {
            "price": {"$gte": 10.0, "$lte": 50.0},
            "quantity": {"$gte": 5, "$lte": 20}
        }
        assert query == expected

    def test_build_mongo_query_global_search(self) -> None:
        """Test building MongoDB query for global search."""
        filters: Dict[str, Any] = {"search": "test query"}
        allowed_fields: List[str] = ["name", "description"]
        
        query: Dict[str, Any] = _build_mongo_query(filters, allowed_fields)
        
        expected: Dict[str, Any] = {
            "$or": [
                {"name": {"$regex": "test query", "$options": "i"}},
                {"description": {"$regex": "test query", "$options": "i"}}
            ]
        }
        assert query == expected

    def test_build_mongo_query_mixed_filters(self) -> None:
        """Test building MongoDB query with multiple filter types."""
        filters: Dict[str, Any] = {
            "name": "gaming",
            "price": [20.0, 100.0],
            "category": Category.ELECTRONICS.value,
            "id": 456
        }
        allowed_fields: List[str] = ["name", "price", "category", "id"]
        
        query: Dict[str, Any] = _build_mongo_query(filters, allowed_fields)
        
        expected: Dict[str, Any] = {
            "name": {"$regex": "gaming", "$options": "i"},
            "price": {"$gte": 20.0, "$lte": 100.0},
            "category": Category.ELECTRONICS.value,
            "id": 456
        }
        assert query == expected

    def test_build_mongo_query_skip_disallowed_fields(self) -> None:
        """Test that disallowed fields are skipped in query building."""
        filters: Dict[str, Any] = {
            "name": "test",
            "hashedPassword": "secret",  # Not allowed
            "unauthorizedField": "value"  # Not allowed
        }
        allowed_fields: List[str] = ["name", "description"]
        
        query: Dict[str, Any] = _build_mongo_query(filters, allowed_fields)
        
        expected: Dict[str, Any] = {
            "name": {"$regex": "test", "$options": "i"}
        }
        assert query == expected

    def test_build_mongo_query_skip_empty_values(self) -> None:
        """Test that empty values are skipped in query building."""
        filters: Dict[str, Any] = {
            "name": "",
            "description": None,
            "tags": [],
            "category": Category.ELECTRONICS.value,  # Valid value
            "price": 0  # Valid value (zero is not empty)
        }
        allowed_fields: List[str] = ["name", "description", "tags", "category", "price"]
        
        query: Dict[str, Any] = _build_mongo_query(filters, allowed_fields)
        
        expected: Dict[str, Any] = {
            "category": Category.ELECTRONICS.value,
            "price": 0
        }
        assert query == expected

    def test_build_mongo_sort_single_field(self) -> None:
        """Test building MongoDB sort for single field."""
        sorts: List[Dict[str, str]] = [{"field": "name", "direction": "asc"}]
        allowed_fields: List[str] = ["name", "price", "createdAt"]
        
        sort_list: List[Tuple[str, int]] = _build_mongo_sort(sorts, allowed_fields)
        
        expected: List[Tuple[str, int]] = [("name", 1)]
        assert sort_list == expected

    def test_build_mongo_sort_multiple_fields(self) -> None:
        """Test building MongoDB sort for multiple fields."""
        sorts: List[Dict[str, str]] = [
            {"field": "category", "direction": "asc"},
            {"field": "price", "direction": "desc"},
            {"field": "name", "direction": "asc"}
        ]
        allowed_fields: List[str] = ["name", "price", "category"]
        
        sort_list: List[Tuple[str, int]] = _build_mongo_sort(sorts, allowed_fields)
        
        expected: List[Tuple[str, int]] = [
            ("category", 1),
            ("price", -1),
            ("name", 1)
        ]
        assert sort_list == expected

    def test_build_mongo_sort_invalid_direction_defaults_to_desc(self) -> None:
        """Test that invalid sort direction defaults to descending (non-asc becomes desc)."""
        sorts: List[Dict[str, str]] = [
            {"field": "name", "direction": "invalid"},
            {"field": "price"}  # Missing direction
        ]
        allowed_fields: List[str] = ["name", "price"]
        
        sort_list: List[Tuple[str, int]] = _build_mongo_sort(sorts, allowed_fields)
        
        expected: List[Tuple[str, int]] = [
            ("name", -1),  # Invalid direction becomes desc
            ("price", 1)   # Missing direction defaults to "asc"
        ]
        assert sort_list == expected

    def test_build_mongo_sort_skip_disallowed_fields(self) -> None:
        """Test that disallowed fields are skipped in sort building."""
        sorts: List[Dict[str, str]] = [
            {"field": "name", "direction": "asc"},
            {"field": "hashedPassword", "direction": "desc"},  # Not allowed
            {"field": "price", "direction": "desc"}
        ]
        allowed_fields: List[str] = ["name", "price"]
        
        sort_list: List[Tuple[str, int]] = _build_mongo_sort(sorts, allowed_fields)
        
        expected: List[Tuple[str, int]] = [
            ("name", 1),
            ("price", -1)
        ]
        assert sort_list == expected

    def test_build_mongo_sort_empty_sorts(self) -> None:
        """Test building MongoDB sort with empty sorts list."""
        sorts: List[Dict[str, str]] = []
        allowed_fields: List[str] = ["name", "price"]
        
        sort_list: List[Tuple[str, int]] = _build_mongo_sort(sorts, allowed_fields)
        
        assert sort_list == []

    def test_build_mongo_query_non_text_fields_exact_match(self) -> None:
        """Test that non-text fields get exact match filters."""
        filters: Dict[str, Any] = {
            "category": "ELECTRONICS",  # String but not name/description
            "id": 123,
            "isActive": True,
            "rating": 4.5
        }
        allowed_fields: List[str] = ["category", "id", "isActive", "rating"]
        
        query: Dict[str, Any] = _build_mongo_query(filters, allowed_fields)
        
        expected: Dict[str, Any] = {
            "category": "ELECTRONICS",  # Exact match, not regex
            "id": 123,
            "isActive": True,
            "rating": 4.5
        }
        assert query == expected

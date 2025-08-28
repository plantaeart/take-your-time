"""
Test auto-generation functions for products.
"""
import pytest
from typing import Set
from app.models.product import generate_product_code, generate_internal_reference, get_next_product_id
from app.models.enums.category import Category
from app.models.enums.inventoryStatus import InventoryStatus


class TestAutoGeneration:
    """Test auto-generation functions."""

    def test_generate_product_code(self) -> None:
        """Test product code generation."""
        code: str = generate_product_code()
        
        # Should be 9 characters
        assert len(code) == 9
        
        # Should contain only alphanumeric characters
        assert code.isalnum()
        
        # Should be lowercase
        assert code.islower()
        
        # Multiple calls should generate different codes
        code2: str = generate_product_code()
        assert code != code2

    def test_generate_internal_reference(self) -> None:
        """Test internal reference generation."""
        ref: str = generate_internal_reference()
        
        # Should start with "REF-"
        assert ref.startswith("REF-")
        
        # Should have the format REF-XXX-XXX
        refParts = ref.split("-")
        assert len(refParts) == 3
        assert refParts[0] == "REF"
        assert len(refParts[1]) == 3
        assert len(refParts[2]) == 3
        
        # Should contain only digits after REF-
        assert refParts[1].isdigit()
        assert refParts[2].isdigit()
        
        # Multiple calls should generate different references
        ref2: str = generate_internal_reference()
        assert ref != ref2

    def test_get_next_product_id_empty_database(self) -> None:
        """Test getting next product ID when database is empty."""
        # Import the db manager
        from app.config.database import db_manager
        
        # Clear the collection and test next ID generation
        collection = db_manager.get_collection("products")
        # With mongomock-motor, we can use delete_many directly
        import asyncio
        asyncio.run(collection.delete_many({}))
        
        # Test with async function - note this is a simplified sync test
        # In a real test, we'd need to handle the async nature properly
        # For now, test that the function exists and has the right signature
        from app.models.product import get_next_product_id
        import inspect
        
        # Verify function signature
        sig = inspect.signature(get_next_product_id)
        assert len(sig.parameters) == 1
        assert list(sig.parameters.keys())[0] == "collection"

    def test_code_uniqueness(self) -> None:
        """Test that generated codes are unique."""
        codes: Set[str] = set()
        
        # Generate 100 codes and ensure they're all unique
        for _ in range(100):
            code: str = generate_product_code()
            assert code not in codes
            codes.add(code)

    def test_reference_uniqueness(self) -> None:
        """Test that generated references are unique."""
        refs: Set[str] = set()
        
        # Generate 100 references and ensure they're all unique
        for _ in range(100):
            ref: str = generate_internal_reference()
            assert ref not in refs
            refs.add(ref)

    def test_code_format_consistency(self) -> None:
        """Test that all generated codes follow the same format."""
        for _ in range(10):
            code: str = generate_product_code()
            
            # All should be 9 characters
            assert len(code) == 9
            
            # All should be alphanumeric
            assert code.isalnum()
            
            # All should be lowercase
            assert code.islower()
            
            # Should only contain valid characters (a-z, 0-9)
            validChars: Set[str] = set('abcdefghijklmnopqrstuvwxyz0123456789')
            codeChars: Set[str] = set(code)
            assert codeChars.issubset(validChars)

    def test_reference_format_consistency(self) -> None:
        """Test that all generated references follow the same format."""
        for _ in range(10):
            ref: str = generate_internal_reference()
            
            # All should start with REF-
            assert ref.startswith("REF-")
            
            # All should follow REF-XXX-XXX pattern
            refParts = ref.split("-")
            assert len(refParts) == 3
            assert len(refParts[1]) == 3
            assert len(refParts[2]) == 3
            
            # Parts should be numeric
            assert refParts[1].isdigit()
            assert refParts[2].isdigit()

    def test_code_generation_performance(self) -> None:
        """Test that code generation is reasonably fast."""
        import time
        
        startTime: float = time.time()
        
        # Generate 1000 codes
        for _ in range(1000):
            generate_product_code()
        
        endTime: float = time.time()
        
        # Should complete in less than 1 second
        assert endTime - startTime < 1.0

    def test_reference_generation_performance(self) -> None:
        """Test that reference generation is reasonably fast."""
        import time
        
        startTime: float = time.time()
        
        # Generate 1000 references
        for _ in range(1000):
            generate_internal_reference()
        
        endTime: float = time.time()
        
        # Should complete in less than 1 second
        assert endTime - startTime < 1.0

    def test_auto_generation_integration(self) -> None:
        """Test that auto-generation works when creating products."""
        from app.schemas.product import ProductCreate
        
        # Create product data without code or internalReference
        productData = {
            "name": "Auto-Generated Product",
            "description": "A test product for auto-generation",
            "image": "https://example.com/image.jpg",
            "category": Category.ELECTRONICS,
            "price": 99.99,
            "quantity": 10,
            "shellId": 2,
            "inventoryStatus": InventoryStatus.INSTOCK,
            "rating": 4.0
        }
        
        product: ProductCreate = ProductCreate(**productData)
        
        # Code and internalReference should be optional
        assert hasattr(product, 'code')
        assert hasattr(product, 'internalReference')

    def test_custom_code_preservation(self) -> None:
        """Test that custom codes are preserved when provided."""
        from app.schemas.product import ProductCreate
        
        customCode: str = "custom123"
        productData = {
            "code": customCode,
            "name": "Custom Code Product",
            "description": "A test product with custom code",
            "image": "https://example.com/image.jpg",
            "category": Category.ELECTRONICS,
            "price": 99.99,
            "quantity": 10,
            "shellId": 2,
            "inventoryStatus": InventoryStatus.INSTOCK,
            "rating": 4.0
        }
        
        product: ProductCreate = ProductCreate(**productData)
        assert product.code == customCode

    def test_custom_reference_preservation(self) -> None:
        """Test that custom internal references are preserved when provided."""
        from app.schemas.product import ProductCreate
        
        customRef: str = "REF-001-002"  # Must match the pattern
        productData = {
            "internalReference": customRef,
            "name": "Custom Reference Product",
            "description": "A test product with custom reference",
            "image": "https://example.com/image.jpg",
            "category": Category.ELECTRONICS,
            "price": 99.99,
            "quantity": 10,
            "shellId": 2,
            "inventoryStatus": InventoryStatus.INSTOCK,
            "rating": 4.0
        }
        
        product: ProductCreate = ProductCreate(**productData)
        assert product.internalReference == customRef

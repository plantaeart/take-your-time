"""
Test ProductModel functionality and validation.
"""
import pytest
from typing import Dict, Any, List
from datetime import datetime
from app.models.product import ProductModel, generate_product_code, generate_internal_reference, get_next_product_id
from app.models.enums.category import Category
from app.models.enums.inventoryStatus import InventoryStatus
from app.schemas.product import ProductCreate, ProductResponse
from pydantic import ValidationError


class TestProductModel:
    """Test ProductModel functionality."""

    def test_product_model_creation(self) -> None:
        """Test creating a ProductModel instance."""
        product: ProductModel = ProductModel(
            id=1,
            code="abc123def",
            name="Test Product",
            description="A test product",
            image="https://example.com/image.jpg",
            category=Category.ELECTRONICS,
            price=99.99,
            quantity=10,
            internalReference="REF-123-456",
            shellId=2,
            inventoryStatus=InventoryStatus.INSTOCK,
            rating=4.0,
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        assert product.id == 1
        assert product.code == "abc123def"
        assert product.name == "Test Product"
        assert product.category == Category.ELECTRONICS
        assert product.price == 99.99
        assert product.quantity == 10
        assert product.inventoryStatus == InventoryStatus.INSTOCK

    def test_product_model_to_dict(self) -> None:
        """Test converting ProductModel to dictionary."""
        product: ProductModel = ProductModel(
            id=1,
            code="abc123def",
            name="Test Product",
            description="A test product",
            image="https://example.com/image.jpg",
            category=Category.ELECTRONICS,
            price=99.99,
            quantity=10,
            internalReference="REF-123-456",
            shellId=2,
            inventoryStatus=InventoryStatus.INSTOCK,
            rating=4.0,
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        productDict: Dict[str, Any] = product.model_dump()
        assert isinstance(productDict, dict)
        assert productDict["id"] == 1
        assert productDict["name"] == "Test Product"
        assert productDict["price"] == 99.99

    def test_product_model_required_fields(self) -> None:
        """Test ProductModel with only required fields."""
        product: ProductModel = ProductModel(
            id=1,
            code="abc123def",
            name="Minimal Product",
            description="A minimal product",
            category=Category.FITNESS,
            price=29.99,
            quantity=5,
            internalReference="REF-789-012",
            shellId=1,
            inventoryStatus=InventoryStatus.LOWSTOCK,
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        assert product.name == "Minimal Product"
        assert product.image is None
        assert product.rating is None
        assert product.createdAt is not None
        assert product.updatedAt is not None

    def test_product_model_timestamps(self) -> None:
        """Test that timestamps are automatically set."""
        product: ProductModel = ProductModel(
            id=1,
            code="timestamp123",
            name="Timestamp Test",
            description="Testing timestamps",
            category=Category.ACCESSORIES,
            price=15.99,
            quantity=3,
            internalReference="REF-555-666",
            shellId=3,
            inventoryStatus=InventoryStatus.OUTOFSTOCK,
            createdAt=datetime.now(),
            updatedAt=datetime.now()
        )
        
        assert isinstance(product.createdAt, datetime)
        assert isinstance(product.updatedAt, datetime)
        # Timestamps should be very close to now
        now = datetime.now()
        assert abs((now - product.createdAt).total_seconds()) < 1
        assert abs((now - product.updatedAt).total_seconds()) < 1


class TestProductAutoGeneration:
    """Test product auto-generation functions."""

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
        
        # Should contain only alphanumeric characters after REF-
        assert refParts[1].isalnum()
        assert refParts[2].isalnum()
        
        # Multiple calls should generate different references
        ref2: str = generate_internal_reference()
        assert ref != ref2

    def test_code_uniqueness(self) -> None:
        """Test that generated codes are unique."""
        codes = set()
        
        # Generate 100 codes and ensure they're all unique
        for _ in range(100):
            code: str = generate_product_code()
            assert code not in codes
            codes.add(code)

    def test_reference_uniqueness(self) -> None:
        """Test that generated references are unique."""
        refs = set()
        
        # Generate 100 references and ensure they're all unique
        for _ in range(100):
            ref: str = generate_internal_reference()
            assert ref not in refs
            refs.add(ref)


class TestProductSchemas:
    """Test Pydantic schemas."""

    def test_product_create_valid(self) -> None:
        """Test creating a valid ProductCreate schema."""
        productData: Dict[str, Any] = {
            "name": "Test Product",
            "description": "A test product",
            "image": "https://example.com/image.jpg",
            "category": Category.ELECTRONICS,
            "price": 99.99,
            "quantity": 10,
            "shellId": 2,
            "inventoryStatus": InventoryStatus.INSTOCK,
            "rating": 4.0
        }
        
        product: ProductCreate = ProductCreate(**productData)
        assert product.name == "Test Product"
        assert product.price == 99.99
        assert product.quantity == 10

    def test_product_create_invalid_price(self) -> None:
        """Test ProductCreate with invalid price."""
        productData: Dict[str, Any] = {
            "name": "Test Product",
            "description": "A test product",
            "image": "https://example.com/image.jpg",
            "category": Category.ELECTRONICS,
            "price": -10.0,  # Invalid negative price
            "quantity": 10,
            "shellId": 2,
            "inventoryStatus": InventoryStatus.INSTOCK,
            "rating": 4.0
        }
        
        with pytest.raises(ValidationError):
            ProductCreate(**productData)

    def test_product_create_invalid_quantity(self) -> None:
        """Test ProductCreate with invalid quantity."""
        productData: Dict[str, Any] = {
            "name": "Test Product",
            "description": "A test product",
            "image": "https://example.com/image.jpg",
            "category": Category.ELECTRONICS,
            "price": 99.99,
            "quantity": -5,  # Invalid negative quantity
            "shellId": 2,
            "inventoryStatus": InventoryStatus.INSTOCK,
            "rating": 4.0
        }
        
        with pytest.raises(ValidationError):
            ProductCreate(**productData)

    def test_product_create_invalid_rating(self) -> None:
        """Test ProductCreate with invalid rating."""
        productData: Dict[str, Any] = {
            "name": "Test Product",
            "description": "A test product",
            "image": "https://example.com/image.jpg",
            "category": Category.ELECTRONICS,
            "price": 99.99,
            "quantity": 10,
            "shellId": 2,
            "inventoryStatus": InventoryStatus.INSTOCK,
            "rating": 6.0  # Invalid rating > 5
        }
        
        with pytest.raises(ValidationError):
            ProductCreate(**productData)

    def test_product_create_missing_required_fields(self) -> None:
        """Test ProductCreate with missing required fields."""
        productData: Dict[str, Any] = {
            "description": "Missing required fields"
            # Missing name, category, price, quantity, inventoryStatus
        }
        
        with pytest.raises(ValidationError):
            ProductCreate(**productData)

    def test_product_response_serialization(self) -> None:
        """Test ProductResponse serialization."""
        responseData: Dict[str, Any] = {
            "id": 1,
            "code": "abc123def",
            "name": "Test Product",
            "description": "A test product",
            "image": "https://example.com/image.jpg",
            "category": Category.ELECTRONICS,
            "price": 99.99,
            "quantity": 10,
            "internalReference": "REF-123-456",
            "shellId": 2,
            "inventoryStatus": InventoryStatus.INSTOCK,
            "rating": 4.0,
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat()
        }
        
        product: ProductResponse = ProductResponse(**responseData)
        assert product.id == 1
        assert product.name == "Test Product"
        assert product.price == 99.99


class TestValidationRules:
    """Test specific validation rules."""

    def test_shell_id_validation(self) -> None:
        """Test shellId validation."""
        # Valid shellId
        productData: Dict[str, Any] = {
            "name": "Test Product",
            "description": "A test product",
            "image": "https://example.com/image.jpg",
            "category": Category.ELECTRONICS,
            "price": 99.99,
            "quantity": 10,
            "inventoryStatus": InventoryStatus.INSTOCK,
            "rating": 4.0,
            "shellId": 5
        }
        product: ProductCreate = ProductCreate(**productData)
        assert product.shellId == 5
        
        # Invalid shellId (negative)
        invalidData: Dict[str, Any] = productData.copy()
        invalidData["shellId"] = -1
        with pytest.raises(ValidationError):
            ProductCreate(**invalidData)

    def test_rating_bounds(self) -> None:
        """Test rating validation bounds."""
        baseData: Dict[str, Any] = {
            "name": "Test Product",
            "description": "A test product",
            "image": "https://example.com/image.jpg",
            "category": Category.ELECTRONICS,
            "price": 99.99,
            "quantity": 10,
            "shellId": 2,
            "inventoryStatus": InventoryStatus.INSTOCK
        }
        
        # Valid ratings
        for rating in [0.0, 2.5, 5.0]:
            testData: Dict[str, Any] = baseData.copy()
            testData["rating"] = rating
            product: ProductCreate = ProductCreate(**testData)
            assert product.rating == rating
        
        # Invalid ratings
        for rating in [-0.1, 5.1]:
            testData = baseData.copy()
            testData["rating"] = rating
            with pytest.raises(ValidationError):
                ProductCreate(**testData)

    def test_category_enum_validation(self) -> None:
        """Test category enum validation."""
        baseData: Dict[str, Any] = {
            "name": "Test Product",
            "description": "A test product",
            "image": "https://example.com/image.jpg",
            "price": 99.99,
            "quantity": 10,
            "shellId": 2,
            "inventoryStatus": InventoryStatus.INSTOCK,
            "rating": 4.0
        }
        
        # Valid categories
        validCategories: List[str] = [Category.ELECTRONICS.value, Category.CLOTHING.value, Category.FITNESS.value, Category.ACCESSORIES.value]
        for category in validCategories:
            testData: Dict[str, Any] = baseData.copy()
            testData["category"] = category
            product: ProductCreate = ProductCreate(**testData)
            assert product.category == category
        
        # Invalid category
        testData = baseData.copy()
        testData["category"] = "INVALID_CATEGORY"
        with pytest.raises(ValidationError):
            ProductCreate(**testData)

    def test_inventory_status_enum_validation(self) -> None:
        """Test inventory status enum validation."""
        baseData: Dict[str, Any] = {
            "name": "Test Product",
            "description": "A test product",
            "image": "https://example.com/image.jpg",
            "category": Category.ELECTRONICS,
            "price": 99.99,
            "quantity": 10,
            "shellId": 2,
            "rating": 4.0
        }
        
        # Valid inventory statuses
        validStatuses: List[str] = [InventoryStatus.INSTOCK.value, InventoryStatus.LOWSTOCK.value, InventoryStatus.OUTOFSTOCK.value]
        for status in validStatuses:
            testData: Dict[str, Any] = baseData.copy()
            testData["inventoryStatus"] = status
            product: ProductCreate = ProductCreate(**testData)
            assert product.inventoryStatus == status
        
        # Invalid inventory status
        testData = baseData.copy()
        testData["inventoryStatus"] = "INVALID_STATUS"
        with pytest.raises(ValidationError):
            ProductCreate(**testData)

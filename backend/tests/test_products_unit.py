"""
Test individual product functions and model validation.
"""
import pytest
from datetime import datetime
from app.models.product import ProductModel, generate_product_code, generate_internal_reference, get_next_product_id
from app.models.enums.category import Category
from app.models.enums.inventoryStatus import InventoryStatus
from app.schemas.product import ProductCreate, ProductResponse
from pydantic import ValidationError


class TestProductModel:
    """Test ProductModel functionality."""

    def test_product_model_creation(self):
        """Test creating a ProductModel instance."""
        product = ProductModel(
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

    def test_product_model_to_dict(self):
        """Test converting ProductModel to dictionary."""
        product = ProductModel(
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
        
        product_dict = product.model_dump()
        assert isinstance(product_dict, dict)
        assert product_dict["id"] == 1
        assert product_dict["name"] == "Test Product"
        assert product_dict["price"] == 99.99


class TestProductSchemas:
    """Test Pydantic schemas."""

    def test_product_create_valid(self):
        """Test creating a valid ProductCreate schema."""
        product_data = {
            "name": "Test Product",
            "description": "A test product",
            "image": "https://example.com/image.jpg",
            "category": "ELECTRONICS",
            "price": 99.99,
            "quantity": 10,
            "shellId": 2,
            "inventoryStatus": "INSTOCK",
            "rating": 4.0
        }
        
        product = ProductCreate(**product_data)
        assert product.name == "Test Product"
        assert product.price == 99.99
        assert product.quantity == 10

    def test_product_create_invalid_price(self):
        """Test ProductCreate with invalid price."""
        product_data = {
            "name": "Test Product",
            "description": "A test product",
            "image": "https://example.com/image.jpg",
            "category": "ELECTRONICS",
            "price": -10.0,  # Invalid negative price
            "quantity": 10,
            "shellId": 2,
            "inventoryStatus": "INSTOCK",
            "rating": 4.0
        }
        
        with pytest.raises(ValidationError):
            ProductCreate(**product_data)

    def test_product_create_invalid_quantity(self):
        """Test ProductCreate with invalid quantity."""
        product_data = {
            "name": "Test Product",
            "description": "A test product",
            "image": "https://example.com/image.jpg",
            "category": "ELECTRONICS",
            "price": 99.99,
            "quantity": -5,  # Invalid negative quantity
            "shellId": 2,
            "inventoryStatus": "INSTOCK",
            "rating": 4.0
        }
        
        with pytest.raises(ValidationError):
            ProductCreate(**product_data)

    def test_product_create_invalid_rating(self):
        """Test ProductCreate with invalid rating."""
        product_data = {
            "name": "Test Product",
            "description": "A test product",
            "image": "https://example.com/image.jpg",
            "category": "ELECTRONICS",
            "price": 99.99,
            "quantity": 10,
            "shellId": 2,
            "inventoryStatus": "INSTOCK",
            "rating": 6.0  # Invalid rating > 5
        }
        
        with pytest.raises(ValidationError):
            ProductCreate(**product_data)

    def test_product_create_missing_required_fields(self):
        """Test ProductCreate with missing required fields."""
        product_data = {
            "description": "Missing required fields"
            # Missing name, category, price, quantity, inventoryStatus
        }
        
        with pytest.raises(ValidationError):
            ProductCreate(**product_data)

    def test_product_response_serialization(self):
        """Test ProductResponse serialization."""
        response_data = {
            "id": 1,
            "code": "abc123def",
            "name": "Test Product",
            "description": "A test product",
            "image": "https://example.com/image.jpg",
            "category": "ELECTRONICS",
            "price": 99.99,
            "quantity": 10,
            "internalReference": "REF-123-456",
            "shellId": 2,
            "inventoryStatus": "INSTOCK",
            "rating": 4.0,
            "createdAt": datetime.now().isoformat(),
            "updatedAt": datetime.now().isoformat()
        }
        
        product = ProductResponse(**response_data)
        assert product.id == 1
        assert product.name == "Test Product"
        assert product.price == 99.99


class TestValidationRules:
    """Test specific validation rules."""

    def test_shell_id_validation(self):
        """Test shellId validation."""
        # Valid shellId
        product_data = {
            "name": "Test Product",
            "description": "A test product",
            "image": "https://example.com/image.jpg",
            "category": "ELECTRONICS",
            "price": 99.99,
            "quantity": 10,
            "inventoryStatus": "INSTOCK",
            "rating": 4.0,
            "shellId": 5
        }
        product = ProductCreate(**product_data)
        assert product.shellId == 5
        
        # Invalid shellId (negative)
        invalid_data = product_data.copy()
        invalid_data["shellId"] = -1
        with pytest.raises(ValidationError):
            ProductCreate(**invalid_data)

    def test_rating_bounds(self):
        """Test rating validation bounds."""
        base_data = {
            "name": "Test Product",
            "description": "A test product",
            "image": "https://example.com/image.jpg",
            "category": "ELECTRONICS",
            "price": 99.99,
            "quantity": 10,
            "shellId": 2,
            "inventoryStatus": "INSTOCK"
        }
        
        # Valid ratings
        for rating in [0.0, 2.5, 5.0]:
            data = base_data.copy()
            data["rating"] = rating
            product = ProductCreate(**data)
            assert product.rating == rating
        
        # Invalid ratings
        for rating in [-0.1, 5.1]:
            data = base_data.copy()
            data["rating"] = rating
            with pytest.raises(ValidationError):
                ProductCreate(**data)

    def test_category_enum_validation(self):
        """Test category enum validation."""
        base_data = {
            "name": "Test Product",
            "description": "A test product",
            "image": "https://example.com/image.jpg",
            "price": 99.99,
            "quantity": 10,
            "shellId": 2,
            "inventoryStatus": "INSTOCK",
            "rating": 4.0
        }
        
        # Valid categories
        valid_categories = ["ELECTRONICS", "CLOTHING", "FITNESS", "ACCESSORIES"]
        for category in valid_categories:
            data = base_data.copy()
            data["category"] = category
            product = ProductCreate(**data)
            assert product.category == category
        
        # Invalid category
        data = base_data.copy()
        data["category"] = "INVALID_CATEGORY"
        with pytest.raises(ValidationError):
            ProductCreate(**data)

    def test_inventory_status_enum_validation(self):
        """Test inventory status enum validation."""
        base_data = {
            "name": "Test Product",
            "description": "A test product",
            "image": "https://example.com/image.jpg",
            "category": "ELECTRONICS",
            "price": 99.99,
            "quantity": 10,
            "shellId": 2,
            "rating": 4.0
        }
        
        # Valid inventory statuses
        valid_statuses = ["INSTOCK", "LOWSTOCK", "OUTOFSTOCK"]
        for status in valid_statuses:
            data = base_data.copy()
            data["inventoryStatus"] = status
            product = ProductCreate(**data)
            assert product.inventoryStatus == status
        
        # Invalid inventory status
        data = base_data.copy()
        data["inventoryStatus"] = "INVALID_STATUS"
        with pytest.raises(ValidationError):
            ProductCreate(**data)

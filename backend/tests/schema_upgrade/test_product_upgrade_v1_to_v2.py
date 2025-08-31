"""
Tests for product schema upgrade from version 1 to version 2.
"""
from typing import Dict, Any, List
from fastapi.testclient import TestClient
from app.models.enums.category import Category
from app.models.enums.inventoryStatus import InventoryStatus
from app.models.enums.http_status import HTTPStatus


class TestProductUpgradeV1ToV2:
    """Test product schema upgrade from version 1 to version 2."""

    def test_create_product_with_current_schema_version(self, client: TestClient, admin_token: str) -> None:
        """Test that new products are created with current schema version 2."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test product via API
        productData: Dict[str, Any] = {
            "name": "Test Product Current Schema",
            "description": "Product created with current API",
            "category": Category.ELECTRONICS.value,
            "price": 99.99,
            "quantity": 10,
            "shellId": 1,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        
        response = client.post("/api/products", json=productData, headers=headers)
        assert response.status_code == HTTPStatus.CREATED.value
        
        # Verify the product was created with current schema version 2
        responseData: Dict[str, Any] = response.json()
        assert "schemaVersion" in responseData
        assert responseData["schemaVersion"] == 2
        assert responseData["category"] == Category.ELECTRONICS.value
        assert responseData["inventoryStatus"] == InventoryStatus.INSTOCK.value

    def test_create_product_with_all_fields(self, client: TestClient, admin_token: str) -> None:
        """Test creating products with all fields specified."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test product with all optional fields
        productData: Dict[str, Any] = {
            "name": "Test Product All Fields",
            "description": "Product with all fields specified",
            "category": Category.FITNESS.value,
            "price": 299.99,
            "quantity": 8,
            "shellId": 2,
            "inventoryStatus": InventoryStatus.LOWSTOCK.value,
            "rating": 4.5,
            "image": "test-image.jpg"
        }
        
        response = client.post("/api/products", json=productData, headers=headers)
        assert response.status_code == HTTPStatus.CREATED.value
        
        # Verify all fields were preserved and schema version is current
        responseData: Dict[str, Any] = response.json()
        assert responseData["schemaVersion"] == 2
        assert responseData["category"] == Category.FITNESS.value
        assert responseData["inventoryStatus"] == InventoryStatus.LOWSTOCK.value
        assert responseData["rating"] == 4.5
        assert responseData["image"] == "test-image.jpg"

    def test_create_product_with_minimal_fields(self, client: TestClient, admin_token: str) -> None:
        """Test creating products with only required fields."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test product with minimal required fields
        productData: Dict[str, Any] = {
            "name": "Test Product Minimal",
            "description": "Product with minimal fields",
            "category": Category.CLOTHING.value,
            "price": 49.99,
            "quantity": 5,
            "shellId": 3,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        
        response = client.post("/api/products", json=productData, headers=headers)
        assert response.status_code == HTTPStatus.CREATED.value
        
        # Verify defaults are applied for optional fields
        responseData: Dict[str, Any] = response.json()
        assert responseData["schemaVersion"] == 2
        assert responseData["category"] == Category.CLOTHING.value
        assert responseData["inventoryStatus"] == InventoryStatus.INSTOCK.value
        assert responseData["rating"] is None  # Optional field default
        assert responseData["image"] is None   # Optional field default

    def test_api_validation_rejects_invalid_data_types(self, client: TestClient, admin_token: str) -> None:
        """Test that API validation properly rejects invalid data types."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Try to create product with invalid price type
        productData: Dict[str, Any] = {
            "name": "Test Product Invalid Price",
            "description": "Product with invalid price type",
            "category": Category.ELECTRONICS.value,
            "price": "invalid_price",  # Should be number
            "quantity": 10,
            "shellId": 4,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        
        response = client.post("/api/products", json=productData, headers=headers)
        assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY.value

    def test_api_validation_rejects_invalid_quantity(self, client: TestClient, admin_token: str) -> None:
        """Test that API validation properly rejects invalid quantity types."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Try to create product with invalid quantity type
        productData: Dict[str, Any] = {
            "name": "Test Product Invalid Quantity",
            "description": "Product with invalid quantity type",
            "category": Category.ELECTRONICS.value,
            "price": 99.99,
            "quantity": "invalid_quantity",  # Should be integer
            "shellId": 5,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        
        response = client.post("/api/products", json=productData, headers=headers)
        assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY.value

    def test_api_validation_rejects_invalid_category(self, client: TestClient, admin_token: str) -> None:
        """Test that API validation properly rejects invalid category values."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Try to create product with invalid category
        productData: Dict[str, Any] = {
            "name": "Test Product Invalid Category",
            "description": "Product with invalid category",
            "category": "INVALID_CATEGORY",  # Should be valid enum
            "price": 99.99,
            "quantity": 10,
            "shellId": 6,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        
        response = client.post("/api/products", json=productData, headers=headers)
        assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY.value

    def test_api_validation_rejects_invalid_inventory_status(self, client: TestClient, admin_token: str) -> None:
        """Test that API validation properly rejects invalid inventory status values."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Try to create product with invalid inventory status
        productData: Dict[str, Any] = {
            "name": "Test Product Invalid Status",
            "description": "Product with invalid inventory status",
            "category": Category.ELECTRONICS.value,
            "price": 99.99,
            "quantity": 10,
            "shellId": 7,
            "inventoryStatus": "INVALID_STATUS"  # Should be valid enum
        }
        
        response = client.post("/api/products", json=productData, headers=headers)
        assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY.value

    def test_product_creation_auto_generates_fields(self, client: TestClient, admin_token: str) -> None:
        """Test that product creation auto-generates required fields."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create product without providing auto-generated fields
        productData: Dict[str, Any] = {
            "name": "Test Product Auto Generation",
            "description": "Product for testing auto-generation",
            "category": Category.ACCESSORIES.value,
            "price": 79.99,
            "quantity": 15,
            "shellId": 8,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        
        response = client.post("/api/products", json=productData, headers=headers)
        assert response.status_code == HTTPStatus.CREATED.value
        
        # Verify auto-generated fields are present
        responseData: Dict[str, Any] = response.json()
        assert "id" in responseData
        assert "code" in responseData
        assert "internalReference" in responseData
        assert "createdAt" in responseData
        assert "updatedAt" in responseData
        assert responseData["schemaVersion"] == 2
        
        # Verify auto-generated field formats
        assert isinstance(responseData["id"], int)
        assert len(responseData["code"]) == 9  # Product code format
        assert responseData["internalReference"].startswith("REF-")  # Internal reference format

    def test_multiple_products_have_unique_generated_fields(self, client: TestClient, admin_token: str) -> None:
        """Test that multiple products get unique auto-generated fields."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create first product
        productData1: Dict[str, Any] = {
            "name": "Test Product Unique 1",
            "description": "First product for uniqueness test",
            "category": Category.ELECTRONICS.value,
            "price": 199.99,
            "quantity": 20,
            "shellId": 9,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        
        response1 = client.post("/api/products", json=productData1, headers=headers)
        assert response1.status_code == HTTPStatus.CREATED.value
        product1: Dict[str, Any] = response1.json()
        
        # Create second product
        productData2: Dict[str, Any] = {
            "name": "Test Product Unique 2",
            "description": "Second product for uniqueness test",
            "category": Category.FITNESS.value,
            "price": 299.99,
            "quantity": 12,
            "shellId": 10,
            "inventoryStatus": InventoryStatus.LOWSTOCK.value
        }
        
        response2 = client.post("/api/products", json=productData2, headers=headers)
        assert response2.status_code == HTTPStatus.CREATED.value
        product2: Dict[str, Any] = response2.json()
        
        # Verify both products have unique generated fields
        assert product1["id"] != product2["id"]
        assert product1["code"] != product2["code"]
        assert product1["internalReference"] != product2["internalReference"]
        assert product1["schemaVersion"] == 2
        assert product2["schemaVersion"] == 2

    def test_product_schema_version_consistency(self, client: TestClient, admin_token: str) -> None:
        """Test that all created products consistently have schema version 2."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create multiple products with different configurations
        productConfigs: List[Dict[str, Any]] = [
            {
                "name": "Electronics Product",
                "description": "Electronics category product",
                "category": Category.ELECTRONICS.value,
                "price": 499.99,
                "quantity": 5,
                "shellId": 11,
                "inventoryStatus": InventoryStatus.INSTOCK.value,
                "rating": 4.8,
                "image": "electronics.jpg"
            },
            {
                "name": "Clothing Product", 
                "description": "Clothing category product",
                "category": Category.CLOTHING.value,
                "price": 89.99,
                "quantity": 25,
                "shellId": 12,
                "inventoryStatus": InventoryStatus.LOWSTOCK.value
            },
            {
                "name": "Fitness Product",
                "description": "Fitness category product", 
                "category": Category.FITNESS.value,
                "price": 149.99,
                "quantity": 8,
                "shellId": 13,
                "inventoryStatus": InventoryStatus.OUTOFSTOCK.value,
                "rating": 4.2
            }
        ]
        
        createdProducts: List[Dict[str, Any]] = []
        
        # Create all products
        for productData in productConfigs:
            response = client.post("/api/products", json=productData, headers=headers)
            assert response.status_code == HTTPStatus.CREATED.value
            createdProducts.append(response.json())
        
        # Verify all products have schema version 2
        for product in createdProducts:
            assert product["schemaVersion"] == 2
            assert "id" in product
            assert "code" in product
            assert "internalReference" in product
            assert "createdAt" in product
            assert "updatedAt" in product

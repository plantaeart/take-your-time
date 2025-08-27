"""
Test product API endpoints - Simple version.
"""
import pytest
from fastapi.testclient import TestClient
from main import create_app

# Create a simple test app
@pytest.fixture
def client():
    """Create test client."""
    app = create_app()
    return TestClient(app)


class TestProductEndpoints:
    """Test all product API endpoints."""

    def test_health_endpoint(self, client):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert "version" in data

    def test_get_products_empty(self, client):
        """Test getting products when database is empty."""
        response = client.get("/api/products")
        assert response.status_code == 200
        data = response.json()
        assert "products" in data
        assert "total" in data

    def test_create_product_success(self, client):
        """Test creating a product successfully."""
        product_data = {
            "name": "Test Product",
            "description": "A test product",
            "image": "https://example.com/image.jpg",
            "category": "ELECTRONICS",
            "price": 99.99,
            "quantity": 10,
            "shellId": 1,
            "inventoryStatus": "INSTOCK",
            "rating": 4.5
        }
        
        response = client.post("/api/products", json=product_data)
        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "Test Product"
        assert data["category"] == "ELECTRONICS"
        assert data["price"] == 99.99
        assert "id" in data
        assert "code" in data
        assert "internalReference" in data

    def test_get_single_product(self, client):
        """Test getting a single product by ID."""
        # Create a product first
        product_data = {
            "name": "Single Product",
            "description": "A single test product",
            "image": "https://example.com/single.jpg",
            "category": "FITNESS",
            "price": 29.99,
            "quantity": 15,
            "shellId": 2,
            "inventoryStatus": "INSTOCK",
            "rating": 3.8
        }
        
        create_response = client.post("/api/products", json=product_data)
        assert create_response.status_code == 201
        product_id = create_response.json()["id"]
        
        # Get the product
        response = client.get(f"/api/products/{product_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == product_id
        assert data["name"] == product_data["name"]

    def test_update_product(self, client):
        """Test updating a product."""
        # Create a product first
        product_data = {
            "name": "Original Product",
            "description": "Original description",
            "image": "https://example.com/original.jpg",
            "category": "ACCESSORIES",
            "price": 19.99,
            "quantity": 8,
            "shellId": 3,
            "inventoryStatus": "INSTOCK",
            "rating": 2.5
        }
        
        create_response = client.post("/api/products", json=product_data)
        assert create_response.status_code == 201
        product_id = create_response.json()["id"]
        
        # Update the product
        update_data = {
            "name": "Updated Product",
            "description": "Updated description",
            "image": "https://example.com/updated.jpg",
            "category": "ACCESSORIES",
            "price": 24.99,
            "quantity": 12,
            "shellId": 3,
            "inventoryStatus": "INSTOCK",
            "rating": 4.0
        }
        
        response = client.put(f"/api/products/{product_id}", json=update_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Product"
        assert data["price"] == 24.99

    def test_delete_product(self, client):
        """Test deleting a product."""
        # Create a product first
        product_data = {
            "name": "Product to Delete",
            "description": "Product to be deleted",
            "image": "https://example.com/delete.jpg",
            "category": "ELECTRONICS",
            "price": 99.99,
            "quantity": 1,
            "shellId": 4,
            "inventoryStatus": "INSTOCK",
            "rating": 3.0
        }
        
        create_response = client.post("/api/products", json=product_data)
        assert create_response.status_code == 201
        product_id = create_response.json()["id"]
        
        # Delete the product
        response = client.delete(f"/api/products/{product_id}")
        assert response.status_code == 200
        
        # Verify it's deleted
        get_response = client.get(f"/api/products/{product_id}")
        assert get_response.status_code == 404

    def test_get_categories(self, client):
        """Test getting product categories."""
        # Create a product with ELECTRONICS category first
        product_data = {
            "name": "Test Electronics",
            "description": "A test electronic product",
            "image": "https://example.com/electronics.jpg",
            "category": "ELECTRONICS",
            "price": 199.99,
            "quantity": 5,
            "shellId": 10,
            "inventoryStatus": "INSTOCK",
            "rating": 4.0
        }
        
        create_response = client.post("/api/products", json=product_data)
        assert create_response.status_code == 201
        
        # Now test categories endpoint
        response = client.get("/api/products/categories")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0  # Should have categories
        assert "ELECTRONICS" in data

    def test_update_inventory(self, client):
        """Test updating product inventory."""
        # Create a product first
        product_data = {
            "name": "Inventory Test Product",
            "description": "Product for inventory testing",
            "image": "https://example.com/inventory.jpg",
            "category": "CLOTHING",
            "price": 39.99,
            "quantity": 50,
            "shellId": 5,
            "inventoryStatus": "INSTOCK",
            "rating": 4.2
        }
        
        create_response = client.post("/api/products", json=product_data)
        assert create_response.status_code == 201
        product_id = create_response.json()["id"]
        
        # Update inventory
        response = client.patch(
            f"/api/products/{product_id}/inventory",
            params={"inventory_status": "LOWSTOCK", "quantity": 5}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["inventoryStatus"] == "LOWSTOCK"
        assert data["quantity"] == 5

    def test_pagination(self, client):
        """Test products pagination."""
        # Create a few products
        for i in range(3):
            product_data = {
                "name": f"Product {i+1}",
                "description": f"Test product {i+1}",
                "image": f"https://example.com/product{i+1}.jpg",
                "category": "ELECTRONICS",
                "price": 10.0 + i,
                "quantity": i + 1,
                "shellId": i + 10,
                "inventoryStatus": "INSTOCK",
                "rating": 3.0 + i * 0.5
            }
            response = client.post("/api/products", json=product_data)
            assert response.status_code == 201
        
        # Test pagination
        response = client.get("/api/products?page=1&limit=2")
        assert response.status_code == 200
        data = response.json()
        assert len(data["products"]) <= 2
        assert "total" in data

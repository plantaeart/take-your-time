"""
Product API endpoint tests.
"""
import pytest
from typing import Dict, Any
from fastapi.testclient import TestClient
from app.models.enums.category import Category
from app.models.enums.inventoryStatus import InventoryStatus


class TestProductEndpoints:
    """Test product API endpoints."""

    def test_health_endpoint(self, client: TestClient) -> None:
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        responseData: Dict[str, Any] = response.json()
        assert responseData["status"] == "healthy"
        assert "version" in responseData

    def test_get_products_empty(self, client: TestClient) -> None:
        """Test getting products when database is empty."""
        response = client.get("/api/products")
        assert response.status_code == 200
        responseData: Dict[str, Any] = response.json()
        assert "products" in responseData
        assert "total" in responseData

    def test_get_categories(self, client: TestClient) -> None:
        """Test getting product categories."""
        response = client.get("/api/products/categories")
        assert response.status_code == 200
        responseData = response.json()
        assert isinstance(responseData, list)
        assert len(responseData) > 0
        assert Category.ELECTRONICS.value in responseData

    def test_get_single_product_not_found(self, client: TestClient) -> None:
        """Test getting non-existent product."""
        response = client.get("/api/products/999")
        assert response.status_code == 404

    def test_pagination(self, client: TestClient, admin_token: str) -> None:
        """Test products pagination."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test products
        for i in range(5):
            productData: Dict[str, Any] = {
                "name": f"Pagination Product {i+1}",
                "description": f"Test product {i+1}",
                "category": Category.ELECTRONICS.value,
                "price": 10.0 + i,
                "quantity": i + 1,
                "shellId": i + 100,
                "inventoryStatus": InventoryStatus.INSTOCK.value,
                "rating": 3.0 + i * 0.5
            }
            response = client.post("/api/products", json=productData, headers=headers)
            assert response.status_code == 201
        
        # Test pagination
        response = client.get("/api/products?page=1&limit=3")
        assert response.status_code == 200
        responseData: Dict[str, Any] = response.json()
        assert len(responseData["products"]) <= 3
        assert "total" in responseData
        assert responseData["total"] >= 5

    def test_search_products(self, client: TestClient, admin_token: str) -> None:
        """Test product search functionality."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create searchable product
        productData: Dict[str, Any] = {
            "name": "Searchable Wireless Headphones",
            "description": "High-quality audio device",
            "category": Category.ELECTRONICS.value,
            "price": 99.99,
            "quantity": 10,
            "shellId": 200,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        response = client.post("/api/products", json=productData, headers=headers)
        assert response.status_code == 201
        
        # Search by name
        response = client.get("/api/products?search=Wireless")
        assert response.status_code == 200
        responseData: Dict[str, Any] = response.json()
        assert len(responseData["products"]) > 0
        assert "Wireless" in responseData["products"][0]["name"]

    def test_filter_by_category(self, client: TestClient, admin_token: str) -> None:
        """Test filtering products by category."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create products in different categories
        electronicsProduct: Dict[str, Any] = {
            "name": "Electronics Filter Test",
            "description": "Electronics product",
            "category": Category.ELECTRONICS.value,
            "price": 50.0,
            "quantity": 5,
            "shellId": 300,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        
        clothingProduct: Dict[str, Any] = {
            "name": "Clothing Filter Test",
            "description": "Clothing product",
            "category": Category.CLOTHING.value,
            "price": 25.0,
            "quantity": 10,
            "shellId": 301,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        
        client.post("/api/products", json=electronicsProduct, headers=headers)
        client.post("/api/products", json=clothingProduct, headers=headers)
        
        # Filter by electronics
        response = client.get(f"/api/products?category={Category.ELECTRONICS.value}")
        assert response.status_code == 200
        responseData: Dict[str, Any] = response.json()
        for product in responseData["products"]:
            assert product["category"] == Category.ELECTRONICS.value

    def test_filter_by_inventory_status(self, client: TestClient, admin_token: str) -> None:
        """Test filtering products by inventory status."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create products with different inventory statuses
        instockProduct: Dict[str, Any] = {
            "name": "In Stock Product",
            "description": "Available product",
            "category": Category.FITNESS.value,
            "price": 30.0,
            "quantity": 20,
            "shellId": 400,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        
        lowstockProduct: Dict[str, Any] = {
            "name": "Low Stock Product",
            "description": "Almost sold out",
            "category": Category.FITNESS.value,
            "price": 35.0,
            "quantity": 2,
            "shellId": 401,
            "inventoryStatus": InventoryStatus.LOWSTOCK.value
        }
        
        client.post("/api/products", json=instockProduct, headers=headers)
        client.post("/api/products", json=lowstockProduct, headers=headers)
        
        # Filter by in stock
        response = client.get(f"/api/products?inventoryStatus={InventoryStatus.INSTOCK.value}")
        assert response.status_code == 200
        responseData: Dict[str, Any] = response.json()
        for product in responseData["products"]:
            assert product["inventoryStatus"] == InventoryStatus.INSTOCK.value

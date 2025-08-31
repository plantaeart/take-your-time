"""
Tests for admin products search functionality.
Tests the /admin/products/search endpoint with various filter and sort combinations.
"""
import json
from typing import Dict, Any, List
from fastapi.testclient import TestClient

from app.models.enums.http_status import HTTPStatus
from app.models.enums.category import Category
from app.models.enums.inventoryStatus import InventoryStatus


class TestAdminProductsSearch:
    """Test admin products search endpoint."""

    def test_admin_products_search_unauthorized(self, client: TestClient) -> None:
        """Test that admin products search requires authentication."""
        response = client.get("/api/admin/products/search")
        assert response.status_code == HTTPStatus.UNAUTHORIZED.value

    def test_admin_products_search_forbidden(self, client: TestClient, user_token: str) -> None:
        """Test that regular users cannot access admin products search."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        response = client.get("/api/admin/products/search", headers=headers)
        assert response.status_code == HTTPStatus.FORBIDDEN.value

    def test_admin_products_search_basic(self, client: TestClient, admin_token: str) -> None:
        """Test basic admin products search without filters."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        response = client.get("/api/admin/products/search", headers=headers)
        
        # Debug: Print response details if it's not 200
        if response.status_code != HTTPStatus.OK.value:
            print(f"Response status: {response.status_code}")
            print(f"Response text: {response.text}")
        
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        
        # Validate response structure
        assert "products" in responseData
        assert "total" in responseData
        assert "page" in responseData
        assert "limit" in responseData
        assert "totalPages" in responseData
        assert "hasNext" in responseData
        assert "hasPrev" in responseData
        
        # Validate data types
        assert isinstance(responseData["products"], list)
        assert isinstance(responseData["total"], int)
        assert isinstance(responseData["page"], int)
        assert isinstance(responseData["limit"], int)

    def test_admin_products_search_with_name_filter(self, client: TestClient, admin_token: str) -> None:
        """Test admin products search with name filter."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test product first
        productData: Dict[str, Any] = {
            "name": "Gaming Mouse Ultra Pro",
            "description": "High-precision gaming mouse with RGB lighting",
            "category": Category.ELECTRONICS.value,
            "price": 89.99,
            "quantity": 15,
            "shellId": 1001,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        
        createResponse = client.post("/api/products", json=productData, headers=headers)
        assert createResponse.status_code == HTTPStatus.CREATED.value
        
        # Test name filter
        filters: Dict[str, Any] = {"name": "Gaming"}
        filtersJson: str = json.dumps(filters)
        
        response = client.get(
            "/api/admin/products/search",
            params={"filters": filtersJson},
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        assert responseData["total"] >= 1
        
        # Verify filtered results contain the search term
        products: List[Dict[str, Any]] = responseData["products"]
        found: bool = False
        for product in products:
            if "Gaming" in product["name"]:
                found = True
                break
        assert found, "No products with 'Gaming' in name found"

    def test_admin_products_search_with_price_range_filter(self, client: TestClient, admin_token: str) -> None:
        """Test admin products search with price range filter."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test products with different prices
        productData1: Dict[str, Any] = {
            "name": "Budget Mouse",
            "description": "Affordable basic mouse",
            "category": Category.ELECTRONICS.value,
            "price": 15.99,
            "quantity": 10,
            "shellId": 1002,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        
        productData2: Dict[str, Any] = {
            "name": "Premium Mouse",
            "description": "Premium gaming mouse",
            "category": Category.ELECTRONICS.value,
            "price": 129.99,
            "quantity": 5,
            "shellId": 1003,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        
        client.post("/api/products", json=productData1, headers=headers)
        client.post("/api/products", json=productData2, headers=headers)
        
        # Test price range filter (20-100)
        filters: Dict[str, Any] = {"price": [20.0, 100.0]}
        filtersJson: str = json.dumps(filters)
        
        response = client.get(
            "/api/admin/products/search",
            params={"filters": filtersJson},
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        products: List[Dict[str, Any]] = responseData["products"]
        
        # Verify all products are within price range
        for product in products:
            assert 20.0 <= product["price"] <= 100.0

    def test_admin_products_search_with_category_filter(self, client: TestClient, admin_token: str) -> None:
        """Test admin products search with category filter."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test products with different categories
        electronicsProduct: Dict[str, Any] = {
            "name": "Wireless Headphones",
            "description": "Bluetooth wireless headphones",
            "category": Category.ELECTRONICS.value,
            "price": 79.99,
            "quantity": 8,
            "shellId": 1004,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        
        clothingProduct: Dict[str, Any] = {
            "name": "Athletic T-Shirt",
            "description": "Moisture-wicking athletic shirt",
            "category": Category.CLOTHING.value,
            "price": 29.99,
            "quantity": 20,
            "shellId": 1005,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        
        client.post("/api/products", json=electronicsProduct, headers=headers)
        client.post("/api/products", json=clothingProduct, headers=headers)
        
        # Test category filter
        filters: Dict[str, Any] = {"category": Category.ELECTRONICS.value}
        filtersJson: str = json.dumps(filters)
        
        response = client.get(
            "/api/admin/products/search",
            params={"filters": filtersJson},
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        products: List[Dict[str, Any]] = responseData["products"]
        
        # Verify all products are electronics
        for product in products:
            assert product["category"] == Category.ELECTRONICS.value

    def test_admin_products_search_with_multiple_filters(self, client: TestClient, admin_token: str) -> None:
        """Test admin products search with multiple combined filters."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test product that matches multiple criteria
        productData: Dict[str, Any] = {
            "name": "Fitness Tracker Pro",
            "description": "Advanced fitness tracking device",
            "category": Category.FITNESS.value,
            "price": 149.99,
            "quantity": 12,
            "shellId": 1006,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        
        createResponse = client.post("/api/products", json=productData, headers=headers)
        assert createResponse.status_code == HTTPStatus.CREATED.value
        
        # Test multiple filters
        filters: Dict[str, Any] = {
            "category": Category.FITNESS.value,
            "price": [100.0, 200.0],
            "name": "Fitness"
        }
        filtersJson: str = json.dumps(filters)
        
        response = client.get(
            "/api/admin/products/search",
            params={"filters": filtersJson},
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        products: List[Dict[str, Any]] = responseData["products"]
        
        # Verify products match all criteria
        for product in products:
            assert product["category"] == Category.FITNESS.value
            assert 100.0 <= product["price"] <= 200.0
            assert "Fitness" in product["name"]

    def test_admin_products_search_with_sorting(self, client: TestClient, admin_token: str) -> None:
        """Test admin products search with sorting."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test products with different names for sorting
        productA: Dict[str, Any] = {
            "name": "Apple Product",
            "description": "First alphabetically",
            "category": Category.ELECTRONICS.value,
            "price": 50.0,
            "quantity": 10,
            "shellId": 1007,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        
        productZ: Dict[str, Any] = {
            "name": "Zebra Product",
            "description": "Last alphabetically",
            "category": Category.ELECTRONICS.value,
            "price": 60.0,
            "quantity": 10,
            "shellId": 1008,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        
        client.post("/api/products", json=productA, headers=headers)
        client.post("/api/products", json=productZ, headers=headers)
        
        # Test ascending sort by name
        sorts: List[Dict[str, str]] = [{"field": "name", "direction": "asc"}]
        sortsJson: str = json.dumps(sorts)
        
        response = client.get(
            "/api/admin/products/search",
            params={"sorts": sortsJson, "limit": "20"},
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        products: List[Dict[str, Any]] = responseData["products"]
        
        # Find our test products in results
        testProducts: List[Dict[str, Any]] = [
            p for p in products 
            if p["name"] in ["Apple Product", "Zebra Product"]
        ]
        
        if len(testProducts) >= 2:
            # Verify ascending order
            names: List[str] = [p["name"] for p in testProducts]
            assert names == sorted(names), f"Products not sorted ascending: {names}"

    def test_admin_products_search_pagination(self, client: TestClient, admin_token: str) -> None:
        """Test admin products search pagination."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test pagination parameters
        response = client.get(
            "/api/admin/products/search",
            params={"page": "2", "limit": "5"},
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        
        # Validate pagination info
        assert responseData["page"] == 2
        assert responseData["limit"] == 5
        assert responseData["totalPages"] >= 0
        assert isinstance(responseData["hasNext"], bool)
        assert isinstance(responseData["hasPrev"], bool)
        
        # For page 2, hasPrev should be True
        assert responseData["hasPrev"] is True

    def test_admin_products_search_invalid_json_filters(self, client: TestClient, admin_token: str) -> None:
        """Test admin products search with invalid JSON filters."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test invalid JSON
        response = client.get(
            "/api/admin/products/search",
            params={"filters": "invalid-json{"},
            headers=headers
        )
        assert response.status_code == HTTPStatus.BAD_REQUEST.value
        
        responseData: Dict[str, Any] = response.json()
        assert "Invalid JSON format" in responseData["detail"]

    def test_admin_products_search_invalid_json_sorts(self, client: TestClient, admin_token: str) -> None:
        """Test admin products search with invalid JSON sorts."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test invalid JSON
        response = client.get(
            "/api/admin/products/search",
            params={"sorts": "invalid-json["},
            headers=headers
        )
        assert response.status_code == HTTPStatus.BAD_REQUEST.value
        
        responseData: Dict[str, Any] = response.json()
        assert "Invalid JSON format" in responseData["detail"]

    def test_admin_products_search_empty_filters_and_sorts(self, client: TestClient, admin_token: str) -> None:
        """Test admin products search with empty filters and sorts."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        response = client.get(
            "/api/admin/products/search",
            params={"filters": "", "sorts": ""},
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        
        # Should return all products with default pagination
        assert "products" in responseData
        assert responseData["page"] == 1
        assert responseData["limit"] == 10

    def test_admin_products_search_global_search_filter(self, client: TestClient, admin_token: str) -> None:
        """Test admin products search with global search filter."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test product
        productData: Dict[str, Any] = {
            "name": "Unique Search Test Product",
            "description": "This is a unique description for testing global search",
            "category": Category.ACCESSORIES.value,
            "price": 45.99,
            "quantity": 7,
            "shellId": 1009,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        
        createResponse = client.post("/api/products", json=productData, headers=headers)
        assert createResponse.status_code == HTTPStatus.CREATED.value
        
        # Test global search in name and description
        filters: Dict[str, Any] = {"search": "unique"}
        filtersJson: str = json.dumps(filters)
        
        response = client.get(
            "/api/admin/products/search",
            params={"filters": filtersJson},
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        products: List[Dict[str, Any]] = responseData["products"]
        
        # Verify products contain the search term in name or description
        found: bool = False
        for product in products:
            if ("unique" in product["name"].lower() or 
                "unique" in product["description"].lower()):
                found = True
                break
        assert found, "No products found with 'unique' in name or description"

    def test_admin_products_search_inventory_status_filter(self, client: TestClient, admin_token: str) -> None:
        """Test admin products search with inventory status filter."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test product with specific inventory status
        productData: Dict[str, Any] = {
            "name": "Low Stock Item",
            "description": "Item with low stock for testing",
            "category": Category.ACCESSORIES.value,
            "price": 25.99,
            "quantity": 2,
            "shellId": 1010,
            "inventoryStatus": InventoryStatus.LOWSTOCK.value
        }
        
        createResponse = client.post("/api/products", json=productData, headers=headers)
        assert createResponse.status_code == HTTPStatus.CREATED.value
        
        # Test inventory status filter
        filters: Dict[str, Any] = {"inventoryStatus": InventoryStatus.LOWSTOCK.value}
        filtersJson: str = json.dumps(filters)
        
        response = client.get(
            "/api/admin/products/search",
            params={"filters": filtersJson},
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        products: List[Dict[str, Any]] = responseData["products"]
        
        # Verify all products have low stock status
        for product in products:
            assert product["inventoryStatus"] == InventoryStatus.LOWSTOCK.value

    def test_admin_products_search_complex_scenario(self, client: TestClient, admin_token: str) -> None:
        """Test admin products search with complex filter and sort combination."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create multiple test products
        products: List[Dict[str, Any]] = [
            {
                "name": "Electronics Widget A",
                "description": "High-quality electronic widget",
                "category": Category.ELECTRONICS.value,
                "price": 75.99,
                "quantity": 15,
                "shellId": 1011,
                "inventoryStatus": InventoryStatus.INSTOCK.value
            },
            {
                "name": "Electronics Widget B", 
                "description": "Premium electronic widget",
                "category": Category.ELECTRONICS.value,
                "price": 125.99,
                "quantity": 8,
                "shellId": 1012,
                "inventoryStatus": InventoryStatus.INSTOCK.value
            },
            {
                "name": "Electronics Widget C",
                "description": "Budget electronic widget",
                "category": Category.ELECTRONICS.value,
                "price": 45.99,
                "quantity": 25,
                "shellId": 1013,
                "inventoryStatus": InventoryStatus.INSTOCK.value
            }
        ]
        
        for productData in products:
            createResponse = client.post("/api/products", json=productData, headers=headers)
            assert createResponse.status_code == HTTPStatus.CREATED.value
        
        # Complex search: Electronics category, price 40-100, sorted by price desc
        filters: Dict[str, Any] = {
            "category": Category.ELECTRONICS.value,
            "price": [40.0, 100.0],
            "name": "Widget"
        }
        sorts: List[Dict[str, str]] = [{"field": "price", "direction": "desc"}]
        
        filtersJson: str = json.dumps(filters)
        sortsJson: str = json.dumps(sorts)
        
        response = client.get(
            "/api/admin/products/search",
            params={"filters": filtersJson, "sorts": sortsJson},
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        resultProducts: List[Dict[str, Any]] = responseData["products"]
        
        # Filter for our test products
        testResults: List[Dict[str, Any]] = [
            p for p in resultProducts 
            if "Widget" in p["name"] and 40.0 <= p["price"] <= 100.0
        ]
        
        # Verify results match criteria and are sorted by price descending
        assert len(testResults) >= 2  # Should have Widget A and C
        
        for product in testResults:
            assert product["category"] == Category.ELECTRONICS.value
            assert 40.0 <= product["price"] <= 100.0
            assert "Widget" in product["name"]
        
        # Verify descending price order if we have multiple results
        if len(testResults) >= 2:
            prices: List[float] = [p["price"] for p in testResults]
            assert prices == sorted(prices, reverse=True), f"Products not sorted by price desc: {prices}"

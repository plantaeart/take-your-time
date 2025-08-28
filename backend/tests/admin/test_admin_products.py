"""
Admin product management tests.
"""
import pytest
from typing import Dict, Any, List
from fastapi.testclient import TestClient
from app.models.enums.category import Category
from app.models.enums.inventoryStatus import InventoryStatus


class TestAdminProducts:
    """Test admin product management functionality."""

    def test_create_product_admin_required(self, client: TestClient) -> None:
        """Test that creating products requires admin privileges."""
        productData: Dict[str, Any] = {
            "name": "Admin Test Product",
            "description": "Product for admin testing",
            "category": Category.ELECTRONICS.value,
            "price": 99.99,
            "quantity": 10,
            "shellId": 1,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        
        # Without authentication
        response = client.post("/api/products", json=productData)
        assert response.status_code == 401

    def test_create_product_user_forbidden(self, client: TestClient, user_token: str) -> None:
        """Test that regular users cannot create products."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        productData: Dict[str, Any] = {
            "name": "User Test Product",
            "description": "Product for user testing",
            "category": Category.ELECTRONICS.value,
            "price": 99.99,
            "quantity": 10,
            "shellId": 1,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        
        response = client.post("/api/products", json=productData, headers=headers)
        assert response.status_code == 403

    def test_create_product_admin_success(self, client: TestClient, admin_token: str) -> None:
        """Test that admin can successfully create products."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        productData: Dict[str, Any] = {
            "name": "Admin Created Product",
            "description": "Successfully created by admin",
            "category": Category.ELECTRONICS.value,
            "price": 149.99,
            "quantity": 25,
            "shellId": 10,
            "inventoryStatus": InventoryStatus.INSTOCK.value,
            "rating": 4.5
        }
        
        response = client.post("/api/products", json=productData, headers=headers)
        assert response.status_code == 201
        responseData: Dict[str, Any] = response.json()
        assert responseData["name"] == "Admin Created Product"
        assert responseData["price"] == 149.99
        assert "id" in responseData
        assert "code" in responseData
        assert "internalReference" in responseData
        assert "createdAt" in responseData
        assert "updatedAt" in responseData

    def test_create_product_auto_generation(self, client: TestClient, admin_token: str) -> None:
        """Test auto-generation of product fields."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        productData: Dict[str, Any] = {
            "name": "Auto Gen Product",
            "description": "Testing auto-generation",
            "category": Category.FITNESS.value,
            "price": 79.99,
            "quantity": 15,
            "shellId": 20,
            "inventoryStatus": InventoryStatus.INSTOCK.value
            # Note: code and internalReference not provided - should be auto-generated
        }
        
        response = client.post("/api/products", json=productData, headers=headers)
        assert response.status_code == 201
        responseData: Dict[str, Any] = response.json()
        assert len(responseData["code"]) == 9  # Auto-generated code format
        assert responseData["internalReference"].startswith("REF-")  # Auto-generated reference
        assert responseData["id"] > 0  # Auto-generated ID

    def test_create_product_duplicate_name(self, client: TestClient, admin_token: str) -> None:
        """Test that duplicate product names are rejected."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        productData: Dict[str, Any] = {
            "name": "Duplicate Name Product",
            "description": "First product",
            "category": Category.CLOTHING.value,
            "price": 29.99,
            "quantity": 5,
            "shellId": 30,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        
        # First product should succeed
        response = client.post("/api/products", json=productData, headers=headers)
        assert response.status_code == 201
        
        # Second product with same name should fail
        productData["description"] = "Second product with same name"
        response = client.post("/api/products", json=productData, headers=headers)
        assert response.status_code == 400
        assert "already exists" in response.json()["detail"]

    def test_update_product_admin_required(self, client: TestClient, admin_token: str) -> None:
        """Test updating products requires admin privileges."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create a product first
        productData: Dict[str, Any] = {
            "name": "Product to Update",
            "description": "Original description",
            "category": Category.ACCESSORIES.value,
            "price": 39.99,
            "quantity": 8,
            "shellId": 40,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        
        response = client.post("/api/products", json=productData, headers=headers)
        assert response.status_code == 201
        productId: int = response.json()["id"]
        
        # Try updating without authentication
        updateData: Dict[str, float] = {"price": 49.99}
        response = client.put(f"/api/products/{productId}", json=updateData)
        assert response.status_code == 401

    def test_update_product_admin_success(self, client: TestClient, admin_token: str) -> None:
        """Test admin can successfully update products."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create a product first
        productData: Dict[str, Any] = {
            "name": "Product for Update Test",
            "description": "Original description",
            "category": Category.ACCESSORIES.value,
            "price": 39.99,
            "quantity": 8,
            "shellId": 50,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        
        response = client.post("/api/products", json=productData, headers=headers)
        assert response.status_code == 201
        productId: int = response.json()["id"]
        originalUpdatedAt: str = response.json()["updatedAt"]
        
        # Update the product
        updateData: Dict[str, Any] = {
            "name": "Updated Product Name",
            "price": 49.99,
            "quantity": 12,
            "rating": 4.2
        }
        
        response = client.put(f"/api/products/{productId}", json=updateData, headers=headers)
        assert response.status_code == 200
        responseData: Dict[str, Any] = response.json()
        assert responseData["name"] == "Updated Product Name"
        assert responseData["price"] == 49.99
        assert responseData["quantity"] == 12
        assert responseData["rating"] == 4.2
        assert responseData["updatedAt"] != originalUpdatedAt  # Should be updated

    def test_delete_product_admin_required(self, client: TestClient, admin_token: str) -> None:
        """Test deleting products requires admin privileges."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create a product first
        productData: Dict[str, Any] = {
            "name": "Product to Delete",
            "description": "This will be deleted",
            "category": Category.ELECTRONICS.value,
            "price": 199.99,
            "quantity": 3,
            "shellId": 60,
            "inventoryStatus": InventoryStatus.LOWSTOCK.value
        }
        
        response = client.post("/api/products", json=productData, headers=headers)
        assert response.status_code == 201
        productId: int = response.json()["id"]
        
        # Try deleting without authentication
        response = client.delete(f"/api/products/{productId}")
        assert response.status_code == 401

    def test_delete_product_admin_success(self, client: TestClient, admin_token: str) -> None:
        """Test admin can successfully delete products."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create a product first
        productData: Dict[str, Any] = {
            "name": "Product for Deletion Test",
            "description": "This will be successfully deleted",
            "category": Category.ELECTRONICS.value,
            "price": 299.99,
            "quantity": 2,
            "shellId": 70,
            "inventoryStatus": InventoryStatus.LOWSTOCK.value
        }
        
        response = client.post("/api/products", json=productData, headers=headers)
        assert response.status_code == 201
        productId: int = response.json()["id"]
        productName: str = response.json()["name"]
        
        # Delete the product
        response = client.delete(f"/api/products/{productId}", headers=headers)
        assert response.status_code == 200
        responseData: Dict[str, Any] = response.json()
        assert responseData["productId"] == productId
        assert responseData["productName"] == productName
        
        # Verify product is deleted
        response = client.get(f"/api/products/{productId}")
        assert response.status_code == 404

    def test_update_inventory_admin_required(self, client: TestClient, admin_token: str) -> None:
        """Test updating inventory requires admin privileges."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create a product first
        productData: Dict[str, Any] = {
            "name": "Inventory Update Product",
            "description": "For inventory testing",
            "category": Category.FITNESS.value,
            "price": 69.99,
            "quantity": 20,
            "shellId": 80,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        
        response = client.post("/api/products", json=productData, headers=headers)
        assert response.status_code == 201
        productId: int = response.json()["id"]
        
        # Try updating inventory without authentication
        response = client.patch(
            f"/api/products/{productId}/inventory",
            params={"inventoryStatus": InventoryStatus.LOWSTOCK.value, "quantity": 3}
        )
        assert response.status_code == 401

    def test_update_inventory_admin_success(self, client: TestClient, admin_token: str) -> None:
        """Test admin can successfully update inventory."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create a product first
        productData: Dict[str, Any] = {
            "name": "Inventory Success Product",
            "description": "For successful inventory testing",
            "category": Category.FITNESS.value,
            "price": 69.99,
            "quantity": 20,
            "shellId": 90,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        
        response = client.post("/api/products", json=productData, headers=headers)
        assert response.status_code == 201
        productId: int = response.json()["id"]
        
        # Update inventory status and quantity
        response = client.patch(
            f"/api/products/{productId}/inventory",
            params={"inventoryStatus": InventoryStatus.LOWSTOCK.value, "quantity": 3},
            headers=headers
        )
        assert response.status_code == 200
        responseData: Dict[str, Any] = response.json()
        assert responseData["inventoryStatus"] == InventoryStatus.LOWSTOCK.value
        assert responseData["quantity"] == 3

    def test_bulk_create_products_admin_required(self, client: TestClient) -> None:
        """Test bulk product creation requires admin privileges."""
        productsData: List[Dict[str, Any]] = [
            {
                "name": "Bulk Product 1",
                "description": "First bulk product",
                "category": Category.ELECTRONICS.value,
                "price": 100.0,
                "quantity": 10,
                "shellId": 100,
                "inventoryStatus": InventoryStatus.INSTOCK.value
            }
        ]
        
        response = client.post("/api/products/bulk", json=productsData)
        assert response.status_code == 401

    def test_bulk_create_products_admin_success(self, client: TestClient, admin_token: str) -> None:
        """Test admin can successfully bulk create products."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        productsData: List[Dict[str, Any]] = [
            {
                "name": "Bulk Product Alpha",
                "description": "First bulk product",
                "category": Category.ELECTRONICS.value,
                "price": 100.0,
                "quantity": 10,
                "shellId": 110,
                "inventoryStatus": InventoryStatus.INSTOCK.value
            },
            {
                "name": "Bulk Product Beta",
                "description": "Second bulk product",
                "category": Category.CLOTHING.value,
                "price": 50.0,
                "quantity": 20,
                "shellId": 111,
                "inventoryStatus": InventoryStatus.INSTOCK.value
            },
            {
                "name": "Bulk Product Gamma",
                "description": "Third bulk product",
                "category": Category.FITNESS.value,
                "price": 75.0,
                "quantity": 15,
                "shellId": 112,
                "inventoryStatus": InventoryStatus.INSTOCK.value,
                "rating": 4.0
            }
        ]
        
        response = client.post("/api/products/bulk", json=productsData, headers=headers)
        assert response.status_code == 200
        responseData: List[Dict[str, Any]] = response.json()
        assert len(responseData) == 3
        
        # Verify all products were created with proper data
        for i, product in enumerate(responseData):
            assert product["name"] == productsData[i]["name"]
            assert product["price"] == productsData[i]["price"]
            assert "id" in product
            assert "code" in product
            assert "internalReference" in product

    def test_bulk_create_with_errors_partial_success(self, client: TestClient, admin_token: str) -> None:
        """Test bulk creation with some valid and some invalid products."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # First create a product with a name that will conflict
        conflictProductData: Dict[str, Any] = {
            "name": "Conflict Product Name",
            "description": "This will cause a conflict",
            "category": Category.ELECTRONICS.value,
            "price": 99.99,
            "quantity": 5,
            "shellId": 120,
            "inventoryStatus": InventoryStatus.INSTOCK.value
        }
        client.post("/api/products", json=conflictProductData, headers=headers)
        
        # Now try bulk creation with mix of valid and invalid
        productsData: List[Dict[str, Any]] = [
            {
                "name": "Valid Bulk Product",
                "description": "This should succeed",
                "category": Category.ELECTRONICS.value,
                "price": 100.0,
                "quantity": 10,
                "shellId": 130,
                "inventoryStatus": InventoryStatus.INSTOCK.value
            },
            {
                "name": "Conflict Product Name",  # This will fail due to duplicate name
                "description": "This should fail",
                "category": Category.CLOTHING.value,
                "price": 50.0,
                "quantity": 20,
                "shellId": 131,
                "inventoryStatus": InventoryStatus.INSTOCK.value
            }
        ]
        
        response = client.post("/api/products/bulk", json=productsData, headers=headers)
        # Should return the successful products even if some failed
        assert response.status_code == 200
        responseData: List[Dict[str, Any]] = response.json()
        assert len(responseData) == 1  # Only one should succeed
        assert responseData[0]["name"] == "Valid Bulk Product"

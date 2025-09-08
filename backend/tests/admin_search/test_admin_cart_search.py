"""
Tests for admin user cart search functionality with flattened data structure.
"""
import json
from typing import Dict, Any, List
from fastapi.testclient import TestClient

from app.models.enums.http_status import HTTPStatus


class TestAdminUserCartSearch:
    """Test admin user cart search functionality with new flattened structure."""

    def test_search_carts_unauthorized(self, client: TestClient) -> None:
        """Test that cart search requires authentication."""
        response = client.get("/api/admin/cart/search")
        assert response.status_code == HTTPStatus.UNAUTHORIZED.value

    def test_search_carts_forbidden(self, client: TestClient, user_token: str) -> None:
        """Test that regular users cannot search carts."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        response = client.get("/api/admin/cart/search", headers=headers)
        assert response.status_code == HTTPStatus.FORBIDDEN.value

    def test_search_carts_empty_database(self, client: TestClient, admin_token: str) -> None:
        """Test cart search with empty database."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        response = client.get("/api/admin/cart/search", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        assert "items" in responseData
        assert responseData["items"] == []
        assert responseData["total"] == 0
        assert responseData["page"] == 1
        assert responseData["limit"] == 10
        assert responseData["totalPages"] == 0
        assert responseData["hasNext"] is False
        assert responseData["hasPrev"] is False

    def test_search_carts_basic_pagination(self, client: TestClient, admin_token: str) -> None:
        """Test cart search with basic pagination."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test custom page and limit
        response = client.get("/api/admin/cart/search?page=2&limit=5", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        assert responseData["page"] == 2
        assert responseData["limit"] == 5

    def test_search_carts_with_filters(self, client: TestClient, admin_token: str) -> None:
        """Test cart search with filters."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test user ID filter
        filters: Dict[str, Any] = {"id": 123}
        filtersJson: str = json.dumps(filters)
        
        response = client.get(
            f"/api/admin/cart/search?filters={filtersJson}",
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        assert "items" in responseData

    def test_search_carts_with_date_range_filter(self, client: TestClient, admin_token: str) -> None:
        """Test cart search with date range filter."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test date range filter
        filters: Dict[str, Any] = {
            "createdAt": ["2024-01-01", "2024-12-31"]
        }
        filtersJson: str = json.dumps(filters)
        
        response = client.get(
            f"/api/admin/cart/search?filters={filtersJson}",
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value

    def test_search_carts_with_sorting(self, client: TestClient, admin_token: str) -> None:
        """Test cart search with sorting."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test sorting by creation date
        sorts: List[Dict[str, str]] = [{"field": "createdAt", "direction": "desc"}]
        sortsJson: str = json.dumps(sorts)
        
        response = client.get(
            f"/api/admin/cart/search?sorts={sortsJson}",
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        assert "items" in responseData

    def test_search_carts_with_multiple_sorts(self, client: TestClient, admin_token: str) -> None:
        """Test cart search with multiple sort fields."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test multiple sort fields
        sorts: List[Dict[str, str]] = [
            {"field": "id", "direction": "asc"},
            {"field": "createdAt", "direction": "desc"}
        ]
        sortsJson: str = json.dumps(sorts)
        
        response = client.get(
            f"/api/admin/cart/search?sorts={sortsJson}",
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value

    def test_search_carts_invalid_json_filters(self, client: TestClient, admin_token: str) -> None:
        """Test cart search with invalid JSON filters."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test invalid JSON
        response = client.get(
            "/api/admin/cart/search?filters={invalid-json}",
            headers=headers
        )
        assert response.status_code == HTTPStatus.BAD_REQUEST.value
        assert "Invalid JSON format" in response.json()["detail"]

    def test_search_carts_invalid_json_sorts(self, client: TestClient, admin_token: str) -> None:
        """Test cart search with invalid JSON sorts."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test invalid JSON
        response = client.get(
            "/api/admin/cart/search?sorts={invalid-json}",
            headers=headers
        )
        assert response.status_code == HTTPStatus.BAD_REQUEST.value
        assert "Invalid JSON format" in response.json()["detail"]

    def test_search_carts_complex_filters_and_sorts(self, client: TestClient, admin_token: str) -> None:
        """Test cart search with complex filters and sorts."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test complex filtering and sorting
        filters: Dict[str, Any] = {
            "id": 123,
            "createdAt": ["2024-01-01", "2024-06-30"]
        }
        sorts: List[Dict[str, str]] = [
            {"field": "updatedAt", "direction": "desc"}
        ]
        
        filtersJson: str = json.dumps(filters)
        sortsJson: str = json.dumps(sorts)
        
        response = client.get(
            f"/api/admin/cart/search?page=1&limit=20&filters={filtersJson}&sorts={sortsJson}",
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        assert "items" in responseData
        assert responseData["page"] == 1
        assert responseData["limit"] == 20

    def test_search_carts_pagination_limits(self, client: TestClient, admin_token: str) -> None:
        """Test cart search pagination limits."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test minimum page and limit
        response = client.get("/api/admin/cart/search?page=1&limit=1", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        # Test maximum limit
        response = client.get("/api/admin/cart/search?page=1&limit=100", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        assert responseData["limit"] == 100

    def test_search_carts_response_structure(self, client: TestClient, admin_token: str) -> None:
        """Test cart search response structure matches new flattened format."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        response = client.get("/api/admin/cart/search", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        
        # Verify response structure
        assert "items" in responseData
        assert "total" in responseData
        assert "page" in responseData
        assert "limit" in responseData
        assert "totalPages" in responseData
        assert "hasNext" in responseData
        assert "hasPrev" in responseData
        
        # Verify data types
        assert isinstance(responseData["items"], list)  # Changed from 'carts' to 'items'
        assert isinstance(responseData["total"], int)
        assert isinstance(responseData["page"], int)
        assert isinstance(responseData["limit"], int)
        assert isinstance(responseData["totalPages"], int)
        assert isinstance(responseData["hasNext"], bool)
        assert isinstance(responseData["hasPrev"], bool)
        
        # If there are carts, verify the flattened structure
        if responseData["items"]:  # Changed from 'carts' to 'items'
            cart: Dict[str, Any] = responseData["items"][0]  # Changed from 'carts' to 'items'
            
            # Verify flattened cart structure
            assert "id" in cart
            assert "username" in cart
            assert "email" in cart
            assert "firstname" in cart  # Can be null
            assert "isActive" in cart
            assert "cart" in cart
            assert "cartTotalValue" in cart  # New field
            
            # Verify data types
            assert isinstance(cart["id"], int)
            assert isinstance(cart["username"], str)
            assert isinstance(cart["email"], str)
            assert isinstance(cart["isActive"], bool)
            assert isinstance(cart["cart"], list)
            assert isinstance(cart["cartTotalValue"], (int, float))
            
            # If cart has items, verify cart item structure
            if cart["cart"]:
                cartItem: Dict[str, Any] = cart["cart"][0]
                assert "productId" in cartItem
                assert "productName" in cartItem
                assert "quantity" in cartItem
                assert "productPrice" in cartItem
                
                assert isinstance(cartItem["productId"], int)
                assert isinstance(cartItem["productName"], str)
                assert isinstance(cartItem["quantity"], int)
                assert isinstance(cartItem["productPrice"], (int, float))

    def test_search_carts_empty_filters_and_sorts(self, client: TestClient, admin_token: str) -> None:
        """Test cart search with empty filters and sorts."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test empty filters and sorts
        response = client.get(
            "/api/admin/cart/search?filters={}&sorts=[]",
            headers=headers
        )
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        assert "items" in responseData

    def test_search_carts_flattened_structure_with_data(self, client: TestClient, admin_token: str) -> None:
        """Test cart search returns properly flattened structure with actual data."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # First create a user (non-admin)
        userData: Dict[str, Any] = {
            "username": "testuser",
            "email": "testuser@example.com",
            "firstname": "Test",
            "password": "TestPass123!"
        }
        userResponse = client.post("/api/account", json=userData)
        assert userResponse.status_code == HTTPStatus.CREATED.value
        
        # Create a product
        productData: Dict[str, Any] = {
            "name": "Test Cart Product",
            "description": "Product for cart testing",
            "category": "ELECTRONICS",
            "price": 29.99,
            "quantity": 10,
            "shellId": 1001,
            "inventoryStatus": "INSTOCK"
        }
        productResponse = client.post("/api/products", json=productData, headers=headers)
        assert productResponse.status_code == HTTPStatus.CREATED.value
        productId: int = productResponse.json()["id"]
        
        # Login the user to get user token
        loginData: Dict[str, str] = {"username": "testuser@example.com", "password": "TestPass123!"}
        loginResponse = client.post("/api/token", data=loginData)
        assert loginResponse.status_code == HTTPStatus.OK.value
        userToken: str = loginResponse.json()["access_token"]
        
        # Add item to user's cart
        cartItemData: Dict[str, Any] = {
            "productId": productId,
            "quantity": 2
        }
        userHeaders: Dict[str, str] = {"Authorization": f"Bearer {userToken}"}
        cartResponse = client.post("/api/cart/items", json=cartItemData, headers=userHeaders)
        assert cartResponse.status_code == HTTPStatus.CREATED.value
        
        # Now search for carts as admin
        searchResponse = client.get("/api/admin/cart/search", headers=headers)
        assert searchResponse.status_code == HTTPStatus.OK.value
        
        searchData: Dict[str, Any] = searchResponse.json()
        assert searchData["total"] >= 1
        assert len(searchData["items"]) >= 1
        
        # Find our test user's cart
        testUserCart: Dict[str, Any] = None
        for cart in searchData["items"]:
            if cart["username"] == "testuser":
                testUserCart = cart
                break
        
        assert testUserCart is not None, "Test user cart not found in search results"
        
        # Verify flattened structure
        assert testUserCart["username"] == "testuser"
        assert testUserCart["email"] == "testuser@example.com"
        assert testUserCart["firstname"] == "Test"
        assert testUserCart["isActive"] is True
        assert isinstance(testUserCart["cart"], list)
        assert len(testUserCart["cart"]) == 1
        
        # Verify cart total value
        expectedTotal = 2 * 29.99  # quantity * price
        assert "cartTotalValue" in testUserCart
        assert testUserCart["cartTotalValue"] == expectedTotal
        
        # Verify cart item structure
        cartItem: Dict[str, Any] = testUserCart["cart"][0]
        assert cartItem["productId"] == productId
        assert cartItem["productName"] == "Test Cart Product"
        assert cartItem["quantity"] == 2
        assert cartItem["productPrice"] == 29.99

    def test_search_carts_cart_total_value_filtering_and_sorting(self, client: TestClient, admin_token: str) -> None:
        """Test filtering and sorting by cart total value."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test cart total value range filtering
        filters: Dict[str, Any] = {"cartTotalValue": [50.0, 100.0]}  # Range filter
        response = client.get("/api/admin/cart/search", 
                             params={"filters": json.dumps(filters)}, 
                             headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        # Test cart total value sorting
        sorts: List[Dict[str, str]] = [{"field": "cartTotalValue", "direction": "desc"}]
        response = client.get("/api/admin/cart/search", 
                             params={"sorts": json.dumps(sorts)}, 
                             headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        
        # Verify sorting order if there are multiple items
        if len(responseData["items"]) > 1:
            for i in range(len(responseData["items"]) - 1):
                current_total = responseData["items"][i]["cartTotalValue"]
                next_total = responseData["items"][i + 1]["cartTotalValue"]
                assert current_total >= next_total, "Cart totals should be sorted in descending order"

    def test_search_carts_cart_item_filtering(self, client: TestClient, admin_token: str) -> None:
        """Test filtering by cart item properties (future feature)."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test filtering by product name within cart items
        # This would require enhanced backend support for nested filtering
        filters: Dict[str, Any] = {"cart.productName": "Test Product"}
        response = client.get("/api/admin/cart/search", 
                             params={"filters": json.dumps(filters)}, 
                             headers=headers)
        
        # For now, this should still return OK but may not filter by nested fields
        assert response.status_code == HTTPStatus.OK.value

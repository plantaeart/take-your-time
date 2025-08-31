---
applyTo: 'backend/**'
---

# Backend Testing Best Practices & Guidelines

## 🧪 Core Testing Principles

**Comprehensive test coverage** for FastAPI + MongoDB backend with consistent patterns, proper status codes, and maintainable test structure.

### 🚨 CRITICAL RULES (User Requirements)

1. **API-Based Testing ONLY**: Use TestClient for HTTP requests, NEVER direct database access
2. **No Async Tests**: Don't use `@pytest.mark.asyncio` or `async def` - follow working patterns
3. **HTTPStatus Enum MANDATORY**: Always use `HTTPStatus.STATUS.value`, never hardcoded numbers
4. **Complete Type Annotations**: Every variable must have type hints
5. **Follow Working Patterns**: Base new tests on existing successful test files
6. **Test Current Behavior**: Focus on validating current API behavior, not migration logic

### Tech Stack
- **Framework**: FastAPI (Python 3.13)
- **Database**: MongoDB with mongomock-motor (in-memory testing)
- **Testing**: pytest + TestClient (API-based testing pattern)
- **Validation**: Pydantic v2 + comprehensive type annotations
- **Schema Management**: Structured upgrade system with version-specific tests

---

## 🏗️ Test Structure & Organization

### **File Organization**
```
backend/tests/
├── conftest.py                 # Fixtures and test configuration
├── .env.test                   # Test environment variables
├── admin/                      # Admin-specific functionality tests
│   ├── test_admin_products.py  # Admin product management
│   ├── test_admin_users.py     # Admin user management
│   └── test_admin_*.py         # Other admin features
├── admin_search/               # Admin search functionality tests
│   ├── test_admin_search_cart.py      # Admin cart search
│   ├── test_admin_search_products.py  # Admin product search
│   ├── test_admin_search_users.py     # Admin user search
│   └── test_admin_search_wishlist.py  # Admin wishlist search
├── auth/                       # Authentication tests
├── contact/                    # Contact form tests
├── models/                     # Model validation tests
├── products/                   # Product-specific tests
├── schema_upgrade/             # Schema version upgrade tests
│   ├── test_product_upgrade_v1_to_v2.py  # Product schema v1→v2
│   └── test_contact_upgrade_v1_to_v2.py  # Contact schema v1→v2
└── user/                       # User-specific functionality tests
```

### **Test Class Structure**
```python
class TestFeatureName:
    """Test feature functionality."""
    
    def test_feature_unauthorized(self, client: TestClient) -> None:
        """Test that feature requires authentication."""
        
    def test_feature_forbidden(self, client: TestClient, user_token: str) -> None:
        """Test that regular users cannot access admin features."""
        
    def test_feature_invalid_input(self, client: TestClient, admin_token: str) -> None:
        """Test feature with invalid input data."""
        
    def test_feature_success(self, client: TestClient, admin_token: str) -> None:
        """Test successful feature operation."""
        
    def test_feature_edge_cases(self, client: TestClient, admin_token: str) -> None:
        """Test feature edge cases and boundary conditions."""
```

---

## 🎯 HTTP Status Code Usage (MANDATORY)

### **ALWAYS Use HTTPStatus Enum**
```python
# ✅ CORRECT - Use HTTPStatus enum
from app.models.enums.http_status import HTTPStatus

def test_create_product_success(self, client: TestClient, admin_token: str) -> None:
    response = client.post("/api/products", json=productData, headers=headers)
    assert response.status_code == HTTPStatus.CREATED.value  # ✅

def test_get_nonexistent_product(self, client: TestClient) -> None:
    response = client.get("/api/products/99999")
    assert response.status_code == HTTPStatus.NOT_FOUND.value  # ✅

# ❌ WRONG - Hardcoded status codes
def test_create_product_bad(self, client: TestClient, admin_token: str) -> None:
    response = client.post("/api/products", json=productData, headers=headers)
    assert response.status_code == 201  # ❌ Don't do this

def test_unauthorized_bad(self, client: TestClient) -> None:
    response = client.delete("/api/admin/products/bulk", json=[1, 2, 3])
    assert response.status_code == 401  # ❌ Don't do this
```

### **Common HTTP Status Patterns**
```python
# Authentication/Authorization
assert response.status_code == HTTPStatus.UNAUTHORIZED.value      # 401
assert response.status_code == HTTPStatus.FORBIDDEN.value         # 403

# Success Operations
assert response.status_code == HTTPStatus.OK.value                # 200
assert response.status_code == HTTPStatus.CREATED.value           # 201
assert response.status_code == HTTPStatus.NO_CONTENT.value        # 204

# Client Errors
assert response.status_code == HTTPStatus.BAD_REQUEST.value       # 400
assert response.status_code == HTTPStatus.NOT_FOUND.value         # 404
assert response.status_code == HTTPStatus.CONFLICT.value          # 409
assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY.value  # 422

# Server Errors
assert response.status_code == HTTPStatus.INTERNAL_SERVER_ERROR.value  # 500
```

---

## 📋 Request Method Patterns

### **Standard HTTP Methods with JSON**
```python
# ✅ POST/PUT/PATCH with json parameter
response = client.post("/api/products", json=productData, headers=headers)
response = client.put(f"/api/products/{productId}", json=updateData, headers=headers)
response = client.patch(f"/api/products/{productId}/inventory", json=inventoryData, headers=headers)

# ✅ GET/DELETE without body
response = client.get("/api/products")
response = client.delete(f"/api/products/{productId}", headers=headers)
```

### **DELETE with JSON Body (Special Case)**
```python
# ✅ CORRECT - Use client.request() for DELETE with JSON body
def test_bulk_delete_products(self, client: TestClient, admin_token: str) -> None:
    headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
    productIds: List[int] = [1, 2, 3]
    
    # Use request() method for DELETE with JSON body
    response = client.request("DELETE", "/api/admin/products/bulk", 
                             json=productIds, headers=headers)
    assert response.status_code == HTTPStatus.OK.value

# ❌ WRONG - client.delete() doesn't support json parameter
def test_bulk_delete_bad(self, client: TestClient, admin_token: str) -> None:
    response = client.delete("/api/admin/products/bulk", json=[1, 2, 3])  # ❌ Error!
```

---

## 🔧 Type Annotations (REQUIRED)

### **Comprehensive Type Annotations**
```python
# ✅ CORRECT - Full type annotations
def test_create_multiple_products(self, client: TestClient, admin_token: str) -> None:
    headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
    productData: Dict[str, Any] = {
        "name": "Test Product",
        "category": Category.ELECTRONICS.value,
        "price": 99.99
    }
    
    response = client.post("/api/products", json=productData, headers=headers)
    assert response.status_code == HTTPStatus.CREATED.value
    
    responseData: Dict[str, Any] = response.json()
    productId: int = responseData["id"]
    createdProducts: List[Dict[str, Any]] = [responseData]

# ❌ WRONG - Missing type annotations
def test_create_product_bad(self, client, admin_token):  # ❌ Missing types
    headers = {"Authorization": f"Bearer {admin_token}"}  # ❌ Missing type
    response = client.post("/api/products", json=productData)  # ❌ Missing type
```

### **Required Import Patterns**
```python
# ✅ Standard test imports
from typing import Dict, Any, List, Optional
from fastapi.testclient import TestClient
from app.models.enums.http_status import HTTPStatus
from app.models.enums.category import Category
from app.models.enums.inventoryStatus import InventoryStatus
```

---

## 🧪 Test Data Patterns

### **Realistic Test Data**
```python
# ✅ CORRECT - Use realistic, valid test data
def test_create_product_success(self, client: TestClient, admin_token: str) -> None:
    productData: Dict[str, Any] = {
        "name": "Wireless Gaming Mouse",           # ✅ Realistic name
        "description": "High-precision gaming mouse with RGB lighting",
        "category": Category.ELECTRONICS.value,   # ✅ Valid enum
        "price": 79.99,                          # ✅ Reasonable price
        "quantity": 25,                          # ✅ Reasonable quantity
        "shellId": 1001,                         # ✅ Valid ID
        "inventoryStatus": InventoryStatus.INSTOCK.value
    }

# ❌ WRONG - Unrealistic or invalid test data
def test_create_product_bad(self, client: TestClient, admin_token: str) -> None:
    productData: Dict[str, Any] = {
        "name": "x",                             # ❌ Too short
        "price": -50,                           # ❌ Invalid negative price
        "category": "INVALID_CATEGORY",         # ❌ Not using enum
        "quantity": 999999                      # ❌ Unrealistic quantity
    }
```

### **Edge Case Testing**
```python
def test_bulk_operations_edge_cases(self, client: TestClient, admin_token: str) -> None:
    headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
    
    # Test empty list
    response = client.request("DELETE", "/api/admin/products/bulk", json=[], headers=headers)
    assert response.status_code == HTTPStatus.BAD_REQUEST.value
    
    # Test maximum limit (100 items)
    maxIds: List[int] = list(range(1, 101))  # Exactly 100 items
    response = client.request("DELETE", "/api/admin/products/bulk", json=maxIds, headers=headers)
    # Should process without limit error
    
    # Test over limit (101 items)
    overLimitIds: List[int] = list(range(1, 102))  # 101 items
    response = client.request("DELETE", "/api/admin/products/bulk", json=overLimitIds, headers=headers)
    assert response.status_code == HTTPStatus.BAD_REQUEST.value
    assert "Cannot delete more than 100 products at once" in response.json()["detail"]
```

---

## 🔐 Authentication Testing Patterns

### **Authentication Test Structure**
```python
def test_feature_authentication_required(self, client: TestClient) -> None:
    """Test that feature requires authentication."""
    # No authentication headers
    response = client.post("/api/admin/products", json=validData)
    assert response.status_code == HTTPStatus.UNAUTHORIZED.value

def test_feature_admin_required(self, client: TestClient, user_token: str) -> None:
    """Test that feature requires admin privileges."""
    headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
    response = client.post("/api/admin/products", json=validData, headers=headers)
    assert response.status_code == HTTPStatus.FORBIDDEN.value

def test_feature_admin_success(self, client: TestClient, admin_token: str) -> None:
    """Test that admin can successfully access feature."""
    headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
    response = client.post("/api/admin/products", json=validData, headers=headers)
    assert response.status_code == HTTPStatus.CREATED.value
```

---

## 📊 Response Validation Patterns

### **Comprehensive Response Testing**
```python
def test_create_product_response_structure(self, client: TestClient, admin_token: str) -> None:
    headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
    productData: Dict[str, Any] = {
        "name": "Test Product",
        "category": Category.ELECTRONICS.value,
        "price": 99.99,
        "quantity": 10
    }
    
    response = client.post("/api/products", json=productData, headers=headers)
    assert response.status_code == HTTPStatus.CREATED.value
    
    responseData: Dict[str, Any] = response.json()
    
    # ✅ Validate response structure
    assert "id" in responseData
    assert "code" in responseData
    assert "internalReference" in responseData
    assert "createdAt" in responseData
    assert "updatedAt" in responseData
    
    # ✅ Validate data types
    assert isinstance(responseData["id"], int)
    assert isinstance(responseData["name"], str)
    assert isinstance(responseData["price"], float)
    assert isinstance(responseData["quantity"], int)
    
    # ✅ Validate business logic
    assert responseData["name"] == productData["name"]
    assert responseData["price"] == productData["price"]
    assert responseData["code"].startswith("f")  # Auto-generated format
    assert responseData["internalReference"].startswith("REF-")
```

---

## 🚦 Error Message Testing

### **Consistent Error Message Validation**
```python
def test_validation_error_messages(self, client: TestClient, admin_token: str) -> None:
    headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
    
    # Test specific error messages from backend
    response = client.request("DELETE", "/api/admin/products/bulk", json=[], headers=headers)
    assert response.status_code == HTTPStatus.BAD_REQUEST.value
    assert "Product IDs list cannot be empty" in response.json()["detail"]
    
    # Test validation error messages
    invalidData: Dict[str, Any] = {"name": "", "price": -1}
    response = client.post("/api/products", json=invalidData, headers=headers)
    assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY.value
    
    errorDetail = response.json()["detail"]
    assert isinstance(errorDetail, list)  # Pydantic validation errors
```

---

## 🔄 Database State Management

### **Proper Test Isolation**
```python
def test_crud_operations_isolation(self, client: TestClient, admin_token: str) -> None:
    """Test that operations don't interfere with each other."""
    headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
    
    # Create test product
    productData: Dict[str, Any] = {
        "name": "Isolated Test Product",
        "category": Category.FITNESS.value,
        "price": 45.99,
        "quantity": 5
    }
    
    createResponse = client.post("/api/products", json=productData, headers=headers)
    assert createResponse.status_code == HTTPStatus.CREATED.value
    product: Dict[str, Any] = createResponse.json()
    productId: int = product["id"]
    
    # Verify creation
    getResponse = client.get(f"/api/products/{productId}")
    assert getResponse.status_code == HTTPStatus.OK.value
    
    # Clean up (delete)
    deleteResponse = client.delete(f"/api/products/{productId}", headers=headers)
    assert deleteResponse.status_code == HTTPStatus.OK.value
    
    # Verify deletion
    verifyResponse = client.get(f"/api/products/{productId}")
    assert verifyResponse.status_code == HTTPStatus.NOT_FOUND.value
```

---

## 📝 Documentation & Comments

### **Test Documentation Standards**
```python
def test_bulk_delete_products_partial_success(self, client: TestClient, admin_token: str) -> None:
    """
    Test bulk deletion when some products don't exist.
    
    This test verifies that:
    1. The endpoint accepts a mix of existing and non-existing product IDs
    2. Only existing products are deleted
    3. The response correctly reports which products were deleted
    4. Non-existing product IDs are handled gracefully
    5. The operation returns success status even with partial failures
    """
    headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
    
    # Create one product to delete
    productData: Dict[str, Any] = {
        "name": "Existing Product to Delete",
        "description": "This product exists and will be deleted",
        "category": Category.FITNESS.value,
        "price": 45.99,
        "quantity": 3,
        "shellId": 203,
        "inventoryStatus": InventoryStatus.INSTOCK.value
    }
```

---

## 🔄 Schema Upgrade Testing

### **Schema Version Testing Strategy**
Schema upgrade tests focus on **API behavior validation** rather than direct database migration testing. These tests ensure that the current API correctly handles schema version 2 data structures.

### **Test Categories**

#### **1. Current Schema Version Validation**
```python
def test_create_product_with_current_schema_version(self, client: TestClient, admin_token: str) -> None:
    """Test that new products are created with current schema version 2."""
    headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
    
    productData: Dict[str, Any] = {
        "name": "Test Product Current Schema",
        "category": Category.ELECTRONICS.value,
        "price": 99.99,
        "quantity": 10
    }
    
    response = client.post("/api/products", json=productData, headers=headers)
    assert response.status_code == HTTPStatus.CREATED.value
    
    # Verify schema version 2 is applied
    responseData: Dict[str, Any] = response.json()
    assert responseData["schemaVersion"] == 2
```

#### **2. Field Auto-Generation Testing**
```python
def test_product_creation_auto_generates_fields(self, client: TestClient, admin_token: str) -> None:
    """Test that product creation auto-generates required fields."""
    headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
    
    response = client.post("/api/products", json=productData, headers=headers)
    assert response.status_code == HTTPStatus.CREATED.value
    
    responseData: Dict[str, Any] = response.json()
    assert "id" in responseData
    assert "code" in responseData
    assert "internalReference" in responseData
    assert responseData["schemaVersion"] == 2
    
    # Verify auto-generated field formats
    assert isinstance(responseData["id"], int)
    assert len(responseData["code"]) == 9  # Product code format
    assert responseData["internalReference"].startswith("REF-")
```

#### **3. Data Validation Testing**
```python
def test_api_validation_rejects_invalid_data_types(self, client: TestClient, admin_token: str) -> None:
    """Test that API validation properly rejects invalid data types."""
    headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
    
    # Invalid price type
    productData: Dict[str, Any] = {
        "name": "Test Product Invalid Price",
        "price": "invalid_price",  # Should be number
        "category": Category.ELECTRONICS.value
    }
    
    response = client.post("/api/products", json=productData, headers=headers)
    assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY.value
```

#### **4. Enum Validation Testing**
```python
def test_api_validation_rejects_invalid_category(self, client: TestClient, admin_token: str) -> None:
    """Test that API validation properly rejects invalid category values."""
    headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
    
    productData: Dict[str, Any] = {
        "name": "Test Product Invalid Category",
        "category": "INVALID_CATEGORY",  # Should be valid enum
        "price": 99.99
    }
    
    response = client.post("/api/products", json=productData, headers=headers)
    assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY.value
```

### **Schema Upgrade Test Structure**
```
tests/schema_upgrade/
├── test_product_upgrade_v1_to_v2.py    # Product schema v2 validation
└── test_contact_upgrade_v1_to_v2.py     # Contact schema v2 validation
```

### **Test Naming Convention**
- `test_create_*_with_current_schema_version` - Schema version validation
- `test_*_auto_generates_fields` - Auto-generation testing  
- `test_api_validation_rejects_*` - Data validation testing
- `test_*_schema_version_consistency` - Cross-operation validation
- `test_multiple_*_have_unique_generated_fields` - Uniqueness testing

### **Key Testing Principles**
- **API-Based**: Use TestClient for HTTP requests, not direct database access
- **Current Behavior**: Test current schema version 2 behavior, not migration
- **Comprehensive Coverage**: Test auto-generation, validation, uniqueness
- **Realistic Data**: Use valid enum values and production-like test data
- **HTTPStatus Enum**: Always use HTTPStatus enum for status code assertions
- **No Async**: Follow existing working patterns, avoid async test functions
- **Type Safety**: Complete type annotations for all variables and functions

---

## ✅ Test Execution Commands

### **Running Tests**
```bash
# Run all tests
uv run pytest tests/ --tb=short -v

# Run specific test file
uv run pytest tests/admin/test_admin_products.py --tb=short -v

# Run schema upgrade tests
uv run pytest tests/schema_upgrade/ --tb=short -v
uv run pytest tests/schema_upgrade/test_product_upgrade_v1_to_v2.py --tb=short -v
uv run pytest tests/schema_upgrade/test_contact_upgrade_v1_to_v2.py --tb=short -v

# Run specific test method
uv run pytest tests/admin/test_admin_products.py::TestAdminProducts::test_bulk_delete_products_success --tb=short -v

# Run tests by pattern
uv run pytest tests/ -k "bulk_delete" --tb=short -v
uv run pytest tests/ -k "schema_upgrade" --tb=short -v
uv run pytest tests/ -k "admin_search" --tb=short -v

# Run with coverage
uv run pytest tests/ --cov=app --cov-report=html --tb=short
```

### **Debugging Tests**
```bash
# Verbose output with print statements
uv run pytest tests/ -v -s

# Stop on first failure
uv run pytest tests/ -x

# Show local variables in tracebacks
uv run pytest tests/ --tb=long

# Run specific failing test with maximum detail
uv run pytest tests/admin/test_admin_products.py::TestAdminProducts::test_bulk_delete_products_success -vvv --tb=long -s
```

---

## 🎯 Development Checklist

### **Before Writing Tests**
- [ ] Import `HTTPStatus` enum from `app.models.enums.http_status`
- [ ] Add comprehensive type annotations for all variables
- [ ] Plan test cases: unauthorized, forbidden, invalid input, success, edge cases
- [ ] Choose realistic test data that matches production scenarios
- [ ] Determine correct HTTP methods and status codes

### **Test Implementation**
- [ ] Use `HTTPStatus.{STATUS}.value` for all status code assertions
- [ ] Use `client.request("DELETE", url, json=data)` for DELETE with JSON body
- [ ] Use `client.post/put/patch(url, json=data)` for standard operations
- [ ] Include authentication tests (unauthorized, forbidden, success)
- [ ] Test input validation (empty, invalid, over limits)
- [ ] Test business logic edge cases
- [ ] Verify response structure and data types
- [ ] Test error message content and format

### **Before Committing**
- [ ] All tests pass with proper HTTP status enums
- [ ] No hardcoded status codes (401, 404, etc.)
- [ ] All functions have type annotations
- [ ] Test names clearly describe what is being tested
- [ ] Docstrings explain test purpose and expectations
- [ ] Test data is realistic and valid
- [ ] Edge cases and error conditions are covered
- [ ] Authentication and authorization properly tested

---

## 🚀 Performance Considerations

### **Test Efficiency**
- Tests run in **memory only** with mongomock-motor
- **No real database** connections needed
- Full test suite should complete in **<5 seconds**
- Each test gets **fresh database state**
- **Parallel execution** safe (no shared state)

### **Best Practices for Speed**
- Use minimal test data that still validates functionality
- Avoid unnecessary complex operations in test setup
- Leverage fixtures for common test data patterns
- Group related tests in same test class for better organization

---

**Remember**: Consistent patterns, proper HTTP status enums, comprehensive type annotations, and realistic test scenarios create maintainable and reliable test suites that catch bugs early and document expected behavior clearly.

## 📋 KEY ATTENTION POINTS (Summary)

### **🚨 CRITICAL: What You MUST Do**
1. **Use TestClient ONLY** - Never direct database access in tests
2. **No async functions** - Don't use `@pytest.mark.asyncio` or `async def`
3. **HTTPStatus enum required** - Always `HTTPStatus.STATUS.value`, never `200`, `404`, etc.
4. **Type everything** - Every variable needs type hints: `Dict[str, Any]`, `List[int]`
5. **Follow working patterns** - Look at existing successful tests and copy their structure

### **🔧 Pattern Requirements**
- **Authentication tests**: unauthorized (401), forbidden (403), success (200/201)
- **Input validation**: invalid data types, missing fields, enum validation
- **Response validation**: check structure, data types, business logic
- **Edge cases**: empty lists, over limits, boundary conditions
- **Error messages**: verify specific error text from backend

### **📝 Test Structure Template**
```python
def test_feature_name(self, client: TestClient, admin_token: str) -> None:
    """Clear description of what this test validates."""
    headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
    
    testData: Dict[str, Any] = {
        "field": "realistic_value",
        "enum": EnumClass.VALUE.value
    }
    
    response = client.post("/api/endpoint", json=testData, headers=headers)
    assert response.status_code == HTTPStatus.CREATED.value
    
    responseData: Dict[str, Any] = response.json()
    assert "expectedField" in responseData
```

### **⚠️ Common Mistakes to Avoid**
- ❌ Using hardcoded status codes (401, 404, 201)
- ❌ Missing type annotations on variables
- ❌ Using async functions or direct database access
- ❌ Not testing authentication/authorization patterns
- ❌ Using unrealistic test data or invalid enum values
- ❌ Skipping error message validation
- ❌ Not following existing working test patterns

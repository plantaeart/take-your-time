---
applyTo: '**'
---

# Backend Testing Guidelines & Setup

## 🧪 Testing Overview

The backend uses **pytest** with **mongomock-motor** for comprehensive testing of the FastAPI Product Management API. All tests run against a **mocked MongoDB** environment, eliminating the need for real database connections during testing.

## 🏗️ Testing Architecture

### Core Testing Dependencies
- **pytest 8.4.1**: Primary testing framework
- **pytest-asyncio 0.23.8**: Async test support for FastAPI
- **mongomock-motor 0.0.36**: Native async MongoDB mocking (replaces complex AsyncMock patterns)
- **FastAPI TestClient**: HTTP client for API endpoint testing

### Test Database Strategy
- **No Real Database Required**: Uses `mongomock-motor.AsyncMongoMockClient` for in-memory database simulation
- **Native Async Support**: No custom async wrappers needed - mongomock-motor handles async operations natively
- **Clean Architecture**: Simple `TestDatabaseManager` class extends production `DatabaseManager`

## 📁 Test Structure

```
tests/
├── conftest.py                     # Pytest configuration & fixtures
├── .env.test                       # Test environment variables
├── test_products_autogeneration.py # Auto-generation logic tests
├── test_products_endpoints.py      # API endpoint integration tests
└── test_products_unit.py           # Model & schema unit tests
```

## 🔧 Configuration (conftest.py)

### Key Components

#### TestDatabaseManager
```python
class TestDatabaseManager(DatabaseManager):
    """Test database manager using mongomock-motor for native async support."""
    
    def __init__(self, mock_client):
        super().__init__()
        self.client = mock_client
        self.database = mock_client["TAKE_YOUR_TIME_TEST"]
    
    def get_collection(self, collection_name: str):
        """Get collection - no mocking needed, mongomock-motor handles async natively."""
        return self.database[collection_name]
```

#### Core Fixtures
- `mock_db_manager`: Creates TestDatabaseManager with AsyncMongoMockClient
- `setup_test_environment`: Auto-applied fixture that replaces global db_manager
- `app`: FastAPI application instance for testing
- `client`: TestClient for HTTP requests

### Environment Setup
- Uses `.env.test` for test configuration
- Automatically replaces production `db_manager` with mock version
- Handles cleanup and restoration after tests

## 📋 Test Categories

### 1. Auto-Generation Tests (`test_products_autogeneration.py`)
**Purpose**: Validate product code and internal reference generation logic

**Key Test Cases**:
- `test_generate_product_code`: Validates format `f230fh0g3` pattern
- `test_generate_internal_reference`: Validates format `REF-123-456` pattern
- `test_get_next_product_id_empty_database`: Tests ID sequence starting from 1
- `test_code_uniqueness`: Ensures generated codes are unique across iterations
- `test_reference_uniqueness`: Ensures generated references are unique
- `test_*_performance`: Tests generation speed (500 items in <1 second)
- `test_auto_generation_integration`: End-to-end auto-generation workflow
- `test_custom_*_preservation`: Ensures user-provided codes/references are preserved

**MongoDB Interactions**: Uses `asyncio.run()` for direct database operations in test setup

### 2. API Endpoint Tests (`test_products_endpoints.py`)
**Purpose**: Integration testing of FastAPI endpoints via HTTP

**Key Test Cases**:
- `test_health_endpoint`: Basic connectivity verification
- `test_get_products_empty`: Empty database response
- `test_create_product_success`: POST /products with auto-generation
- `test_get_single_product`: GET /products/{id}
- `test_update_product`: PUT /products/{id} 
- `test_delete_product`: DELETE /products/{id}
- `test_get_categories`: GET /products/categories enum listing
- `test_update_inventory`: PATCH /products/{id}/inventory
- `test_pagination`: Query parameters `skip` and `limit`

**Testing Pattern**: Uses FastAPI `TestClient` for HTTP requests, validates JSON responses

### 3. Unit Tests (`test_products_unit.py`)
**Purpose**: Model and schema validation testing

**Key Test Cases**:
- **ProductModel Tests**: Document creation, serialization, field validation
- **ProductSchemas Tests**: Pydantic validation for ProductCreate, ProductResponse
- **Validation Rules**: Price/quantity minimums, rating bounds, enum constraints
- **Error Handling**: Invalid data rejection, required field enforcement

**Focus**: Pure Python object validation without database operations

## 🚀 Running Tests

### Full Test Suite
```bash
cd backend
uv run pytest tests/ -v
```

### Individual Test Files
```bash
# Auto-generation tests only
uv run pytest tests/test_products_autogeneration.py -v

# API endpoint tests only
uv run pytest tests/test_products_endpoints.py -v

# Unit tests only  
uv run pytest tests/test_products_unit.py -v
```

### Specific Test Methods
```bash
# Run specific test
uv run pytest tests/test_products_endpoints.py::TestProductEndpoints::test_create_product_success -v

# Run tests matching pattern
uv run pytest tests/ -k "auto_generation" -v
```

## 📊 Test Coverage

**Current Status**: 33 tests covering:
- ✅ All CRUD operations (Create, Read, Update, Delete)
- ✅ Auto-generation logic (codes, references, IDs)
- ✅ Data validation (Pydantic schemas)
- ✅ API pagination and filtering
- ✅ Error handling and edge cases
- ✅ Enum validation (Category, InventoryStatus)

## 🔧 Environment Configuration (.env.test)

```env
# Test Environment  
ENVIRONMENT=test
DEBUG=true

# MongoDB Configuration (ignored by mongomock-motor)
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=TAKE_YOUR_TIME_TEST

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# CORS Configuration
FRONTEND_URLS=http://localhost:4200,http://127.0.0.1:4200
```

**Note**: MongoDB settings are **ignored** since mongomock-motor creates in-memory databases, but they're kept for FastAPI settings compatibility.

## 🛠️ Troubleshooting

### Common Issues

1. **Import Errors**: Ensure you're running from `backend/` directory
2. **Async Test Failures**: Verify `pytest-asyncio` is installed and configured
3. **Environment Issues**: Check `.env.test` exists and is properly formatted
4. **Database Connection Errors**: Should not occur with mongomock-motor (no real DB needed)

### Debugging Tips

```bash
# Verbose output with print statements
uv run pytest tests/ -v -s

# Stop on first failure
uv run pytest tests/ -x

# Show local variables in tracebacks
uv run pytest tests/ --tb=long

# Capture warnings
uv run pytest tests/ --disable-warnings
```

## 🎯 Best Practices

### Test Development
1. **Use Fixtures**: Leverage `mock_db_manager` and `client` fixtures
2. **Async Handling**: Use `pytest.mark.asyncio` for async test functions
3. **Data Cleanup**: Tests automatically clean up via mongomock's in-memory nature
4. **Isolation**: Each test gets fresh database state via mongomock
5. **Realistic Data**: Use valid enum values and realistic test data

### Performance Considerations
- Tests run in **memory only** - very fast execution
- **No database startup/teardown** overhead
- Full test suite completes in **<1 second**
- Safe to run frequently during development

### Adding New Tests
1. Follow existing naming conventions (`test_*`)
2. Use appropriate test file (`autogeneration`, `endpoints`, `unit`)
3. Leverage existing fixtures for database and client setup
4. Test both success and error cases
5. Include edge cases and boundary conditions

## 📝 Migration Notes

**Previous Implementation**: Used complex `AsyncMock` wrappers with `pytest-mongodb`
**Current Implementation**: Clean `mongomock-motor` with native async support
**Benefits**: 
- Eliminated 50+ lines of custom mocking code
- Native async support without wrappers
- Faster test execution
- Simpler maintenance and debugging

## 🔄 Continuous Integration

Tests are designed to run in any environment without external dependencies:
- **No Docker required** for testing
- **No MongoDB installation needed**
- **No network connectivity required**
- **Consistent results** across development environments

Perfect for CI/CD pipelines and local development workflows.

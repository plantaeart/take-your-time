# Test Suite Documentation

This document provides a comprehensive guide to the test suite for the Take Your Time FastAPI backend application.

## 🚀 Running Tests

### Prerequisites
- Python 3.13+ installed
- UV package manager installed
- MongoDB running (for integration tests) or using mongomock for unit tests

### Quick Start
```bash
# Navigate to backend directory
cd backend

# Install dependencies
uv sync

# Run all tests
uv run pytest tests/ -v

# Run tests with coverage
uv run pytest tests/ --cov=app --cov-report=html

# Run specific test categories
uv run pytest tests/models/ -v          # Model tests only
uv run pytest tests/admin/ -v           # Admin functionality tests
uv run pytest tests/user/ -v            # User functionality tests
uv run pytest tests/auth/ -v            # Authentication tests
```

### Test Options
```bash
# Verbose output with detailed test names
uv run pytest tests/ -v

# Stop on first failure
uv run pytest tests/ -x

# Run tests in parallel (faster execution)
uv run pytest tests/ -n auto

# Generate HTML coverage report
uv run pytest tests/ --cov=app --cov-report=html

# Run specific test file
uv run pytest tests/models/test_product_model.py -v

# Run specific test method
uv run pytest tests/models/test_product_model.py::TestProductModel::test_product_model_creation -v

# Run tests matching pattern
uv run pytest tests/ -k "cart" -v       # All tests with "cart" in name
```

## 📁 Test Structure Overview

The test suite is organized into logical directories that mirror the application architecture:

```
tests/
├── conftest.py              # Global test configuration and fixtures
├── admin/                   # Admin-only functionality tests
├── auth/                    # Authentication and authorization tests
├── models/                  # Database model validation tests
├── products/                # Product-specific functionality tests
└── user/                    # User-facing functionality tests
```

## 📋 Test Categories

### 🔧 Core Configuration
- **`conftest.py`**: Global pytest configuration with fixtures for database setup, test clients, and authentication tokens

### 👑 Admin Tests (`admin/`)
Administrative functionality requiring admin privileges:

- **`test_admin_cart.py`** (11 tests)
  - Admin cart management operations
  - Bulk cart operations for users
  - Cart analytics and reporting
  - User cart administration

- **`test_admin_products.py`** (11 tests)
  - Product CRUD operations (Create, Read, Update, Delete)
  - Bulk product import/export
  - Product inventory management
  - Product validation and business rules

- **`test_admin_users.py`** (11 tests)
  - User account management
  - User privilege administration
  - User data operations
  - Account status management

- **`test_admin_wishlist.py`** (11 tests)
  - Admin wishlist management
  - Bulk wishlist operations
  - Wishlist analytics
  - User wishlist administration

### 🔐 Authentication Tests (`auth/`)
Security and authentication functionality:

- **`test_authentication.py`** (12 tests)
  - User registration and login
  - JWT token generation and validation
  - Password hashing and verification
  - Token blacklist functionality
  - Authentication middleware testing
  - Session management

### 🗃️ Model Tests (`models/`)
Database model validation and business logic:

- **`test_product_model.py`** (16 tests)
  - ProductModel creation and validation
  - Auto-generation of codes and references
  - Product schema validation (ProductCreate, ProductResponse)
  - Enum validation (Category, InventoryStatus)
  - Field validation rules (price, quantity, rating)

- **`test_user_model.py`** (11 tests)
  - UserModel creation and validation
  - Password hashing and verification
  - User schema validation (UserCreate, UserResponse, UserUpdate)
  - Email format validation
  - Username and field validation rules

- **`test_cart_model.py`** (18 tests)
  - CartModel and CartItem validation
  - Cart schema validation (CartItemCreate, CartResponse)
  - Quantity validation rules
  - Cart item management logic
  - Timestamp handling

- **`test_wishlist_model.py`** (27 tests)
  - WishlistModel and WishlistItem validation
  - Wishlist schema validation
  - Item uniqueness logic
  - Business rule validation
  - Wishlist item comparison and search

### 🛍️ Product Tests (`products/`)
Product-specific functionality:

- **`test_autogeneration.py`** (8 tests)
  - Product code generation (`f230fh0g3` format)
  - Internal reference generation (`REF-123-456` format)
  - ID auto-increment functionality
  - Uniqueness validation
  - Performance testing for generation

- **`test_products_api.py`** (13 tests)
  - Product API endpoints testing
  - HTTP request/response validation
  - Pagination and filtering
  - Error handling
  - API integration testing

### 👤 User Tests (`user/`)
User-facing functionality:

- **`test_user_cart.py`** (13 tests)
  - User cart operations (add, update, remove items)
  - Cart persistence across sessions
  - Cart isolation between users
  - Cart validation and error handling
  - Multi-item cart management
  - Cart timestamp tracking

- **`test_user_wishlist.py`** (14 tests)
  - User wishlist operations (add, remove items)
  - Wishlist persistence and isolation
  - Duplicate item handling
  - Wishlist-to-cart item movement
  - Out-of-stock product handling
  - Wishlist timestamp tracking
  - Product detail integration

## 🧪 Test Patterns and Standards

### Code Quality
- **Type Annotations**: All tests use comprehensive type hints (`Dict[str, Any]`, `List[int]`, etc.)
- **Naming Conventions**: camelCase for variables, snake_case for functions
- **Return Types**: All test methods annotated with `-> None`
- **Imports**: Proper typing imports (`from typing import Dict, Any, List`)

### Test Organization
- **Class-based**: Tests organized in logical classes (e.g., `TestProductModel`, `TestUserCartManagement`)
- **Descriptive Names**: Clear, descriptive test method names
- **Documentation**: Comprehensive docstrings for all test methods
- **Fixtures**: Proper use of pytest fixtures for setup and teardown

### Data Management
- **Test Isolation**: Each test is independent and doesn't affect others
- **Database Mocking**: Uses `mongomock-motor` for fast, isolated database testing
- **Realistic Data**: Tests use realistic test data that matches production scenarios
- **Cleanup**: Automatic cleanup after each test

## 📊 Test Coverage

Current test suite includes:
- **190 total tests** across all categories
- **Model validation**: 72 tests covering all data models
- **API endpoints**: Comprehensive HTTP request/response testing
- **Business logic**: All core functionality validated
- **Error handling**: Edge cases and error conditions tested
- **Security**: Authentication and authorization thoroughly tested

## 🔍 Test Data and Fixtures

### Available Fixtures (from `conftest.py`)
- `client`: FastAPI TestClient for HTTP requests
- `admin_token`: JWT token for admin user authentication
- `user_token`: JWT token for regular user authentication
- `mock_db_manager`: Mocked database manager for isolated testing

### Test Data Patterns
- **Unique Identifiers**: Tests use unique shellIds, emails, and product names to avoid conflicts
- **Realistic Values**: Prices, quantities, and other values match real-world scenarios
- **Enum Values**: Tests validate all enum options (Category, InventoryStatus)
- **Edge Cases**: Boundary value testing (min/max prices, quantities, etc.)

## 🐛 Debugging Tests

### Common Commands
```bash
# Run with detailed output
uv run pytest tests/ -v -s

# Stop on first failure with traceback
uv run pytest tests/ -x --tb=long

# Run specific failing test
uv run pytest tests/models/test_product_model.py::TestProductModel::test_product_creation -v -s

# Show print statements
uv run pytest tests/ -s

# Debug with pdb
uv run pytest tests/ --pdb
```

### Test Failures
- Check test isolation - ensure tests don't depend on each other
- Verify test data uniqueness - use unique identifiers
- Review database state - ensure proper cleanup
- Check authentication - verify tokens are valid

## 📈 Performance

The test suite is optimized for speed:
- **In-memory database**: Uses mongomock for fast execution
- **Parallel execution**: Can run tests in parallel with `-n auto`
- **Selective testing**: Run only relevant test categories
- **Fast fixtures**: Lightweight setup and teardown

Typical execution times:
- Full test suite: ~68 seconds (190 tests)
- Model tests only: ~3 seconds (72 tests)
- User tests only: ~24 seconds (27 tests)
- Individual test file: 1-5 seconds

## 🔄 Continuous Integration

This test suite is designed for CI/CD pipelines:
- **No external dependencies**: Uses mocked database
- **Deterministic results**: Consistent test outcomes
- **Fast execution**: Optimized for quick feedback
- **Comprehensive coverage**: Validates all critical functionality

For CI systems, use:
```bash
uv run pytest tests/ --tb=short -q --cov=app --cov-report=xml
```

## 📝 Contributing

When adding new tests:
1. Follow the established naming conventions and structure
2. Include comprehensive type annotations
3. Use appropriate test categories and organization
4. Add descriptive docstrings
5. Ensure test isolation and cleanup
6. Update this documentation for new test categories

Happy testing! 🧪✨

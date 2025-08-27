---
applyTo: '**'
---

# Backend Information & Guidelines

## 🚨 Important: Documentation Updates

**CRITICAL INSTRUCTION**: When making ANY changes to the backend code, models, schemas, API endpoints, or configuration, you MUST update this instruction file to reflect those changes. This ensures the documentation stays current and any AI assistant can provide accurate help based on the latest system state.

## 🏗️ Architecture Overview

This is a **Product Management API** built with FastAPI that provides comprehensive CRUD operations for product catalog management. The backend uses asynchronous MongoDB operations and follows modern Python best practices.

### Tech Stack
- **Framework**: FastAPI (Python 3.13)
- **Database**: MongoDB with Motor (async driver)
- **Validation**: Pydantic v2
- **Package Manager**: UV
- **Container**: Docker with multi-stage builds
- **CLI Tools**: Typer + Rich for container management scripts

## 🗂️ Project Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── pyproject.toml         # Dependencies and project config
├── Dockerfile             # Multi-stage production build
├── .env.local             # Local development environment
├── .env.dev-docker        # Docker development environment
└── app/
    ├── __init__.py
    ├── version.py          # Centralized version management
    ├── config/
    │   ├── __init__.py
    │   ├── settings.py     # Pydantic settings (NO SECRET_KEY)
    │   ├── database.py     # MongoDB connection management
    │   └── cors.py         # CORS configuration for Angular
    ├── models/
    │   ├── __init__.py
    │   ├── product.py      # MongoDB document model
    │   └── enums/
    │       ├── __init__.py
    │       ├── category.py         # Product categories
    │       └── inventoryStatus.py  # Stock status enum
    ├── schemas/
    │   ├── __init__.py
    │   └── product.py      # Pydantic request/response schemas
    └── routers/
        ├── __init__.py
        └── products.py     # Product CRUD endpoints
```

## 🎯 Core Models

### ProductModel (app/models/product.py)
MongoDB document model with these fields:
- `id: int` - Auto-incrementing integer ID (1, 2, 3, etc.)
- `code: str` - Auto-generated unique product code (format: f230fh0g3)
- `name: str` - Product name (required)
- `description: str` - Product description (optional)
- `image: str` - Image URL (optional)
- `category: Category` - Product category enum (required)
- `price: float` - Product price (required, >= 0)
- `quantity: int` - Stock quantity (required, >= 0)
- `internal_reference: str` - Auto-generated internal SKU (format: REF-123-456)
- `shell_id: str` - Shell identifier (optional)
- `inventory_status: InventoryStatus` - Stock status enum (required)
- `rating: float` - Product rating (optional, 0-5)
- `created_at: datetime` - Creation timestamp
- `updated_at: datetime` - Last update timestamp

### Enums
- **Category**: ACCESSORIES, CLOTHING, FITNESS, ELECTRONICS
- **InventoryStatus**: INSTOCK, LOWSTOCK, OUTOFSTOCK

## 🔧 Configuration (app/config/settings.py)

**Important**: This configuration does NOT require a SECRET_KEY field.

Required environment variables:
- `MONGODB_URL`: MongoDB connection string
- `DATABASE_NAME`: Database name
- `FRONTEND_URLS`: Comma-separated Angular app URLs

Optional variables:
- `ENVIRONMENT`: "local" (default)
- `DEBUG`: true (default)
- `API_HOST`: "0.0.0.0" (default)
- `API_PORT`: 8000 (default)

### Environment Files
**Local (.env.local)**:
```env
ENVIRONMENT=local
DEBUG=true
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=TAKE_YOUR_TIME
API_HOST=0.0.0.0
API_PORT=8000
FRONTEND_URLS=http://localhost:4200,http://127.0.0.1:4200
```

**Docker (.env.dev-docker)**:
```env
ENVIRONMENT=dev-docker
DEBUG=true
MONGODB_URL=mongodb://mongodb:27017
DATABASE_NAME=TAKE_YOUR_TIME
API_HOST=0.0.0.0
API_PORT=8000
FRONTEND_URLS=http://localhost:4200,http://127.0.0.1:4200,http://frontend:4200
```

## 🛠️ API Endpoints (app/routers/products.py)

### Product CRUD Operations
1. **GET /products** - List products (paginated, filtered, searchable)
   - Query params: `skip`, `limit`, `category`, `inventory_status`, `search`
   - Returns: ProductListResponse with items and total count

2. **POST /products** - Create new product
   - Body: ProductCreate schema
   - Returns: ProductResponse

3. **GET /products/{product_id}** - Get single product
   - Returns: ProductResponse

4. **PUT /products/{product_id}** - Update product completely
   - Body: ProductCreate schema
   - Returns: ProductResponse

5. **DELETE /products/{product_id}** - Delete product
   - Returns: {"message": "Product deleted successfully"}

6. **GET /products/categories** - List all available categories
   - Returns: List of category strings

7. **PATCH /products/{product_id}/inventory** - Update inventory status
   - Body: {"inventory_status": "INSTOCK|LOWSTOCK|OUTOFSTOCK"}
   - Returns: ProductResponse

## 📦 Schemas (app/schemas/product.py)

### ProductCreate
Fields for creating/updating products:
- All model fields except `id`, `created_at`, `updated_at`
- `code` is optional (auto-generated if not provided, format: f230fh0g3)
- `internalReference` is optional (auto-generated if not provided, format: REF-123-456)
- `name` is required
- Price and quantity must be >= 0
- Rating must be between 0-5
- `shellId` must be >= 0

### ProductUpdate
Optional fields for partial updates:
- All fields optional except validation constraints

### ProductResponse
Complete product data for API responses:
- All model fields with proper serialization
- `id` is integer (auto-incrementing)
- `category` field uses Category enum type (may cause serialization issues)
- `createdAt` and `updatedAt` are datetime objects

### ProductListResponse
Paginated list response:
- `items: List[ProductResponse]`
- `total: int`

## 🗄️ Database (app/config/database.py)

- **Driver**: Motor (async MongoDB driver)
- **Connection**: Async context manager
- **Collection**: "products"
- **Indexes**: Recommended on `code` (unique), `category`, `inventory_status`

## 🚀 Development Commands

### Local Development
```bash
# Install dependencies
uv sync

# Run main application
uv run python main.py
```

## 🔐 CORS Configuration (app/config/cors.py)

Configured for Angular development:
- **Origins**: localhost:4200, 127.0.0.1:4200
- **Methods**: GET, POST, PUT, DELETE, OPTIONS, PATCH
- **Headers**: All standard headers for Angular apps
- **Credentials**: Enabled

## 📝 Coding Guidelines

### 1. Async/Await Pattern
- All database operations are async
- Use `await` for MongoDB operations
- Database connection uses async context manager

### 2. Error Handling
- Use FastAPI HTTPException for API errors
- Include meaningful error messages
- Return appropriate HTTP status codes

### 3. Validation
- Use Pydantic v2 for all data validation
- Implement field constraints (min/max values)
- Use enums for categorical data

### 4. MongoDB Operations
- Use Motor async driver
- Handle ObjectId serialization properly
- Implement proper error handling for database operations

### 5. API Design
- RESTful endpoint design
- Consistent response formats
- Proper HTTP status codes
- Include pagination for list endpoints

### 6. Documentation Maintenance
- **ALWAYS UPDATE THIS FILE** when making changes to models, schemas, endpoints, or configuration
- Keep field descriptions and validation rules current
- Document any breaking changes or API modifications
- Note any inconsistencies or pending fixes
- Update example requests/responses when API changes

## 🧪 Testing Notes

- No tests currently implemented
- Recommended: pytest with pytest-asyncio
- Test database operations with test containers
- Mock external dependencies

## 🚨 Important Notes

1. **No SECRET_KEY Required**: The configuration intentionally does not include JWT or session management
2. **Product-Focused**: This is a product catalog system, not a booking system
3. **Async First**: All database operations are asynchronous
4. **Pydantic v2**: Uses modern Pydantic features and validation
5. **Version Management**: Centralized in app/version.py and pyproject.toml
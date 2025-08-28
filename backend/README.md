# Take Your Time - Product Management API

A comprehensive FastAPI-based product management system with MongoDB backend, featuring user authentication, cart management, wishlists, and full CRUD operations.

## ✨ Features

- **Complete CRUD operations** for product management
- **JWT Authentication** with token blacklist functionality
- **User Management** with admin role system
- **Shopping Cart** operations for authenticated users
- **Wishlist Management** for saving favorite products
- **MongoDB integration** with async Motor driver
- **Environment-based configuration** (local/docker)
- **CORS configured** for Angular frontend
- **Docker containerization** ready
- **Advanced filtering and search** capabilities
- **Pagination support** for large datasets
- **Input validation** with Pydantic v2
- **Inventory management** with status tracking
- **Comprehensive API documentation** with Swagger UI

## 📋 Data Models

### Product Model
Each product includes:
- **Basic Info**: code (auto-generated), name (unique), description, image (optional)
- **Categorization**: category (ELECTRONICS|CLOTHING|FITNESS|ACCESSORIES)
- **Pricing**: price (float, >= 0)
- **Inventory**: quantity (int, >= 0), inventoryStatus (INSTOCK|LOWSTOCK|OUTOFSTOCK)
- **References**: internalReference (auto-generated), shellId
- **Quality**: rating (0-5 stars, optional)
- **Timestamps**: createdAt, updatedAt (datetime)

### User Model
User accounts with authentication:
- **Identity**: username (unique), email (unique), firstname
- **Security**: hashedPassword (bcrypt), isActive, isAdmin
- **Timestamps**: createdAt, updatedAt (datetime)

### Cart Model
Shopping cart functionality:
- **Owner**: userId (reference to user)
- **Items**: List of CartItems with productId, quantity, addedAt, updatedAt
- **Timestamps**: createdAt, updatedAt (datetime)

### Wishlist Model
User wishlist for favorite products:
- **Owner**: userId (reference to user)
- **Items**: List of WishlistItems with productId, addedAt
- **Timestamps**: createdAt, updatedAt (datetime)

## 🛠️ Setup & Installation

### Prerequisites
- Python 3.13+
- uv (Python package manager)
- Docker & Docker Compose (for containerized setup)
- MongoDB (local or Docker)

### Local Development

1. **Install dependencies:**
   ```bash
   uv sync
   ```

2. **Configure environment:**
   ```bash
   cp .env.local .env
   # Edit .env with your local MongoDB settings and secret key
   ```

3. **Start MongoDB locally:**
   ```bash
   # Using Docker
   docker run -d -p 27017:27017 --name mongodb mongo:7.0
   
   # Or use your local MongoDB installation
   ```

4. **Run the application:**
   ```bash
   # Using uv
   uv run uvicorn main:app --reload
   
   # Or direct Python
   uv run python main.py
   ```

5. **Access the API:**
   - API Documentation: http://localhost:8000/docs
   - Health Check: http://localhost:8000/health
   - Root: http://localhost:8000

### Docker Development

1. **Build and run with Docker Compose:**
   ```bash
   docker-compose up --build
   ```

2. **Access the API:**
   - API: http://localhost:8000
   - MongoDB: localhost:27017

3. **Stop services:**
   ```bash
   docker-compose down
   ```

## 📖 API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/account` | Register new user | No |
| POST | `/api/token` | Login (form-data or JSON) | No |
| POST | `/api/logout` | Logout and blacklist token | Yes |

### Products CRUD

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/products/` | Create new product | Admin |
| GET | `/api/products/` | List products (paginated, filterable) | No |
| GET | `/api/products/{id}` | Get specific product | No |
| PUT | `/api/products/{id}` | Update product | Admin |
| DELETE | `/api/products/{id}` | Delete product | Admin |
| GET | `/api/products/categories` | Get all unique categories | No |
| PATCH | `/api/products/{id}/inventory` | Update inventory status & quantity | Admin |
| POST | `/api/products/bulk` | Bulk create products | Admin |

### User Management (Admin Only)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/admin/users/` | List all users | Admin |
| GET | `/api/admin/users/{userId}` | Get specific user | Admin |
| PUT | `/api/admin/users/{userId}` | Update user information | Admin |
| DELETE | `/api/admin/users/{userId}` | Delete user account | Admin |

### Shopping Cart

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/cart` | Get user's cart | Yes |
| POST | `/api/cart/items` | Add item to cart | Yes |
| PUT | `/api/cart/items/{productId}` | Update item quantity | Yes |
| DELETE | `/api/cart/items/{productId}` | Remove item from cart | Yes |
| DELETE | `/api/cart` | Clear entire cart | Yes |

### Wishlist

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/wishlist` | Get user's wishlist | Yes |
| POST | `/api/wishlist/items` | Add item to wishlist | Yes |
| DELETE | `/api/wishlist/items/{productId}` | Remove item from wishlist | Yes |
| DELETE | `/api/wishlist` | Clear entire wishlist | Yes |

### Admin Cart Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/admin/users/{userId}/cart` | Get user's cart | Admin |
| DELETE | `/api/admin/users/{userId}/cart` | Clear user's cart | Admin |

### Admin Wishlist Management

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/admin/users/{userId}/wishlist` | Get user's wishlist | Admin |
| DELETE | `/api/admin/users/{userId}/wishlist` | Clear user's wishlist | Admin |

### Query Parameters (GET /products)

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)
- `category`: Filter by category
- `inventory_status`: Filter by inventory status (INSTOCK, LOWSTOCK, OUTOFSTOCK)
- `search`: Search in product name and description

### Example Requests

**Create Product:**
```json
POST /api/products/
{
  "code": "LAPTOP001",
  "name": "Professional Laptop",
  "description": "High-performance laptop for business use",
  "image": "https://example.com/laptop.jpg",
  "category": "Electronics",
  "price": 1299.99,
  "quantity": 50,
  "internalReference": "INT-LAPTOP-001",
  "shellId": 12345,
  "inventoryStatus": "INSTOCK",
  "rating": 4.5
}
```

**Update Inventory:**
```json
PATCH /api/products/{id}/inventory
{
  "inventory_status": "LOWSTOCK",
  "quantity": 5
}
```

**Search Products:**
```bash
GET /api/products/?search=laptop&category=Electronics&page=1&limit=10
```

## 🔧 Configuration

### Environment Variables

**Local (.env.local):**
```env
ENVIRONMENT=local
DEBUG=true
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=TAKE_YOUR_TIME
API_HOST=0.0.0.0
API_PORT=8000
FRONTEND_URLS=http://localhost:4200,http://127.0.0.1:4200
JWT_SECRET_KEY=your-secret-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
```

**Docker (.env.dev-docker):**
```env
ENVIRONMENT=dev-docker
DEBUG=true
MONGODB_URL=mongodb://mongodb:27017
DATABASE_NAME=TAKE_YOUR_TIME
API_HOST=0.0.0.0
API_PORT=8000
FRONTEND_URLS=http://localhost:4200,http://127.0.0.1:4200,http://frontend:4200
JWT_SECRET_KEY=your-docker-secret-key-here
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### CORS Configuration

Configured for Angular development:
- Origins: localhost:4200, 127.0.0.1:4200
- Methods: GET, POST, PUT, DELETE, OPTIONS, PATCH
- Headers: All standard headers for Angular apps
- Credentials: Enabled

## 🗂️ Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── version.py           # Centralized version management
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py      # Environment settings
│   │   ├── database.py      # MongoDB connection
│   │   └── cors.py          # CORS configuration
│   ├── auth/                # JWT authentication system
│   │   ├── __init__.py
│   │   ├── blacklist.py     # Token blacklist management
│   │   ├── dependencies.py  # Auth dependencies & decorators
│   │   ├── jwt.py           # JWT token handling
│   │   └── password.py      # Password hashing utilities
│   ├── models/              # MongoDB document models
│   │   ├── __init__.py
│   │   ├── product.py       # Product model & indexes
│   │   ├── user.py          # User model & admin creation
│   │   ├── cart.py          # Shopping cart model
│   │   ├── wishlist.py      # User wishlist model
│   │   ├── token_blacklist.py # JWT blacklist model
│   │   └── enums/           # Category, Status, Messages enums
│   ├── routers/             # API endpoints
│   │   ├── __init__.py
│   │   ├── products.py      # Product CRUD + bulk import
│   │   ├── auth.py          # Login/register/logout endpoints
│   │   ├── admin_users.py   # Admin user management
│   │   ├── cart.py          # Shopping cart operations
│   │   └── wishlist.py      # Wishlist operations
│   └── schemas/             # Pydantic request/response schemas
│       ├── __init__.py
│       ├── product.py       # Product CRUD schemas
│       ├── auth.py          # JWT token schemas (OAuth2 standard)
│       ├── user.py          # User management schemas
│       ├── cart.py          # Cart operation schemas
│       └── wishlist.py      # Wishlist schemas
├── tests/                   # Comprehensive test suite (190 tests)
│   ├── conftest.py          # Test configuration & fixtures
│   ├── admin/               # Admin functionality tests
│   ├── auth/                # Authentication & JWT tests
│   ├── models/              # Model validation tests
│   ├── products/            # Product API tests
│   └── user/                # User functionality tests
├── .env.local               # Local environment config
├── .env.dev-docker          # Docker environment config
├── .dockerignore
├── Dockerfile
├── docker-compose.yml
├── main.py                  # FastAPI application
├── pyproject.toml           # Python dependencies
└── README.md
```

## 🔐 Authentication & Security

### JWT Authentication System
- **Token-based authentication** with JWT (JSON Web Tokens)
- **Secure password hashing** using bcrypt
- **Token blacklist functionality** for secure logout
- **Role-based access control** (Admin/User roles)
- **OAuth2 compliant** token endpoints

### Default Admin Account
- **Email**: `admin@admin.com`
- **Password**: `admin`
- **Created automatically** on application startup
- **Admin privileges**: Full access to user management and product operations

### Security Features
- **Password hashing**: bcrypt with salt rounds
- **Token expiration**: Configurable JWT expiration (default: 30 minutes)
- **Secure logout**: Token blacklist prevents reuse of invalidated tokens
- **Protected endpoints**: Admin-only routes for sensitive operations
- **CORS protection**: Configured for specific frontend origins

### Authentication Flow
1. **Register**: Create new user account (`POST /api/account`)
2. **Login**: Get JWT token (`POST /api/token`)
3. **Access**: Include token in Authorization header: `Bearer <token>`
4. **Logout**: Invalidate token (`POST /api/logout`)

## 🧪 Testing

### Comprehensive Test Suite (190 Tests)

```bash
# Run all tests
uv run pytest

# Run tests with coverage
uv run pytest --cov=app

# Run specific test categories
uv run pytest tests/admin/          # Admin functionality (30 tests)
uv run pytest tests/auth/           # Authentication & JWT (15 tests)
uv run pytest tests/models/         # Model validation (72 tests)
uv run pytest tests/products/       # Product API & logic (46 tests)
uv run pytest tests/user/           # User functionality (27 tests)

# Run specific test file
uv run pytest tests/models/test_product_model.py -v
```

### Test Coverage
- **Admin Operations**: User management, cart/wishlist admin controls
- **Authentication**: JWT tokens, login/logout, password hashing
- **Model Validation**: All MongoDB models with comprehensive field testing
- **Product Management**: CRUD operations, auto-generation, bulk imports
- **User Features**: Shopping cart, wishlist, user account management

See `tests/TEST_README.md` for detailed test documentation.

## 📝 Development Notes

### Adding New Features

1. **New Model**: Add to `app/models/`
2. **New Schema**: Add to `app/schemas/`
3. **New Routes**: Add to `app/routers/`
4. **Update Main**: Include router in `main.py`

### Database Operations

- Using PyMongo async API (new unified driver)
- MongoDB collections are created automatically
- Indexes can be added in `app/config/database.py`

### Product Features

- **Unique Code Validation**: Product codes must be unique
- **Inventory Management**: Automatic status tracking
- **Search Functionality**: Text search across name and description
- **Category Management**: Dynamic category listing
- **Timestamp Handling**: Unix timestamps for created/updated dates

### Error Handling

- Comprehensive HTTP exception handling
- Input validation with Pydantic v2
- Database connection error management
- Proper HTTP status codes
- ObjectId validation for MongoDB queries

## 🚦 Health Monitoring

- Health check endpoint: `/health`
- Docker health checks configured
- Logging with Python logging module
- Version information in health response

## 🔒 Security Considerations

- Input validation on all endpoints
- ObjectId validation for MongoDB
- CORS properly configured
- Environment-based secrets
- Non-root Docker user
- Secret key for JWT/sessions (if needed)

## 📊 Product API Features

### Advanced Filtering
- Filter by category
- Filter by inventory status
- Text search in name and description
- Pagination with configurable limits

### Inventory Management
- Track quantity and status
- Update inventory in bulk
- Automatic status calculation
- Low stock alerts

### Data Validation
- Price validation (must be positive)
- Rating validation (0-5 range)
- Required fields enforcement
- Unique code constraints

---

**Happy Coding! 🎉**

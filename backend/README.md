# Take Your Time - Product Management API

A FastAPI-based product management system with MongoDB backend for inventory and catalog operations.
**Local Development (.env.local):**
```env
ENVIRONMENT=local
DEBUG=true
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=TAKE_YOUR_TIME
API_HOST=0.0.0.0
API_PORT=8000
FRONTEND_URLS=http://localhost:4200,http://127.0.0.1:4200
```tures

- **Complete CRUD operations** for product management
- **MongoDB integration** with async PyMongo
- **Environment-based configuration** (local/docker)
- **CORS configured** for Angular frontend
- **Docker containerization** ready
- **Advanced filtering and search** capabilities
- **Pagination support** for large datasets
- **Input validation** with Pydantic v2
- **Inventory management** with status tracking
- **Comprehensive API documentation** with Swagger UI

## 📋 Product Model

Each product includes:
- **Basic Info**: code, name, description, image
- **Categorization**: category for organization
- **Pricing**: price (float)
- **Inventory**: quantity, inventory status (INSTOCK/LOWSTOCK/OUTOFSTOCK)
- **References**: internalReference, shellId
- **Quality**: rating (0-5 stars)
- **Timestamps**: createdAt, updatedAt (Unix timestamps)

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

### Products CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/products/` | Create new product |
| GET | `/api/products/` | List products (paginated, filterable) |
| GET | `/api/products/{id}` | Get specific product |
| PUT | `/api/products/{id}` | Update product |
| DELETE | `/api/products/{id}` | Delete product |
| GET | `/api/products/categories` | Get all unique categories |
| PATCH | `/api/products/{id}/inventory` | Update inventory status & quantity |

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
SECRET_KEY=your-secret-key-here
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
│   ├── models/
│   │   ├── __init__.py
│   │   └── product.py       # MongoDB document models
│   ├── routers/
│   │   ├── __init__.py
│   │   └── products.py      # CRUD API routes
│   └── schemas/
│       ├── __init__.py
│       └── product.py       # Pydantic request/response schemas
├── .env.local               # Local environment config
├── .env.dev-docker          # Docker environment config
├── .dockerignore
├── Dockerfile
├── docker-compose.yml
├── main.py                  # FastAPI application
├── pyproject.toml           # Python dependencies
└── README.md
```

## 🧪 Testing

```bash
# Run tests
uv run pytest

# Run tests with coverage
uv run pytest --cov=app

# Run specific test file
uv run pytest tests/test_products.py
```

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

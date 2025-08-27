# Take Your Time - Booking API

A FastAPI-based booking reservation system for restaurants and events with MongoDB backend.

## 🚀 Features

- **Complete CRUD operations** for booking management
- **MongoDB integration** with async PyMongo
- **Environment-based configuration** (local/docker)
- **CORS configured** for Angular frontend
- **Docker containerization** ready
- **Pagination and filtering** for booking lists
- **Input validation** with Pydantic
- **Comprehensive API documentation** with Swagger UI

## 📋 Booking Model

Each booking includes:
- Customer information (name, email, phone)
- Booking details (date, time slot, service type)
- Capacity (adults, children, rooms/tables needed)
- Status tracking (pending, confirmed, cancelled, completed)
- Timestamps (created_at)

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
   # Edit .env with your local MongoDB settings
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

### Bookings CRUD

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/bookings/` | Create new booking |
| GET | `/api/v1/bookings/` | List bookings (paginated) |
| GET | `/api/v1/bookings/{id}` | Get specific booking |
| PUT | `/api/v1/bookings/{id}` | Update booking |
| PATCH | `/api/v1/bookings/{id}/status` | Update booking status |
| DELETE | `/api/v1/bookings/{id}` | Delete booking |

### Query Parameters (GET /bookings)

- `page`: Page number (default: 1)
- `page_size`: Items per page (default: 10, max: 100)
- `status`: Filter by status (pending, confirmed, cancelled, completed)
- `service_type`: Filter by service (restaurant, event, meeting, conference, other)
- `customer_name`: Filter by customer name (partial match)

### Example Requests

**Create Booking:**
```json
POST /api/v1/bookings/
{
  "customer_name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "+1234567890",
  "booking_date": "2025-08-30T18:00:00Z",
  "time_slot": "18:00-20:00",
  "service_type": "restaurant",
  "nb_adultes": 2,
  "nb_children": 1,
  "nb_rest_room": 1
}
```

**Update Status:**
```json
PATCH /api/v1/bookings/{id}/status
{
  "status": "confirmed"
}
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
SECRET_KEY=your-super-secret-key
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
SECRET_KEY=your-super-secret-key
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
│   ├── config/
│   │   ├── __init__.py
│   │   ├── settings.py      # Environment settings
│   │   ├── database.py      # MongoDB connection
│   │   └── cors.py          # CORS configuration
│   ├── models/
│   │   ├── __init__.py
│   │   └── booking.py       # MongoDB document models
│   ├── routers/
│   │   ├── __init__.py
│   │   └── bookings.py      # CRUD API routes
│   └── schemas/
│       ├── __init__.py
│       └── booking.py       # Pydantic request/response schemas
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
uv run pytest tests/test_bookings.py
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

### Error Handling

- Comprehensive HTTP exception handling
- Input validation with Pydantic
- Database connection error management
- Proper HTTP status codes

## 🚦 Health Monitoring

- Health check endpoint: `/health`
- Docker health checks configured
- Logging with Python logging module

## 🔒 Security Considerations

- Input validation on all endpoints
- ObjectId validation for MongoDB
- CORS properly configured
- Environment-based secrets
- Non-root Docker user

---

**Happy Coding! 🎉**

# Take Your Time - E-commerce Platform

A modern full-stack e-commerce application built with FastAPI and Angular, featuring product management, user authentication, shopping cart, wishlist functionality, and a comprehensive admin dashboard.

## 🛍️ What is this app?

**Take Your Time** is a complete e-commerce platform that provides:

- **Product Catalog**: Browse and search products with categories, ratings, and inventory management
- **User Management**: Secure authentication with JWT tokens, user profiles, and admin roles
- **Shopping Experience**: Shopping cart, wishlist, and product recommendations
- **Admin Dashboard**: Complete management interface for products, users, orders, and analytics
- **Contact System**: Customer support with admin notes and message tracking

## 🏗️ Project Structure & Technologies

```
take-your-time/
├── backend/          # FastAPI REST API server
├── frontend/         # Angular 18 web application
├── scripts/          # Python management utilities
└── .github/          # CI/CD workflows and documentation
```

### Backend (API Server)
- **Framework**: FastAPI (Python 3.13)
- **Database**: MongoDB with PyMongo
- **Authentication**: JWT with blacklist functionality
- **Validation**: Pydantic v2 with comprehensive schemas
- **Testing**: pytest with mongomock
- **Package Manager**: UV (ultra-fast Python package manager)

**Key Features**:
- RESTful API with automatic OpenAPI documentation
- Role-based access control (User/Admin)
- Synchronous database operations with PyMongo
- Real-time data validation and error handling
- Comprehensive test coverage
- Database schema versioning system

### Frontend (Web Application)
- **Framework**: Angular 18 with standalone components
- **UI Library**: PrimeNG with custom theming
- **State Management**: Signals with Service-Store-Hooks pattern
- **Styling**: SCSS with responsive design
- **Build Tool**: Angular CLI with optimized production builds

**Key Features**:
- Modern reactive architecture with Angular Signals
- Responsive design for mobile and desktop
- Progressive Web App (PWA) capabilities
- Component-based architecture with TypeScript
- Advanced admin dashboard with data tables

### Scripts (Management Tools)
- **MongoDB operations**: Database initialization and data cleanup
- **Docker management**: Build, run, and monitor backend/frontend containers
- **Network creation**: Docker network setup for container communication
- **Development utilities**: Environment setup and automation scripts

## 🚀 How to Launch the Project

### Prerequisites

Make sure you have installed:
- **Python 3.13+**
- **Node.js 18+** and **npm**
- **MongoDB** (local installation or MongoDB Atlas)
- **UV** (Python package manager): `pip install uv`

### 1. Clone the Repository

```bash
git clone https://github.com/plantaeart/take-your-time.git
cd take-your-time
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies with UV
uv sync

# Create required environment files
# You need to create 3 environment files for different deployment scenarios:

# 1. Local development
cp .env.example .env.local

# 2. Docker development
cp .env.example .env.dev-docker

# 3. Testing environment
cp .env.example .env.test
```

**Environment Configuration Files**:

The backend requires **3 environment files** for different deployment scenarios:

**1. `.env.local` (Local Development)**:
```bash
# Local Development Environment
ENVIRONMENT=local
DEBUG=true

# MongoDB Configuration
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=TAKE_YOUR_TIME

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# JWT Configuration (CHANGE IN PRODUCTION!)
SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Configuration
FRONTEND_URLS=http://localhost:4200,http://127.0.0.1:4200

# Admin User Configuration
ADMIN_EMAIL=admin@admin.com
ADMIN_PASSWORD=AdminPass123!

# SMTP Configuration for Contact Form
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SHOP_EMAIL=contact@yourshop.com
```

**2. `.env.dev-docker` (Docker Development)**:
```bash
# Development Docker Environment
ENVIRONMENT=dev-docker
DEBUG=true

# MongoDB Configuration (Docker host access)
MONGODB_URL=mongodb://host.docker.internal:27017
DATABASE_NAME=TAKE_YOUR_TIME

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000

# JWT Configuration
SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Configuration (Docker and local)
FRONTEND_URLS=http://localhost:4200,http://angular-frontend:3000,http://host.docker.internal:3000

# Admin User Configuration
ADMIN_EMAIL=admin@admin.com
ADMIN_PASSWORD=AdminPass123!

# SMTP Configuration
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SHOP_EMAIL=contact@yourshop.com
```

**3. `.env.test` (Testing Environment)**:
```bash
# Test Environment
ENVIRONMENT=test
DEBUG=true

# MongoDB Configuration (used with mongomock for testing)
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=TAKE_YOUR_TIME_TEST

# JWT Configuration
SECRET_KEY=test_secret_key_for_testing_only_not_for_production_use
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# CORS Configuration
FRONTEND_URLS=http://localhost:4200,http://127.0.0.1:4200

# Admin User Configuration
ADMIN_EMAIL=admin@admin.com
ADMIN_PASSWORD=AdminPass123!

# SMTP Configuration (testing)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=test@example.com
SMTP_PASSWORD=test-password
SHOP_EMAIL=test@yourshop.com
```

```bash
# Start the backend server
uv run python main.py
```

The API will be available at `http://localhost:8000`
- API Documentation: `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

### 3. Frontend Setup

```bash
# Navigate to frontend directory (from project root)
cd frontend

# Install dependencies
npm install

# Start development server
ng serve
```

The web application will be available at `http://localhost:4200`

### 4. Database Setup

The application will automatically:
- Create necessary MongoDB collections
- Set up database indexes for performance
- Create a default admin user (email: `admin@admin.com`, password: `AdminPass123!`)
- Run any pending schema migrations

### 5. Development Commands

**Backend**:
```bash
# Run tests
uv run pytest tests/ -v
# or (with less ui infos)
uv run pytest tests/ --tb=no

# Run with auto-reload for development
uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Generate new dependency lock file
uv lock

# Add new dependencies
uv add package-name
```

**Frontend**:
```bash
# Development server with live reload
ng serve

# Build for production
ng build

# Lint code
ng lint

# Generate new component
ng generate component component-name

# Generate new service
ng generate service service-name
```

**Scripts** (Database & Docker Management):
```bash
# Navigate to scripts directory
cd scripts

# Install script dependencies
uv sync

# MongoDB operations
uv run python main.py mongodb start              # Start MongoDB container
uv run python main.py mongodb status             # Check MongoDB status
uv run python main.py mongodb stop               # Stop MongoDB container
uv run python main.py mongodb remove --force     # Remove container and data

# FastAPI operations
uv run python main.py fastapi build --tag latest # Build backend Docker image
uv run python main.py fastapi run --tag latest   # Run backend container
uv run python main.py fastapi list               # List FastAPI containers/images
uv run python main.py fastapi logs               # View container logs

# Angular operations
uv run python main.py angular build              # Build frontend Docker image
uv run python main.py angular run --port 4200    # Run frontend container
uv run python main.py angular list               # List Angular containers/images
uv run python main.py angular status             # Check container status
```

## 🔧 Production Deployment

1. **Update environment variables** for production
2. **Set secure JWT secret key**
3. **Configure MongoDB Atlas** or production MongoDB instance
4. **Build frontend**: `ng build --configuration=production`
5. **Use production WSGI server** like Gunicorn for FastAPI
6. **Set up reverse proxy** (Nginx) for serving static files

## 📚 API Documentation

Once the backend is running, visit `http://localhost:8000/docs` for interactive API documentation powered by FastAPI's automatic OpenAPI generation.

## 🧪 Testing

- **Backend**: Comprehensive test suite with pytest and mongomock
- **Frontend**: No tests currently implemented

## 📄 License

This project is licensed under the MIT License.

---
applyTo: '**'
---

# Backend Information & Guidelines

## 🏗️ Architecture Overview

**Product Management API** with FastAPI + MongoDB. Fully refactored with camelCase fields and comprehensive type annotations.

### Tech Stack
- **Framework**: FastAPI (Python 3.13)
- **Database**: MongoDB with Motor (async driver)  
- **Validation**: Pydantic v2
- **Package Manager**: UV
- **Authentication**: JWT with blacklist functionality
- **User Management**: Admin role system

## 🗂️ Project Structure

```
backend/
├── main.py                 # FastAPI application entry point
├── pyproject.toml         # Dependencies and project config
└── app/
    ├── startup.py          # Database initialization
    ├── version.py          # Centralized version management
    ├── auth/               # JWT authentication system
    │   ├── blacklist.py    # Token blacklist management
    │   ├── dependencies.py # Auth dependencies
    │   ├── jwt.py          # JWT token handling
    │   └── password.py     # Password hashing
    ├── config/
    │   ├── settings.py     # Environment configuration
    │   ├── database.py     # MongoDB connection
    │   └── cors.py         # CORS for Angular
    ├── models/             # MongoDB document models
    │   ├── product.py      # Product model + indexes
    │   ├── user.py         # User model + admin creation
    │   ├── cart.py         # Shopping cart model
    │   ├── wishlist.py     # User wishlist model
    │   └── enums/          # Category, Status, Messages enums
    ├── schemas/            # Pydantic request/response schemas
    │   ├── product.py      # Product CRUD schemas
    │   ├── auth.py         # JWT token schemas (OAuth2 standard)
    │   ├── user.py         # User management schemas
    │   ├── cart.py         # Cart operation schemas
    │   └── wishlist.py     # Wishlist schemas
    └── routers/            # API endpoints
        ├── products.py     # Product CRUD + bulk import
        ├── auth.py         # Login/register endpoints
        ├── admin_users.py  # Admin user management
        ├── cart.py         # Shopping cart operations
        └── wishlist.py     # Wishlist operations
```
```

## 🎯 Core Models (All CamelCase + Type Annotated)

### ProductModel
- `id: int` - Auto-incrementing ID
- `code: str` - Auto-generated unique code (f230fh0g3)
- `name: str` - **UNIQUE** product name
- `description: str`
- `image: Optional[str]` - Image URL (optional/null)
- `category: Category` - ELECTRONICS|CLOTHING|FITNESS|ACCESSORIES
- `price: float` - >= 0
- `quantity: int` - >= 0  
- `internalReference: str` - Auto-generated (REF-123-456)
- `shellId: int`
- `inventoryStatus: InventoryStatus` - INSTOCK|LOWSTOCK|OUTOFSTOCK
- `rating: Optional[float]` - 0-5 scale
- `createdAt/updatedAt: datetime`

### UserModel
- `id: int` - Auto-incrementing ID
- `username/email: str` - **UNIQUE** fields
- `hashedPassword: str`
- `isActive/isAdmin: bool`
- `createdAt/updatedAt: datetime`

### CartModel & WishlistModel
- `userId: int` - Owner reference
- `items: List[CartItem/WishlistItem]` - Product references
- `createdAt/updatedAt: datetime`

## Security & Admin Management

### Admin User Creation
- **Admin users CANNOT be created via API endpoints**
- Admin users are created only via the `create_admin_user()` function in `user.py`
- Default admin user: `admin@admin.com` / `AdminPass!@` (created on startup)
- For testing: Use database promotion to set `isAdmin=true` manually

### Authentication Security
- JWT tokens with blacklist functionality
- OAuth2 compliance with form-data and JSON login endpoints
- Admin privileges checked via `isAdmin` flag, not email-based legacy checks

## Configuration

**Required environment variables:**
- `MONGODB_URL`: MongoDB connection string
- `DATABASE_NAME`: Database name
- `FRONTEND_URLS`: Comma-separated Angular app URLs

**Local (.env.local):**
```env
MONGODB_URL=mongodb://localhost:27017
DATABASE_NAME=TAKE_YOUR_TIME
FRONTEND_URLS=http://localhost:4200,http://127.0.0.1:4200
```

## 🗄️ Database Features

### Unique Indexes (Enforced)
- Product: `name`, `code`, `id`, `internalReference`
- User: `email`, `username`, `id`

### Auto-Generation
- Product codes: `f230fh0g3` format
- Internal references: `REF-123-456` format
- User/Product IDs: Auto-incrementing integers

### Default Admin User
- Email: `admin@admin.com`
- Password: `AdminPass!@`
- Created automatically on startup

## 🚀 Development Commands

```bash
# Install dependencies
uv sync

# Run application
uv run python main.py

# Clear database (via scripts)
cd ../scripts && uv run python -m mongodb.manage clear-database
```

## 📝 Key Rules

### Naming Conventions
- **Models/Schemas**: camelCase fields (`userId`, `createdAt`, `isActive`)
- **OAuth2 Standard**: snake_case (`access_token`, `token_type`)
- **Functions**: snake_case (`get_current_user`)
- **Variables**: camelCase (`usersCollection`, `productData`)

### Type Annotations (Required)
```python
# MongoDB Collections
collection: Collection = db_manager.get_collection("users")

# Query Results
user: Optional[Dict[str, Any]] = await collection.find_one({"id": userId})

# Model Instances
product: ProductModel = ProductModel(**productData)
```

### Validation
- Product names are **UNIQUE** (enforced by database index)
- Codes and internal references auto-generated and unique
- Price/quantity must be >= 0
- Rating must be 0-5 or null
- Image field is optional/null

## 🎯 Current Status

✅ **Complete camelCase refactoring** (5 routers, auth system)  
✅ **Comprehensive type annotations** (204+ annotations)  
✅ **JWT authentication** with blacklist functionality  
✅ **Bulk product creation** endpoint for admin  
✅ **Database indexes** for performance and uniqueness  
✅ **Admin user management** system  
✅ **Cart and wishlist** operations  
✅ **MongoDB management** scripts
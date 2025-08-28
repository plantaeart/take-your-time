---
applyTo: '**'
---

# Refactoring Guidelines & Best Practices

## 🚨 Core Refactoring Principle

**CRITICAL INSTRUCTION**: When refactoring, focus on execution, not explanation. Apply changes systematically without lengthy conclusions. Let the code improvements speak for themselves.

## 🏗️ Naming Convention Standards

### **1. CamelCase Conversion**
```python
# Field Names (Database & Models)
created_at → createdAt
updated_at → updatedAt
user_id → userId
product_id → productId
is_active → isActive
is_admin → isAdmin
hashed_password → hashedPassword

# Function Parameters
admin_user → adminUser
item_data → itemData
user_data → userData

# Variable Names
users_collection → usersCollection
cart_doc → cartDoc
wishlist_doc → wishlistDoc
populated_items → populatedItems
existing_item_index → existingItemIndex
original_length → originalLength

# URL Path Parameters
{user_id} → {userId}
{product_id} → {productId}

# KEEP SNAKE_CASE FOR:
# - Function names (async def get_user_cart)
# - format_message parameter names (product_name=, requested_quantity=)
# - Python built-in conventions
```

### **2. Type Annotation Requirements**
```python
# MongoDB Collections
collection: Collection = db_manager.get_collection("users")
usersCollection: Collection = db_manager.get_collection("users")

# Database Query Results
user: Optional[Dict[str, Any]] = await collection.find_one({"id": userId})
product: Optional[Dict[str, Any]] = await productsCollection.find_one({"id": productId})

# Model Instances
cart: CartModel = CartModel(**cartDoc)
wishlist: WishlistModel = WishlistModel(**wishlistDoc)
newItem: CartItem = CartItem(productId=itemData.productId, ...)

# Response Objects
cartItemResponse: CartItemResponse = CartItemResponse(...)
populatedItems: List[CartItemResponse] = []

# Control Flow Variables
existingItemIndex: Optional[int] = None
originalLength: int = len(cart.items)
itemFound: bool = False

# Query Objects
query: Dict[str, Any] = {"id": {"$ne": adminUser.id}}
updateData: Dict[str, Any] = {}
cursor: Cursor = collection.find(query).skip(skip).limit(limit)
```

## 📋 Systematic Refactoring Process

### **Phase 1: Core Models & Schemas**
1. Update Pydantic model field names to camelCase
2. Update schema field names to match models
3. Verify model serialization works correctly

### **Phase 2: Router Functions**
1. Convert function parameter names to camelCase
2. Update URL path parameters in route decorators
3. Convert internal variable names to camelCase
4. Update database field references in queries

### **Phase 3: Type Annotations**
1. Add imports: `Collection`, `Cursor`, `Dict`, `Any`, `Optional`, `List`
2. Type all MongoDB collection variables
3. Type all database query results with `Optional[Dict[str, Any]]`
4. Type all model instances with specific model classes
5. Type all response objects and lists
6. Type control flow variables (indexes, booleans, counters)

### **Phase 4: Database Operations**
1. Update all database queries to use camelCase field names
2. Update model instantiation to use camelCase
3. Update response construction with camelCase fields
4. Verify all CRUD operations maintain functionality

## 🛠️ Required Imports for Type Annotations

```python
from datetime import datetime
from typing import Annotated, List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status, Path, Query
from pymongo.collection import Collection
from pymongo.cursor import Cursor
```

## 🎯 Type Annotation Patterns

### **MongoDB Operations**
```python
# Collection References
collection: Collection = db_manager.get_collection("collection_name")

# Query Results (Always Optional)
document: Optional[Dict[str, Any]] = await collection.find_one({"field": value})

# Cursor Operations
cursor: Cursor = collection.find(query).skip(skip).limit(limit)
documents: List[Dict[str, Any]] = await cursor.to_list(length=limit)
```

### **Model Operations**
```python
# Model Instantiation
model: ModelClass = ModelClass(**document_data)

# Model Lists for Responses
items: List[ResponseClass] = []

# New Model Creation
newItem: ItemClass = ItemClass(field=value, createdAt=datetime.now())
```

### **Control Flow Variables**
```python
# Indexes and Counters
index: Optional[int] = None
count: int = len(items)
found: bool = False

# Update Data
updateData: Dict[str, Any] = {}
query: Dict[str, Any] = {"field": value}
```

## 📝 Database Field Mapping

### **User Model Fields**
```python
# Database → camelCase
"hashed_password" → "hashedPassword"
"is_active" → "isActive"
"is_admin" → "isAdmin"
"created_at" → "createdAt"
"updated_at" → "updatedAt"
```

### **Cart/Wishlist Fields**
```python
# Database → camelCase
"user_id" → "userId"
"product_id" → "productId"
"added_at" → "addedAt"
"updated_at" → "updatedAt"
"total_items" → "totalItems"
```

## 🔧 FastAPI Specific Guidelines

### **Path Parameters**
```python
# URL Paths
@router.get("/users/{userId}")  # NOT {user_id}
@router.delete("/items/{productId}")  # NOT {product_id}

# Function Parameters
async def function_name(
    userId: int = Path(..., description="User ID"),
    productId: int = Path(..., description="Product ID"),
    adminUser: Annotated[UserModel, Depends(admin_required)]
):
```

### **Request/Response Models**
```python
# Request Bodies
itemData: CartItemCreate  # NOT item_data
userData: UserUpdate      # NOT user_data

# Response Construction
return ResponseClass(
    userId=user.userId,          # camelCase field names
    createdAt=user.createdAt,
    isActive=user.isActive
)
```

## ⚡ Performance & Best Practices

### **Database Operations**
- Always type MongoDB collections and query results
- Use `Optional[Dict[str, Any]]` for nullable database documents
- Type cursors and result lists appropriately

### **Model Validation**
- Ensure camelCase field names in Pydantic models
- Verify model serialization with `model_dump()`
- Type model instances with specific classes

### **Error Handling**
- Maintain existing HTTPException patterns
- Use camelCase in error response data
- Keep error messages consistent

## 🚀 IDE Enhancement Benefits

### **Type Annotations Provide**
- Full IntelliSense and autocomplete
- Static type checking with mypy
- Better refactoring safety
- Self-documenting code
- Early error detection
- Improved team collaboration

### **CamelCase Naming Provides**
- Consistent API contracts
- Frontend integration compatibility
- Modern JavaScript/TypeScript alignment
- Professional API design standards

## 📚 Testing Guidelines

### **Verification Steps**
1. Run imports test: `from app.routers.module import router`
2. Test model creation with camelCase fields
3. Verify API endpoints respond correctly
4. Check database operations work with new field names
5. Confirm type annotations don't cause runtime errors

### **Test Script Pattern**
```python
# Always test after refactoring
try:
    from app.routers.module import router
    # Test model creation
    # Test type annotations
    # Verify functionality
    print("✅ Refactoring successful")
except Exception as e:
    print(f"❌ Error: {e}")
```

## 🎯 Refactoring Execution Rules

### **DO:**
- Apply changes systematically and completely
- Test functionality after major changes
- Use consistent naming patterns throughout
- Add comprehensive type annotations
- Focus on code quality improvements

### **DON'T:**
- Write lengthy explanations during refactoring
- Make partial conversions (complete each phase fully)
- Skip type annotations for any variables
- Mix snake_case and camelCase in the same file
- Over-explain the refactoring process

### **REMEMBER:**
- **Execute, don't elaborate** - Let improved code speak for itself
- **Be systematic** - Complete each refactoring phase thoroughly
- **Test frequently** - Verify functionality at each major step
- **Stay consistent** - Apply patterns uniformly across the codebase
- **Focus on quality** - Prioritize clean, maintainable, type-safe code

---

## 🎉 Final Note

These guidelines ensure consistent, high-quality refactoring that produces maintainable, type-safe, and professionally structured FastAPI applications. Apply systematically without extensive commentary - the code improvements will demonstrate the value.

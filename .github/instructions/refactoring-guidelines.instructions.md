---
applyTo: '**'
---

# Refactoring Guidelines & Best Practices

## 🚨 Core Principle

**Focus on execution, not explanation.** Apply changes systematically. Let code improvements speak for themselves.

## 🏗️ Naming Conventions

### **CamelCase Fields**
```python
# Database & Models
created_at → createdAt
user_id → userId
is_active → isActive
hashed_password → hashedPassword

# Variables
users_collection → usersCollection
item_data → itemData
existing_item → existingItem

# URL Parameters
{user_id} → {userId}
{product_id} → {productId}
```

### **Keep Snake_Case**
- Function names: `async def get_user_cart`
- Built-in conventions
- OAuth2 fields: `access_token`, `token_type`

## 🎯 Type Annotations (Required)

```python
# MongoDB Collections
collection: Collection = db_manager.get_collection("users")

# Database Results
user: Optional[Dict[str, Any]] = await collection.find_one({"id": userId})

# Model Instances
product: ProductModel = ProductModel(**productData)

# Lists and Responses
items: List[ResponseClass] = []

# Control Flow
index: Optional[int] = None
found: bool = False
```

## 📋 Required Imports

```python
from typing import Dict, Any, Optional, List
from pymongo.collection import Collection
from pymongo.cursor import Cursor
```

## 🔧 API Patterns

### **Path Parameters**
```python
@router.get("/users/{userId}")  # NOT {user_id}
async def function_name(
    userId: int = Path(...),
    adminUser: Annotated[UserModel, Depends(admin_required)]
):
```

### **Response Construction**
```python
return ResponseClass(
    userId=user.userId,          # camelCase
    createdAt=user.createdAt,
    isActive=user.isActive
)
```

## ⚡ Database Operations

```python
# Collection References
collection: Collection = db_manager.get_collection("collection_name")

# Query Results (Always Optional)
document: Optional[Dict[str, Any]] = await collection.find_one({"field": value})

# Model Creation
model: ModelClass = ModelClass(**document_data)
```

## 🎯 Execution Rules

### **DO:**
- Apply changes systematically
- Test functionality after changes
- Use consistent patterns
- Add comprehensive type annotations

### **DON'T:**
- Write lengthy explanations
- Make partial conversions
- Skip type annotations
- Mix naming conventions

### **Special Cases:**
- **OAuth2 fields**: Must use `access_token`, `token_type` (standard compliance)
- **Custom schemas**: Use camelCase consistently
- **Error messages**: Use camelCase in response data

---

**Remember:** Execute systematically, test frequently, maintain consistency.

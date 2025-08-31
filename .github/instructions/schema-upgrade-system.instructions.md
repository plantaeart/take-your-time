---
applyTo: 'backend/**'
---

# Schema Upgrade System Guidelines & Best Practices

## 🚀 Core Principles

**Structured schema evolution** with automated upgrade management for MongoDB collections. The system ensures data consistency during application evolution through systematic version-to-version upgrades.

### Tech Stack
- **Framework**: FastAPI + MongoDB with Motor async driver
- **Upgrade Pattern**: Step-by-step version progression (v1→v2→v3)
- **Execution**: Automatic during application startup
- **Validation**: Comprehensive testing with API-based test coverage

---

## 🏗️ System Architecture

### **Directory Structure**
```
backend/app/schema_version_upgrade/
├── upgrade_system.py          # Main upgrade orchestrator
├── v2/                        # Version 2 upgrade modules
│   ├── __init__.py
│   ├── products_upgrade.py    # Products v1→v2 upgrade
│   ├── contacts_upgrade.py    # Contacts v1→v2 upgrade
│   ├── users_upgrade.py       # Users v1→v2 upgrade (if needed)
│   ├── carts_upgrade.py       # Carts v1→v2 upgrade (if needed)
│   └── wishlists_upgrade.py   # Wishlists v1→v2 upgrade (if needed)
├── v3/                        # Version 3 upgrade modules (future)
│   ├── __init__.py
│   ├── products_upgrade.py    # Products v2→v3 upgrade
│   └── contacts_upgrade.py    # Contacts v2→v3 upgrade
└── v4/                        # Version 4 upgrade modules (future)
```

### **Core Components**

#### **1. SchemaVersions Configuration**
```python
# app/config/schema_versions.py
class SchemaVersions:
    """Centralized schema version management."""
    PRODUCTS = 2
    CONTACTS = 2
    USERS = 1
    CARTS = 1
    WISHLISTS = 1
    TOKEN_BLACKLIST = 1
    
    @classmethod
    def get_schema_version(cls, collection_name: str) -> int:
        """Get current schema version for a collection."""
        return getattr(cls, collection_name.upper(), 1)
```

#### **2. Upgrade System Orchestrator**
```python
# app/schema_version_upgrade/upgrade_system.py
class SchemaUpgradeSystem:
    """Manages step-by-step schema upgrades for all collections."""
    
    async def run_all_upgrades(self) -> Dict[str, Any]:
        """Run all necessary upgrades for all collections."""
        
    async def _upgrade_collection(self, collection_name: str, target_version: int):
        """Upgrade a specific collection step by step to target version."""
        
    async def _run_version_upgrade(self, collection_name: str, target_version: int):
        """Run a specific version upgrade for a collection."""
```

#### **3. Version-Specific Upgrade Modules**
```python
# app/schema_version_upgrade/v2/products_upgrade.py
async def upgrade() -> Dict[str, Any]:
    """Upgrade products collection from version 1 to version 2."""
    
    # Find documents that need upgrading
    documents_to_upgrade = await collection.find({
        "$or": [
            {"schemaVersion": 1},
            {"schemaVersion": {"$exists": False}}
        ]
    }).to_list(length=None)
    
    # Process each document
    for doc in documents_to_upgrade:
        update_fields = {
            "schemaVersion": 2,
            "updatedAt": datetime.now()
        }
        
        # Add version-specific field updates
        # ...
        
        await collection.update_one(
            {"_id": doc["_id"]},
            {"$set": update_fields}
        )
```

---

## 📋 Naming Conventions (CRITICAL)

### **File Naming Pattern**
```
app/schema_version_upgrade/v{VERSION}/{COLLECTION_NAME}_upgrade.py
```

### **Examples**
- `v2/products_upgrade.py` - Products collection v1→v2
- `v2/contacts_upgrade.py` - Contacts collection v1→v2  
- `v3/products_upgrade.py` - Products collection v2→v3
- `v3/users_upgrade.py` - Users collection v2→v3

### **🚨 CRITICAL RULE: Use Plural Collection Names**
```
✅ CORRECT:
- products_upgrade.py (collection: "products")
- contacts_upgrade.py (collection: "contacts")
- users_upgrade.py (collection: "users")

❌ WRONG:
- product_upgrade.py (won't be found by upgrade system)
- contact_upgrade.py (won't be found by upgrade system)
- user_upgrade.py (won't be found by upgrade system)
```

**Why this matters**: The upgrade system uses dynamic import:
```python
module_path = f"app.schema_version_upgrade.v{target_version}.{collection_name}_upgrade"
# collection_name is "products", so it looks for "products_upgrade.py"
```

---

## 🔧 Creating New Upgrades

### **Step 1: Update Schema Version**
```python
# app/config/schema_versions.py
class SchemaVersions:
    PRODUCTS = 3  # Increment version
    CONTACTS = 2
    # ... other collections
```

### **Step 2: Create Upgrade Module**
```python
# app/schema_version_upgrade/v3/products_upgrade.py
"""
Schema upgrade for products from version 2 to version 3.

Upgrade Details:
- Add new field: tags (List[str])
- Migrate old category system to new tag-based system
- Add product variations support
"""

from datetime import datetime
from typing import Dict, Any, List
from pymongo.collection import Collection
from app.config.database import db_manager

async def upgrade() -> Dict[str, Any]:
    """Upgrade products collection from version 2 to version 3."""
    collection: Collection = db_manager.get_collection("products")
    target_version = 3
    
    upgrade_results = {
        "collection": "products",
        "from_version": 2,
        "to_version": target_version,
        "documents_processed": 0,
        "documents_upgraded": 0,
        "errors": [],
        "started_at": datetime.now()
    }
    
    try:
        # Find documents with version 2
        documents_to_upgrade = await collection.find({
            "schemaVersion": 2
        }).to_list(length=None)
        
        upgrade_results["documents_processed"] = len(documents_to_upgrade)
        
        for doc in documents_to_upgrade:
            try:
                update_fields: Dict[str, Any] = {
                    "schemaVersion": target_version,
                    "updatedAt": datetime.now()
                }
                
                # Version-specific upgrade logic
                if "category" in doc:
                    # Convert category to tags
                    category_tag = doc["category"].lower()
                    update_fields["tags"] = [category_tag, "general"]
                
                # Add new fields with defaults
                if "variations" not in doc:
                    update_fields["variations"] = []
                
                # Update the document
                await collection.update_one(
                    {"_id": doc["_id"]},
                    {"$set": update_fields}
                )
                
                upgrade_results["documents_upgraded"] += 1
                
            except Exception as e:
                error_msg = f"Failed to upgrade product {doc.get('id', 'unknown')}: {str(e)}"
                upgrade_results["errors"].append(error_msg)
    
    except Exception as e:
        upgrade_results["errors"].append(f"Upgrade process failed: {str(e)}")
    
    upgrade_results["completed_at"] = datetime.now()
    return upgrade_results
```

### **Step 3: Update Schema Models**
```python
# app/models/product.py
class ProductModel(BaseModel):
    # Existing fields...
    tags: List[str] = Field(default_factory=list)  # New field
    variations: List[Dict[str, Any]] = Field(default_factory=list)  # New field
    schemaVersion: int = Field(default=3)  # Updated version
```

### **Step 4: Update Creation Endpoints**
```python
# app/routers/products.py
from app.config.schema_versions import get_schema_version

@router.post("/", response_model=ProductResponse)
async def create_product(productData: ProductCreate):
    # Get current schema version
    current_version = get_schema_version("products")
    
    # Create product with current version
    new_product = ProductModel(
        **productData.model_dump(),
        schemaVersion=current_version  # Use centralized version
    )
```

---

## 🧪 Testing Upgrade System

### **Test Structure**
```
tests/schema_upgrade/
├── test_product_upgrade_v2_to_v3.py  # Test v2→v3 upgrade
├── test_contact_upgrade_v1_to_v2.py  # Test v1→v2 upgrade
└── test_upgrade_system.py            # Test upgrade orchestrator
```

### **API-Based Test Pattern**
```python
# tests/schema_upgrade/test_product_upgrade_v2_to_v3.py
class TestProductUpgradeV2ToV3:
    """Test product schema upgrade from version 2 to version 3."""
    
    def test_create_product_with_current_schema_version(self, client: TestClient, admin_token: str) -> None:
        """Test that new products are created with current schema version 3."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        productData: Dict[str, Any] = {
            "name": "Test Product Current Schema",
            "category": Category.ELECTRONICS.value,
            "price": 99.99,
            "quantity": 10
        }
        
        response = client.post("/api/products", json=productData, headers=headers)
        assert response.status_code == HTTPStatus.CREATED.value
        
        responseData: Dict[str, Any] = response.json()
        assert responseData["schemaVersion"] == 3  # Current version
        assert "tags" in responseData  # New field in v3
        assert "variations" in responseData  # New field in v3
```

---

## 🚦 Execution Flow

### **Startup Sequence**
1. **Application starts** (`main.py`)
2. **Database initialization** (`startup.py`)
3. **Schema upgrades run** (`upgrade_system.py`)
4. **Collections checked** for version mismatches
5. **Step-by-step upgrades** executed (v1→v2→v3)
6. **Indexes created** for collections
7. **Default admin user** created
8. **Application ready** for requests

### **Upgrade Process**
```
For each collection:
  1. Find minimum schema version in collection
  2. For each version from min_version to target_version:
     a. Check if upgrade module exists (v{version}/{collection}_upgrade.py)
     b. Import upgrade module dynamically
     c. Execute upgrade() function
     d. Log results and handle errors
  3. Continue to next collection
```

### **Example Startup Log**
```
🚀 Starting database initialization...
📊 Running schema upgrades...
✅ Schema upgrades completed:
   • products: 1,247 documents upgraded from v1 to v2
   • contacts: 89 documents upgraded from v1 to v2
✅ No upgrades needed - all schemas up to date
```

---

## 🛡️ Error Handling & Safety

### **Upgrade Safety Features**
- **Document-level error handling** - Individual document failures don't stop the process
- **Comprehensive logging** - All errors and successes tracked
- **Atomic updates** - Each document update is atomic
- **Version validation** - Prevents downgrade and duplicate upgrades
- **Graceful failures** - Missing upgrade modules are handled gracefully

### **Error Recovery**
```python
# Upgrade results include error tracking
upgrade_results = {
    "upgrades_run": ["products: 1,200 documents upgraded from v1 to v2"],
    "errors": ["Failed to upgrade product 12345: Invalid category"],
    "total_documents_upgraded": 1,199,
    "collections_upgraded": ["products"]
}
```

### **Manual Recovery**
```python
# If needed, you can run specific collection upgrades
from app.schema_version_upgrade.upgrade_system import upgrade_system
results = await upgrade_system._upgrade_collection("products", 2)
```

---

## 📝 Best Practices

### **1. Upgrade Module Design**
- **Single responsibility** - One version increment per module
- **Comprehensive logging** - Track all changes and errors
- **Field validation** - Ensure data integrity during migration
- **Default values** - Provide sensible defaults for new fields
- **Type safety** - Validate field types during upgrade

### **2. Schema Version Management**
- **Centralized versions** - Use `SchemaVersions` class only
- **Increment systematically** - Only increment by 1 per release
- **Document changes** - Clear upgrade notes in module docstrings
- **Test thoroughly** - API-based tests for all upgrade scenarios

### **3. Backward Compatibility**
- **Additive changes** - Prefer adding fields over removing
- **Optional fields** - New fields should have defaults
- **Migration paths** - Clear path from old to new structure
- **Validation updates** - Update Pydantic models to match

### **4. Production Deployment**
- **Database backup** - Always backup before schema changes
- **Staged rollout** - Test upgrades in staging environment
- **Monitor performance** - Large collections may need optimization
- **Rollback plan** - Have downgrade strategy if needed

---

## 🔄 Common Upgrade Patterns

### **Adding New Fields**
```python
# Add with default values
if "newField" not in doc:
    update_fields["newField"] = "default_value"

# Convert existing data
if "oldField" in doc:
    update_fields["newField"] = transform_old_data(doc["oldField"])
```

### **Changing Field Types**
```python
# String to number conversion
if "price" in doc and not isinstance(doc["price"], (int, float)):
    try:
        update_fields["price"] = float(doc["price"])
    except (ValueError, TypeError):
        update_fields["price"] = 0.0
```

### **Restructuring Data**
```python
# Nested object creation
if "address" in doc and isinstance(doc["address"], str):
    update_fields["address"] = {
        "street": doc["address"],
        "city": "",
        "country": "Unknown"
    }
```

### **Enum Migrations**
```python
# Old enum to new enum
old_to_new_status = {
    "ACTIVE": "AVAILABLE",
    "INACTIVE": "DISCONTINUED",
    "PENDING": "COMING_SOON"
}

if "status" in doc and doc["status"] in old_to_new_status:
    update_fields["status"] = old_to_new_status[doc["status"]]
```

---

## 🎯 Development Checklist

### **Before Creating New Upgrade**
- [ ] Increment schema version in `SchemaVersions` class
- [ ] Create version directory if needed (`v3/`, `v4/`, etc.)
- [ ] Plan upgrade logic and data transformations
- [ ] Identify backward compatibility requirements
- [ ] Plan rollback strategy if needed

### **During Upgrade Development**
- [ ] Use correct file naming: `{collection_name}_upgrade.py`
- [ ] Include comprehensive error handling
- [ ] Add detailed docstring with upgrade description
- [ ] Validate data types and provide defaults
- [ ] Track upgrade statistics and errors

### **After Upgrade Creation**
- [ ] Update Pydantic models with new fields
- [ ] Update creation endpoints to use new schema version
- [ ] Create comprehensive API-based tests
- [ ] Test upgrade with realistic data volumes
- [ ] Document breaking changes and migration notes

### **Before Production Deployment**
- [ ] Backup production database
- [ ] Test upgrade in staging environment
- [ ] Verify application works with upgraded data
- [ ] Monitor upgrade performance metrics
- [ ] Prepare rollback procedures

---

## ⚠️ Common Pitfalls

### **❌ Wrong File Names**
```python
# WRONG - These won't be found by upgrade system
v2/product_upgrade.py    # Should be products_upgrade.py
v2/contact_upgrade.py    # Should be contacts_upgrade.py
v2/user_upgrade.py       # Should be users_upgrade.py
```

### **❌ Hardcoded Schema Versions**
```python
# WRONG - Don't hardcode versions in endpoints
new_product.schemaVersion = 2  # Use get_schema_version() instead

# CORRECT - Use centralized version management
from app.config.schema_versions import get_schema_version
new_product.schemaVersion = get_schema_version("products")
```

### **❌ Missing Error Handling**
```python
# WRONG - No error handling
for doc in documents:
    await collection.update_one({"_id": doc["_id"]}, {"$set": update_fields})

# CORRECT - Comprehensive error handling
for doc in documents:
    try:
        await collection.update_one({"_id": doc["_id"]}, {"$set": update_fields})
        upgrade_results["documents_upgraded"] += 1
    except Exception as e:
        upgrade_results["errors"].append(f"Failed to upgrade {doc.get('id')}: {str(e)}")
```

### **❌ Direct Database Testing**
```python
# WRONG - Don't test database directly
async def test_upgrade_direct_db():
    await upgrade_module.upgrade()  # Direct call

# CORRECT - Use API-based testing
def test_upgrade_via_api(self, client: TestClient):
    response = client.post("/api/products", json=data)  # Test via API
```

---

## 🚀 Future Considerations

### **Performance Optimization**
- **Batch processing** for large collections
- **Progress tracking** for long-running upgrades
- **Parallel processing** for independent collections
- **Memory management** for large document sets

### **Advanced Features**
- **Conditional upgrades** based on document content
- **Multi-step migrations** with intermediate validation
- **Dependency management** between collection upgrades
- **Rollback automation** with version downgrade support

---

**Remember**: The upgrade system is designed for systematic, safe evolution of your data schema. Always test thoroughly, plan for edge cases, and maintain clear documentation of changes.

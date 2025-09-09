---
applyTo: '**'
---

# Admin Dashboard Object Management - Adding New Objects

## 🎯 Overview

This guide provides step-by-step instructions for adding new object types to the admin dashboard management system. The current system manages Users, Products, Carts, Wishlists, and Contacts with full CRUD operations, hierarchical display, search, filtering, and bulk operations.

### Current Architecture
- **Backend**: FastAPI + MongoDB with structured routers and schemas
- **Frontend**: Angular 18 + PrimeNG with unified dashboard configuration system
- **Pattern**: Service-Store-Hooks architecture for consistent data management

---

## 🏗️ Backend Implementation Steps

### **Step 1: Create Data Model**

Create the MongoDB document model in `backend/app/models/{object_name}.py`:

```python
# Example: backend/app/models/subscription.py
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field
from app.config.schema_versions import get_schema_version

class SubscriptionModel(BaseModel):
    """Subscription model for MongoDB document."""
    id: int = Field(..., description="Auto-incrementing subscription ID")
    userId: int = Field(..., description="User ID who owns the subscription")
    planName: str = Field(..., description="Subscription plan name")
    status: str = Field(..., description="Subscription status")
    startDate: datetime = Field(default_factory=datetime.now, description="Subscription start date")
    endDate: Optional[datetime] = Field(None, description="Subscription end date")
    price: float = Field(..., ge=0, description="Subscription price")
    isActive: bool = Field(default=True, description="Subscription active status")
    createdAt: datetime = Field(default_factory=datetime.now, description="Creation timestamp")
    updatedAt: datetime = Field(default_factory=datetime.now, description="Last update timestamp")
    schemaVersion: int = Field(default_factory=lambda: get_schema_version("subscriptions"), description="Schema version")

    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }
```

### **Step 2: Create Request/Response Schemas**

Create Pydantic schemas in `backend/app/schemas/{object_name}.py`:

```python
# Example: backend/app/schemas/subscription.py
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class SubscriptionCreate(BaseModel):
    """Schema for creating a new subscription."""
    userId: int = Field(..., description="User ID")
    planName: str = Field(..., min_length=1, description="Plan name")
    status: str = Field(..., description="Status")
    price: float = Field(..., ge=0, description="Price")
    endDate: Optional[datetime] = Field(None, description="End date")

class SubscriptionUpdate(BaseModel):
    """Schema for updating subscription."""
    planName: Optional[str] = Field(None, min_length=1)
    status: Optional[str] = Field(None)
    price: Optional[float] = Field(None, ge=0)
    endDate: Optional[datetime] = Field(None)
    isActive: Optional[bool] = Field(None)

class SubscriptionResponse(BaseModel):
    """Schema for subscription response."""
    id: int
    userId: int
    planName: str
    status: str
    startDate: datetime
    endDate: Optional[datetime]
    price: float
    isActive: bool
    createdAt: datetime
    updatedAt: datetime
    schemaVersion: int

class SubscriptionListResponse(BaseModel):
    """Paginated subscription list response."""
    items: List[SubscriptionResponse]
    total: int
    page: int
    limit: int
    totalPages: int
    hasNext: bool
    hasPrev: bool
```

### **Step 3: Create Admin Schema (if needed for hierarchical display)**

If the object belongs to users (like cart/wishlist), create admin schema in `backend/app/schemas/admin_user_{object_name}.py`:

```python
# Example: backend/app/schemas/admin_user_subscription.py
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

class AdminUserSubscriptionItem(BaseModel):
    """Individual subscription item in admin view."""
    id: int
    planName: str
    status: str
    price: float
    startDate: datetime
    endDate: Optional[datetime]
    isActive: bool

class AdminUserSubscriptionData(BaseModel):
    """Admin view of user with subscription data."""
    id: int
    username: str
    email: str
    firstname: Optional[str]
    isActive: bool
    subscriptions: List[AdminUserSubscriptionItem]
    subscriptionCount: int = Field(default=0, description="Total number of subscriptions")

class AdminUserSubscriptionListResponse(BaseModel):
    """Paginated admin user subscription search response."""
    items: List[AdminUserSubscriptionData]
    total: int
    page: int
    limit: int
    totalPages: int
    hasNext: bool
    hasPrev: bool
```

### **Step 4: Add Schema Version**

Update `backend/app/config/schema_versions.py`:

```python
class SchemaVersions:
    # ... existing versions
    SUBSCRIPTIONS = 1  # Add new object version
    
    @classmethod
    def get_schema_version(cls, collection_name: str) -> int:
        """Get current schema version for a collection."""
        return getattr(cls, collection_name.upper(), 1)
```

### **Step 5: Create Router with CRUD Operations**

Create router in `backend/app/routers/{object_name}.py`:

```python
# Example: backend/app/routers/subscriptions.py
from typing import List, Dict, Any, Optional, Annotated
from fastapi import APIRouter, HTTPException, Depends, status, Query, Path
from pymongo.collection import Collection
from app.config.database import db_manager
from app.models.subscription import SubscriptionModel
from app.schemas.subscription import (
    SubscriptionCreate, SubscriptionUpdate, SubscriptionResponse, SubscriptionListResponse
)
from app.auth.dependencies import admin_required
from app.models.user import UserModel
from app.models.enums.success_messages import SuccessMessages
from app.models.enums.error_messages import SubscriptionErrorMessages
from app.utils.response import get_success_response

router = APIRouter(prefix="/api/admin/subscriptions", tags=["Admin Subscriptions"])

@router.get("/", response_model=SubscriptionListResponse)
async def get_all_subscriptions(
    currentAdmin: Annotated[UserModel, Depends(admin_required)],
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page")
):
    """Get all subscriptions with pagination."""
    collection: Collection = db_manager.get_collection("subscriptions")
    
    skip = (page - 1) * limit
    total = await collection.count_documents({})
    
    cursor = collection.find({}).skip(skip).limit(limit).sort("createdAt", -1)
    subscriptions = await cursor.to_list(length=None)
    
    subscription_responses = [SubscriptionResponse(**sub) for sub in subscriptions]
    
    total_pages = (total + limit - 1) // limit
    
    return SubscriptionListResponse(
        items=subscription_responses,
        total=total,
        page=page,
        limit=limit,
        totalPages=total_pages,
        hasNext=page < total_pages,
        hasPrev=page > 1
    )

@router.get("/{subscriptionId}", response_model=SubscriptionResponse)
async def get_subscription(
    subscriptionId: int = Path(..., description="Subscription ID"),
    currentAdmin: Annotated[UserModel, Depends(admin_required)] = None
):
    """Get specific subscription by ID."""
    collection: Collection = db_manager.get_collection("subscriptions")
    subscription: Optional[Dict[str, Any]] = await collection.find_one({"id": subscriptionId})
    
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=SubscriptionErrorMessages.SUBSCRIPTION_NOT_FOUND.value
        )
    
    return SubscriptionResponse(**subscription)

@router.post("/", response_model=SubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def create_subscription(
    subscriptionData: SubscriptionCreate,
    currentAdmin: Annotated[UserModel, Depends(admin_required)] = None
):
    """Create new subscription."""
    collection: Collection = db_manager.get_collection("subscriptions")
    
    # Generate auto-incrementing ID
    next_id = await get_next_subscription_id()
    
    new_subscription = SubscriptionModel(
        id=next_id,
        **subscriptionData.model_dump()
    )
    
    await collection.insert_one(new_subscription.model_dump())
    
    return SubscriptionResponse(**new_subscription.model_dump())

@router.put("/{subscriptionId}", response_model=SubscriptionResponse)
async def update_subscription(
    subscriptionId: int = Path(..., description="Subscription ID"),
    updateData: SubscriptionUpdate = None,
    currentAdmin: Annotated[UserModel, Depends(admin_required)] = None
):
    """Update existing subscription."""
    collection: Collection = db_manager.get_collection("subscriptions")
    
    subscription: Optional[Dict[str, Any]] = await collection.find_one({"id": subscriptionId})
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=SubscriptionErrorMessages.SUBSCRIPTION_NOT_FOUND.value
        )
    
    update_fields = {k: v for k, v in updateData.model_dump(exclude_unset=True).items() if v is not None}
    update_fields["updatedAt"] = datetime.now()
    
    await collection.update_one(
        {"id": subscriptionId},
        {"$set": update_fields}
    )
    
    updated_subscription = await collection.find_one({"id": subscriptionId})
    return SubscriptionResponse(**updated_subscription)

@router.delete("/{subscriptionId}")
async def delete_subscription(
    subscriptionId: int = Path(..., description="Subscription ID"),
    currentAdmin: Annotated[UserModel, Depends(admin_required)] = None
):
    """Delete subscription."""
    collection: Collection = db_manager.get_collection("subscriptions")
    
    subscription: Optional[Dict[str, Any]] = await collection.find_one({"id": subscriptionId})
    if not subscription:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=SubscriptionErrorMessages.SUBSCRIPTION_NOT_FOUND.value
        )
    
    await collection.delete_one({"id": subscriptionId})
    
    return get_success_response(SuccessMessages.SUBSCRIPTION_DELETED, subscriptionId=subscriptionId)

async def get_next_subscription_id() -> int:
    """Generate next auto-incrementing subscription ID."""
    collection: Collection = db_manager.get_collection("subscriptions")
    last_subscription = await collection.find_one(sort=[("id", -1)])
    return (last_subscription["id"] + 1) if last_subscription else 1
```

### **Step 6: Add Search Endpoint (if needed for admin dashboard)**

Add search functionality to `backend/app/routers/admin_object_sort_filter.py`:

```python
# Add to admin_object_sort_filter.py
@router.get("/admin/subscriptions/search", response_model=SubscriptionListResponse)
async def search_subscriptions_admin(
    currentAdmin: Annotated[UserModel, Depends(admin_required)],
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=100, description="Items per page"),
    filters: str = Query("", description="JSON string of filters object"),
    sorts: str = Query("", description="JSON string of sorts array")
):
    """
    Enhanced admin subscription search with filtering and sorting.
    
    Filters format: {"search": "premium", "userId": 123, "isActive": true}
    Sorts format: [{"field": "planName", "direction": "asc"}]
    """
    # Parse JSON filters and sorts
    parsed_filters = json.loads(filters) if filters else {}
    parsed_sorts = json.loads(sorts) if sorts else []
    
    # Define allowed fields for security
    allowed_fields = ["id", "userId", "planName", "status", "price", "isActive", "createdAt", "updatedAt"]
    
    try:
        result = await admin_search_objects(
            collection_name="subscriptions",
            page=page,
            limit=limit,
            filters=parsed_filters,
            sorts=parsed_sorts,
            allowed_fields=allowed_fields
        )
        
        return SubscriptionListResponse(**result)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )
```

### **Step 7: Register Router**

Add the router to `backend/main.py`:

```python
# Add to main.py imports
from app.routers import subscriptions

# Add to router registration
app.include_router(subscriptions.router)
```

### **Step 8: Add Error Messages (Optional)**

Add error messages to `backend/app/models/enums/error_messages.py`:

```python
# Add to error_messages.py
class SubscriptionErrorMessages(Enum):
    SUBSCRIPTION_NOT_FOUND = "Subscription not found"
    SUBSCRIPTION_CREATE_FAILED = "Failed to create subscription"
    SUBSCRIPTION_UPDATE_FAILED = "Failed to update subscription"
    SUBSCRIPTION_DELETE_FAILED = "Failed to delete subscription"
```

### **Step 9: Add Success Messages (Optional)**

Add success messages to `backend/app/models/enums/success_messages.py`:

```python
# Add to success_messages.py
class SuccessMessages(Enum):
    # ... existing messages
    SUBSCRIPTION_CREATED = "Subscription created successfully"
    SUBSCRIPTION_UPDATED = "Subscription updated successfully"
    SUBSCRIPTION_DELETED = "Subscription deleted successfully"
```

### **Step 10: Create Comprehensive Test Files**

Create test files following the project's testing patterns and best practices:

#### **Admin CRUD Tests**
Create `backend/tests/admin/test_admin_{object_name}.py`:

```python
# Example: backend/tests/admin/test_admin_subscriptions.py
import pytest
from typing import Dict, Any, List
from fastapi.testclient import TestClient
from app.models.enums.http_status import HTTPStatus
from app.models.enums.category import Category

class TestAdminSubscriptions:
    """Test admin subscription management functionality."""
    
    def test_create_subscription_unauthorized(self, client: TestClient) -> None:
        """Test that subscription creation requires authentication."""
        subscriptionData: Dict[str, Any] = {
            "userId": 1,
            "planName": "Premium Plan",
            "status": "active",
            "price": 99.99
        }
        
        response = client.post("/api/admin/subscriptions", json=subscriptionData)
        assert response.status_code == HTTPStatus.UNAUTHORIZED.value
    
    def test_create_subscription_forbidden(self, client: TestClient, user_token: str) -> None:
        """Test that regular users cannot create subscriptions."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        subscriptionData: Dict[str, Any] = {
            "userId": 1,
            "planName": "Premium Plan",
            "status": "active",
            "price": 99.99
        }
        
        response = client.post("/api/admin/subscriptions", json=subscriptionData, headers=headers)
        assert response.status_code == HTTPStatus.FORBIDDEN.value
    
    def test_create_subscription_invalid_data(self, client: TestClient, admin_token: str) -> None:
        """Test subscription creation with invalid data."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Test with negative price
        invalidData: Dict[str, Any] = {
            "userId": 1,
            "planName": "Premium Plan",
            "status": "active",
            "price": -10.0  # Invalid negative price
        }
        
        response = client.post("/api/admin/subscriptions", json=invalidData, headers=headers)
        assert response.status_code == HTTPStatus.UNPROCESSABLE_ENTITY.value
    
    def test_create_subscription_success(self, client: TestClient, admin_token: str) -> None:
        """Test successful subscription creation."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        subscriptionData: Dict[str, Any] = {
            "userId": 1,
            "planName": "Premium Plan",
            "status": "active",
            "price": 99.99
        }
        
        response = client.post("/api/admin/subscriptions", json=subscriptionData, headers=headers)
        assert response.status_code == HTTPStatus.CREATED.value
        
        responseData: Dict[str, Any] = response.json()
        assert "id" in responseData
        assert responseData["planName"] == subscriptionData["planName"]
        assert responseData["price"] == subscriptionData["price"]
        assert responseData["schemaVersion"] == 1
    
    def test_get_subscription_success(self, client: TestClient, admin_token: str) -> None:
        """Test getting subscription by ID."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # First create a subscription
        subscriptionData: Dict[str, Any] = {
            "userId": 1,
            "planName": "Test Plan",
            "status": "active",
            "price": 49.99
        }
        
        createResponse = client.post("/api/admin/subscriptions", json=subscriptionData, headers=headers)
        assert createResponse.status_code == HTTPStatus.CREATED.value
        
        createdSubscription: Dict[str, Any] = createResponse.json()
        subscriptionId: int = createdSubscription["id"]
        
        # Then get the subscription
        getResponse = client.get(f"/api/admin/subscriptions/{subscriptionId}", headers=headers)
        assert getResponse.status_code == HTTPStatus.OK.value
        
        subscription: Dict[str, Any] = getResponse.json()
        assert subscription["id"] == subscriptionId
        assert subscription["planName"] == subscriptionData["planName"]
    
    def test_get_nonexistent_subscription(self, client: TestClient, admin_token: str) -> None:
        """Test getting non-existent subscription."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        response = client.get("/api/admin/subscriptions/99999", headers=headers)
        assert response.status_code == HTTPStatus.NOT_FOUND.value
    
    def test_update_subscription_success(self, client: TestClient, admin_token: str) -> None:
        """Test successful subscription update."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create subscription first
        subscriptionData: Dict[str, Any] = {
            "userId": 1,
            "planName": "Basic Plan",
            "status": "active",
            "price": 29.99
        }
        
        createResponse = client.post("/api/admin/subscriptions", json=subscriptionData, headers=headers)
        subscriptionId: int = createResponse.json()["id"]
        
        # Update subscription
        updateData: Dict[str, Any] = {
            "planName": "Premium Plan",
            "price": 59.99
        }
        
        updateResponse = client.put(f"/api/admin/subscriptions/{subscriptionId}", json=updateData, headers=headers)
        assert updateResponse.status_code == HTTPStatus.OK.value
        
        updatedSubscription: Dict[str, Any] = updateResponse.json()
        assert updatedSubscription["planName"] == updateData["planName"]
        assert updatedSubscription["price"] == updateData["price"]
    
    def test_delete_subscription_success(self, client: TestClient, admin_token: str) -> None:
        """Test successful subscription deletion."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create subscription first
        subscriptionData: Dict[str, Any] = {
            "userId": 1,
            "planName": "Temporary Plan",
            "status": "active",
            "price": 19.99
        }
        
        createResponse = client.post("/api/admin/subscriptions", json=subscriptionData, headers=headers)
        subscriptionId: int = createResponse.json()["id"]
        
        # Delete subscription
        deleteResponse = client.delete(f"/api/admin/subscriptions/{subscriptionId}", headers=headers)
        assert deleteResponse.status_code == HTTPStatus.OK.value
        
        # Verify deletion
        getResponse = client.get(f"/api/admin/subscriptions/{subscriptionId}", headers=headers)
        assert getResponse.status_code == HTTPStatus.NOT_FOUND.value
    
    def test_list_subscriptions_pagination(self, client: TestClient, admin_token: str) -> None:
        """Test subscription listing with pagination."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create multiple subscriptions
        for i in range(5):
            subscriptionData: Dict[str, Any] = {
                "userId": 1,
                "planName": f"Plan {i+1}",
                "status": "active",
                "price": 10.0 + i
            }
            client.post("/api/admin/subscriptions", json=subscriptionData, headers=headers)
        
        # Test pagination
        response = client.get("/api/admin/subscriptions?page=1&limit=3", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        assert len(responseData["items"]) <= 3
        assert "total" in responseData
        assert "page" in responseData
        assert "limit" in responseData
```

#### **Admin Search Tests**
Create `backend/tests/admin_search/test_admin_{object_name}_search.py`:

```python
# Example: backend/tests/admin_search/test_admin_subscriptions_search.py
import json
from typing import Dict, Any, List
from fastapi.testclient import TestClient
from app.models.enums.http_status import HTTPStatus

class TestAdminSubscriptionSearch:
    """Test admin subscription search functionality."""
    
    def test_search_subscriptions_unauthorized(self, client: TestClient) -> None:
        """Test that subscription search requires authentication."""
        response = client.get("/api/admin/subscriptions/search")
        assert response.status_code == HTTPStatus.UNAUTHORIZED.value
    
    def test_search_subscriptions_forbidden(self, client: TestClient, user_token: str) -> None:
        """Test that regular users cannot search subscriptions."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {user_token}"}
        response = client.get("/api/admin/subscriptions/search", headers=headers)
        assert response.status_code == HTTPStatus.FORBIDDEN.value
    
    def test_search_subscriptions_basic(self, client: TestClient, admin_token: str) -> None:
        """Test basic subscription search functionality."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        response = client.get("/api/admin/subscriptions/search", headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        assert "items" in responseData
        assert "total" in responseData
        assert "page" in responseData
        assert "limit" in responseData
    
    def test_search_subscriptions_with_filters(self, client: TestClient, admin_token: str) -> None:
        """Test subscription search with filters."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test subscription
        subscriptionData: Dict[str, Any] = {
            "userId": 1,
            "planName": "Premium Filter Test",
            "status": "active",
            "price": 99.99
        }
        client.post("/api/admin/subscriptions", json=subscriptionData, headers=headers)
        
        # Search with filters
        filters = {"search": "Premium Filter"}
        params = {
            "filters": json.dumps(filters),
            "page": "1",
            "limit": "10"
        }
        
        response = client.get("/api/admin/subscriptions/search", params=params, headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        assert len(responseData["items"]) >= 1
        
        # Verify the filtered subscription is in results
        found = any(item["planName"] == "Premium Filter Test" for item in responseData["items"])
        assert found
    
    def test_search_subscriptions_with_sorting(self, client: TestClient, admin_token: str) -> None:
        """Test subscription search with sorting."""
        headers: Dict[str, str] = {"Authorization": f"Bearer {admin_token}"}
        
        # Create test subscriptions with different prices
        for i, price in enumerate([10.99, 50.99, 25.99]):
            subscriptionData: Dict[str, Any] = {
                "userId": 1,
                "planName": f"Sort Test Plan {i+1}",
                "status": "active",
                "price": price
            }
            client.post("/api/admin/subscriptions", json=subscriptionData, headers=headers)
        
        # Search with price sorting (ascending)
        sorts = [{"field": "price", "direction": "asc"}]
        params = {
            "sorts": json.dumps(sorts),
            "limit": "10"
        }
        
        response = client.get("/api/admin/subscriptions/search", params=params, headers=headers)
        assert response.status_code == HTTPStatus.OK.value
        
        responseData: Dict[str, Any] = response.json()
        items: List[Dict[str, Any]] = responseData["items"]
        
        # Verify sorting (prices should be in ascending order for our test items)
        test_items = [item for item in items if "Sort Test Plan" in item["planName"]]
        if len(test_items) >= 2:
            assert test_items[0]["price"] <= test_items[1]["price"]
```

#### **Model Tests**
Create `backend/tests/models/test_{object_name}_model.py`:

```python
# Example: backend/tests/models/test_subscription_model.py
import pytest
from datetime import datetime
from pydantic import ValidationError
from app.models.subscription import SubscriptionModel

class TestSubscriptionModel:
    """Test subscription model validation and behavior."""
    
    def test_subscription_model_creation_success(self) -> None:
        """Test successful subscription model creation."""
        subscriptionData = {
            "id": 1,
            "userId": 100,
            "planName": "Premium Plan",
            "status": "active",
            "price": 99.99
        }
        
        subscription = SubscriptionModel(**subscriptionData)
        
        assert subscription.id == 1
        assert subscription.userId == 100
        assert subscription.planName == "Premium Plan"
        assert subscription.status == "active"
        assert subscription.price == 99.99
        assert subscription.isActive is True  # Default value
        assert subscription.schemaVersion == 1  # Default from schema versions
        assert isinstance(subscription.createdAt, datetime)
        assert isinstance(subscription.updatedAt, datetime)
    
    def test_subscription_model_negative_price_validation(self) -> None:
        """Test that negative prices are rejected."""
        subscriptionData = {
            "id": 1,
            "userId": 100,
            "planName": "Premium Plan",
            "status": "active",
            "price": -10.0  # Invalid negative price
        }
        
        with pytest.raises(ValidationError) as exc_info:
            SubscriptionModel(**subscriptionData)
        
        errors = exc_info.value.errors()
        price_error = next((error for error in errors if error["loc"] == ("price",)), None)
        assert price_error is not None
        assert "greater than or equal to 0" in str(price_error["msg"])
    
    def test_subscription_model_required_fields(self) -> None:
        """Test that required fields are enforced."""
        with pytest.raises(ValidationError) as exc_info:
            SubscriptionModel()
        
        errors = exc_info.value.errors()
        required_fields = {error["loc"][0] for error in errors if error["type"] == "missing"}
        
        expected_required = {"id", "userId", "planName", "status", "price"}
        assert expected_required.issubset(required_fields)
    
    def test_subscription_model_optional_fields(self) -> None:
        """Test that optional fields work correctly."""
        subscriptionData = {
            "id": 1,
            "userId": 100,
            "planName": "Basic Plan",
            "status": "active",
            "price": 29.99,
            "endDate": datetime(2025, 12, 31),
            "isActive": False
        }
        
        subscription = SubscriptionModel(**subscriptionData)
        
        assert subscription.endDate == datetime(2025, 12, 31)
        assert subscription.isActive is False
    
    def test_subscription_model_json_serialization(self) -> None:
        """Test subscription model JSON serialization."""
        subscriptionData = {
            "id": 1,
            "userId": 100,
            "planName": "Test Plan",
            "status": "active",
            "price": 49.99
        }
        
        subscription = SubscriptionModel(**subscriptionData)
        json_data = subscription.model_dump()
        
        assert isinstance(json_data, dict)
        assert json_data["id"] == 1
        assert json_data["userId"] == 100
        assert json_data["planName"] == "Test Plan"
        assert isinstance(json_data["createdAt"], datetime)
```

#### **Test Configuration**
Ensure your test files follow the project's testing patterns:

1. **Use HTTPStatus Enum**: Always use `HTTPStatus.STATUS.value` instead of hardcoded numbers
2. **Type Annotations**: Add comprehensive type hints for all variables
3. **Test Categories**: Unauthorized, Forbidden, Invalid Input, Success, Edge Cases
4. **Realistic Test Data**: Use production-like data that matches your domain
5. **API-Based Testing**: Use TestClient for HTTP requests, not direct database access
6. **Error Message Validation**: Test specific error messages from your backend

#### **Run Tests**
```bash
# Run all tests for your new object
uv run pytest tests/admin/test_admin_subscriptions.py --tb=short -v
uv run pytest tests/admin_search/test_admin_subscriptions_search.py --tb=short -v
uv run pytest tests/models/test_subscription_model.py --tb=short -v

# Run all admin tests
uv run pytest tests/admin/ --tb=short -v

# Run with coverage
uv run pytest tests/ --cov=app --cov-report=html --tb=short
```

---

## 🎨 Frontend Implementation Steps

### **Step 1: Create Models/Interfaces**

Create TypeScript interfaces in `frontend/src/app/models/{object_name}.model.ts`:

```typescript
// Example: frontend/src/app/models/subscription.model.ts
export interface Subscription {
  id: number;
  userId: number;
  planName: string;
  status: string;
  startDate: string;
  endDate?: string;
  price: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  schemaVersion: number;
}

export interface SubscriptionCreate {
  userId: number;
  planName: string;
  status: string;
  price: number;
  endDate?: string;
}

export interface SubscriptionUpdate {
  planName?: string;
  status?: string;
  price?: number;
  endDate?: string;
  isActive?: boolean;
}

export interface SubscriptionListResponse {
  items: Subscription[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// For hierarchical display (if belongs to users)
export interface UserSubscriptionSummary {
  id: number;
  username: string;
  email: string;
  firstname?: string;
  isActive: boolean;
  subscriptions: SubscriptionSummary[];
  subscriptionCount: number;
}

export interface SubscriptionSummary {
  id: number;
  planName: string;
  status: string;
  price: number;
  startDate: string;
  endDate?: string;
  isActive: boolean;
}
```

### **Step 2: Create Service**

Create service in `frontend/src/app/services/{object_name}-management.service.ts`:

```typescript
// Example: frontend/src/app/services/subscription-management.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { 
  Subscription, 
  SubscriptionCreate, 
  SubscriptionUpdate, 
  SubscriptionListResponse,
  UserSubscriptionSummary
} from '../models/subscription.model';
import { ApiMessage } from '../models/apiMessage.model';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionManagementService {
  private readonly apiUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  /**
   * Search subscriptions with pagination, filtering, and sorting
   */
  searchSubscriptions(params: {
    page?: number;
    limit?: number;
    search?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Observable<SubscriptionListResponse> {
    let httpParams = new HttpParams();
    
    if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params.limit !== undefined) httpParams = httpParams.set('limit', params.limit.toString());
    
    // Handle filters as JSON string
    const filters: any = {};
    if (params.search) filters.search = params.search;
    if (Object.keys(filters).length > 0) {
      httpParams = httpParams.set('filters', JSON.stringify(filters));
    }
    
    // Handle sorts as JSON string
    if (params.sortField && params.sortOrder) {
      const sorts = [{ field: params.sortField, direction: params.sortOrder }];
      httpParams = httpParams.set('sorts', JSON.stringify(sorts));
    }

    return this.http.get<SubscriptionListResponse>(`${this.apiUrl}/api/admin/subscriptions/search`, { params: httpParams });
  }

  /**
   * Get specific subscription details
   */
  getSubscriptionDetails(subscriptionId: number): Observable<Subscription> {
    return this.http.get<Subscription>(`${this.apiUrl}/api/admin/subscriptions/${subscriptionId}`);
  }

  /**
   * Create new subscription
   */
  createSubscription(subscriptionData: SubscriptionCreate): Observable<Subscription> {
    return this.http.post<Subscription>(`${this.apiUrl}/api/admin/subscriptions`, subscriptionData);
  }

  /**
   * Update subscription
   */
  updateSubscription(subscriptionId: number, updateData: SubscriptionUpdate): Observable<Subscription> {
    return this.http.put<Subscription>(`${this.apiUrl}/api/admin/subscriptions/${subscriptionId}`, updateData);
  }

  /**
   * Delete subscription
   */
  deleteSubscription(subscriptionId: number): Observable<ApiMessage> {
    return this.http.delete<ApiMessage>(`${this.apiUrl}/api/admin/subscriptions/${subscriptionId}`);
  }

  /**
   * Bulk delete subscriptions
   */
  bulkDeleteSubscriptions(subscriptionIds: number[]): Observable<ApiMessage> {
    return this.http.request<ApiMessage>('DELETE', `${this.apiUrl}/api/admin/subscriptions/bulk`, {
      body: subscriptionIds
    });
  }
}
```

### **Step 3: Create Store**

Create store in `frontend/src/app/stores/{object_name}-management.store.ts`:

```typescript
// Example: frontend/src/app/stores/subscription-management.store.ts
import { Injectable, signal, computed, inject } from '@angular/core';
import { MessageService } from 'primeng/api';
import { firstValueFrom } from 'rxjs';
import { 
  SubscriptionManagementService, 
  Subscription,
  SubscriptionCreate,
  SubscriptionUpdate,
  SubscriptionListResponse 
} from '../services/subscription-management.service';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionManagementStore {
  private subscriptionManagementService = inject(SubscriptionManagementService);
  private messageService = inject(MessageService);

  // State signals
  private _subscriptions = signal<Subscription[]>([]);
  private _selectedSubscription = signal<Subscription | null>(null);
  private _isLoading = signal<boolean>(false);
  private _isUpdating = signal<boolean>(false);
  private _isDeleting = signal<boolean>(false);
  private _error = signal<string | null>(null);
  private _pagination = signal<{
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  });

  // Public readonly state
  readonly subscriptions = this._subscriptions.asReadonly();
  readonly selectedSubscription = this._selectedSubscription.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isUpdating = this._isUpdating.asReadonly();
  readonly isDeleting = this._isDeleting.asReadonly();
  readonly error = this._error.asReadonly();
  readonly pagination = this._pagination.asReadonly();

  // Computed states
  readonly isAnyOperationInProgress = computed(() => 
    this._isLoading() || this._isUpdating() || this._isDeleting()
  );

  readonly activeSubscriptions = computed(() =>
    this._subscriptions().filter(sub => sub.isActive)
  );

  readonly inactiveSubscriptions = computed(() =>
    this._subscriptions().filter(sub => !sub.isActive)
  );

  /**
   * Load subscriptions with pagination and filtering
   */
  async loadSubscriptions(params: {
    page?: number;
    limit?: number;
    search?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(
        this.subscriptionManagementService.searchSubscriptions(params)
      );
      
      this._subscriptions.set(response.items);
      this._pagination.set({
        total: response.total,
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
        hasNext: response.hasNext,
        hasPrev: response.hasPrev
      });
    } catch (error: any) {
      const errorMessage = error?.error?.detail || 'Failed to load subscriptions';
      this._error.set(errorMessage);
      this.messageService.add({
        severity: 'error', 
        summary: 'Load Error', 
        detail: errorMessage
      });
    } finally {
      this._isLoading.set(false);
    }
  }

  /**
   * Create new subscription
   */
  async createSubscription(subscriptionData: SubscriptionCreate): Promise<boolean> {
    this._isUpdating.set(true);
    this._error.set(null);

    try {
      const newSubscription = await firstValueFrom(
        this.subscriptionManagementService.createSubscription(subscriptionData)
      );

      // Refresh the list
      await this.loadSubscriptions();

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Subscription created successfully'
      });

      return true;
    } catch (error: any) {
      const errorMessage = error?.error?.detail || 'Failed to create subscription';
      this._error.set(errorMessage);
      this.messageService.add({
        severity: 'error',
        summary: 'Creation Error',
        detail: errorMessage
      });
      return false;
    } finally {
      this._isUpdating.set(false);
    }
  }

  /**
   * Update subscription
   */
  async updateSubscription(subscriptionId: number, updateData: SubscriptionUpdate): Promise<boolean> {
    this._isUpdating.set(true);
    this._error.set(null);

    try {
      const updatedSubscription = await firstValueFrom(
        this.subscriptionManagementService.updateSubscription(subscriptionId, updateData)
      );

      // Update local state
      const currentSubscriptions = this._subscriptions();
      const updatedSubscriptions = currentSubscriptions.map(sub =>
        sub.id === subscriptionId ? updatedSubscription : sub
      );
      this._subscriptions.set(updatedSubscriptions);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Subscription updated successfully'
      });

      return true;
    } catch (error: any) {
      const errorMessage = error?.error?.detail || 'Failed to update subscription';
      this._error.set(errorMessage);
      this.messageService.add({
        severity: 'error',
        summary: 'Update Error',
        detail: errorMessage
      });
      return false;
    } finally {
      this._isUpdating.set(false);
    }
  }

  /**
   * Delete subscription
   */
  async deleteSubscription(subscriptionId: number): Promise<boolean> {
    this._isDeleting.set(true);
    this._error.set(null);

    try {
      await firstValueFrom(
        this.subscriptionManagementService.deleteSubscription(subscriptionId)
      );

      // Remove from local state
      const currentSubscriptions = this._subscriptions();
      const filteredSubscriptions = currentSubscriptions.filter(sub => sub.id !== subscriptionId);
      this._subscriptions.set(filteredSubscriptions);

      this.messageService.add({
        severity: 'success',
        summary: 'Success',
        detail: 'Subscription deleted successfully'
      });

      return true;
    } catch (error: any) {
      const errorMessage = error?.error?.detail || 'Failed to delete subscription';
      this._error.set(errorMessage);
      this.messageService.add({
        severity: 'error',
        summary: 'Delete Error',
        detail: errorMessage
      });
      return false;
    } finally {
      this._isDeleting.set(false);
    }
  }

  /**
   * Clear all state
   */
  clearState(): void {
    this._subscriptions.set([]);
    this._selectedSubscription.set(null);
    this._error.set(null);
    this._pagination.set({
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    });
  }
}
```

### **Step 4: Create Hooks**

Create hooks in `frontend/src/app/hooks/{object_name}-management.hooks.ts`:

```typescript
// Example: frontend/src/app/hooks/subscription-management.hooks.ts
import { inject } from '@angular/core';
import { SubscriptionManagementStore } from '../stores/subscription-management.store';
import { SubscriptionCreate, SubscriptionUpdate } from '../models/subscription.model';

/**
 * Hook for subscription management operations
 * Provides centralized access to subscription store and actions
 */
export function useSubscriptionManagement() {
  const subscriptionManagementStore = inject(SubscriptionManagementStore);

  return {
    // State
    subscriptions: subscriptionManagementStore.subscriptions,
    selectedSubscription: subscriptionManagementStore.selectedSubscription,
    isLoading: subscriptionManagementStore.isLoading,
    isUpdating: subscriptionManagementStore.isUpdating,
    isDeleting: subscriptionManagementStore.isDeleting,
    error: subscriptionManagementStore.error,
    pagination: subscriptionManagementStore.pagination,
    isAnyOperationInProgress: subscriptionManagementStore.isAnyOperationInProgress,
    activeSubscriptions: subscriptionManagementStore.activeSubscriptions,
    inactiveSubscriptions: subscriptionManagementStore.inactiveSubscriptions,

    // Actions
    loadSubscriptions: (params: {
      page?: number;
      limit?: number;
      search?: string;
      sortField?: string;
      sortOrder?: 'asc' | 'desc';
    } = {}) => subscriptionManagementStore.loadSubscriptions(params),
    
    createSubscription: (subscriptionData: SubscriptionCreate) => 
      subscriptionManagementStore.createSubscription(subscriptionData),
    
    updateSubscription: (subscriptionId: number, updateData: SubscriptionUpdate) => 
      subscriptionManagementStore.updateSubscription(subscriptionId, updateData),
    
    deleteSubscription: (subscriptionId: number) => 
      subscriptionManagementStore.deleteSubscription(subscriptionId),
    
    clearState: () => subscriptionManagementStore.clearState(),
  };
}
```

### **Step 5: Create Dashboard Configuration**

Create dashboard config in `frontend/src/app/components/admin/object-management-config/{object_name}.config.ts`:

```typescript
// Example: frontend/src/app/components/admin/object-management-config/subscription.config.ts
import { Injectable } from '@angular/core';
import { AdminDashboardConfig } from '../../../models/admin-dashboard-config.model';
import { useSubscriptionManagement } from '../../../hooks/subscription-management.hooks';

/**
 * Subscription Dashboard Configuration
 * Defines table structure, actions, and data fetching for subscription management
 */
@Injectable({
  providedIn: 'root'
})
export class SubscriptionDashboardConfigService {

  createSubscriptionDashboardConfig(): AdminDashboardConfig {
    return {
      title: 'Subscription Management',
      entityName: 'subscription',
      entityDisplayName: 'Subscription',
      
      // Data fetching
      dataFetcher: useSubscriptionManagement().loadSubscriptions,
      dataSource: useSubscriptionManagement().subscriptions,
      
      // Loading states
      isLoading: useSubscriptionManagement().isLoading,
      isUpdating: useSubscriptionManagement().isUpdating,
      isDeleting: useSubscriptionManagement().isDeleting,
      
      // Pagination
      pagination: useSubscriptionManagement().pagination,
      
      // Table configuration
      columns: [
        {
          field: 'id',
          header: 'ID',
          sortable: true,
          filterable: true,
          width: '80px',
          type: 'number'
        },
        {
          field: 'planName',
          header: 'Plan Name',
          sortable: true,
          filterable: true,
          width: '200px',
          type: 'text'
        },
        {
          field: 'status',
          header: 'Status',
          sortable: true,
          filterable: true,
          width: '120px',
          type: 'badge',
          badgeMap: {
            'active': 'success',
            'expired': 'warning',
            'cancelled': 'danger'
          }
        },
        {
          field: 'price',
          header: 'Price',
          sortable: true,
          filterable: true,
          width: '100px',
          type: 'currency'
        },
        {
          field: 'startDate',
          header: 'Start Date',
          sortable: true,
          filterable: true,
          width: '150px',
          type: 'date'
        },
        {
          field: 'endDate',
          header: 'End Date',
          sortable: true,
          filterable: true,
          width: '150px',
          type: 'date'
        },
        {
          field: 'isActive',
          header: 'Active',
          sortable: true,
          filterable: true,
          width: '100px',
          type: 'boolean'
        },
        {
          field: 'createdAt',
          header: 'Created',
          sortable: true,
          filterable: true,
          width: '150px',
          type: 'datetime'
        }
      ],
      
      // Actions
      actions: {
        create: {
          label: 'Add Subscription',
          icon: 'pi pi-plus',
          visible: true,
          handler: useSubscriptionManagement().createSubscription
        },
        edit: {
          label: 'Edit',
          icon: 'pi pi-pencil',
          visible: true,
          handler: useSubscriptionManagement().updateSubscription
        },
        delete: {
          label: 'Delete',
          icon: 'pi pi-trash',
          visible: true,
          severity: 'danger',
          confirmMessage: 'Are you sure you want to delete this subscription?',
          handler: useSubscriptionManagement().deleteSubscription
        },
        bulkDelete: {
          label: 'Delete Selected',
          icon: 'pi pi-trash',
          visible: true,
          severity: 'danger',
          confirmMessage: 'Are you sure you want to delete the selected subscriptions?',
          // handler: useSubscriptionManagement().bulkDeleteSubscriptions
        }
      },
      
      // Search and filtering
      searchConfig: {
        enabled: true,
        placeholder: 'Search subscriptions...',
        fields: ['planName', 'status']
      },
      
      // Form configuration for create/edit
      formConfig: {
        fields: [
          {
            name: 'userId',
            label: 'User ID',
            type: 'number',
            required: true,
            validators: ['required', 'min:1']
          },
          {
            name: 'planName',
            label: 'Plan Name',
            type: 'text',
            required: true,
            validators: ['required', 'minLength:1']
          },
          {
            name: 'status',
            label: 'Status',
            type: 'dropdown',
            required: true,
            options: [
              { label: 'Active', value: 'active' },
              { label: 'Expired', value: 'expired' },
              { label: 'Cancelled', value: 'cancelled' }
            ]
          },
          {
            name: 'price',
            label: 'Price',
            type: 'number',
            required: true,
            validators: ['required', 'min:0']
          },
          {
            name: 'endDate',
            label: 'End Date',
            type: 'date',
            required: false
          }
        ]
      }
    };
  }
}
```

### **Step 6: Register in Navigation**

Add navigation item to the admin menu in `frontend/src/app/components/admin/admin-navigation/admin-navigation.component.ts`:

```typescript
// Add to navigation items
{
  label: 'Subscriptions',
  icon: 'pi pi-credit-card',
  routerLink: '/admin/subscriptions'
},
```

### **Step 7: Create Route**

Add route to `frontend/src/app/app.routes.ts`:

```typescript
// Add to admin routes
{
  path: 'admin/subscriptions',
  component: AdminDashboardComponent,
  data: { 
    configService: 'SubscriptionDashboardConfigService',
    configMethod: 'createSubscriptionDashboardConfig'
  }
},
```

### **Step 8: Register Components**

Add the config service to providers in `frontend/src/app/app.config.ts`:

```typescript
// Add to providers array
SubscriptionDashboardConfigService,
```

---

## ✅ Checklist

### **Backend Checklist**
- [ ] Created data model with proper schema version
- [ ] Created request/response schemas with validation
- [ ] Created admin schema (if hierarchical)
- [ ] Updated schema versions configuration
- [ ] Created router with all CRUD operations
- [ ] Added search endpoint (if needed)
- [ ] Registered router in main.py
- [ ] Added error/success messages
- [ ] **Created comprehensive test files (admin CRUD, search, models)**
- [ ] **All tests pass with proper HTTPStatus enums and type annotations**
- [ ] Updated API documentation

### **Frontend Checklist**
- [ ] Created TypeScript interfaces/models
- [ ] Created service with all API methods
- [ ] Created store with state management
- [ ] Created hooks for component integration
- [ ] Created dashboard configuration
- [ ] Added navigation menu item
- [ ] Added route configuration
- [ ] Registered services in providers
- [ ] Created component tests
- [ ] Updated documentation

### **Integration Checklist**
- [ ] Backend API endpoints working
- [ ] Frontend can fetch/display data
- [ ] Create/update/delete operations working
- [ ] Search and filtering functional
- [ ] Pagination working correctly
- [ ] Error handling implemented
- [ ] Loading states working
- [ ] Bulk operations (if needed) working
- [ ] All tests passing
- [ ] Documentation updated

---

## 🚀 Best Practices

### **Naming Conventions**
- Use consistent naming across backend and frontend
- Follow camelCase for fields, PascalCase for types
- Use plural form for collections (`subscriptions`)
- Use descriptive, specific names

### **Error Handling**
- Implement comprehensive error handling in both backend and frontend
- Use specific error messages for better user experience
- Include proper HTTP status codes
- Add user-friendly error messages in frontend

### **Performance**
- Implement pagination for large datasets
- Use appropriate indexes in MongoDB
- Implement client-side caching where appropriate
- Use lazy loading for child data

### **Security**
- All admin endpoints require authentication
- Validate all input data
- Use proper access control
- Sanitize user inputs

### **Testing**
- Write comprehensive tests for both backend and frontend
- Test error scenarios and edge cases
- Include integration tests
- Maintain good test coverage

This comprehensive guide provides a structured approach to adding new object types to the admin dashboard management system while maintaining consistency with the existing architecture and patterns.

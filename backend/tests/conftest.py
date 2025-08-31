"""
Pytest configuration using mongomock-motor for clean async MongoDB mocking.
"""
import os
import pytest
from unittest.mock import AsyncMock, patch
from fastapi.testclient import TestClient
from mongomock_motor import AsyncMongoMockClient
from main import create_app
from app.config.database import DatabaseManager, db_manager


class TestDatabaseManager(DatabaseManager):
    """Test database manager using mongomock-motor for native async support."""
    
    def __init__(self, mock_client):
        super().__init__()
        self.client = mock_client
        self.database = mock_client["TAKE_YOUR_TIME_TEST"]
    
    async def connect_to_mongo(self):
        """Already connected via mongomock-motor."""
        pass
    
    async def close_mongo_connection(self):
        """Mock close connection."""
        pass
    
    def get_collection(self, collection_name: str):
        """Get collection - no mocking needed, mongomock-motor handles async natively."""
        return self.database[collection_name]


@pytest.fixture
def mock_db_manager():
    """Create test database manager with mongomock-motor."""
    mock_client = AsyncMongoMockClient()
    return TestDatabaseManager(mock_client)


@pytest.fixture(autouse=True)
def setup_test_environment(mock_db_manager):
    """Setup test environment with mongomock-motor."""
    # Store original environment variables
    original_env = {}
    test_env_vars = [
        "ENV_FILE", "ENVIRONMENT", "DEBUG", "MONGODB_URL", "DATABASE_NAME",
        "API_HOST", "API_PORT", "SECRET_KEY", "ALGORITHM", 
        "ACCESS_TOKEN_EXPIRE_MINUTES", "FRONTEND_URLS"
    ]
    
    for var in test_env_vars:
        original_env[var] = os.environ.get(var)
    
    # Set ENV_FILE to point to test environment
    os.environ["ENV_FILE"] = ".env.test"
    
    # Force reset of settings to reload with test config
    import app.config.settings
    app.config.settings.settings = None
    
    # Replace the global db_manager in all modules
    original_db_manager = db_manager
    app.config.database.db_manager = mock_db_manager
    
    # Mock email service to prevent actual emails during tests
    with patch('app.services.email.email_service.send_contact_email') as mock_send_email:
        # Configure mock to return success
        mock_send_email.return_value = (True, "Mock email sent successfully", "mock_message_id_12345")
        
        # Replace in all router modules
        import app.routers.products
        import app.routers.auth
        import app.routers.admin_users
        import app.routers.cart
        import app.routers.wishlist
        import app.routers.contact
        import app.auth.dependencies
        import app.auth.blacklist
        import app.utils.admin_search
        import app.schema_version_upgrade.v2.products_upgrade
        import app.schema_version_upgrade.v2.contacts_upgrade
        
        app.routers.products.db_manager = mock_db_manager
        app.routers.auth.db_manager = mock_db_manager
        app.routers.admin_users.db_manager = mock_db_manager
        app.routers.cart.db_manager = mock_db_manager
        app.routers.wishlist.db_manager = mock_db_manager
        app.routers.contact.db_manager = mock_db_manager
        app.auth.dependencies.db_manager = mock_db_manager
        app.auth.blacklist.db_manager = mock_db_manager
        app.utils.admin_search.db_manager = mock_db_manager
        app.schema_version_upgrade.v2.products_upgrade.db_manager = mock_db_manager
        app.schema_version_upgrade.v2.contacts_upgrade.db_manager = mock_db_manager
        
        yield
        
        # Cleanup - restore original db_manager
        app.config.database.db_manager = original_db_manager
        app.routers.products.db_manager = original_db_manager
        app.routers.auth.db_manager = original_db_manager
        app.routers.admin_users.db_manager = original_db_manager
        app.routers.cart.db_manager = original_db_manager
        app.routers.wishlist.db_manager = original_db_manager
        app.routers.contact.db_manager = original_db_manager
        app.auth.dependencies.db_manager = original_db_manager
        app.auth.blacklist.db_manager = original_db_manager
        app.utils.admin_search.db_manager = original_db_manager
        app.schema_version_upgrade.v2.products_upgrade.db_manager = original_db_manager
        app.schema_version_upgrade.v2.contacts_upgrade.db_manager = original_db_manager
    
    # Restore original environment variables
    for var, value in original_env.items():
        if value is not None:
            os.environ[var] = value
        elif var in os.environ:
            del os.environ[var]
    
    # Reset settings
    app.config.settings.settings = None


@pytest.fixture
def app():
    """Create FastAPI app for testing."""
    return create_app()


@pytest.fixture
def client(app):
    """Create test client."""
    return TestClient(app)


@pytest.fixture
def admin_token(client):
    """Get admin authentication token."""
    # Create admin user via registration (will be regular user)
    adminData = {
        "username": "testadmin",
        "firstname": "Test",
        "email": "testadmin@example.com",
        "password": "AdminPass123!"
    }
    
    # Register user first
    client.post("/api/account", json=adminData)
    
    # We need to manually promote this user to admin in the database
    # Since this is a test fixture, we'll simulate the create_admin_user behavior
    from app.config.database import db_manager
    from app.auth.password import get_password_hash
    import asyncio
    
    async def promote_to_admin():
        collection = db_manager.get_collection("users")
        await collection.update_one(
            {"email": "testadmin@example.com"},
            {"$set": {"isAdmin": True}}
        )
    
    # Run the async function to promote user to admin
    asyncio.run(promote_to_admin())
    
    # Login admin
    loginData = {
        "username": "testadmin@example.com",
        "password": "AdminPass123!"
    }
    response = client.post("/api/token", data=loginData)
    return response.json()["access_token"]


@pytest.fixture
def user_token(client):
    """Get regular user authentication token."""
    # Create regular user
    userData = {
        "username": "testuser",
        "firstname": "Test",
        "email": "testuser@example.com", 
        "password": "UserPass123!"
    }
    
    # Register user
    client.post("/api/account", json=userData)
    
    # Login user
    loginData = {
        "username": "testuser@example.com",
        "password": "UserPass123!"
    }
    response = client.post("/api/token", data=loginData)
    return response.json()["access_token"]


@pytest.fixture
def second_user_token(client):
    """Get second user authentication token for isolation testing."""
    # Create second user
    userData = {
        "username": "testuser2",
        "firstname": "Test2",
        "email": "testuser2@example.com",
        "password": "UserPass456!"
    }
    
    # Register user
    client.post("/api/account", json=userData)
    
    # Login user
    loginData = {
        "username": "testuser2@example.com",
        "password": "UserPass456!"
    }
    response = client.post("/api/token", data=loginData)
    return response.json()["access_token"]


@pytest.fixture
def authenticated_headers(user_token):
    """Get authentication headers for API requests."""
    return {"Authorization": f"Bearer {user_token}"}

"""
Pytest configuration using mongomock-motor for clean async MongoDB mocking.
"""
import os
import pytest
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
    # Store original env file
    original_env_file = os.environ.get("ENV_FILE")
    
    # Set test environment
    os.environ["ENV_FILE"] = ".env.test"
    
    # Force reset of settings to reload with test config
    import app.config.settings
    app.config.settings.settings = None
    
    # Replace the global db_manager
    original_db_manager = db_manager
    app.config.database.db_manager = mock_db_manager
    
    # Also replace in routers module
    import app.routers.products
    app.routers.products.db_manager = mock_db_manager
    
    yield
    
    # Cleanup - restore original db_manager
    app.config.database.db_manager = original_db_manager
    app.routers.products.db_manager = original_db_manager
    
    # Restore original environment
    if original_env_file:
        os.environ["ENV_FILE"] = original_env_file
    elif "ENV_FILE" in os.environ:
        del os.environ["ENV_FILE"]
    
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

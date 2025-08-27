"""
Database configuration and connection management.
"""
from pymongo import AsyncMongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
import logging
import asyncio
from app.config.settings import get_settings

logger = logging.getLogger(__name__)


class DatabaseManager:
    """MongoDB database manager."""
    
    def __init__(self):
        self.client: AsyncMongoClient = None
        self.database = None
    
    async def connect_to_mongo(self):
        """Create database connection."""
        try:
            settings = get_settings()
            logger.info(f"🔌 Attempting to connect to MongoDB at: {settings.mongodb_url}")
            
            # Create client with timeout settings
            self.client = AsyncMongoClient(
                settings.mongodb_url,
                serverSelectionTimeoutMS=5000,  # 5 second timeout
                connectTimeoutMS=5000,
                socketTimeoutMS=5000
            )
            self.database = self.client[settings.database_name]
            
            # Test the connection with timeout
            await asyncio.wait_for(
                self.client.admin.command('ping'), 
                timeout=10.0
            )
            logger.info(f"✅ Successfully connected to MongoDB database: {settings.database_name}")
            
        except (ConnectionFailure, ServerSelectionTimeoutError) as e:
            error_msg = f"❌ MongoDB Connection Failed: {str(e)}"
            logger.error(error_msg)
            settings = get_settings()
            logger.error(f"   📍 Connection URL: {settings.mongodb_url}")
            logger.error(f"   🗄️  Database: {settings.database_name}")
            logger.error("   💡 Please ensure MongoDB is running and accessible")
            logger.error("   🐳 If using Docker: docker run -d -p 27017:27017 mongo:7.0")
            raise ConnectionFailure(error_msg)
        except asyncio.TimeoutError:
            error_msg = "❌ MongoDB Connection Timeout - Server is not responding"
            logger.error(error_msg)
            settings = get_settings()
            logger.error(f"   📍 Connection URL: {settings.mongodb_url}")
            logger.error("   ⏱️  Connection timed out after 10 seconds")
            raise ConnectionFailure(error_msg)
        except Exception as e:
            error_msg = f"❌ Unexpected database error: {str(e)}"
            logger.error(error_msg)
            settings = get_settings()
            logger.error(f"   📍 Connection URL: {settings.mongodb_url}")
            logger.error(f"   🗄️  Database: {settings.database_name}")
            raise Exception(error_msg)
    
    async def close_mongo_connection(self):
        """Close database connection."""
        if self.client:
            self.client.close()
            logger.info("Disconnected from MongoDB")
    
    def get_collection(self, collection_name: str):
        """Get a specific collection."""
        if self.database is None:
            raise RuntimeError("Database not connected")
        return self.database[collection_name]


# Global database manager instance
db_manager = DatabaseManager()


async def get_database():
    """Dependency to get database instance."""
    if db_manager.database is None:
        await db_manager.connect_to_mongo()
    return db_manager.database

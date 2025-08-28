"""
Application startup utilities.
"""
from app.auth.password import get_password_hash
from app.config.database import db_manager
from app.models.user import create_admin_user, create_indexes
from app.models.product import create_product_indexes


async def initialize_database():
    """Initialize database with required indexes and default admin user."""
    # Initialize users collection
    users_collection = db_manager.get_collection("users")
    
    # Create user indexes
    await create_indexes(users_collection)
    
    # Initialize products collection
    products_collection = db_manager.get_collection("products")
    
    # Create product indexes
    await create_product_indexes(products_collection)
    
    # Create default admin user (admin@admin.com / admin)
    admin_password_hash = get_password_hash("admin")
    await create_admin_user(users_collection, admin_password_hash)
    
    print("✅ Database initialized successfully")
    print("🔑 Default admin user: admin@admin.com / admin")

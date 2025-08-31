"""
Application startup utilities.
"""
from app.auth.password import get_password_hash
from app.config.database import db_manager
from app.models.user import create_admin_user, create_indexes
from app.models.product import create_product_indexes
from app.models.contact import create_contact_indexes
from app.schema_version_upgrade.upgrade_system import run_schema_upgrades


async def initialize_database():
    """Initialize database with required indexes, schema upgrades, and default admin user."""
    print("🚀 Starting database initialization...")
    
    # Run schema upgrades first
    print("📊 Running schema upgrades...")
    upgrade_results = await run_schema_upgrades()
    
    # Log upgrade results
    if upgrade_results["upgrades_run"]:
        print("✅ Schema upgrades completed:")
        for upgrade in upgrade_results["upgrades_run"]:
            print(f"   • {upgrade}")
    else:
        print("✅ No upgrades needed - all schemas up to date")
    
    if upgrade_results["errors"]:
        print("⚠️  Upgrade warnings/errors:")
        for error in upgrade_results["errors"]:
            print(f"   • {error}")
    
    # Initialize users collection
    users_collection = db_manager.get_collection("users")
    
    # Create user indexes
    await create_indexes(users_collection)
    
    # Initialize products collection
    products_collection = db_manager.get_collection("products")
    
    # Create product indexes
    await create_product_indexes(products_collection)
    
    # Initialize contacts collection
    await create_contact_indexes()
    
    # Create default admin user (admin@admin.com / AdminPass!@)
    admin_password_hash = get_password_hash("AdminPass!@")
    await create_admin_user(users_collection, admin_password_hash)
    
    print("✅ Database initialized successfully")
    print("🔑 Default admin user: admin@admin.com / AdminPass!@")
    
    # Print upgrade summary
    total_upgraded = upgrade_results["total_documents_upgraded"]
    if total_upgraded > 0:
        print(f"📈 Total documents upgraded: {total_upgraded}")
        print(f"📂 Collections updated: {', '.join(upgrade_results['collections_upgraded'])}")

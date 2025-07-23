#!/usr/bin/env python3
"""
Admin User Creation Fix Script
Creates admin user with correct UserCreate schema
"""

import sys
import os

# Add app directory to Python path
sys.path.insert(0, '/app')

try:
    from app.db.session import SessionLocal
    from app.crud.crud_user import create_user, get_user_by_email
    from app.schemas.user import UserCreate
    from sqlalchemy import text
    import logging

    # Set up logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    def inspect_user_schema():
        """Inspect the UserCreate schema to understand required fields"""
        try:
            # Get the schema fields
            schema_fields = UserCreate.model_fields
            logger.info("📋 UserCreate schema fields:")
            for field_name, field_info in schema_fields.items():
                required = "required" if field_info.is_required() else "optional"
                logger.info(f"   {field_name}: {required}")
            return schema_fields
        except Exception as e:
            logger.error(f"❌ Failed to inspect schema: {e}")
            return {}

    def create_admin_user_with_correct_schema():
        """Create admin user with the correct schema fields"""
        try:
            db = SessionLocal()
            try:
                # Check if admin user already exists
                admin_email = "admin@rag-app.com"
                existing_admin = get_user_by_email(db, admin_email)
                
                if existing_admin:
                    logger.info(f"✅ Admin user already exists: {admin_email}")
                    return True
                
                # First, inspect the schema to understand what fields are needed
                schema_fields = inspect_user_schema()
                
                # Try different combinations of fields based on common patterns
                admin_data_options = [
                    # Option 1: With username field
                    {
                        "username": "admin",
                        "email": admin_email,
                        "password": "admin123",
                        "department": "admin"
                    },
                    # Option 2: Email as username
                    {
                        "username": admin_email,
                        "email": admin_email,
                        "password": "admin123",
                        "department": "admin"
                    },
                    # Option 3: Just required fields
                    {
                        "email": admin_email,
                        "password": "admin123"
                    },
                    # Option 4: With full_name if needed
                    {
                        "username": "admin",
                        "email": admin_email,
                        "password": "admin123",
                        "full_name": "Administrator",
                        "department": "admin"
                    }
                ]
                
                for i, admin_data_dict in enumerate(admin_data_options, 1):
                    try:
                        logger.info(f"🔄 Attempting admin user creation - Option {i}")
                        logger.info(f"   Fields: {list(admin_data_dict.keys())}")
                        
                        admin_data = UserCreate(**admin_data_dict)
                        admin_user = create_user(db, admin_data)
                        
                        logger.info(f"✅ Admin user created successfully: {admin_email}")
                        logger.info(f"   Default password: admin123 (CHANGE THIS!)")
                        logger.info(f"   User ID: {admin_user.id}")
                        return True
                        
                    except Exception as e:
                        logger.warning(f"⚠️  Option {i} failed: {e}")
                        continue
                
                logger.error("❌ All admin user creation options failed")
                return False
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"❌ Failed to create admin user: {e}")
            return False

    def test_user_operations():
        """Test basic user operations"""
        try:
            db = SessionLocal()
            try:
                # Count users
                user_count = db.execute(text("SELECT COUNT(*) FROM users")).scalar()
                logger.info(f"📊 Total users in database: {user_count}")
                
                # List users
                if user_count > 0:
                    users_result = db.execute(text("SELECT id, email, department, is_admin FROM users")).fetchall()
                    logger.info("👥 Users in database:")
                    for user in users_result:
                        logger.info(f"   ID: {user[0]}, Email: {user[1]}, Department: {user[2]}, Admin: {user[3]}")
                
                return True
                
            finally:
                db.close()
        except Exception as e:
            logger.error(f"❌ User operations test failed: {e}")
            return False

    def main():
        """Main function"""
        logger.info("🔧 Fixing Admin User Creation...")
        
        # Step 1: Test user operations
        logger.info("🔍 Step 1: Testing user operations...")
        test_user_operations()
        
        # Step 2: Create admin user with correct schema
        logger.info("👤 Step 2: Creating admin user with correct schema...")
        if create_admin_user_with_correct_schema():
            logger.info("✅ Admin user creation successful!")
        else:
            logger.error("❌ Admin user creation failed")
            return False
        
        # Step 3: Verify admin user was created
        logger.info("🔍 Step 3: Verifying admin user creation...")
        test_user_operations()
        
        logger.info("")
        logger.info("✅ Admin user setup completed!")
        logger.info("📋 Admin Login Details:")
        logger.info("   Email: admin@rag-app.com")
        logger.info("   Password: admin123")
        logger.info("   🚨 CHANGE PASSWORD AFTER FIRST LOGIN!")
        
        return True

    if __name__ == "__main__":
        success = main()
        sys.exit(0 if success else 1)

except ImportError as e:
    print(f"❌ Import error: {e}")
    print("Make sure you're running this script from the correct directory with PYTHONPATH set")
    sys.exit(1)
except Exception as e:
    print(f"❌ Unexpected error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)



live


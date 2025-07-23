#!/usr/bin/env python3
"""
Direct Admin User Creation Script
Bypasses schema validation and creates admin user directly in database
"""

import sys
import os

# Add app directory to Python path
sys.path.insert(0, '/app')

try:
    from app.db.session import SessionLocal
    from app.models.models import User
    from app.core.security import get_password_hash
    from sqlalchemy import text
    import logging

    # Set up logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    def create_admin_user_direct():
        """Create admin user directly using SQLAlchemy model, bypassing Pydantic schema"""
        try:
            db = SessionLocal()
            try:
                # Check if admin user already exists
                admin_email = "admin@rag-app.com"
                existing_admin = db.query(User).filter(User.email == admin_email).first()
                
                if existing_admin:
                    logger.info(f"✅ Admin user already exists: {admin_email}")
                    logger.info(f"   User ID: {existing_admin.id}")
                    logger.info(f"   Department: {existing_admin.department}")
                    logger.info(f"   Is Admin: {existing_admin.is_admin}")
                    return True
                
                # Hash the password
                hashed_password = get_password_hash("admin123")
                
                # Create admin user directly using SQLAlchemy model
                admin_user = User(
                    email=admin_email,
                    hashed_password=hashed_password,
                    is_active=True,
                    is_admin=True,
                    department="admin"
                )
                
                db.add(admin_user)
                db.commit()
                db.refresh(admin_user)
                
                logger.info(f"✅ Admin user created successfully: {admin_email}")
                logger.info(f"   User ID: {admin_user.id}")
                logger.info(f"   Department: {admin_user.department}")
                logger.info(f"   Is Admin: {admin_user.is_admin}")
                logger.info(f"   Default password: admin123 (CHANGE THIS!)")
                return True
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"❌ Failed to create admin user: {e}")
            import traceback
            traceback.print_exc()
            return False

    def create_admin_user_raw_sql():
        """Create admin user using raw SQL as fallback"""
        try:
            db = SessionLocal()
            try:
                # Check if admin user already exists
                admin_email = "admin@rag-app.com"
                existing_admin = db.execute(
                    text("SELECT id, email, department, is_admin FROM users WHERE email = :email"),
                    {"email": admin_email}
                ).fetchone()
                
                if existing_admin:
                    logger.info(f"✅ Admin user already exists: {admin_email}")
                    logger.info(f"   User ID: {existing_admin[0]}")
                    logger.info(f"   Department: {existing_admin[2]}")
                    logger.info(f"   Is Admin: {existing_admin[3]}")
                    return True
                
                # Hash the password
                hashed_password = get_password_hash("admin123")
                
                # Insert admin user using raw SQL
                db.execute(
                    text("""
                        INSERT INTO users (email, hashed_password, is_active, is_admin, department)
                        VALUES (:email, :hashed_password, :is_active, :is_admin, :department)
                    """),
                    {
                        "email": admin_email,
                        "hashed_password": hashed_password,
                        "is_active": True,
                        "is_admin": True,
                        "department": "admin"
                    }
                )
                
                db.commit()
                
                # Verify creation
                created_user = db.execute(
                    text("SELECT id, email, department, is_admin FROM users WHERE email = :email"),
                    {"email": admin_email}
                ).fetchone()
                
                if created_user:
                    logger.info(f"✅ Admin user created successfully: {admin_email}")
                    logger.info(f"   User ID: {created_user[0]}")
                    logger.info(f"   Department: {created_user[2]}")
                    logger.info(f"   Is Admin: {created_user[3]}")
                    logger.info(f"   Default password: admin123 (CHANGE THIS!)")
                    return True
                else:
                    logger.error("❌ Admin user creation verification failed")
                    return False
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"❌ Failed to create admin user with raw SQL: {e}")
            import traceback
            traceback.print_exc()
            return False

    def test_admin_login():
        """Test admin user authentication"""
        try:
            from app.crud.crud_user import authenticate_user
            
            db = SessionLocal()
            try:
                admin_user = authenticate_user(db, "admin@rag-app.com", "admin123")
                if admin_user:
                    logger.info("✅ Admin user authentication test successful")
                    logger.info(f"   Authenticated user: {admin_user.email}")
                    logger.info(f"   Is admin: {admin_user.is_admin}")
                    return True
                else:
                    logger.error("❌ Admin user authentication test failed")
                    return False
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"❌ Admin authentication test failed: {e}")
            return False

    def list_all_users():
        """List all users in the database"""
        try:
            db = SessionLocal()
            try:
                users = db.execute(
                    text("SELECT id, email, department, is_admin, is_active FROM users ORDER BY id")
                ).fetchall()
                
                logger.info(f"👥 Total users in database: {len(users)}")
                if users:
                    logger.info("📋 User list:")
                    for user in users:
                        status = "active" if user[4] else "inactive"
                        admin_status = "admin" if user[3] else "user"
                        logger.info(f"   ID: {user[0]}, Email: {user[1]}, Dept: {user[2]}, Role: {admin_status}, Status: {status}")
                
                return users
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"❌ Failed to list users: {e}")
            return []

    def main():
        """Main function"""
        logger.info("🔧 Creating Admin User (Direct Method)...")
        
        # Step 1: List current users
        logger.info("🔍 Step 1: Checking current users...")
        list_all_users()
        
        # Step 2: Try direct SQLAlchemy model creation
        logger.info("👤 Step 2: Creating admin user (SQLAlchemy model)...")
        if create_admin_user_direct():
            logger.info("✅ Admin user creation successful!")
        else:
            logger.warning("⚠️  SQLAlchemy model method failed, trying raw SQL...")
            
            # Step 3: Fallback to raw SQL
            logger.info("👤 Step 3: Creating admin user (Raw SQL)...")
            if not create_admin_user_raw_sql():
                logger.error("❌ All admin user creation methods failed")
                return False
        
        # Step 4: List users again to verify
        logger.info("🔍 Step 4: Verifying admin user creation...")
        list_all_users()
        
        # Step 5: Test authentication
        logger.info("🔐 Step 5: Testing admin authentication...")
        test_admin_login()
        
        logger.info("")
        logger.info("✅ Admin user setup completed!")
        logger.info("📋 Admin Login Details:")
        logger.info("   Email: admin@rag-app.com")
        logger.info("   Password: admin123")
        logger.info("   🚨 CHANGE PASSWORD AFTER FIRST LOGIN!")
        logger.info("")
        logger.info("🧪 Test your complete RAG system:")
        logger.info("   curl -X POST http://localhost:8000/api/v1/queries/ask \\")
        logger.info("     -H 'Content-Type: application/json' \\")
        logger.info("     -d '{\"query\": \"Test admin user creation\", \"department\": \"General\"}'")
        
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


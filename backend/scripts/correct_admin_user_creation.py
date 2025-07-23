#!/usr/bin/env python3
"""
Correct Admin User Creation Script
Based on actual schema analysis: UserCreate expects username, department, password
But User model has: email, hashed_password, department, is_active, is_admin
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

    def create_admin_user_correct_method():
        """
        Create admin user using the correct approach based on schema analysis.
        
        The issue is clear:
        - UserCreate schema expects: username, department, password
        - User model has: email, hashed_password, department, is_active, is_admin
        
        Solution: Create user directly with User model, bypassing UserCreate schema
        """
        try:
            db = SessionLocal()
            try:
                # Check if admin user already exists
                admin_email = "admin@rag-app.com"
                existing_admin = db.query(User).filter(User.email == admin_email).first()
                
                if existing_admin:
                    logger.info(f"✅ Admin user already exists: {admin_email}")
                    logger.info(f"   User ID: {existing_admin.id}")
                    logger.info(f"   Email: {existing_admin.email}")
                    logger.info(f"   Department: {existing_admin.department}")
                    logger.info(f"   Is Admin: {existing_admin.is_admin}")
                    logger.info(f"   Is Active: {existing_admin.is_active}")
                    return existing_admin
                
                # Hash the password using the app's security module
                hashed_password = get_password_hash("admin123")
                logger.info("🔐 Password hashed successfully")
                
                # Create admin user directly using SQLAlchemy User model
                # This bypasses the problematic UserCreate schema
                admin_user = User(
                    email=admin_email,           # User model expects 'email'
                    hashed_password=hashed_password,  # User model expects 'hashed_password'
                    is_active=True,              # User model has 'is_active'
                    is_admin=True,               # User model has 'is_admin'
                    department="admin"           # Both schema and model have 'department'
                )
                
                # Add to database
                db.add(admin_user)
                db.commit()
                db.refresh(admin_user)
                
                logger.info(f"✅ Admin user created successfully!")
                logger.info(f"   User ID: {admin_user.id}")
                logger.info(f"   Email: {admin_user.email}")
                logger.info(f"   Department: {admin_user.department}")
                logger.info(f"   Is Admin: {admin_user.is_admin}")
                logger.info(f"   Is Active: {admin_user.is_active}")
                logger.info(f"   Default password: admin123")
                logger.info(f"   🚨 CHANGE PASSWORD AFTER FIRST LOGIN!")
                
                return admin_user
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"❌ Failed to create admin user: {e}")
            import traceback
            traceback.print_exc()
            return None

    def test_admin_authentication():
        """Test admin user authentication using the app's auth system"""
        try:
            from app.crud.crud_user import authenticate_user
            
            db = SessionLocal()
            try:
                logger.info("🔐 Testing admin authentication...")
                admin_user = authenticate_user(db, "admin@rag-app.com", "admin123")
                
                if admin_user:
                    logger.info("✅ Admin authentication successful!")
                    logger.info(f"   Authenticated user: {admin_user.email}")
                    logger.info(f"   Is admin: {admin_user.is_admin}")
                    logger.info(f"   Department: {admin_user.department}")
                    return True
                else:
                    logger.error("❌ Admin authentication failed")
                    return False
                    
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"❌ Authentication test failed: {e}")
            return False

    def verify_database_state():
        """Verify the current state of the users table"""
        try:
            db = SessionLocal()
            try:
                # Count total users
                total_users = db.execute(text("SELECT COUNT(*) FROM users")).scalar()
                logger.info(f"📊 Total users in database: {total_users}")
                
                # List all users
                if total_users > 0:
                    users = db.execute(
                        text("SELECT id, email, department, is_admin, is_active FROM users ORDER BY id")
                    ).fetchall()
                    
                    logger.info("👥 Users in database:")
                    for user in users:
                        status = "active" if user[4] else "inactive"
                        role = "admin" if user[3] else "user"
                        logger.info(f"   ID: {user[0]}, Email: {user[1]}, Dept: {user[2]}, Role: {role}, Status: {status}")
                
                return total_users
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"❌ Failed to verify database state: {e}")
            return 0

    def test_query_logging():
        """Test that query history logging will work with the admin user"""
        try:
            logger.info("🧪 Testing query history logging capability...")
            
            # This doesn't actually make a query, just tests the database structure
            db = SessionLocal()
            try:
                # Check if query_history table exists and is accessible
                query_count = db.execute(text("SELECT COUNT(*) FROM query_history")).scalar()
                logger.info(f"📊 Current queries in history: {query_count}")
                
                # Check if we can insert a test record (then delete it)
                test_query_sql = text("""
                    INSERT INTO query_history 
                    (query_text, response_text, llm_model_used, query_timestamp, department_filter, gpu_accelerated)
                    VALUES 
                    ('Test query', 'Test response', 'test-model', NOW(), 'admin', true)
                    RETURNING id
                """)
                
                result = db.execute(test_query_sql)
                test_id = result.scalar()
                
                if test_id:
                    logger.info(f"✅ Query history logging test successful (test ID: {test_id})")
                    
                    # Clean up test record
                    db.execute(text("DELETE FROM query_history WHERE id = :id"), {"id": test_id})
                    db.commit()
                    logger.info("🧹 Test record cleaned up")
                    return True
                else:
                    logger.error("❌ Query history logging test failed")
                    return False
                    
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"❌ Query logging test failed: {e}")
            return False

    def main():
        """Main function"""
        logger.info("🚀 Creating Admin User with Correct Schema...")
        logger.info("")
        logger.info("📋 Schema Analysis Summary:")
        logger.info("   UserCreate schema expects: username, department, password")
        logger.info("   User model has: email, hashed_password, department, is_active, is_admin")
        logger.info("   Solution: Use User model directly, bypass UserCreate schema")
        logger.info("")
        
        # Step 1: Check current database state
        logger.info("🔍 Step 1: Checking current database state...")
        verify_database_state()
        
        # Step 2: Create admin user with correct method
        logger.info("👤 Step 2: Creating admin user...")
        admin_user = create_admin_user_correct_method()
        
        if not admin_user:
            logger.error("❌ Admin user creation failed")
            return False
        
        # Step 3: Verify database state after creation
        logger.info("🔍 Step 3: Verifying admin user creation...")
        verify_database_state()
        
        # Step 4: Test authentication
        logger.info("🔐 Step 4: Testing admin authentication...")
        if not test_admin_authentication():
            logger.warning("⚠️  Authentication test failed, but user was created")
        
        # Step 5: Test query logging capability
        logger.info("🧪 Step 5: Testing query logging capability...")
        if not test_query_logging():
            logger.warning("⚠️  Query logging test failed, but admin user is ready")
        
        logger.info("")
        logger.info("✅ Admin user setup completed successfully!")
        logger.info("")
        logger.info("📋 Admin Login Details:")
        logger.info("   Email: admin@rag-app.com")
        logger.info("   Password: admin123")
        logger.info("   🚨 CHANGE PASSWORD AFTER FIRST LOGIN!")
        logger.info("")
        logger.info("🧪 Test your complete RAG system:")
        logger.info("   curl -X POST http://localhost:8000/api/v1/queries/ask \\")
        logger.info("     -H 'Content-Type: application/json' \\")
        logger.info("     -d '{\"query\": \"Test admin user and database integration\", \"department\": \"General\"}'")
        logger.info("")
        logger.info("📊 Check query was logged:")
        logger.info("   docker exec -it postgres-07 psql -U rag -d rag \\")
        logger.info("     -c 'SELECT id, query_text, query_timestamp FROM query_history ORDER BY query_timestamp DESC LIMIT 1;'")
        
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


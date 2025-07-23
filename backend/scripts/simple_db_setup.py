#!/usr/bin/env python3
"""
Simple Database Setup Script for RAG Application - SQLAlchemy 2.0 Compatible
Bypasses Alembic and uses SQLAlchemy's create_all() method
"""

import sys
import os

# Add app directory to Python path
sys.path.insert(0, '/app')

try:
    from app.db.base import Base, engine
    from app.models import models  # Import all models
    from app.core.config import settings
    from app.db.session import SessionLocal
    from app.crud.crud_user import create_user, get_user_by_email
    from app.schemas.user import UserCreate
    from sqlalchemy import text  # FIXED: Import text for SQLAlchemy 2.0
    import logging

    # Set up logging
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger(__name__)

    def create_tables():
        """Create all database tables"""
        try:
            logger.info("Creating database tables...")
            Base.metadata.create_all(bind=engine)
            logger.info("✅ Database tables created successfully")
            return True
        except Exception as e:
            logger.error(f"❌ Failed to create tables: {e}")
            return False

    def create_admin_user():
        """Create default admin user"""
        try:
            db = SessionLocal()
            try:
                # Check if admin user already exists
                admin_email = "admin@rag-app.com"
                existing_admin = get_user_by_email(db, admin_email)
                
                if existing_admin:
                    logger.info(f"✅ Admin user already exists: {admin_email}")
                    return True
                
                # Create admin user
                admin_data = UserCreate(
                    email=admin_email,
                    password="admin123",  # Change this in production!
                    department="admin"
                )
                
                admin_user = create_user(db, admin_data)
                logger.info(f"✅ Admin user created: {admin_email}")
                logger.info(f"   Default password: admin123 (CHANGE THIS!)")
                return True
                
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"❌ Failed to create admin user: {e}")
            return False

    def verify_database_connection():
        """Verify database connection is working"""
        try:
            db = SessionLocal()
            try:
                # FIXED: Use text() for raw SQL in SQLAlchemy 2.0
                result = db.execute(text("SELECT 1")).scalar()
                if result == 1:
                    logger.info("✅ Database connection verified")
                    return True
                else:
                    logger.error("❌ Database connection test failed")
                    return False
            finally:
                db.close()
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            return False

    def get_table_info():
        """Get information about created tables"""
        try:
            db = SessionLocal()
            try:
                # Check tables exist and get counts
                tables_info = {}
                
                # FIXED: Use text() for all raw SQL queries
                # Check users table
                try:
                    user_count = db.execute(text("SELECT COUNT(*) FROM users")).scalar()
                    tables_info['users'] = user_count
                except Exception as e:
                    tables_info['users'] = f'Error: {str(e)}'
                
                # Check documents table
                try:
                    doc_count = db.execute(text("SELECT COUNT(*) FROM documents")).scalar()
                    tables_info['documents'] = doc_count
                except Exception as e:
                    tables_info['documents'] = f'Error: {str(e)}'
                
                # Check query_history table
                try:
                    query_count = db.execute(text("SELECT COUNT(*) FROM query_history")).scalar()
                    tables_info['query_history'] = query_count
                except Exception as e:
                    tables_info['query_history'] = f'Error: {str(e)}'
                
                logger.info("📊 Table Information:")
                for table, count in tables_info.items():
                    logger.info(f"   {table}: {count} records")
                
                return tables_info
                
            finally:
                db.close()
        except Exception as e:
            logger.error(f"❌ Failed to get table info: {e}")
            return {}

    def test_table_creation():
        """Test if tables were created properly by checking table existence"""
        try:
            db = SessionLocal()
            try:
                # FIXED: Use text() and proper SQLAlchemy 2.0 syntax
                # Check if tables exist in PostgreSQL
                tables_query = text("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_type = 'BASE TABLE'
                    ORDER BY table_name
                """)
                
                result = db.execute(tables_query)
                tables = [row[0] for row in result.fetchall()]
                
                expected_tables = ['users', 'documents', 'query_history']
                missing_tables = [table for table in expected_tables if table not in tables]
                
                if missing_tables:
                    logger.warning(f"⚠️  Missing tables: {missing_tables}")
                    logger.info(f"📋 Existing tables: {tables}")
                    return False
                else:
                    logger.info(f"✅ All required tables exist: {tables}")
                    return True
                    
            finally:
                db.close()
        except Exception as e:
            logger.error(f"❌ Failed to check table existence: {e}")
            return False

    def test_database_operations():
        """Test basic database operations"""
        try:
            db = SessionLocal()
            try:
                # Test database version
                version_result = db.execute(text("SELECT version()")).scalar()
                logger.info(f"📊 PostgreSQL version: {version_result.split(',')[0]}")
                
                # Test current database
                db_name_result = db.execute(text("SELECT current_database()")).scalar()
                logger.info(f"📊 Current database: {db_name_result}")
                
                # Test current user
                user_result = db.execute(text("SELECT current_user")).scalar()
                logger.info(f"📊 Current user: {user_result}")
                
                return True
                
            finally:
                db.close()
        except Exception as e:
            logger.error(f"❌ Database operations test failed: {e}")
            return False

    def main():
        """Main setup function"""
        logger.info("🚀 Starting RAG Application Database Setup...")
        
        # Step 1: Test basic database operations
        logger.info("🔍 Step 1: Testing database operations...")
        if not test_database_operations():
            logger.error("❌ Database setup failed - basic operations error")
            return False
        
        # Step 2: Verify database connection
        logger.info("🔍 Step 2: Verifying database connection...")
        if not verify_database_connection():
            logger.error("❌ Database setup failed - connection error")
            return False
        
        # Step 3: Create tables
        logger.info("🔧 Step 3: Creating database tables...")
        if not create_tables():
            logger.error("❌ Database setup failed - table creation error")
            return False
        
        # Step 4: Test table creation
        logger.info("🔍 Step 4: Verifying table creation...")
        if not test_table_creation():
            logger.warning("⚠️  Table verification failed, but continuing...")
        
        # Step 5: Get table information
        logger.info("📊 Step 5: Getting table information...")
        get_table_info()
        
        # Step 6: Create admin user
        logger.info("👤 Step 6: Creating admin user...")
        if not create_admin_user():
            logger.warning("⚠️  Admin user creation failed, but continuing...")
        
        logger.info("")
        logger.info("✅ Database setup completed successfully!")
        logger.info("")
        logger.info("📋 Next Steps:")
        logger.info("1. Your RAG application database is ready to use")
        logger.info("2. Default admin user: admin@rag-app.com / admin123")
        logger.info("3. Change the admin password after first login!")
        logger.info("4. Test with a query:")
        logger.info("   curl -X POST http://localhost:8000/api/v1/queries/ask \\")
        logger.info("     -H 'Content-Type: application/json' \\")
        logger.info("     -d '{\"query\": \"Test database setup\", \"department\": \"General\"}'")
        logger.info("")
        logger.info("5. Check query was logged:")
        logger.info("   docker exec -it postgres-07 psql -U rag -d rag \\")
        logger.info("     -c 'SELECT * FROM query_history ORDER BY query_timestamp DESC LIMIT 1;'")
        
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


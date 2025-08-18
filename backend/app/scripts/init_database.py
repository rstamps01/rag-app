# File: backend/app/scripts/init_database.py
"""
Database initialization script for integrated solution
Creates tables and sets up initial schema with enhanced error handling
"""

import os
import sys
import logging
from pathlib import Path

# Add app directory to Python path
app_dir = Path(__file__).parent.parent
sys.path.insert(0, str(app_dir))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from app.models.models import Base
from app.core.config import settings

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def init_database():
    """Initialize database schema with comprehensive error handling"""
    try:
        logger.info("🚀 Starting database initialization...")
        
        # Create database engine
        engine = create_engine(settings.DATABASE_URL)
        
        # Test connection
        with engine.connect() as conn:
            result = conn.execute(text("SELECT version()"))
            version = result.fetchone()[0]
            logger.info(f"✅ Connected to PostgreSQL: {version}")
        
        # Create all tables
        logger.info("📋 Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created successfully")
        
        # Verify tables were created
        with engine.connect() as conn:
            result = conn.execute(text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """))
            tables = [row[0] for row in result.fetchall()]
            logger.info(f"✅ Created tables: {', '.join(tables)}")
        
        # Create indexes for performance
        logger.info("🔍 Creating performance indexes...")
        with engine.connect() as conn:
            # Index for documents table
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_documents_department 
                ON documents(department)
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_documents_status 
                ON documents(status)
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_documents_upload_date 
                ON documents(upload_date)
            """))
            
            # Index for query_history table
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_query_history_timestamp 
                ON query_history(query_timestamp)
            """))
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_query_history_department 
                ON query_history(department_filter)
            """))
            
            conn.commit()
            logger.info("✅ Performance indexes created")
        
        logger.info("🎉 Database initialization completed successfully")
        return True
        
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        return False

if __name__ == "__main__":
    success = init_database()
    sys.exit(0 if success else 1)
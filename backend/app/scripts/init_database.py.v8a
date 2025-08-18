#!/usr/bin/env python3
"""
Database Initialization Script
Creates tables and sets up initial data for the RAG application
"""

import sys
import os
sys.path.append('/app')

from sqlalchemy import create_engine, text
from app.db.base import Base
from app.models.models import User, Document, QueryHistory
from app.core.config import settings
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def init_database():
    """Initialize database tables and test connectivity"""
    try:
        logger.info("🚀 Starting database initialization...")
        
        # Create engine
        engine = create_engine(settings.DATABASE_URL)
        logger.info(f"📡 Connecting to database: {settings.DATABASE_URL}")
        
        # Test connection first
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            logger.info("✅ Database connection test successful")
        
        # Create all tables
        logger.info("📋 Creating database tables...")
        Base.metadata.create_all(bind=engine)
        logger.info("✅ Database tables created successfully")
        
        # Verify tables were created
        with engine.connect() as conn:
            # Check if tables exist
            tables_query = text("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public'
            """)
            result = conn.execute(tables_query)
            tables = [row[0] for row in result]
            
            logger.info(f"📊 Created tables: {', '.join(tables)}")
            
            # Verify specific tables
            expected_tables = ['users', 'documents', 'query_history']
            missing_tables = [table for table in expected_tables if table not in tables]
            
            if missing_tables:
                logger.warning(f"⚠️  Missing tables: {', '.join(missing_tables)}")
            else:
                logger.info("✅ All expected tables created successfully")
        
        logger.info("🎉 Database initialization completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Database initialization failed: {e}")
        return False

def create_sample_data():
    """Create sample data for testing"""
    try:
        from sqlalchemy.orm import sessionmaker
        
        engine = create_engine(settings.DATABASE_URL)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        
        with SessionLocal() as session:
            # Check if sample data already exists
            existing_users = session.query(User).count()
            if existing_users > 0:
                logger.info("📊 Sample data already exists, skipping creation")
                return True
            
            logger.info("📝 Creating sample data...")
            
            # Create sample user
            sample_user = User(
                email="admin@rag-app.com",
                hashed_password="$2b$12$sample_hashed_password",  # This would be properly hashed in production
                is_active=True,
                is_admin=True,
                department="General"
            )
            session.add(sample_user)
            session.commit()
            session.refresh(sample_user)
            
            # Create sample document
            sample_document = Document(
                id="sample-doc-1",
                filename="sample_document.pdf",
                content_type="application/pdf",
                size=1024000,
                status="processed",
                department="General",
                path="/app/data/uploads/sample_document.pdf"
            )
            session.add(sample_document)
            
            # Create sample query history
            sample_query = QueryHistory(
                user_id=sample_user.id,
                query_text="What is VAST storage?",
                response_text="VAST Data provides enterprise-grade storage solutions with high performance and scalability.",
                llm_model_used="mistralai/Mistral-7B-Instruct-v0.2",
                processing_time_ms=1200,
                department_filter="General",
                gpu_accelerated=True
            )
            session.add(sample_query)
            
            session.commit()
            logger.info("✅ Sample data created successfully")
            
        return True
        
    except Exception as e:
        logger.error(f"❌ Sample data creation failed: {e}")
        return False

if __name__ == "__main__":
    logger.info("🔧 RAG Application Database Initialization")
    logger.info("=" * 50)
    
    # Initialize database
    db_success = init_database()
    
    if db_success:
        # Create sample data
        sample_success = create_sample_data()
        
        if sample_success:
            logger.info("🎉 Database setup completed successfully!")
            sys.exit(0)
        else:
            logger.error("❌ Sample data creation failed")
            sys.exit(1)
    else:
        logger.error("❌ Database initialization failed")
        sys.exit(1)


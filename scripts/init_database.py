#!/usr/bin/env python3
"""Database Initialization Script for Enhanced RAG Application"""

import os
import sys
import logging
from sqlalchemy import create_engine, text

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def main():
    """Initialize database tables"""
    logger.info("🚀 Starting database initialization...")
    
    # Database connection
    database_url = os.getenv('DATABASE_URL', 'postgresql://rag:rag@postgres-07:5432/rag')
    engine = create_engine(database_url)
    
    # Test connection
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
        logger.info("✅ Database connection successful!")
    except Exception as e:
        logger.error(f"❌ Database connection failed: {e}")
        return False
    
    # SQL commands to create tables
    sql_commands = [
        """
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            hashed_password VARCHAR(255) NOT NULL,
            is_active BOOLEAN DEFAULT TRUE,
            is_admin BOOLEAN DEFAULT FALSE,
            department VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS documents (
            id VARCHAR(255) PRIMARY KEY,
            filename VARCHAR(255) NOT NULL,
            content_type VARCHAR(100),
            size INTEGER,
            status VARCHAR(50) DEFAULT 'uploaded',
            path VARCHAR(500),
            department VARCHAR(100),
            upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            processing_status VARCHAR(50) DEFAULT 'pending',
            vector_stored BOOLEAN DEFAULT FALSE
        );
        """,
        """
        CREATE TABLE IF NOT EXISTS query_history (
            id SERIAL PRIMARY KEY,
            user_id INTEGER REFERENCES users(id),
            query_text TEXT NOT NULL,
            response_text TEXT,
            llm_model_used VARCHAR(255),
            processing_time_ms INTEGER,
            department_filter VARCHAR(100),
            query_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            gpu_accelerated BOOLEAN DEFAULT FALSE,
            context_chunks_used INTEGER DEFAULT 0,
            vector_search_used BOOLEAN DEFAULT FALSE
        );
        """,
        "CREATE INDEX IF NOT EXISTS idx_query_history_timestamp ON query_history(query_timestamp);",
        "CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);",
        "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);"
    ]
    
    # Execute SQL commands
    try:
        with engine.connect() as connection:
            for sql in sql_commands:
                logger.info(f"Executing SQL command...")
                connection.execute(text(sql))
                connection.commit()
        
        logger.info("✅ Database tables created successfully!")
        
        # Insert sample data
        sample_data = [
            """
            INSERT INTO users (email, hashed_password, is_admin, department) 
            VALUES ('admin@vastdata.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq9w5KS', TRUE, 'IT')
            ON CONFLICT (email) DO NOTHING;
            """,
            """
            INSERT INTO documents (id, filename, content_type, size, status, department, processing_status, vector_stored)
            VALUES ('sample-doc-1', 'VAST_Storage_Overview.pdf', 'application/pdf', 1024000, 'processed', 'IT', 'completed', TRUE)
            ON CONFLICT (id) DO NOTHING;
            """
        ]
        
        with engine.connect() as connection:
            for sql in sample_data:
                connection.execute(text(sql))
                connection.commit()
        
        logger.info("✅ Sample data inserted!")
        logger.info("🎉 Database initialization completed successfully!")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error during initialization: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

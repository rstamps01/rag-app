# File: backend/app/db/enhanced_session.py
"""
Enhanced Database Session Manager
Provides connection pooling, health checks, and error handling
"""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from app.core.config import settings
import logging

logger = logging.getLogger(__name__)

class DatabaseManager:
    """Enhanced database manager with health checks"""
    
    def __init__(self):
        self.engine = None
        self.SessionLocal = None
        self.is_connected = False
        self.initialize_database()
    
    def initialize_database(self):
        """Initialize database connection with enhanced configuration"""
        try:
            # Create engine with connection pooling
            self.engine = create_engine(
                settings.DATABASE_URL,
                poolclass=QueuePool,
                pool_size=10,
                max_overflow=20,
                pool_pre_ping=True,
                pool_recycle=3600,
                echo=False  # Set to True for SQL debugging
            )
            
            # Create session factory
            self.SessionLocal = sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=self.engine
            )
            
            # Test connection
            self.test_connection()
            
            logger.info("✅ Enhanced database manager initialized")
            
        except Exception as e:
            logger.error(f"❌ Database initialization failed: {e}")
            self.is_connected = False
    
    def test_connection(self):
        """Test database connection"""
        try:
            with self.engine.connect() as conn:
                conn.execute("SELECT 1")
            self.is_connected = True
            logger.info("✅ Database connection healthy")
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            self.is_connected = False
    
    def get_session(self) -> Session:
        """Get database session with error handling"""
        if not self.is_connected:
            self.test_connection()
        
        if self.SessionLocal:
            return self.SessionLocal()
        else:
            raise Exception("Database not initialized")
    
    def health_check(self) -> bool:
        """Perform database health check"""
        try:
            with self.get_session() as session:
                session.execute("SELECT 1")
            return True
        except Exception:
            return False

# Global database manager instance
db_manager = DatabaseManager()

def get_db():
    """Database dependency for FastAPI routes"""
    if not db_manager.is_connected:
        return None
    
    db = db_manager.get_session()
    try:
        yield db
    finally:
        db.close()
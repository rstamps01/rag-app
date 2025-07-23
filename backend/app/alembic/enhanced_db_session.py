from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from sqlalchemy.exc import DisconnectionError, OperationalError
from app.core.config import settings
import logging
import time

logger = logging.getLogger(__name__)

# Enhanced engine configuration with better connection handling
engine = create_engine(
    settings.DATABASE_URL,
    poolclass=QueuePool,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=3600,  # Recycle connections every hour
    pool_timeout=30,
    echo=False,
    connect_args={
        "connect_timeout": 10,
        "application_name": "rag_app"
    }
)

# Add connection event listeners for better monitoring
@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_connection, connection_record):
    """Set connection parameters on connect."""
    logger.info("New database connection established")

@event.listens_for(engine, "checkout")
def receive_checkout(dbapi_connection, connection_record, connection_proxy):
    """Log when connection is checked out from pool."""
    logger.debug("Connection checked out from pool")

@event.listens_for(engine, "checkin")
def receive_checkin(dbapi_connection, connection_record):
    """Log when connection is returned to pool."""
    logger.debug("Connection returned to pool")

# Create SessionLocal with retry logic
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db_with_retry(max_retries: int = 3, retry_delay: float = 1.0):
    """
    Database dependency with retry logic for connection failures.
    
    Args:
        max_retries: Maximum number of retry attempts
        retry_delay: Delay between retries in seconds
    """
    for attempt in range(max_retries + 1):
        try:
            db = SessionLocal()
            try:
                # Test the connection
                db.execute("SELECT 1")
                yield db
                return
            except Exception as e:
                db.close()
                raise e
        except (DisconnectionError, OperationalError) as e:
            if attempt == max_retries:
                logger.error(f"Database connection failed after {max_retries} attempts: {e}")
                raise
            
            logger.warning(f"Database connection attempt {attempt + 1} failed: {e}. Retrying in {retry_delay}s...")
            time.sleep(retry_delay)
            retry_delay *= 2  # Exponential backoff
        except Exception as e:
            logger.error(f"Unexpected database error: {e}")
            raise

def get_db():
    """Standard database dependency with retry logic."""
    return get_db_with_retry()

def check_database_health() -> bool:
    """
    Check if database is healthy and accessible.
    
    Returns:
        True if database is healthy, False otherwise
    """
    try:
        db = SessionLocal()
        try:
            result = db.execute("SELECT 1").scalar()
            return result == 1
        finally:
            db.close()
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        return False
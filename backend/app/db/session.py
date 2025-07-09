from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

# Create database engine using the correct configuration variable
engine = create_engine(
    settings.DATABASE_URL,  # Fixed: Use DATABASE_URL instead of SQLALCHEMY_DATABASE_URI
    pool_pre_ping=True,
    pool_recycle=300,
    echo=False  # Set to True for SQL query debugging
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """
    Database dependency for FastAPI routes.
    
    Yields:
        Database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
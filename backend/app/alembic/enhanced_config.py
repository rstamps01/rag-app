import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    Enhanced application settings with database optimization.
    """
    
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "RAG Application"
    
    # Enhanced Database Configuration
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://rag:rag@postgres-07:5432/rag"
    )
    
    # Database Connection Pool Settings
    DB_POOL_SIZE: int = int(os.getenv("DB_POOL_SIZE", "10"))
    DB_MAX_OVERFLOW: int = int(os.getenv("DB_MAX_OVERFLOW", "20"))
    DB_POOL_TIMEOUT: int = int(os.getenv("DB_POOL_TIMEOUT", "30"))
    DB_POOL_RECYCLE: int = int(os.getenv("DB_POOL_RECYCLE", "3600"))
    
    # Migration Settings
    ALEMBIC_CONFIG: str = "/app/alembic.ini"
    AUTO_MIGRATE: bool = os.getenv("AUTO_MIGRATE", "true").lower() == "true"
    
    # Admin User Settings
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@rag-app.com")
    ADMIN_PASSWORD: str = os.getenv("ADMIN_PASSWORD", "admin123")  # Change in production!
    
    # ... rest of existing configuration remains the same
    
    # Health Check Settings
    ENABLE_HEALTH_CHECKS: bool = True
    HEALTH_CHECK_INTERVAL: int = 60  # seconds
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
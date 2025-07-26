"""
Application configuration settings - Pydantic v2 Compatible
Fixed for AttributeError: 'Settings' object has no attribute '__pydantic_fields_set__'
"""
import os
from typing import Optional

# Try to import BaseSettings with proper fallback
try:
    from pydantic_settings import BaseSettings
    PYDANTIC_SETTINGS_AVAILABLE = True
    print("✅ Using pydantic_settings.BaseSettings")
except ImportError:
    try:
        from pydantic import BaseSettings
        PYDANTIC_SETTINGS_AVAILABLE = True
        print("✅ Using pydantic.BaseSettings (legacy)")
    except ImportError:
        PYDANTIC_SETTINGS_AVAILABLE = False
        print("⚠️  BaseSettings not available, using plain class")

if PYDANTIC_SETTINGS_AVAILABLE:
    class Settings(BaseSettings):
        """Settings class using Pydantic BaseSettings"""
        
        # API Configuration
        API_V1_STR: str = "/api/v1"
        PROJECT_NAME: str = "RAG Application"
        
        # Database Configuration  
        POSTGRES_SERVER: str = "postgres-07"
        POSTGRES_USER: str = "rag"
        POSTGRES_PASSWORD: str = "rag"
        POSTGRES_DB: str = "rag"
        POSTGRES_PORT: str = "5432"
        
        # Security Configuration
        SECRET_KEY: str = "your-secret-key-here-change-in-production"
        ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
        
        # Model Configuration
        MODEL_NAME: str = "mistralai/Mistral-7B-Instruct-v0.1"
        EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
        
        # Vector Database Configuration
        QDRANT_HOST: str = "qdrant-07"
        QDRANT_PORT: int = 6333
        COLLECTION_NAME: str = "rag"
        
        # GPU Configuration
        CUDA_VISIBLE_DEVICES: str = "0"
        
        # Environment Configuration
        ENVIRONMENT: str = "production"
        DEBUG: bool = False
        LOG_LEVEL: str = "INFO"
        
        # JWT Configuration
        JWT_SECRET: Optional[str] = None
        JWT_ALGORITHM: str = "HS256"
        
        # Hugging Face Configuration
        HUGGING_FACE_HUB_TOKEN: Optional[str] = None
        
        @property
        def DATABASE_URL(self) -> str:
            """Construct database URL from components"""
            return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        
        class Config:
            env_file = ".env"
            case_sensitive = True
            # FIXED: Don't use env_prefix to avoid conflicts
            # env_prefix = "RAG_"

else:
    # Fallback class when BaseSettings is not available
    class Settings:
        """Fallback Settings class without Pydantic BaseSettings"""
        
        def __init__(self):
            # API Configuration
            self.API_V1_STR = os.getenv("API_V1_STR", "/api/v1")
            self.PROJECT_NAME = os.getenv("PROJECT_NAME", "RAG Application")
            
            # Database Configuration
            self.POSTGRES_SERVER = os.getenv("POSTGRES_SERVER", "postgres-07")
            self.POSTGRES_USER = os.getenv("POSTGRES_USER", "rag")
            self.POSTGRES_PASSWORD = os.getenv("POSTGRES_PASSWORD", "rag")
            self.POSTGRES_DB = os.getenv("POSTGRES_DB", "rag")
            self.POSTGRES_PORT = os.getenv("POSTGRES_PORT", "5432")
            
            # Security Configuration
            self.SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
            self.ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
            
            # Model Configuration
            self.MODEL_NAME = os.getenv("MODEL_NAME", "mistralai/Mistral-7B-Instruct-v0.1")
            self.EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "sentence-transformers/all-MiniLM-L6-v2")
            
            # Vector Database Configuration
            self.QDRANT_HOST = os.getenv("QDRANT_HOST", "qdrant-07")
            self.QDRANT_PORT = int(os.getenv("QDRANT_PORT", "6333"))
            self.COLLECTION_NAME = os.getenv("COLLECTION_NAME", "rag")
            
            # GPU Configuration
            self.CUDA_VISIBLE_DEVICES = os.getenv("CUDA_VISIBLE_DEVICES", "0")
            
            # Environment Configuration
            self.ENVIRONMENT = os.getenv("ENVIRONMENT", "production")
            self.DEBUG = os.getenv("DEBUG", "false").lower() == "true"
            self.LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
            
            # JWT Configuration
            self.JWT_SECRET = os.getenv("JWT_SECRET")
            self.JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
            
            # Hugging Face Configuration
            self.HUGGING_FACE_HUB_TOKEN = os.getenv("HUGGING_FACE_HUB_TOKEN")
        
        @property
        def DATABASE_URL(self) -> str:
            """Construct database URL from components"""
            return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

# Create settings instance - CRITICAL: This must work without errors
try:
    settings = Settings()
    print("✅ Settings instance created successfully")
except Exception as e:
    print(f"❌ Failed to create settings instance: {e}")
    # Create minimal fallback settings
    class MinimalSettings:
        API_V1_STR = "/api/v1"
        PROJECT_NAME = "RAG Application"
        DATABASE_URL = "postgresql://rag:rag@postgres-07:5432/rag"
        QDRANT_HOST = "qdrant-07"
        QDRANT_PORT = 6333
        COLLECTION_NAME = "rag"
        MODEL_NAME = "mistralai/Mistral-7B-Instruct-v0.1"
        EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
        SECRET_KEY = "fallback-secret-key"
        ACCESS_TOKEN_EXPIRE_MINUTES = 30
        ENVIRONMENT = "production"
        DEBUG = False
        LOG_LEVEL = "INFO"
        
    settings = MinimalSettings()
    print("✅ Fallback settings instance created")



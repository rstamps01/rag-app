"""
Application Configuration - Fixed for Pydantic v2
Properly defines all environment variables to avoid "extra_forbidden" errors
"""

import os
from typing import Optional, List
from pydantic import Field

# Try to import pydantic_settings first (Pydantic v2)
try:
    from pydantic_settings import BaseSettings
    print("✅ Using pydantic_settings.BaseSettings")
    PYDANTIC_V2 = True
except ImportError:
    try:
        from pydantic import BaseSettings
        print("✅ Using pydantic.BaseSettings")
        PYDANTIC_V2 = False
    except ImportError:
        print("❌ Neither pydantic_settings nor pydantic.BaseSettings available")
        # Create a fallback class
        class BaseSettings:
            def __init__(self, **kwargs):
                for key, value in kwargs.items():
                    setattr(self, key, value)
        PYDANTIC_V2 = False

class Settings(BaseSettings):
    """Application settings with all environment variables properly defined"""
    
    # Core Application Settings
    PROJECT_NAME: str = Field(default="RAG Application", description="Project name")
    API_V1_STR: str = Field(default="/api/v1", description="API version prefix")
    DEBUG: bool = Field(default=False, description="Debug mode")
    
    # Database Configuration
    DATABASE_URL: str = Field(
        default="postgresql://rag:rag@postgres-07:5432/rag",
        description="Database connection URL"
    )
    SQLALCHEMY_DATABASE_URI: Optional[str] = Field(
        default=None,
        description="SQLAlchemy database URI (alternative to DATABASE_URL)"
    )
    
    # Vector Database Configuration
    QDRANT_URL: str = Field(
        default="http://qdrant-07:6333",
        description="Qdrant vector database URL"
    )
    QDRANT_COLLECTION_NAME: str = Field(
        default="rag",
        description="Qdrant collection name"
    )
    
    # Model Configuration
    LLM_MODEL_NAME: str = Field(
        default="mistralai/Mistral-7B-Instruct-v0.2",
        description="LLM model name"
    )
    EMBEDDING_MODEL_NAME: str = Field(
        default="sentence-transformers/all-MiniLM-L6-v2",
        description="Embedding model name"
    )
    
    # Cache and Model Storage
    MODELS_CACHE_DIR: str = Field(
        default="/app/models_cache",
        description="Models cache directory"
    )
    HF_HUB_CACHE: str = Field(
        default="/app/models_cache/hub",
        description="Hugging Face hub cache directory"
    )
    HF_HOME: str = Field(
        default="/app/models_cache",
        description="Hugging Face home directory"
    )
    TORCH_HOME: str = Field(
        default="/app/models_cache/torch",
        description="PyTorch home directory"
    )
    HF_HUB_OFFLINE: str = Field(
        default="false",
        description="Hugging Face hub offline mode"
    )
    
    # GPU Configuration
    USE_GPU: str = Field(default="true", description="Enable GPU usage")
    NVIDIA_VISIBLE_DEVICES: str = Field(default="0", description="Visible GPU devices")
    NVIDIA_DRIVER_CAPABILITIES: str = Field(
        default="compute,utility",
        description="NVIDIA driver capabilities"
    )
    TORCH_CUDA_ARCH_LIST: str = Field(
        default="12.0",
        description="CUDA architecture list"
    )
    CUDA_LAUNCH_BLOCKING: str = Field(
        default="0",
        description="CUDA launch blocking"
    )
    PYTORCH_CUDA_ALLOC_CONF: str = Field(
        default="max_split_size_mb:512",
        description="PyTorch CUDA allocation configuration"
    )
    
    # API Server Configuration
    API_HOST: str = Field(default="0.0.0.0", description="API host")
    API_PORT: str = Field(default="8000", description="API port")
    API_WORKERS: str = Field(default="1", description="API workers")
    
    # File Upload Configuration
    MAX_UPLOAD_SIZE: str = Field(default="100MB", description="Maximum upload size")
    ALLOWED_EXTENSIONS: str = Field(
        default="pdf,txt,docx,md",
        description="Allowed file extensions"
    )
    
    # Frontend Configuration
    REACT_APP_API_URL: str = Field(
        default="http://localhost:8000",
        description="React app API URL"
    )
    REACT_APP_ENVIRONMENT: str = Field(
        default="production",
        description="React app environment"
    )
    REACT_APP_MAX_FILE_SIZE: str = Field(
        default="104857600",
        description="React app max file size"
    )
    
    # Logging Configuration
    LOG_FILE: str = Field(
        default="/app/logs/rag-app.log",
        description="Log file path"
    )
    LOG_ROTATION: str = Field(default="daily", description="Log rotation")
    LOG_RETENTION_DAYS: str = Field(
        default="30",
        description="Log retention days"
    )
    
    # Metrics and Monitoring
    ENABLE_METRICS: str = Field(default="true", description="Enable metrics")
    METRICS_PORT: str = Field(default="9090", description="Metrics port")
    HEALTH_CHECK_INTERVAL: str = Field(
        default="30",
        description="Health check interval"
    )
    HEALTH_CHECK_TIMEOUT: str = Field(
        default="10",
        description="Health check timeout"
    )
    
    # Model Loading Configuration
    MODEL_LOAD_TIMEOUT: str = Field(
        default="300",
        description="Model load timeout"
    )
    MODEL_CACHE_STRATEGY: str = Field(
        default="local_first",
        description="Model cache strategy"
    )
    
    # Performance Configuration
    MAX_CONCURRENT_REQUESTS: str = Field(
        default="4",
        description="Maximum concurrent requests"
    )
    REQUEST_TIMEOUT: str = Field(default="120", description="Request timeout")
    BATCH_SIZE: str = Field(default="1", description="Batch size")
    TORCH_MEMORY_FRACTION: str = Field(
        default="0.8",
        description="Torch memory fraction"
    )
    ENABLE_MEMORY_EFFICIENT_ATTENTION: str = Field(
        default="true",
        description="Enable memory efficient attention"
    )
    
    # Backup Configuration
    BACKUP_ENABLED: str = Field(default="true", description="Enable backups")
    BACKUP_SCHEDULE: str = Field(default="0 2 * * *", description="Backup schedule")
    BACKUP_RETENTION_DAYS: str = Field(
        default="7",
        description="Backup retention days"
    )
    
    # CORS Configuration
    CORS_ORIGINS: str = Field(
        default="http://localhost:3000,http://localhost:8000,http://localhost:5432,http://qdrant-07:6333,",
        description="CORS origins"
    )
    CORS_METHODS: str = Field(
        default="GET,POST,PUT,DELETE,OPTIONS",
        description="CORS methods"
    )
    CORS_HEADERS: str = Field(
        default="Content-Type,Authorization",
        description="CORS headers"
    )
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: str = Field(
        default="100",
        description="Rate limit requests"
    )
    RATE_LIMIT_WINDOW: str = Field(default="60", description="Rate limit window")
    
    # Deployment Configuration
    DEPLOYMENT_USER: str = Field(default="vastdata", description="Deployment user")
    DEPLOYMENT_PATH: str = Field(
        default="/home/vastdata/rag-app-07",
        description="Deployment path"
    )
    DEPLOYMENT_VERSION: str = Field(default="1.0.0", description="Deployment version")
    DEPLOYMENT_DATE: str = Field(default="2025-07-20", description="Deployment date")
    
    # Cache Validation
    CACHE_VALIDATION_ENABLED: str = Field(
        default="true",
        description="Cache validation enabled"
    )
    CACHE_INTEGRITY_CHECK: str = Field(
        default="true",
        description="Cache integrity check"
    )
    MODEL_VERIFICATION_ON_STARTUP: str = Field(
        default="true",
        description="Model verification on startup"
    )
    MODEL_HEALTH_CHECK_INTERVAL: str = Field(
        default="30",
        description="Model health check interval"
    )
    
    # Computed properties
    @property
    def DATABASE_URL_COMPUTED(self) -> str:
        """Get database URL, preferring SQLALCHEMY_DATABASE_URI if set"""
        return self.SQLALCHEMY_DATABASE_URI or self.DATABASE_URL
    
    @property
    def CORS_ORIGINS_LIST(self) -> List[str]:
        """Get CORS origins as a list"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(',') if origin.strip()]
    
    @property
    def CORS_METHODS_LIST(self) -> List[str]:
        """Get CORS methods as a list"""
        return [method.strip() for method in self.CORS_METHODS.split(',') if method.strip()]
    
    @property
    def ALLOWED_EXTENSIONS_LIST(self) -> List[str]:
        """Get allowed extensions as a list"""
        return [ext.strip() for ext in self.ALLOWED_EXTENSIONS.split(',') if ext.strip()]
    
    # Pydantic v2 configuration
    if PYDANTIC_V2:
        class Config:
            # Allow extra fields to prevent "extra_forbidden" errors
            extra = "allow"
            # Use environment variables
            env_file = ".env"
            env_file_encoding = "utf-8"
            case_sensitive = True
    else:
        class Config:
            env_file = ".env"
            env_file_encoding = "utf-8"
            case_sensitive = True

# Create settings instance with error handling
def create_settings():
    """Create settings instance with proper error handling"""
    try:
        settings = Settings()
        print("✅ Settings instance created successfully")
        return settings
    except Exception as e:
        print(f"❌ Failed to create settings instance: {e}")
        
        # Create fallback settings
        class FallbackSettings:
            PROJECT_NAME = "RAG Application"
            API_V1_STR = "/api/v1"
            DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://rag:rag@postgres-07:5432/rag")
            QDRANT_URL = os.getenv("QDRANT_URL", "http://qdrant-07:6333")
            LLM_MODEL_NAME = os.getenv("LLM_MODEL_NAME", "mistralai/Mistral-7B-Instruct-v0.2")
            EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")
            
            @property
            def DATABASE_URL_COMPUTED(self):
                return self.DATABASE_URL
            
            @property
            def CORS_ORIGINS_LIST(self):
                return ["http://localhost:3000", "http://localhost:8000"]
            
            @property
            def CORS_METHODS_LIST(self):
                return ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
            
            @property
            def ALLOWED_EXTENSIONS_LIST(self):
                return ["pdf", "txt", "docx", "md"]
        
        print("✅ Fallback settings instance created")
        return FallbackSettings()

# Create the settings instance
settings = create_settings()

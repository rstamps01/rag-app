import os
from typing import Optional
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    """
    Application settings with environment variable support.
    """
    
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "RAG Application"
    
    # Database Configuration
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://rag_user:rag_password@postgres:5432/rag_db"
    )
    
    # Security Configuration
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # Hugging Face Configuration
    HUGGINGFACE_TOKEN: Optional[str] = os.getenv("HUGGINGFACE_TOKEN")
    
    # LLM Configuration
    LLM_MODEL_NAME: str = "mistralai/Mistral-7B-Instruct-v0.2"
    CONTEXT_WINDOW_SIZE: int = 4096
    
    # OCR Configuration
    ENABLE_OCR: bool = True
    OCR_LANGUAGE: str = "eng"
    
    # File Storage Configuration
    UPLOAD_DIR: str = "/app/uploads"
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB
    
    # Vector Database Configuration
    QDRANT_HOST: str = os.getenv("QDRANT_HOST", "qdrant")
    QDRANT_PORT: int = int(os.getenv("QDRANT_PORT", "6333"))
    
    # GPU Configuration
    ENABLE_GPU: bool = True
    GPU_MEMORY_FRACTION: float = 0.8
    
    # Monitoring Configuration
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    ENABLE_METRICS: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Create global settings instance
settings = Settings()

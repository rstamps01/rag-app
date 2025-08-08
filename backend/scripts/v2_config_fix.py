#!/usr/bin/env python3
"""
Config Fix Script V2 - Fixed for current Pydantic version
This fixes the BaseSettings import issue and creates a working config.py
"""

import os

# Create the proper config.py content with correct Pydantic imports
config_content = '''"""
Application configuration settings
"""
import os
from typing import Optional

try:
    # Try new pydantic-settings import first
    from pydantic_settings import BaseSettings
except ImportError:
    try:
        # Fallback to older pydantic import
        from pydantic import BaseSettings
    except ImportError:
        # If neither works, create a simple class
        class BaseSettings:
            def __init__(self, **kwargs):
                for key, value in kwargs.items():
                    setattr(self, key, value)

class Settings(BaseSettings):
    """
    Application settings with environment variable support
    """
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "RAG AI Application"
    VERSION: str = "1.1.0"
    
    # Database Configuration
    DATABASE_URL: Optional[str] = None
    
    # Security Configuration
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS Configuration
    BACKEND_CORS_ORIGINS: list = ["*"]  # In production, restrict this
    
    # File Upload Configuration
    MAX_FILE_SIZE: int = 100 * 1024 * 1024  # 100MB
    UPLOAD_DIR: str = "/app/data/uploads"
    
    # Model Configuration
    MODELS_CACHE_DIR: str = "/app/models_cache"
    EMBEDDING_MODEL: str = "sentence-transformers/all-MiniLM-L6-v2"
    LLM_MODEL: str = "mistralai/Mistral-7B-Instruct-v0.2"
    
    # Vector Database Configuration
    QDRANT_URL: str = "http://localhost:6333"
    QDRANT_COLLECTION: str = "rag"
    
    # GPU Configuration
    CUDA_VISIBLE_DEVICES: str = "0"
    GPU_MEMORY_FRACTION: float = 0.9
    
    # Monitoring Configuration
    ENABLE_MONITORING: bool = True
    MONITORING_WEBSOCKET_PATH: str = "/api/v1/monitoring/ws"
    
    # Logging Configuration
    LOG_LEVEL: str = "INFO"
    
    def __init__(self, **kwargs):
        # Initialize with environment variables
        self.DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://rag:rag@postgres-07:5432/rag")
        self.SECRET_KEY = os.getenv("SECRET_KEY", self.SECRET_KEY)
        self.QDRANT_URL = os.getenv("QDRANT_URL", self.QDRANT_URL)
        self.CUDA_VISIBLE_DEVICES = os.getenv("CUDA_VISIBLE_DEVICES", self.CUDA_VISIBLE_DEVICES)
        self.LOG_LEVEL = os.getenv("LOG_LEVEL", self.LOG_LEVEL)
        
        # Apply any additional kwargs
        for key, value in kwargs.items():
            setattr(self, key, value)

# Create the global settings instance
settings = Settings()

# Export commonly used values for backward compatibility
API_V1_STR = settings.API_V1_STR
DATABASE_URL = settings.DATABASE_URL
SECRET_KEY = settings.SECRET_KEY
'''

def fix_config():
    """Fix the config.py file by creating proper settings"""
    print("🔧 Fixing app/core/config.py (V2 - Pydantic compatible)...")
    
    # Navigate to project directory
    project_dir = os.path.expanduser("~/rag-app-07")
    if not os.path.exists(project_dir):
        print(f"❌ Project directory not found: {project_dir}")
        return False
    
    config_path = os.path.join(project_dir, "backend/app/core/config.py")
    
    # Write the new config
    try:
        with open(config_path, 'w') as f:
            f.write(config_content)
        print(f"✅ Created new config.py with Pydantic-compatible settings")
        return True
    except Exception as e:
        print(f"❌ Error writing config.py: {e}")
        return False

def install_pydantic_settings():
    """Install pydantic-settings if needed"""
    print("🔧 Installing pydantic-settings...")
    
    try:
        # Try to install pydantic-settings in the container
        result = os.system("docker exec backend-07 pip install pydantic-settings")
        if result == 0:
            print("✅ pydantic-settings installed successfully")
            return True
        else:
            print("⚠️  Could not install pydantic-settings, using fallback config")
            return False
    except Exception as e:
        print(f"⚠️  Error installing pydantic-settings: {e}")
        return False

def create_simple_config():
    """Create a simple config without BaseSettings dependency"""
    print("🔧 Creating simple config without BaseSettings...")
    
    simple_config = '''"""
Application configuration settings - Simple version
"""
import os

class Settings:
    """Simple settings class without BaseSettings dependency"""
    
    def __init__(self):
        # API Configuration
        self.API_V1_STR = "/api/v1"
        self.PROJECT_NAME = "RAG AI Application"
        self.VERSION = "1.1.0"
        
        # Database Configuration
        self.DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://rag:rag@postgres-07:5432/rag")
        
        # Security Configuration
        self.SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
        self.ACCESS_TOKEN_EXPIRE_MINUTES = 30
        
        # CORS Configuration
        self.BACKEND_CORS_ORIGINS = ["*"]
        
        # File Upload Configuration
        self.MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB
        self.UPLOAD_DIR = "/app/data/uploads"
        
        # Model Configuration
        self.MODELS_CACHE_DIR = "/app/models_cache"
        self.EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
        self.LLM_MODEL = "mistralai/Mistral-7B-Instruct-v0.2"
        
        # Vector Database Configuration
        self.QDRANT_URL = os.getenv("QDRANT_URL", "http://localhost:6333")
        self.QDRANT_COLLECTION = "rag"
        
        # GPU Configuration
        self.CUDA_VISIBLE_DEVICES = os.getenv("CUDA_VISIBLE_DEVICES", "0")
        self.GPU_MEMORY_FRACTION = 0.9
        
        # Monitoring Configuration
        self.ENABLE_MONITORING = True
        self.MONITORING_WEBSOCKET_PATH = "/api/v1/monitoring/ws"
        
        # Logging Configuration
        self.LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")

# Create the global settings instance
settings = Settings()

# Export commonly used values for backward compatibility
API_V1_STR = settings.API_V1_STR
DATABASE_URL = settings.DATABASE_URL
SECRET_KEY = settings.SECRET_KEY
'''
    
    project_dir = os.path.expanduser("~/rag-app-07")
    config_path = os.path.join(project_dir, "backend/app/core/config.py")
    
    try:
        with open(config_path, 'w') as f:
            f.write(simple_config)
        print(f"✅ Created simple config.py without BaseSettings")
        return True
    except Exception as e:
        print(f"❌ Error writing simple config.py: {e}")
        return False

def verify_config():
    """Verify the config fix worked"""
    print("🔍 Verifying config fix...")
    
    try:
        # Test the config inside the container
        result = os.system('docker exec backend-07 python -c "from app.core.config import settings; print(f\\"Settings loaded: API_V1_STR={settings.API_V1_STR}\\")"')
        if result == 0:
            print("✅ Settings imported successfully in container")
            return True
        else:
            print("❌ Config verification failed in container")
            return False
    except Exception as e:
        print(f"❌ Config verification error: {e}")
        return False

def restart_container():
    """Restart the backend container"""
    print("🔄 Restarting backend container...")
    
    try:
        os.chdir(os.path.expanduser("~/rag-app-07"))
        result = os.system("docker-compose restart backend-07")
        if result == 0:
            print("✅ Container restarted successfully")
            return True
        else:
            print("❌ Container restart failed")
            return False
    except Exception as e:
        print(f"❌ Error restarting container: {e}")
        return False

def check_container_logs():
    """Check container logs for router loading"""
    print("📋 Checking container logs for router status...")
    
    try:
        os.system("docker-compose logs backend-07 --tail=20 | grep -E '(router|Router|WARNING|ERROR)'")
    except Exception as e:
        print(f"❌ Error checking logs: {e}")

if __name__ == "__main__":
    print("🚀 RAG Application Config Fix V2")
    print("=" * 40)
    
    # Step 1: Try to install pydantic-settings
    pydantic_installed = install_pydantic_settings()
    
    # Step 2: Create appropriate config
    if pydantic_installed:
        success = fix_config()
    else:
        success = create_simple_config()
    
    if not success:
        print("❌ Config creation failed, exiting")
        exit(1)
    
    # Step 3: Restart container
    if not restart_container():
        print("❌ Container restart failed, exiting")
        exit(1)
    
    # Step 4: Wait and verify
    import time
    print("⏳ Waiting for container to start...")
    time.sleep(15)
    
    # Step 5: Verify config works
    verify_config()
    
    # Step 6: Check logs
    check_container_logs()
    
    print("")
    print("🎉 Config fix V2 completed!")
    print("📋 Next steps:")
    print("   1. Check if routers are now loading in the logs above")
    print("   2. Test API endpoints: curl http://localhost:8000/api/v1/queries/history")
    print("   3. If still 404, the routers may have other import issues")
    print("")
    print("🔗 Test your application:")
    print("   Main API: http://localhost:8000/")
    print("   Health: http://localhost:8000/health")
    print("   Docs: http://localhost:8000/docs")



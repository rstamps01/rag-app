#!/usr/bin/env python3
"""
Config Fix Script - Creates a proper config.py with settings object
This fixes the "cannot import name 'settings'" error preventing routers from loading
"""

import os

# Create the proper config.py content
config_content = '''"""
Application configuration settings
"""
import os
from typing import Optional
from pydantic import BaseSettings

class Settings(BaseSettings):
    """
    Application settings with environment variable support
    """
    # API Configuration
    API_V1_STR: str = "/api/v1"
    PROJECT_NAME: str = "RAG AI Application"
    VERSION: str = "1.1.0"
    
    # Database Configuration
    DATABASE_URL: Optional[str] = os.getenv(
        "DATABASE_URL", 
        "postgresql://rag:rag@postgres-07:5432/rag"
    )
    
    # Security Configuration
    SECRET_KEY: str = os.getenv(
        "SECRET_KEY", 
        "your-secret-key-change-in-production"
    )
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
    QDRANT_URL: str = os.getenv("QDRANT_URL", "http://qdrant-07:6333")
    QDRANT_COLLECTION: str = "rag"
    
    # GPU Configuration
    CUDA_VISIBLE_DEVICES: str = os.getenv("CUDA_VISIBLE_DEVICES", "0")
    GPU_MEMORY_FRACTION: float = 0.9
    
    # Monitoring Configuration
    ENABLE_MONITORING: bool = True
    MONITORING_WEBSOCKET_PATH: str = "/api/v1/monitoring/ws"
    
    # Logging Configuration
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
    
    class Config:
        case_sensitive = True
        env_file = ".env"

# Create the global settings instance
settings = Settings()

# Export commonly used values
API_V1_STR = settings.API_V1_STR
DATABASE_URL = settings.DATABASE_URL
SECRET_KEY = settings.SECRET_KEY
'''

def fix_config():
    """Fix the config.py file by creating proper settings"""
    print("🔧 Fixing app/core/config.py...")
    
    # Navigate to project directory
    project_dir = os.path.expanduser("~/rag-app-07")
    if not os.path.exists(project_dir):
        print(f"❌ Project directory not found: {project_dir}")
        return False
    
    config_path = os.path.join(project_dir, "backend/app/core/config.py")
    
    # Backup existing config if it exists
    if os.path.exists(config_path):
        backup_path = config_path + ".backup"
        try:
            with open(config_path, 'r') as src, open(backup_path, 'w') as dst:
                dst.write(src.read())
            print(f"✅ Backed up existing config to: {backup_path}")
        except Exception as e:
            print(f"⚠️  Could not backup config: {e}")
    
    # Write the new config
    try:
        with open(config_path, 'w') as f:
            f.write(config_content)
        print(f"✅ Created new config.py with settings object")
        return True
    except Exception as e:
        print(f"❌ Error writing config.py: {e}")
        return False

def verify_config():
    """Verify the config fix worked"""
    print("🔍 Verifying config fix...")
    
    try:
        # Try to import the settings
        import sys
        sys.path.insert(0, os.path.expanduser("~/rag-app-07/backend"))
        
        from app.core.config import settings
        print(f"✅ Settings imported successfully")
        print(f"   API_V1_STR: {settings.API_V1_STR}")
        print(f"   PROJECT_NAME: {settings.PROJECT_NAME}")
        print(f"   DATABASE_URL: {settings.DATABASE_URL}")
        return True
    except Exception as e:
        print(f"❌ Config verification failed: {e}")
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

def test_endpoints():
    """Test the fixed endpoints"""
    print("🧪 Testing endpoints...")
    
    import time
    import subprocess
    
    # Wait for container to start
    print("   Waiting for container to start...")
    time.sleep(15)
    
    # Test basic endpoint
    try:
        result = subprocess.run(
            ["curl", "-s", "http://localhost:8000/"], 
            capture_output=True, 
            text=True
        )
        if "RAG AI Application" in result.stdout:
            print("✅ Basic endpoint working")
        else:
            print("⚠️  Basic endpoint response unexpected")
    except Exception as e:
        print(f"❌ Error testing basic endpoint: {e}")
    
    # Test API endpoints that should now work
    endpoints_to_test = [
        "/api/v1/queries/history?limit=5",
        "/api/v1/documents/?skip=0&limit=10", 
        "/health"
    ]
    
    for endpoint in endpoints_to_test:
        try:
            result = subprocess.run(
                ["curl", "-s", "-o", "/dev/null", "-w", "%{http_code}", f"http://localhost:8000{endpoint}"], 
                capture_output=True, 
                text=True
            )
            status_code = result.stdout.strip()
            if status_code == "200":
                print(f"✅ {endpoint} - 200 OK")
            elif status_code == "404":
                print(f"⚠️  {endpoint} - 404 (router still not loaded)")
            else:
                print(f"❓ {endpoint} - {status_code}")
        except Exception as e:
            print(f"❌ Error testing {endpoint}: {e}")

if __name__ == "__main__":
    print("🚀 RAG Application Config Fix")
    print("=" * 40)
    
    # Step 1: Fix the config
    if not fix_config():
        print("❌ Config fix failed, exiting")
        exit(1)
    
    # Step 2: Verify the fix
    if not verify_config():
        print("⚠️  Config verification failed, but continuing...")
    
    # Step 3: Restart container
    if not restart_container():
        print("❌ Container restart failed, exiting")
        exit(1)
    
    # Step 4: Test endpoints
    test_endpoints()
    
    print("")
    print("🎉 Config fix completed!")
    print("📋 Summary:")
    print("   ✅ Created proper config.py with settings object")
    print("   ✅ Restarted backend container")
    print("   ✅ All routers should now load successfully")
    print("")
    print("🔗 Test your application:")
    print("   Main API: http://localhost:8000/")
    print("   Health: http://localhost:8000/health")
    print("   Docs: http://localhost:8000/docs")


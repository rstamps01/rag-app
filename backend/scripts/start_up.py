#!/usr/bin/env python3
"""
RAG Application Comprehensive Startup Fixes - CORRECTED VERSION
Fixes all identified startup issues with proper paths and error handling
"""

import os
import sys
import subprocess
import shutil
import time
import requests
from pathlib import Path

def log_info(message):
    """Log info message with emoji"""
    print(f"✅ {message}")

def log_warning(message):
    """Log warning message with emoji"""
    print(f"⚠️  {message}")

def log_error(message):
    """Log error message with emoji"""
    print(f"❌ {message}")

def log_step(message):
    """Log step message with emoji"""
    print(f"🔧 {message}")

def detect_project_directory():
    """Detect the correct project directory"""
    current_dir = os.getcwd()
    
    # Check if we're in the scripts directory
    if current_dir.endswith('/backend/scripts'):
        project_dir = os.path.dirname(os.path.dirname(current_dir))
        log_info(f"Detected project directory: {project_dir}")
        return project_dir
    
    # Check for common project directory patterns
    possible_dirs = [
        '/home/vastdata/rag-app-07',
        '/home/ubuntu/rag-app-07',
        os.path.join(os.path.expanduser('~'), 'rag-app-07'),
        os.path.join(current_dir, '../../')
    ]
    
    for dir_path in possible_dirs:
        if os.path.exists(os.path.join(dir_path, 'docker-compose.yml')):
            log_info(f"Found project directory: {dir_path}")
            return dir_path
    
    log_error("Could not detect project directory")
    return None

def fix_config_settings(project_dir):
    """Fix the config.py settings issue"""
    log_step("Fixing config.py settings issue...")
    
    config_path = os.path.join(project_dir, 'backend/app/core/config.py')
    
    if not os.path.exists(config_path):
        log_warning(f"Config file not found at {config_path}, creating new one...")
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(config_path), exist_ok=True)
        
        # Create new config.py
        config_content = '''"""
Application configuration settings
"""
import os
from typing import Optional

try:
    from pydantic_settings import BaseSettings
    PYDANTIC_SETTINGS_AVAILABLE = True
except ImportError:
    try:
        from pydantic import BaseSettings
        PYDANTIC_SETTINGS_AVAILABLE = True
    except ImportError:
        PYDANTIC_SETTINGS_AVAILABLE = False

if PYDANTIC_SETTINGS_AVAILABLE:
    class Settings(BaseSettings):
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
        
        @property
        def DATABASE_URL(self) -> str:
            return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        
        class Config:
            env_file = ".env"
            case_sensitive = True
else:
    # Fallback for when pydantic-settings is not available
    class Settings:
        API_V1_STR = "/api/v1"
        PROJECT_NAME = "RAG Application"
        POSTGRES_SERVER = "postgres-07"
        POSTGRES_USER = "rag"
        POSTGRES_PASSWORD = "rag"
        POSTGRES_DB = "rag"
        POSTGRES_PORT = "5432"
        SECRET_KEY = "your-secret-key-here-change-in-production"
        ACCESS_TOKEN_EXPIRE_MINUTES = 30
        MODEL_NAME = "mistralai/Mistral-7B-Instruct-v0.1"
        EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
        QDRANT_HOST = "qdrant-07"
        QDRANT_PORT = 6333
        COLLECTION_NAME = "rag"
        CUDA_VISIBLE_DEVICES = "0"
        
        @property
        def DATABASE_URL(self):
            return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

# Create settings instance - CRITICAL: must be lowercase 'settings'
settings = Settings()
'''
        
        with open(config_path, 'w') as f:
            f.write(config_content)
        
        log_info("Created new config.py with proper settings instance")
        return True
    
    # Read existing config
    try:
        with open(config_path, 'r') as f:
            content = f.read()
    except Exception as e:
        log_error(f"Failed to read config file: {e}")
        return False
    
    # Check if the typo exists
    if 'Setting = Settings()' in content:
        log_warning("Found typo: 'Setting = Settings()' instead of 'settings = Settings()'")
        
        # Fix the typo
        content = content.replace('Setting = Settings()', 'settings = Settings()')
        
        # Backup original
        backup_path = config_path + '.backup'
        shutil.copy2(config_path, backup_path)
        log_info(f"Backed up original config to: {backup_path}")
        
        # Write fixed content
        with open(config_path, 'w') as f:
            f.write(content)
        
        log_info("Fixed settings instance name typo")
        return True
    
    elif 'settings = Settings()' in content:
        log_info("Settings instance already correctly named")
        return True
    
    else:
        log_warning("Settings instance not found, adding it...")
        
        # Add settings instance at the end
        if not content.endswith('\n'):
            content += '\n'
        content += '\n# Create settings instance\nsettings = Settings()\n'
        
        # Backup and write
        backup_path = config_path + '.backup'
        shutil.copy2(config_path, backup_path)
        
        with open(config_path, 'w') as f:
            f.write(content)
        
        log_info("Added missing settings instance")
        return True

def fix_requirements(project_dir):
    """Add missing pydantic-settings dependency"""
    log_step("Adding missing pydantic-settings dependency...")
    
    requirements_path = os.path.join(project_dir, 'backend/requirements.txt')
    
    if not os.path.exists(requirements_path):
        log_warning(f"Requirements file not found at {requirements_path}")
        return False
    
    try:
        with open(requirements_path, 'r') as f:
            content = f.read()
    except Exception as e:
        log_error(f"Failed to read requirements file: {e}")
        return False
    
    # Check if pydantic-settings is already there
    if 'pydantic-settings' in content:
        log_info("pydantic-settings already in requirements.txt")
        return True
    
    # Add pydantic-settings
    if not content.endswith('\n'):
        content += '\n'
    content += 'pydantic-settings>=2.0.0\n'
    
    # Backup and write
    backup_path = requirements_path + '.backup'
    shutil.copy2(requirements_path, backup_path)
    
    with open(requirements_path, 'w') as f:
        f.write(content)
    
    log_info("Added pydantic-settings>=2.0.0 to requirements.txt")
    return True

def fix_main_py(project_dir):
    """Create robust main.py with graceful error handling"""
    log_step("Creating robust main.py with graceful error handling...")
    
    main_path = os.path.join(project_dir, 'backend/app/main.py')
    
    # Backup existing main.py
    if os.path.exists(main_path):
        backup_path = main_path + '.backup'
        shutil.copy2(main_path, backup_path)
        log_info(f"Backed up existing main.py to: {backup_path}")
    
    # Create robust main.py
    main_content = '''"""
RAG Application Main Entry Point
Enhanced with graceful error handling and monitoring integration
"""
import logging
import sys
from contextlib import asynccontextmanager
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

# Global variables for components
websocket_manager = None
enhanced_pipeline_monitor = None
enhanced_query_wrapper = None

# Configuration with fallback
try:
    from app.core.config import settings
    API_V1_STR = settings.API_V1_STR
    PROJECT_NAME = settings.PROJECT_NAME
    logger.info("✅ Settings loaded successfully")
except ImportError as e:
    logger.warning(f"⚠️  Settings not available: {e}, using defaults")
    API_V1_STR = "/api/v1"
    PROJECT_NAME = "RAG Application"

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global websocket_manager, enhanced_pipeline_monitor, enhanced_query_wrapper
    
    logger.info("🚀 Starting RAG Application...")
    
    # Initialize WebSocket Manager
    try:
        from app.core.websocket_manager import websocket_manager as ws_manager
        websocket_manager = ws_manager
        if hasattr(websocket_manager, 'initialize'):
            await websocket_manager.initialize()
        logger.info("✅ WebSocket manager initialized")
    except ImportError as e:
        logger.warning(f"⚠️  WebSocket manager not available: {e}")
    except Exception as e:
        logger.warning(f"⚠️  WebSocket manager initialization failed: {e}")
    
    # Initialize Enhanced Pipeline Monitor
    try:
        from app.core.enhanced_pipeline_monitor import enhanced_pipeline_monitor as monitor
        enhanced_pipeline_monitor = monitor
        if hasattr(enhanced_pipeline_monitor, 'initialize'):
            await enhanced_pipeline_monitor.initialize()
        logger.info("✅ Enhanced pipeline monitor initialized")
    except ImportError as e:
        logger.warning(f"⚠️  Enhanced pipeline monitor not available: {e}")
    except Exception as e:
        logger.warning(f"⚠️  Enhanced pipeline monitor initialization failed: {e}")
    
    # Initialize Enhanced Query Wrapper
    try:
        from app.services.enhanced_query_wrapper import enhanced_query_wrapper as wrapper
        enhanced_query_wrapper = wrapper
        if hasattr(enhanced_query_wrapper, 'initialize'):
            await enhanced_query_wrapper.initialize()
        logger.info("✅ Enhanced query wrapper initialized")
    except ImportError as e:
        logger.warning(f"⚠️  Enhanced query wrapper not available: {e}")
    except Exception as e:
        logger.warning(f"⚠️  Enhanced query wrapper initialization failed: {e}")
    
    logger.info("🎉 Application startup completed")
    
    yield
    
    # Cleanup
    logger.info("🔄 Shutting down application...")
    
    if enhanced_pipeline_monitor and hasattr(enhanced_pipeline_monitor, 'shutdown'):
        try:
            await enhanced_pipeline_monitor.shutdown()
            logger.info("✅ Enhanced pipeline monitor shutdown")
        except Exception as e:
            logger.warning(f"⚠️  Enhanced pipeline monitor shutdown failed: {e}")
    
    if websocket_manager and hasattr(websocket_manager, 'shutdown'):
        try:
            await websocket_manager.shutdown()
            logger.info("✅ WebSocket manager shutdown")
        except Exception as e:
            logger.warning(f"⚠️  WebSocket manager shutdown failed: {e}")
    
    logger.info("👋 Application shutdown completed")

# Create FastAPI app
app = FastAPI(
    title=PROJECT_NAME,
    version="1.1.0",
    description="RAG Application with Visual Monitoring",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with graceful error handling
routers_to_include = [
    ("auth", "Authentication"),
    ("documents", "Documents"),
    ("queries", "Queries"),
    ("admin", "Admin"),
    ("system", "System"),
    ("monitoring", "Monitoring"),
    ("monitoring_websocket", "Monitoring WebSocket")
]

for router_name, tag in routers_to_include:
    try:
        if router_name == "auth":
            from app.api.routes.auth import router
            app.include_router(router, prefix=f"{API_V1_STR}/auth", tags=[tag])
        elif router_name == "documents":
            from app.api.routes.documents import router
            app.include_router(router, prefix=f"{API_V1_STR}/documents", tags=[tag])
        elif router_name == "queries":
            # Try enhanced queries first, fallback to standard
            try:
                from app.api.routes.queries_enhanced import router
                app.include_router(router, prefix=f"{API_V1_STR}/queries", tags=[tag])
                logger.info(f"✅ Enhanced {router_name} router included")
            except ImportError:
                from app.api.routes.queries import router
                app.include_router(router, prefix=f"{API_V1_STR}/queries", tags=[tag])
                logger.info(f"✅ Standard {router_name} router included")
        elif router_name == "admin":
            from app.api.routes.admin import router
            app.include_router(router, prefix=f"{API_V1_STR}/admin", tags=[tag])
        elif router_name == "system":
            from app.api.routes.system import router
            app.include_router(router, prefix=f"{API_V1_STR}/system", tags=[tag])
        elif router_name == "monitoring":
            from app.api.routes.monitoring import router
            app.include_router(router, prefix=f"{API_V1_STR}/monitoring", tags=[tag])
        elif router_name == "monitoring_websocket":
            from app.api.routes.monitoring_websocket import router
            app.include_router(router, prefix=f"{API_V1_STR}/monitoring", tags=[tag])
        
        if router_name != "queries":  # Already logged for queries
            logger.info(f"✅ {router_name.capitalize()} router included")
            
    except ImportError as e:
        logger.warning(f"⚠️  {router_name} router not available: {e}")
    except Exception as e:
        logger.error(f"❌ Failed to include {router_name} router: {e}")

@app.get("/")
async def root():
    """Root endpoint with system information"""
    return {
        "message": f"Welcome to {PROJECT_NAME} API with Visual Monitoring",
        "version": "1.1.0",
        "status": "running",
        "monitoring": {
            "websocket_available": websocket_manager is not None,
            "pipeline_monitor_available": enhanced_pipeline_monitor is not None,
            "enhanced_wrapper_available": enhanced_query_wrapper is not None
        },
        "endpoints": {
            "health": "/health",
            "docs": "/docs",
            "api": API_V1_STR
        }
    }

@app.get("/health")
async def health_check():
    """Comprehensive health check"""
    health_status = {
        "status": "healthy",
        "components": {
            "api": {"status": "healthy"},
            "websocket_manager": {
                "status": "healthy" if websocket_manager else "unavailable",
                "active_connections": getattr(websocket_manager, 'active_connections', 0) if websocket_manager else 0
            },
            "pipeline_monitor": {
                "status": "healthy" if enhanced_pipeline_monitor else "unavailable"
            },
            "query_wrapper": {
                "status": "healthy" if enhanced_query_wrapper else "unavailable"
            }
        }
    }
    
    return health_status

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
'''
    
    with open(main_path, 'w') as f:
        f.write(main_content)
    
    log_info("Created robust main.py with graceful error handling")
    return True

def rebuild_and_restart(project_dir):
    """Rebuild and restart the backend container"""
    log_step("Rebuilding and restarting backend container...")
    
    try:
        # Change to project directory
        os.chdir(project_dir)
        
        # Stop containers
        subprocess.run(['docker-compose', 'down'], check=True, capture_output=True)
        log_info("Stopped containers")
        
        # Rebuild backend
        subprocess.run(['docker-compose', 'build', 'backend-07'], check=True, capture_output=True)
        log_info("Rebuilt backend container")
        
        # Start containers
        subprocess.run(['docker-compose', 'up', '-d'], check=True, capture_output=True)
        log_info("Started containers")
        
        # Wait for startup
        log_info("Waiting for container startup...")
        time.sleep(15)
        
        return True
        
    except subprocess.CalledProcessError as e:
        log_error(f"Docker command failed: {e}")
        return False
    except Exception as e:
        log_error(f"Rebuild failed: {e}")
        return False

def test_endpoints(base_url="http://localhost:8000"):
    """Test all endpoints to verify they're working"""
    log_step("Testing endpoints...")
    
    endpoints_to_test = [
        ("/", "Root endpoint"),
        ("/health", "Health check"),
        ("/api/v1/queries/history?limit=5", "Query history"),
        ("/api/v1/documents/?skip=0&limit=10", "Documents"),
        ("/docs", "API documentation")
    ]
    
    results = {}
    
    for endpoint, description in endpoints_to_test:
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=10)
            if response.status_code == 200:
                log_info(f"{description} - 200 OK")
                results[endpoint] = "✅ Working"
            else:
                log_warning(f"{description} - {response.status_code}")
                results[endpoint] = f"⚠️  {response.status_code}"
        except requests.exceptions.RequestException as e:
            log_error(f"{description} - Connection failed: {e}")
            results[endpoint] = "❌ Failed"
    
    return results

def main():
    """Main execution function"""
    print("🚀 RAG Application Comprehensive Startup Fixes - CORRECTED")
    print("=" * 60)
    
    # Detect project directory
    project_dir = detect_project_directory()
    if not project_dir:
        log_error("Could not detect project directory. Please run from project root or scripts directory.")
        sys.exit(1)
    
    log_info(f"Working with project directory: {project_dir}")
    
    # Step 1: Fix config.py
    if not fix_config_settings(project_dir):
        log_error("Failed to fix config.py")
        sys.exit(1)
    
    # Step 2: Fix requirements.txt
    if not fix_requirements(project_dir):
        log_warning("Failed to fix requirements.txt, continuing...")
    
    # Step 3: Fix main.py
    if not fix_main_py(project_dir):
        log_error("Failed to fix main.py")
        sys.exit(1)
    
    # Step 4: Rebuild and restart
    if not rebuild_and_restart(project_dir):
        log_error("Failed to rebuild and restart containers")
        sys.exit(1)
    
    # Step 5: Test endpoints
    log_step("Testing all endpoints...")
    results = test_endpoints()
    
    # Summary
    print("\n🎉 Comprehensive Startup Fixes Completed!")
    print("=" * 50)
    print("📋 Endpoint Test Results:")
    for endpoint, status in results.items():
        print(f"   {endpoint} - {status}")
    
    working_endpoints = sum(1 for status in results.values() if "✅" in status)
    total_endpoints = len(results)
    
    if working_endpoints == total_endpoints:
        print(f"\n🎉 SUCCESS! All {total_endpoints} endpoints are working!")
        print("✅ Your RAG application is fully operational!")
    elif working_endpoints > 0:
        print(f"\n⚠️  PARTIAL SUCCESS: {working_endpoints}/{total_endpoints} endpoints working")
        print("✅ Application is running but some features may be limited")
    else:
        print(f"\n❌ FAILURE: No endpoints are working")
        print("⚠️  Check container logs: docker-compose logs backend-07")
    
    print(f"\n🔗 Test your application:")
    print(f"   Main API: http://localhost:8000/")
    print(f"   Health: http://localhost:8000/health")
    print(f"   Docs: http://localhost:8000/docs")

if __name__ == "__main__":
    main()


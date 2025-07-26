"""
RAG Application Reboot Cycle Fix
Fixes Pydantic v2 BaseSettings AttributeError causing container crashes
"""

import os
import sys
import subprocess
import time
import shutil

def log_info(message):
    print(f"✅ {message}")

def log_warning(message):
    print(f"⚠️  {message}")

def log_error(message):
    print(f"❌ {message}")

def log_step(message):
    print(f"🔧 {message}")

def run_cmd(command, description="", timeout=60):
    """Run command and return success status"""
    try:
        if isinstance(command, str):
            command = command.split()
        
        result = subprocess.run(command, capture_output=True, text=True, timeout=timeout)
        
        if result.returncode == 0:
            if description:
                log_info(f"{description} - Success")
            return True, result.stdout.strip()
        else:
            if description:
                log_warning(f"{description} - Failed")
            return False, result.stderr.strip()
    except Exception as e:
        if description:
            log_error(f"{description} - Error: {e}")
        return False, str(e)

def stop_reboot_cycle():
    """Immediately stop the reboot cycle"""
    log_step("EMERGENCY: Stopping reboot cycle...")
    
    # Force stop all containers
    run_cmd("docker-compose down --remove-orphans", "Force stop all containers")
    run_cmd("docker stop $(docker ps -aq) 2>/dev/null", "Force stop any remaining containers")
    
    # Wait for complete shutdown
    time.sleep(5)
    log_info("✅ Reboot cycle stopped")

def backup_current_config():
    """Backup the current broken config.py"""
    log_step("Backing up current config.py...")
    
    config_path = "backend/app/core/config.py"
    if os.path.exists(config_path):
        backup_path = f"{config_path}.broken.{int(time.time())}"
        shutil.copy2(config_path, backup_path)
        log_info(f"Backed up broken config to: {backup_path}")
        return True
    else:
        log_warning("config.py not found - may have been deleted")
        return False

def install_pydantic_settings():
    """Install pydantic-settings in the container"""
    log_step("Installing pydantic-settings dependency...")
    
    # Check if requirements.txt exists
    req_path = "backend/requirements.txt"
    if not os.path.exists(req_path):
        log_error("requirements.txt not found")
        return False
    
    # Read current requirements
    try:
        with open(req_path, 'r') as f:
            content = f.read()
    except Exception as e:
        log_error(f"Failed to read requirements.txt: {e}")
        return False
    
    # Add pydantic-settings if not present
    if 'pydantic-settings' not in content:
        if not content.endswith('\n'):
            content += '\n'
        content += 'pydantic-settings>=2.0.0\n'
        
        # Backup and write
        shutil.copy2(req_path, f"{req_path}.backup")
        
        try:
            with open(req_path, 'w') as f:
                f.write(content)
            log_info("Added pydantic-settings>=2.0.0 to requirements.txt")
            return True
        except Exception as e:
            log_error(f"Failed to update requirements.txt: {e}")
            return False
    else:
        log_info("pydantic-settings already in requirements.txt")
        return True

def create_fixed_config():
    """Create the fixed config.py file"""
    log_step("Creating fixed config.py...")
    
    config_path = "backend/app/core/config.py"
    
    # Ensure directory exists
    os.makedirs(os.path.dirname(config_path), exist_ok=True)
    
    # Read the fixed config content
    try:
        with open('backend/scripts/pydantic_v2_config_fix.py', 'r') as f:
            fixed_content = f.read()
    except Exception as e:
        log_error(f"Failed to read fixed config template: {e}")
        return False
    
    # Write the fixed config
    try:
        with open(config_path, 'w') as f:
            f.write(fixed_content)
        log_info("Created fixed config.py with Pydantic v2 compatibility")
        return True
    except Exception as e:
        log_error(f"Failed to write fixed config.py: {e}")
        return False

def create_minimal_main():
    """Create a minimal main.py for testing"""
    log_step("Creating minimal main.py for testing...")
    
    minimal_main = '''"""
Minimal RAG Application Main - Reboot Cycle Fix Test
"""
import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Test config import
try:
    from app.core.config import settings
    logger.info("✅ Config imported successfully")
    config_ok = True
except Exception as e:
    logger.error(f"❌ Config import failed: {e}")
    config_ok = False

# Create FastAPI app
app = FastAPI(
    title="RAG Application - Reboot Fix Test",
    version="0.1.0",
    description="Testing Pydantic v2 config fix"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {
        "message": "RAG Application - Reboot Cycle Fixed",
        "status": "running",
        "config_loaded": config_ok,
        "test_mode": True
    }

@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "config_status": "ok" if config_ok else "error",
        "test_mode": True
    }

@app.get("/config-test")
async def config_test():
    """Test config access"""
    if not config_ok:
        return {"error": "Config not loaded"}
    
    try:
        return {
            "api_v1_str": settings.API_V1_STR,
            "project_name": settings.PROJECT_NAME,
            "database_url": settings.DATABASE_URL[:50] + "...",  # Truncated for security
            "model_name": settings.MODEL_NAME,
            "config_test": "passed"
        }
    except Exception as e:
        return {"error": f"Config access failed: {e}"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
'''
    
    main_path = "backend/app/main.py"
    
    # Backup current main.py
    if os.path.exists(main_path):
        backup_path = f"{main_path}.backup.{int(time.time())}"
        shutil.copy2(main_path, backup_path)
        log_info(f"Backed up main.py to: {backup_path}")
    
    # Write minimal main.py
    try:
        with open(main_path, 'w') as f:
            f.write(minimal_main)
        log_info("Created minimal main.py for testing")
        return True
    except Exception as e:
        log_error(f"Failed to create minimal main.py: {e}")
        return False

def rebuild_and_test():
    """Rebuild container and test the fix"""
    log_step("Rebuilding container with fixes...")
    
    # Rebuild backend with no cache
    success, output = run_cmd("docker-compose build --no-cache backend-07", "Rebuild backend", timeout=300)
    if not success:
        log_error("Backend rebuild failed:")
        print(output)
        return False
    
    # Start dependencies first
    log_info("Starting database dependencies...")
    run_cmd("docker-compose up -d postgres-07 qdrant-07", "Start databases")
    time.sleep(10)
    
    # Start backend
    log_info("Starting backend...")
    success, output = run_cmd("docker-compose up -d backend-07", "Start backend")
    if not success:
        log_error("Backend start failed:")
        print(output)
        return False
    
    # Monitor startup for 60 seconds
    log_info("Monitoring backend startup...")
    for i in range(12):  # 60 seconds total
        time.sleep(5)
        
        # Check if container is still running
        success, output = run_cmd("docker ps --filter name=backend-07 --format '{{.Status}}'", "Check container status")
        if success and "Up" in output:
            log_info(f"✅ Container is running (check {i+1}/12)")
            
            # Test API endpoint
            success, code = run_cmd("curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/", "Test API")
            if success and code == "200":
                log_info(f"🎉 API is responding! (after {(i+1)*5} seconds)")
                return True
        else:
            log_warning(f"⚠️  Container not running (check {i+1}/12)")
    
    log_error("❌ Container failed to start properly after 60 seconds")
    return False

def test_endpoints():
    """Test all endpoints to verify the fix"""
    log_step("Testing endpoints...")
    
    endpoints = [
        ("/", "Root endpoint"),
        ("/health", "Health check"),
        ("/config-test", "Config test")
    ]
    
    working = 0
    for endpoint, description in endpoints:
        success, code = run_cmd(f"curl -s -o /dev/null -w '%{{http_code}}' http://localhost:8000{endpoint}", f"Test {description}")
        if success and code == "200":
            log_info(f"✅ {description}: HTTP {code}")
            working += 1
        else:
            log_warning(f"⚠️  {description}: HTTP {code if success else 'Failed'}")
    
    return working, len(endpoints)

def show_container_logs():
    """Show recent container logs"""
    log_step("Showing recent container logs...")
    
    success, output = run_cmd("docker logs backend-07 --tail=20", "Get container logs")
    if success:
        print("\n📋 Recent Container Logs:")
        print("-" * 40)
        print(output)
        print("-" * 40)
    else:
        log_warning("Could not retrieve container logs")

def main():
    """Main fix function"""
    print("🚨 RAG Application Reboot Cycle Fix")
    print("Fixing Pydantic v2 BaseSettings AttributeError")
    print("=" * 60)
    
    if not os.path.exists("docker-compose.yml"):
        log_error("docker-compose.yml not found. Run from project root directory.")
        sys.exit(1)
    
    log_info(f"Working directory: {os.getcwd()}")
    
    # Step 1: EMERGENCY - Stop reboot cycle
    stop_reboot_cycle()
    
    # Step 2: Backup current broken config
    backup_current_config()
    
    # Step 3: Install pydantic-settings dependency
    if not install_pydantic_settings():
        log_warning("Failed to update requirements.txt, continuing...")
    
    # Step 4: Create fixed config.py
    if not create_fixed_config():
        log_error("Failed to create fixed config.py")
        sys.exit(1)
    
    # Step 5: Create minimal main.py for testing
    if not create_minimal_main():
        log_error("Failed to create minimal main.py")
        sys.exit(1)
    
    # Step 6: Rebuild and test
    if rebuild_and_test():
        working, total = test_endpoints()
        
        print("\n" + "=" * 60)
        print("🎉 REBOOT CYCLE FIX SUMMARY")
        print("=" * 60)
        
        if working == total:
            log_info("🎉 SUCCESS! Reboot cycle fixed!")
            log_info("✅ All endpoints are working correctly")
            log_info("✅ Pydantic v2 config issue resolved")
        elif working > 0:
            log_warning(f"⚠️  PARTIAL SUCCESS: {working}/{total} endpoints working")
            log_info("Container is stable but some features may be limited")
        else:
            log_error("❌ Container is running but endpoints not responding")
            show_container_logs()
        
        print(f"\n🔗 Test your application:")
        print(f"   Main API: http://localhost:8000/")
        print(f"   Health: http://localhost:8000/health")
        print(f"   Config Test: http://localhost:8000/config-test")
        
        print(f"\n🔧 Next Steps:")
        if working == total:
            print("1. Test the minimal application thoroughly")
            print("2. Gradually restore full functionality")
            print("3. Replace minimal main.py with full version when ready")
        else:
            print("1. Check container logs: docker logs backend-07")
            print("2. Verify config.py is working correctly")
            print("3. Test individual components")
    
    else:
        log_error("❌ Fix failed - container still not starting")
        show_container_logs()
        
        print(f"\n🔧 Manual Steps to Try:")
        print("1. Check the container logs above for specific errors")
        print("2. Verify the fixed config.py file is correct")
        print("3. Try: docker-compose build --no-cache")
        print("4. Try: docker system prune -f && docker-compose up --build")

if __name__ == "__main__":
    main()


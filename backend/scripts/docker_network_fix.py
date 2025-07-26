"""
Docker Networking Fix for RAG Application
Fixes frontend-backend communication issues
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

def run_cmd(command, description=""):
    """Run command and return success status"""
    try:
        if isinstance(command, str):
            command = command.split()
        
        result = subprocess.run(command, capture_output=True, text=True, timeout=60)
        
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

def backup_docker_compose():
    """Backup current docker-compose.yml"""
    log_step("Backing up current docker-compose.yml...")
    
    if os.path.exists("docker-compose.yml"):
        backup_name = f"docker-compose.yml.backup.{int(time.time())}"
        shutil.copy2("docker-compose.yml", backup_name)
        log_info(f"Backed up to: {backup_name}")
        return True
    else:
        log_error("docker-compose.yml not found")
        return False

def fix_docker_compose():
    """Fix docker-compose.yml networking issues"""
    log_step("Fixing docker-compose.yml networking configuration...")
    
    if not os.path.exists("docker-compose.yml"):
        log_error("docker-compose.yml not found")
        return False
    
    # Read current file
    try:
        with open("docker-compose.yml", "r") as f:
            content = f.read()
    except Exception as e:
        log_error(f"Failed to read docker-compose.yml: {e}")
        return False
    
    # Check if fix is needed
    if "REACT_APP_API_URL=http://localhost:8000" in content:
        log_warning("Found networking issue: frontend using localhost instead of container name")
        
        # Apply fix
        content = content.replace(
            "REACT_APP_API_URL=http://localhost:8000",
            "REACT_APP_API_URL=http://backend-07:8000"
        )
        
        # Add external URL for development
        if "REACT_APP_API_URL_EXTERNAL" not in content:
            content = content.replace(
                "- REACT_APP_API_URL=http://backend-07:8000",
                "- REACT_APP_API_URL=http://backend-07:8000\n      - REACT_APP_API_URL_EXTERNAL=http://localhost:8000"
            )
        
        # Write fixed file
        try:
            with open("docker-compose.yml", "w") as f:
                f.write(content)
            log_info("Fixed docker-compose.yml networking configuration")
            return True
        except Exception as e:
            log_error(f"Failed to write fixed docker-compose.yml: {e}")
            return False
    
    elif "REACT_APP_API_URL=http://backend-07:8000" in content:
        log_info("docker-compose.yml networking is already correctly configured")
        return True
    
    else:
        log_warning("Could not find REACT_APP_API_URL configuration")
        return False

def check_frontend_config():
    """Check if frontend needs configuration updates"""
    log_step("Checking frontend configuration...")
    
    # Check if frontend has proper API configuration
    frontend_files_to_check = [
        "frontend/src/lib/api.js",
        "frontend/src/config/api.js",
        "frontend/src/utils/api.js",
        "frontend/rag-ui-new/src/lib/api.js"
    ]
    
    for file_path in frontend_files_to_check:
        if os.path.exists(file_path):
            log_info(f"Found frontend API config: {file_path}")
            
            try:
                with open(file_path, "r") as f:
                    content = f.read()
                
                if "localhost:8000" in content:
                    log_warning(f"Frontend config {file_path} uses localhost - may need updating")
                    return file_path
                else:
                    log_info(f"Frontend config {file_path} looks correct")
            except Exception as e:
                log_warning(f"Could not read {file_path}: {e}")
    
    return None

def create_frontend_api_config():
    """Create proper frontend API configuration"""
    log_step("Creating frontend API configuration...")
    
    # Find frontend directory
    frontend_dirs = ["frontend/src", "frontend/rag-ui-new/src"]
    frontend_dir = None
    
    for dir_path in frontend_dirs:
        if os.path.exists(dir_path):
            frontend_dir = dir_path
            break
    
    if not frontend_dir:
        log_warning("Frontend directory not found")
        return False
    
    # Create lib directory if it doesn't exist
    lib_dir = os.path.join(frontend_dir, "lib")
    os.makedirs(lib_dir, exist_ok=True)
    
    # Create API configuration file
    api_config = '''// API Configuration for RAG Application
// Handles both development and production environments

const getApiUrl = () => {
  // In production (Docker), use container name
  if (process.env.NODE_ENV === 'production') {
    return process.env.REACT_APP_API_URL || 'http://backend-07:8000';
  }
  
  // In development, use localhost
  return process.env.REACT_APP_API_URL_EXTERNAL || 'http://localhost:8000';
};

export const API_BASE_URL = getApiUrl();
export const API_V1_URL = `${API_BASE_URL}/api/v1`;

// API endpoints
export const API_ENDPOINTS = {
  queries: {
    ask: `${API_V1_URL}/queries/ask`,
    history: `${API_V1_URL}/queries/history`
  },
  documents: {
    list: `${API_V1_URL}/documents/`,
    upload: `${API_V1_URL}/documents/upload`
  },
  health: `${API_BASE_URL}/health`,
  docs: `${API_BASE_URL}/docs`
};

// Default API client configuration
export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
};

export default {
  API_BASE_URL,
  API_V1_URL,
  API_ENDPOINTS,
  apiConfig
};
'''
    
    api_file_path = os.path.join(lib_dir, "api.js")
    
    try:
        with open(api_file_path, "w") as f:
            f.write(api_config)
        log_info(f"Created frontend API config: {api_file_path}")
        return True
    except Exception as e:
        log_error(f"Failed to create API config: {e}")
        return False

def restart_services():
    """Restart services with proper sequence"""
    log_step("Restarting services...")
    
    # Stop all services
    run_cmd("docker-compose down", "Stop all services")
    time.sleep(3)
    
    # Start databases first
    log_info("Starting database services...")
    run_cmd("docker-compose up -d postgres-07 qdrant-07", "Start databases")
    time.sleep(10)
    
    # Start backend
    log_info("Starting backend service...")
    run_cmd("docker-compose up -d backend-07", "Start backend")
    time.sleep(15)
    
    # Start frontend
    log_info("Starting frontend service...")
    run_cmd("docker-compose up -d frontend-07", "Start frontend")
    time.sleep(10)
    
    return True

def test_connectivity():
    """Test connectivity between services"""
    log_step("Testing service connectivity...")
    
    # Test backend
    success, code = run_cmd("curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/health", "Test backend")
    if success and code == "200":
        log_info("✅ Backend is responding on port 8000")
        backend_ok = True
    else:
        log_warning(f"⚠️  Backend not responding: HTTP {code if success else 'Failed'}")
        backend_ok = False
    
    # Test frontend
    success, code = run_cmd("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000", "Test frontend")
    if success and code in ["200", "304"]:
        log_info("✅ Frontend is responding on port 3000")
        frontend_ok = True
    else:
        log_warning(f"⚠️  Frontend not responding: HTTP {code if success else 'Failed'}")
        frontend_ok = False
    
    # Test internal connectivity (if possible)
    if backend_ok:
        log_info("Testing internal container connectivity...")
        success, output = run_cmd("docker exec frontend-07 curl -s -o /dev/null -w '%{http_code}' http://backend-07:8000/health", "Test internal connectivity")
        if success and output == "200":
            log_info("✅ Frontend can reach backend via container network")
        else:
            log_warning("⚠️  Frontend cannot reach backend via container network")
    
    return backend_ok, frontend_ok

def show_access_urls():
    """Show access URLs for the application"""
    print("\n🔗 Application Access URLs:")
    print("=" * 40)
    print("🌐 Frontend (React UI):     http://localhost:3000")
    print("🔧 Backend API:             http://localhost:8000")
    print("📚 API Documentation:       http://localhost:8000/docs")
    print("🏥 Health Check:            http://localhost:8000/health")
    print("📊 Query History:           http://localhost:8000/api/v1/queries/history")
    print("🗄️  Database (PostgreSQL):   localhost:5432")
    print("🔍 Vector DB (Qdrant):      http://localhost:6333")

def main():
    """Main function"""
    print("🚀 Docker Networking Fix for RAG Application")
    print("=" * 50)
    
    if not os.path.exists("docker-compose.yml"):
        log_error("docker-compose.yml not found. Run from project root directory.")
        sys.exit(1)
    
    log_info(f"Working directory: {os.getcwd()}")
    
    # Step 1: Backup current configuration
    if not backup_docker_compose():
        log_error("Failed to backup docker-compose.yml")
        sys.exit(1)
    
    # Step 2: Fix docker-compose.yml
    if not fix_docker_compose():
        log_error("Failed to fix docker-compose.yml")
        sys.exit(1)
    
    # Step 3: Check frontend configuration
    frontend_config_file = check_frontend_config()
    if frontend_config_file:
        log_info("Frontend configuration may need manual updates")
    
    # Step 4: Create proper API configuration
    create_frontend_api_config()
    
    # Step 5: Restart services
    if not restart_services():
        log_error("Failed to restart services")
        sys.exit(1)
    
    # Step 6: Test connectivity
    backend_ok, frontend_ok = test_connectivity()
    
    # Summary
    print("\n" + "=" * 50)
    print("📋 NETWORKING FIX SUMMARY")
    print("=" * 50)
    
    if backend_ok and frontend_ok:
        log_info("🎉 SUCCESS! Both backend and frontend are working!")
        log_info("✅ Docker networking issues have been resolved")
    elif backend_ok:
        log_warning("⚠️  Backend is working, but frontend may have issues")
        log_info("Check frontend logs: docker logs frontend-07")
    elif frontend_ok:
        log_warning("⚠️  Frontend is working, but backend may have issues")
        log_info("Check backend logs: docker logs backend-07")
    else:
        log_error("❌ Both services are having issues")
        log_info("Check all logs: docker-compose logs")
    
    show_access_urls()
    
    print(f"\n🔧 Next Steps:")
    if not (backend_ok and frontend_ok):
        print("1. Check container logs: docker-compose logs")
        print("2. Verify all services are running: docker ps")
        print("3. Test individual endpoints manually")
    else:
        print("1. Test your RAG application at http://localhost:3000")
        print("2. Submit a query to verify full functionality")
        print("3. Check query history to confirm database integration")

if __name__ == "__main__":
    main()


#!/usr/bin/env python3
"""
Emergency RAG Application Container Fix
Quick resolution for common container startup issues
"""

import os
import sys
import subprocess
import time
import json

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

def emergency_fix():
    """Emergency fix sequence"""
    print("🚨 EMERGENCY RAG APPLICATION CONTAINER FIX")
    print("=" * 50)
    
    # Step 1: Force stop everything
    log_step("Step 1: Force stopping all containers...")
    run_cmd("docker-compose down --remove-orphans", "Stop all containers")
    run_cmd("docker stop $(docker ps -aq) 2>/dev/null", "Force stop any remaining containers")
    time.sleep(3)
    
    # Step 2: Clean up
    log_step("Step 2: Cleaning up Docker resources...")
    run_cmd("docker container prune -f", "Remove stopped containers")
    run_cmd("docker network prune -f", "Remove unused networks")
    
    # Step 3: Check for port conflicts
    log_step("Step 3: Checking for port conflicts...")
    success, output = run_cmd("lsof -i :8000", "Check port 8000 usage")
    if success and output:
        log_warning(f"Port 8000 is in use: {output}")
        log_info("Attempting to free port 8000...")
        # Try to kill processes using port 8000
        run_cmd("sudo fuser -k 8000/tcp", "Kill processes on port 8000")
        time.sleep(2)
    
    # Step 4: Rebuild backend with no cache
    log_step("Step 4: Rebuilding backend container...")
    success, output = run_cmd("docker-compose build --no-cache backend-07", "Rebuild backend")
    if not success:
        log_error("Backend rebuild failed:")
        print(output)
        return False
    
    # Step 5: Start dependencies first
    log_step("Step 5: Starting database dependencies...")
    run_cmd("docker-compose up -d postgres-07", "Start PostgreSQL")
    run_cmd("docker-compose up -d qdrant-07", "Start Qdrant")
    time.sleep(10)  # Wait for databases to be ready
    
    # Step 6: Start backend
    log_step("Step 6: Starting backend container...")
    success, output = run_cmd("docker-compose up -d backend-07", "Start backend")
    if not success:
        log_error("Backend start failed:")
        print(output)
        return False
    
    # Step 7: Wait and monitor startup
    log_step("Step 7: Monitoring backend startup...")
    for i in range(12):  # Wait up to 60 seconds
        time.sleep(5)
        success, output = run_cmd("curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/health", "Health check")
        if success and output == "200":
            log_info(f"✅ Backend is responding! (after {(i+1)*5} seconds)")
            return True
        else:
            print(f"   Waiting... ({(i+1)*5}s)")
    
    log_error("Backend did not respond after 60 seconds")
    return False

def check_logs():
    """Check container logs for issues"""
    log_step("Checking container logs...")
    
    containers = ["backend-07", "postgres-07", "qdrant-07"]
    
    for container in containers:
        print(f"\n📋 {container} logs:")
        print("-" * 30)
        success, output = run_cmd(f"docker logs {container} --tail=10", f"Get {container} logs")
        if success:
            print(output)
        else:
            log_warning(f"Could not get logs for {container}")

def test_endpoints():
    """Test all endpoints"""
    log_step("Testing endpoints...")
    
    endpoints = [
        ("http://localhost:8000/", "Root"),
        ("http://localhost:8000/health", "Health"),
        ("http://localhost:8000/docs", "Docs"),
        ("http://localhost:8000/api/v1/queries/history?limit=1", "Queries")
    ]
    
    working = 0
    for url, name in endpoints:
        success, code = run_cmd(f"curl -s -o /dev/null -w '%{{http_code}}' {url}", f"Test {name}")
        if success and code in ["200", "307"]:
            log_info(f"{name}: HTTP {code} ✅")
            working += 1
        else:
            log_warning(f"{name}: HTTP {code if success else 'Failed'}")
    
    return working, len(endpoints)

def create_minimal_main_py():
    """Create a minimal main.py for testing"""
    log_step("Creating minimal main.py for testing...")
    
    minimal_main = '''"""
Minimal RAG Application Main - Emergency Mode
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="RAG Application - Emergency Mode", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "RAG Application Emergency Mode", "status": "running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "mode": "emergency"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
'''
    
    # Backup current main.py
    if os.path.exists("backend/app/main.py"):
        run_cmd("cp backend/app/main.py backend/app/main.py.emergency_backup", "Backup main.py")
    
    # Write minimal main.py
    try:
        with open("backend/app/main.py", "w") as f:
            f.write(minimal_main)
        log_info("Created minimal main.py")
        return True
    except Exception as e:
        log_error(f"Failed to create minimal main.py: {e}")
        return False

def main():
    """Main function"""
    if not os.path.exists("docker-compose.yml"):
        log_error("docker-compose.yml not found. Run from project root directory.")
        sys.exit(1)
    
    print(f"Working directory: {os.getcwd()}")
    
    # Check command line arguments
    if len(sys.argv) > 1 and sys.argv[1] == "--minimal":
        log_step("Creating minimal application for testing...")
        create_minimal_main_py()
        if emergency_fix():
            working, total = test_endpoints()
            if working > 0:
                log_info("🎉 Minimal application is working!")
                log_info("You can now debug the full application step by step.")
            else:
                log_error("Even minimal application failed to start")
        return
    
    # Normal emergency fix
    if emergency_fix():
        working, total = test_endpoints()
        
        if working == total:
            print("\n🎉 SUCCESS! All endpoints working!")
            log_info("Your RAG application is now running correctly.")
        elif working > 0:
            print(f"\n⚠️  PARTIAL SUCCESS: {working}/{total} endpoints working")
            log_info("Application is running but some features may be limited.")
            check_logs()
        else:
            print("\n❌ FAILURE: No endpoints working")
            log_error("Emergency fix did not resolve the issue.")
            check_logs()
            
            print("\n🔧 NEXT STEPS:")
            print("1. Check logs above for specific errors")
            print("2. Try minimal mode: python3 emergency_container_fix.py --minimal")
            print("3. Check docker-compose.yml configuration")
            print("4. Verify all required files are present")
    else:
        log_error("Emergency fix failed")
        check_logs()
        
        print("\n🔧 MANUAL STEPS TO TRY:")
        print("1. docker-compose down")
        print("2. docker system prune -f")
        print("3. docker-compose build --no-cache")
        print("4. docker-compose up -d")

if __name__ == "__main__":
    main()



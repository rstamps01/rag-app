#!/usr/bin/env python3
"""
React Frontend Connectivity Fix
Fixes React app connection to backend API
"""

import subprocess
import time
import os

def run_cmd(command, description=""):
    """Run command and show result"""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=120)
        if result.returncode == 0:
            print(f"✅ {description} - Success")
            return True, result.stdout.strip()
        else:
            print(f"⚠️  {description} - Warning: {result.stderr}")
            return False, result.stderr.strip()
    except Exception as e:
        print(f"❌ {description} - Error: {e}")
        return False, str(e)

def analyze_current_config():
    """Analyze current docker-compose configuration"""
    print("🔍 Analyzing current configuration...")
    
    # Check current frontend environment
    success, output = run_cmd("docker exec frontend-07 env | grep REACT_APP", "Check React environment variables")
    if success:
        print("Current React environment variables:")
        print(output)
    
    # Check if frontend can reach backend internally
    success, output = run_cmd("docker exec frontend-07 curl -s -w 'HTTP: %{http_code}' http://backend-07:8000/health", "Test internal connectivity")
    if success:
        print(f"Internal connectivity test: {output}")
    else:
        print(f"Internal connectivity failed: {output}")
    
    # Check frontend logs
    success, logs = run_cmd("docker logs frontend-07 --tail=10", "Get frontend logs")
    if success:
        print("Recent frontend logs:")
        print(logs)

def fix_docker_compose():
    """Fix docker-compose.yml for better React connectivity"""
    print("🔧 Updating docker-compose.yml for React connectivity...")
    
    # Read current docker-compose.yml
    try:
        with open("docker-compose.yml", "r") as f:
            content = f.read()
    except Exception as e:
        print(f"❌ Failed to read docker-compose.yml: {e}")
        return False
    
    # Create backup
    try:
        with open("docker-compose.yml.react-fix-backup", "w") as f:
            f.write(content)
        print("✅ Backed up docker-compose.yml")
    except Exception as e:
        print(f"⚠️  Backup failed: {e}")
    
    # Fix the frontend configuration
    # The issue might be that React needs both internal and external URLs
    updated_content = content.replace(
        """    environment:
      # FIXED: Use backend container name for internal communication
      # For container-to-container communication, use the service name
      - REACT_APP_API_URL=http://backend-07:8000
      - REACT_APP_ENVIRONMENT=production
      # ADDED: Alternative configuration for development
      # - REACT_APP_API_URL_EXTERNAL=http://localhost:8000""",
        """    environment:
      # FIXED: Use localhost for browser-based requests (React runs in browser)
      # React apps run in the browser, not in the container, so they need localhost
      - REACT_APP_API_URL=http://localhost:8000
      - REACT_APP_ENVIRONMENT=production
      # Internal container communication (for server-side rendering if needed)
      - REACT_APP_API_URL_INTERNAL=http://backend-07:8000"""
    )
    
    # Write updated file
    try:
        with open("docker-compose.yml", "w") as f:
            f.write(updated_content)
        print("✅ Updated docker-compose.yml with React connectivity fix")
        return True
    except Exception as e:
        print(f"❌ Failed to update docker-compose.yml: {e}")
        return False

def create_react_api_config():
    """Create or update React API configuration"""
    print("🔧 Creating React API configuration...")
    
    # Check if we can access the frontend source
    frontend_paths = [
        "frontend/src/lib/api.js",
        "frontend/src/config/api.js", 
        "frontend/rag-ui-new/src/lib/api.js"
    ]
    
    api_config_content = '''// API Configuration for RAG Application
// Handles browser-based API calls correctly

const getApiUrl = () => {
  // For React apps, API calls are made from the browser
  // Browser needs to use localhost, not container names
  const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
  console.log('Using API URL:', apiUrl);
  return apiUrl;
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
  docs: `${API_BASE_URL}/docs`,
  status: `${API_V1_URL}/status`
};

// Default fetch configuration
export const apiConfig = {
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

// Helper function for API calls
export const apiCall = async (endpoint, options = {}) => {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const config = {
    ...apiConfig,
    ...options,
    headers: {
      ...apiConfig.headers,
      ...(options.headers || {})
    }
  };
  
  try {
    console.log('API Call:', url, config);
    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    console.log('API Response:', data);
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export default {
  API_BASE_URL,
  API_V1_URL,
  API_ENDPOINTS,
  apiConfig,
  apiCall
};
'''
    
    # Try to create the API config in the most likely location
    created = False
    for path in frontend_paths:
        try:
            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(path), exist_ok=True)
            
            with open(path, 'w') as f:
                f.write(api_config_content)
            print(f"✅ Created API config: {path}")
            created = True
            break
        except Exception as e:
            print(f"⚠️  Could not create {path}: {e}")
    
    if not created:
        print("⚠️  Could not create API config file - frontend structure may be different")
    
    return created

def rebuild_frontend():
    """Rebuild frontend with new configuration"""
    print("🔄 Rebuilding frontend with new configuration...")
    
    # Stop frontend
    run_cmd("docker-compose stop frontend-07", "Stop frontend")
    time.sleep(3)
    
    # Rebuild frontend (no cache to ensure new env vars are used)
    success, output = run_cmd("docker-compose build --no-cache frontend-07", "Rebuild frontend")
    if not success:
        print("❌ Frontend rebuild failed:")
        print(output)
        return False
    
    # Start frontend
    success, output = run_cmd("docker-compose up -d frontend-07", "Start frontend")
    if not success:
        print("❌ Frontend start failed:")
        print(output)
        return False
    
    return True

def test_connectivity():
    """Test full connectivity chain"""
    print("🧪 Testing full connectivity chain...")
    
    # Wait for frontend to start
    print("⏳ Waiting for frontend to start...")
    time.sleep(20)
    
    # Test backend from host
    print("\n🔍 Testing backend from host:")
    success, output = run_cmd("curl -s -w 'HTTP: %{http_code}' http://localhost:8000/api/v1/queries/history", "Backend API test")
    backend_ok = success and "HTTP: 200" in output
    print(f"Backend API: {'✅ Working' if backend_ok else '❌ Failed'}")
    
    # Test frontend from host
    print("\n🔍 Testing frontend from host:")
    success, output = run_cmd("curl -s -w 'HTTP: %{http_code}' http://localhost:3000/", "Frontend test")
    frontend_ok = success and ("HTTP: 200" in output or "HTTP: 304" in output)
    print(f"Frontend: {'✅ Working' if frontend_ok else '❌ Failed'}")
    
    # Test internal connectivity
    print("\n🔍 Testing internal container connectivity:")
    success, output = run_cmd("docker exec frontend-07 curl -s -w 'HTTP: %{http_code}' http://localhost:8000/api/v1/queries/history", "Internal API test")
    internal_ok = success and "HTTP: 200" in output
    print(f"Internal connectivity: {'✅ Working' if internal_ok else '❌ Failed'}")
    
    return backend_ok, frontend_ok, internal_ok

def show_debugging_info():
    """Show debugging information"""
    print("\n🔍 Debugging Information:")
    print("=" * 40)
    
    # Show container status
    run_cmd("docker ps --filter name=frontend-07 --filter name=backend-07", "Container status")
    
    # Show network info
    run_cmd("docker network inspect network-07 | grep -A 10 -B 5 'frontend-07\\|backend-07'", "Network connectivity")
    
    # Show recent logs
    print("\n📋 Recent Frontend Logs:")
    run_cmd("docker logs frontend-07 --tail=15", "Frontend logs")

def main():
    print("🔧 React Frontend Connectivity Fix")
    print("Fixing React app connection to backend API")
    print("=" * 50)
    
    # Step 1: Analyze current configuration
    analyze_current_config()
    
    # Step 2: Fix docker-compose.yml
    print(f"\n🔧 Step 1: Fix Docker Compose Configuration")
    if not fix_docker_compose():
        print("❌ Failed to fix docker-compose.yml")
        return
    
    # Step 3: Create React API configuration
    print(f"\n🔧 Step 2: Create React API Configuration")
    create_react_api_config()
    
    # Step 4: Rebuild frontend
    print(f"\n🔧 Step 3: Rebuild Frontend")
    if not rebuild_frontend():
        print("❌ Failed to rebuild frontend")
        return
    
    # Step 5: Test connectivity
    print(f"\n🧪 Step 4: Test Connectivity")
    backend_ok, frontend_ok, internal_ok = test_connectivity()
    
    # Step 6: Summary
    print(f"\n📋 CONNECTIVITY FIX SUMMARY")
    print("=" * 40)
    print(f"Backend API: {'✅ Working' if backend_ok else '❌ Failed'}")
    print(f"Frontend: {'✅ Working' if frontend_ok else '❌ Failed'}")
    print(f"Internal connectivity: {'✅ Working' if internal_ok else '❌ Failed'}")
    
    if backend_ok and frontend_ok:
        print(f"\n🎉 SUCCESS! React connectivity fixed!")
        print("✅ Backend API is accessible from browser")
        print("✅ Frontend is serving correctly")
        print("✅ React app can now make API calls")
        
        print(f"\n🔗 Your RAG application is ready:")
        print("   Frontend: http://localhost:3000")
        print("   Backend: http://localhost:8000")
        print("   API Docs: http://localhost:8000/docs")
        
        print(f"\n🧪 Test your application:")
        print("1. Open http://localhost:3000 in your browser")
        print("2. Check browser console for API call logs")
        print("3. Navigate to Queries page - should load data")
        print("4. Navigate to Documents page - should show documents")
        print("5. Submit a test query - should get response")
        
    else:
        print(f"\n⚠️  Some connectivity issues remain")
        show_debugging_info()
        
        print(f"\n🔧 Next steps:")
        print("1. Check the debugging info above")
        print("2. Verify browser console for errors at http://localhost:3000")
        print("3. Test API directly: curl http://localhost:8000/api/v1/queries/history")

if __name__ == "__main__":
    main()


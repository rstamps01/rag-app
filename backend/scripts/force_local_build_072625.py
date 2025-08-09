#!/usr/bin/env python3
"""
Force Docker to Use Local Files Instead of GitHub Repo
Modifies Dockerfile to use local files and ensures proper build context
"""

import subprocess
import os
import shutil

def run_cmd(command, description=""):
    """Run command and show result"""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=600)
        if result.returncode == 0:
            print(f"✅ {description} - Success")
            return True, result.stdout.strip()
        else:
            print(f"⚠️  {description} - Warning: {result.stderr}")
            return False, result.stderr.strip()
    except Exception as e:
        print(f"❌ {description} - Error: {e}")
        return False, str(e)

def check_dockerfile():
    """Check current Dockerfile for GitHub references"""
    print("🔍 Checking Dockerfile for GitHub references...")
    
    dockerfile_path = "backend/Dockerfile"
    if not os.path.exists(dockerfile_path):
        print(f"❌ Dockerfile not found at: {dockerfile_path}")
        return False, None
    
    try:
        with open(dockerfile_path, 'r') as f:
            content = f.read()
        
        # Check for common GitHub patterns
        github_patterns = [
            "git clone",
            "github.com",
            "RUN git",
            "FROM.*git",
            "ADD.*github",
            "COPY.*github"
        ]
        
        found_patterns = []
        for pattern in github_patterns:
            if pattern.lower() in content.lower():
                found_patterns.append(pattern)
        
        print(f"Dockerfile analysis:")
        if found_patterns:
            print(f"❌ Found GitHub references: {found_patterns}")
            print("This explains why local changes aren't being used!")
        else:
            print("✅ No obvious GitHub references found")
        
        return True, content
        
    except Exception as e:
        print(f"❌ Failed to read Dockerfile: {e}")
        return False, None

def create_local_dockerfile():
    """Create a Dockerfile that uses local files"""
    print("🔧 Creating Dockerfile that uses local files...")
    
    local_dockerfile = '''# RAG Application Backend - Local Build
# Uses local files instead of GitHub repo

FROM nvidia/cuda:12.1-devel-ubuntu22.04

# Set environment variables
ENV DEBIAN_FRONTEND=noninteractive
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Install system dependencies
RUN apt-get update && apt-get install -y \\
    python3 \\
    python3-pip \\
    python3-dev \\
    build-essential \\
    curl \\
    git \\
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip3 install --no-cache-dir -r requirements.txt

# Copy the entire application from local files
# This ensures all your local changes are included
COPY . .

# Create necessary directories
RUN mkdir -p /app/models_cache
RUN mkdir -p /app/logs

# Set Python path
ENV PYTHONPATH=/app

# Create cache initialization file
RUN touch /app/models_cache/.initialization_complete

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \\
    CMD curl -f http://localhost:8000/health || exit 1

# Start command
CMD ["python3", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
'''
    
    # Backup original Dockerfile
    dockerfile_path = "backend/Dockerfile"
    if os.path.exists(dockerfile_path):
        backup_path = f"{dockerfile_path}.github-version.backup"
        try:
            shutil.copy2(dockerfile_path, backup_path)
            print(f"✅ Backed up original Dockerfile to: {backup_path}")
        except Exception as e:
            print(f"⚠️  Backup failed: {e}")
    
    # Write new local Dockerfile
    try:
        with open(dockerfile_path, 'w') as f:
            f.write(local_dockerfile)
        print("✅ Created local Dockerfile that uses local files")
        return True
    except Exception as e:
        print(f"❌ Failed to create local Dockerfile: {e}")
        return False

def ensure_dockerignore():
    """Create .dockerignore to exclude unnecessary files"""
    print("🔧 Creating .dockerignore for efficient builds...")
    
    dockerignore_content = '''# Docker ignore file for local builds
# Exclude files that shouldn't be in the container

# Git files
.git
.gitignore
.github

# Python cache
__pycache__
*.pyc
*.pyo
*.pyd
.Python
*.so
.pytest_cache

# Virtual environments
venv/
#env/
.venv/

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# Temporary files
*.tmp
*.temp

# Documentation
README.md
docs/

# Docker files (don't copy into container)
Dockerfile*
docker-compose*.yml
.dockerignore

# Backup files
*.backup
*.bak
'''
    
    dockerignore_path = "backend/.dockerignore"
    try:
        with open(dockerignore_path, 'w') as f:
            f.write(dockerignore_content)
        print(f"✅ Created .dockerignore at: {dockerignore_path}")
        return True
    except Exception as e:
        print(f"❌ Failed to create .dockerignore: {e}")
        return False

def verify_local_files():
    """Verify that local files exist and are up to date"""
    print("🔍 Verifying local files are ready for build...")
    
    critical_files = [
        "backend/app/main.py",
        "backend/app/core/config.py",
        "backend/requirements.txt"
    ]
    
    missing_files = []
    for file_path in critical_files:
        if os.path.exists(file_path):
            print(f"✅ Found: {file_path}")
        else:
            print(f"❌ Missing: {file_path}")
            missing_files.append(file_path)
    
    if missing_files:
        print(f"⚠️  Missing files: {missing_files}")
        return False
    
    # Check if main.py has the API routes
    try:
        with open("backend/app/main.py", 'r') as f:
            main_content = f.read()
        
        has_api_routes = "/api/v1/queries/history" in main_content
        print(f"Main.py has API routes: {'✅' if has_api_routes else '❌'}")
        
        return has_api_routes
        
    except Exception as e:
        print(f"❌ Failed to check main.py: {e}")
        return False

def force_local_build():
    """Force Docker build using local files"""
    print("🔄 Force building with local files...")
    
    # Remove any existing containers and images
    print("\n🧹 Cleaning up existing containers and images...")
    run_cmd("docker-compose stop backend-07", "Stop backend")
    run_cmd("docker-compose rm -f backend-07", "Remove backend container")
    run_cmd("docker rmi rag-app-07_backend-07 2>/dev/null || true", "Remove backend image")
    
    # Build with no cache and local context
    print("\n🔨 Building with local files (no cache)...")
    success, output = run_cmd(
        "docker-compose build --no-cache --pull backend-07", 
        "Build backend with local files"
    )
    
    if not success:
        print("❌ Build failed:")
        print(output)
        return False
    
    # Start the new container
    print("\n🚀 Starting new container...")
    success, output = run_cmd("docker-compose up -d backend-07", "Start backend")
    
    if not success:
        print("❌ Start failed:")
        print(output)
        return False
    
    return True

def test_local_build():
    """Test that the local build worked"""
    print("🧪 Testing that local build includes your changes...")
    
    import time
    time.sleep(20)  # Wait for startup
    
    # Test the API routes that should now exist
    endpoints = [
        ("http://localhost:8000/", "Root endpoint"),
        ("http://localhost:8000/api/v1/queries/history", "Query history API"),
        ("http://localhost:8000/api/v1/documents", "Documents API")
    ]
    
    working = 0
    for url, name in endpoints:
        success, output = run_cmd(f"curl -s -w 'HTTP: %{{http_code}}' {url}", f"Test {name}")
        if success and "HTTP: 200" in output:
            print(f"✅ {name}: Working")
            working += 1
        else:
            print(f"❌ {name}: Failed")
    
    return working, len(endpoints)

def show_build_tips():
    """Show additional tips for local builds"""
    print("\n💡 Additional Tips for Local Builds:")
    print("=" * 40)
    
    print("1. Build Context:")
    print("   - Docker uses the 'backend/' directory as build context")
    print("   - All files in backend/ are available to COPY commands")
    print("   - Changes to files outside backend/ won't be included")
    
    print("\n2. Force Fresh Build:")
    print("   - Use --no-cache to ignore Docker layer cache")
    print("   - Use --pull to get latest base images")
    print("   - Remove containers/images first for complete rebuild")
    
    print("\n3. Verify Local Changes:")
    print("   - Check that your main.py has the API routes")
    print("   - Ensure requirements.txt has all dependencies")
    print("   - Verify file permissions are correct")
    
    print("\n4. Debug Build Issues:")
    print("   - Check docker-compose logs backend-07")
    print("   - Use docker exec backend-07 ls -la /app to see copied files")
    print("   - Use docker exec backend-07 cat /app/app/main.py to verify content")

def main():
    print("🔧 Force Docker to Use Local Files")
    print("Ensuring Docker build uses your local changes")
    print("=" * 50)
    
    # Step 1: Check current Dockerfile
    print("\n📋 Step 1: Check Current Dockerfile")
    dockerfile_ok, dockerfile_content = check_dockerfile()
    
    # Step 2: Create local Dockerfile
    print("\n🔧 Step 2: Create Local Dockerfile")
    if not create_local_dockerfile():
        print("❌ Failed to create local Dockerfile")
        return
    
    # Step 3: Create .dockerignore
    print("\n📝 Step 3: Create .dockerignore")
    ensure_dockerignore()
    
    # Step 4: Verify local files
    print("\n✅ Step 4: Verify Local Files")
    if not verify_local_files():
        print("❌ Local files are not ready")
        print("Make sure your main.py has the API routes!")
        return
    
    # Step 5: Force local build
    print("\n🔨 Step 5: Force Local Build")
    if not force_local_build():
        print("❌ Local build failed")
        return
    
    # Step 6: Test the build
    print("\n🧪 Step 6: Test Local Build")
    working, total = test_local_build()
    
    # Summary
    print(f"\n📋 LOCAL BUILD SUMMARY")
    print("=" * 30)
    print(f"Endpoints working: {working}/{total}")
    
    if working == total:
        print("\n🎉 SUCCESS! Local build is working!")
        print("✅ Docker is now using your local files")
        print("✅ All API routes are available")
        print("✅ Your changes are active in the container")
        
        print(f"\n🔗 Your application is ready:")
        print("   Frontend: http://localhost:3000")
        print("   Backend: http://localhost:8000")
        print("   API Routes: http://localhost:8000/api/v1/queries/history")
        
    else:
        print("\n⚠️  Some issues remain")
        show_build_tips()
        
        print(f"\n🔧 Debug commands:")
        print("docker logs backend-07")
        print("docker exec backend-07 cat /app/app/main.py | head -20")
        print("docker exec backend-07 ls -la /app/app/")

if __name__ == "__main__":
    main()


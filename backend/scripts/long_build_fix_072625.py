#!/usr/bin/env python3
"""
Long Docker Build Fix
Handles Docker builds that take 7-10 minutes with proper timeouts
"""

import subprocess
import time
import os
import threading
import signal
import sys

def run_cmd_with_progress(command, description="", timeout=900):  # 15 minute default timeout
    """Run command with progress monitoring for long operations"""
    print(f"🔧 {description}...")
    print(f"⏱️  Timeout set to {timeout//60} minutes")
    
    try:
        # Start the process
        process = subprocess.Popen(
            command, 
            shell=True, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
        
        # Monitor progress with dots
        start_time = time.time()
        output_lines = []
        
        def print_progress():
            """Print progress dots while waiting"""
            dots = 0
            while process.poll() is None:
                elapsed = int(time.time() - start_time)
                mins, secs = divmod(elapsed, 60)
                print(f"\r   ⏳ Running... {mins:02d}:{secs:02d} {'.' * (dots % 4)}", end='', flush=True)
                dots += 1
                time.sleep(1)
        
        # Start progress thread
        progress_thread = threading.Thread(target=print_progress)
        progress_thread.daemon = True
        progress_thread.start()
        
        # Wait for completion with timeout
        try:
            stdout, stderr = process.communicate(timeout=timeout)
            elapsed = int(time.time() - start_time)
            mins, secs = divmod(elapsed, 60)
            print(f"\r   ✅ Completed in {mins:02d}:{secs:02d}")
            
            if process.returncode == 0:
                print(f"✅ {description} - Success")
                return True, stdout
            else:
                print(f"⚠️  {description} - Warning")
                print(f"Exit code: {process.returncode}")
                if stdout:
                    print("Output:", stdout[-500:])  # Last 500 chars
                return False, stdout
                
        except subprocess.TimeoutExpired:
            print(f"\n❌ {description} - Timeout after {timeout//60} minutes")
            process.kill()
            return False, f"Timeout after {timeout} seconds"
            
    except Exception as e:
        print(f"❌ {description} - Error: {e}")
        return False, str(e)

def run_cmd_simple(command, description="", timeout=60):
    """Run simple command with shorter timeout"""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=timeout)
        if result.returncode == 0:
            print(f"✅ {description} - Success")
            return True, result.stdout.strip()
        else:
            print(f"⚠️  {description} - Warning: {result.stderr}")
            return False, result.stderr.strip()
    except subprocess.TimeoutExpired:
        print(f"❌ {description} - Timeout after {timeout} seconds")
        return False, f"Timeout after {timeout} seconds"
    except Exception as e:
        print(f"❌ {description} - Error: {e}")
        return False, str(e)

def estimate_build_time():
    """Estimate build time based on system"""
    print("🔍 Estimating build time...")
    
    # Check if this is a CUDA build (takes longer)
    dockerfile_path = "backend/Dockerfile"
    is_cuda_build = False
    
    if os.path.exists(dockerfile_path):
        try:
            with open(dockerfile_path, 'r') as f:
                content = f.read()
            if "nvidia/cuda" in content.lower() or "cuda" in content.lower():
                is_cuda_build = True
                print("🎯 Detected CUDA build - will take 7-15 minutes")
            else:
                print("🎯 Detected standard build - will take 3-7 minutes")
        except:
            pass
    
    # Estimate timeout based on build type
    if is_cuda_build:
        return 1200  # 20 minutes for CUDA builds
    else:
        return 600   # 10 minutes for standard builds

def monitor_docker_build(build_command, timeout=900):
    """Monitor Docker build with real-time output"""
    print(f"🔨 Starting Docker build (timeout: {timeout//60} minutes)...")
    print(f"Command: {build_command}")
    print("=" * 60)
    
    try:
        process = subprocess.Popen(
            build_command,
            shell=True,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            universal_newlines=True,
            bufsize=1
        )
        
        start_time = time.time()
        last_output_time = start_time
        
        # Read output line by line
        while True:
            output = process.stdout.readline()
            current_time = time.time()
            
            if output == '' and process.poll() is not None:
                break
                
            if output:
                # Show progress
                elapsed = int(current_time - start_time)
                mins, secs = divmod(elapsed, 60)
                print(f"[{mins:02d}:{secs:02d}] {output.strip()}")
                last_output_time = current_time
            
            # Check for timeout
            if current_time - start_time > timeout:
                print(f"\n❌ Build timeout after {timeout//60} minutes")
                process.kill()
                return False, "Build timeout"
            
            # Check for stalled build (no output for 5 minutes)
            if current_time - last_output_time > 300:
                print(f"\n⚠️  No output for 5 minutes, build may be stalled")
                print(f"   Continuing to wait... (timeout in {(timeout - (current_time - start_time))//60} minutes)")
                last_output_time = current_time  # Reset stall timer
        
        # Get final result
        return_code = process.poll()
        elapsed = int(time.time() - start_time)
        mins, secs = divmod(elapsed, 60)
        
        print("=" * 60)
        if return_code == 0:
            print(f"✅ Build completed successfully in {mins:02d}:{secs:02d}")
            return True, f"Build completed in {elapsed} seconds"
        else:
            print(f"❌ Build failed after {mins:02d}:{secs:02d} (exit code: {return_code})")
            return False, f"Build failed with exit code {return_code}"
            
    except Exception as e:
        print(f"❌ Build monitoring error: {e}")
        return False, str(e)

def force_backend_rebuild_long():
    """Force backend rebuild with long timeout handling"""
    print("🔄 Force rebuilding backend (handling long build times)...")
    
    # Estimate build time
    estimated_timeout = estimate_build_time()
    
    # Clean up existing containers and images
    print("\n🧹 Cleaning up existing containers...")
    run_cmd_simple("docker-compose stop backend-07", "Stop backend", 30)
    run_cmd_simple("docker-compose rm -f backend-07", "Remove backend container", 30)
    run_cmd_simple("docker rmi rag-app-07_backend-07 2>/dev/null || true", "Remove backend image", 30)
    
    # Show build information
    print(f"\n📋 Build Information:")
    print(f"   Estimated time: {estimated_timeout//60} minutes")
    print(f"   Timeout set to: {estimated_timeout//60} minutes")
    print(f"   Build will show real-time progress")
    print(f"   You can safely wait - this is normal for CUDA builds")
    
    # Start the build with monitoring
    build_command = "docker-compose build --no-cache --pull backend-07"
    success, result = monitor_docker_build(build_command, estimated_timeout)
    
    if not success:
        print(f"\n❌ Build failed: {result}")
        return False
    
    # Start the container
    print(f"\n🚀 Starting backend container...")
    success, output = run_cmd_simple("docker-compose up -d backend-07", "Start backend", 60)
    
    if not success:
        print(f"❌ Failed to start container: {output}")
        return False
    
    return True

def wait_for_backend_startup(timeout=300):
    """Wait for backend to fully start up"""
    print(f"⏳ Waiting for backend startup (timeout: {timeout//60} minutes)...")
    
    start_time = time.time()
    
    while time.time() - start_time < timeout:
        try:
            # Test basic connectivity
            result = subprocess.run(
                "curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/health",
                shell=True,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0 and result.stdout == "200":
                elapsed = int(time.time() - start_time)
                print(f"✅ Backend is ready after {elapsed} seconds")
                return True
                
        except:
            pass
        
        # Show progress
        elapsed = int(time.time() - start_time)
        remaining = timeout - elapsed
        print(f"\r   ⏳ Waiting for backend... {elapsed}s elapsed, {remaining}s remaining", end='', flush=True)
        time.sleep(5)
    
    print(f"\n❌ Backend startup timeout after {timeout} seconds")
    return False

def test_api_endpoints_long():
    """Test API endpoints with appropriate timeouts"""
    print("🧪 Testing API endpoints...")
    
    endpoints = [
        ("http://localhost:8000/", "Root endpoint"),
        ("http://localhost:8000/health", "Health check"),
        ("http://localhost:8000/api/v1/queries/history", "Query history"),
        ("http://localhost:8000/api/v1/documents", "Documents list"),
        ("http://localhost:8000/docs", "API documentation")
    ]
    
    working = 0
    for url, name in endpoints:
        try:
            result = subprocess.run(
                f"curl -s -w 'HTTP: %{{http_code}}' {url}",
                shell=True,
                capture_output=True,
                text=True,
                timeout=30
            )
            
            if result.returncode == 0 and "HTTP: 200" in result.stdout:
                print(f"✅ {name}: Working")
                working += 1
            else:
                print(f"❌ {name}: Failed")
                
        except Exception as e:
            print(f"❌ {name}: Error - {e}")
    
    return working, len(endpoints)

def show_build_optimization_tips():
    """Show tips for optimizing build times"""
    print("\n💡 Build Optimization Tips:")
    print("=" * 40)
    
    print("1. Speed up future builds:")
    print("   - Use Docker layer caching")
    print("   - Don't use --no-cache unless necessary")
    print("   - Optimize Dockerfile layer order")
    
    print("\n2. Monitor build progress:")
    print("   - Watch for 'Step X/Y' progress")
    print("   - CUDA downloads can take 5+ minutes")
    print("   - Python package installs take 2-3 minutes")
    
    print("\n3. Troubleshoot slow builds:")
    print("   - Check Docker daemon resources")
    print("   - Ensure good internet connection")
    print("   - Consider using smaller base images")
    
    print("\n4. Alternative approaches:")
    print("   - Build without --no-cache for faster rebuilds")
    print("   - Use docker build instead of docker-compose build")
    print("   - Pre-pull base images: docker pull nvidia/cuda:12.1-devel-ubuntu22.04")

def main():
    print("🔧 Long Docker Build Fix")
    print("Handling Docker builds that take 7-10 minutes")
    print("=" * 50)
    
    # Check if we're in the right directory
    if not os.path.exists("docker-compose.yml"):
        print("❌ docker-compose.yml not found. Run from project root directory.")
        sys.exit(1)
    
    print(f"✅ Working directory: {os.getcwd()}")
    
    # Show current time for reference
    current_time = time.strftime("%H:%M:%S")
    print(f"🕐 Started at: {current_time}")
    
    # Step 1: Force rebuild with long timeout
    print(f"\n🔨 Step 1: Force Rebuild (Extended Timeout)")
    if not force_backend_rebuild_long():
        print("❌ Rebuild failed")
        show_build_optimization_tips()
        return
    
    # Step 2: Wait for startup
    print(f"\n⏳ Step 2: Wait for Backend Startup")
    if not wait_for_backend_startup():
        print("❌ Backend startup failed")
        print("Check logs: docker logs backend-07")
        return
    
    # Step 3: Test endpoints
    print(f"\n🧪 Step 3: Test API Endpoints")
    working, total = test_api_endpoints_long()
    
    # Summary
    end_time = time.strftime("%H:%M:%S")
    print(f"\n📋 LONG BUILD SUMMARY")
    print("=" * 30)
    print(f"Started: {current_time}")
    print(f"Finished: {end_time}")
    print(f"Endpoints working: {working}/{total}")
    
    if working == total:
        print(f"\n🎉 SUCCESS! Long build completed successfully!")
        print("✅ Backend rebuilt with extended timeout")
        print("✅ All API endpoints are working")
        print("✅ Your application is ready")
        
        print(f"\n🔗 Your RAG application:")
        print("   Frontend: http://localhost:3000")
        print("   Backend: http://localhost:8000")
        print("   API Docs: http://localhost:8000/docs")
        
        print(f"\n💡 For future builds:")
        print("   - Remove --no-cache for faster rebuilds")
        print("   - This script handles long build times automatically")
        
    else:
        print(f"\n⚠️  Build completed but some endpoints not working")
        print("Check backend logs: docker logs backend-07")
        show_build_optimization_tips()

if __name__ == "__main__":
    # Handle Ctrl+C gracefully
    def signal_handler(sig, frame):
        print('\n\n🛑 Build interrupted by user')
        print('You can resume by running the script again')
        sys.exit(0)
    
    signal.signal(signal.SIGINT, signal_handler)
    
    main()


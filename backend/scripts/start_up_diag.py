#!/usr/bin/env python3
"""
RAG Application Container Diagnostic Script
Comprehensive troubleshooting for backend container connection issues
"""

import os
import sys
import subprocess
import time
import json
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

def run_command(command, description="", capture_output=True, timeout=30):
    """Run a command and return the result"""
    try:
        if isinstance(command, str):
            command = command.split()
        
        result = subprocess.run(
            command, 
            capture_output=capture_output, 
            text=True, 
            timeout=timeout,
            cwd=os.getcwd()
        )
        
        if result.returncode == 0:
            if description:
                log_info(f"{description} - Success")
            return True, result.stdout.strip()
        else:
            if description:
                log_warning(f"{description} - Failed (exit code: {result.returncode})")
            return False, result.stderr.strip()
            
    except subprocess.TimeoutExpired:
        log_error(f"{description} - Timeout after {timeout}s")
        return False, "Command timed out"
    except Exception as e:
        log_error(f"{description} - Error: {e}")
        return False, str(e)

def check_docker_status():
    """Check Docker daemon and compose status"""
    log_step("Checking Docker status...")
    
    # Check if Docker is running
    success, output = run_command("docker --version", "Docker version check")
    if not success:
        log_error("Docker is not installed or not in PATH")
        return False
    
    log_info(f"Docker version: {output}")
    
    # Check if Docker daemon is running
    success, output = run_command("docker info", "Docker daemon check")
    if not success:
        log_error("Docker daemon is not running")
        log_info("Try: sudo systemctl start docker")
        return False
    
    # Check docker-compose
    success, output = run_command("docker-compose --version", "Docker Compose version check")
    if not success:
        log_warning("docker-compose not found, trying docker compose")
        success, output = run_command("docker compose version", "Docker Compose (new) version check")
        if not success:
            log_error("Neither docker-compose nor 'docker compose' found")
            return False
    
    log_info(f"Docker Compose version: {output}")
    return True

def check_container_status():
    """Check the status of all containers"""
    log_step("Checking container status...")
    
    # List all containers
    success, output = run_command("docker ps -a", "List all containers")
    if not success:
        log_error("Failed to list containers")
        return False
    
    print("\n📋 Container Status:")
    print(output)
    
    # Check specifically for backend-07
    success, output = run_command("docker ps -a --filter name=backend-07", "Backend container status")
    if success and output:
        lines = output.split('\n')
        if len(lines) > 1:  # Header + at least one container
            container_line = lines[1]
            if "Up" in container_line:
                log_info("Backend container is running")
                return True
            else:
                log_warning("Backend container exists but is not running")
                return False
        else:
            log_error("Backend container not found")
            return False
    else:
        log_error("Failed to check backend container status")
        return False

def check_container_logs():
    """Check container logs for errors"""
    log_step("Checking container logs...")
    
    # Get backend container logs
    success, output = run_command("docker logs backend-07 --tail=50", "Backend container logs")
    if success:
        print("\n📋 Backend Container Logs (last 50 lines):")
        print("=" * 60)
        print(output)
        print("=" * 60)
        
        # Look for common error patterns
        if "error" in output.lower() or "exception" in output.lower():
            log_warning("Errors found in container logs")
        if "port 8000" in output.lower():
            log_info("Port 8000 mentioned in logs")
        if "started" in output.lower() or "running" in output.lower():
            log_info("Container appears to have started")
            
        return True, output
    else:
        log_error("Failed to get container logs")
        return False, ""

def check_port_binding():
    """Check if port 8000 is properly bound"""
    log_step("Checking port bindings...")
    
    # Check docker port mapping
    success, output = run_command("docker port backend-07", "Container port mapping")
    if success:
        print(f"\n📋 Port Mappings for backend-07:")
        print(output)
        
        if "8000" in output:
            log_info("Port 8000 is mapped")
        else:
            log_warning("Port 8000 not found in mappings")
    else:
        log_warning("Failed to check port mappings")
    
    # Check if port 8000 is in use
    success, output = run_command("netstat -tlnp | grep :8000", "Port 8000 usage")
    if success and output:
        log_info(f"Port 8000 is in use: {output}")
    else:
        log_warning("Port 8000 does not appear to be in use")
    
    # Check if we can connect locally
    success, output = run_command("curl -s -o /dev/null -w '%{http_code}' http://localhost:8000", "Local connection test")
    if success:
        if output == "200":
            log_info("Successfully connected to localhost:8000")
            return True
        else:
            log_warning(f"Connection to localhost:8000 returned HTTP {output}")
    else:
        log_error("Cannot connect to localhost:8000")
    
    return False

def check_docker_compose_config():
    """Check docker-compose.yml configuration"""
    log_step("Checking docker-compose configuration...")
    
    if not os.path.exists("docker-compose.yml"):
        log_error("docker-compose.yml not found in current directory")
        return False
    
    # Validate docker-compose file
    success, output = run_command("docker-compose config", "Docker compose config validation")
    if success:
        log_info("docker-compose.yml is valid")
        
        # Check for port mappings in the config
        success, config_output = run_command("docker-compose config --services", "List services")
        if success:
            log_info(f"Services defined: {config_output}")
        
        return True
    else:
        log_error("docker-compose.yml has configuration errors:")
        print(output)
        return False

def restart_containers():
    """Restart containers with proper sequence"""
    log_step("Restarting containers...")
    
    # Stop all containers
    success, output = run_command("docker-compose down", "Stop containers")
    if not success:
        log_warning("Failed to stop containers gracefully, forcing stop...")
        run_command("docker stop $(docker ps -aq)", "Force stop all containers")
    
    # Wait a moment
    time.sleep(3)
    
    # Start containers
    success, output = run_command("docker-compose up -d", "Start containers")
    if success:
        log_info("Containers started")
        
        # Wait for startup
        log_info("Waiting 20 seconds for container startup...")
        time.sleep(20)
        
        return True
    else:
        log_error("Failed to start containers:")
        print(output)
        return False

def rebuild_backend():
    """Rebuild the backend container"""
    log_step("Rebuilding backend container...")
    
    # Stop backend container
    run_command("docker-compose stop backend-07", "Stop backend container")
    
    # Remove backend container
    run_command("docker-compose rm -f backend-07", "Remove backend container")
    
    # Rebuild backend
    success, output = run_command("docker-compose build --no-cache backend-07", "Rebuild backend", timeout=300)
    if success:
        log_info("Backend container rebuilt successfully")
        
        # Start the backend
        success, output = run_command("docker-compose up -d backend-07", "Start backend container")
        if success:
            log_info("Backend container started")
            
            # Wait for startup
            log_info("Waiting 30 seconds for backend startup...")
            time.sleep(30)
            
            return True
        else:
            log_error("Failed to start backend container after rebuild")
            return False
    else:
        log_error("Failed to rebuild backend container:")
        print(output)
        return False

def test_api_endpoints():
    """Test API endpoints"""
    log_step("Testing API endpoints...")
    
    endpoints = [
        ("http://localhost:8000/", "Root endpoint"),
        ("http://localhost:8000/health", "Health check"),
        ("http://localhost:8000/docs", "API documentation")
    ]
    
    working_endpoints = 0
    
    for url, description in endpoints:
        success, output = run_command(f"curl -s -o /dev/null -w '%{{http_code}}' {url}", f"Test {description}")
        if success:
            if output in ["200", "307"]:  # 307 is redirect, also good
                log_info(f"{description} - HTTP {output} ✅")
                working_endpoints += 1
            else:
                log_warning(f"{description} - HTTP {output}")
        else:
            log_error(f"{description} - Connection failed")
    
    return working_endpoints, len(endpoints)

def generate_fix_recommendations(issues_found):
    """Generate specific fix recommendations based on issues found"""
    log_step("Generating fix recommendations...")
    
    recommendations = []
    
    if "docker_not_running" in issues_found:
        recommendations.append("🔧 Start Docker daemon: sudo systemctl start docker")
    
    if "container_not_running" in issues_found:
        recommendations.append("🔧 Restart containers: docker-compose up -d")
    
    if "port_not_bound" in issues_found:
        recommendations.append("🔧 Check docker-compose.yml port mappings for backend-07")
    
    if "config_errors" in issues_found:
        recommendations.append("🔧 Fix docker-compose.yml configuration errors")
    
    if "build_errors" in issues_found:
        recommendations.append("🔧 Rebuild backend container: docker-compose build --no-cache backend-07")
    
    if "startup_errors" in issues_found:
        recommendations.append("🔧 Check backend logs: docker logs backend-07")
        recommendations.append("🔧 Verify main.py and config.py are correct")
    
    return recommendations

def main():
    """Main diagnostic function"""
    print("🚀 RAG Application Container Diagnostic Script")
    print("=" * 60)
    
    # Detect project directory
    if not os.path.exists("docker-compose.yml"):
        log_error("docker-compose.yml not found. Please run from the project root directory.")
        sys.exit(1)
    
    log_info(f"Running diagnostics in: {os.getcwd()}")
    
    issues_found = []
    
    # Step 1: Check Docker status
    if not check_docker_status():
        issues_found.append("docker_not_running")
        log_error("Docker is not properly set up. Please install and start Docker.")
        return
    
    # Step 2: Check docker-compose configuration
    if not check_docker_compose_config():
        issues_found.append("config_errors")
    
    # Step 3: Check container status
    if not check_container_status():
        issues_found.append("container_not_running")
    
    # Step 4: Check container logs
    logs_success, logs_output = check_container_logs()
    if logs_success:
        if "error" in logs_output.lower() or "exception" in logs_output.lower():
            issues_found.append("startup_errors")
    
    # Step 5: Check port binding
    if not check_port_binding():
        issues_found.append("port_not_bound")
    
    # Step 6: Test API endpoints
    working, total = test_api_endpoints()
    
    print("\n" + "=" * 60)
    print("📋 DIAGNOSTIC SUMMARY")
    print("=" * 60)
    
    if working == total:
        log_info(f"SUCCESS: All {total} endpoints are working!")
        log_info("Your RAG application is running correctly.")
    elif working > 0:
        log_warning(f"PARTIAL: {working}/{total} endpoints working")
        log_warning("Some functionality may be limited.")
    else:
        log_error(f"FAILURE: No endpoints are working")
        log_error("The application is not responding.")
    
    # Generate recommendations
    if issues_found:
        print("\n🔧 RECOMMENDED FIXES:")
        recommendations = generate_fix_recommendations(issues_found)
        for i, rec in enumerate(recommendations, 1):
            print(f"{i}. {rec}")
        
        print("\n🚀 AUTOMATED FIX OPTIONS:")
        print("1. Run: python3 container_diagnostic_script.py --restart")
        print("2. Run: python3 container_diagnostic_script.py --rebuild")
        print("3. Run: python3 container_diagnostic_script.py --full-reset")
    else:
        log_info("No major issues detected. The problem may be temporary.")
    
    print(f"\n🔗 Test your application:")
    print(f"   Main API: http://localhost:8000/")
    print(f"   Health: http://localhost:8000/health")
    print(f"   Docs: http://localhost:8000/docs")

def handle_automated_fixes():
    """Handle automated fix options"""
    if len(sys.argv) > 1:
        option = sys.argv[1]
        
        if option == "--restart":
            print("🔄 Automated Fix: Restarting containers...")
            if restart_containers():
                working, total = test_api_endpoints()
                if working > 0:
                    log_info("✅ Restart successful!")
                else:
                    log_warning("⚠️  Restart completed but endpoints still not working")
            else:
                log_error("❌ Restart failed")
        
        elif option == "--rebuild":
            print("🔨 Automated Fix: Rebuilding backend...")
            if rebuild_backend():
                working, total = test_api_endpoints()
                if working > 0:
                    log_info("✅ Rebuild successful!")
                else:
                    log_warning("⚠️  Rebuild completed but endpoints still not working")
            else:
                log_error("❌ Rebuild failed")
        
        elif option == "--full-reset":
            print("🔥 Automated Fix: Full reset...")
            run_command("docker-compose down -v", "Stop and remove volumes")
            run_command("docker system prune -f", "Clean Docker system")
            if rebuild_backend():
                working, total = test_api_endpoints()
                if working > 0:
                    log_info("✅ Full reset successful!")
                else:
                    log_warning("⚠️  Full reset completed but endpoints still not working")
            else:
                log_error("❌ Full reset failed")
        
        sys.exit(0)

if __name__ == "__main__":
    handle_automated_fixes()
    main()


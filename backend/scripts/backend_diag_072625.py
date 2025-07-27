#!/usr/bin/env python3
"""
Backend Diagnostic Script
Identifies why backend health checks are not returning 200
"""

import subprocess
import time
import json

def run_cmd(command, description=""):
    """Run command and return result"""
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=30)
        return result.returncode == 0, result.stdout.strip(), result.stderr.strip()
    except Exception as e:
        return False, "", str(e)

def main():
    print("🔍 Backend Diagnostic Analysis")
    print("=" * 40)
    
    # Check container status
    print("\n📊 Container Status:")
    success, stdout, stderr = run_cmd("docker ps --filter name=backend-07 --format 'table {{.Names}}\\t{{.Status}}\\t{{.Ports}}'")
    if success:
        print(stdout)
    else:
        print(f"❌ Failed to get container status: {stderr}")
    
    # Check detailed HTTP responses
    print("\n🌐 HTTP Response Analysis:")
    
    endpoints = [
        ("http://localhost:8000/", "Root endpoint"),
        ("http://localhost:8000/health", "Health endpoint"),
        ("http://localhost:8000/api/v1/queries/history", "Query history"),
        ("http://localhost:8000/docs", "API docs")
    ]
    
    for url, name in endpoints:
        print(f"\n🔍 Testing {name}:")
        
        # Get HTTP status code
        success, code, stderr = run_cmd(f"curl -s -o /dev/null -w '%{{http_code}}' {url}")
        if success:
            print(f"   HTTP Status: {code}")
        else:
            print(f"   HTTP Status: Failed - {stderr}")
        
        # Get response content (first 200 chars)
        success, content, stderr = run_cmd(f"curl -s {url}")
        if success and content:
            if len(content) > 200:
                content = content[:200] + "..."
            print(f"   Response: {content}")
        else:
            print(f"   Response: Failed - {stderr}")
    
    # Check backend logs (last 20 lines)
    print(f"\n📋 Recent Backend Logs:")
    print("-" * 40)
    success, logs, stderr = run_cmd("docker logs backend-07 --tail=20")
    if success:
        print(logs)
    else:
        print(f"❌ Failed to get logs: {stderr}")
    print("-" * 40)
    
    # Check if backend process is running inside container
    print(f"\n🔧 Backend Process Check:")
    success, processes, stderr = run_cmd("docker exec backend-07 ps aux | grep -E '(python|uvicorn|main)'")
    if success:
        print("Backend processes:")
        print(processes)
    else:
        print(f"❌ Failed to check processes: {stderr}")
    
    # Test internal container connectivity
    print(f"\n🌐 Internal Container Test:")
    success, internal_test, stderr = run_cmd("docker exec backend-07 curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/")
    if success:
        print(f"Internal HTTP status: {internal_test}")
    else:
        print(f"Internal test failed: {stderr}")
    
    # Check if port 8000 is actually listening
    print(f"\n🔌 Port Listening Check:")
    success, netstat, stderr = run_cmd("docker exec backend-07 netstat -tlnp | grep :8000")
    if success and netstat:
        print(f"Port 8000 status: {netstat}")
    else:
        print("Port 8000 not found or not listening")
    
    print(f"\n💡 Quick Fix Suggestions:")
    print("1. If HTTP status is 503: Backend started but has dependency issues")
    print("2. If HTTP status is 404: Routes not properly loaded")
    print("3. If no HTTP response: Backend process crashed or not listening")
    print("4. Check the logs above for specific error messages")
    
    print(f"\n🔧 Manual Test Commands:")
    print("docker logs backend-07 --tail=50")
    print("docker exec backend-07 ps aux")
    print("curl -v http://localhost:8000/health")

if __name__ == "__main__":
    main()

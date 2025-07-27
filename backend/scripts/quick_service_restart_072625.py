#!/usr/bin/env python3
"""
Quick Service Restart for RAG Application
Fast restoration of postgres-07, qdrant-07, and frontend-07
"""

import subprocess
import time

def run_cmd(command, description=""):
    """Run command and show result"""
    print(f"🔧 {description}...")
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=60)
        if result.returncode == 0:
            print(f"✅ {description} - Success")
            return True
        else:
            print(f"⚠️  {description} - Warning: {result.stderr}")
            return False
    except Exception as e:
        print(f"❌ {description} - Error: {e}")
        return False

def main():
    print("⚡ Quick Service Restart for RAG Application")
    print("=" * 50)
    
    # Step 1: Start all services
    print("\n🚀 Starting all services...")
    run_cmd("docker-compose up -d", "Start all services")
    
    # Step 2: Wait for startup
    print("\n⏳ Waiting for services to initialize...")
    time.sleep(15)
    
    # Step 3: Check status
    print("\n📊 Checking service status...")
    run_cmd("docker ps --filter name=postgres-07 --filter name=qdrant-07 --filter name=frontend-07 --filter name=backend-07", "Service status")
    
    # Step 4: Test endpoints
    print("\n🧪 Testing endpoints...")
    
    endpoints = [
        ("curl -s -o /dev/null -w '%{http_code}' http://localhost:8000/", "Backend API"),
        ("curl -s -o /dev/null -w '%{http_code}' http://localhost:3000/", "Frontend UI"),
        ("curl -s -o /dev/null -w '%{http_code}' http://localhost:6333/", "Qdrant API"),
        ("nc -z localhost 5432", "PostgreSQL Port")
    ]
    
    working = 0
    for cmd, name in endpoints:
        if run_cmd(cmd, f"Test {name}"):
            working += 1
    
    # Summary
    print(f"\n📋 QUICK RESTART SUMMARY")
    print("=" * 30)
    print(f"Services tested: {working}/{len(endpoints)}")
    
    if working == len(endpoints):
        print("🎉 SUCCESS! All services are running")
        print("\n🔗 Access URLs:")
        print("   Frontend: http://localhost:3000")
        print("   Backend: http://localhost:8000")
        print("   API Docs: http://localhost:8000/docs")
    elif working > 0:
        print("⚠️  PARTIAL: Some services working")
        print("Run the full restoration script for detailed diagnosis")
    else:
        print("❌ FAILED: Services not responding")
        print("Check logs: docker-compose logs")

if __name__ == "__main__":
    main()


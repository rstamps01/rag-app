#!/usr/bin/env python3
"""
Test Pipeline Monitor Deployment
===============================

This script tests the Pipeline Monitor deployment to ensure all components
are working correctly with the correct project path /home/vastdata/rag-app-07.
"""

import requests
import json
import os
import time
from datetime import datetime

def test_project_structure():
    """Test if the project structure exists."""
    print("🔍 Testing Project Structure")
    print("============================")
    
    project_dir = "/home/vastdata/rag-app-07"
    frontend_dir = f"{project_dir}/frontend/rag-ui-new"
    backend_dir = f"{project_dir}/backend"
    
    # Check project directory
    if os.path.exists(project_dir):
        print(f"✅ Project directory exists: {project_dir}")
    else:
        print(f"❌ Project directory not found: {project_dir}")
        return False
    
    # Check frontend directory
    if os.path.exists(frontend_dir):
        print(f"✅ Frontend directory exists: {frontend_dir}")
    else:
        print(f"❌ Frontend directory not found: {frontend_dir}")
        return False
    
    # Check backend directory
    if os.path.exists(backend_dir):
        print(f"✅ Backend directory exists: {backend_dir}")
    else:
        print(f"❌ Backend directory not found: {backend_dir}")
        return False
    
    return True

def test_component_files():
    """Test if the component files exist."""
    print("\n📁 Testing Component Files")
    print("===========================")
    
    files_to_check = [
        "/home/ubuntu/useWebSocket.jsx",
        "/home/ubuntu/PipelineMonitoringDashboard.jsx",
        "/home/ubuntu/deploy_pipeline_monitor_complete.sh"
    ]
    
    all_exist = True
    for file_path in files_to_check:
        if os.path.exists(file_path):
            size = os.path.getsize(file_path)
            print(f"✅ {os.path.basename(file_path)}: {size} bytes")
        else:
            print(f"❌ {os.path.basename(file_path)}: Not found")
            all_exist = False
    
    return all_exist

def test_endpoints():
    """Test the backend endpoints."""
    print("\n🧪 Testing Backend Endpoints")
    print("=============================")
    
    base_url = "http://localhost:8000"
    
    # Test WebSocket endpoint
    try:
        response = requests.get(f"{base_url}/api/v1/ws/test", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ WebSocket Test: {data.get('status', 'unknown')}")
            print(f"   Active connections: {data.get('active_connections', 0)}")
        else:
            print(f"❌ WebSocket Test failed: {response.status_code}")
    except Exception as e:
        print(f"❌ WebSocket Test error: {e}")
    
    # Test monitoring status
    try:
        response = requests.get(f"{base_url}/api/v1/monitoring/status", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"✅ Monitoring Status: {data.get('status', 'unknown')}")
            
            metrics = data.get('metrics', {})
            system_health = metrics.get('system_health', {})
            gpu_performance = metrics.get('gpu_performance', [])
            
            print(f"   CPU: {system_health.get('cpu_percent', 0)}%")
            print(f"   Memory: {system_health.get('memory_percent', 0)}%")
            
            if gpu_performance and len(gpu_performance) > 0:
                gpu = gpu_performance[0]
                print(f"   GPU: {gpu.get('utilization', 0)}% util, {gpu.get('temperature', 0)}°C")
            else:
                print("   GPU: No data available")
                
        else:
            print(f"❌ Monitoring Status failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Monitoring Status error: {e}")
    
    # Test frontend
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend: Responding")
        else:
            print(f"❌ Frontend failed: {response.status_code}")
    except Exception as e:
        print(f"❌ Frontend error: {e}")

def test_deployment_script():
    """Test the deployment script."""
    print("\n📜 Testing Deployment Script")
    print("=============================")
    
    script_path = "/home/ubuntu/deploy_pipeline_monitor_complete.sh"
    
    if os.path.exists(script_path):
        # Check if executable
        if os.access(script_path, os.X_OK):
            print("✅ Deployment script is executable")
        else:
            print("❌ Deployment script is not executable")
        
        # Check script content
        with open(script_path, 'r') as f:
            content = f.read()
            if "/home/vastdata/rag-app-07" in content:
                print("✅ Script uses correct project path")
            else:
                print("❌ Script does not use correct project path")
        
        print(f"✅ Script size: {len(content)} characters")
    else:
        print("❌ Deployment script not found")

def main():
    """Run all tests."""
    print("🧪 Pipeline Monitor Deployment Test Suite")
    print("==========================================")
    print(f"Test started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    
    # Run tests
    structure_ok = test_project_structure()
    files_ok = test_component_files()
    test_deployment_script()
    
    # Only test endpoints if we're not in sandbox
    if structure_ok:
        test_endpoints()
    else:
        print("\n⚠️ Skipping endpoint tests - project structure not found")
        print("This is expected when running in sandbox environment")
    
    print("\n" + "="*50)
    print("📊 Test Summary")
    print("="*50)
    
    if files_ok:
        print("✅ All component files are ready for deployment")
    else:
        print("❌ Some component files are missing")
    
    print("\n🚀 Deployment Instructions:")
    print("1. Copy all files to your project server")
    print("2. Run: bash /home/ubuntu/deploy_pipeline_monitor_complete.sh")
    print("3. Open: http://localhost:3000/monitoring")
    print("4. Click 'Debug' button to verify WebSocket data")
    
    print("\n📁 Files to Deploy:")
    print("- useWebSocket.jsx (Enhanced WebSocket hook)")
    print("- PipelineMonitoringDashboard.jsx (Complete dashboard)")
    print("- deploy_pipeline_monitor_complete.sh (Automated deployment)")
    
    print(f"\nTest completed at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    main()


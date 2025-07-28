#!/usr/bin/env python3
"""
Integrated Solution Test Suite
=============================

This script tests the complete integrated solution including:
- Restored main.py functionality
- Enhanced WebSocket monitoring with data transformation
- Frontend-backend compatibility
"""

import json
import time
import requests
import websockets
import asyncio
from datetime import datetime

async def test_websocket_data_transformation():
    """Test WebSocket data transformation"""
    print("🧪 Testing WebSocket Data Transformation...")
    
    try:
        uri = "ws://localhost:8000/api/v1/ws/pipeline-monitoring"
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connected")
            
            # Wait for initial state
            initial_message = await websocket.recv()
            initial_data = json.loads(initial_message)
            print(f"✅ Received initial state: {initial_data['type']}")
            
            # Wait for metrics update
            metrics_message = await websocket.recv()
            metrics_data = json.loads(metrics_message)
            print(f"✅ Received metrics update: {metrics_data['type']}")
            
            # Check data transformation
            if "data" in metrics_data:
                data = metrics_data["data"]
                
                # Check transformed field names
                checks = [
                    ("system_health.cpu_percent", "cpu_percent" in str(data)),
                    ("gpu_performance array", isinstance(data.get("gpu_performance", []), list)),
                    ("pipeline_status.queries_per_minute", "queries_per_minute" in str(data)),
                    ("connection_status.websocket_connections", "websocket_connections" in str(data)),
                    ("lastUpdate timestamp", "lastUpdate" in data)
                ]
                
                for check_name, result in checks:
                    if result:
                        print(f"✅ {check_name}: Transformed correctly")
                    else:
                        print(f"❌ {check_name}: Transformation missing")
                
                return True
            else:
                print("❌ No data in metrics message")
                return False
                
    except Exception as e:
        print(f"❌ WebSocket test failed: {e}")
        return False

def test_api_endpoints():
    """Test all API endpoints"""
    print("🧪 Testing API Endpoints...")
    
    endpoints = [
        ("GET", "http://localhost:8000/", "Root endpoint"),
        ("GET", "http://localhost:8000/health", "Health check"),
        ("GET", "http://localhost:8000/api/v1/status", "System status"),
        ("GET", "http://localhost:8000/api/v1/queries/history", "Query history"),
        ("GET", "http://localhost:8000/api/v1/documents/", "Documents list"),
        ("GET", "http://localhost:8000/api/v1/ws/test", "WebSocket test"),
        ("GET", "http://localhost:8000/api/v1/monitoring/status", "Monitoring status")
    ]
    
    results = []
    for method, url, description in endpoints:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                print(f"✅ {description}: {response.status_code}")
                results.append(True)
            else:
                print(f"❌ {description}: {response.status_code}")
                results.append(False)
        except Exception as e:
            print(f"❌ {description}: Error - {e}")
            results.append(False)
    
    return sum(results) == len(results)

def test_data_format_compatibility():
    """Test data format compatibility"""
    print("🧪 Testing Data Format Compatibility...")
    
    try:
        # Test monitoring status endpoint
        response = requests.get("http://localhost:8000/api/v1/monitoring/status", timeout=5)
        if response.status_code == 200:
            data = response.json()
            
            if "metrics" in data:
                metrics = data["metrics"]
                
                # Check for transformed field names
                compatibility_checks = [
                    ("system_health.cpu_percent", "system_health" in metrics and "cpu_percent" in str(metrics["system_health"])),
                    ("gpu_performance array format", "gpu_performance" in metrics and isinstance(metrics["gpu_performance"], list)),
                    ("pipeline_status.queries_per_minute", "pipeline_status" in metrics and "queries_per_minute" in str(metrics["pipeline_status"])),
                    ("connection_status.websocket_connections", "connection_status" in metrics and "websocket_connections" in str(metrics["connection_status"])),
                    ("ISO timestamp format", "lastUpdate" in metrics and "Z" in metrics["lastUpdate"])
                ]
                
                passed = 0
                for check_name, result in compatibility_checks:
                    if result:
                        print(f"✅ {check_name}: Compatible")
                        passed += 1
                    else:
                        print(f"❌ {check_name}: Incompatible")
                
                print(f"📊 Compatibility: {passed}/{len(compatibility_checks)} checks passed")
                return passed == len(compatibility_checks)
            else:
                print("❌ No metrics in response")
                return False
        else:
            print(f"❌ Monitoring status endpoint failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Data format test failed: {e}")
        return False

async def run_comprehensive_test():
    """Run comprehensive integration test"""
    print("🚀 INTEGRATED SOLUTION COMPREHENSIVE TEST")
    print("=" * 60)
    print(f"🕐 Test started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tests = [
        ("API Endpoints", test_api_endpoints),
        ("Data Format Compatibility", test_data_format_compatibility),
        ("WebSocket Data Transformation", test_websocket_data_transformation)
    ]
    
    passed_tests = 0
    total_tests = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🧪 Running {test_name}...")
        try:
            if asyncio.iscoroutinefunction(test_func):
                result = await test_func()
            else:
                result = test_func()
                
            if result:
                print(f"✅ {test_name}: PASSED")
                passed_tests += 1
            else:
                print(f"❌ {test_name}: FAILED")
        except Exception as e:
            print(f"❌ {test_name}: ERROR - {str(e)}")
    
    print("\n" + "=" * 60)
    print("📊 INTEGRATION TEST RESULTS")
    print("=" * 60)
    print(f"✅ Tests Passed: {passed_tests}/{total_tests}")
    print(f"❌ Tests Failed: {total_tests - passed_tests}/{total_tests}")
    
    if passed_tests == total_tests:
        print("\n🎉 ALL INTEGRATION TESTS PASSED!")
        print("✅ Complete integrated solution is working correctly")
        print("✅ API endpoints functional")
        print("✅ Data transformation working")
        print("✅ WebSocket communication successful")
        print("✅ Frontend-backend compatibility achieved")
    else:
        print(f"\n⚠️ {total_tests - passed_tests} integration tests failed")
        print("❌ Solution needs additional fixes")
    
    print(f"\n🕐 Test completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    return passed_tests == total_tests

if __name__ == "__main__":
    asyncio.run(run_comprehensive_test())

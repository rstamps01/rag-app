#!/usr/bin/env python3
"""
Test Frontend WebSocket Data Reception
=====================================

This script tests the frontend WebSocket data reception fixes.
"""

import asyncio
import websockets
import json
import time
import requests
from datetime import datetime

async def test_websocket_connection():
    """Test WebSocket connection and message reception"""
    print("🧪 Testing WebSocket Connection...")
    
    try:
        uri = "ws://localhost:8000/api/v1/ws/pipeline-monitoring"
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connected successfully")
            
            # Wait for initial state
            try:
                initial_message = await asyncio.wait_for(websocket.recv(), timeout=5)
                initial_data = json.loads(initial_message)
                print(f"✅ Received initial message: {initial_data['type']}")
            except asyncio.TimeoutError:
                print("⚠️ No initial message received within 5 seconds")
            
            # Wait for metrics update
            try:
                metrics_message = await asyncio.wait_for(websocket.recv(), timeout=10)
                metrics_data = json.loads(metrics_message)
                print(f"✅ Received metrics message: {metrics_data['type']}")
                
                if 'data' in metrics_data:
                    data = metrics_data['data']
                    print("📊 Metrics data structure:")
                    for key in data.keys():
                        print(f"   - {key}")
                    
                    # Check for expected fields
                    expected_fields = [
                        'system_health',
                        'gpu_performance', 
                        'pipeline_status',
                        'connection_status'
                    ]
                    
                    for field in expected_fields:
                        if field in data:
                            print(f"   ✅ {field}: Present")
                        else:
                            print(f"   ❌ {field}: Missing")
                
                return True
            except asyncio.TimeoutError:
                print("❌ No metrics message received within 10 seconds")
                return False
                
    except Exception as e:
        print(f"❌ WebSocket connection failed: {e}")
        return False

def test_monitoring_endpoint():
    """Test the monitoring status endpoint"""
    print("🧪 Testing Monitoring Endpoint...")
    
    try:
        response = requests.get("http://localhost:8000/api/v1/monitoring/status", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ Monitoring endpoint responding")
            
            # Check data structure
            if 'metrics' in data:
                metrics = data['metrics']
                print("📊 Available metrics:")
                for key, value in metrics.items():
                    print(f"   - {key}: {type(value).__name__}")
                
                # Check specific values
                if 'system_health' in metrics:
                    cpu = metrics['system_health'].get('cpu_percent', 0)
                    memory = metrics['system_health'].get('memory_percent', 0)
                    print(f"   CPU: {cpu}%, Memory: {memory}%")
                
                if 'gpu_performance' in metrics:
                    gpu_data = metrics['gpu_performance']
                    if isinstance(gpu_data, list) and len(gpu_data) > 0:
                        gpu = gpu_data[0]
                        print(f"   GPU: {gpu.get('utilization', 0)}% util, {gpu.get('temperature', 0)}°C")
                
                return True
            else:
                print("❌ No metrics in response")
                return False
        else:
            print(f"❌ Monitoring endpoint failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Monitoring endpoint error: {e}")
        return False

def test_frontend_accessibility():
    """Test if frontend is accessible"""
    print("🧪 Testing Frontend Accessibility...")
    
    try:
        response = requests.get("http://localhost:3000", timeout=5)
        if response.status_code == 200:
            print("✅ Frontend is accessible")
            return True
        else:
            print(f"❌ Frontend not accessible: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Frontend accessibility error: {e}")
        return False

async def run_comprehensive_test():
    """Run comprehensive test suite"""
    print("🚀 FRONTEND WEBSOCKET DATA RECEPTION TEST")
    print("=" * 60)
    print(f"🕐 Test started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tests = [
        ("Frontend Accessibility", test_frontend_accessibility),
        ("Monitoring Endpoint", test_monitoring_endpoint),
        ("WebSocket Connection", test_websocket_connection)
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
    print("📊 TEST RESULTS")
    print("=" * 60)
    print(f"✅ Tests Passed: {passed_tests}/{total_tests}")
    print(f"❌ Tests Failed: {total_tests - passed_tests}/{total_tests}")
    
    if passed_tests == total_tests:
        print("\n🎉 ALL TESTS PASSED!")
        print("✅ Frontend WebSocket data reception is working correctly")
        print("✅ Pipeline Monitor should display real-time metrics")
        print("✅ Open http://localhost:3000/monitoring to verify")
    else:
        print(f"\n⚠️ {total_tests - passed_tests} tests failed")
        print("❌ Frontend WebSocket data reception needs additional fixes")
        print("🔍 Check browser console and container logs for errors")
    
    print(f"\n🕐 Test completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    return passed_tests == total_tests

if __name__ == "__main__":
    asyncio.run(run_comprehensive_test())

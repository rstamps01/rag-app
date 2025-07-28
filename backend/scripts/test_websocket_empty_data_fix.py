#!/usr/bin/env python3
"""
Test WebSocket Empty Data Fix
============================

This script tests that the WebSocket empty data issue has been resolved.
"""

import asyncio
import websockets
import json
import time
import requests
from datetime import datetime

async def test_websocket_data_content():
    """Test that WebSocket messages contain actual data"""
    print("🧪 Testing WebSocket Data Content...")
    
    try:
        uri = "ws://localhost:8000/api/v1/ws/pipeline-monitoring"
        async with websockets.connect(uri) as websocket:
            print("✅ WebSocket connected successfully")
            
            # Wait for initial state
            try:
                initial_message = await asyncio.wait_for(websocket.recv(), timeout=5)
                initial_data = json.loads(initial_message)
                print(f"✅ Received initial message: {initial_data['type']}")
                
                # Check if initial state has data
                if 'data' in initial_data and initial_data['data']:
                    print("✅ Initial state contains data")
                    if 'pipeline' in initial_data['data']:
                        print("✅ Pipeline data present in initial state")
                else:
                    print("❌ Initial state data is empty")
                    return False
                    
            except asyncio.TimeoutError:
                print("⚠️ No initial message received within 5 seconds")
            
            # Wait for metrics update
            try:
                metrics_message = await asyncio.wait_for(websocket.recv(), timeout=10)
                metrics_data = json.loads(metrics_message)
                print(f"✅ Received metrics message: {metrics_data['type']}")
                
                if 'data' in metrics_data and metrics_data['data']:
                    data = metrics_data['data']
                    print("✅ Metrics message contains data")
                    
                    # Check for specific data fields
                    checks = [
                        ('system_health', 'cpu_percent'),
                        ('system_health', 'memory_percent'),
                        ('gpu_performance', 0, 'utilization'),
                        ('pipeline_status', 'queries_per_minute'),
                        ('connection_status', 'websocket_connections')
                    ]
                    
                    data_found = 0
                    for check in checks:
                        try:
                            if len(check) == 2:
                                section, field = check
                                if section in data and field in data[section]:
                                    value = data[section][field]
                                    print(f"✅ {section}.{field}: {value}")
                                    data_found += 1
                                else:
                                    print(f"❌ {section}.{field}: Missing")
                            elif len(check) == 3:
                                section, index, field = check
                                if (section in data and 
                                    isinstance(data[section], list) and 
                                    len(data[section]) > index and
                                    field in data[section][index]):
                                    value = data[section][index][field]
                                    print(f"✅ {section}[{index}].{field}: {value}")
                                    data_found += 1
                                else:
                                    print(f"❌ {section}[{index}].{field}: Missing")
                        except Exception as e:
                            print(f"❌ Error checking {check}: {str(e)}")
                    
                    print(f"📊 Data fields found: {data_found}/{len(checks)}")
                    return data_found >= len(checks) * 0.8  # 80% success rate
                else:
                    print("❌ Metrics message data is empty")
                    return False
                    
            except asyncio.TimeoutError:
                print("❌ No metrics message received within 10 seconds")
                return False
                
    except Exception as e:
        print(f"❌ WebSocket test failed: {e}")
        return False

def test_monitoring_endpoint_data():
    """Test that monitoring endpoint returns actual data"""
    print("🧪 Testing Monitoring Endpoint Data...")
    
    try:
        response = requests.get("http://localhost:8000/api/v1/monitoring/status", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print("✅ Monitoring endpoint responding")
            
            if 'metrics' in data and data['metrics']:
                metrics = data['metrics']
                print("✅ Metrics data present")
                
                # Check for non-zero values
                checks = [
                    ('system_health', 'cpu_percent', 'CPU percentage'),
                    ('system_health', 'memory_percent', 'Memory percentage'),
                    ('gpu_performance', 0, 'utilization', 'GPU utilization'),
                    ('connection_status', 'websocket_connections', 'WebSocket connections')
                ]
                
                non_zero_found = 0
                for check in checks:
                    try:
                        if len(check) == 3:
                            section, field, description = check
                            if section in metrics and field in metrics[section]:
                                value = metrics[section][field]
                                if isinstance(value, (int, float)) and value > 0:
                                    print(f"✅ {description}: {value} (non-zero)")
                                    non_zero_found += 1
                                else:
                                    print(f"⚠️ {description}: {value} (zero or non-numeric)")
                        elif len(check) == 4:
                            section, index, field, description = check
                            if (section in metrics and 
                                isinstance(metrics[section], list) and 
                                len(metrics[section]) > index and
                                field in metrics[section][index]):
                                value = metrics[section][index][field]
                                if isinstance(value, (int, float)) and value > 0:
                                    print(f"✅ {description}: {value} (non-zero)")
                                    non_zero_found += 1
                                else:
                                    print(f"⚠️ {description}: {value} (zero or non-numeric)")
                    except Exception as e:
                        print(f"❌ Error checking {check}: {str(e)}")
                
                print(f"📊 Non-zero values found: {non_zero_found}/{len(checks)}")
                return non_zero_found >= 2  # At least 2 non-zero values
            else:
                print("❌ No metrics data in response")
                return False
        else:
            print(f"❌ Monitoring endpoint failed: {response.status_code}")
            return False
            
    except Exception as e:
        print(f"❌ Monitoring endpoint error: {e}")
        return False

async def run_empty_data_fix_test():
    """Run test suite for empty data fix"""
    print("🚀 WEBSOCKET EMPTY DATA FIX TEST")
    print("=" * 60)
    print(f"🕐 Test started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    tests = [
        ("Monitoring Endpoint Data", test_monitoring_endpoint_data),
        ("WebSocket Data Content", test_websocket_data_content)
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
        print("✅ WebSocket empty data issue has been resolved")
        print("✅ Pipeline Monitor should now display real metrics")
        print("✅ Debug panel should show actual data instead of {}")
    else:
        print(f"\n⚠️ {total_tests - passed_tests} tests failed")
        print("❌ WebSocket empty data issue may still exist")
        print("🔍 Check backend logs and WebSocket implementation")
    
    print(f"\n🕐 Test completed: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    return passed_tests == total_tests

if __name__ == "__main__":
    asyncio.run(run_empty_data_fix_test())

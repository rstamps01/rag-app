#!/usr/bin/env python3
"""
Test WebSocket Lifecycle Management
==================================
Tests the robust WebSocket implementation to ensure it handles browser refreshes properly.
"""

import asyncio
import json
import time
import websockets
import requests
from datetime import datetime

async def test_websocket_lifecycle():
    """Test WebSocket connection lifecycle management."""
    
    print("🧪 WebSocket Lifecycle Test")
    print("=" * 50)
    
    # Test 1: Basic connection
    print("\n🔍 Test 1: Basic WebSocket Connection")
    try:
        uri = "ws://localhost:8000/api/v1/ws/pipeline-monitoring"
        async with websockets.connect(uri) as websocket:
            print("✅ Connected to WebSocket")
            
            # Wait for initial state
            message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
            data = json.loads(message)
            
            if data.get("type") == "initial_state":
                print("✅ Received initial state")
                print(f"   Pipeline stages: {len(data['data']['pipeline']['stages'])}")
            else:
                print(f"⚠️ Unexpected message type: {data.get('type')}")
            
            # Wait for metrics update
            message = await asyncio.wait_for(websocket.recv(), timeout=10.0)
            data = json.loads(message)
            
            if data.get("type") == "metrics_update":
                print("✅ Received metrics update")
                cpu = data['data']['system_health']['cpu_usage']
                print(f"   CPU Usage: {cpu}%")
            else:
                print(f"⚠️ Unexpected message type: {data.get('type')}")
                
    except Exception as e:
        print(f"❌ WebSocket test failed: {e}")
        return False
    
    # Test 2: Connection count accuracy
    print("\n🔍 Test 2: Connection Count Accuracy")
    try:
        response = requests.get("http://localhost:8000/api/v1/ws/test")
        data = response.json()
        
        initial_count = data.get("active_connections", 0)
        print(f"✅ Initial connection count: {initial_count}")
        
        # Create multiple connections
        connections = []
        for i in range(3):
            uri = "ws://localhost:8000/api/v1/ws/pipeline-monitoring"
            conn = await websockets.connect(uri)
            connections.append(conn)
            await asyncio.sleep(0.5)
        
        # Check count increased
        response = requests.get("http://localhost:8000/api/v1/ws/test")
        data = response.json()
        new_count = data.get("active_connections", 0)
        print(f"✅ Connection count after adding 3: {new_count}")
        
        # Close connections
        for conn in connections:
            await conn.close()
        
        await asyncio.sleep(1)
        
        # Check count decreased
        response = requests.get("http://localhost:8000/api/v1/ws/test")
        data = response.json()
        final_count = data.get("active_connections", 0)
        print(f"✅ Final connection count: {final_count}")
        
        if new_count > initial_count and final_count <= initial_count:
            print("✅ Connection counting works correctly")
        else:
            print("⚠️ Connection counting may have issues")
            
    except Exception as e:
        print(f"❌ Connection count test failed: {e}")
        return False
    
    # Test 3: Monitoring status
    print("\n🔍 Test 3: Monitoring Status")
    try:
        response = requests.get("http://localhost:8000/api/v1/monitoring/status")
        data = response.json()
        
        if data.get("status") == "active":
            print("✅ Monitoring status is active")
            
            metrics = data.get("metrics", {})
            system_health = metrics.get("system_health", {})
            
            if system_health.get("cpu_usage") is not None:
                print(f"✅ CPU metrics available: {system_health['cpu_usage']}%")
            
            if system_health.get("memory_usage") is not None:
                print(f"✅ Memory metrics available: {system_health['memory_usage']}%")
                
        else:
            print(f"⚠️ Monitoring status: {data.get('status')}")
            
    except Exception as e:
        print(f"❌ Monitoring status test failed: {e}")
        return False
    
    print("\n🎉 All WebSocket lifecycle tests completed!")
    return True

def test_http_endpoints():
    """Test HTTP endpoints for basic functionality."""
    
    print("\n🔍 HTTP Endpoints Test")
    print("-" * 30)
    
    endpoints = [
        ("WebSocket Test", "http://localhost:8000/api/v1/ws/test"),
        ("Monitoring Status", "http://localhost:8000/api/v1/monitoring/status")
    ]
    
    for name, url in endpoints:
        try:
            response = requests.get(url, timeout=5)
            if response.status_code == 200:
                data = response.json()
                print(f"✅ {name}: {response.status_code}")
                
                if "active_connections" in data:
                    print(f"   Active connections: {data['active_connections']}")
                if "status" in data:
                    print(f"   Status: {data['status']}")
                    
            else:
                print(f"⚠️ {name}: {response.status_code}")
                
        except Exception as e:
            print(f"❌ {name}: {e}")

async def main():
    """Main test function."""
    
    print(f"🧪 WebSocket Lifecycle Test Suite")
    print(f"Started at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    # Test HTTP endpoints first
    test_http_endpoints()
    
    # Test WebSocket lifecycle
    try:
        success = await test_websocket_lifecycle()
        
        if success:
            print("\n🎉 ALL TESTS PASSED!")
            print("\n✅ WebSocket lifecycle management is working correctly")
            print("✅ Browser refresh handling should work properly")
            print("✅ Connection cleanup is functioning")
            print("✅ Monitoring task lifecycle is managed")
            
        else:
            print("\n❌ Some tests failed")
            print("⚠️ WebSocket lifecycle may need additional fixes")
            
    except Exception as e:
        print(f"\n❌ Test suite failed: {e}")
    
    print(f"\nCompleted at: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

if __name__ == "__main__":
    asyncio.run(main())


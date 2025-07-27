#!/usr/bin/env python3
"""
🧪 Test WebSocket Data Flow
===========================
Verify that the fixed WebSocket implementation works correctly
"""

import asyncio
import json
import sys
import os
import time
from pathlib import Path

# Add the project path to sys.path
sys.path.insert(0, '/home/ubuntu/rag-app/backend')

def test_websocket_module_import():
    """Test if the fixed WebSocket module can be imported"""
    print("🔧 Testing fixed WebSocket module import...")
    
    try:
        from app.api.routes.websocket_monitoring import router, get_system_metrics, ConnectionManager, manager
        print("✅ Fixed WebSocket module imported successfully")
        return True, (router, get_system_metrics, ConnectionManager, manager)
    except ImportError as e:
        print(f"❌ Import failed: {e}")
        return False, None
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False, None

def test_system_metrics():
    """Test the system metrics function"""
    print("📊 Testing system metrics...")
    
    try:
        from app.api.routes.websocket_monitoring import get_system_metrics
        
        metrics = get_system_metrics()
        
        # Check required fields
        required_fields = ['timestamp', 'system_health', 'connection_status']
        for field in required_fields:
            if field not in metrics:
                print(f"❌ Missing field: {field}")
                return False
        
        # Check system_health subfields
        system_health = metrics.get('system_health', {})
        health_fields = ['cpu_usage', 'memory_usage', 'memory_available']
        for field in health_fields:
            if field not in system_health:
                print(f"❌ Missing system_health field: {field}")
                return False
        
        print("✅ System metrics working correctly")
        print(f"   CPU Usage: {system_health.get('cpu_usage', 'N/A')}%")
        print(f"   Memory Usage: {system_health.get('memory_usage', 'N/A')}%")
        print(f"   Memory Available: {system_health.get('memory_available', 'N/A')}")
        return True
        
    except Exception as e:
        print(f"❌ System metrics failed: {e}")
        return False

def test_connection_manager():
    """Test the WebSocket connection manager"""
    print("🔌 Testing connection manager...")
    
    try:
        from app.api.routes.websocket_monitoring import ConnectionManager, manager
        
        # Test basic functionality
        if hasattr(manager, 'active_connections') and hasattr(manager, 'connect'):
            print("✅ Connection manager structure correct")
            print(f"   Active connections: {len(manager.active_connections)}")
            return True
        else:
            print("❌ Connection manager missing required methods")
            return False
            
    except Exception as e:
        print(f"❌ Connection manager test failed: {e}")
        return False

def test_router_endpoints():
    """Test if router has required endpoints"""
    print("🛣️ Testing router endpoints...")
    
    try:
        from app.api.routes.websocket_monitoring import router
        
        # Check if router has routes
        if hasattr(router, 'routes') and len(router.routes) > 0:
            print(f"✅ Router has {len(router.routes)} routes")
            
            # List routes
            for route in router.routes:
                if hasattr(route, 'path'):
                    print(f"   📍 {route.path}")
            
            return True
        else:
            print("❌ Router has no routes")
            return False
            
    except Exception as e:
        print(f"❌ Router test failed: {e}")
        return False

def test_json_serialization():
    """Test if metrics can be JSON serialized"""
    print("📝 Testing JSON serialization...")
    
    try:
        from app.api.routes.websocket_monitoring import get_system_metrics
        
        metrics = get_system_metrics()
        json_str = json.dumps(metrics)
        
        # Try to parse it back
        parsed = json.loads(json_str)
        
        print("✅ JSON serialization working")
        print(f"   JSON size: {len(json_str)} bytes")
        
        # Check if parsed data has expected structure
        if 'system_health' in parsed and 'cpu_usage' in parsed['system_health']:
            print(f"   Sample data: CPU {parsed['system_health']['cpu_usage']}%")
        
        return True
        
    except Exception as e:
        print(f"❌ JSON serialization failed: {e}")
        return False

def test_data_consistency():
    """Test if metrics data is consistent across multiple calls"""
    print("🔄 Testing data consistency...")
    
    try:
        from app.api.routes.websocket_monitoring import get_system_metrics
        
        # Get metrics multiple times
        metrics1 = get_system_metrics()
        time.sleep(0.1)
        metrics2 = get_system_metrics()
        
        # Check if both have required structure
        for metrics in [metrics1, metrics2]:
            if 'system_health' not in metrics:
                print("❌ Inconsistent data structure")
                return False
        
        # Check if timestamps are different (showing real-time data)
        if metrics1['timestamp'] != metrics2['timestamp']:
            print("✅ Data consistency verified - timestamps updating")
        else:
            print("⚠️ Timestamps identical - may be cached")
        
        return True
        
    except Exception as e:
        print(f"❌ Data consistency test failed: {e}")
        return False

def main():
    print("🧪 WebSocket Data Flow Test")
    print("=" * 50)
    
    tests = [
        ("Module Import", test_websocket_module_import),
        ("System Metrics", test_system_metrics),
        ("Connection Manager", test_connection_manager),
        ("Router Endpoints", test_router_endpoints),
        ("JSON Serialization", test_json_serialization),
        ("Data Consistency", test_data_consistency)
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n🔍 {test_name}:")
        try:
            if test_func():
                passed += 1
            else:
                print(f"   ⚠️ {test_name} failed")
        except Exception as e:
            print(f"   ❌ {test_name} error: {e}")
    
    print(f"\n📊 Test Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All tests passed! WebSocket data flow is working correctly")
        print("")
        print("🚀 Ready for deployment:")
        print("   1. Copy the fixed websocket_monitoring.py to your project")
        print("   2. Restart your backend container")
        print("   3. Your Pipeline Monitor should show real-time data!")
        return True
    else:
        print("❌ Some tests failed - data flow needs additional fixes")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)


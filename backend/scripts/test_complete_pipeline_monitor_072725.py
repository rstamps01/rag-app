#!/usr/bin/env python3
"""
Complete Pipeline Monitor Test
Tests the entire frontend-backend communication flow
"""

import asyncio
import json
import requests
import websockets
import time
from datetime import datetime

def print_status(message, status="INFO"):
    timestamp = datetime.now().strftime("%H:%M:%S")
    status_colors = {
        "INFO": "🔍",
        "SUCCESS": "✅", 
        "ERROR": "❌",
        "WARNING": "⚠️",
        "TEST": "🧪"
    }
    print(f"[{timestamp}] {status_colors.get(status, '📝')} {message}")

def test_http_endpoints():
    """Test HTTP endpoints"""
    print_status("Testing HTTP Endpoints", "TEST")
    
    try:
        # Test WebSocket test endpoint
        response = requests.get("http://localhost:8000/api/v1/ws/test", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_status(f"WebSocket Test: {response.status_code}", "SUCCESS")
            print_status(f"  Active connections: {data.get('active_connections', 0)}", "INFO")
            print_status(f"  Status: {data.get('status', 'unknown')}", "INFO")
        else:
            print_status(f"WebSocket Test: {response.status_code}", "ERROR")
            return False
    except Exception as e:
        print_status(f"WebSocket Test failed: {e}", "ERROR")
        return False
    
    try:
        # Test monitoring status endpoint
        response = requests.get("http://localhost:8000/api/v1/monitoring/status", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print_status(f"Monitoring Status: {response.status_code}", "SUCCESS")
            print_status(f"  Active connections: {data.get('active_connections', 0)}", "INFO")
            print_status(f"  Status: {data.get('status', 'unknown')}", "INFO")
            
            # Check if transformed metrics are present
            if "transformed_metrics" in data:
                transformed = data["transformed_metrics"]
                print_status("  Transformed metrics found:", "SUCCESS")
                print_status(f"    GPU utilization: {transformed.get('gpu', {}).get('gpu_utilization', 'N/A')}%", "INFO")
                print_status(f"    Memory usage: {transformed.get('gpu', {}).get('memory_usage', 'N/A')}MB", "INFO")
                print_status(f"    Queries/min: {transformed.get('queries', {}).get('queries_per_minute', 'N/A')}", "INFO")
            else:
                print_status("  No transformed metrics found", "WARNING")
        else:
            print_status(f"Monitoring Status: {response.status_code}", "ERROR")
            return False
    except Exception as e:
        print_status(f"Monitoring Status failed: {e}", "ERROR")
        return False
    
    return True

async def test_websocket_connection():
    """Test WebSocket connection and data flow"""
    print_status("Testing WebSocket Connection", "TEST")
    
    try:
        uri = "ws://localhost:8000/api/v1/ws/pipeline-monitoring"
        
        async with websockets.connect(uri) as websocket:
            print_status("WebSocket connected successfully", "SUCCESS")
            
            # Wait for initial messages
            messages_received = []
            timeout_count = 0
            max_timeout = 10  # 10 seconds
            
            while len(messages_received) < 3 and timeout_count < max_timeout:
                try:
                    message = await asyncio.wait_for(websocket.recv(), timeout=1.0)
                    data = json.loads(message)
                    messages_received.append(data)
                    
                    print_status(f"Received message type: {data.get('type', 'unknown')}", "SUCCESS")
                    
                    # Analyze message content
                    if data.get("type") == "initial_state":
                        stages = data.get("data", {}).get("stages", [])
                        print_status(f"  Initial state: {len(stages)} pipeline stages", "INFO")
                    
                    elif data.get("type") == "metrics_update":
                        metrics_data = data.get("data", {})
                        if "gpu" in metrics_data:
                            gpu = metrics_data["gpu"]
                            print_status(f"  GPU metrics: {gpu.get('gpu_utilization', 'N/A')}% utilization", "INFO")
                        if "queries" in metrics_data:
                            queries = metrics_data["queries"]
                            print_status(f"  Query metrics: {queries.get('queries_per_minute', 'N/A')} QPM", "INFO")
                        if "lastUpdate" in metrics_data:
                            print_status(f"  Last update: {metrics_data['lastUpdate']}", "INFO")
                
                except asyncio.TimeoutError:
                    timeout_count += 1
                    print_status(f"Waiting for messages... ({timeout_count}s)", "INFO")
            
            print_status(f"Received {len(messages_received)} messages total", "SUCCESS")
            
            # Send a test message
            test_message = {"type": "ping"}
            await websocket.send(json.dumps(test_message))
            print_status("Sent ping message", "INFO")
            
            # Wait for pong response
            try:
                response = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                response_data = json.loads(response)
                if response_data.get("type") == "pong":
                    print_status("Received pong response", "SUCCESS")
                else:
                    print_status(f"Unexpected response: {response_data.get('type')}", "WARNING")
            except asyncio.TimeoutError:
                print_status("No pong response received", "WARNING")
            
            return len(messages_received) > 0
            
    except Exception as e:
        print_status(f"WebSocket connection failed: {e}", "ERROR")
        return False

def test_data_format_compatibility():
    """Test that the data format is compatible with frontend expectations"""
    print_status("Testing Data Format Compatibility", "TEST")
    
    try:
        response = requests.get("http://localhost:8000/api/v1/monitoring/status", timeout=5)
        if response.status_code != 200:
            print_status("Cannot get monitoring data for format test", "ERROR")
            return False
        
        data = response.json()
        transformed = data.get("transformed_metrics", {})
        
        # Check required frontend fields
        required_fields = {
            "gpu": ["gpu_utilization", "memory_usage", "temperature"],
            "queries": ["queries_per_minute", "avg_response_time", "active_queries"],
            "pipeline": ["success_rate", "active_connections"],
            "lastUpdate": None
        }
        
        all_fields_present = True
        
        for section, fields in required_fields.items():
            if section == "lastUpdate":
                if section not in transformed:
                    print_status(f"Missing field: {section}", "ERROR")
                    all_fields_present = False
                else:
                    print_status(f"✅ {section}: {transformed[section]}", "SUCCESS")
            else:
                if section not in transformed:
                    print_status(f"Missing section: {section}", "ERROR")
                    all_fields_present = False
                    continue
                
                section_data = transformed[section]
                for field in fields:
                    if field not in section_data:
                        print_status(f"Missing field: {section}.{field}", "ERROR")
                        all_fields_present = False
                    else:
                        value = section_data[field]
                        print_status(f"✅ {section}.{field}: {value}", "SUCCESS")
        
        if all_fields_present:
            print_status("All required fields present and correctly formatted", "SUCCESS")
        else:
            print_status("Some required fields are missing", "ERROR")
        
        return all_fields_present
        
    except Exception as e:
        print_status(f"Data format test failed: {e}", "ERROR")
        return False

async def main():
    """Main test execution"""
    print_status("Complete Pipeline Monitor Test Suite", "INFO")
    print_status("Started at: " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "INFO")
    print("=" * 60)
    
    # Test 1: HTTP Endpoints
    print_status("Test 1: HTTP Endpoints", "TEST")
    print("-" * 30)
    http_success = test_http_endpoints()
    
    print()
    
    # Test 2: WebSocket Connection
    print_status("Test 2: WebSocket Connection", "TEST")
    print("-" * 30)
    websocket_success = await test_websocket_connection()
    
    print()
    
    # Test 3: Data Format Compatibility
    print_status("Test 3: Data Format Compatibility", "TEST")
    print("-" * 30)
    format_success = test_data_format_compatibility()
    
    print()
    print("=" * 60)
    
    # Summary
    total_tests = 3
    passed_tests = sum([http_success, websocket_success, format_success])
    
    print_status(f"Test Results: {passed_tests}/{total_tests} tests passed", "INFO")
    
    if http_success:
        print_status("✅ HTTP endpoints working", "SUCCESS")
    else:
        print_status("❌ HTTP endpoints failed", "ERROR")
    
    if websocket_success:
        print_status("✅ WebSocket connection working", "SUCCESS")
    else:
        print_status("❌ WebSocket connection failed", "ERROR")
    
    if format_success:
        print_status("✅ Data format compatibility confirmed", "SUCCESS")
    else:
        print_status("❌ Data format compatibility failed", "ERROR")
    
    if passed_tests == total_tests:
        print_status("🎉 ALL TESTS PASSED!", "SUCCESS")
        print_status("✅ Pipeline Monitor should display metrics correctly", "SUCCESS")
        print_status("🌐 Open http://localhost:3000/monitoring to verify", "INFO")
    else:
        print_status("⚠️ Some tests failed", "WARNING")
        print_status("Pipeline Monitor may not display metrics correctly", "WARNING")
    
    print_status("Completed at: " + datetime.now().strftime("%Y-%m-%d %H:%M:%S"), "INFO")

if __name__ == "__main__":
    asyncio.run(main())


#!/usr/bin/env python3
"""
Test script to verify backend functionality
"""

import requests
import time

def test_backend_endpoints():
    """Test all backend endpoints"""
    base_url = "http://localhost:8000"
    
    endpoints = [
        "/",
        "/health", 
        "/api/v1/queries/history",
        "/api/v1/documents/",
        "/api/v1/monitoring/status"
    ]
    
    print("🧪 Testing Backend Endpoints")
    print("=" * 40)
    
    for endpoint in endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}", timeout=5)
            status = "✅ OK" if response.status_code == 200 else f"❌ {response.status_code}"
            print(f"{endpoint:<30} {status}")
        except Exception as e:
            print(f"{endpoint:<30} ❌ ERROR: {e}")
    
    print("
🔌 Testing WebSocket Connection")
    print("=" * 40)
    
    try:
        import websocket
        
        def on_message(ws, message):
            print(f"📨 Received: {message}")
        
        def on_error(ws, error):
            print(f"❌ WebSocket Error: {error}")
        
        def on_close(ws, close_status_code, close_msg):
            print("🔌 WebSocket connection closed")
        
        def on_open(ws):
            print("✅ WebSocket connected successfully")
            ws.send('{"type": "ping"}')
        
        ws = websocket.WebSocketApp(
            f"ws://localhost:8000/api/v1/ws/pipeline-monitoring",
            on_open=on_open,
            on_message=on_message,
            on_error=on_error,
            on_close=on_close
        )
        
        # Run for 5 seconds
        ws.run_forever()
        
    except ImportError:
        print("❌ websocket-client not installed. Install with: pip install websocket-client")
    except Exception as e:
        print(f"❌ WebSocket test failed: {e}")

if __name__ == "__main__":
    test_backend_endpoints()
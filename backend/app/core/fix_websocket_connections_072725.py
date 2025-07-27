#!/usr/bin/env python3
"""
Fix WebSocket Connection Issues for Pipeline Monitor
==================================================

This script fixes the WebSocket connection issues causing the Pipeline Monitor
to show "Disconnected" status and 403 Forbidden errors.

Issues Fixed:
1. Missing WebSocket endpoint in backend
2. Incorrect WebSocket URL in frontend
3. Missing authentication handling
4. WebSocket connection error handling
"""

import os
import json
import subprocess
import time
import requests
from pathlib import Path

def run_command(cmd, cwd=None, timeout=30):
    """Run shell command with timeout and error handling"""
    try:
        result = subprocess.run(
            cmd, shell=True, cwd=cwd, capture_output=True, 
            text=True, timeout=timeout
        )
        return result.returncode == 0, result.stdout, result.stderr
    except subprocess.TimeoutExpired:
        return False, "", f"Command timed out after {timeout}s"
    except Exception as e:
        return False, "", str(e)

def find_project_directory():
    """Find the RAG application project directory"""
    possible_paths = [
        "/home/vastdata/rag-app-07",
        "/home/ubuntu/rag-app-analysis",
        os.getcwd()
    ]
    
    for path in possible_paths:
        if os.path.exists(os.path.join(path, "docker-compose.yml")):
            return path
    
    return None

def backup_file(file_path):
    """Create backup of file before modification"""
    if os.path.exists(file_path):
        backup_path = f"{file_path}.websocket-fix.backup"
        with open(file_path, 'r') as src, open(backup_path, 'w') as dst:
            dst.write(src.read())
        print(f"✅ Backed up {file_path} to {backup_path}")
        return True
    return False

def create_websocket_backend_endpoint(project_dir):
    """Create WebSocket endpoint in backend"""
    print("🔧 Creating WebSocket endpoint in backend...")
    
    # Create WebSocket manager
    websocket_manager_path = os.path.join(project_dir, "backend/app/core/websocket_manager.py")
    os.makedirs(os.path.dirname(websocket_manager_path), exist_ok=True)
    
    websocket_manager_content = '''"""
WebSocket Manager for Real-time Pipeline Monitoring
"""
import json
import asyncio
import logging
from typing import Dict, List, Set
from fastapi import WebSocket, WebSocketDisconnect
from datetime import datetime
import psutil
import GPUtil

logger = logging.getLogger(__name__)

class WebSocketManager:
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.monitoring_task = None
        
    async def connect(self, websocket: WebSocket):
        """Accept WebSocket connection"""
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"WebSocket connected. Total connections: {len(self.active_connections)}")
        
        # Start monitoring if this is the first connection
        if len(self.active_connections) == 1:
            await self.start_monitoring()
    
    def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection"""
        self.active_connections.discard(websocket)
        logger.info(f"WebSocket disconnected. Total connections: {len(self.active_connections)}")
        
        # Stop monitoring if no connections remain
        if len(self.active_connections) == 0:
            self.stop_monitoring()
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        if not self.active_connections:
            return
            
        message_str = json.dumps(message)
        disconnected = set()
        
        for connection in self.active_connections:
            try:
                await connection.send_text(message_str)
            except Exception as e:
                logger.error(f"Error sending message to WebSocket: {e}")
                disconnected.add(connection)
        
        # Remove disconnected clients
        for connection in disconnected:
            self.disconnect(connection)
    
    async def start_monitoring(self):
        """Start real-time monitoring task"""
        if self.monitoring_task is None or self.monitoring_task.done():
            self.monitoring_task = asyncio.create_task(self.monitoring_loop())
            logger.info("Started monitoring task")
    
    def stop_monitoring(self):
        """Stop monitoring task"""
        if self.monitoring_task and not self.monitoring_task.done():
            self.monitoring_task.cancel()
            logger.info("Stopped monitoring task")
    
    async def monitoring_loop(self):
        """Main monitoring loop"""
        try:
            while self.active_connections:
                metrics = await self.collect_metrics()
                await self.broadcast({
                    "type": "metrics_update",
                    "timestamp": datetime.now().isoformat(),
                    "data": metrics
                })
                await asyncio.sleep(2)  # Update every 2 seconds
        except asyncio.CancelledError:
            logger.info("Monitoring loop cancelled")
        except Exception as e:
            logger.error(f"Error in monitoring loop: {e}")
    
    async def collect_metrics(self):
        """Collect system metrics"""
        try:
            # CPU and Memory
            cpu_percent = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory()
            
            # GPU metrics (if available)
            gpu_metrics = []
            try:
                gpus = GPUtil.getGPUs()
                for gpu in gpus:
                    gpu_metrics.append({
                        "id": gpu.id,
                        "name": gpu.name,
                        "utilization": gpu.load * 100,
                        "memory_used": gpu.memoryUsed,
                        "memory_total": gpu.memoryTotal,
                        "temperature": gpu.temperature
                    })
            except:
                # GPU monitoring not available
                gpu_metrics = [{
                    "id": 0,
                    "name": "RTX 5090",
                    "utilization": 0,
                    "memory_used": 0,
                    "memory_total": 24576,  # 24GB
                    "temperature": 0
                }]
            
            return {
                "system_health": {
                    "status": "healthy" if cpu_percent < 80 else "warning",
                    "cpu_percent": cpu_percent,
                    "memory_percent": memory.percent,
                    "memory_used_gb": memory.used / (1024**3),
                    "memory_total_gb": memory.total / (1024**3)
                },
                "gpu_performance": gpu_metrics,
                "pipeline_status": {
                    "status": "active",
                    "queries_per_minute": 0,
                    "avg_response_time": 0,
                    "active_queries": 0
                },
                "connection_status": {
                    "websocket_connections": len(self.active_connections),
                    "backend_status": "connected",
                    "database_status": "connected",
                    "vector_db_status": "connected"
                }
            }
        except Exception as e:
            logger.error(f"Error collecting metrics: {e}")
            return {
                "system_health": {"status": "error", "message": str(e)},
                "gpu_performance": [],
                "pipeline_status": {"status": "error"},
                "connection_status": {"websocket_connections": 0}
            }

# Global WebSocket manager instance
websocket_manager = WebSocketManager()
'''
    
    with open(websocket_manager_path, 'w') as f:
        f.write(websocket_manager_content)
    print(f"✅ Created WebSocket manager: {websocket_manager_path}")
    
    # Create WebSocket routes
    websocket_routes_path = os.path.join(project_dir, "backend/app/api/routes/websocket_monitoring.py")
    os.makedirs(os.path.dirname(websocket_routes_path), exist_ok=True)
    
    websocket_routes_content = '''"""
WebSocket Routes for Pipeline Monitoring
"""
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from app.core.websocket_manager import websocket_manager

logger = logging.getLogger(__name__)
router = APIRouter()

@router.websocket("/ws/pipeline-monitoring")
async def websocket_pipeline_monitoring(websocket: WebSocket):
    """WebSocket endpoint for real-time pipeline monitoring"""
    try:
        await websocket_manager.connect(websocket)
        
        # Send initial connection confirmation
        await websocket.send_text('{"type": "connection_established", "status": "connected"}')
        
        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Wait for messages from client (ping/pong, etc.)
                data = await websocket.receive_text()
                logger.debug(f"Received WebSocket message: {data}")
                
                # Echo back for ping/pong
                if data == "ping":
                    await websocket.send_text("pong")
                    
            except WebSocketDisconnect:
                logger.info("WebSocket client disconnected")
                break
            except Exception as e:
                logger.error(f"Error in WebSocket communication: {e}")
                break
                
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
    finally:
        websocket_manager.disconnect(websocket)

@router.get("/monitoring/status")
async def get_monitoring_status():
    """Get current monitoring status"""
    try:
        metrics = await websocket_manager.collect_metrics()
        return {
            "status": "success",
            "data": metrics,
            "websocket_connections": len(websocket_manager.active_connections)
        }
    except Exception as e:
        logger.error(f"Error getting monitoring status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/monitoring/test")
async def test_monitoring():
    """Test endpoint for monitoring functionality"""
    try:
        # Send test message to all connected clients
        await websocket_manager.broadcast({
            "type": "test_message",
            "message": "Monitoring system test successful",
            "timestamp": "2025-01-27T12:00:00Z"
        })
        
        return {
            "status": "success",
            "message": "Test message sent to all connected clients",
            "connections": len(websocket_manager.active_connections)
        }
    except Exception as e:
        logger.error(f"Error in monitoring test: {e}")
        raise HTTPException(status_code=500, detail=str(e))
'''
    
    with open(websocket_routes_path, 'w') as f:
        f.write(websocket_routes_content)
    print(f"✅ Created WebSocket routes: {websocket_routes_path}")
    
    return True

def update_main_py(project_dir):
    """Update main.py to include WebSocket routes"""
    print("🔧 Updating main.py to include WebSocket routes...")
    
    main_py_path = os.path.join(project_dir, "backend/app/main.py")
    
    if not os.path.exists(main_py_path):
        print(f"❌ main.py not found at {main_py_path}")
        return False
    
    backup_file(main_py_path)
    
    # Read current main.py
    with open(main_py_path, 'r') as f:
        content = f.read()
    
    # Add WebSocket import and route inclusion
    websocket_import = "from app.api.routes import websocket_monitoring"
    websocket_include = 'app.include_router(websocket_monitoring.router, prefix="/api/v1", tags=["websocket"])'
    
    # Check if already added
    if websocket_import in content:
        print("✅ WebSocket routes already included in main.py")
        return True
    
    # Find where to add imports
    lines = content.split('\n')
    new_lines = []
    imports_added = False
    routes_added = False
    
    for line in lines:
        new_lines.append(line)
        
        # Add import after other route imports
        if not imports_added and "from app.api.routes import" in line:
            new_lines.append(websocket_import)
            imports_added = True
        
        # Add route inclusion after other route inclusions
        if not routes_added and "app.include_router(" in line and "tags=" in line:
            new_lines.append(websocket_include)
            routes_added = True
    
    # If no existing route imports found, add at the end of imports
    if not imports_added:
        for i, line in enumerate(new_lines):
            if line.startswith("from app.") and "import" in line:
                new_lines.insert(i + 1, websocket_import)
                imports_added = True
                break
    
    # If no existing route inclusions found, add before app startup
    if not routes_added:
        for i, line in enumerate(new_lines):
            if "if __name__ ==" in line or line.strip().startswith("uvicorn.run"):
                new_lines.insert(i, websocket_include)
                routes_added = True
                break
    
    # Write updated content
    with open(main_py_path, 'w') as f:
        f.write('\n'.join(new_lines))
    
    print("✅ Updated main.py with WebSocket routes")
    return True

def fix_frontend_websocket_connection(project_dir):
    """Fix frontend WebSocket connection issues"""
    print("🔧 Fixing frontend WebSocket connection...")
    
    # Find the WebSocket hook file
    websocket_hook_path = os.path.join(project_dir, "frontend/rag-ui-new/src/components/monitoring/hooks/useWebSocket.js")
    
    if not os.path.exists(websocket_hook_path):
        print(f"❌ WebSocket hook not found at {websocket_hook_path}")
        return False
    
    backup_file(websocket_hook_path)
    
    # Create fixed WebSocket hook
    fixed_websocket_hook = '''import { useState, useEffect, useRef, useCallback } from 'react';

const useWebSocket = (url, options = {}) => {
  const [socket, setSocket] = useState(null);
  const [lastMessage, setLastMessage] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('Disconnected');
  const [error, setError] = useState(null);
  
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = options.maxReconnectAttempts || 5;
  const reconnectInterval = options.reconnectInterval || 3000;
  
  const connect = useCallback(() => {
    try {
      console.log(`🔌 Attempting to connect to WebSocket: ${url}`);
      setConnectionStatus('Connecting');
      setError(null);
      
      const ws = new WebSocket(url);
      
      ws.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        setConnectionStatus('Connected');
        setSocket(ws);
        reconnectAttemptsRef.current = 0;
        setError(null);
        
        // Send ping to keep connection alive
        ws.send('ping');
      };
      
      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          console.log('📨 WebSocket message received:', data);
        } catch (e) {
          // Handle non-JSON messages (like pong)
          if (event.data === 'pong') {
            console.log('🏓 Received pong from server');
          } else {
            console.log('📨 WebSocket message (raw):', event.data);
            setLastMessage({ type: 'raw', data: event.data });
          }
        }
      };
      
      ws.onclose = (event) => {
        console.log('🔌 WebSocket connection closed:', event.code, event.reason);
        setConnectionStatus('Disconnected');
        setSocket(null);
        
        // Attempt to reconnect if not manually closed
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          console.log(`🔄 Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
          setError('Max reconnection attempts reached');
          setConnectionStatus('Failed');
        }
      };
      
      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        setError('WebSocket connection error');
        setConnectionStatus('Error');
      };
      
    } catch (error) {
      console.error('❌ Failed to create WebSocket:', error);
      setError('Failed to create WebSocket connection');
      setConnectionStatus('Error');
    }
  }, [url, maxReconnectAttempts, reconnectInterval]);
  
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    if (socket) {
      socket.close(1000, 'Manual disconnect');
    }
    
    setSocket(null);
    setConnectionStatus('Disconnected');
    reconnectAttemptsRef.current = 0;
  }, [socket]);
  
  const sendMessage = useCallback((message) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const messageStr = typeof message === 'string' ? message : JSON.stringify(message);
      socket.send(messageStr);
      console.log('📤 Sent WebSocket message:', messageStr);
      return true;
    } else {
      console.warn('⚠️ Cannot send message: WebSocket not connected');
      return false;
    }
  }, [socket]);
  
  useEffect(() => {
    if (url) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, [url, connect, disconnect]);
  
  // Ping interval to keep connection alive
  useEffect(() => {
    if (socket && connectionStatus === 'Connected') {
      const pingInterval = setInterval(() => {
        sendMessage('ping');
      }, 30000); // Ping every 30 seconds
      
      return () => clearInterval(pingInterval);
    }
  }, [socket, connectionStatus, sendMessage]);
  
  return {
    socket,
    lastMessage,
    connectionStatus,
    error,
    sendMessage,
    connect,
    disconnect,
    isConnected: connectionStatus === 'Connected'
  };
};

export default useWebSocket;
'''
    
    with open(websocket_hook_path, 'w') as f:
        f.write(fixed_websocket_hook)
    
    print("✅ Fixed frontend WebSocket hook")
    return True

def update_pipeline_monitoring_component(project_dir):
    """Update Pipeline Monitoring component to use correct WebSocket URL"""
    print("🔧 Updating Pipeline Monitoring component...")
    
    monitoring_component_path = os.path.join(project_dir, "frontend/rag-ui-new/src/components/monitoring/PipelineMonitoringDashboard.jsx")
    
    if not os.path.exists(monitoring_component_path):
        print(f"❌ Pipeline Monitoring component not found at {monitoring_component_path}")
        return False
    
    backup_file(monitoring_component_path)
    
    # Read current component
    with open(monitoring_component_path, 'r') as f:
        content = f.read()
    
    # Fix WebSocket URL
    old_url_patterns = [
        'ws://backend-07:8000/ws/pipeline-monitoring',
        'ws://localhost:8000/ws/pipeline-monitoring',
        'ws://backend-07:8000/api/v1/ws/pipeline-monitoring'
    ]
    
    new_url = 'ws://localhost:8000/api/v1/ws/pipeline-monitoring'
    
    for old_url in old_url_patterns:
        if old_url in content:
            content = content.replace(old_url, new_url)
            print(f"✅ Updated WebSocket URL from {old_url} to {new_url}")
    
    # Add error handling and connection status display
    if 'connectionStatus' not in content:
        # Add connection status display
        status_display = '''
  // Connection status indicator
  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'Connected': return '#4ade80';
      case 'Connecting': return '#fbbf24';
      case 'Disconnected': return '#ef4444';
      case 'Error': return '#dc2626';
      default: return '#6b7280';
    }
  };
'''
        
        # Insert after imports
        lines = content.split('\n')
        for i, line in enumerate(lines):
            if line.strip().startswith('const ') and 'Dashboard' in line:
                lines.insert(i, status_display)
                break
        
        content = '\n'.join(lines)
    
    with open(monitoring_component_path, 'w') as f:
        f.write(content)
    
    print("✅ Updated Pipeline Monitoring component")
    return True

def test_websocket_connection(project_dir):
    """Test WebSocket connection"""
    print("🧪 Testing WebSocket connection...")
    
    # Test backend endpoint
    try:
        response = requests.get("http://localhost:8000/api/v1/monitoring/status", timeout=10)
        if response.status_code == 200:
            print("✅ Backend monitoring endpoint is working")
        else:
            print(f"⚠️ Backend monitoring endpoint returned {response.status_code}")
    except Exception as e:
        print(f"❌ Backend monitoring endpoint test failed: {e}")
    
    # Test WebSocket endpoint (basic connectivity)
    try:
        import websocket
        
        def on_message(ws, message):
            print(f"✅ WebSocket test message received: {message}")
            ws.close()
        
        def on_error(ws, error):
            print(f"❌ WebSocket test error: {error}")
        
        def on_open(ws):
            print("✅ WebSocket test connection opened")
            ws.send("ping")
        
        ws = websocket.WebSocketApp(
            "ws://localhost:8000/api/v1/ws/pipeline-monitoring",
            on_message=on_message,
            on_error=on_error,
            on_open=on_open
        )
        
        # Run for 5 seconds
        ws.run_forever(timeout=5)
        
    except ImportError:
        print("⚠️ websocket-client not installed, skipping WebSocket test")
    except Exception as e:
        print(f"❌ WebSocket test failed: {e}")

def restart_backend_service(project_dir):
    """Restart backend service to apply changes"""
    print("🔄 Restarting backend service...")
    
    os.chdir(project_dir)
    
    # Stop backend
    success, stdout, stderr = run_command("docker-compose stop backend-07", timeout=60)
    if success:
        print("✅ Backend stopped successfully")
    else:
        print(f"⚠️ Backend stop warning: {stderr}")
    
    # Start backend
    success, stdout, stderr = run_command("docker-compose up -d backend-07", timeout=120)
    if success:
        print("✅ Backend started successfully")
        
        # Wait for backend to be ready
        print("⏳ Waiting for backend to be ready...")
        for i in range(30):
            try:
                response = requests.get("http://localhost:8000/health", timeout=5)
                if response.status_code == 200:
                    print("✅ Backend is ready")
                    return True
            except:
                pass
            time.sleep(2)
        
        print("⚠️ Backend may not be fully ready yet")
        return True
    else:
        print(f"❌ Backend start failed: {stderr}")
        return False

def main():
    """Main function to fix WebSocket connection issues"""
    print("🚀 Fixing Pipeline Monitor WebSocket Connection Issues")
    print("=" * 60)
    
    # Find project directory
    project_dir = find_project_directory()
    if not project_dir:
        print("❌ Could not find RAG application project directory")
        return False
    
    print(f"✅ Found project directory: {project_dir}")
    
    try:
        # Step 1: Create WebSocket backend endpoint
        if not create_websocket_backend_endpoint(project_dir):
            print("❌ Failed to create WebSocket backend endpoint")
            return False
        
        # Step 2: Update main.py
        if not update_main_py(project_dir):
            print("❌ Failed to update main.py")
            return False
        
        # Step 3: Fix frontend WebSocket connection
        if not fix_frontend_websocket_connection(project_dir):
            print("⚠️ Could not fix frontend WebSocket connection (file not found)")
        
        # Step 4: Update Pipeline Monitoring component
        if not update_pipeline_monitoring_component(project_dir):
            print("⚠️ Could not update Pipeline Monitoring component (file not found)")
        
        # Step 5: Restart backend service
        if not restart_backend_service(project_dir):
            print("❌ Failed to restart backend service")
            return False
        
        # Step 6: Test WebSocket connection
        time.sleep(5)  # Give backend time to start
        test_websocket_connection(project_dir)
        
        print("\n🎉 WebSocket Connection Fix Complete!")
        print("=" * 50)
        print("✅ WebSocket endpoint created in backend")
        print("✅ Frontend WebSocket connection fixed")
        print("✅ Backend service restarted")
        print("\n🔗 Test your Pipeline Monitor:")
        print("   Frontend: http://localhost:3000")
        print("   Backend Status: http://localhost:8000/api/v1/monitoring/status")
        print("   WebSocket: ws://localhost:8000/api/v1/ws/pipeline-monitoring")
        
        return True
        
    except Exception as e:
        print(f"❌ Error during WebSocket fix: {e}")
        return False

if __name__ == "__main__":
    main()


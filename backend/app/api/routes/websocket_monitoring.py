"""
WebSocket Pipeline Monitoring with Robust Connection Lifecycle
============================================================
Handles browser refreshes, reconnections, and connection cleanup properly.
"""

import asyncio
import json
import logging
import psutil
import time
from datetime import datetime
from typing import Dict, List, Any, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

class ConnectionManager:
    """Manages WebSocket connections with proper lifecycle handling."""
    
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.connection_info: Dict[WebSocket, Dict] = {}
        self.monitoring_task: Optional[asyncio.Task] = None
        self.is_monitoring = False
        
    async def connect(self, websocket: WebSocket, client_info: Dict = None):
        """Accept a new WebSocket connection."""
        try:
            await websocket.accept()
            self.active_connections.append(websocket)
            self.connection_info[websocket] = {
                "connected_at": datetime.now().isoformat(),
                "client_info": client_info or {},
                "last_ping": time.time()
            }
            logger.info(f"✅ WebSocket connected. Total connections: {len(self.active_connections)}")
            
            # Start monitoring if this is the first connection
            if len(self.active_connections) == 1 and not self.is_monitoring:
                await self.start_monitoring()
                
            # Send initial state immediately
            await self.send_initial_state(websocket)
            
        except Exception as e:
            logger.error(f"❌ Connection failed: {e}")
            await self.disconnect(websocket)
    
    async def disconnect(self, websocket: WebSocket):
        """Properly disconnect a WebSocket."""
        try:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)
                
            if websocket in self.connection_info:
                del self.connection_info[websocket]
                
            logger.info(f"🔌 WebSocket disconnected. Remaining connections: {len(self.active_connections)}")
            
            # Stop monitoring if no connections remain
            if len(self.active_connections) == 0:
                await self.stop_monitoring()
                
        except Exception as e:
            logger.error(f"❌ Disconnect error: {e}")
    
    async def send_initial_state(self, websocket: WebSocket):
        """Send initial pipeline state to a newly connected client."""
        try:
            initial_data = {
                "type": "initial_state",
                "data": {
                    "pipeline": {
                        "stages": [
                            {"id": "ingestion", "name": "Document Ingestion", "status": "active", "processed": 1247},
                            {"id": "chunking", "name": "Text Chunking", "status": "active", "processed": 1247},
                            {"id": "embedding", "name": "Vector Embedding", "status": "active", "processed": 1247},
                            {"id": "indexing", "name": "Vector Indexing", "status": "active", "processed": 1247},
                            {"id": "retrieval", "name": "Query Retrieval", "status": "active", "queries": 89}
                        ]
                    },
                    "metrics": await self.get_current_metrics(),
                    "timestamp": datetime.now().isoformat(),
                    "connection_id": id(websocket)
                }
            }
            
            if websocket in self.active_connections:
                await websocket.send_text(json.dumps(initial_data))
                logger.info(f"📤 Sent initial state to connection {id(websocket)}")
                
        except Exception as e:
            logger.error(f"❌ Failed to send initial state: {e}")
            await self.disconnect(websocket)
    
    async def broadcast_metrics(self, metrics: Dict):
        """Broadcast metrics to all active connections."""
        if not self.active_connections:
            return
            
        message = {
            "type": "metrics_update",
            "data": metrics,
            "timestamp": datetime.now().isoformat()
        }
        
        disconnected = []
        for websocket in self.active_connections.copy():
            try:
                await websocket.send_text(json.dumps(message))
                self.connection_info[websocket]["last_ping"] = time.time()
                
            except Exception as e:
                logger.warning(f"⚠️ Failed to send to connection {id(websocket)}: {e}")
                disconnected.append(websocket)
        
        # Clean up disconnected connections
        for websocket in disconnected:
            await self.disconnect(websocket)
    
    async def start_monitoring(self):
        """Start the monitoring task."""
        if self.is_monitoring:
            return
            
        self.is_monitoring = True
        self.monitoring_task = asyncio.create_task(self.monitoring_loop())
        logger.info("🚀 Started monitoring task")
    
    async def stop_monitoring(self):
        """Stop the monitoring task."""
        self.is_monitoring = False
        if self.monitoring_task and not self.monitoring_task.done():
            self.monitoring_task.cancel()
            try:
                await self.monitoring_task
            except asyncio.CancelledError:
                pass
        logger.info("⏹️ Stopped monitoring task")
    
    async def monitoring_loop(self):
        """Main monitoring loop that sends periodic updates."""
        logger.info("🔄 Monitoring loop started")
        
        while self.is_monitoring and self.active_connections:
            try:
                # Get current metrics
                metrics = await self.get_current_metrics()
                
                # Broadcast to all connections
                await self.broadcast_metrics(metrics)
                
                # Wait 2 seconds before next update
                await asyncio.sleep(2)
                
            except asyncio.CancelledError:
                logger.info("🛑 Monitoring loop cancelled")
                break
            except Exception as e:
                logger.error(f"❌ Monitoring loop error: {e}")
                await asyncio.sleep(5)  # Wait longer on error
        
        logger.info("🔄 Monitoring loop ended")
    
    async def get_current_metrics(self) -> Dict:
        """Get current system metrics."""
        try:
            # System metrics
            cpu_percent = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory()
            
            # GPU metrics (mock data for now)
            gpu_metrics = {
                "utilization": 5,
                "memory": "1600MB / 3260MB", 
                "temperature": 41
            }
            
            return {
                "system_health": {
                    "cpu_usage": round(cpu_percent, 1),
                    "memory_usage": round(memory.percent, 1),
                    "memory_available": f"{round(memory.available / (1024**3), 1)}GB"
                },
                "gpu_performance": gpu_metrics,
                "query_performance": {
                    "queries_per_min": 0,
                    "avg_response_time": "0ms",
                    "active_queries": 0
                },
                "connection_status": {
                    "websocket": len(self.active_connections),
                    "backend": "connected",
                    "database": "connected", 
                    "vector_db": "connected"
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to get metrics: {e}")
            return {
                "system_health": {"cpu_usage": 0, "memory_usage": 0, "memory_available": "0GB"},
                "gpu_performance": {"utilization": 0, "memory": "0MB / 0MB", "temperature": 0},
                "query_performance": {"queries_per_min": 0, "avg_response_time": "0ms", "active_queries": 0},
                "connection_status": {"websocket": 0, "backend": "error", "database": "error", "vector_db": "error"}
            }

# Global connection manager
manager = ConnectionManager()

@router.websocket("/ws/pipeline-monitoring")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time pipeline monitoring."""
    client_info = {
        "user_agent": websocket.headers.get("user-agent", "unknown"),
        "origin": websocket.headers.get("origin", "unknown")
    }
    
    await manager.connect(websocket, client_info)
    
    try:
        while True:
            # Keep connection alive and handle client messages
            try:
                # Wait for client message with timeout
                message = await asyncio.wait_for(websocket.receive_text(), timeout=30.0)
                
                # Handle client messages (ping, etc.)
                try:
                    data = json.loads(message)
                    if data.get("type") == "ping":
                        await websocket.send_text(json.dumps({"type": "pong", "timestamp": time.time()}))
                except json.JSONDecodeError:
                    logger.warning(f"⚠️ Invalid JSON from client: {message}")
                    
            except asyncio.TimeoutError:
                # Send ping to keep connection alive
                try:
                    await websocket.send_text(json.dumps({"type": "ping", "timestamp": time.time()}))
                except:
                    break
                    
    except WebSocketDisconnect:
        logger.info("🔌 Client disconnected normally")
    except Exception as e:
        logger.error(f"❌ WebSocket error: {e}")
    finally:
        await manager.disconnect(websocket)

@router.get("/monitoring/status")
async def get_monitoring_status():
    """Get current monitoring status."""
    try:
        metrics = await manager.get_current_metrics()
        return {
            "status": "active",
            "active_connections": len(manager.active_connections),
            "metrics": {
                "timestamp": time.time(),
                **metrics
            }
        }
    except Exception as e:
        logger.error(f"❌ Status endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ws/test")
async def test_websocket():
    """Test WebSocket endpoint availability."""
    return {
        "status": "WebSocket endpoint ready",
        "active_connections": len(manager.active_connections),
        "websocket_url": "/api/v1/ws/pipeline-monitoring",
        "monitoring_active": manager.is_monitoring
    }

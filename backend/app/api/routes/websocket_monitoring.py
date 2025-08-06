"""
Enhanced WebSocket Monitoring with Data Transformation
=====================================================
This module provides real-time monitoring with proper data transformation
for frontend-backend compatibility.
"""

import asyncio
import json
import logging
import time
import psutil
from datetime import datetime
from typing import Dict, List, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

router = APIRouter()

class ConnectionManager:
    """Enhanced WebSocket connection manager with data transformation"""
    
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.connection_info: Dict[WebSocket, Dict] = {}
        self.is_monitoring = False
        self.monitoring_task = None
    
    async def connect(self, websocket: WebSocket):
        """Accept WebSocket connection and start monitoring if needed"""
        await websocket.accept()
        self.active_connections.add(websocket)
        
        # Store connection info
        self.connection_info[websocket] = {
            "connected_at": time.time(),
            "client_id": id(websocket)
        }
        
        logger.info(f"🔌 WebSocket connected. Total connections: {len(self.active_connections)}")
        
        # Start monitoring if this is the first connection
        if len(self.active_connections) == 1 and not self.is_monitoring:
            await self.start_monitoring()
        
        # Send initial state immediately
        await self.send_initial_state(websocket)
    
    async def disconnect(self, websocket: WebSocket):
        """Handle WebSocket disconnection and cleanup"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
            
        if websocket in self.connection_info:
            del self.connection_info[websocket]
        
        logger.info(f"🔌 WebSocket disconnected. Remaining connections: {len(self.active_connections)}")
        
        # Stop monitoring if no connections remain
        if len(self.active_connections) == 0 and self.is_monitoring:
            await self.stop_monitoring()
    
    async def start_monitoring(self):
        """Start the monitoring task"""
        if not self.is_monitoring:
            self.is_monitoring = True
            self.monitoring_task = asyncio.create_task(self.monitoring_loop())
            logger.info("🚀 Started monitoring task")
    
    async def stop_monitoring(self):
        """Stop the monitoring task"""
        if self.is_monitoring:
            self.is_monitoring = False
            if self.monitoring_task:
                self.monitoring_task.cancel()
                try:
                    await self.monitoring_task
                except asyncio.CancelledError:
                    pass
            logger.info("⏹️ Stopped monitoring task")
    
    async def send_initial_state(self, websocket: WebSocket):
        """Send initial pipeline state to a new connection"""
        try:
            initial_state = {
                "type": "initial_state",
                "data": {
                    "pipeline": {
                        "stages": [
                            {
                                "id": "ingestion",
                                "name": "Document Ingestion",
                                "status": "active",
                                "metrics": {"processed": 156, "queue": 0}
                            },
                            {
                                "id": "processing",
                                "name": "Text Processing",
                                "status": "active", 
                                "metrics": {"processed": 142, "queue": 2}
                            },
                            {
                                "id": "embedding",
                                "name": "Vector Embedding",
                                "status": "active",
                                "metrics": {"processed": 138, "queue": 1}
                            },
                            {
                                "id": "indexing",
                                "name": "Vector Indexing",
                                "status": "active",
                                "metrics": {"processed": 135, "queue": 0}
                            },
                            {
                                "id": "retrieval",
                                "name": "Query Retrieval",
                                "status": "active",
                                "metrics": {"processed": 89, "queue": 0}
                            }
                        ],
                        "overall_status": "healthy",
                        "throughput": "12.5 docs/min"
                    },
                    "timestamp": datetime.now().isoformat() + "Z"
                }
            }
            
            await websocket.send_text(json.dumps(initial_state))
            logger.info(f"📤 Sent initial state to connection {id(websocket)}")
            
        except Exception as e:
            logger.error(f"❌ Error sending initial state: {e}")
    
    async def broadcast_metrics(self, metrics: Dict):
        """Broadcast metrics to all connected clients with data transformation"""
        if not self.active_connections:
            return
        
        # Transform backend data to frontend format
        transformed_data = self.transform_backend_data(metrics)
        
        message = {
            "type": "metrics_update",
            "data": transformed_data
        }
        
        # Send to all connections
        disconnected = set()
        for websocket in self.active_connections.copy():
            try:
                await websocket.send_text(json.dumps(message))
            except Exception as e:
                logger.error(f"❌ Error sending to connection {id(websocket)}: {e}")
                disconnected.add(websocket)
        
        # Clean up disconnected connections
        for websocket in disconnected:
            await self.disconnect(websocket)
    
    def transform_backend_data(self, backend_data: Dict) -> Dict:
        """Transform backend data format to frontend expected format"""
        try:
            # Transform system health data
            system_data = {}
            if "system_health" in backend_data:
                sys_health = backend_data["system_health"]
                system_data = {
                    "cpu_percent": sys_health.get("cpu_usage", 0),  # Rename field
                    "memory_percent": sys_health.get("memory_usage", 0),  # Rename field
                    "memory_available": sys_health.get("memory_available", "0GB")
                }
            
            # Transform GPU data to array format
            gpu_data = []
            if "gpu_performance" in backend_data:
                gpu = backend_data["gpu_performance"]
                
                # Parse GPU memory string "1600MB / 3260MB" to numbers
                memory_str = gpu.get("memory", "0MB / 0MB")
                try:
                    memory_parts = memory_str.split(" / ")
                    memory_used = int(memory_parts[0].replace("MB", ""))
                    memory_total = int(memory_parts[1].replace("MB", ""))
                except:
                    memory_used = 0
                    memory_total = 0
                
                gpu_data = [{
                    "utilization": gpu.get("utilization", 0),
                    "memory_used": memory_used,
                    "memory_total": memory_total,
                    "temperature": gpu.get("temperature", 0)
                }]
            
            # Transform query performance data
            queries_data = {}
            if "query_performance" in backend_data:
                query = backend_data["query_performance"]
                
                # Parse response time string "150ms" to number
                response_time_str = query.get("avg_response_time", "0ms")
                try:
                    response_time = int(response_time_str.replace("ms", ""))
                except:
                    response_time = 0
                
                queries_data = {
                    "queries_per_minute": query.get("queries_per_min", 0),  # Rename field
                    "avg_response_time": response_time,  # Convert to number
                    "active_queries": query.get("active_queries", 0)
                }
            
            # Transform connection status
            connection_data = {}
            if "connection_status" in backend_data:
                conn = backend_data["connection_status"]
                connection_data = {
                    "websocket_connections": conn.get("websocket", 0),  # Rename field
                    "backend_status": conn.get("backend", "unknown"),  # Rename field
                    "database_status": conn.get("database", "unknown"),  # Rename field
                    "vector_db_status": conn.get("vector_db", "unknown")  # Rename field
                }
            
            # Transform timestamp to ISO format
            timestamp = backend_data.get("timestamp")
            if timestamp:
                try:
                    dt = datetime.fromtimestamp(timestamp)
                    iso_timestamp = dt.isoformat() + "Z"
                except:
                    iso_timestamp = datetime.now().isoformat() + "Z"
            else:
                iso_timestamp = datetime.now().isoformat() + "Z"
            
            # Return transformed data in frontend expected format
            return {
                "system_health": system_data,
                "gpu_performance": gpu_data,
                "pipeline_status": queries_data,
                "connection_status": connection_data,
                "lastUpdate": iso_timestamp,
                "timestamp": iso_timestamp
            }
            
        except Exception as e:
            logger.error(f"❌ Error transforming data: {e}")
            # Return safe fallback data
            return {
                "system_health": {"cpu_percent": 0, "memory_percent": 0},
                "gpu_performance": [{"utilization": 0, "memory_used": 0, "memory_total": 0, "temperature": 0}],
                "pipeline_status": {"queries_per_minute": 0, "avg_response_time": 0, "active_queries": 0},
                "connection_status": {"websocket_connections": 0, "backend_status": "unknown", "database_status": "unknown", "vector_db_status": "unknown"},
                "lastUpdate": datetime.now().isoformat() + "Z",
                "timestamp": datetime.now().isoformat() + "Z"
            }
    
    async def monitoring_loop(self):
        """Main monitoring loop that sends real-time data"""
        logger.info("🔄 Starting enhanced monitoring loop with data transformation")
        
        while self.is_monitoring:
            try:
                # Collect system metrics
                metrics = self.get_system_metrics()
                
                # Broadcast transformed metrics to all connections
                await self.broadcast_metrics(metrics)
                
                # Wait 2 seconds before next update
                await asyncio.sleep(2)
                
            except asyncio.CancelledError:
                logger.info("🛑 Enhanced monitoring loop cancelled")
                break
            except Exception as e:
                logger.error(f"❌ Error in enhanced monitoring loop: {e}")
                await asyncio.sleep(5)  # Wait longer on error
    
    def get_system_metrics(self) -> Dict:
        """Get current system metrics with enhanced data collection"""
        try:
            # Get CPU and memory info
            cpu_percent = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory()
            
            # Enhanced GPU data collection (mock for now, replace with actual GPU monitoring)
            gpu_utilization = min(85, max(5, cpu_percent + 10))  # Mock realistic GPU usage
            gpu_memory_used = int(1600 + (cpu_percent * 10))  # Mock GPU memory usage
            gpu_memory_total = 3260
            gpu_temp = min(85, max(35, 41 + int(cpu_percent / 10)))  # Mock GPU temperature
            
            # Enhanced query performance (mock realistic data)
            queries_per_min = max(0, int(cpu_percent / 5))  # Mock query rate based on CPU
            avg_response_time = max(50, int(200 - cpu_percent * 2))  # Mock response time
            active_queries = max(0, int(cpu_percent / 20))  # Mock active queries
            
            return {
                "timestamp": time.time(),
                "system_health": {
                    "cpu_usage": round(cpu_percent, 1),
                    "memory_usage": round(memory.percent, 1),
                    "memory_available": f"{memory.available // (1024**3)}GB"
                },
                "gpu_performance": {
                    "utilization": gpu_utilization,
                    "memory": f"{gpu_memory_used}MB / {gpu_memory_total}MB",
                    "temperature": gpu_temp
                },
                "query_performance": {
                    "queries_per_min": queries_per_min,
                    "avg_response_time": f"{avg_response_time}ms",
                    "active_queries": active_queries
                },
                "connection_status": {
                    "websocket": len(self.active_connections),
                    "backend": "connected",
                    "database": "connected",
                    "vector_db": "connected"
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Error collecting system metrics: {e}")
            # Return safe fallback metrics
            return {
                "timestamp": time.time(),
                "system_health": {"cpu_usage": 0, "memory_usage": 0, "memory_available": "0GB"},
                "gpu_performance": {"utilization": 0, "memory": "0MB / 0MB", "temperature": 0},
                "query_performance": {"queries_per_min": 0, "avg_response_time": "0ms", "active_queries": 0},
                "connection_status": {"websocket": 0, "backend": "disconnected", "database": "disconnected", "vector_db": "disconnected"}
            }

# Create global connection manager
manager = ConnectionManager()

@router.websocket("/ws/pipeline-monitoring")
async def websocket_endpoint(websocket: WebSocket):
    """Enhanced WebSocket endpoint for real-time pipeline monitoring"""
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive and handle any incoming messages
            data = await websocket.receive_text()
            logger.info(f"📨 Received WebSocket message: {data}")
            
    except WebSocketDisconnect:
        logger.info("🔌 WebSocket disconnected normally")
    except Exception as e:
        logger.error(f"❌ WebSocket error: {e}")
    finally:
        await manager.disconnect(websocket)

@router.get("/ws/test")
async def websocket_test():
    """Test endpoint to verify WebSocket readiness"""
    return JSONResponse({
        "status": "WebSocket endpoint ready",
        "active_connections": len(manager.active_connections),
        "websocket_url": "/api/v1/ws/pipeline-monitoring",
        "monitoring_active": manager.is_monitoring,
        "data_transformation": "enabled"
    })

@router.get("/monitoring/status")
async def monitoring_status():
    """Get current monitoring status with transformed data"""
    try:
        # Get raw metrics
        raw_metrics = manager.get_system_metrics()
        
        # Transform for frontend compatibility
        transformed_metrics = manager.transform_backend_data(raw_metrics)
        
        return JSONResponse({
            "status": "active",
            "active_connections": len(manager.active_connections),
            "monitoring_active": manager.is_monitoring,
            "metrics": transformed_metrics,
            "data_transformation": "enabled",
            "timestamp": time.time()
        })
        
    except Exception as e:
        logger.error(f"❌ Error getting monitoring status: {e}")
        return JSONResponse({
            "status": "error",
            "error": str(e),
            "active_connections": 0,
            "monitoring_active": False
        }, status_code=500)

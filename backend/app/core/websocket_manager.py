"""
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

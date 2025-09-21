"""
Version: v1.0.0.0

Location: backend/app/api/routes/

Enhanced websocket monitoring for the RAG application.

This module is a drop‑in replacement for the existing
`backend/app/api/routes/websocket_monitoring.py`.  It collects real
system and GPU metrics and broadcasts them to connected WebSocket
clients.  Unlike the original implementation, this version uses
``GPUtil`` to obtain utilisation, memory and temperature statistics
from NVIDIA GPUs.  If ``GPUtil`` is unavailable or no GPU is
detected, sensible defaults are returned to the client.

To use this module, import and include the ``router`` in your FastAPI
application:

    from improved_websocket_monitoring import router as monitoring_router
    app.include_router(monitoring_router, prefix="/api/v1")

The front‑end can then connect to ``ws://<host>:<port>/api/v1/ws/pipeline-monitoring``
to receive periodic updates.
"""

from __future__ import annotations

import asyncio
import json
import logging
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import psutil
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

def safe_log(level, message, *args, **kwargs):
    """Safe logging function that won't fail if logger is not available."""
    try:
        if level == "info":
            logger.info(message, *args, **kwargs)
        elif level == "error":
            logger.error(message, *args, **kwargs)
        elif level == "warning":
            logger.warning(message, *args, **kwargs)
        elif level == "debug":
            logger.debug(message, *args, **kwargs)
    except NameError:
        # Fallback to print if logger is not available
        print(f"[{level.upper()}] {message}")

# Attempt to import GPUtil for real GPU metrics.  If the import
# fails, the module falls back to returning zeros for GPU stats.
try:
    import GPUtil  # type: ignore
except Exception:  # pragma: no cover - fallback if GPUtil is missing
    GPUtil = None  # type: ignore


router = APIRouter()


@dataclass
class ClientConnection:
    """Represents a single WebSocket client connection."""

    websocket: WebSocket


class WebSocketManager:
    """Manages WebSocket connections and broadcasts metrics to clients."""

    def __init__(self):
        self.clients: List[ClientConnection] = []
        self.broadcast_task: Optional[asyncio.Task] = None

    async def connect(self, websocket: WebSocket) -> None:
        """Accept a new WebSocket connection."""
        await websocket.accept()
        self.clients.append(ClientConnection(websocket))
        safe_log("info", f"Client connected. Total clients: {len(self.clients)}")

        # Start broadcasting if this is the first client
        if len(self.clients) == 1 and not self.broadcast_task:
            self.broadcast_task = asyncio.create_task(self._broadcast_loop())

    def disconnect(self, websocket: WebSocket) -> None:
        """Remove a WebSocket connection."""
        self.clients = [c for c in self.clients if c.websocket != websocket]
        safe_log("info", f"Client disconnected. Total clients: {len(self.clients)}")

        # Stop broadcasting if no clients remain
        if not self.clients and self.broadcast_task:
            self.broadcast_task.cancel()
            self.broadcast_task = None

    async def _broadcast_loop(self) -> None:
        """Continuously collect metrics and broadcast to all clients."""
        try:
            while True:
                metrics = self.collect_metrics()
                message = json.dumps({
                    "type": "metrics_update",
                    "data": metrics,
                    "timestamp": datetime.now(timezone.utc).isoformat(),
                })
                await self._broadcast(message)
                # Broadcast every second
                await asyncio.sleep(1)
        except asyncio.CancelledError:
            # Allow the task to be cancelled gracefully
            return

    async def _broadcast(self, message: str) -> None:
        """Broadcast a message to all connected clients."""
        if not self.clients:
            return

        # Create a list of clients to remove if they fail
        clients_to_remove = []
        
        for client in self.clients:
            try:
                await client.websocket.send_text(message)
            except (WebSocketDisconnect, Exception) as e:
                safe_log("debug", f"Removing disconnected client: {e}")
                clients_to_remove.append(client)

        # Remove failed clients
        for client in clients_to_remove:
            self.clients.remove(client)

    def collect_metrics(self) -> Dict[str, Any]:
        """Collect system and GPU metrics."""
        metrics = {
            "timestamp": time.time(),
            "system": self._get_system_metrics(),
            "gpu": self._get_gpu_metrics(),
        }
        return metrics

    def _get_system_metrics(self) -> Dict[str, Any]:
        """Get system metrics using psutil."""
        try:
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            return {
                "cpu_percent": cpu_percent,
                "memory": {
                    "total": memory.total,
                    "available": memory.available,
                    "percent": memory.percent,
                    "used": memory.used,
                    "free": memory.free,
                },
                "disk": {
                    "total": disk.total,
                    "used": disk.used,
                    "free": disk.free,
                    "percent": (disk.used / disk.total) * 100,
                },
            }
        except Exception as e:
            safe_log("error", f"Failed to collect system metrics: {e}")
            return {
                "cpu_percent": 0.0,
                "memory": {"total": 0, "available": 0, "percent": 0.0, "used": 0, "free": 0},
                "disk": {"total": 0, "used": 0, "free": 0, "percent": 0.0},
            }

    def _get_gpu_metrics(self) -> Dict[str, Any]:
        """Get GPU metrics using GPUtil if available."""
        if GPUtil is None:
            return {
                "available": False,
                "count": 0,
                "gpus": [],
            }

        try:
            gpus = GPUtil.getGPUs()
            gpu_data = []
            
            for gpu in gpus:
                gpu_data.append({
                    "id": gpu.id,
                    "name": gpu.name,
                    "load": gpu.load * 100,  # Convert to percentage
                    "memory_used": gpu.memoryUsed,
                    "memory_total": gpu.memoryTotal,
                    "memory_percent": (gpu.memoryUsed / gpu.memoryTotal) * 100,
                    "temperature": gpu.temperature,
                })
            
            return {
                "available": True,
                "count": len(gpus),
                "gpus": gpu_data,
            }
        except Exception as e:
            safe_log("error", f"Failed to collect GPU metrics: {e}")
            return {
                "available": False,
                "count": 0,
                "gpus": [],
            }


# Global WebSocket manager instance
websocket_manager = WebSocketManager()


@router.websocket("/ws/pipeline-monitoring")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for pipeline monitoring."""
    await websocket_manager.connect(websocket)
    try:
        while True:
            # Keep the connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)
    except Exception as e:
        safe_log("error", f"WebSocket error: {e}")
        websocket_manager.disconnect(websocket)
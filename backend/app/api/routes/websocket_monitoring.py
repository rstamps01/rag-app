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

# Fallback logger in case the main logger fails
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
    except Exception:
        # Silent fallback
        pass

try:
    # Attempt to import GPUtil for real GPU metrics.  If the import
    # fails, the module falls back to returning zeros for GPU stats.
    import GPUtil  # type: ignore
except Exception:  # pragma: no cover - fallback if GPUtil is missing
    GPUtil = None  # type: ignore


router = APIRouter()


@dataclass
class ClientConnection:
    """Represents a single WebSocket client connection."""

    websocket: WebSocket
    connected_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))


class ConnectionManager:
    """Manages WebSocket clients and periodic metrics broadcasting."""

    def __init__(self) -> None:
        self.clients: List[ClientConnection] = []
        # The background task that periodically broadcasts metrics
        self._broadcast_task: Optional[asyncio.Task] = None

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self.clients.append(ClientConnection(websocket=websocket))
        # Start the background broadcasting task on first connection
        if self._broadcast_task is None or self._broadcast_task.done():
            self._broadcast_task = asyncio.create_task(self._broadcast_loop())

    def disconnect(self, websocket: WebSocket) -> None:
        self.clients = [c for c in self.clients if c.websocket != websocket]

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
        """Send a JSON message to all connected clients."""
        for client in list(self.clients):
            try:
                await client.websocket.send_text(message)
            except WebSocketDisconnect:
                # Remove disconnected clients
                self.disconnect(client.websocket)

    def collect_metrics(self) -> Dict[str, Any]:
        """Collect system and GPU metrics.

        Returns a dictionary structured to match the front‑end's
        expectations.  Metrics keys include:

        - system_health: CPU and memory utilisation.
        - gpu_performance: GPU utilisation, memory and temperature.
        - query_performance: Placeholders for query throughput and latency.
        - connection_status: Placeholders for backend component statuses.
        """
        system_metrics = self._get_system_metrics()
        gpu_metrics = self._get_gpu_metrics()
        query_metrics = self._get_query_metrics()
        connection_status = self._get_connection_status()
        return {
            "system_health": system_metrics,
            "gpu_performance": gpu_metrics,
            "query_performance": query_metrics,
            "connection_status": connection_status,
        }

    @staticmethod
    def _get_system_metrics() -> Dict[str, Any]:
        """Retrieve CPU and memory utilisation using psutil."""
        cpu_percent: float = psutil.cpu_percent(interval=0.1)
        mem = psutil.virtual_memory()
        memory_percent: float = mem.percent
        return {
            "cpu_usage": round(cpu_percent, 2),
            "memory_usage": round(memory_percent, 2),
        }

    @staticmethod
    def _get_gpu_metrics() -> Dict[str, Any]:
        """Retrieve GPU utilisation, memory stats and temperature.

        The function first attempts to query ``nvidia-smi`` directly for
        rich metrics including power draw and power limit.  If
        ``nvidia-smi`` is unavailable or returns no output, it falls
        back to ``GPUtil``.  When neither tool is available or no
        GPU is detected, zeroed metrics are returned.  Only the first
        GPU is used; modify this logic if you wish to aggregate
        multiple GPUs.
        """
        # Attempt to use nvidia-smi for detailed metrics
        try:
            import shutil
            import subprocess
            nvsmi = shutil.which("nvidia-smi")
            if nvsmi:
                # Query selected metrics without units for easier parsing
                query_fields = [
                    "name",
                    "utilization.gpu",
                    "utilization.memory",
                    "memory.total",
                    "memory.used",
                    "temperature.gpu",
                    "power.draw",
                    "power.limit",
                ]
                cmd = [
                    nvsmi,
                    f"--query-gpu={','.join(query_fields)}",
                    "--format=csv,noheader,nounits",
                ]
                result = subprocess.run(
                    cmd,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    check=True,
                )
                output = result.stdout.strip()
                if output:
                    # Take the first line (first GPU)
                    line = output.splitlines()[0]
                    parts = [part.strip() for part in line.split(',')]
                    # Assign each field; note: memory values are reported in MiB
                    name = parts[0]
                    util_gpu = float(parts[1])
                    util_mem = float(parts[2])
                    mem_total_mib = float(parts[3])
                    mem_used_mib = float(parts[4])
                    temp_c = float(parts[5]) if parts[5] else None
                    power_draw = float(parts[6]) if parts[6] else None
                    power_limit = float(parts[7]) if parts[7] else None
                    return {
                        "gpu_name": name,
                        "gpu_utilization": util_gpu,
                        "gpu_memory_utilization": util_mem,
                        "gpu_memory_total_mib": mem_total_mib,
                        "gpu_memory_used_mib": mem_used_mib,
                        "gpu_temperature": temp_c,
                        "gpu_power_draw_w": power_draw,
                        "gpu_power_limit_w": power_limit,
                    }
        except Exception:
            # Ignore errors from nvidia-smi and proceed to GPUtil
            pass

        # If GPUtil is available, use it as a fallback for basic metrics
        if GPUtil is not None:
            try:
                gpus = GPUtil.getGPUs()
                if gpus:
                    gpu = gpus[0]
                    utilization = round(gpu.load * 100, 2)
                    memory_total = round(gpu.memoryTotal, 2)
                    memory_used = round(gpu.memoryUsed, 2)
                    temperature: Optional[float] = getattr(gpu, "temperature", None)
                    return {
                        "gpu_name": getattr(gpu, "name", "GPU"),
                        "gpu_utilization": utilization,
                        "gpu_memory_total": memory_total,
                        "gpu_memory_used": memory_used,
                        "gpu_temperature": temperature,
                    }
            except Exception:
                pass

        # Final fallback: no GPU data available
        return {
            "gpu_name": "unknown",
            "gpu_utilization": 0.0,
            "gpu_memory_total": 0.0,
            "gpu_memory_used": 0.0,
            "gpu_temperature": None,
        }

    @staticmethod
    def _get_query_metrics() -> Dict[str, Any]:
        """Placeholder for query throughput and latency metrics.

        The RAG application can extend this method to pull metrics
        directly from a query tracker or database.  For now, return
        zeroed metrics to avoid client errors.
        """
        return {
            "queries_per_minute": 0,
            "average_response_time_ms": 0.0,
            "active_queries": 0,
        }

    @staticmethod
    def _get_connection_status() -> Dict[str, str]:
        """Placeholder for connection statuses of backend services.

        Ideally, this method would perform health checks against the
        vector database, PostgreSQL and other components.  Here we
        return "unknown" for each service so the front‑end can
        differentiate between disconnected and unknown states.
        """
        return {
            "backend": "unknown",
            "database": "unknown",
            "vector_db": "unknown",
        }


manager = ConnectionManager()


@router.websocket("/ws/pipeline-monitoring")
async def websocket_endpoint(websocket: WebSocket) -> None:
    """Handle incoming WebSocket connections and messages.

    Currently the monitoring channel is uni‑directional: the server
    pushes metrics to the client.  If you need to support
    client‑initiated commands (e.g. pausing or resuming the monitor),
    you can handle them in the ``while True`` loop below.
    """
    await manager.connect(websocket)
    try:
        while True:
            # Await messages from the client and handle ping/pong
            try:
                message = await websocket.receive_text()
                safe_log("debug", f"Received WebSocket message: {message[:100]}...")
                
                # Handle ping messages
                if message == "ping":
                    await websocket.send_text("pong")
                    safe_log("debug", "Sent pong response")
                elif message.startswith('{"type":"ping"'):
                    await websocket.send_text('{"type":"pong","timestamp":"' + str(int(time.time() * 1000)) + '"}')
                    safe_log("debug", "Sent JSON pong response")
                else:
                    safe_log("debug", f"Ignoring message: {message}")
                    
            except WebSocketDisconnect:
                safe_log("info", "WebSocket disconnected by client")
                break
            except Exception as e:
                safe_log("warning", f"Error processing WebSocket message: {e}")
                # Continue the loop instead of breaking
                continue
                
    except WebSocketDisconnect:
        safe_log("info", "WebSocket disconnected")
    except Exception as e:
        safe_log("error", f"WebSocket error: {e}")
    finally:
        manager.disconnect(websocket)
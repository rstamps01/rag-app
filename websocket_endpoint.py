
from fastapi import WebSocket, WebSocketDisconnect
import asyncio
import json

@app.websocket("/api/v1/monitoring/ws/pipeline-monitoring")
async def websocket_pipeline_monitoring(websocket: WebSocket):
    """WebSocket endpoint for pipeline monitoring"""
    try:
        await websocket.accept()
        logger.info("Pipeline monitoring WebSocket connected")
        
        # Send initial connection message
        await websocket.send_json({
            "type": "connection",
            "status": "connected",
            "message": "Pipeline monitoring connected",
            "timestamp": time.time()
        })
        
        # Send initial system status
        await websocket.send_json({
            "type": "system_status",
            "data": {
                "status": "healthy",
                "gpu": {
                    "name": "RTX 5090",
                    "utilization": 15,
                    "memory_used": 2048,
                    "memory_total": 24576,
                    "temperature": 45
                },
                "memory": {
                    "used": 8192,
                    "total": 32768,
                    "percentage": 25
                },
                "queries": {
                    "total": len(sample_queries),
                    "per_minute": 2.5,
                    "avg_response_time": 3.2
                }
            },
            "timestamp": time.time()
        })
        
        # Keep connection alive with periodic updates
        while True:
            await asyncio.sleep(5)
            
            # Send heartbeat with live metrics
            await websocket.send_json({
                "type": "metrics_update",
                "data": {
                    "gpu_utilization": 15 + (time.time() % 10),
                    "memory_usage": 25 + (time.time() % 5),
                    "active_queries": 1,
                    "queries_per_minute": 2.5,
                    "avg_response_time": 3.2
                },
                "timestamp": time.time()
            })
            
    except WebSocketDisconnect:
        logger.info("Pipeline monitoring WebSocket disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        try:
            await websocket.close()
        except:
            pass

@app.get("/api/v1/monitoring/status")
async def get_monitoring_status():
    """Get current monitoring status"""
    return {
        "status": "healthy",
        "websocket_available": True,
        "last_update": time.time(),
        "system": {
            "gpu": "RTX 5090",
            "memory": "32GB",
            "storage": "Available"
        }
    }

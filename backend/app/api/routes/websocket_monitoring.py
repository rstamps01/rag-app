from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
import json
import asyncio
import logging
from typing import Dict, List
from app.core.websocket_manager import WebSocketManager

router = APIRouter()
websocket_manager = WebSocketManager()

@router.websocket("/ws/pipeline-monitoring")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for pipeline monitoring"""
    try:
        await websocket_manager.connect(websocket)
        
        # Send initial connection confirmation
        await websocket.send_text(json.dumps({
            "type": "connection",
            "status": "connected",
            "message": "Pipeline monitoring connected"
        }))
        
        # Start sending periodic updates
        while True:
            try:
                # Get system metrics
                metrics = await websocket_manager.get_system_metrics()
                
                # Send metrics to client
                await websocket.send_text(json.dumps({
                    "type": "metrics",
                    "data": metrics,
                    "timestamp": metrics.get("timestamp")
                }))
                
                # Wait before next update
                await asyncio.sleep(2)
                
            except WebSocketDisconnect:
                break
            except Exception as e:
                logging.error(f"Error in WebSocket loop: {e}")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "message": str(e)
                }))
                break
                
    except Exception as e:
        logging.error(f"WebSocket connection error: {e}")
    finally:
        await websocket_manager.disconnect(websocket)

@router.get("/monitoring/status")
async def get_monitoring_status():
    """Get current monitoring status"""
    try:
        metrics = await websocket_manager.get_system_metrics()
        return {
            "status": "connected",
            "active_connections": len(websocket_manager.active_connections),
            "metrics": metrics
        }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "active_connections": 0
        }

@router.get("/monitoring/test")
async def test_monitoring():
    """Test monitoring endpoint"""
    return {
        "status": "ok",
        "message": "Monitoring endpoint is working",
        "websocket_url": "/api/v1/ws/pipeline-monitoring"
    }
"""
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

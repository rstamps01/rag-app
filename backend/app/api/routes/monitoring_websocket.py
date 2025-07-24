"""
WebSocket API Routes for Real-time Pipeline Monitoring
Provides WebSocket endpoints for real-time pipeline monitoring and metrics
"""

import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse
from app.core.websocket_manager import websocket_manager
from app.core.enhanced_pipeline_monitor import enhanced_pipeline_monitor

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/monitoring", tags=["monitoring"])

@router.websocket("/ws/pipeline-monitoring")
async def websocket_pipeline_monitoring(websocket: WebSocket):
    """
    WebSocket endpoint for real-time pipeline monitoring
    Provides live updates of pipeline events, metrics, and system status
    """
    client_id = None
    
    try:
        # Connect the WebSocket client
        client_id = await websocket_manager.connect(websocket)
        logger.info(f"Pipeline monitoring WebSocket connected: {client_id}")
        
        # Keep connection alive and handle client messages
        while True:
            try:
                # Wait for client messages (with timeout to prevent blocking)
                data = await websocket.receive_text()
                
                # Parse client message
                try:
                    message = json.loads(data)
                    await handle_client_message(client_id, message)
                except json.JSONDecodeError:
                    logger.warning(f"Invalid JSON received from client {client_id}: {data}")
                    
            except WebSocketDisconnect:
                logger.info(f"Pipeline monitoring WebSocket disconnected: {client_id}")
                break
            except Exception as e:
                logger.error(f"Error handling WebSocket message from {client_id}: {e}")
                break
                
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
    finally:
        # Ensure cleanup
        if client_id:
            await websocket_manager.disconnect(client_id)

async def handle_client_message(client_id: str, message: dict):
    """
    Handle messages received from WebSocket clients
    
    Args:
        client_id: Client identifier
        message: Parsed message from client
    """
    message_type = message.get('type')
    
    if message_type == 'ping':
        # Respond to ping with pong
        await websocket_manager.send_to_client(client_id, {
            'type': 'pong',
            'timestamp': message.get('timestamp')
        })
        
    elif message_type == 'request_pipeline_state':
        # Send current pipeline state
        pipeline_state = enhanced_pipeline_monitor.get_pipeline_flow_state()
        await websocket_manager.send_to_client(client_id, {
            'type': 'pipeline_state',
            'data': pipeline_state
        })
        
    elif message_type == 'request_stage_details':
        # Send detailed information about a specific stage
        stage_id = message.get('stage_id')
        if stage_id:
            stage_details = get_stage_details(stage_id)
            await websocket_manager.send_to_client(client_id, {
                'type': 'stage_details',
                'stage_id': stage_id,
                'data': stage_details
            })
            
    elif message_type == 'subscribe_to_stage':
        # Subscribe client to updates for a specific stage
        stage_id = message.get('stage_id')
        logger.info(f"Client {client_id} subscribed to stage {stage_id}")
        # Note: Subscription logic would be implemented here
        
    else:
        logger.warning(f"Unknown message type from client {client_id}: {message_type}")

def get_stage_details(stage_id: str) -> dict:
    """
    Get detailed information about a specific pipeline stage
    
    Args:
        stage_id: Pipeline stage identifier
        
    Returns:
        Dict containing detailed stage information
    """
    stage_metrics = enhanced_pipeline_monitor.stage_metrics.get(stage_id, {})
    
    # Get recent events for this stage
    recent_events = []
    try:
        # This would typically query the database for recent events
        # For now, return mock data
        recent_events = [
            {
                'timestamp': '2025-01-23T12:00:00Z',
                'event': 'stage_start',
                'pipeline_id': 'pipeline_123',
                'data': {'input_size': 1024}
            },
            {
                'timestamp': '2025-01-23T12:00:02Z',
                'event': 'stage_complete',
                'pipeline_id': 'pipeline_123',
                'data': {'processing_time': 2.1, 'success': True}
            }
        ]
    except Exception as e:
        logger.error(f"Failed to get recent events for stage {stage_id}: {e}")
    
    return {
        'stage_id': stage_id,
        'metrics': stage_metrics,
        'recent_events': recent_events,
        'status': enhanced_pipeline_monitor._get_stage_status(stage_id),
        'performance_history': get_stage_performance_history(stage_id)
    }

def get_stage_performance_history(stage_id: str) -> list:
    """
    Get performance history for a specific stage
    
    Args:
        stage_id: Pipeline stage identifier
        
    Returns:
        List of performance data points
    """
    # This would typically query historical data from the database
    # For now, return mock data
    return [
        {'timestamp': '2025-01-23T11:55:00Z', 'processing_time': 1.8, 'success': True},
        {'timestamp': '2025-01-23T11:56:00Z', 'processing_time': 2.1, 'success': True},
        {'timestamp': '2025-01-23T11:57:00Z', 'processing_time': 1.9, 'success': True},
        {'timestamp': '2025-01-23T11:58:00Z', 'processing_time': 2.3, 'success': False},
        {'timestamp': '2025-01-23T11:59:00Z', 'processing_time': 2.0, 'success': True}
    ]

@router.get("/pipeline/flow-state")
async def get_pipeline_flow_state():
    """
    REST endpoint to get current pipeline flow state
    Useful for initial page loads or when WebSocket is not available
    """
    try:
        pipeline_state = enhanced_pipeline_monitor.get_pipeline_flow_state()
        return JSONResponse(content=pipeline_state)
    except Exception as e:
        logger.error(f"Failed to get pipeline flow state: {e}")
        raise HTTPException(status_code=500, detail="Failed to get pipeline state")

@router.get("/pipeline/stage/{stage_id}")
async def get_stage_details_rest(stage_id: str):
    """
    REST endpoint to get detailed information about a specific stage
    
    Args:
        stage_id: Pipeline stage identifier
    """
    try:
        stage_details = get_stage_details(stage_id)
        return JSONResponse(content=stage_details)
    except Exception as e:
        logger.error(f"Failed to get stage details for {stage_id}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get details for stage {stage_id}")

@router.get("/system/metrics")
async def get_system_metrics():
    """
    REST endpoint to get current system metrics
    """
    try:
        # Get WebSocket connection stats
        connection_stats = websocket_manager.get_connection_stats()
        
        # Get pipeline metrics
        pipeline_state = enhanced_pipeline_monitor.get_pipeline_flow_state()
        system_metrics = pipeline_state.get('system_metrics', {})
        
        # Combine metrics
        metrics = {
            'system': system_metrics,
            'websocket': connection_stats,
            'pipeline_stages': len(pipeline_state.get('stages', [])),
            'active_connections': connection_stats.get('active_connections', 0)
        }
        
        return JSONResponse(content=metrics)
    except Exception as e:
        logger.error(f"Failed to get system metrics: {e}")
        raise HTTPException(status_code=500, detail="Failed to get system metrics")

@router.post("/pipeline/simulate-event")
async def simulate_pipeline_event(event_data: dict):
    """
    Development endpoint to simulate pipeline events for testing
    Should be removed in production
    
    Args:
        event_data: Event data to simulate
    """
    try:
        # Simulate a pipeline event
        pipeline_id = event_data.get('pipeline_id', 'test_pipeline')
        stage = event_data.get('stage', 'test_stage')
        data = event_data.get('data', {})
        
        enhanced_pipeline_monitor.record_event(pipeline_id, stage, data)
        
        return JSONResponse(content={
            'message': 'Event simulated successfully',
            'event': {
                'pipeline_id': pipeline_id,
                'stage': stage,
                'data': data
            }
        })
    except Exception as e:
        logger.error(f"Failed to simulate pipeline event: {e}")
        raise HTTPException(status_code=500, detail="Failed to simulate event")

@router.get("/health")
async def monitoring_health_check():
    """
    Health check endpoint for the monitoring system
    """
    try:
        connection_stats = websocket_manager.get_connection_stats()
        
        health_status = {
            'status': 'healthy',
            'websocket_manager': 'running',
            'active_connections': connection_stats['active_connections'],
            'pipeline_monitor': 'running',
            'timestamp': enhanced_pipeline_monitor.get_pipeline_flow_state()['system_metrics']['timestamp']
        }
        
        return JSONResponse(content=health_status)
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=500,
            content={
                'status': 'unhealthy',
                'error': str(e)
            }
        )

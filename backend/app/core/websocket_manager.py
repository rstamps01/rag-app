"""
WebSocket Manager for Real-time Pipeline Monitoring
Handles WebSocket connections and broadcasts pipeline events to connected clients
"""

import json
import asyncio
import logging
from datetime import datetime
from typing import Dict, List, Any, Optional
from fastapi import WebSocket, WebSocketDisconnect
import uuid

logger = logging.getLogger(__name__)

class PipelineWebSocketManager:
    """
    Manages WebSocket connections for real-time pipeline monitoring
    Broadcasts pipeline events and metrics to connected clients
    """
    async def initialize(self):
        """Initialize the monitoring component"""
        # Existing initialization code here

    def __init__(self):
        # Store active WebSocket connections
        self.active_connections: Dict[str, WebSocket] = {}
        
        # Track connection metadata
        self.connection_metadata: Dict[str, Dict[str, Any]] = {}
        
        # Message queue for broadcasting
        self.message_queue = asyncio.Queue()
        
        # Background task for message processing
        self.broadcast_task = None
        self.running = False
        
        logger.info("PipelineWebSocketManager initialized")
    
        pass

    async def start(self):
        """Start the WebSocket manager and background broadcasting task"""
        if self.running:
            return
            
        self.running = True
        self.broadcast_task = asyncio.create_task(self._broadcast_worker())
        logger.info("WebSocket manager started")
    
    async def stop(self):
        """Stop the WebSocket manager and cleanup connections"""
        self.running = False
        
        if self.broadcast_task:
            self.broadcast_task.cancel()
            try:
                await self.broadcast_task
            except asyncio.CancelledError:
                pass
        
        # Close all active connections
        for client_id, websocket in list(self.active_connections.items()):
            try:
                await websocket.close()
            except:
                pass
            
        self.active_connections.clear()
        self.connection_metadata.clear()
        logger.info("WebSocket manager stopped")
    
    async def connect(self, websocket: WebSocket, client_id: Optional[str] = None) -> str:
        """
        Accept a new WebSocket connection and register it
        
        Args:
            websocket: FastAPI WebSocket instance
            client_id: Optional client identifier, generates UUID if not provided
            
        Returns:
            str: Client ID for the connection
        """
        await websocket.accept()
        
        if not client_id:
            client_id = str(uuid.uuid4())
        
        self.active_connections[client_id] = websocket
        self.connection_metadata[client_id] = {
            'connected_at': datetime.now().isoformat(),
            'last_ping': datetime.now().isoformat(),
            'message_count': 0
        }
        
        logger.info(f"WebSocket client connected: {client_id}")
        
        # Send initial pipeline state to new client
        try:
            await self._send_initial_state(websocket)
        except Exception as e:
            logger.error(f"Failed to send initial state to {client_id}: {e}")
        
        return client_id
    
    async def disconnect(self, client_id: str):
        """
        Disconnect and remove a WebSocket client
        
        Args:
            client_id: Client identifier to disconnect
        """
        if client_id in self.active_connections:
            try:
                websocket = self.active_connections[client_id]
                await websocket.close()
            except:
                pass
            
            del self.active_connections[client_id]
            del self.connection_metadata[client_id]
            logger.info(f"WebSocket client disconnected: {client_id}")
    
    async def broadcast_pipeline_event(self, event_data: Dict[str, Any]):
        """
        Queue a pipeline event for broadcasting to all connected clients
        
        Args:
            event_data: Pipeline event data to broadcast
        """
        message = {
            'type': 'pipeline_event',
            'data': event_data,
            'timestamp': datetime.now().isoformat()
        }
        
        await self.message_queue.put(message)
    
    async def broadcast_metrics_update(self, metrics_data: Dict[str, Any]):
        """
        Queue a metrics update for broadcasting to all connected clients
        
        Args:
            metrics_data: Metrics data to broadcast
        """
        message = {
            'type': 'metrics_update',
            'data': metrics_data,
            'timestamp': datetime.now().isoformat()
        }
        
        await self.message_queue.put(message)
    
    async def broadcast_pipeline_state(self, state_data: Dict[str, Any]):
        """
        Queue a complete pipeline state update for broadcasting
        
        Args:
            state_data: Complete pipeline state data
        """
        message = {
            'type': 'pipeline_state',
            'data': state_data,
            'timestamp': datetime.now().isoformat()
        }
        
        await self.message_queue.put(message)
    
    async def send_to_client(self, client_id: str, message: Dict[str, Any]):
        """
        Send a message to a specific client
        
        Args:
            client_id: Target client identifier
            message: Message data to send
        """
        if client_id not in self.active_connections:
            logger.warning(f"Attempted to send message to disconnected client: {client_id}")
            return
        
        try:
            websocket = self.active_connections[client_id]
            await websocket.send_text(json.dumps(message))
            
            # Update metadata
            if client_id in self.connection_metadata:
                self.connection_metadata[client_id]['message_count'] += 1
                self.connection_metadata[client_id]['last_ping'] = datetime.now().isoformat()
                
        except Exception as e:
            logger.error(f"Failed to send message to client {client_id}: {e}")
            await self.disconnect(client_id)
    
    async def _broadcast_worker(self):
        """Background worker that processes the message queue and broadcasts to all clients"""
        while self.running:
            try:
                # Wait for message with timeout
                message = await asyncio.wait_for(self.message_queue.get(), timeout=1.0)
                
                # Broadcast to all connected clients
                await self._broadcast_to_all(message)
                
                # Mark task as done
                self.message_queue.task_done()
                
            except asyncio.TimeoutError:
                # Timeout is normal, continue loop
                continue
            except Exception as e:
                logger.error(f"Error in broadcast worker: {e}")
    
    async def _broadcast_to_all(self, message: Dict[str, Any]):
        """
        Broadcast a message to all connected clients
        
        Args:
            message: Message to broadcast
        """
        if not self.active_connections:
            return
        
        message_json = json.dumps(message)
        disconnected_clients = []
        
        # Send to all clients
        for client_id, websocket in self.active_connections.items():
            try:
                await websocket.send_text(message_json)
                
                # Update metadata
                if client_id in self.connection_metadata:
                    self.connection_metadata[client_id]['message_count'] += 1
                    self.connection_metadata[client_id]['last_ping'] = datetime.now().isoformat()
                    
            except Exception as e:
                logger.error(f"Failed to broadcast to client {client_id}: {e}")
                disconnected_clients.append(client_id)
        
        # Clean up disconnected clients
        for client_id in disconnected_clients:
            await self.disconnect(client_id)
    
    async def _send_initial_state(self, websocket: WebSocket):
        """
        Send initial pipeline state to a newly connected client
        
        Args:
            websocket: WebSocket connection to send initial state to
        """
        # Import here to avoid circular imports
        from app.core.pipeline_monitor import pipeline_monitor
        
        try:
            # Get current pipeline state
            initial_state = {
                'stages': [
                    {
                        'id': 'query_input',
                        'name': 'Query Input',
                        'status': 'idle',
                        'metrics': {'active_queries': 0, 'queue_depth': 0}
                    },
                    {
                        'id': 'embedding',
                        'name': 'Embedding Generation',
                        'status': 'idle',
                        'metrics': {'gpu_usage': 0, 'avg_time_ms': 0}
                    },
                    {
                        'id': 'vector_search',
                        'name': 'Vector Search',
                        'status': 'idle',
                        'metrics': {'search_time_ms': 0, 'results_found': 0}
                    },
                    {
                        'id': 'document_retrieval',
                        'name': 'Document Retrieval',
                        'status': 'idle',
                        'metrics': {'docs_retrieved': 0, 'relevance_score': 0}
                    },
                    {
                        'id': 'context_prep',
                        'name': 'Context Preparation',
                        'status': 'idle',
                        'metrics': {'context_length': 0, 'time_ms': 0}
                    },
                    {
                        'id': 'llm_processing',
                        'name': 'LLM Processing',
                        'status': 'idle',
                        'metrics': {'model_load': 0, 'tokens_generated': 0}
                    },
                    {
                        'id': 'response',
                        'name': 'Response Delivery',
                        'status': 'idle',
                        'metrics': {'response_length': 0, 'delivery_time_ms': 0}
                    },
                    {
                        'id': 'history_log',
                        'name': 'History Logging',
                        'status': 'idle',
                        'metrics': {'records_saved': 0, 'db_latency_ms': 0}
                    }
                ],
                'connections': [
                    {'from': 'query_input', 'to': 'embedding', 'active': False},
                    {'from': 'embedding', 'to': 'vector_search', 'active': False},
                    {'from': 'vector_search', 'to': 'document_retrieval', 'active': False},
                    {'from': 'document_retrieval', 'to': 'context_prep', 'active': False},
                    {'from': 'context_prep', 'to': 'llm_processing', 'active': False},
                    {'from': 'llm_processing', 'to': 'response', 'active': False},
                    {'from': 'response', 'to': 'history_log', 'active': False}
                ],
                'system_metrics': {
                    'queries_per_minute': 0,
                    'avg_response_time': 0,
                    'success_rate': 100,
                    'gpu_utilization': 0,
                    'memory_usage': 0,
                    'active_connections': len(self.active_connections)
                }
            }
            
            # Try to get real metrics if available
            try:
                query_stats = pipeline_monitor.get_query_processing_stats()
                if query_stats:
                    initial_state['system_metrics'].update({
                        'queries_per_minute': query_stats.get('total_processed', 0),
                        'avg_response_time': query_stats.get('avg_processing_time', 0) * 1000,  # Convert to ms
                        'success_rate': (query_stats.get('successful', 0) / max(query_stats.get('total_processed', 1), 1)) * 100
                    })
            except Exception as e:
                logger.warning(f"Could not get real pipeline metrics: {e}")
            
            message = {
                'type': 'initial_state',
                'data': initial_state,
                'timestamp': datetime.now().isoformat()
            }
            
            await websocket.send_text(json.dumps(message))
            
        except Exception as e:
            logger.error(f"Failed to send initial state: {e}")
    
    def get_connection_stats(self) -> Dict[str, Any]:
        """
        Get statistics about current WebSocket connections
        
        Returns:
            Dict containing connection statistics
        """
        return {
            'active_connections': len(self.active_connections),
            'total_messages_sent': sum(
                meta.get('message_count', 0) 
                for meta in self.connection_metadata.values()
            ),
            'connections': [
                {
                    'client_id': client_id,
                    'connected_at': meta.get('connected_at'),
                    'last_ping': meta.get('last_ping'),
                    'message_count': meta.get('message_count', 0)
                }
                for client_id, meta in self.connection_metadata.items()
            ]
        }

# Global WebSocket manager instance
websocket_manager = PipelineWebSocketManager()

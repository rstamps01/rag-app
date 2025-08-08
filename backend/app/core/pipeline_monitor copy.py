"""
Enhanced Pipeline Monitor with Real-time WebSocket Broadcasting
Extends the existing pipeline monitor to broadcast events to connected clients
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from app.core.pipeline_monitor import PipelineMonitor
from app.core.websocket_manager import websocket_manager

logger = logging.getLogger(__name__)

class EnhancedPipelineMonitor(PipelineMonitor):
    """
    Enhanced pipeline monitor that broadcasts real-time events via WebSocket
    Extends the existing PipelineMonitor with real-time capabilities
    """
    
    def __init__(self):
        super().__init__()
        self.websocket_manager = websocket_manager
        self.current_pipeline_state = {}
        self.stage_metrics = {}
        
        logger.info("EnhancedPipelineMonitor initialized")
    
    async def start_monitoring(self):
        """Start the enhanced monitoring system"""
        await self.websocket_manager.start()
        logger.info("Enhanced pipeline monitoring started")
    
    async def stop_monitoring(self):
        """Stop the enhanced monitoring system"""
        await self.websocket_manager.stop()
        logger.info("Enhanced pipeline monitoring stopped")
    
    def record_event(self, pipeline_id: str, stage: str, data: Optional[Dict[str, Any]] = None):
        """
        Record a pipeline event and broadcast it to connected clients
        
        Args:
            pipeline_id: Unique identifier for the pipeline execution
            stage: Pipeline stage name
            data: Additional event data
        """
        # Call parent method to maintain existing functionality
        super().record_event(pipeline_id, stage, data)
        
        # Create event for broadcasting
        event = {
            'pipeline_id': pipeline_id,
            'stage': stage,
            'timestamp': datetime.now().isoformat(),
            'data': data or {}
        }
        
        # Update current pipeline state
        self._update_pipeline_state(pipeline_id, stage, event)
        
        # Broadcast event asynchronously
        asyncio.create_task(self._broadcast_pipeline_event(event))
    
    def record_stage_start(self, pipeline_id: str, stage: str, data: Optional[Dict[str, Any]] = None):
        """
        Record the start of a pipeline stage
        
        Args:
            pipeline_id: Unique identifier for the pipeline execution
            stage: Pipeline stage name
            data: Additional stage data
        """
        event_data = {
            'status': 'processing',
            'start_time': datetime.now().isoformat(),
            **(data or {})
        }
        
        self.record_event(pipeline_id, stage, event_data)
        
        # Update stage metrics
        if stage not in self.stage_metrics:
            self.stage_metrics[stage] = {
                'active_count': 0,
                'total_processed': 0,
                'avg_processing_time': 0,
                'success_rate': 100
            }
        
        self.stage_metrics[stage]['active_count'] += 1
        
        # Broadcast metrics update
        asyncio.create_task(self._broadcast_metrics_update())
    
    def record_stage_complete(self, pipeline_id: str, stage: str, processing_time: float, 
                            success: bool = True, data: Optional[Dict[str, Any]] = None):
        """
        Record the completion of a pipeline stage
        
        Args:
            pipeline_id: Unique identifier for the pipeline execution
            stage: Pipeline stage name
            processing_time: Time taken to process the stage (in seconds)
            success: Whether the stage completed successfully
            data: Additional completion data
        """
        event_data = {
            'status': 'success' if success else 'error',
            'processing_time': processing_time,
            'end_time': datetime.now().isoformat(),
            **(data or {})
        }
        
        self.record_event(pipeline_id, stage, event_data)
        
        # Update stage metrics
        if stage in self.stage_metrics:
            metrics = self.stage_metrics[stage]
            metrics['active_count'] = max(0, metrics['active_count'] - 1)
            metrics['total_processed'] += 1
            
            # Update average processing time
            current_avg = metrics['avg_processing_time']
            total = metrics['total_processed']
            metrics['avg_processing_time'] = ((current_avg * (total - 1)) + processing_time) / total
            
            # Update success rate
            if success:
                metrics['success_rate'] = ((metrics['success_rate'] * (total - 1)) + 100) / total
            else:
                metrics['success_rate'] = (metrics['success_rate'] * (total - 1)) / total
        
        # Broadcast metrics update
        asyncio.create_task(self._broadcast_metrics_update())
    
    def record_gpu_metrics(self, gpu_utilization: float, memory_usage: float, temperature: float = None):
        """
        Record GPU performance metrics
        
        Args:
            gpu_utilization: GPU utilization percentage (0-100)
            memory_usage: GPU memory usage in GB
            temperature: GPU temperature in Celsius (optional)
        """
        gpu_data = {
            'gpu_utilization': gpu_utilization,
            'memory_usage': memory_usage,
            'timestamp': datetime.now().isoformat()
        }
        
        if temperature is not None:
            gpu_data['temperature'] = temperature
        
        # Broadcast GPU metrics
        asyncio.create_task(self.websocket_manager.broadcast_metrics_update({
            'type': 'gpu_metrics',
            'data': gpu_data
        }))
    
    def record_query_metrics(self, queries_per_minute: int, avg_response_time: float, 
                           active_queries: int, queue_depth: int):
        """
        Record query processing metrics
        
        Args:
            queries_per_minute: Current queries processed per minute
            avg_response_time: Average response time in seconds
            active_queries: Number of currently active queries
            queue_depth: Number of queries waiting in queue
        """
        query_data = {
            'queries_per_minute': queries_per_minute,
            'avg_response_time': avg_response_time * 1000,  # Convert to ms
            'active_queries': active_queries,
            'queue_depth': queue_depth,
            'timestamp': datetime.now().isoformat()
        }
        
        # Broadcast query metrics
        asyncio.create_task(self.websocket_manager.broadcast_metrics_update({
            'type': 'query_metrics',
            'data': query_data
        }))
    
    def get_pipeline_flow_state(self) -> Dict[str, Any]:
        """
        Get the current state of the pipeline for visualization
        
        Returns:
            Dict containing current pipeline state
        """
        # Define pipeline stages
        stages = [
            {
                'id': 'query_input',
                'name': 'Query Input',
                'status': self._get_stage_status('query_input'),
                'metrics': self._get_stage_metrics('query_input')
            },
            {
                'id': 'embedding',
                'name': 'Embedding Generation',
                'status': self._get_stage_status('embedding'),
                'metrics': self._get_stage_metrics('embedding')
            },
            {
                'id': 'vector_search',
                'name': 'Vector Search',
                'status': self._get_stage_status('vector_search'),
                'metrics': self._get_stage_metrics('vector_search')
            },
            {
                'id': 'document_retrieval',
                'name': 'Document Retrieval',
                'status': self._get_stage_status('document_retrieval'),
                'metrics': self._get_stage_metrics('document_retrieval')
            },
            {
                'id': 'context_prep',
                'name': 'Context Preparation',
                'status': self._get_stage_status('context_prep'),
                'metrics': self._get_stage_metrics('context_prep')
            },
            {
                'id': 'llm_processing',
                'name': 'LLM Processing',
                'status': self._get_stage_status('llm_processing'),
                'metrics': self._get_stage_metrics('llm_processing')
            },
            {
                'id': 'response',
                'name': 'Response Delivery',
                'status': self._get_stage_status('response'),
                'metrics': self._get_stage_metrics('response')
            },
            {
                'id': 'history_log',
                'name': 'History Logging',
                'status': self._get_stage_status('history_log'),
                'metrics': self._get_stage_metrics('history_log')
            }
        ]
        
        # Define connections between stages
        connections = [
            {'from': 'query_input', 'to': 'embedding', 'active': self._is_connection_active('query_input', 'embedding')},
            {'from': 'embedding', 'to': 'vector_search', 'active': self._is_connection_active('embedding', 'vector_search')},
            {'from': 'vector_search', 'to': 'document_retrieval', 'active': self._is_connection_active('vector_search', 'document_retrieval')},
            {'from': 'document_retrieval', 'to': 'context_prep', 'active': self._is_connection_active('document_retrieval', 'context_prep')},
            {'from': 'context_prep', 'to': 'llm_processing', 'active': self._is_connection_active('context_prep', 'llm_processing')},
            {'from': 'llm_processing', 'to': 'response', 'active': self._is_connection_active('llm_processing', 'response')},
            {'from': 'response', 'to': 'history_log', 'active': self._is_connection_active('response', 'history_log')}
        ]
        
        # System metrics
        system_metrics = {
            'queries_per_minute': sum(metrics.get('total_processed', 0) for metrics in self.stage_metrics.values()),
            'avg_response_time': sum(metrics.get('avg_processing_time', 0) for metrics in self.stage_metrics.values()) * 1000,
            'success_rate': sum(metrics.get('success_rate', 100) for metrics in self.stage_metrics.values()) / max(len(self.stage_metrics), 1),
            'active_connections': self.websocket_manager.get_connection_stats()['active_connections'],
            'timestamp': datetime.now().isoformat()
        }
        
        return {
            'stages': stages,
            'connections': connections,
            'system_metrics': system_metrics
        }
    
    def _update_pipeline_state(self, pipeline_id: str, stage: str, event: Dict[str, Any]):
        """Update the current pipeline state with new event data"""
        if pipeline_id not in self.current_pipeline_state:
            self.current_pipeline_state[pipeline_id] = {}
        
        self.current_pipeline_state[pipeline_id][stage] = event
    
    def _get_stage_status(self, stage_id: str) -> str:
        """Get the current status of a pipeline stage"""
        if stage_id not in self.stage_metrics:
            return 'idle'
        
        metrics = self.stage_metrics[stage_id]
        if metrics['active_count'] > 0:
            return 'processing'
        elif metrics['total_processed'] > 0:
            return 'success' if metrics['success_rate'] > 95 else 'warning'
        else:
            return 'idle'
    
    def _get_stage_metrics(self, stage_id: str) -> Dict[str, Any]:
        """Get metrics for a specific pipeline stage"""
        if stage_id not in self.stage_metrics:
            return {
                'active_count': 0,
                'total_processed': 0,
                'avg_processing_time': 0,
                'success_rate': 100
            }
        
        metrics = self.stage_metrics[stage_id].copy()
        metrics['avg_time_ms'] = metrics['avg_processing_time'] * 1000  # Convert to ms
        return metrics
    
    def _is_connection_active(self, from_stage: str, to_stage: str) -> bool:
        """Check if a connection between stages is currently active"""
        from_metrics = self.stage_metrics.get(from_stage, {})
        to_metrics = self.stage_metrics.get(to_stage, {})
        
        # Connection is active if either stage is processing
        return (from_metrics.get('active_count', 0) > 0 or 
                to_metrics.get('active_count', 0) > 0)
    
    async def _broadcast_pipeline_event(self, event: Dict[str, Any]):
        """Broadcast a pipeline event to all connected clients"""
        try:
            await self.websocket_manager.broadcast_pipeline_event(event)
        except Exception as e:
            logger.error(f"Failed to broadcast pipeline event: {e}")
    
    async def _broadcast_metrics_update(self):
        """Broadcast current metrics to all connected clients"""
        try:
            metrics_data = {
                'stage_metrics': self.stage_metrics,
                'pipeline_state': self.get_pipeline_flow_state(),
                'timestamp': datetime.now().isoformat()
            }
            
            await self.websocket_manager.broadcast_metrics_update(metrics_data)
        except Exception as e:
            logger.error(f"Failed to broadcast metrics update: {e}")

# Global enhanced pipeline monitor instance
enhanced_pipeline_monitor = EnhancedPipelineMonitor()

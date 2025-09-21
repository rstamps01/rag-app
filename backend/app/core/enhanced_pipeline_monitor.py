"""
Enhanced Pipeline Monitor with Comprehensive Metrics Collection
Integrates Qdrant, PostgreSQL, Pipeline, and Connection Status monitoring
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from app.core.base_pipeline_monitor import PipelineMonitor
from app.core.websocket_manager import websocket_manager
from app.services.enhanced_metrics_collector import enhanced_metrics_collector

logger = logging.getLogger(__name__)

class EnhancedPipelineMonitor(PipelineMonitor):
    """
    Enhanced pipeline monitor with comprehensive metrics collection
    Integrates all monitoring capabilities into a single system
    """
    
    def __init__(self):
        super().__init__()
        self.websocket_manager = websocket_manager
        self.metrics_collector = enhanced_metrics_collector
        
        # Pipeline state tracking
        self.current_pipeline_state = {}
        self.stage_metrics = {}
        self.pipeline_history = []
        
        # Service health tracking
        self.service_health = {
            'qdrant': {'status': 'unknown', 'last_check': None},
            'postgres': {'status': 'unknown', 'last_check': None},
            'backend': {'status': 'unknown', 'last_check': None},
            'llm_service': {'status': 'unknown', 'last_check': None}
        }
        
        # Metrics aggregation
        self.aggregated_metrics = {
            'document_processing': {
                'total_processed': 0,
                'success_rate': 0.0,
                'avg_processing_time': 0.0,
                'error_rate': 0.0
            },
            'query_processing': {
                'total_processed': 0,
                'success_rate': 0.0,
                'avg_processing_time': 0.0,
                'error_rate': 0.0
            },
            'system_performance': {
                'cpu_usage': 0.0,
                'memory_usage': 0.0,
                'disk_usage': 0.0,
                'network_usage': 0.0
            }
        }
        
        logger.info("EnhancedPipelineMonitor initialized with comprehensive metrics collection")
    
    async def start_monitoring(self):
        """Start the enhanced monitoring system"""
        try:
            # Start WebSocket manager
            await self.websocket_manager.start()
            
            # Start metrics collector
            await self.metrics_collector.start()
            
            # Start monitoring tasks
            asyncio.create_task(self._monitoring_loop())
            asyncio.create_task(self._metrics_broadcast_loop())
            asyncio.create_task(self._health_monitoring_loop())
            
            logger.info("Enhanced pipeline monitoring started with comprehensive metrics collection")
            
        except Exception as e:
            logger.error(f"Failed to start enhanced monitoring: {e}")
            raise
    
    async def stop_monitoring(self):
        """Stop the enhanced monitoring system"""
        try:
            # Stop metrics collector
            await self.metrics_collector.stop()
            
            # Stop WebSocket manager
            await self.websocket_manager.stop()
            
            logger.info("Enhanced pipeline monitoring stopped")
            
        except Exception as e:
            logger.error(f"Failed to stop enhanced monitoring: {e}")
    
    async def _monitoring_loop(self):
        """Main monitoring loop"""
        while True:
            try:
                # Update pipeline state
                await self._update_pipeline_state()
                
                # Update aggregated metrics
                await self._update_aggregated_metrics()
                
                # Broadcast current state
                await self._broadcast_pipeline_state()
                
                await asyncio.sleep(1)  # Update every second
                
            except Exception as e:
                logger.error(f"Monitoring loop error: {e}")
                await asyncio.sleep(5)  # Wait before retrying
    
    async def _metrics_broadcast_loop(self):
        """Broadcast metrics to connected clients"""
        while True:
            try:
                # Get all metrics
                all_metrics = self.metrics_collector.get_all_metrics()
                
                # Add pipeline-specific metrics
                all_metrics['pipeline_state'] = self.current_pipeline_state
                all_metrics['aggregated_metrics'] = self.aggregated_metrics
                all_metrics['service_health'] = self.service_health
                
                # Broadcast to WebSocket clients
                await self.websocket_manager.broadcast({
                    'type': 'metrics_update',
                    'timestamp': datetime.now().isoformat(),
                    'data': all_metrics
                })
                
                await asyncio.sleep(2)  # Broadcast every 2 seconds
                
            except Exception as e:
                logger.error(f"Metrics broadcast error: {e}")
                await asyncio.sleep(5)
    
    async def _health_monitoring_loop(self):
        """Monitor service health"""
        while True:
            try:
                # Update service health from metrics collector
                metrics = self.metrics_collector.get_all_metrics()
                
                # Update Qdrant health
                qdrant_status = metrics['qdrant_metrics']['connection_status']
                self.service_health['qdrant'] = {
                    'status': qdrant_status,
                    'last_check': datetime.now().isoformat()
                }
                
                # Update PostgreSQL health
                postgres_status = metrics['postgres_metrics']['connection_status']
                self.service_health['postgres'] = {
                    'status': postgres_status,
                    'last_check': datetime.now().isoformat()
                }
                
                # Update backend health
                backend_status = metrics['connection_metrics']['backend_status']
                self.service_health['backend'] = {
                    'status': backend_status,
                    'last_check': datetime.now().isoformat()
                }
                
                # Update LLM service health
                llm_status = metrics['connection_metrics']['llm_service_status']
                self.service_health['llm_service'] = {
                    'status': llm_status,
                    'last_check': datetime.now().isoformat()
                }
                
                await asyncio.sleep(5)  # Check health every 5 seconds
                
            except Exception as e:
                logger.error(f"Health monitoring error: {e}")
                await asyncio.sleep(10)
    
    async def _update_pipeline_state(self):
        """Update current pipeline state"""
        try:
            # Get active pipelines from memory events
            active_pipelines = {}
            
            for pipeline_id, events in self.in_memory_events.items():
                if not events:
                    continue
                
                # Get the latest event
                latest_event = events[-1]
                
                # Determine pipeline status
                if latest_event['stage'] == 'completed':
                    status = 'completed'
                elif latest_event['stage'] == 'error':
                    status = 'error'
                else:
                    status = 'processing'
                
                active_pipelines[pipeline_id] = {
                    'status': status,
                    'current_stage': latest_event['stage'],
                    'start_time': events[0]['timestamp'],
                    'last_update': latest_event['timestamp'],
                    'events': events
                }
            
            self.current_pipeline_state = active_pipelines
            
        except Exception as e:
            logger.error(f"Pipeline state update error: {e}")
    
    async def _update_aggregated_metrics(self):
        """Update aggregated metrics from pipeline history"""
        try:
            # Calculate document processing metrics
            doc_pipelines = [p for p in self.pipeline_history if p.get('type') == 'document']
            
            if doc_pipelines:
                total_docs = len(doc_pipelines)
                successful_docs = len([p for p in doc_pipelines if p.get('status') == 'completed'])
                
                self.aggregated_metrics['document_processing'] = {
                    'total_processed': total_docs,
                    'success_rate': (successful_docs / total_docs) * 100 if total_docs > 0 else 0,
                    'avg_processing_time': sum(p.get('processing_time', 0) for p in doc_pipelines) / total_docs if total_docs > 0 else 0,
                    'error_rate': ((total_docs - successful_docs) / total_docs) * 100 if total_docs > 0 else 0
                }
            
            # Calculate query processing metrics
            query_pipelines = [p for p in self.pipeline_history if p.get('type') == 'query']
            
            if query_pipelines:
                total_queries = len(query_pipelines)
                successful_queries = len([p for p in query_pipelines if p.get('status') == 'completed'])
                
                self.aggregated_metrics['query_processing'] = {
                    'total_processed': total_queries,
                    'success_rate': (successful_queries / total_queries) * 100 if total_queries > 0 else 0,
                    'avg_processing_time': sum(p.get('processing_time', 0) for p in query_pipelines) / total_queries if total_queries > 0 else 0,
                    'error_rate': ((total_queries - successful_queries) / total_queries) * 100 if total_queries > 0 else 0
                }
            
            # Update system performance metrics
            system_metrics = self.metrics_collector.get_all_metrics().get('system_metrics', {})
            
            self.aggregated_metrics['system_performance'] = {
                'cpu_usage': system_metrics.get('cpu_usage', 0),
                'memory_usage': system_metrics.get('memory_usage', 0),
                'disk_usage': system_metrics.get('disk_usage', 0),
                'network_usage': system_metrics.get('network_bytes_sent', 0) + system_metrics.get('network_bytes_recv', 0)
            }
            
        except Exception as e:
            logger.error(f"Aggregated metrics update error: {e}")
    
    async def _broadcast_pipeline_state(self):
        """Broadcast current pipeline state to connected clients"""
        try:
            # Prepare pipeline state data
            pipeline_data = {
                'active_pipelines': len(self.current_pipeline_state),
                'pipelines': self.current_pipeline_state,
                'aggregated_metrics': self.aggregated_metrics,
                'service_health': self.service_health
            }
            
            # Broadcast to WebSocket clients
            await self.websocket_manager.broadcast({
                'type': 'pipeline_state_update',
                'timestamp': datetime.now().isoformat(),
                'data': pipeline_data
            })
            
        except Exception as e:
            logger.error(f"Pipeline state broadcast error: {e}")
    
    def record_event(self, pipeline_id: str, stage: str, data: Optional[Dict[str, Any]] = None):
        """
        Record a pipeline event with enhanced monitoring
        
        Args:
            pipeline_id: Unique identifier for the pipeline execution
            stage: Pipeline stage name
            data: Additional event data
        """
        # Call parent method to maintain existing functionality
        super().record_event(pipeline_id, stage, data)
        
        # Add to pipeline history
        event_data = {
            'pipeline_id': pipeline_id,
            'stage': stage,
            'timestamp': datetime.now().isoformat(),
            'data': data or {}
        }
        
        # Determine pipeline type
        pipeline_type = 'unknown'
        if 'document' in stage.lower() or 'chunk' in stage.lower() or 'embedding' in stage.lower():
            pipeline_type = 'document'
        elif 'query' in stage.lower() or 'search' in stage.lower() or 'llm' in stage.lower():
            pipeline_type = 'query'
        
        # Add to history
        self.pipeline_history.append({
            'pipeline_id': pipeline_id,
            'type': pipeline_type,
            'stage': stage,
            'timestamp': datetime.now().isoformat(),
            'data': data or {}
        })
        
        # Keep only last 1000 events
        if len(self.pipeline_history) > 1000:
            self.pipeline_history = self.pipeline_history[-1000:]
        
        # Broadcast event
        asyncio.create_task(self._broadcast_pipeline_event(event_data))
    
    def record_stage_start(self, pipeline_id: str, stage: str, data: Optional[Dict[str, Any]] = None):
        """Record the start of a pipeline stage with enhanced monitoring"""
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
        """Record the completion of a pipeline stage with enhanced monitoring"""
        event_data = {
            'status': 'completed' if success else 'error',
            'processing_time': processing_time,
            'end_time': datetime.now().isoformat(),
            'success': success,
            **(data or {})
        }
        
        self.record_event(pipeline_id, stage, event_data)
        
        # Update stage metrics
        if stage in self.stage_metrics:
            self.stage_metrics[stage]['active_count'] = max(0, self.stage_metrics[stage]['active_count'] - 1)
            self.stage_metrics[stage]['total_processed'] += 1
            
            # Update average processing time
            current_avg = self.stage_metrics[stage]['avg_processing_time']
            total_processed = self.stage_metrics[stage]['total_processed']
            new_avg = ((current_avg * (total_processed - 1)) + processing_time) / total_processed
            self.stage_metrics[stage]['avg_processing_time'] = new_avg
            
            # Update success rate
            if success:
                current_success_rate = self.stage_metrics[stage]['success_rate']
                new_success_rate = ((current_success_rate * (total_processed - 1)) + 100) / total_processed
                self.stage_metrics[stage]['success_rate'] = new_success_rate
        
        # Broadcast metrics update
        asyncio.create_task(self._broadcast_metrics_update())
    
    async def _broadcast_pipeline_event(self, event_data: Dict[str, Any]):
        """Broadcast a pipeline event to connected clients"""
        try:
            await self.websocket_manager.broadcast({
                'type': 'pipeline_event',
                'timestamp': datetime.now().isoformat(),
                'data': event_data
            })
        except Exception as e:
            logger.error(f"Pipeline event broadcast error: {e}")
    
    async def _broadcast_metrics_update(self):
        """Broadcast metrics update to connected clients"""
        try:
            await self.websocket_manager.broadcast({
                'type': 'stage_metrics_update',
                'timestamp': datetime.now().isoformat(),
                'data': self.stage_metrics
            })
        except Exception as e:
            logger.error(f"Metrics update broadcast error: {e}")
    
    def get_comprehensive_metrics(self) -> Dict[str, Any]:
        """Get comprehensive metrics including all monitoring data"""
        return {
            'pipeline_state': self.current_pipeline_state,
            'stage_metrics': self.stage_metrics,
            'aggregated_metrics': self.aggregated_metrics,
            'service_health': self.service_health,
            'pipeline_history': self.pipeline_history[-100:],  # Last 100 events
            'enhanced_metrics': self.metrics_collector.get_all_metrics()
        }

# Global instance
enhanced_pipeline_monitor = EnhancedPipelineMonitor()
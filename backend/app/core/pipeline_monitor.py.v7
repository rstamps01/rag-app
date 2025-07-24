# Create a new file: app/core/pipeline_monitor.py
import time
import json
import os
from datetime import datetime
import threading
import queue
import uuid
import logging

# Set up logger for this module
logger = logging.getLogger(__name__)

class PipelineMonitor:
    def __init__(self):
        self.events_queue = queue.Queue()
        self.running = False
        self.thread = None
        self.pipeline_events = {}
        
    def start(self):
        """Start the monitoring thread"""
        if self.running:
            return
            
        self.running = True
        self.thread = threading.Thread(target=self._process_events)
        self.thread.daemon = True
        self.thread.start()
        
    def stop(self):
        """Stop the monitoring thread"""
        self.running = False
        if self.thread:
            self.thread.join(timeout=2.0)
            
    def _process_events(self):
        """Process events from the queue"""
        while self.running:
            try:
                event = self.events_queue.get(timeout=1.0)
                self._store_event(event)
                self.events_queue.task_done()
            except queue.Empty:
                continue
            except Exception as e:
                logger.error(f"Error processing pipeline event: {e}")
                
    def _store_event(self, event):
        """Store event in memory and persist to disk"""
        try:
            pipeline_id = event.get('pipeline_id')
            if pipeline_id not in self.pipeline_events:
                self.pipeline_events[pipeline_id] = []
                
            self.pipeline_events[pipeline_id].append(event)
            
            # Persist to disk with error handling
            os.makedirs("logs/pipeline", exist_ok=True)
            with open(f"logs/pipeline/{pipeline_id}.jsonl", "a") as f:
                f.write(json.dumps(event) + "\n")
        except Exception as e:
            logger.warning(f"Failed to store pipeline event: {e}")
            
    def start_pipeline(self, document_id=None, query_id=None):
        """Start tracking a new pipeline execution"""
        pipeline_id = str(uuid.uuid4())
        event = {
            'pipeline_id': pipeline_id,
            'document_id': document_id,
            'query_id': query_id,
            'stage': 'pipeline_start',
            'timestamp': datetime.now().isoformat(),
            'data': {}
        }
        self.events_queue.put(event)
        return pipeline_id
        
    def record_event(self, pipeline_id, stage, data=None):
        """Record a pipeline stage event"""
        if data is None:
            data = {}
            
        event = {
            'pipeline_id': pipeline_id,
            'stage': stage,
            'timestamp': datetime.now().isoformat(),
            'data': data
        }
        self.events_queue.put(event)
        
    def log_document_processed(self, filename, processing_time=None, chunk_count=0, success=True, 
                             metadata=None, error=None, **kwargs):
        """
        Log document processing completion/failure - ADDED METHOD to fix AttributeError
        
        This method matches the usage in document_processor.py:
        - pipeline_monitor.log_document_processed(filename, processing_time, chunk_count, success, metadata, error)
        
        Args:
            filename (str): Name of the processed document
            processing_time (float): Time taken to process the document in seconds
            chunk_count (int): Number of chunks created from the document
            success (bool): Whether processing was successful
            metadata (dict): Additional metadata (includes department info)
            error (str): Error message if processing failed
            **kwargs: Additional keyword arguments for flexibility
        """
        try:
            # Create a unique pipeline ID for this document processing event
            pipeline_id = str(uuid.uuid4())
            
            # Prepare event data
            event_data = {
                'filename': filename,
                'processing_time': processing_time,
                'chunk_count': chunk_count,
                'success': success,
                'timestamp': datetime.now().isoformat()
            }
            
            # Add metadata if provided (includes department info)
            if metadata:
                event_data['metadata'] = metadata
                # Extract department for easier access
                if 'department' in metadata:
                    event_data['department'] = metadata['department']
            
            # Add error information if processing failed
            if not success and error:
                event_data['error'] = error
            
            # Add any additional kwargs
            event_data.update(kwargs)
            
            # Create the pipeline event
            event = {
                'pipeline_id': pipeline_id,
                'stage': 'document_processed',
                'timestamp': datetime.now().isoformat(),
                'data': event_data
            }
            
            # Add to processing queue
            self.events_queue.put(event)
            
            # Also log to standard logger for immediate visibility
            if success:
                dept_info = f" (dept: {metadata.get('department', 'unknown')})" if metadata else ""
                logger.info(f"Document processed successfully: {filename}{dept_info} - "
                          f"{chunk_count} chunks, {processing_time:.2f}s")
            else:
                dept_info = f" (dept: {metadata.get('department', 'unknown')})" if metadata else ""
                logger.error(f"Document processing failed: {filename}{dept_info} - {error}")
                
        except Exception as e:
            # Fail gracefully - don't let logging errors break document processing
            logger.error(f"Failed to log document processing event for {filename}: {e}")

######

    def log_query_processed(self, query, processing_time, sources_count, success=True, error=None, **kwargs):
        """
        Log query processing completion/failure - ADDED METHOD to fix AttributeError
        
        This method matches the usage in query_processor.py:
        - pipeline_monitor.log_query_processed(query, processing_time, sources_count, success, error)
        
        Args:
            query (str): The user query that was processed
            processing_time (float): Time taken to process the query in seconds
            sources_count (int): Number of sources retrieved for the query
            success (bool): Whether query processing was successful
            error (str): Error message if processing failed
            **kwargs: Additional keyword arguments for flexibility
        """
        try:
            # Create a unique pipeline ID for this query processing event
            pipeline_id = str(uuid.uuid4())
            
            # Prepare event data
            event_data = {
                'query': query[:200] + '...' if len(query) > 200 else query,  # Truncate long queries
                'processing_time': processing_time,
                'sources_count': sources_count,
                'success': success,
                'timestamp': datetime.now().isoformat()
            }
            
            # Add error information if processing failed
            if not success and error:
                event_data['error'] = error
            
            # Add any additional kwargs
            event_data.update(kwargs)
            
            # Create the pipeline event
            event = {
                'pipeline_id': pipeline_id,
                'stage': 'query_processed',
                'timestamp': datetime.now().isoformat(),
                'data': event_data
            }
            
            # Add to processing queue
            self.events_queue.put(event)
            
            # Also log to standard logger for immediate visibility
            if success:
                logger.info(f"Query processed successfully: '{query[:50]}...' - "
                        f"{sources_count} sources, {processing_time:.2f}s")
            else:
                logger.error(f"Query processing failed: '{query[:50]}...' - {error}")
                
        except Exception as e:
            # Fail gracefully - don't let logging errors break query processing
            logger.error(f"Failed to log query processing event: {e}")

    def get_query_processing_stats(self):
        """
        Get statistics about query processing - ADDED METHOD for monitoring
        
        Returns:
            dict: Statistics including total processed, success/failure counts, and performance metrics
        """
        stats = {
            'total_processed': 0,
            'successful': 0,
            'failed': 0,
            'total_processing_time': 0.0,
            'total_sources_retrieved': 0,
            'avg_processing_time': 0.0,
            'avg_sources_per_query': 0.0,
            'recent_queries': []
        }
        
        try:
            for pipeline_events in self.pipeline_events.values():
                for event in pipeline_events:
                    if event.get('stage') == 'query_processed':
                        data = event.get('data', {})
                        stats['total_processed'] += 1
                        
                        # Count success/failure
                        if data.get('success', False):
                            stats['successful'] += 1
                        else:
                            stats['failed'] += 1
                        
                        # Accumulate processing metrics
                        processing_time = data.get('processing_time', 0)
                        if processing_time:
                            stats['total_processing_time'] += processing_time
                        
                        sources_count = data.get('sources_count', 0)
                        stats['total_sources_retrieved'] += sources_count
                        
                        # Keep track of recent queries (last 10)
                        query_info = {
                            'query': data.get('query', 'unknown'),
                            'success': data.get('success', False),
                            'timestamp': data.get('timestamp', ''),
                            'sources_count': sources_count,
                            'processing_time': processing_time
                        }
                        stats['recent_queries'].append(query_info)
            
            # Calculate averages
            if stats['total_processed'] > 0:
                stats['avg_processing_time'] = stats['total_processing_time'] / stats['total_processed']
                stats['avg_sources_per_query'] = stats['total_sources_retrieved'] / stats['total_processed']
            
            # Sort recent queries by timestamp (most recent first) and limit to 10
            stats['recent_queries'].sort(key=lambda x: x['timestamp'], reverse=True)
            stats['recent_queries'] = stats['recent_queries'][:10]
            
        except Exception as e:
            logger.error(f"Error calculating query processing stats: {e}")
        
        return stats

###### Added above on 7/22/25 ######

    def get_pipeline_events(self, pipeline_id):
        """Get all events for a specific pipeline"""
        return self.pipeline_events.get(pipeline_id, [])
        
    def get_active_pipelines(self):
        """Get list of active pipelines"""
        return list(self.pipeline_events.keys())
        
    def get_document_processing_stats(self):
        """
        Get statistics about document processing - ADDED METHOD for monitoring
        
        Returns:
            dict: Statistics including total processed, success/failure counts, and department breakdown
        """
        stats = {
            'total_processed': 0,
            'successful': 0,
            'failed': 0,
            'total_processing_time': 0.0,
            'total_chunks': 0,
            'by_department': {},
            'recent_documents': []
        }
        
        try:
            for pipeline_events in self.pipeline_events.values():
                for event in pipeline_events:
                    if event.get('stage') == 'document_processed':
                        data = event.get('data', {})
                        stats['total_processed'] += 1
                        
                        # Count success/failure
                        if data.get('success', False):
                            stats['successful'] += 1
                        else:
                            stats['failed'] += 1
                        
                        # Accumulate processing metrics
                        processing_time = data.get('processing_time', 0)
                        if processing_time:
                            stats['total_processing_time'] += processing_time
                        
                        chunk_count = data.get('chunk_count', 0)
                        stats['total_chunks'] += chunk_count
                        
                        # Department breakdown
                        department = data.get('department', 'unknown')
                        if department not in stats['by_department']:
                            stats['by_department'][department] = {
                                'successful': 0, 
                                'failed': 0, 
                                'total_chunks': 0,
                                'total_processing_time': 0.0
                            }
                        
                        dept_stats = stats['by_department'][department]
                        if data.get('success', False):
                            dept_stats['successful'] += 1
                        else:
                            dept_stats['failed'] += 1
                        
                        dept_stats['total_chunks'] += chunk_count
                        if processing_time:
                            dept_stats['total_processing_time'] += processing_time
                        
                        # Keep track of recent documents (last 10)
                        doc_info = {
                            'filename': data.get('filename', 'unknown'),
                            'department': department,
                            'success': data.get('success', False),
                            'timestamp': data.get('timestamp', ''),
                            'chunk_count': chunk_count,
                            'processing_time': processing_time
                        }
                        stats['recent_documents'].append(doc_info)
            
            # Sort recent documents by timestamp (most recent first) and limit to 10
            stats['recent_documents'].sort(key=lambda x: x['timestamp'], reverse=True)
            stats['recent_documents'] = stats['recent_documents'][:10]
            
        except Exception as e:
            logger.error(f"Error calculating document processing stats: {e}")
        
        return stats
        
    def get_processing_health(self):
        """
        Get health metrics for document processing - ADDED METHOD for health checks
        
        Returns:
            dict: Health status and metrics
        """
        try:
            stats = self.get_document_processing_stats()
            
            total = stats['total_processed']
            if total == 0:
                return {
                    'status': 'healthy',
                    'message': 'No documents processed yet',
                    'success_rate': 0.0,
                    'avg_processing_time': 0.0,
                    'avg_chunks_per_doc': 0.0
                }
            
            success_rate = (stats['successful'] / total) * 100
            avg_processing_time = stats['total_processing_time'] / total if total > 0 else 0
            avg_chunks = stats['total_chunks'] / total if total > 0 else 0
            
            # Determine health status
            if success_rate >= 90:
                status = 'healthy'
                message = 'Document processing is performing well'
            elif success_rate >= 70:
                status = 'warning'
                message = 'Document processing has some failures'
            else:
                status = 'critical'
                message = 'Document processing is experiencing significant failures'
            
            return {
                'status': status,
                'message': message,
                'success_rate': round(success_rate, 2),
                'total_processed': total,
                'successful': stats['successful'],
                'failed': stats['failed'],
                'avg_processing_time': round(avg_processing_time, 2),
                'avg_chunks_per_doc': round(avg_chunks, 1),
                'departments': list(stats['by_department'].keys())
            }
            
        except Exception as e:
            logger.error(f"Error calculating processing health: {e}")
            return {
                'status': 'error',
                'message': f'Error calculating health metrics: {e}',
                'success_rate': 0.0,
                'avg_processing_time': 0.0,
                'avg_chunks_per_doc': 0.0
            }

# Create a singleton instance
pipeline_monitor = PipelineMonitor()
pipeline_monitor.start()

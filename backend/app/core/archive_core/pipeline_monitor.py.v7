# Create a new file: app/core/pipeline_monitor.py
import time
import json
import os
from datetime import datetime
import threading
import queue
import uuid

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
                
    def _store_event(self, event):
        """Store event in memory and persist to disk"""
        pipeline_id = event.get('pipeline_id')
        if pipeline_id not in self.pipeline_events:
            self.pipeline_events[pipeline_id] = []
            
        self.pipeline_events[pipeline_id].append(event)
        
        # Persist to disk
        os.makedirs("logs/pipeline", exist_ok=True)
        with open(f"logs/pipeline/{pipeline_id}.jsonl", "a") as f:
            f.write(json.dumps(event) + "\n")
            
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
        
    def get_pipeline_events(self, pipeline_id):
        """Get all events for a specific pipeline"""
        return self.pipeline_events.get(pipeline_id, [])
        
    def get_active_pipelines(self):
        """Get list of active pipelines"""
        return list(self.pipeline_events.keys())

# Create a singleton instance
pipeline_monitor = PipelineMonitor()
pipeline_monitor.start()


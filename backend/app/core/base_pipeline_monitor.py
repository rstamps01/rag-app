"""
Base Pipeline Monitor - Core logging functionality
Provides file-based logging for pipeline events
"""

import os
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
from pathlib import Path

logger = logging.getLogger(__name__)

class PipelineMonitor:
    """
    Base pipeline monitor that logs events to JSONL files
    """
    
    def __init__(self, logs_dir: str = "/app/data/logs/pipeline"):
        self.logs_dir = logs_dir
        self.in_memory_events = {}  # Store events in memory as backup
        
        # Ensure logs directory exists
        Path(self.logs_dir).mkdir(parents=True, exist_ok=True)
        
        logger.info(f"PipelineMonitor initialized with logs_dir: {self.logs_dir}")
    
    def record_event(self, pipeline_id: str, stage: str, data: Optional[Dict[str, Any]] = None):
        """
        Record a pipeline event to both file and memory
        
        Args:
            pipeline_id: Unique identifier for the pipeline execution
            stage: Pipeline stage name
            data: Additional event data
        """
        event = {
            'pipeline_id': pipeline_id,
            'stage': stage,
            'timestamp': datetime.now().isoformat(),
            'data': data or {}
        }
        
        # Store in memory
        if pipeline_id not in self.in_memory_events:
            self.in_memory_events[pipeline_id] = []
        self.in_memory_events[pipeline_id].append(event)
        
        # Write to file
        self._write_event_to_file(pipeline_id, event)
        
        logger.debug(f"Recorded event for pipeline {pipeline_id}, stage {stage}")
    
    def get_pipeline_events(self, pipeline_id: str) -> List[Dict[str, Any]]:
        """
        Get all events for a specific pipeline
        
        Args:
            pipeline_id: Pipeline identifier
            
        Returns:
            List of events for the pipeline
        """
        # Try to get from memory first
        if pipeline_id in self.in_memory_events:
            return self.in_memory_events[pipeline_id]
        
        # Try to read from file
        return self._read_events_from_file(pipeline_id)
    
    def _write_event_to_file(self, pipeline_id: str, event: Dict[str, Any]):
        """Write event to JSONL file"""
        try:
            log_file_path = os.path.join(self.logs_dir, f"{pipeline_id}.jsonl")
            
            with open(log_file_path, 'a') as f:
                f.write(json.dumps(event) + '\n')
                
        except Exception as e:
            logger.error(f"Failed to write event to file: {e}")
    
    def _read_events_from_file(self, pipeline_id: str) -> List[Dict[str, Any]]:
        """Read events from JSONL file"""
        events = []
        try:
            log_file_path = os.path.join(self.logs_dir, f"{pipeline_id}.jsonl")
            
            if os.path.exists(log_file_path):
                with open(log_file_path, 'r') as f:
                    for line in f:
                        if line.strip():
                            events.append(json.loads(line))
                            
        except Exception as e:
            logger.error(f"Failed to read events from file: {e}")
        
        return events

# Global pipeline monitor instance
pipeline_monitor = PipelineMonitor()


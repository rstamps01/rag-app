from fastapi import APIRouter, HTTPException, Request
from app.core.base_pipeline_monitor import pipeline_monitor
import os
import json
from datetime import datetime, timedelta
import logging
from typing import Dict, List, Any, Optional
import traceback

router = APIRouter()
logger = logging.getLogger(__name__)

# Configuration
LOGS_DIR = "/app/data/logs/pipeline"

@router.get("/pipelines")
async def get_pipelines():
    """
    Get list of all pipeline IDs that have logged events.
    
    Returns:
        dict: Dictionary containing list of pipeline IDs and metadata
    """
    active_pipelines = []
    
    # Create logs directory if it doesn't exist
    try:
        os.makedirs(LOGS_DIR, exist_ok=True)
    except Exception as e:
        logger.error(f"Failed to create logs directory {LOGS_DIR}: {e}", exc_info=True)
        return {"pipelines": [], "error": "Failed to access logs directory"}
    
    try:
        # Get all pipeline log files
        pipeline_files = []
        for filename in os.listdir(LOGS_DIR):
            if filename.endswith(".jsonl"):
                pipeline_id = filename[:-6]  # Remove .jsonl extension
                file_path = os.path.join(LOGS_DIR, filename)
                file_stat = os.stat(file_path)
                pipeline_files.append({
                    "id": pipeline_id,
                    "modified_time": file_stat.st_mtime,
                    "file_path": file_path
                })
        
        # Sort by modified time (newest first)
        pipeline_files.sort(key=lambda x: x["modified_time"], reverse=True)
        
        # Process each pipeline file to extract metadata
        for pipeline_file in pipeline_files:
            pipeline_id = pipeline_file["id"]
            file_path = pipeline_file["file_path"]
            
            # Extract basic metadata from the file
            pipeline_type = "unknown"
            timestamp = None
            status = "unknown"
            
            try:
                with open(file_path, "r") as f:
                    first_line = None
                    last_line = None
                    
                    # Read first line
                    for line in f:
                        if line.strip():
                            first_line = json.loads(line)
                            break
                    
                    # Read last line (seek to end and read backwards)
                    f.seek(0, os.SEEK_END)
                    pos = f.tell() - 2
                    
                    # Read backwards until we find a newline or reach the beginning
                    while pos > 0 and f.read(1) != "\n":
                        pos -= 1
                        f.seek(pos, os.SEEK_SET)
                    
                    if pos > 0:
                        last_line = json.loads(f.readline())
                    
                    # Determine pipeline type and status
                    if first_line:
                        if "document_id" in first_line:
                            pipeline_type = "document"
                        elif "query_id" in first_line:
                            pipeline_type = "query"
                        
                        timestamp = first_line.get("timestamp")
                    
                    if last_line and "data" in last_line:
                        if "status" in last_line["data"]:
                            status = last_line["data"]["status"]
            
            except Exception as e:
                logger.warning(f"Error reading pipeline file {file_path}: {e}")
                # Continue to next file
            
            # Add pipeline to list
            active_pipelines.append({
                "id": pipeline_id,
                "type": pipeline_type,
                "timestamp": timestamp,
                "status": status
            })
    
    except Exception as e:
        logger.error(f"Error listing pipeline log files: {e}", exc_info=True)
        return {"pipelines": [], "error": str(e)}
    
    return {"pipelines": active_pipelines}

@router.get("/pipelines/{pipeline_id}")
async def get_pipeline_details(pipeline_id: str):
    """
    Get all events for a specific pipeline from its log file.
    
    Args:
        pipeline_id: Unique identifier for the pipeline
        
    Returns:
        dict: Dictionary containing pipeline events and metadata
    """
    events = []
    metadata = {
        "id": pipeline_id,
        "type": "unknown",
        "start_time": None,
        "end_time": None,
        "duration_ms": None,
        "status": "unknown"
    }
    
    # Create logs directory if it doesn't exist
    try:
        os.makedirs(LOGS_DIR, exist_ok=True)
    except Exception as e:
        logger.error(f"Failed to create logs directory {LOGS_DIR}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to access logs directory")
    
    log_file_path = os.path.join(LOGS_DIR, f"{pipeline_id}.jsonl")
    
    # Check if log file exists
    if not os.path.exists(log_file_path):
        # Fallback to in-memory if log file not found
        logger.warning(f"Log file {log_file_path} not found for pipeline {pipeline_id}. Trying in-memory events.")
        in_memory_events = pipeline_monitor.get_pipeline_events(pipeline_id)
        
        if not in_memory_events:
            raise HTTPException(status_code=404, detail=f"Pipeline {pipeline_id} not found in logs or memory.")
        
        # Extract metadata from in-memory events
        if in_memory_events:
            first_event = in_memory_events[0]
            if "document_id" in first_event:
                metadata["type"] = "document"
            elif "query_id" in first_event:
                metadata["type"] = "query"
            
            metadata["start_time"] = first_event.get("timestamp")
            
            # Look for overall status in events
            for event in reversed(in_memory_events):
                if event.get("stage", "").startswith("Overall"):
                    if "data" in event and "status" in event["data"]:
                        metadata["status"] = event["data"]["status"]
                    metadata["end_time"] = event.get("timestamp")
                    break
        
        return {"events": in_memory_events, "metadata": metadata}

    try:
        # Read events from log file
        with open(log_file_path, "r") as f:
            for line in f:
                if line.strip():
                    try:
                        event = json.loads(line)
                        events.append(event)
                    except json.JSONDecodeError:
                        logger.warning(f"Invalid JSON in pipeline log: {line}")
        
        # Extract metadata from events
        if events:
            first_event = events[0]
            if "document_id" in first_event:
                metadata["type"] = "document"
            elif "query_id" in first_event:
                metadata["type"] = "query"
            
            metadata["start_time"] = first_event.get("timestamp")
            
            # Parse timestamps and calculate duration
            try:
                start_time = datetime.fromisoformat(metadata["start_time"])
                
                # Look for overall status in events
                for event in reversed(events):
                    if event.get("stage", "").startswith("Overall"):
                        if "data" in event and "status" in event["data"]:
                            metadata["status"] = event["data"]["status"]
                        metadata["end_time"] = event.get("timestamp")
                        
                        if metadata["end_time"]:
                            end_time = datetime.fromisoformat(metadata["end_time"])
                            duration = (end_time - start_time).total_seconds() * 1000
                            metadata["duration_ms"] = round(duration, 2)
                        break
            except (ValueError, TypeError):
                logger.warning(f"Could not parse timestamps for pipeline {pipeline_id}")
    
    except Exception as e:
        logger.error(f"Error reading log file {log_file_path} for pipeline {pipeline_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Could not read events for pipeline {pipeline_id}: {str(e)}")
    
    if not events:
        # If log file was empty, try in-memory as a last resort
        in_memory_events = pipeline_monitor.get_pipeline_events(pipeline_id)
        
        if not in_memory_events:
            logger.warning(f"Pipeline {pipeline_id} log file was empty and no in-memory events found.")
            # Return empty list instead of 404 if file exists but is empty
            return {"events": [], "metadata": metadata}
        
        return {"events": in_memory_events, "metadata": metadata}
    
    return {"events": events, "metadata": metadata}

@router.get("/stats")
async def get_pipeline_stats(request: Request):
    """
    Get aggregated pipeline statistics from log files.
    
    Returns:
        dict: Dictionary containing pipeline statistics
    """
    stats = {
        "total_documents": 0,
        "documents_24h": 0,
        "documents_7d": 0,
        "total_queries": 0,
        "queries_24h": 0,
        "queries_7d": 0,
        "avg_doc_processing_time_ms": 0,
        "avg_query_processing_time_ms": 0,
        "errors_total": 0,
        "errors_24h": 0,
        "errors_7d": 0,
        "success_rate": 0,
        "timestamp": datetime.now().isoformat()
    }
    
    # Additional statistics
    doc_processing_times = []
    query_processing_times = []
    success_count = 0
    total_count = 0
    
    # Time ranges
    now = datetime.now()
    one_day_ago = now - timedelta(days=1)
    seven_days_ago = now - timedelta(days=7)
    
    # Create logs directory if it doesn't exist
    try:
        os.makedirs(LOGS_DIR, exist_ok=True)
    except Exception as e:
        logger.error(f"Failed to create logs directory {LOGS_DIR}: {e}", exc_info=True)
        return {"stats": stats, "error": "Failed to access logs directory"}
    
    if not os.path.exists(LOGS_DIR):
        logger.warning(f"Logs directory {LOGS_DIR} not found. Returning zeroed stats.")
        return {"stats": stats}
    
    # Track processed pipelines to avoid double counting
    processed_pipeline_ids = set()
    
    try:
        # Process each log file
        for filename in os.listdir(LOGS_DIR):
            if not filename.endswith(".jsonl"):
                continue
            
            pipeline_id = filename[:-6]
            log_file_path = os.path.join(LOGS_DIR, filename)
            
            # Skip if already processed
            if pipeline_id in processed_pipeline_ids:
                continue
            
            # Pipeline metadata
            is_doc_pipeline = False
            is_query_pipeline = False
            pipeline_timestamp = None
            processing_time = None
            has_error = False
            pipeline_status = None
            
            try:
                with open(log_file_path, "r") as f:
                    first_event = None
                    events = []
                    
                    # Read all events
                    for line in f:
                        if not line.strip():
                            continue
                        
                        try:
                            event = json.loads(line)
                            events.append(event)
                            
                            if not first_event:
                                first_event = event
                        except json.JSONDecodeError:
                            logger.warning(f"Invalid JSON in pipeline log: {line}")
                    
                    # Determine pipeline type from first event
                    if first_event:
                        if "document_id" in first_event:
                            is_doc_pipeline = True
                        elif "query_id" in first_event:
                            is_query_pipeline = True
                    
                    # Process events to extract metadata
                    for event in events:
                        event_ts_str = event.get("timestamp")
                        event_timestamp = None
                        
                        if event_ts_str:
                            try:
                                event_timestamp = datetime.fromisoformat(event_ts_str)
                            except ValueError:
                                logger.warning(f"Could not parse timestamp {event_ts_str} in {filename}")
                                continue
                        
                        # Extract overall status and processing time
                        if event.get("stage") == "Overall Document Processing" or event.get("stage") == "Overall Query Processing":
                            pipeline_status = event.get("data", {}).get("status")
                            pipeline_timestamp = event_timestamp
                            
                            if pipeline_status == "success":
                                processing_time = event.get("data", {}).get("total_processing_time_ms")
                            elif pipeline_status == "error":
                                has_error = True
                        
                        # Count errors in any stage
                        if event.get("data", {}).get("status") == "error" and event_timestamp:
                            stats["errors_total"] += 1
                            
                            if event_timestamp > one_day_ago:
                                stats["errors_24h"] += 1
                            
                            if event_timestamp > seven_days_ago:
                                stats["errors_7d"] += 1
            
            except Exception as e:
                logger.error(f"Error processing log file {log_file_path}: {e}", exc_info=True)
                continue
            
            # Skip if no timestamp (can't categorize by time period)
            if not pipeline_timestamp:
                continue
            
            # Mark as processed
            processed_pipeline_ids.add(pipeline_id)
            total_count += 1
            
            # Update statistics based on pipeline type and status
            if is_doc_pipeline:
                stats["total_documents"] += 1
                
                if pipeline_timestamp > one_day_ago:
                    stats["documents_24h"] += 1
                
                if pipeline_timestamp > seven_days_ago:
                    stats["documents_7d"] += 1
                
                if processing_time and processing_time > 0:
                    doc_processing_times.append(processing_time)
            
            elif is_query_pipeline:
                stats["total_queries"] += 1
                
                if pipeline_timestamp > one_day_ago:
                    stats["queries_24h"] += 1
                
                if pipeline_timestamp > seven_days_ago:
                    stats["queries_7d"] += 1
                
                if processing_time and processing_time > 0:
                    query_processing_times.append(processing_time)
            
            # Count successful pipelines
            if pipeline_status == "success":
                success_count += 1
        
        # Calculate averages
        if doc_processing_times:
            stats["avg_doc_processing_time_ms"] = round(sum(doc_processing_times) / len(doc_processing_times), 2)
        
        if query_processing_times:
            stats["avg_query_processing_time_ms"] = round(sum(query_processing_times) / len(query_processing_times), 2)
        
        # Calculate success rate
        if total_count > 0:
            stats["success_rate"] = round((success_count / total_count) * 100, 2)
    
    except Exception as e:
        error_details = traceback.format_exc()
        logger.error(f"Failed to calculate pipeline stats: {e}\n{error_details}")
        return {"stats": stats, "error": str(e)}
    
    return {"stats": stats}

@router.get("/health")
async def monitoring_health():
    """
    Health check endpoint for the monitoring subsystem.
    
    Returns:
        dict: Dictionary containing health status
    """
    try:
        # Check if logs directory exists and is writable
        os.makedirs(LOGS_DIR, exist_ok=True)
        test_file_path = os.path.join(LOGS_DIR, "health_check.tmp")
        
        with open(test_file_path, "w") as f:
            f.write("health check")
        
        os.remove(test_file_path)
        
        return {
            "status": "healthy",
            "logs_dir": LOGS_DIR,
            "timestamp": datetime.now().isoformat()
        }
    
    except Exception as e:
        logger.error(f"Monitoring health check failed: {e}", exc_info=True)
        
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

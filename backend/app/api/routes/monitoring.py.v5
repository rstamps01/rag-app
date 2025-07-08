# In app/api/routes/monitoring.py
from fastapi import APIRouter, HTTPException
from app.core.pipeline_monitor import pipeline_monitor
import os
import json
from datetime import datetime, timedelta
from collections import defaultdict
import logging

router = APIRouter()
logger = logging.getLogger(__name__)

LOGS_DIR = "logs/pipeline"

@router.get("/api/monitoring/pipelines")
async def get_pipelines_ids(): # Renamed to avoid conflict with the module name
    """Get list of all pipeline IDs that have logged events."""
    active_pipelines = set() # Use a set to store unique pipeline_ids
    if not os.path.exists(LOGS_DIR):
        logger.warning(f"Logs directory {LOGS_DIR} not found. Returning empty list of pipelines.")
        return {"pipelines": []}
    try:
        for filename in os.listdir(LOGS_DIR):
            if filename.endswith(".jsonl"):
                pipeline_id = filename[:-6] # Remove .jsonl extension
                active_pipelines.add(pipeline_id)
    except Exception as e:
        logger.error(f"Error listing pipeline log files: {e}", exc_info=True)
        return {"pipelines": []}
    return {"pipelines": sorted(list(active_pipelines), reverse=True)} # Return sorted, newest first potentially

@router.get("/api/monitoring/pipelines/{pipeline_id}")
async def get_pipeline_events(pipeline_id: str):
    """Get all events for a specific pipeline from its log file."""
    events = []
    log_file_path = os.path.join(LOGS_DIR, f"{pipeline_id}.jsonl")
    if not os.path.exists(log_file_path):
        # Fallback to in-memory if log file not found (e.g., very new pipeline)
        logger.warning(f"Log file {log_file_path} not found for pipeline {pipeline_id}. Trying in-memory events.")
        in_memory_events = pipeline_monitor.get_pipeline_events(pipeline_id)
        if not in_memory_events:
            raise HTTPException(status_code=404, detail=f"Pipeline {pipeline_id} not found in logs or memory.")
        return {"events": in_memory_events}

    try:
        with open(log_file_path, "r") as f:
            for line in f:
                if line.strip():
                    events.append(json.loads(line))
    except Exception as e:
        logger.error(f"Error reading log file {log_file_path} for pipeline {pipeline_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Could not read events for pipeline {pipeline_id}.")
    
    if not events:
        # If log file was empty, try in-memory as a last resort
        in_memory_events = pipeline_monitor.get_pipeline_events(pipeline_id)
        if not in_memory_events:
            logger.warning(f"Pipeline {pipeline_id} log file was empty and no in-memory events found.")
            # Return empty list instead of 404 if file exists but is empty, UI might expect this
            # raise HTTPException(status_code=404, detail=f"Pipeline {pipeline_id} has no events.") 
        return {"events": in_memory_events}
        
    return {"events": events}

@router.get("/api/monitoring/stats")
async def get_pipeline_stats():
    """Get aggregated pipeline statistics from log files."""
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
        "errors_7d": 0
    }
    
    doc_processing_times = []
    query_processing_times = []
    
    now = datetime.now()
    one_day_ago = now - timedelta(days=1)
    seven_days_ago = now - timedelta(days=7)

    if not os.path.exists(LOGS_DIR):
        logger.warning(f"Logs directory {LOGS_DIR} not found. Returning zeroed stats.")
        return {"stats": stats}

    processed_pipeline_ids = set() # To avoid double counting if a pipeline has multiple overall events

    try:
        for filename in os.listdir(LOGS_DIR):
            if not filename.endswith(".jsonl"):
                continue
            
            pipeline_id_from_file = filename[:-6]
            log_file_path = os.path.join(LOGS_DIR, filename)
            
            is_doc_pipeline = False
            is_query_pipeline = False
            pipeline_final_event_data = None
            pipeline_timestamp = None
            has_error_event = False

            try:
                with open(log_file_path, "r") as f:
                    for line in f:
                        if not line.strip():
                            continue
                        event = json.loads(line)
                        event_ts_str = event.get("timestamp")
                        event_timestamp = None
                        if event_ts_str:
                            try:
                                event_timestamp = datetime.fromisoformat(event_ts_str)
                            except ValueError:
                                logger.warning(f"Could not parse timestamp {event_ts_str} in {filename}")
                                continue
                        
                        if event.get("stage") == "Overall Document Processing":
                            is_doc_pipeline = True
                            if event.get("data", {}).get("status") == "success":
                                pipeline_final_event_data = event.get("data")
                                pipeline_timestamp = event_timestamp
                            elif event.get("data", {}).get("status") == "error":
                                has_error_event = True 
                                pipeline_timestamp = event_timestamp # Use timestamp of error for counting errors by period

                        elif event.get("stage") == "Overall Query Processing":
                            is_query_pipeline = True
                            if event.get("data", {}).get("status") == "success":
                                pipeline_final_event_data = event.get("data")
                                pipeline_timestamp = event_timestamp
                            elif event.get("data", {}).get("status") == "error":
                                has_error_event = True
                                pipeline_timestamp = event_timestamp
                        
                        # General error counting for any stage
                        if event.get("data", {}).get("status") == "error" and event_timestamp:
                            stats["errors_total"] += 1
                            if event_timestamp > one_day_ago:
                                stats["errors_24h"] += 1
                            if event_timestamp > seven_days_ago:
                                stats["errors_7d"] += 1

            except Exception as e:
                logger.error(f"Error processing log file {log_file_path}: {e}", exc_info=True)
                continue # Skip this file

            if pipeline_id_from_file in processed_pipeline_ids:
                continue
            
            if pipeline_final_event_data and pipeline_timestamp: # Successful pipeline
                processed_pipeline_ids.add(pipeline_id_from_file)
                processing_time = pipeline_final_event_data.get("total_processing_time_ms", 0)
                if is_doc_pipeline:
                    stats["total_documents"] += 1
                    if processing_time > 0: doc_processing_times.append(processing_time)
                    if pipeline_timestamp > one_day_ago:
                        stats["documents_24h"] += 1
                    if pipeline_timestamp > seven_days_ago:
                        stats["documents_7d"] += 1
                elif is_query_pipeline:
                    stats["total_queries"] += 1
                    if processing_time > 0: query_processing_times.append(processing_time)
                    if pipeline_timestamp > one_day_ago:
                        stats["queries_24h"] += 1
                    if pipeline_timestamp > seven_days_ago:
                        stats["queries_7d"] += 1
            elif has_error_event and pipeline_timestamp: # Pipeline had an error, already counted by general error counter
                processed_pipeline_ids.add(pipeline_id_from_file)
                # Optionally, you could count total errored pipelines here if needed
                pass 

        if doc_processing_times:
            stats["avg_doc_processing_time_ms"] = sum(doc_processing_times) / len(doc_processing_times)
        if query_processing_times:
            stats["avg_query_processing_time_ms"] = sum(query_processing_times) / len(query_processing_times)
            
    except Exception as e:
        logger.error(f"Failed to calculate pipeline stats: {e}", exc_info=True)
        # Return zeroed or partially filled stats in case of error

    return {"stats": stats}



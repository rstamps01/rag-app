"""
Enhanced Metrics API Endpoints
Provides comprehensive metrics collection and monitoring endpoints
"""

from fastapi import APIRouter, HTTPException, Depends
from typing import Dict, Any, Optional
import logging
from app.services.enhanced_metrics_collector import enhanced_metrics_collector
from app.core.enhanced_pipeline_monitor import enhanced_pipeline_monitor

logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/metrics/comprehensive")
async def get_comprehensive_metrics():
    """
    Get comprehensive metrics including Qdrant, PostgreSQL, Pipeline, and Connection Status
    """
    try:
        # Get all metrics from the enhanced collector
        all_metrics = enhanced_metrics_collector.get_all_metrics()
        
        # Get pipeline metrics
        pipeline_metrics = enhanced_pipeline_monitor.get_comprehensive_metrics()
        
        # Combine all metrics
        comprehensive_metrics = {
            "timestamp": enhanced_metrics_collector.connection_metrics.last_health_check.isoformat() if enhanced_metrics_collector.connection_metrics.last_health_check else None,
            "qdrant_metrics": all_metrics["qdrant_metrics"],
            "postgres_metrics": all_metrics["postgres_metrics"],
            "pipeline_metrics": all_metrics["pipeline_metrics"],
            "connection_metrics": all_metrics["connection_metrics"],
            "system_metrics": all_metrics["system_metrics"],
            "pipeline_state": pipeline_metrics["pipeline_state"],
            "stage_metrics": pipeline_metrics["stage_metrics"],
            "aggregated_metrics": pipeline_metrics["aggregated_metrics"],
            "service_health": pipeline_metrics["service_health"]
        }
        
        return comprehensive_metrics
        
    except Exception as e:
        logger.error(f"Failed to get comprehensive metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get comprehensive metrics: {str(e)}")

@router.get("/metrics/qdrant")
async def get_qdrant_metrics():
    """
    Get Qdrant-specific metrics
    """
    try:
        metrics = enhanced_metrics_collector.get_all_metrics()
        return {
            "timestamp": enhanced_metrics_collector.qdrant_metrics.last_health_check.isoformat() if enhanced_metrics_collector.qdrant_metrics.last_health_check else None,
            "metrics": metrics["qdrant_metrics"]
        }
    except Exception as e:
        logger.error(f"Failed to get Qdrant metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get Qdrant metrics: {str(e)}")

@router.get("/metrics/postgres")
async def get_postgres_metrics():
    """
    Get PostgreSQL-specific metrics
    """
    try:
        metrics = enhanced_metrics_collector.get_all_metrics()
        return {
            "timestamp": enhanced_metrics_collector.postgres_metrics.last_health_check.isoformat() if enhanced_metrics_collector.postgres_metrics.last_health_check else None,
            "metrics": metrics["postgres_metrics"]
        }
    except Exception as e:
        logger.error(f"Failed to get PostgreSQL metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get PostgreSQL metrics: {str(e)}")

@router.get("/metrics/pipeline")
async def get_pipeline_metrics():
    """
    Get pipeline-specific metrics
    """
    try:
        metrics = enhanced_metrics_collector.get_all_metrics()
        pipeline_metrics = enhanced_pipeline_monitor.get_comprehensive_metrics()
        
        return {
            "timestamp": enhanced_metrics_collector.pipeline_metrics.last_health_check.isoformat() if enhanced_metrics_collector.pipeline_metrics.last_health_check else None,
            "metrics": metrics["pipeline_metrics"],
            "pipeline_state": pipeline_metrics["pipeline_state"],
            "stage_metrics": pipeline_metrics["stage_metrics"],
            "aggregated_metrics": pipeline_metrics["aggregated_metrics"]
        }
    except Exception as e:
        logger.error(f"Failed to get pipeline metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get pipeline metrics: {str(e)}")

@router.get("/metrics/connection-status")
async def get_connection_status():
    """
    Get connection status for all services
    """
    try:
        metrics = enhanced_metrics_collector.get_all_metrics()
        return {
            "timestamp": enhanced_metrics_collector.connection_metrics.last_health_check.isoformat() if enhanced_metrics_collector.connection_metrics.last_health_check else None,
            "connection_status": metrics["connection_metrics"]
        }
    except Exception as e:
        logger.error(f"Failed to get connection status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get connection status: {str(e)}")

@router.get("/metrics/system")
async def get_system_metrics():
    """
    Get system-level metrics (CPU, Memory, Disk, Network)
    """
    try:
        metrics = enhanced_metrics_collector.get_all_metrics()
        return {
            "timestamp": enhanced_metrics_collector.connection_metrics.last_health_check.isoformat() if enhanced_metrics_collector.connection_metrics.last_health_check else None,
            "system_metrics": metrics["system_metrics"]
        }
    except Exception as e:
        logger.error(f"Failed to get system metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get system metrics: {str(e)}")

@router.get("/metrics/health")
async def get_health_status():
    """
    Get overall health status of all services
    """
    try:
        metrics = enhanced_metrics_collector.get_all_metrics()
        pipeline_metrics = enhanced_pipeline_monitor.get_comprehensive_metrics()
        
        # Determine overall health
        services = [
            metrics["connection_metrics"]["backend_status"],
            metrics["connection_metrics"]["database_status"],
            metrics["connection_metrics"]["vector_db_status"],
            metrics["connection_metrics"]["llm_service_status"]
        ]
        
        healthy_services = sum(1 for status in services if status == "connected")
        total_services = len(services)
        
        overall_health = "healthy" if healthy_services == total_services else "degraded" if healthy_services > 0 else "unhealthy"
        
        return {
            "timestamp": enhanced_metrics_collector.connection_metrics.last_health_check.isoformat() if enhanced_metrics_collector.connection_metrics.last_health_check else None,
            "overall_health": overall_health,
            "healthy_services": healthy_services,
            "total_services": total_services,
            "service_health": pipeline_metrics["service_health"],
            "connection_metrics": metrics["connection_metrics"]
        }
    except Exception as e:
        logger.error(f"Failed to get health status: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get health status: {str(e)}")

@router.get("/metrics/rag-quality")
async def get_rag_quality_metrics():
    """
    Get RAG-specific quality metrics (Phase 1 implementation)
    """
    try:
        # This would be implemented with actual RAG quality metrics
        # For now, return placeholder structure
        return {
            "timestamp": enhanced_metrics_collector.connection_metrics.last_health_check.isoformat() if enhanced_metrics_collector.connection_metrics.last_health_check else None,
            "retrieval_accuracy": 0.0,
            "response_quality_score": 0.0,
            "context_relevance_score": 0.0,
            "embedding_quality_score": 0.0,
            "user_satisfaction_score": 0.0,
            "response_coherence": 0.0,
            "factual_accuracy": 0.0,
            "source_attribution_accuracy": 0.0
        }
    except Exception as e:
        logger.error(f"Failed to get RAG quality metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get RAG quality metrics: {str(e)}")

@router.get("/metrics/trends")
async def get_trend_metrics():
    """
    Get trend analysis metrics (Phase 2 implementation)
    """
    try:
        # This would be implemented with actual trend analysis
        # For now, return placeholder structure
        return {
            "timestamp": enhanced_metrics_collector.connection_metrics.last_health_check.isoformat() if enhanced_metrics_collector.connection_metrics.last_health_check else None,
            "performance_trends": {
                "query_response_time_trend": "stable",
                "document_processing_time_trend": "stable",
                "system_resource_trend": "stable",
                "error_rate_trend": "stable"
            },
            "capacity_planning": {
                "predicted_cpu_usage": 0.0,
                "predicted_memory_usage": 0.0,
                "predicted_storage_usage": 0.0,
                "scaling_recommendations": []
            },
            "anomaly_detection": {
                "anomalies_detected": 0,
                "anomaly_severity": "none",
                "anomaly_details": []
            }
        }
    except Exception as e:
        logger.error(f"Failed to get trend metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get trend metrics: {str(e)}")

@router.get("/metrics/business")
async def get_business_metrics():
    """
    Get business-specific KPIs (Phase 3 implementation)
    """
    try:
        # This would be implemented with actual business metrics
        # For now, return placeholder structure
        return {
            "timestamp": enhanced_metrics_collector.connection_metrics.last_health_check.isoformat() if enhanced_metrics_collector.connection_metrics.last_health_check else None,
            "user_behavior": {
                "active_users": 0,
                "queries_per_user": 0.0,
                "documents_per_user": 0.0,
                "session_duration": 0.0
            },
            "content_performance": {
                "most_queried_documents": [],
                "document_utilization_rate": 0.0,
                "content_freshness_score": 0.0
            },
            "roi_metrics": {
                "cost_per_query": 0.0,
                "cost_per_document": 0.0,
                "value_generated": 0.0,
                "efficiency_score": 0.0
            }
        }
    except Exception as e:
        logger.error(f"Failed to get business metrics: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get business metrics: {str(e)}")

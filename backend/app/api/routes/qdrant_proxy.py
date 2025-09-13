"""
Qdrant Proxy API Routes
Provides secure access to Qdrant APIs with CORS support and authentication
"""

from fastapi import APIRouter, HTTPException, Depends, Query
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any, List
import httpx
import os
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/qdrant", tags=["qdrant-proxy"])

# Qdrant configuration
QDRANT_URL = os.getenv("QDRANT_URL", "http://qdrant-07:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", None)
DEFAULT_COLLECTION = os.getenv("QDRANT_COLLECTION_NAME", "rag")

# HTTP client for Qdrant requests
async def get_qdrant_client():
    headers = {}
    if QDRANT_API_KEY:
        headers["Authorization"] = f"Bearer {QDRANT_API_KEY}"
    
    return httpx.AsyncClient(
        base_url=QDRANT_URL,
        headers=headers,
        timeout=30.0
    )

@router.get("/health")
async def health_check():
    """Check Qdrant connection health"""
    try:
        async with await get_qdrant_client() as client:
            response = await client.get("/healthz")
            return {
                "status": "healthy" if response.status_code == 200 else "unhealthy",
                "status_code": response.status_code,
                "qdrant_url": QDRANT_URL
            }
    except Exception as e:
        logger.error(f"Qdrant health check failed: {e}")
        raise HTTPException(status_code=503, detail=f"Qdrant connection failed: {str(e)}")

@router.get("/collections/{collection_name}/info")
async def get_collection_info(collection_name: str = DEFAULT_COLLECTION):
    """Get collection information and configuration"""
    try:
        async with await get_qdrant_client() as client:
            response = await client.get(f"/collections/{collection_name}")
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(status_code=404, detail=f"Collection '{collection_name}' not found")
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        logger.error(f"Failed to get collection info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/collections/{collection_name}/stats")
async def get_collection_stats(collection_name: str = DEFAULT_COLLECTION):
    """Get collection statistics"""
    try:
        async with await get_qdrant_client() as client:
            response = await client.get(f"/collections/{collection_name}/stats")
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(status_code=404, detail=f"Collection '{collection_name}' not found")
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        logger.error(f"Failed to get collection stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/collections/{collection_name}/points/scroll")
async def scroll_vectors(
    collection_name: str = DEFAULT_COLLECTION,
    limit: int = Query(100, ge=1, le=1000),
    offset: Optional[str] = Query(None),
    with_payload: bool = Query(True),
    with_vector: bool = Query(False),
    filter: Optional[Dict[str, Any]] = None
):
    """Scroll through vectors with pagination"""
    try:
        scroll_request = {
            "limit": limit,
            "with_payload": with_payload,
            "with_vector": with_vector
        }
        
        if offset:
            scroll_request["offset"] = offset
        if filter:
            scroll_request["filter"] = filter
            
        async with await get_qdrant_client() as client:
            response = await client.post(
                f"/collections/{collection_name}/points/scroll",
                json=scroll_request
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(status_code=404, detail=f"Collection '{collection_name}' not found")
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        logger.error(f"Failed to scroll vectors: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/collections/{collection_name}/points/search")
async def search_vectors(
    collection_name: str = DEFAULT_COLLECTION,
    query_vector: List[float] = None,
    limit: int = Query(10, ge=1, le=100),
    score_threshold: Optional[float] = Query(None),
    with_payload: bool = Query(True),
    with_vector: bool = Query(False),
    filter: Optional[Dict[str, Any]] = None
):
    """Search for similar vectors"""
    if not query_vector:
        raise HTTPException(status_code=400, detail="query_vector is required")
    
    try:
        search_request = {
            "vector": query_vector,
            "limit": limit,
            "with_payload": with_payload,
            "with_vector": with_vector
        }
        
        if score_threshold is not None:
            search_request["score_threshold"] = score_threshold
        if filter:
            search_request["filter"] = filter
            
        async with await get_qdrant_client() as client:
            response = await client.post(
                f"/collections/{collection_name}/points/search",
                json=search_request
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(status_code=404, detail=f"Collection '{collection_name}' not found")
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        logger.error(f"Failed to search vectors: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/collections/{collection_name}/points")
async def get_vectors_by_id(
    collection_name: str = DEFAULT_COLLECTION,
    point_ids: List[str] = None,
    with_payload: bool = Query(True),
    with_vector: bool = Query(False)
):
    """Get specific vector points by IDs"""
    if not point_ids:
        raise HTTPException(status_code=400, detail="point_ids is required")
    
    try:
        request_body = {
            "ids": point_ids,
            "with_payload": with_payload,
            "with_vector": with_vector
        }
        
        async with await get_qdrant_client() as client:
            response = await client.post(
                f"/collections/{collection_name}/points",
                json=request_body
            )
            response.raise_for_status()
            return response.json()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(status_code=404, detail=f"Collection '{collection_name}' not found")
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        logger.error(f"Failed to get vectors by ID: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/collections/{collection_name}/cluster-info")
async def get_cluster_info(collection_name: str = DEFAULT_COLLECTION):
    """Get collection clustering information for visualization"""
    try:
        # Get a sample of points for clustering
        async with await get_qdrant_client() as client:
            scroll_response = await client.post(
                f"/collections/{collection_name}/points/scroll",
                json={
                    "limit": 1000,
                    "with_payload": True,
                    "with_vector": True
                }
            )
            scroll_response.raise_for_status()
            scroll_data = scroll_response.json()
            
            # Simple clustering based on payload data
            clusters = {}
            points = scroll_data.get("result", {}).get("points", [])
            
            for point in points:
                payload = point.get("payload", {})
                department = payload.get("department", "General")
                
                if department not in clusters:
                    clusters[department] = {
                        "id": department,
                        "name": department,
                        "point_count": 0,
                        "color": _get_department_color(department)
                    }
                clusters[department]["point_count"] += 1
            
            return {
                "clusters": list(clusters.values()),
                "total_points": len(points),
                "cluster_count": len(clusters)
            }
            
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(status_code=404, detail=f"Collection '{collection_name}' not found")
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        logger.error(f"Failed to get cluster info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/collections/{collection_name}/metrics")
async def get_query_metrics(collection_name: str = DEFAULT_COLLECTION):
    """Get real-time query performance metrics"""
    try:
        async with await get_qdrant_client() as client:
            # Get both stats and collection info
            stats_response = await client.get(f"/collections/{collection_name}/stats")
            info_response = await client.get(f"/collections/{collection_name}")
            
            stats_response.raise_for_status()
            info_response.raise_for_status()
            
            stats_data = stats_response.json()
            info_data = info_response.json()
            
            return {
                "total_vectors": stats_data.get("result", {}).get("points_count", 0),
                "indexed_vectors": stats_data.get("result", {}).get("indexed_vectors_count", 0),
                "disk_usage": stats_data.get("result", {}).get("disk_usage_bytes", 0),
                "memory_usage": stats_data.get("result", {}).get("memory_usage_bytes", 0),
                "status": info_data.get("result", {}).get("status", "unknown"),
                "optimizer_status": info_data.get("result", {}).get("optimizer_status", {}),
                "last_update": stats_data.get("time", None)
            }
            
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            raise HTTPException(status_code=404, detail=f"Collection '{collection_name}' not found")
        raise HTTPException(status_code=e.response.status_code, detail=e.response.text)
    except Exception as e:
        logger.error(f"Failed to get query metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

def _get_department_color(department: str) -> str:
    """Get color for department visualization"""
    colors = {
        'Engineering': '#00D4AA',
        'Marketing': '#0066CC',
        'Sales': '#FF6B35',
        'Support': '#8B5CF6',
        'General': '#6C757D'
    }
    return colors.get(department, '#6C757D')

# WebSocket endpoint for real-time updates (if needed)
@router.websocket("/collections/{collection_name}/stream")
async def stream_vector_updates(websocket, collection_name: str = DEFAULT_COLLECTION):
    """WebSocket endpoint for real-time vector updates"""
    await websocket.accept()
    
    try:
        # Send initial data
        async with await get_qdrant_client() as client:
            response = await client.get(f"/collections/{collection_name}/stats")
            if response.status_code == 200:
                await websocket.send_json({
                    "type": "initial_data",
                    "data": response.json()
                })
        
        # Keep connection alive and send periodic updates
        while True:
            try:
                # Send heartbeat
                await websocket.send_json({
                    "type": "heartbeat",
                    "timestamp": "2024-01-01T00:00:00Z"  # Replace with actual timestamp
                })
                
                # Wait before next update
                import asyncio
                await asyncio.sleep(5)
                
            except Exception as e:
                logger.error(f"WebSocket error: {e}")
                break
                
    except Exception as e:
        logger.error(f"WebSocket connection error: {e}")
    finally:
        await websocket.close()

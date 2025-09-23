"""
Collection Management API Routes
Provides endpoints for managing Qdrant collections including indexing, configuration, and dynamic updates
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Body
from fastapi.responses import JSONResponse
from typing import Optional, Dict, Any, List
import httpx
import os
import logging
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/collections", tags=["collection-management"])

# Qdrant configuration
QDRANT_URL = os.getenv("QDRANT_URL", "http://qdrant-07:6333")
QDRANT_API_KEY = os.getenv("QDRANT_API_KEY", None)

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

class CollectionConfigUpdate(BaseModel):
    vector_size: Optional[int] = None
    distance: Optional[str] = None
    hnsw_config: Optional[Dict[str, Any]] = None
    optimizer_config: Optional[Dict[str, Any]] = None

class CollectionIndexRequest(BaseModel):
    collection_name: str
    force_reindex: bool = False

@router.get("/")
async def list_collections():
    """Get all collections with detailed information"""
    try:
        async with await get_qdrant_client() as client:
            # Get collections list
            collections_response = await client.get("/collections")
            collections_data = collections_response.json()
            
            if collections_response.status_code != 200:
                raise HTTPException(status_code=collections_response.status_code, detail="Failed to fetch collections")
            
            collections = collections_data.get("result", {}).get("collections", [])
            
            # Get detailed information for each collection
            detailed_collections = []
            for collection in collections:
                try:
                    detail_response = await client.get(f"/collections/{collection['name']}")
                    if detail_response.status_code == 200:
                        detail_data = detail_response.json()
                        collection_info = detail_data.get("result", {})
                        
                        detailed_collections.append({
                            "name": collection["name"],
                            "points_count": collection_info.get("points_count", 0),
                            "indexed_vectors_count": collection_info.get("indexed_vectors_count", 0),
                            "status": collection_info.get("status", "unknown"),
                            "segments_count": collection_info.get("segments_count", 0),
                            "config": collection_info.get("config", {}),
                            "vector_size": collection_info.get("config", {}).get("params", {}).get("vectors", {}).get("size", 0),
                            "distance": collection_info.get("config", {}).get("params", {}).get("vectors", {}).get("distance", "unknown"),
                            "hnsw_config": collection_info.get("config", {}).get("hnsw_config", {}),
                            "optimizer_config": collection_info.get("config", {}).get("optimizer_config", {})
                        })
                    else:
                        # Fallback for collections that can't be detailed
                        detailed_collections.append({
                            "name": collection["name"],
                            "points_count": 0,
                            "indexed_vectors_count": 0,
                            "status": "error",
                            "segments_count": 0,
                            "config": {},
                            "vector_size": 0,
                            "distance": "unknown",
                            "hnsw_config": {},
                            "optimizer_config": {}
                        })
                except Exception as e:
                    logger.warning(f"Failed to get details for collection {collection['name']}: {e}")
                    detailed_collections.append({
                        "name": collection["name"],
                        "points_count": 0,
                        "indexed_vectors_count": 0,
                        "status": "error",
                        "segments_count": 0,
                        "config": {},
                        "vector_size": 0,
                        "distance": "unknown",
                        "hnsw_config": {},
                        "optimizer_config": {}
                    })
            
            return {
                "collections": detailed_collections,
                "total_collections": len(detailed_collections),
                "total_points": sum(c.get("points_count", 0) for c in detailed_collections)
            }
            
    except Exception as e:
        logger.error(f"Failed to list collections: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to list collections: {str(e)}")

@router.post("/{collection_name}/index")
async def trigger_indexing(collection_name: str, force_reindex: bool = Query(False)):
    """Trigger indexing for a specific collection"""
    try:
        async with await get_qdrant_client() as client:
            # Check if collection exists
            collection_response = await client.get(f"/collections/{collection_name}")
            if collection_response.status_code != 200:
                raise HTTPException(status_code=404, detail=f"Collection '{collection_name}' not found")
            
            # Trigger indexing by updating collection configuration
            # This forces Qdrant to reindex the collection
            collection_data = collection_response.json()
            current_config = collection_data.get("result", {}).get("config", {})
            
            # Update optimizer config to trigger reindexing
            updated_config = {
                **current_config,
                "optimizer_config": {
                    **current_config.get("optimizer_config", {}),
                    "deleted_threshold": 0.1 if force_reindex else 0.2,
                    "vacuum_min_vector_number": 100 if force_reindex else 1000
                }
            }
            
            # Update collection configuration
            update_response = await client.patch(
                f"/collections/{collection_name}",
                json={"optimizer_config": updated_config["optimizer_config"]}
            )
            
            if update_response.status_code not in [200, 202]:
                raise HTTPException(status_code=update_response.status_code, detail="Failed to trigger indexing")
            
            return {
                "message": f"Indexing triggered for collection '{collection_name}'",
                "collection_name": collection_name,
                "force_reindex": force_reindex,
                "status": "indexing_started"
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to trigger indexing for collection {collection_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to trigger indexing: {str(e)}")

@router.put("/{collection_name}/config")
async def update_collection_config(
    collection_name: str, 
    config_update: CollectionConfigUpdate
):
    """Update collection configuration"""
    try:
        async with await get_qdrant_client() as client:
            # Check if collection exists
            collection_response = await client.get(f"/collections/{collection_name}")
            if collection_response.status_code != 200:
                raise HTTPException(status_code=404, detail=f"Collection '{collection_name}' not found")
            
            # Get current configuration
            collection_data = collection_response.json()
            current_config = collection_data.get("result", {}).get("config", {})
            
            # Build updated configuration
            updated_config = {**current_config}
            
            if config_update.vector_size or config_update.distance:
                if "params" not in updated_config:
                    updated_config["params"] = {}
                if "vectors" not in updated_config["params"]:
                    updated_config["params"]["vectors"] = {}
                
                if config_update.vector_size:
                    updated_config["params"]["vectors"]["size"] = config_update.vector_size
                if config_update.distance:
                    updated_config["params"]["vectors"]["distance"] = config_update.distance
            
            if config_update.hnsw_config:
                updated_config["hnsw_config"] = {
                    **current_config.get("hnsw_config", {}),
                    **config_update.hnsw_config
                }
            
            if config_update.optimizer_config:
                updated_config["optimizer_config"] = {
                    **current_config.get("optimizer_config", {}),
                    **config_update.optimizer_config
                }
            
            # Update collection configuration
            update_response = await client.patch(
                f"/collections/{collection_name}",
                json=updated_config
            )
            
            if update_response.status_code not in [200, 202]:
                raise HTTPException(status_code=update_response.status_code, detail="Failed to update collection configuration")
            
            return {
                "message": f"Configuration updated for collection '{collection_name}'",
                "collection_name": collection_name,
                "updated_config": updated_config
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to update configuration for collection {collection_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to update configuration: {str(e)}")

@router.get("/{collection_name}/status")
async def get_collection_status(collection_name: str):
    """Get detailed status and configuration for a collection"""
    try:
        async with await get_qdrant_client() as client:
            response = await client.get(f"/collections/{collection_name}")
            
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail=f"Collection '{collection_name}' not found")
            
            data = response.json()
            collection_info = data.get("result", {})
            
            return {
                "collection_name": collection_name,
                "status": collection_info.get("status", "unknown"),
                "points_count": collection_info.get("points_count", 0),
                "indexed_vectors_count": collection_info.get("indexed_vectors_count", 0),
                "segments_count": collection_info.get("segments_count", 0),
                "optimizer_status": collection_info.get("optimizer_status", "unknown"),
                "config": collection_info.get("config", {}),
                "vector_size": collection_info.get("config", {}).get("params", {}).get("vectors", {}).get("size", 0),
                "distance": collection_info.get("config", {}).get("params", {}).get("vectors", {}).get("distance", "unknown"),
                "hnsw_config": collection_info.get("config", {}).get("hnsw_config", {}),
                "optimizer_config": collection_info.get("config", {}).get("optimizer_config", {})
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get status for collection {collection_name}: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get collection status: {str(e)}")

@router.post("/refresh")
async def refresh_collections():
    """Refresh collection list and detect new collections"""
    try:
        async with await get_qdrant_client() as client:
            # This endpoint can be used to trigger a refresh of the collection list
            # In a real implementation, this might trigger a background task
            # to detect and process new collections
            
            response = await client.get("/collections")
            if response.status_code != 200:
                raise HTTPException(status_code=response.status_code, detail="Failed to refresh collections")
            
            data = response.json()
            collections = data.get("result", {}).get("collections", [])
            
            return {
                "message": "Collections refreshed successfully",
                "collections_found": len(collections),
                "collections": [c["name"] for c in collections]
            }
            
    except Exception as e:
        logger.error(f"Failed to refresh collections: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to refresh collections: {str(e)}")

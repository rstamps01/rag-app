"""
Enhanced Queries API Routes with Monitoring Integration
Updated API routes that use the enhanced query wrapper with monitoring
"""

from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.orm import Session
import logging

from app.schemas.query import QueryRequest, QueryResponse
from app.services.enhanced_query_wrapper import enhanced_query_wrapper
from app.db.session import get_db

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/ask", response_model=QueryResponse)
async def process_query_endpoint(
    request: QueryRequest,
    db: Session = Depends(get_db)
):
    """
    Process a query through the enhanced RAG pipeline with monitoring
    
    This endpoint processes user queries through the complete RAG pipeline
    while providing real-time monitoring and metrics collection.
    """
    try:
        logger.info(f"--- LOGGER: queries_enhanced.py: process_query_endpoint ENTRY --- Received query: {request.query}, Department: {request.department}")
        
        # Determine department to use
        department_to_use = request.department if request.department else "General"
        
        # Process query through enhanced wrapper with monitoring
        logger.info(f"Calling enhanced_query_wrapper.process_query with query: {request.query}, department: {department_to_use}, user_id: None")
        
        response = await enhanced_query_wrapper.process_query(
            query=request.query,
            department=department_to_use,
            user_id=None  # TODO: Implement user authentication
        )
        
        logger.info(f"Successfully processed query: {request.query}")
        return response
        
    except Exception as e:
        logger.error(f"UNEXPECTED ERROR --- Query: {request.query}, Error: {e}")
        
        # Return error response instead of raising exception
        return QueryResponse(
            query=request.query,
            response="I apologize, but I encountered an error while processing your query. Please try again.",
            model="mistral-7b",
            sources=[],
            processing_time=0.0,
            gpu_accelerated=False
        )

@router.get("/health")
async def get_query_health():
    """
    Get health status of the query processing system
    """
    try:
        health_status = enhanced_query_wrapper.get_health_status()
        return {
            "status": "healthy" if health_status["initialized"] else "initializing",
            "details": health_status
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "error",
            "error": str(e)
        }

@router.post("/initialize")
async def initialize_query_system():
    """
    Manually initialize the query processing system
    """
    try:
        await enhanced_query_wrapper.initialize()
        return {"status": "initialized", "message": "Query system initialized successfully"}
    except Exception as e:
        logger.error(f"Initialization failed: {e}")
        raise HTTPException(status_code=500, detail=f"Initialization failed: {e}")

# Keep existing history endpoint for backward compatibility
from app.crud.crud_query_history import get_query_history
from app.schemas.query import QueryHistoryResponse

@router.get("/history", response_model=list[QueryHistoryResponse])
async def get_query_history_endpoint(
    limit: int = 10,
    skip: int = 0,
    db: Session = Depends(get_db)
):
    """
    Get query history with proper schema handling
    """
    try:
        history_entries = get_query_history(db, skip=skip, limit=limit)
        
        # Convert to response format with proper schema handling
        response_entries = []
        for entry in history_entries:
            # Handle sources_retrieved field conversion
            sources_retrieved = []
            if entry.sources_retrieved:
                for source in entry.sources_retrieved:
                    if isinstance(source, str):
                        # Convert string to dict format
                        sources_retrieved.append({
                            "document_name": source,
                            "relevance_score": 0.0
                        })
                    elif isinstance(source, dict):
                        # Ensure required fields exist
                        sources_retrieved.append({
                            "document_name": source.get("document_name", "Unknown"),
                            "relevance_score": source.get("relevance_score", 0.0)
                        })
            
            response_entry = QueryHistoryResponse(
                id=entry.id,
                query_text=entry.query_text,
                response_text=entry.response_text,
                sources_retrieved=sources_retrieved,
                processing_time=entry.processing_time,
                model_used=entry.model_used,
                department=entry.department,
                user_id=entry.user_id,
                query_timestamp=entry.query_timestamp,
                gpu_accelerated=entry.gpu_accelerated
            )
            response_entries.append(response_entry)
        
        return response_entries
        
    except Exception as e:
        logger.error(f"Failed to get query history: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get query history: {e}")

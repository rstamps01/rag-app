"""
Query History Schema Fix
Fixes the mismatch between database storage format and API response schema
"""

# Fixed API Routes for Query History
# File: /backend/app/api/routes/queries.py

from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Any, List, Optional, Dict
import logging

from app.db.session import get_db 
from sqlalchemy.orm import Session

from app.services import query_wrapper
from app.schemas.query import QueryRequest, QueryResponse, QueryHistoryResponse
from app.crud import crud_query_history

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/ask", response_model=QueryResponse)
async def process_query_endpoint(
    request: QueryRequest,
    db: Session = Depends(get_db),
) -> Any:
    """
    Receives a query request, executes the RAG pipeline, saves to history, and returns the response.
    """
    logger.info(f"--- LOGGER: queries.py: process_query_endpoint ENTRY --- Received query: {request.query}, Department: {request.department}")
    
    user_id_to_pass: Optional[int] = None

    try:
        department_to_use = request.department if request.department is not None else "General"
        logger.info(f"Calling query_wrapper.process_query with query: {request.query}, department: {department_to_use}, user_id: {user_id_to_pass}")
        
        # Call the async function from the imported module
        response = await query_wrapper.process_query(
            query=request.query,
            department=department_to_use,
            user_id=user_id_to_pass
        )
        
        logger.info(f"Successfully processed query: {request.query}")
        return response
    except HTTPException as http_exc:
        logger.error(f"HTTP EXCEPTION --- Query: {request.query}, Error: {http_exc.detail}", exc_info=True)
        raise http_exc
    except Exception as e:
        logger.error(f"UNEXPECTED ERROR --- Query: {request.query}, Error: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@router.get("/history", response_model=List[QueryHistoryResponse])
async def get_query_history(
    user_id: Optional[int] = Query(None, description="User ID to filter query history"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records to return"),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get query history for a specific user or all users (admin).
    FIXED: Properly handle sources_retrieved format conversion
    """
    try:
        if user_id:
            history_entries = crud_query_history.get_query_history_for_user(
                db=db, user_id=user_id, skip=skip, limit=limit
            )
        else:
            history_entries = crud_query_history.get_all_query_history(
                db=db, skip=skip, limit=limit
            )
        
        # Convert to response format with proper sources_retrieved handling
        response_entries = []
        for entry in history_entries:
            # FIXED: Convert sources_retrieved from strings to proper dict format
            sources_retrieved = []
            if entry.sources_retrieved:
                if isinstance(entry.sources_retrieved, list):
                    for source in entry.sources_retrieved:
                        if isinstance(source, str):
                            # Convert string to dict format expected by schema
                            sources_retrieved.append({
                                "document_name": source,
                                "relevance_score": 0.0
                            })
                        elif isinstance(source, dict):
                            # Already in correct format
                            sources_retrieved.append(source)
                        else:
                            # Fallback for other types
                            sources_retrieved.append({
                                "document_name": str(source),
                                "relevance_score": 0.0
                            })
            
            response_entries.append(QueryHistoryResponse(
                id=entry.id,
                user_id=entry.user_id,
                query_text=entry.query_text,
                response_text=entry.response_text,
                query_timestamp=entry.query_timestamp,
                llm_model_used=entry.llm_model_used,
                sources_retrieved=sources_retrieved,  # FIXED: Proper format
                processing_time_ms=entry.processing_time_ms,
                department_filter=entry.department_filter,
                gpu_accelerated=entry.gpu_accelerated
            ))
        
        return response_entries
        
    except Exception as e:
        logger.error(f"Error retrieving query history: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error retrieving query history: {str(e)}")

@router.get("/history/count")
async def get_query_history_count(
    user_id: Optional[int] = Query(None, description="User ID to filter query history count"),
    db: Session = Depends(get_db)
) -> Dict[str, int]:
    """
    Get count of query history entries.
    """
    try:
        count = crud_query_history.get_query_history_count(db=db, user_id=user_id)
        return {"count": count}
    except Exception as e:
        logger.error(f"Error counting query history: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error counting query history: {str(e)}")

@router.delete("/history/{entry_id}")
async def delete_query_history_entry(
    entry_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """
    Delete a specific query history entry.
    """
    try:
        success = crud_query_history.delete_query_history_entry(db=db, entry_id=entry_id)
        if success:
            return {"message": f"Query history entry {entry_id} deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail=f"Query history entry {entry_id} not found")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting query history entry {entry_id}: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error deleting query history entry: {str(e)}")

@router.get("/recent", response_model=List[QueryHistoryResponse])
async def get_recent_queries(
    limit: int = Query(10, ge=1, le=50, description="Number of recent queries to return"),
    db: Session = Depends(get_db)
) -> Any:
    """
    Get the most recent query history entries.
    FIXED: Properly handle sources_retrieved format conversion
    """
    try:
        recent_entries = crud_query_history.get_recent_queries(db=db, limit=limit)
        
        # Convert to response format with proper sources_retrieved handling
        response_entries = []
        for entry in recent_entries:
            # FIXED: Convert sources_retrieved from strings to proper dict format
            sources_retrieved = []
            if entry.sources_retrieved:
                if isinstance(entry.sources_retrieved, list):
                    for source in entry.sources_retrieved:
                        if isinstance(source, str):
                            # Convert string to dict format expected by schema
                            sources_retrieved.append({
                                "document_name": source,
                                "relevance_score": 0.0
                            })
                        elif isinstance(source, dict):
                            # Already in correct format
                            sources_retrieved.append(source)
                        else:
                            # Fallback for other types
                            sources_retrieved.append({
                                "document_name": str(source),
                                "relevance_score": 0.0
                            })
            
            response_entries.append(QueryHistoryResponse(
                id=entry.id,
                user_id=entry.user_id,
                query_text=entry.query_text,
                response_text=entry.response_text,
                query_timestamp=entry.query_timestamp,
                llm_model_used=entry.llm_model_used,
                sources_retrieved=sources_retrieved,  # FIXED: Proper format
                processing_time_ms=entry.processing_time_ms,
                department_filter=entry.department_filter,
                gpu_accelerated=entry.gpu_accelerated
            ))
        
        return response_entries
        
    except Exception as e:
        logger.error(f"Error retrieving recent queries: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Error retrieving recent queries: {str(e)}")

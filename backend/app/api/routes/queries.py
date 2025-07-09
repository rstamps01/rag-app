# File Path: /home/ubuntu/rag_app_extracted/rag-app/backend/app/api/routes/queries.py

from fastapi import APIRouter, Depends, HTTPException, status, Query # Added Query for user_id
from typing import Any, List, Optional 
import logging

from app.db.base import get_db 
from sqlalchemy.orm import Session
from app.services import query_processor 
# Updated schema imports
from app.schemas.query import QueryRequest, QueryResponse, QueryHistoryResponse
from app.crud import crud_query_history # Import CRUD for query history
# from ...core.security import get_current_active_user # Placeholder for user auth
# from ...models.models import User as UserModel # Placeholder for user model

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/ask", response_model=QueryResponse)
async def process_query_endpoint(
    request: QueryRequest,
    db: Session = Depends(get_db),
    # current_user: UserModel = Depends(get_current_active_user) # Example: Get current user
) -> Any:
    """
    Receives a query request, executes the RAG pipeline, saves to history, and returns the response.
    """
    logger.info(f"--- LOGGER: queries.py: process_query_endpoint ENTRY --- Received query: {request.query}, Department: {request.department}")
    
    # Placeholder for getting user_id if authentication is implemented
    user_id_to_pass: Optional[int] = None
    # if current_user:
    #     user_id_to_pass = current_user.id

    try:
        department_to_use = request.department if request.department is not None else "General"
        logger.info(f"Calling query_processor.process_query with query: {request.query}, department: {department_to_use}, user_id: {user_id_to_pass}")
        
        response = await query_processor.process_query(
            db=db, # Pass the DB session
            query_text=request.query, 
            department=department_to_use,
            user_id=user_id_to_pass # Pass user_id
        )
        
        logger.info(f"Successfully processed query: {request.query}")
        return response
    except HTTPException as http_exc:
        logger.error(f"HTTP EXCEPTION --- Query: {request.query}, Error: {http_exc.detail}", exc_info=True)
        raise http_exc
    except Exception as e:
        error_msg = f"Failed to execute RAG query 	'{request.query}	': {e}"
        logger.error(f"EXCEPTION --- Query: {request.query}, Error: {error_msg}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to process query: {e}"
        )

@router.get("/history", response_model=List[QueryHistoryResponse])
async def get_query_history_endpoint(
    skip: int = 0, 
    limit: int = 50,
    user_id: Optional[int] = Query(None, description="Filter history by User ID (admin/debug feature)"), # Optional user_id filter
    db: Session = Depends(get_db)
    # current_user: UserModel = Depends(get_current_active_user) # If endpoint should be user-specific by default
) -> Any:
    """
    Get history of previous queries.
    If user_id is provided, filters by that user. Otherwise, returns all history (admin).
    If implementing for specific users, this endpoint should be protected and only allow users to see their own history,
    or admins to see all/specific user history.
    """
    if user_id is not None:
        logger.info(f"Fetching query history for user_id={user_id}, skip={skip}, limit={limit}")
        history = crud_query_history.get_query_history_for_user(db=db, user_id=user_id, skip=skip, limit=limit)
    else:
        # This branch would typically be for admin users or if user context is derived from auth token
        # For now, it fetches all history if no user_id is specified in query params.
        # If current_user were available from Depends(get_current_active_user):
        # history = crud_query_history.get_query_history_for_user(db=db, user_id=current_user.id, skip=skip, limit=limit)
        logger.info(f"Fetching all query history (or for current authenticated user if implemented), skip={skip}, limit={limit}")
        history = crud_query_history.get_all_query_history(db=db, skip=skip, limit=limit)
        
    logger.info(f"Retrieved {len(history)} query history entries.")
    return history


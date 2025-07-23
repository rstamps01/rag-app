"""Enhanced query processing wrapper with full RAG integration"""
import logging
import time
from typing import Optional, List, Any, Dict
from sqlalchemy.orm import Session
from datetime import datetime

# Import the correct schema
from app.schemas.query import QueryResponse
from app.services.model_manager import ModelManager
from app.services.rag_service import RAGService

# ADD THIS IMPORT:
#from app.crud.crud_query_history import create_query_history

logger = logging.getLogger(__name__)

# Initialize services (singleton pattern)
_model_manager = None
_rag_service = None

def get_model_manager():
    """Get or create ModelManager instance"""
    global _model_manager
    if _model_manager is None:
        _model_manager = ModelManager()
        logger.info("ModelManager initialized successfully")
    return _model_manager

def get_rag_service():
    """Get or create RAGService instance"""
    global _rag_service
    if _rag_service is None:
        _rag_service = RAGService(use_gpu=True)
        logger.info("RAGService initialized successfully")
    return _rag_service

######
async def process_query(
    db: Session,
    query_text: str,
    department: str = "General",
    user_id: Optional[int] = None
) -> QueryResponse:
    """
    Process a query through the RAG pipeline with proper error handling
    """
    start_time = time.time()
    
    try:
        logger.info(f"Processing query: {query_text[:100]}...")
        
        # Initialize services with error handling
        try:
            # Import here to avoid circular imports
            from app.services.query_processor import QueryProcessor
            query_processor = QueryProcessor()
        except Exception as e:
            logger.error(f"Failed to initialize QueryProcessor: {e}")
            # Return error response instead of raising exception
            return QueryResponse(
                query=query_text,
                response=f"Service initialization failed: {str(e)}",
                model="error",
                sources=[],
                processing_time=time.time() - start_time,
                gpu_accelerated=False,
                query_history_id=None
            )
        
        # Process the query
        try:
            response = query_processor.process_query(
                query=query_text,
                department_filter=department,
                user_id=user_id,
                db=db
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Query processing failed: {e}")
            return QueryResponse(
                query=query_text,
                response=f"Query processing failed: {str(e)}",
                model="error",
                sources=[],
                processing_time=time.time() - start_time,
                gpu_accelerated=False,
                query_history_id=None
            )
            
    except Exception as e:
        logger.error(f"Unexpected error in process_query: {e}", exc_info=True)
        return QueryResponse(
            query=query_text,
            response=f"Unexpected error: {str(e)}",
            model="error",
            sources=[],
            processing_time=time.time() - start_time,
            gpu_accelerated=False,
            query_history_id=None
        )
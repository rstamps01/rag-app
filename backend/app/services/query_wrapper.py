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
async def process_query(db, query_text, department, user_id=None, context_length=None):
    """Process a query using the RAG pipeline."""
    from app.services.query_processor import query_processor
    from app.schemas.query import QueryResponse
    
    try:
        # Use the actual query processor instead of placeholder
        result = query_processor.process_query(
            query=query_text,
            user_id=user_id,
            department_filter=department,
            db=db
        )
        
        # Convert to expected response format
        return QueryResponse(
            query=query_text,
            response=result.answer,
            model="mistralai/Mistral-7B-Instruct-v0.2",
            sources=[
                {
                    "document_id": source.filename,
                    "document_name": source.filename,
                    "relevance_score": source.relevance_score,
                    "content_snippet": source.content_snippet
                }
                for source in result.sources
            ],
            processing_time=result.processing_time,
            gpu_accelerated=True,
            query_history_id=None
        )
        
    except Exception as e:
        logger.error(f"Query processing failed: {e}")
        return QueryResponse(
            query=query_text,
            response=f"I apologize, but I encountered an error: {str(e)}",
            model="mistralai/Mistral-7B-Instruct-v0.2",
            sources=[],
            processing_time=0.0,
            gpu_accelerated=False,
            query_history_id=None
        )

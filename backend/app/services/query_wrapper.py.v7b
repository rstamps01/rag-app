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

async def process_query(db, query_text, department, user_id=None, context_length=None):
    """Process a query using the full RAG pipeline with Mistral-7B model."""
    start_time = time.time()
    
    try:
        logger.info(f"Processing query: {query_text}")
        
        # Get service instances
        model_manager = get_model_manager()
        rag_service = get_rag_service()
        
        # Check if we should use RAG or direct model response
        use_rag = True  # Default to RAG for better responses
        
        if use_rag:
            # Use RAG service for comprehensive response
            logger.info("Using RAG service for query processing")
            result = rag_service.generate_response(
                query=query_text,
                model_id="mistral-7b",
                max_results=5
            )
            
            # Extract response components
            answer = result["response"]
            sources = result["sources"]
            model_used = result["model"]
            gpu_accelerated = result["gpu_accelerated"]
            
        else:
            # Use direct model generation (fallback)
            logger.info("Using direct model generation")
            
            # Create a simple prompt for the model
            prompt = f"""You are a helpful AI assistant. Please provide a clear and informative answer to the following question:

Question: {query_text}

Answer:"""
            
            # Generate response using ModelManager
            answer = model_manager.generate_response(
                model_name="mistral-7b",
                prompt=prompt,
                max_length=512
            )
            
            sources = []
            model_used = "mistral-7b"
            gpu_accelerated = model_manager.use_gpu
        
        processing_time = round(time.time() - start_time, 3)
        
        logger.info(f"Query processed successfully in {processing_time}s")
        logger.info(f"Response length: {len(answer)} characters")
        logger.info(f"Sources found: {len(sources)}")
        
        # Create response with the EXACT fields expected by the schema
        response = QueryResponse(
            query=query_text,
            response=answer,
            model=model_used,
            sources=sources,
            processing_time=processing_time,
            gpu_accelerated=gpu_accelerated,
            query_history_id=None
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}", exc_info=True)
        
        # Return error response
        processing_time = round(time.time() - start_time, 3)
        
        response = QueryResponse(
            query=query_text,
            response=f"I apologize, but I encountered an error while processing your query: {str(e)}",
            model="error-fallback",
            sources=[],
            processing_time=processing_time,
            gpu_accelerated=False,
            query_history_id=None
        )
        
        return response
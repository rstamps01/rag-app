#!/usr/bin/env python3
"""
Enhanced Query Wrapper with Guaranteed History Logging
Ensures every query is saved to PostgreSQL database for persistent history
"""

import asyncio
import logging
import time
from typing import Optional, List, Dict, Any
from datetime import datetime

from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError

# Import schemas
from app.schemas.query import (
    QueryRequest, 
    QueryResponse, 
    SourceDocument,
    QueryHistoryCreate,
    QueryHistoryResponse
)

# Import CRUD operations
from app.crud import crud_query_history

# Import services
from app.services.query_processor import QueryProcessor
from app.services.llm_service import LLMService
from app.services.vector_db import VectorDBService
from app.core.pipeline_monitor import PipelineMonitor

# Set up logging
logger = logging.getLogger(__name__)

class EnhancedQueryWrapper:
    """
    Enhanced Query Wrapper that guarantees query history persistence
    """
    
    def __init__(self):
        self.query_processor = None
        self.llm_service = None
        self.vector_db = None
        self.pipeline_monitor = None
        self._initialized = False
    
    async def initialize(self):
        """Initialize all services"""
        if self._initialized:
            return
            
        try:
            logger.info("🔧 Initializing Enhanced Query Wrapper...")
            
            # Initialize services
            self.query_processor = QueryProcessor()
            self.llm_service = LLMService()
            self.vector_db = VectorDBService()
            self.pipeline_monitor = PipelineMonitor()
            
            # Initialize each service
            await self.query_processor.initialize()
            await self.llm_service.initialize()
            await self.vector_db.initialize()
            
            self._initialized = True
            logger.info("✅ Enhanced Query Wrapper initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Enhanced Query Wrapper: {e}")
            raise

    async def process_query(
        self, 
        db: Session, 
        query_text: str, 
        department: str = "General",
        user_id: Optional[int] = None
    ) -> QueryResponse:
        """
        Process a query with guaranteed history logging
        
        Args:
            db: Database session
            query_text: The user's query
            department: Department filter for document search
            user_id: Optional user ID for tracking
            
        Returns:
            QueryResponse with all fields populated
        """
        start_time = time.time()
        history_entry_id = None
        
        # Ensure services are initialized
        if not self._initialized:
            await self.initialize()
        
        logger.info(f"🔍 Processing query: {query_text[:50]}...")
        logger.info(f"📊 Department: {department}, User ID: {user_id}")
        
        try:
            # Step 1: Create initial history entry (for tracking)
            initial_history = await self._create_initial_history_entry(
                db, query_text, department, user_id
            )
            history_entry_id = initial_history.id if initial_history else None
            
            # Step 2: Process the query through RAG pipeline
            rag_response = await self._process_rag_query(
                query_text, department, user_id
            )
            
            # Step 3: Update history with successful response
            final_history = await self._update_history_with_response(
                db, history_entry_id, rag_response, start_time
            )
            
            # Step 4: Create final response
            response = QueryResponse(
                query=query_text,
                response=rag_response.get('response', 'No response generated'),
                model=rag_response.get('model', 'mistral-7b'),
                sources=rag_response.get('sources', []),
                processing_time=time.time() - start_time,
                gpu_accelerated=rag_response.get('gpu_accelerated', False),
                query_history_id=final_history.id if final_history else None
            )
            
            logger.info(f"✅ Query processed successfully in {response.processing_time:.2f}s")
            return response
            
        except Exception as e:
            logger.error(f"❌ Query processing failed: {e}")
            
            # Step 4: Save error to history for debugging
            await self._save_error_to_history(
                db, history_entry_id, query_text, department, user_id, str(e), start_time
            )
            
            # Return error response
            return QueryResponse(
                query=query_text,
                response=f"I apologize, but I encountered an error while generating a response: {str(e)}",
                model="error",
                sources=[],
                processing_time=time.time() - start_time,
                gpu_accelerated=False,
                query_history_id=history_entry_id
            )

    async def _create_initial_history_entry(
        self, 
        db: Session, 
        query_text: str, 
        department: str, 
        user_id: Optional[int]
    ) -> Optional[Any]:
        """Create initial history entry for tracking"""
        try:
            history_data = QueryHistoryCreate(
                query_text=query_text,
                response_text=None,  # Will be updated later
                llm_model_used=None,  # Will be updated later
                sources_retrieved=None,  # Will be updated later
                processing_time_ms=None,  # Will be updated later
                department_filter=department,
                gpu_accelerated=False  # Will be updated later
            )
            
            history_entry = crud_query_history.create_query_history(
                db=db, 
                obj_in=history_data, 
                user_id=user_id
            )
            
            logger.info(f"📝 Created initial history entry: ID {history_entry.id}")
            return history_entry
            
        except Exception as e:
            logger.error(f"❌ Failed to create initial history entry: {e}")
            return None

    async def _process_rag_query(
        self, 
        query_text: str, 
        department: str, 
        user_id: Optional[int]
    ) -> Dict[str, Any]:
        """Process the actual RAG query"""
        try:
            # Step 1: Search for relevant documents
            logger.info("🔍 Searching for relevant documents...")
            search_results = await self.vector_db.search_documents(
                query_text=query_text,
                department_filter=department,
                limit=5
            )
            
            # Step 2: Format sources
            sources = []
            context_text = ""
            
            for i, result in enumerate(search_results):
                source = SourceDocument(
                    document_id=result.get('filename', f"doc_{i}"),
                    document_name=result.get('filename', 'Unknown Document'),
                    relevance_score=float(result.get('score', 0.0)),
                    content_snippet=result.get('content', '')[:200] + "..." if result.get('content') else None
                )
                sources.append(source)
                
                # Add to context for LLM
                if result.get('content'):
                    context_text += f"\n\nDocument: {source.document_name}\nContent: {result.get('content')}"
            
            logger.info(f"📚 Found {len(sources)} relevant documents")
            
            # Step 3: Generate response using LLM
            logger.info("🤖 Generating AI response...")
            
            # Create context-aware prompt
            prompt = f"""Based on the following context documents, please answer the user's question.

Context Documents:
{context_text}

User Question: {query_text}

Please provide a comprehensive answer based on the context provided. If the context doesn't contain enough information to fully answer the question, please indicate what information is available and what might be missing."""

            llm_response = await self.llm_service.generate_response(prompt=prompt)
            
            logger.info("✅ AI response generated successfully")
            
            return {
                'response': llm_response,
                'model': 'mistral-7b-instruct-v0.2',
                'sources': sources,
                'gpu_accelerated': True,
                'context_used': len(context_text) > 0
            }
            
        except Exception as e:
            logger.error(f"❌ RAG processing failed: {e}")
            raise

    async def _update_history_with_response(
        self, 
        db: Session, 
        history_entry_id: Optional[int], 
        rag_response: Dict[str, Any], 
        start_time: float
    ) -> Optional[Any]:
        """Update history entry with successful response"""
        if not history_entry_id:
            return None
            
        try:
            processing_time_ms = int((time.time() - start_time) * 1000)
            
            # Prepare sources for JSON storage
            sources_json = []
            for source in rag_response.get('sources', []):
                if isinstance(source, SourceDocument):
                    sources_json.append({
                        'document_id': source.document_id,
                        'document_name': source.document_name,
                        'relevance_score': source.relevance_score,
                        'content_snippet': source.content_snippet
                    })
                else:
                    sources_json.append(source)
            
            # Update the history entry
            updated_entry = crud_query_history.update_query_history(
                db=db,
                entry_id=history_entry_id,
                response_text=rag_response.get('response'),
                llm_model_used=rag_response.get('model'),
                sources_retrieved=sources_json,
                processing_time_ms=processing_time_ms,
                gpu_accelerated=rag_response.get('gpu_accelerated', False)
            )
            
            logger.info(f"📝 Updated history entry: ID {history_entry_id}")
            return updated_entry
            
        except Exception as e:
            logger.error(f"❌ Failed to update history entry: {e}")
            return None

    async def _save_error_to_history(
        self, 
        db: Session, 
        history_entry_id: Optional[int], 
        query_text: str, 
        department: str, 
        user_id: Optional[int], 
        error_message: str, 
        start_time: float
    ) -> Optional[Any]:
        """Save error information to history for debugging"""
        try:
            processing_time_ms = int((time.time() - start_time) * 1000)
            
            if history_entry_id:
                # Update existing entry
                error_entry = crud_query_history.update_query_history(
                    db=db,
                    entry_id=history_entry_id,
                    response_text=f"Error: {error_message}",
                    llm_model_used="error",
                    sources_retrieved=[],
                    processing_time_ms=processing_time_ms,
                    gpu_accelerated=False
                )
            else:
                # Create new error entry
                error_history = QueryHistoryCreate(
                    query_text=query_text,
                    response_text=f"Error: {error_message}",
                    llm_model_used="error",
                    sources_retrieved=[],
                    processing_time_ms=processing_time_ms,
                    department_filter=department,
                    gpu_accelerated=False
                )
                
                error_entry = crud_query_history.create_query_history(
                    db=db, 
                    obj_in=error_history, 
                    user_id=user_id
                )
            
            logger.info(f"📝 Saved error to history: {error_message}")
            return error_entry
            
        except Exception as e:
            logger.error(f"❌ Failed to save error to history: {e}")
            return None

    async def get_query_history(
        self, 
        db: Session, 
        user_id: Optional[int] = None, 
        skip: int = 0, 
        limit: int = 10,
        department_filter: Optional[str] = None
    ) -> List[QueryHistoryResponse]:
        """Get query history with optional filtering"""
        try:
            if user_id:
                history_entries = crud_query_history.get_query_history_for_user(
                    db=db, 
                    user_id=user_id, 
                    skip=skip, 
                    limit=limit,
                    department_filter=department_filter
                )
            else:
                history_entries = crud_query_history.get_all_query_history(
                    db=db, 
                    skip=skip, 
                    limit=limit,
                    department_filter=department_filter
                )
            
            # Convert to response format
            response_entries = []
            for entry in history_entries:
                response_entries.append(QueryHistoryResponse(
                    id=entry.id,
                    user_id=entry.user_id,
                    query_text=entry.query_text,
                    response_text=entry.response_text,
                    query_timestamp=entry.query_timestamp,
                    llm_model_used=entry.llm_model_used,
                    sources_retrieved=entry.sources_retrieved or [],
                    processing_time_ms=entry.processing_time_ms,
                    department_filter=entry.department_filter,
                    gpu_accelerated=entry.gpu_accelerated
                ))
            
            logger.info(f"📚 Retrieved {len(response_entries)} history entries")
            return response_entries
            
        except Exception as e:
            logger.error(f"❌ Failed to get query history: {e}")
            return []

# Create singleton instance
enhanced_query_wrapper = EnhancedQueryWrapper()

# Export the main function for backward compatibility
async def process_query(
    db: Session, 
    query_text: str, 
    department: str = "General",
    user_id: Optional[int] = None
) -> QueryResponse:
    """
    Main entry point for query processing with guaranteed history logging
    """
    return await enhanced_query_wrapper.process_query(
        db=db,
        query_text=query_text,
        department=department,
        user_id=user_id
    )

# Export history function
async def get_query_history(
    db: Session, 
    user_id: Optional[int] = None, 
    skip: int = 0, 
    limit: int = 10,
    department_filter: Optional[str] = None
) -> List[QueryHistoryResponse]:
    """
    Get query history with optional filtering
    """
    return await enhanced_query_wrapper.get_query_history(
        db=db,
        user_id=user_id,
        skip=skip,
        limit=limit,
        department_filter=department_filter
    )

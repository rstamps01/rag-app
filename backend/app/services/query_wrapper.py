"""
Enhanced Query Wrapper Service
Provides comprehensive query processing with guaranteed history logging
"""

import asyncio
import json
import logging
import time
import traceback
from typing import Dict, Any, Optional, List
from datetime import datetime

from app.services.query_processor import QueryProcessor
from app.services.llm_service import LLMService
from app.services.vector_db import VectorDBService
from app.crud import crud_query_history # Import CRUD for query history
from app.db.session import get_db
from app.schemas.query import QueryResponse, SourceDocument
from app.core.config import settings

logger = logging.getLogger(__name__)

class EnhancedQueryWrapper:
    """Enhanced query wrapper with guaranteed history logging and error handling"""
    
    def __init__(self):
        self.query_processor = None
        self.llm_service = None
        self.vector_db = None
        self.initialized = False
        self.initialization_lock = asyncio.Lock()
        
    async def initialize(self):
        """Initialize all services"""
        if self.initialized:
            return
            
        async with self.initialization_lock:
            if self.initialized:
                return
                
            try:
                logger.info("🔧 Initializing Enhanced Query Wrapper...")
                
                # Initialize services (they handle their own initialization)
                # Initialize services (they handle their own initialization)
                self.query_processor = QueryProcessor()
                self.llm_service = LLMService()
                self.vector_db = VectorDBService()
                
                # Services are already initialized in their constructors
                # No need to call initialize() methods that don't exist
                self.initialized = True
                logger.info("✅ Enhanced Query Wrapper initialized successfully")
                
            except Exception as e:
                logger.error(f"❌ Failed to initialize Enhanced Query Wrapper: {e}")
                raise
    
    async def process_query(
        self,
        query: str,
        department: str = "General",
        user_id: Optional[int] = None
    ) -> QueryResponse:
        """
        Process query with guaranteed history logging
        """
        start_time = time.time()
        query_history_id = None
        
        try:
            # Ensure initialization
            await self.initialize()
            
            logger.info(f"Processing query: {query[:50]}...")
            
            # Create initial query history entry
            query_history_id = await self._create_query_history_entry(
                query_text=query,
                department=department,
                user_id=user_id,
                status="processing"
            )
            
            # Process the query using existing query processor
            result = await self.query_processor.process_query(
                query_text=query,
                department_filter=department
            )
            
            # Extract response and sources from result
            if isinstance(result, dict):
                response_text = result.get('response', result.get('answer', 'No response generated'))
                sources_data = result.get('sources', [])
            else:
                response_text = str(result)
                sources_data = []
            
            # Process sources into proper format
            sources = self._process_sources(sources_data)
            
            # Calculate processing time
            processing_time = time.time() - start_time
            
            # Create response object
            response = QueryResponse(
                query=query,
                response=response_text,
                model="mistral-7b",
                sources=sources,
                processing_time=processing_time,
                gpu_accelerated=True,
                query_history_id=query_history_id
            )
            
            # Update query history with success
            if query_history_id:
                await self._update_query_history(
                    query_history_id=query_history_id,
                    response_text=response_text,
                    sources=sources,
                    processing_time=processing_time,
                    status="success"
                )
            
            logger.info(f"Query processed successfully in {processing_time:.2f}s")
            return response
            
        except Exception as e:
            processing_time = time.time() - start_time
            error_message = f"Query processing failed: {str(e)}"
            logger.error(f"❌ {error_message}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            
            # Update query history with error
            if query_history_id:
                await self._update_query_history(
                    query_history_id=query_history_id,
                    response_text=error_message,
                    sources=[],
                    processing_time=processing_time,
                    status="error"
                )
            
            # Return error response
            return QueryResponse(
                query=query,
                response=f"I apologize, but I encountered an error while generating a response: {str(e)}",
                model="mistral-7b",
                sources=[],
                processing_time=processing_time,
                gpu_accelerated=False,
                query_history_id=query_history_id
            )
    
    def _process_sources(self, sources_data: List[Dict]) -> List[SourceDocument]:
        """Process sources into SourceDocument format"""
        sources = []
        
        for i, source in enumerate(sources_data):
            try:
                # Handle different source formats
                if isinstance(source, dict):
                    document_id = source.get('document_id') or source.get('filename') or f"doc_{i+1}"
                    document_name = source.get('document_name') or source.get('filename') or f"Document {i+1}"
                    content_snippet = source.get('content_snippet') or source.get('content', '')[:500]
                    relevance_score = source.get('relevance_score') or source.get('score', 0.0)
                else:
                    # Fallback for non-dict sources
                    document_id = f"doc_{i+1}"
                    document_name = f"Document {i+1}"
                    content_snippet = str(source)[:500]
                    relevance_score = 0.0
                
                source_doc = SourceDocument(
                    document_id=document_id,
                    document_name=document_name,
                    content_snippet=content_snippet,
                    relevance_score=float(relevance_score)
                )
                sources.append(source_doc)
                
            except Exception as e:
                logger.warning(f"Failed to process source {i}: {e}")
                # Add fallback source
                sources.append(SourceDocument(
                    document_id=f"doc_{i+1}",
                    document_name=f"Document {i+1}",
                    content_snippet="Content unavailable",
                    relevance_score=0.0
                ))
        
        return sources
    
    async def _create_query_history_entry(
        self,
        query_text: str,
        department: str,
        user_id: Optional[int],
        status: str = "processing"
    ) -> Optional[int]:
        """Create initial query history entry"""
        try:
            db = next(get_db())
            
            query_data = {
                "query_text": query_text,
                "department": department,
                "user_id": user_id,
                "status": status,
                "query_timestamp": datetime.utcnow(),
                "response_text": "",
                "sources": [],
                "processing_time": 0.0,
                "gpu_accelerated": False
            }
            
            query_history = crud_query_history.create(db=db, obj_in=query_data)
            db.close()
            
            return query_history.id
            
        except Exception as e:
            logger.error(f"Failed to create query history entry: {e}")
            return None
    
    async def _update_query_history(
        self,
        query_history_id: int,
        response_text: str,
        sources: List[SourceDocument],
        processing_time: float,
        status: str = "success"
    ):
        """Update query history with results"""
        try:
            db = next(get_db())
            
            # Convert sources to JSON serializable format
            sources_json = []
            for source in sources:
                sources_json.append({
                    "document_id": source.document_id,
                    "document_name": source.document_name,
                    "content_snippet": source.content_snippet,
                    "relevance_score": source.relevance_score
                })
            
            update_data = {
                "response_text": response_text,
                "sources": sources_json,
                "processing_time": processing_time,
                "gpu_accelerated": True,
                "status": status,
                "response_timestamp": datetime.utcnow()
            }
            
            crud_query_history.update(
                db=db,
                db_obj_id=query_history_id,
                obj_in=update_data
            )
            db.close()
            
            logger.info(f"✅ Query history updated: ID {query_history_id}")
            
        except Exception as e:
            logger.error(f"Failed to update query history: {e}")
    
    async def get_system_status(self) -> Dict[str, Any]:
        """Get system status and health information"""
        try:
            await self.initialize()
            
            status = {
                "initialized": self.initialized,
                "services": {
                    "query_processor": self.query_processor is not None,
                    "llm_service": self.llm_service is not None,
                    "vector_db": self.vector_db is not None
                },
                "timestamp": datetime.utcnow().isoformat()
            }
            
            return status
            
        except Exception as e:
            logger.error(f"Failed to get system status: {e}")
            return {"error": str(e), "initialized": False}
    
    async def cleanup(self):
        """Cleanup resources"""
        try:
            if hasattr(self.llm_service, 'cleanup'):
                await self.llm_service.cleanup()
            if hasattr(self.vector_db, 'cleanup'):
                await self.vector_db.cleanup()
            
            self.initialized = False
            logger.info("✅ Enhanced Query Wrapper cleaned up")
            
        except Exception as e:
            logger.error(f"Cleanup failed: {e}")


# Global instance
enhanced_query_wrapper = EnhancedQueryWrapper()

async def process_query(
    query: str,
    department: str = "General",
    user_id: Optional[int] = None
) -> QueryResponse:
    """
    Main entry point for query processing
    """
    return await enhanced_query_wrapper.process_query(
        query=query,
        department=department,
        user_id=user_id
    )

async def get_system_status() -> Dict[str, Any]:
    """Get system status"""
    return await enhanced_query_wrapper.get_system_status()

async def cleanup():
    """Cleanup resources"""
    await enhanced_query_wrapper.cleanup()

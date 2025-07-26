"""
Enhanced Query Wrapper with Pipeline Monitoring Integration
Integrates the existing query wrapper with the enhanced pipeline monitoring system
"""

import asyncio
import logging
import time
import uuid
from datetime import datetime
from typing import Dict, Any, Optional

from app.services.query_processor import QueryProcessor
from app.services.llm_service import LLMService
from app.services.vector_db import VectorDBService
from app.core.enhanced_pipeline_monitor import enhanced_pipeline_monitor
from app.crud.crud_query_history import create_query_history
from app.schemas.query import QueryHistoryCreate, QueryResponse, SourceDocument
from app.db.session import get_db

logger = logging.getLogger(__name__)

class EnhancedQueryWrapper:
    """
    Enhanced query wrapper that integrates with the pipeline monitoring system
    Provides real-time monitoring and metrics collection for all query operations
    """
    
    def __init__(self):
        self.query_processor = None
        self.llm_service = None
        self.vector_db = None
        self.is_initialized = False
        self.current_pipeline_id = None
        
        logger.info("🔧 Initializing Enhanced Query Wrapper with Monitoring...")
    
    async def initialize(self):
        """Initialize all services with monitoring"""
        if self.is_initialized:
            return
        
        try:
            # Initialize services
            self.query_processor = QueryProcessor()
            self.llm_service = LLMService()
            self.vector_db = VectorDBService()
            
            self.is_initialized = True
            logger.info("✅ Enhanced Query Wrapper initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize Enhanced Query Wrapper: {e}")
            raise
    
    async def process_query(self, query: str, department: str = "General", user_id: Optional[int] = None) -> QueryResponse:
        """
        Process a query with comprehensive monitoring and metrics collection
        
        Args:
            query: User query text
            department: Department filter for document search
            user_id: Optional user ID for tracking
            
        Returns:
            QueryResponse with AI response and source documents
        """
        # Generate unique pipeline ID for this query
        pipeline_id = f"query_{uuid.uuid4().hex[:8]}"
        self.current_pipeline_id = pipeline_id
        
        start_time = time.time()
        
        try:
            # Ensure services are initialized
            if not self.is_initialized:
                await self.initialize()
            
            logger.info(f"Processing query: {query[:50]}...")
            
            # Stage 1: Query Input Processing
            await self._record_stage_start(pipeline_id, 'query_input', {
                'query_length': len(query),
                'department': department,
                'user_id': user_id
            })
            
            # Validate and prepare query
            if not query or len(query.strip()) < 3:
                raise ValueError("Query too short")
            
            await self._record_stage_complete(pipeline_id, 'query_input', 0.1, True)
            
            # Stage 2: Embedding Generation
            await self._record_stage_start(pipeline_id, 'embedding')
            embedding_start = time.time()
            
            # Generate embeddings through query processor
            embedding_result = await self._safe_embedding_generation(query)
            
            embedding_time = time.time() - embedding_start
            await self._record_stage_complete(pipeline_id, 'embedding', embedding_time, True, {
                'embedding_dimensions': len(embedding_result.get('embedding', [])) if embedding_result else 0
            })
            
            # Stage 3: Vector Search
            await self._record_stage_start(pipeline_id, 'vector_search')
            search_start = time.time()
            
            # Perform vector search
            search_results = await self._safe_vector_search(query, department)
            
            search_time = time.time() - search_start
            await self._record_stage_complete(pipeline_id, 'vector_search', search_time, True, {
                'results_count': len(search_results) if search_results else 0
            })
            
            # Stage 4: Document Retrieval
            await self._record_stage_start(pipeline_id, 'document_retrieval')
            retrieval_start = time.time()
            
            # Process search results into source documents
            source_documents = await self._process_search_results(search_results)
            
            retrieval_time = time.time() - retrieval_start
            await self._record_stage_complete(pipeline_id, 'document_retrieval', retrieval_time, True, {
                'documents_retrieved': len(source_documents)
            })
            
            # Stage 5: Context Preparation
            await self._record_stage_start(pipeline_id, 'context_prep')
            context_start = time.time()
            
            # Prepare context for LLM
            context = await self._prepare_context(source_documents, query)
            
            context_time = time.time() - context_start
            await self._record_stage_complete(pipeline_id, 'context_prep', context_time, True, {
                'context_length': len(context)
            })
            
            # Stage 6: LLM Processing
            await self._record_stage_start(pipeline_id, 'llm_processing')
            llm_start = time.time()
            
            # Generate AI response
            ai_response = await self._safe_llm_generation(context, query)
            
            llm_time = time.time() - llm_start
            await self._record_stage_complete(pipeline_id, 'llm_processing', llm_time, True, {
                'response_length': len(ai_response) if ai_response else 0,
                'model': 'mistral-7b'
            })
            
            # Stage 7: Response Preparation
            await self._record_stage_start(pipeline_id, 'response')
            response_start = time.time()
            
            # Create final response
            total_time = time.time() - start_time
            response = QueryResponse(
                query=query,
                response=ai_response,
                model="mistral-7b",
                sources=source_documents,
                processing_time=total_time,
                gpu_accelerated=True
            )
            
            response_time = time.time() - response_start
            await self._record_stage_complete(pipeline_id, 'response', response_time, True)
            
            # Stage 8: History Logging
            await self._record_stage_start(pipeline_id, 'history_log')
            history_start = time.time()
            
            # Log to database
            await self._log_query_history(query, ai_response, source_documents, total_time, department, user_id)
            
            history_time = time.time() - history_start
            await self._record_stage_complete(pipeline_id, 'history_log', history_time, True)
            
            # Record overall metrics
            await self._record_query_metrics(total_time, True)
            
            logger.info(f"Query processed successfully in {total_time:.2f}s")
            return response
            
        except Exception as e:
            # Record error in current stage
            error_time = time.time() - start_time
            current_stage = self._get_current_stage_from_error(str(e))
            await self._record_stage_complete(pipeline_id, current_stage, error_time, False, {
                'error': str(e)
            })
            
            # Record failed query metrics
            await self._record_query_metrics(error_time, False)
            
            logger.error(f"❌ Query processing failed: {e}")
            
            # Return error response
            return QueryResponse(
                query=query,
                response="I apologize, but I encountered an error while generating a response.",
                model="mistral-7b",
                sources=[],
                processing_time=error_time,
                gpu_accelerated=False
            )
    
    async def _record_stage_start(self, pipeline_id: str, stage: str, data: Optional[Dict[str, Any]] = None):
        """Record the start of a pipeline stage"""
        enhanced_pipeline_monitor.record_stage_start(pipeline_id, stage, data)
    
    async def _record_stage_complete(self, pipeline_id: str, stage: str, processing_time: float, 
                                   success: bool = True, data: Optional[Dict[str, Any]] = None):
        """Record the completion of a pipeline stage"""
        enhanced_pipeline_monitor.record_stage_complete(pipeline_id, stage, processing_time, success, data)
    
    async def _safe_embedding_generation(self, query: str) -> Dict[str, Any]:
        """Safely generate embeddings with error handling"""
        try:
            # This would call the actual embedding generation
            # For now, return mock data
            return {
                'embedding': [0.1] * 384,  # Mock embedding
                'model': 'sentence-transformers/all-MiniLM-L6-v2'
            }
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            raise
    
    async def _safe_vector_search(self, query: str, department: str) -> list:
        """Safely perform vector search with error handling"""
        try:
            # Use the query processor for vector search
            result = await self.query_processor.process_query(query, department)
            return result.get('sources', [])
        except Exception as e:
            logger.error(f"Vector search failed: {e}")
            return []
    
    async def _process_search_results(self, search_results: list) -> list:
        """Process search results into SourceDocument objects"""
        source_documents = []
        
        for i, result in enumerate(search_results[:5]):  # Limit to top 5 results
            try:
                # Handle different result formats
                if isinstance(result, dict):
                    document_name = result.get('filename', result.get('document_name', f'Document_{i+1}'))
                    content = result.get('content', result.get('text', ''))
                    score = result.get('score', result.get('relevance_score', 0.0))
                else:
                    document_name = f'Document_{i+1}'
                    content = str(result)
                    score = 0.0
                
                source_doc = SourceDocument(
                    document_id=document_name,
                    document_name=document_name,
                    content_snippet=content[:500] if content else '',
                    relevance_score=float(score)
                )
                source_documents.append(source_doc)
                
            except Exception as e:
                logger.warning(f"Failed to process search result {i}: {e}")
                continue
        
        return source_documents
    
    async def _prepare_context(self, source_documents: list, query: str) -> str:
        """Prepare context string for LLM processing"""
        if not source_documents:
            return f"Query: {query}\n\nNo relevant documents found."
        
        context_parts = [f"Query: {query}", "\nRelevant Documents:"]
        
        for i, doc in enumerate(source_documents, 1):
            context_parts.append(f"\n{i}. {doc.document_name}")
            context_parts.append(f"   Content: {doc.content_snippet}")
            context_parts.append(f"   Relevance: {doc.relevance_score:.2f}")
        
        context_parts.append("\nPlease provide a comprehensive answer based on the above documents.")
        
        return "\n".join(context_parts)
    
    async def _safe_llm_generation(self, context: str, query: str) -> str:
        """Safely generate LLM response with error handling"""
        try:
            # Use the LLM service to generate response
            response = await self.llm_service.generate_response(prompt=context)
            return response if response else "I apologize, but I couldn't generate a response."
        except Exception as e:
            logger.error(f"LLM generation failed: {e}")
            return "I apologize, but I encountered an error while generating a response."
    
    async def _log_query_history(self, query: str, response: str, sources: list, 
                                processing_time: float, department: str, user_id: Optional[int]):
        """Log query history to database"""
        try:
            # Convert sources to the format expected by the database
            sources_list = []
            for source in sources:
                if hasattr(source, 'document_name'):
                    sources_list.append({
                        'document_name': source.document_name,
                        'relevance_score': source.relevance_score
                    })
                else:
                    sources_list.append(str(source))
            
            # Create query history entry
            query_history = QueryHistoryCreate(
                query_text=query,
                response_text=response,
                sources_retrieved=sources_list,
                processing_time=processing_time,
                model_used="mistral-7b",
                department=department,
                user_id=user_id,
                gpu_accelerated=True
            )
            
            # Get database session and create entry
            db = next(get_db())
            try:
                history_entry = create_query_history(db, query_history)
                logger.info(f"✅ Query history logged: ID {history_entry.id}")
            finally:
                db.close()
                
        except Exception as e:
            logger.error(f"Failed to log query history: {e}")
    
    async def _record_query_metrics(self, processing_time: float, success: bool):
        """Record query-level metrics"""
        try:
            # Calculate queries per minute (simplified)
            qpm = 60 / max(processing_time, 1)  # Rough estimate
            
            enhanced_pipeline_monitor.record_query_metrics(
                queries_per_minute=int(qpm),
                avg_response_time=processing_time,
                active_queries=1,  # This query
                queue_depth=0  # No queue implementation yet
            )
            
        except Exception as e:
            logger.error(f"Failed to record query metrics: {e}")
    
    def _get_current_stage_from_error(self, error_message: str) -> str:
        """Determine which stage failed based on error message"""
        error_lower = error_message.lower()
        
        if 'embedding' in error_lower:
            return 'embedding'
        elif 'vector' in error_lower or 'search' in error_lower:
            return 'vector_search'
        elif 'document' in error_lower or 'retrieval' in error_lower:
            return 'document_retrieval'
        elif 'context' in error_lower:
            return 'context_prep'
        elif 'llm' in error_lower or 'model' in error_lower:
            return 'llm_processing'
        elif 'response' in error_lower:
            return 'response'
        elif 'history' in error_lower or 'database' in error_lower:
            return 'history_log'
        else:
            return 'query_input'
    
    def get_health_status(self) -> Dict[str, Any]:
        """Get current health status of the query wrapper"""
        return {
            'initialized': self.is_initialized,
            'services': {
                'query_processor': self.query_processor is not None,
                'llm_service': self.llm_service is not None,
                'vector_db': self.vector_db is not None
            },
            'current_pipeline': self.current_pipeline_id,
            'timestamp': datetime.now().isoformat()
        }

# Global enhanced query wrapper instance
enhanced_query_wrapper = EnhancedQueryWrapper()

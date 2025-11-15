# File Path: /backend/app/services/query_processor.py
# Fixed version - corrected schema mappings and method signatures

import logging
from typing import List, Dict, Any, Optional
import time
import torch
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient, models
from app.core.config import settings
from app.core.pipeline_monitor import pipeline_monitor
from app.services.enhanced_llm_service import LLMService, enhanced_llm_service
from app.services.gpu_accelerator import GPUAccelerator

# FIXED: Changed from relative import to absolute import
from app.schemas.query import QueryResponse, SourceDocument, QueryHistoryCreate

from sqlalchemy.orm import Session
from app.crud.crud_query_history import create_query_history

logger = logging.getLogger(__name__)

class QueryProcessor:
    """Enhanced query processor with GPU acceleration and performance monitoring"""
    
    def __init__(self):
        self.embedding_model = None
        self.vector_client = None
        self.llm_service = None
        self.gpu_accelerator = None
        self._initialize_components()

    def _initialize_components(self):
        """Initialize all components with proper error handling"""
        try:
            # Initialize GPU accelerator first
            self.gpu_accelerator = GPUAccelerator()
            
            # Initialize embedding model with fallback
            device = "cuda" if torch.cuda.is_available() and settings.ENABLE_GPU else "cpu"
            try:
                self.embedding_model = SentenceTransformer(
                    settings.EMBEDDING_MODEL_NAME,  # Use from config
                    device=device
                )
                logger.info(f"Embedding model loaded on {device}")
            except Exception as e:
                logger.warning(f"Failed to load embedding model: {e}")
                # Use fallback model
                self.embedding_model = SentenceTransformer('all-MiniLM-L6-v2', device=device)
            
            # Initialize vector database client
            self.vector_client = QdrantClient(
                host=settings.QDRANT_HOST,
                port=settings.QDRANT_PORT
            )
            
            # Initialize LLM service with error handling
            try:
                self.llm_service = LLMService()
                logger.info("LLM service initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize LLM service: {e}")
                self.llm_service = None
            
            logger.info("Query processor initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize query processor: {str(e)}")
            raise

    def search_similar_documents(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Search for similar documents using vector similarity"""
        try:
            # Generate query embedding
            query_embedding = self.embedding_model.encode([query])[0]
            
            # Use configuration values for search parameters
            search_limit = limit if limit else getattr(settings, 'VECTOR_SEARCH_LIMIT', 5)
            search_threshold = getattr(settings, 'VECTOR_SEARCH_SCORE_THRESHOLD', 0.5)
            collection_name = settings.QDRANT_COLLECTION_NAME
            
            # Search in vector database using configured collection name
            search_results = self.vector_client.search(
                collection_name=collection_name,
                query_vector=query_embedding.tolist(),
                limit=search_limit,
                score_threshold=search_threshold,
                with_payload=True
            )
            
            # Format results to match expected structure with backward compatibility
            results = []
            for result in search_results:
                # FIXED: Handle both "content" (new) and "text" (old) for backward compatibility
                content = result.payload.get("content") or result.payload.get("text", "")
                
                results.append({
                    "content": content,  # FIXED: Standardized with backward compatibility
                    "filename": result.payload.get("filename", ""),   # Now available from payload
                    "chunk_index": result.payload.get("chunk_index", 0),
                    "score": result.score,
                    "department": result.payload.get("department", "General"),  # ADDED: Now available
                    "file_type": result.payload.get("file_type", "")  # ADDED: Now available
                })
            
            return results
            
        except Exception as e:
            logger.error(f"Document search failed: {str(e)}")
            return []

    def generate_response(self, query: str, context_docs: List[Dict[str, Any]]) -> str:
        """Generate response using LLM with retrieved context"""
        try:
            # Prepare context from retrieved documents
            context_text = "\n\n".join([
                f"Source: {doc['filename']}\nContent: {doc['content']}"
                for doc in context_docs
            ])
            
            # FIXED: Changed from query= to prompt= to match LLMService method signature
            response = self.llm_service.generate_response(
                prompt=query,
                context=context_text
            )
            
            return response
            
        except Exception as e:
            logger.error(f"Response generation failed: {str(e)}")
            return "I apologize, but I encountered an error while generating a response."

    def process_query(
        self, 
        query: str, 
        user_id: Optional[int] = None,
        department_filter: Optional[str] = None,
        db: Optional[Session] = None
    ) -> QueryResponse:
        """
        Process a user query and return response with sources
        
        Args:
            query: User's question
            user_id: Optional user ID for history tracking
            department_filter: Optional department filter
            db: Database session for history storage
            
        Returns:
            QueryResponse with answer and sources
        """
        start_time = time.time()
        
        try:
            # Search for relevant documents
            similar_docs = self.search_similar_documents(query, limit=5)
            
            # Generate response
            response_text = self.generate_response(query, similar_docs)
            
            # FIXED: Prepare source documents with correct schema mapping
            sources = []
            for doc in similar_docs:
                source_doc = SourceDocument(
                    document_id=doc.get("filename", f"doc_{len(sources) + 1}"),  # Map filename to document_id
                    document_name=doc.get("filename", "Unknown Document"),       # Map filename to document_name
                    relevance_score=doc.get("score", 0.0),
                    content_snippet=doc.get("content", "")[:200] + "..." if len(doc.get("content", "")) > 200 else doc.get("content", "")
                )
                sources.append(source_doc)
            
            processing_time = time.time() - start_time
            
            # Log query processing metrics
            pipeline_monitor.log_query_processed(
                query=query,
                processing_time=processing_time,
                sources_count=len(sources),
                success=True
            )
            
            # Store query history if database session provided
            if db and user_id:
                try:
                    query_history = QueryHistoryCreate(
                        query_text=query,
                        response_text=response_text,
                        llm_model_used=getattr(settings, 'LLM_MODEL_NAME', 'mistral-7b'),
                        sources_retrieved=[{"filename": doc["filename"], "score": doc["score"]} for doc in similar_docs],
                        processing_time_ms=int(processing_time * 1000),
                        department_filter=department_filter,
                        gpu_accelerated=getattr(settings, 'ENABLE_GPU', False)
                    )
                    create_query_history(db, query_history)
                except Exception as e:
                    logger.warning(f"Failed to store query history: {str(e)}")
            
            # FIXED: Return QueryResponse with correct field names
            return QueryResponse(
                query=query,                                                    # Correct field name
                response=response_text,                                         # Changed from 'answer' to 'response'
                model=getattr(settings, 'LLM_MODEL_NAME', 'mistral-7b'),      # Correct field name
                sources=sources,
                processing_time=processing_time,
                gpu_accelerated=getattr(settings, 'ENABLE_GPU', False),
                query_history_id=None  # Will be set if history is stored
            )
            
        except Exception as e:
            processing_time = time.time() - start_time
            error_msg = str(e)
            
            # Log query processing failure
            pipeline_monitor.log_query_processed(
                query=query,
                processing_time=processing_time,
                sources_count=0,
                success=False,
                error=error_msg
            )
            
            logger.error(f"Query processing failed: {error_msg}")
            
            # FIXED: Return error response with correct schema
            return QueryResponse(
                query=query,
                response="I apologize, but I encountered an error while processing your query.",
                model=getattr(settings, 'LLM_MODEL_NAME', 'mistral-7b'),
                sources=[],
                processing_time=processing_time,
                gpu_accelerated=False,
                query_history_id=None
            )

# Global processor instance
query_processor = QueryProcessor()

# Export the function for module-level access
__all__ = ['process_query', 'calculate_batch_size']

# === UPDATED PROCESS_QUERY FUNCTION ===
import logging
from typing import Optional
from sqlalchemy.orm import Session
from datetime import datetime

logger = logging.getLogger(__name__)

async def process_query(db, query_text, department, user_id=None, context_length=None):
    """Process a query using the RAG pipeline."""
    try:
        from app.schemas.query import QueryResponse, SourceDocument
    except ImportError:
        from pydantic import BaseModel
        from typing import List, Any
        class QueryResponse(BaseModel):
            query: str
            response: str  # FIXED: Changed from 'answer' to 'response'
            sources: List[Any] = []
            processing_time: float = 0.0
            model: str = "mistralai/Mistral-7B-Instruct-v0.2"  # FIXED: Changed from 'model_used' to 'model'
            gpu_accelerated: bool = False
            query_history_id: Optional[int] = None
    
    import time
    start_time = time.time()
    
    # Use the global query processor instance
    try:
        result = query_processor.process_query(
            query=query_text,
            user_id=user_id,
            department_filter=department,
            db=db
        )
        return result
    except Exception as e:
        logger.error(f"Query processing failed: {str(e)}")
        
        # FIXED: Return fallback response with correct schema
        return QueryResponse(
            query=query_text,
            response=f"I received your query: \"{query_text}\". This is a placeholder response while the full RAG pipeline is being configured.",
            sources=[],
            processing_time=round(time.time() - start_time, 3),
            model="mistralai/Mistral-7B-Instruct-v0.2",
            gpu_accelerated=False,
            query_history_id=None
        )

__all__ = ["process_query", "calculate_batch_size"]

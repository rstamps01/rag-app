# File: backend/app/services/integrated_vector_db_service.py
"""
Integrated Vector Database Service
Combines enhanced functionality with preserved original capabilities and error handling
"""

from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.models import Distance, VectorParams, PointStruct, HnswConfigDiff, OptimizersConfigDiff, PayloadSchemaType
from sentence_transformers import SentenceTransformer
from app.core.config import settings
import logging
import uuid
import hashlib
import os
from typing import Optional

logger = logging.getLogger(__name__ )

class IntegratedVectorDBService:
    """Enhanced vector database service with comprehensive error handling and preserved functionality"""
    
    def __init__(self):
        self.client = None
        self.embedding_model = None
        self.collection_name = getattr(settings, 'QDRANT_COLLECTION_NAME', 'rag')
        self.is_connected = False
        self.is_embedding_available = False
        self.initialize_services()
    
    def initialize_services(self):
        """Initialize Qdrant client and embedding model with comprehensive error handling"""
        try:
            # Get configuration with fallbacks (preserving original pattern)
            qdrant_url = getattr(settings, 'QDRANT_URL', 'http://qdrant-07:6333' )
            self.collection_name = getattr(settings, 'QDRANT_COLLECTION_NAME', 'rag')
            embedding_model_name = getattr(settings, 'EMBEDDING_MODEL_NAME', 'sentence-transformers/all-MiniLM-L6-v2')
            
            # Initialize Qdrant client with error handling
            try:
                self.client = QdrantClient(url=qdrant_url)
                
                # Test connection
                collections = self.client.get_collections()
                logger.info(f"✅ Qdrant connected: {len(collections.collections)} collections at {qdrant_url}")
                self.is_connected = True
                
            except Exception as e:
                logger.error(f"❌ Qdrant connection failed: {e}")
                self.client = None
                self.is_connected = False
            
            # Initialize embedding model with error handling
            try:
                self.embedding_model = SentenceTransformer(embedding_model_name)
                logger.info(f"✅ Embedding model loaded: {embedding_model_name}")
                self.is_embedding_available = True
                
            except Exception as e:
                logger.error(f"❌ Failed to load embedding model: {e}")
                self.embedding_model = None
                self.is_embedding_available = False
            
            # Ensure collection exists (with graceful handling)
            if self.is_connected:
                self._ensure_collection()
            
        except Exception as e:
            logger.error(f"❌ Vector DB initialization failed: {e}")
            self.is_connected = False
            self.is_embedding_available = False
    
    def _ensure_collection(self):
        """Ensure the required collection exists with enhanced error handling"""
        if not self.client:
            logger.warning("⚠️ Qdrant client not available, skipping collection setup")
            return
        
        try:
            collections = self.client.get_collections().collections
            collection_names = [c.name for c in collections]
            
            if self.collection_name not in collection_names:
                # Get HNSW parameters from config
                hnsw_m = getattr(settings, 'QDRANT_HNSW_M', 16)
                hnsw_ef_construct = getattr(settings, 'QDRANT_HNSW_EF_CONSTRUCT', 200)
                
                # Configure HNSW for optimized search performance
                hnsw_config = HnswConfigDiff(
                    m=hnsw_m,
                    ef_construct=hnsw_ef_construct,
                    full_scan_threshold=10000  # Use HNSW for collections > 10K points
                )
                
                # Optimizer config for large collections
                optimizer_config = OptimizersConfigDiff(
                    indexing_threshold=20000,  # Index after 20K vectors
                    memmap_threshold=50000,    # Use memory-mapped files after 50K
                    vacuum_threshold=0.2       # Vacuum when 20% deleted
                )
                
                # Create collection with optimized configuration
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=384,  # all-MiniLM-L6-v2 embedding size
                        distance=Distance.COSINE
                    ),
                    hnsw_config=hnsw_config,
                    optimizers_config=optimizer_config
                )
                logger.info(f"✅ Created collection: {self.collection_name} with HNSW config (m={hnsw_m}, ef_construct={hnsw_ef_construct})")
                
                # Create payload indexes for faster filtering
                self._create_payload_indexes()
            else:
                logger.info(f"✅ Collection exists: {self.collection_name}")
                # Ensure payload indexes exist even if collection already exists
                self._create_payload_indexes()
                
        except Exception as e:
            # Handle the specific case where collection already exists
            if "already exists" in str(e).lower():
                logger.info(f"✅ Collection already exists: {self.collection_name}")
                # Ensure payload indexes exist even if collection already existed
                self._create_payload_indexes()
            else:
                logger.error(f"❌ Collection setup failed: {e}")
    
    def _create_payload_indexes(self):
        """Create payload indexes for faster filtering by department, filename, file_type"""
        if not self.client:
            return
        
        try:
            # Index for department filtering (most common filter)
            try:
                self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name="department",
                    field_schema=PayloadSchemaType.KEYWORD
                )
                logger.info("✅ Created payload index for: department")
            except Exception as e:
                if "already exists" in str(e).lower() or "already exist" in str(e).lower():
                    logger.debug("Payload index for 'department' already exists")
                else:
                    logger.warning(f"Could not create department index: {e}")
            
            # Index for filename filtering
            try:
                self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name="filename",
                    field_schema=PayloadSchemaType.KEYWORD
                )
                logger.info("✅ Created payload index for: filename")
            except Exception as e:
                if "already exists" in str(e).lower() or "already exist" in str(e).lower():
                    logger.debug("Payload index for 'filename' already exists")
                else:
                    logger.warning(f"Could not create filename index: {e}")
            
            # Index for file_type filtering
            try:
                self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name="file_type",
                    field_schema=PayloadSchemaType.KEYWORD
                )
                logger.info("✅ Created payload index for: file_type")
            except Exception as e:
                if "already exists" in str(e).lower() or "already exist" in str(e).lower():
                    logger.debug("Payload index for 'file_type' already exists")
                else:
                    logger.warning(f"Could not create file_type index: {e}")
            
            # Index for processed_at (datetime) for date range queries
            try:
                self.client.create_payload_index(
                    collection_name=self.collection_name,
                    field_name="processed_at",
                    field_schema=PayloadSchemaType.FLOAT  # Store as timestamp
                )
                logger.info("✅ Created payload index for: processed_at")
            except Exception as e:
                if "already exists" in str(e).lower() or "already exist" in str(e).lower():
                    logger.debug("Payload index for 'processed_at' already exists")
                else:
                    logger.warning(f"Could not create processed_at index: {e}")
                    
        except Exception as e:
            logger.warning(f"Error creating payload indexes: {e}")
    
    def is_available(self) -> bool:
        """Check if vector database is available"""
        return self.is_connected and self.client is not None
    
    def is_embedding_ready(self) -> bool:
        """Check if embedding model is ready"""
        return self.is_embedding_available and self.embedding_model is not None
    
    def chunk_document(self, text: str, chunk_size: Optional[int] = None, overlap: Optional[int] = None) -> List[str]:
        """Split document into overlapping chunks with enhanced logic using configuration defaults"""
        if not text or not text.strip():
            return []
        
        # Use configuration values if not provided
        if chunk_size is None:
            chunk_size = getattr(settings, 'CHUNK_SIZE', 1000)
        if overlap is None:
            overlap = getattr(settings, 'CHUNK_OVERLAP', 200)
        
        chunks = []
        start = 0
        text_length = len(text)
        
        while start < text_length:
            end = start + chunk_size
            
            if end >= text_length:
                # Last chunk
                chunk = text[start:].strip()
                if chunk:
                    chunks.append(chunk)
                break
            
            chunk = text[start:end]
            
            # Try to break at sentence boundary for better semantic coherence
            if end < text_length:
                # Look for sentence endings
                sentence_endings = ['. ', '! ', '? ', '.\n', '!\n', '?\n']
                best_break = -1
                
                for ending in sentence_endings:
                    pos = chunk.rfind(ending)
                    if pos > chunk_size // 2:  # Don't break too early
                        best_break = max(best_break, pos + len(ending))
                
                if best_break > 0:
                    chunk = text[start:start + best_break]
                    end = start + best_break
                else:
                    # Try word boundary
                    last_space = chunk.rfind(' ')
                    if last_space > chunk_size // 2:
                        chunk = text[start:start + last_space]
                        end = start + last_space
            
            chunk = chunk.strip()
            if chunk:
                chunks.append(chunk)
            
            # Move start position with overlap
            start = end - overlap
            
            # Ensure we make progress
            if start <= 0:
                start = chunk_size
        
        logger.info(f"✅ Document chunked into {len(chunks)} pieces")
        return chunks
    
    def generate_embeddings(self, texts: List[str]) -> Optional[np.ndarray]:
        """Generate embeddings for text chunks with error handling"""
        if not self.is_embedding_ready():
            logger.warning("⚠️ Embedding model not available")
            return None
        
        if not texts:
            logger.warning("⚠️ No texts provided for embedding")
            return None
        
        try:
            embeddings = self.embedding_model.encode(texts)
            logger.info(f"✅ Generated embeddings for {len(texts)} texts")
            return embeddings
            
        except Exception as e:
            logger.error(f"❌ Embedding generation failed: {e}")
            return None
    
    def store_document_vectors(
        self, 
        document_id: str,  # Original field name preserved
        chunks: List[str], 
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Store document vectors in Qdrant with enhanced error handling"""
        if not self.is_available():
            logger.warning("⚠️ Vector database not available")
            return False
        
        if not chunks:
            logger.warning("⚠️ No chunks provided for vector storage")
            return False
        
        try:
            # Generate embeddings
            embeddings = self.generate_embeddings(chunks)
            if embeddings is None:
                return False
            
            # Create points for Qdrant
            points = []
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                point_id = str(uuid.uuid4())  # Use UUID for point ID to avoid conflicts
                
                # Standardized payload structure with complete metadata
                payload = {
                    "document_id": document_id,  # Original field name
                    "chunk_index": i,
                    "content": chunk,  # FIXED: Changed from "text" to "content" for consistency
                    "chunk_id": f"{document_id}_chunk_{i}",
                    "text_hash": hashlib.md5(chunk.encode()).hexdigest()
                }
                
                # Add additional metadata if provided (filename, department, file_type, etc.)
                if metadata:
                    payload.update(metadata)
                
                # Ensure minimum required metadata fields are present
                if "filename" not in payload:
                    payload["filename"] = "unknown"
                if "department" not in payload:
                    payload["department"] = "General"
                if "file_type" not in payload:
                    payload["file_type"] = "unknown"
                
                points.append(PointStruct(
                    id=point_id,
                    vector=embedding.tolist(),
                    payload=payload
                ))
            
            # Store in Qdrant with batch processing for large documents
            batch_size = 100
            for i in range(0, len(points), batch_size):
                batch = points[i:i + batch_size]
                self.client.upsert(
                    collection_name=self.collection_name,
                    points=batch
                )
            
            logger.info(f"✅ Stored {len(points)} vectors for document {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to store document vectors: {e}")
            return False
    
    def search_similar_documents(
        self, 
        query: str, 
        limit: Optional[int] = None, 
        score_threshold: Optional[float] = None,
        filter_conditions: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Search for similar documents with enhanced filtering and error handling"""
        if not self.is_available() or not self.is_embedding_ready():
            logger.warning("⚠️ Vector search not available")
            return []
        
        try:
            # Use configuration values if not provided
            if limit is None:
                limit = getattr(settings, 'VECTOR_SEARCH_LIMIT', 5)
            if score_threshold is None:
                score_threshold = getattr(settings, 'VECTOR_SEARCH_SCORE_THRESHOLD', 0.5)
            
            # Generate query embedding
            query_embedding = self.embedding_model.encode([query])[0]
            
            # Build filter if provided
            search_filter = None
            if filter_conditions:
                search_filter = models.Filter(
                    must=[
                        models.FieldCondition(
                            key=key,
                            match=models.MatchValue(value=value)
                        ) for key, value in filter_conditions.items()
                    ]
                )
            
            # Get HNSW ef parameter from config for search quality
            search_ef = getattr(settings, 'VECTOR_SEARCH_EF', 128)
            
            # Perform search with HNSW ef parameter for optimized quality
            search_results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding.tolist(),
                limit=limit,
                score_threshold=score_threshold,
                query_filter=search_filter,
                with_payload=True,
                search_params=models.SearchParams(
                    hnsw_ef=search_ef  # Use configured ef value for search quality
                )
            )
            
            # Format results with backward compatibility for "text" field
            results = []
            for result in search_results:
                # FIXED: Handle both "content" (new) and "text" (old) for backward compatibility
                content = result.payload.get("content") or result.payload.get("text", "")
                
                results.append({
                    "content": content,  # FIXED: Standardized to "content" with backward compatibility
                    "document_id": result.payload.get("document_id", ""),  # Original field name
                    "chunk_index": result.payload.get("chunk_index", 0),
                    "score": float(result.score),
                    "chunk_id": result.payload.get("chunk_id", ""),
                    "filename": result.payload.get("filename", ""),  # ADDED: Now available from payload
                    "department": result.payload.get("department", "General"),  # ADDED: Now available from payload
                    "file_type": result.payload.get("file_type", ""),  # ADDED: Now available from payload
                    "metadata": {k: v for k, v in result.payload.items() 
                               if k not in ["content", "text", "document_id", "chunk_index", "chunk_id", "filename", "department", "file_type"]}
                })
            
            logger.info(f"✅ Found {len(results)} similar documents for query")
            return results
            
        except Exception as e:
            logger.error(f"❌ Vector search failed: {e}")
            return []
    
    def search(
        self,
        query: str,
        limit: Optional[int] = None,
        department: Optional[str] = None,
        score_threshold: Optional[float] = None
    ) -> List[Dict[str, Any]]:
        """
        Alias for search_similar_documents with department filtering support.
        This method provides a simpler interface matching enhanced_vector_db_service API.
        """
        # Use configuration values if not provided
        if limit is None:
            limit = getattr(settings, 'VECTOR_SEARCH_LIMIT', 5)
        if score_threshold is None:
            score_threshold = getattr(settings, 'VECTOR_SEARCH_SCORE_THRESHOLD', 0.5)
        
        # Build filter conditions if department is provided
        filter_conditions = None
        if department and department != "General":
            filter_conditions = {"department": department}
        
        # Call the main search method
        return self.search_similar_documents(
            query=query,
            limit=limit,
            score_threshold=score_threshold,
            filter_conditions=filter_conditions
        )
    
    def delete_document_vectors(self, document_id: str) -> bool:
        """Delete all vectors for a specific document"""
        if not self.is_available():
            logger.warning("⚠️ Vector database not available")
            return False
        
        try:
            # Delete points by document_id filter
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=models.FilterSelector(
                    filter=models.Filter(
                        must=[
                            models.FieldCondition(
                                key="document_id",  # Original field name
                                match=models.MatchValue(value=document_id)
                            )
                        ]
                    )
                )
            )
            
            logger.info(f"✅ Deleted vectors for document {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to delete document vectors: {e}")
            return False
    
    def get_collection_info(self) -> Dict[str, Any]:
        """Get information about the vector collection"""
        if not self.is_available():
            return {"status": "unavailable", "error": "Vector database not connected"}
        
        try:
            collection_info = self.client.get_collection(self.collection_name)
            return {
                "status": "available",
                "collection_name": self.collection_name,
                "points_count": collection_info.points_count,
                "vectors_count": collection_info.vectors_count,
                "indexed_vectors_count": collection_info.indexed_vectors_count,
                "config": {
                    "vector_size": collection_info.config.params.vectors.size,
                    "distance": collection_info.config.params.vectors.distance.value
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Failed to get collection info: {e}")
            return {"status": "error", "error": str(e)}
    
    def health_check(self) -> Dict[str, Any]:
        """Comprehensive health check for vector database service"""
        return {
            "qdrant_connected": self.is_connected,
            "embedding_model_loaded": self.is_embedding_available,
            "collection_name": self.collection_name,
            "collection_info": self.get_collection_info() if self.is_available() else None,
            "service_ready": self.is_available() and self.is_embedding_ready()
        }

# Global integrated vector database service instance
integrated_vector_db_service = IntegratedVectorDBService()

# Alias for backward compatibility with enhanced_vector_db_service
enhanced_vector_db_service = integrated_vector_db_service

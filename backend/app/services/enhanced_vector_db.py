"""
Enhanced Vector Database Service
Provides document processing, embedding generation, and semantic search
"""

from typing import List, Dict, Any, Optional, Tuple
import numpy as np
from qdrant_client import QdrantClient
from qdrant_client.http import models
from qdrant_client.http.models import Distance, VectorParams, PointStruct
import logging
import uuid
import hashlib
import os

logger = logging.getLogger(__name__)

class EnhancedVectorDBService:
    """Enhanced vector database service with document processing"""
    
    def __init__(self):
        self.client = None
        self.embedding_model = None
        self.collection_name = "rag"
        self.is_connected = False
        self.initialize_services()
    
    def initialize_services(self):
        """Initialize Qdrant client and embedding model"""
        try:
            # Get configuration
            from app.core.config import settings
            qdrant_url = getattr(settings, 'QDRANT_URL', 'http://localhost:6333')
            self.collection_name = getattr(settings, 'QDRANT_COLLECTION_NAME', 'rag')
            embedding_model_name = getattr(settings, 'EMBEDDING_MODEL_NAME', 'sentence-transformers/all-MiniLM-L6-v2')
            
            # Initialize Qdrant client
            self.client = QdrantClient(url=qdrant_url)
            
            # Test connection
            collections = self.client.get_collections()
            logger.info(f"✅ Qdrant connected: {len(collections.collections)} collections")
            
            # Initialize embedding model
            try:
                from sentence_transformers import SentenceTransformer
                self.embedding_model = SentenceTransformer(embedding_model_name)
                logger.info(f"✅ Embedding model loaded: {embedding_model_name}")
            except Exception as e:
                logger.error(f"❌ Failed to load embedding model: {e}")
                self.embedding_model = None
            
            # Ensure collection exists
            self._ensure_collection()
            
            self.is_connected = True
            
        except Exception as e:
            logger.error(f"❌ Vector DB initialization failed: {e}")
            self.is_connected = False
    
    def _ensure_collection(self):
        """Ensure the required collection exists"""
        try:
            collections = self.client.get_collections().collections
            collection_names = [c.name for c in collections]
            
            if self.collection_name not in collection_names:
                # Create collection with proper vector configuration
                self.client.create_collection(
                    collection_name=self.collection_name,
                    vectors_config=VectorParams(
                        size=384,  # all-MiniLM-L6-v2 embedding size
                        distance=Distance.COSINE
                    )
                )
                logger.info(f"✅ Created collection: {self.collection_name}")
            else:
                logger.info(f"✅ Collection exists: {self.collection_name}")
                
        except Exception as e:
            logger.error(f"❌ Collection setup failed: {e}")
    
    def is_available(self) -> bool:
        """Check if vector database is available"""
        return self.is_connected and self.client is not None
    
    def chunk_document(self, text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
        """Split document into overlapping chunks"""
        if not text:
            return []
        
        chunks = []
        start = 0
        
        while start < len(text):
            end = start + chunk_size
            chunk = text[start:end]
            
            # Try to break at sentence boundary
            if end < len(text):
                last_period = chunk.rfind('.')
                last_newline = chunk.rfind('\n')
                break_point = max(last_period, last_newline)
                
                if break_point > start + chunk_size // 2:
                    chunk = text[start:break_point + 1]
                    end = break_point + 1
            
            chunks.append(chunk.strip())
            start = end - overlap
            
            if start >= len(text):
                break
        
        return [chunk for chunk in chunks if len(chunk.strip()) > 10]
    
    def generate_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for text chunks"""
        if not self.embedding_model:
            raise Exception("Embedding model not available")
        
        try:
            embeddings = self.embedding_model.encode(texts)
            return embeddings.tolist()
        except Exception as e:
            logger.error(f"Embedding generation failed: {e}")
            raise
    
    def process_document(
        self,
        document_id: str,
        filename: str,
        content: str,
        department: str = "General"
    ) -> bool:
        """Process document: chunk, embed, and store in vector database"""
        if not self.is_available():
            logger.error("Vector database not available")
            return False
        
        try:
            # Chunk the document
            chunks = self.chunk_document(content)
            if not chunks:
                logger.warning(f"No chunks generated for document {document_id}")
                return False
            
            logger.info(f"Generated {len(chunks)} chunks for document {document_id}")
            
            # Generate embeddings
            embeddings = self.generate_embeddings(chunks)
            
            # Prepare points for Qdrant
            points = []
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                point_id = str(uuid.uuid4())
                
                point = PointStruct(
                    id=point_id,
                    vector=embedding,
                    payload={
                        "document_id": document_id,
                        "filename": filename,
                        "chunk_index": i,
                        "content": chunk,
                        "department": department,
                        "chunk_hash": hashlib.md5(chunk.encode()).hexdigest()
                    }
                )
                points.append(point)
            
            # Store in Qdrant
            self.client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            
            logger.info(f"✅ Document {document_id} processed and stored ({len(points)} chunks)")
            return True
            
        except Exception as e:
            logger.error(f"❌ Document processing failed for {document_id}: {e}")
            return False
    
    def search(
        self,
        query: str,
        limit: int = 5,
        department: Optional[str] = None,
        score_threshold: float = 0.7
    ) -> List[Dict[str, Any]]:
        """Perform semantic search"""
        if not self.is_available():
            logger.error("Vector database not available")
            return []
        
        try:
            # Generate query embedding
            query_embedding = self.embedding_model.encode([query])[0].tolist()
            
            # Prepare search filter
            search_filter = None
            if department:
                search_filter = models.Filter(
                    must=[
                        models.FieldCondition(
                            key="department",
                            match=models.MatchValue(value=department)
                        )
                    ]
                )
            
            # Perform search
            search_results = self.client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                query_filter=search_filter,
                limit=limit,
                score_threshold=score_threshold
            )
            
            # Format results
            results = []
            for result in search_results:
                results.append({
                    "id": result.id,
                    "score": result.score,
                    "content": result.payload.get("content", ""),
                    "document_id": result.payload.get("document_id", ""),
                    "filename": result.payload.get("filename", ""),
                    "chunk_index": result.payload.get("chunk_index", 0),
                    "department": result.payload.get("department", "")
                })
            
            logger.info(f"✅ Vector search completed: {len(results)} results for query '{query[:50]}...'")
            return results
            
        except Exception as e:
            logger.error(f"❌ Vector search failed: {e}")
            return []
    
    def delete_document(self, document_id: str) -> bool:
        """Delete all chunks for a document"""
        if not self.is_available():
            return False
        
        try:
            # Delete points with matching document_id
            self.client.delete(
                collection_name=self.collection_name,
                points_selector=models.FilterSelector(
                    filter=models.Filter(
                        must=[
                            models.FieldCondition(
                                key="document_id",
                                match=models.MatchValue(value=document_id)
                            )
                        ]
                    )
                )
            )
            
            logger.info(f"✅ Document {document_id} deleted from vector database")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to delete document {document_id}: {e}")
            return False
    
    def get_collection_info(self) -> Dict[str, Any]:
        """Get collection information"""
        if not self.is_available():
            return {"status": "unavailable"}
        
        try:
            collection_info = self.client.get_collection(self.collection_name)
            return {
                "status": "available",
                "points_count": collection_info.points_count,
                "vectors_count": collection_info.vectors_count,
                "indexed_vectors_count": collection_info.indexed_vectors_count,
                "collection_name": self.collection_name
            }
        except Exception as e:
            logger.error(f"Failed to get collection info: {e}")
            return {"status": "error", "error": str(e)}

# Global enhanced vector database service instance
enhanced_vector_db_service = EnhancedVectorDBService()


from qdrant_client import QdrantClient
from qdrant_client.http import models
from typing import List, Dict, Any, Optional
import numpy as np
from app.core.config import settings

class VectorDBService:
    """Service for interacting with Qdrant vector database"""
    
    def __init__(self):
        self.client = QdrantClient(url=settings.QDRANT_URL)
        self._ensure_collections()
    
    def _ensure_collections(self):
        """Ensure required collections exist"""
        # Check if documents collection exists, create if not
        collections = self.client.get_collections().collections
        collection_names = [c.name for c in collections]
        
        if "documents" not in collection_names:
            self.client.create_collection(
                collection_name="documents",
                vectors_config=models.VectorParams(
                    size=768,  # Default embedding size
                    distance=models.Distance.COSINE
                )
            )
    
    def add_document_embeddings(self, document_id: str, chunks: List[Dict[str, Any]], embeddings: List[List[float]]):
        """
        Add document chunk embeddings to vector database
        
        Args:
            document_id: ID of the document
            chunks: List of document chunks with text and metadata
            embeddings: List of embedding vectors for each chunk
        """
        points = []
        for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
            points.append(
                models.PointStruct(
                    id=f"{document_id}_{i}",
                    vector=embedding,
                    payload={
                        "document_id": document_id,
                        "chunk_id": i,
                        "text": chunk["text"],
                        "metadata": chunk.get("metadata", {})
                    }
                )
            )
        
        self.client.upsert(
            collection_name="documents",
            points=points
        )
    
    def search_similar(self, query_embedding: List[float], limit: int = 5) -> List[Dict[str, Any]]:
        """
        Search for similar document chunks
        
        Args:
            query_embedding: Embedding vector of the query
            limit: Maximum number of results to return
            
        Returns:
            List of document chunks with similarity scores
        """
        results = self.client.search(
            collection_name="documents",
            query_vector=query_embedding,
            limit=limit
        )
        
        return [
            {
                "document_id": hit.payload["document_id"],
                "chunk_id": hit.payload["chunk_id"],
                "text": hit.payload["text"],
                "metadata": hit.payload.get("metadata", {}),
                "score": hit.score
            }
            for hit in results
        ]
    
    def delete_document(self, document_id: str):
        """
        Delete all chunks for a document
        
        Args:
            document_id: ID of the document to delete
        """
        self.client.delete(
            collection_name="documents",
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

import os
import uuid
import logging
from pathlib import Path
from typing import List, Dict, Any
import asyncio
import aiofiles
from fastapi import UploadFile
import asyncpg
import httpx
from sentence_transformers import SentenceTransformer
import PyPDF2
import io

class DocumentProcessor:
    def __init__(self):
        self.embedding_model = None
        self.db_pool = None
        self.qdrant_url = os.getenv("QDRANT_URL", "http://localhost:6333")
        self.collection_name = os.getenv("QDRANT_COLLECTION_NAME", "documents")
        
    async def initialize(self):
        """Initialize the document processor"""
        try:
            # Initialize embedding model
            self.embedding_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
            
            # Initialize database connection
            database_url = os.getenv("DATABASE_URL", "postgresql://rag:rag@postgres-07:5432/rag")
            self.db_pool = await asyncpg.create_pool(database_url)
            
            # Initialize Qdrant collection
            await self.ensure_qdrant_collection()
            
            logging.info("Document processor initialized successfully")
            
        except Exception as e:
            logging.error(f"Failed to initialize document processor: {e}")
            raise
    
    async def ensure_qdrant_collection(self):
        """Ensure Qdrant collection exists"""
        try:
            async with httpx.AsyncClient() as client:
                # Check if collection exists
                response = await client.get(f"{self.qdrant_url}/collections/{self.collection_name}")
                
                if response.status_code == 404:
                    # Create collection
                    collection_config = {
                        "vectors": {
                            "size": 384,  # all-MiniLM-L6-v2 embedding size
                            "distance": "Cosine"
                        }
                    }
                    
                    response = await client.put(
                        f"{self.qdrant_url}/collections/{self.collection_name}",
                        json=collection_config
                    )
                    
                    if response.status_code == 200:
                        logging.info(f"Created Qdrant collection: {self.collection_name}")
                    else:
                        logging.error(f"Failed to create Qdrant collection: {response.text}")
                        
        except Exception as e:
            logging.error(f"Error ensuring Qdrant collection: {e}")
    
    async def process_document(self, file: UploadFile, department: str = "General") -> Dict[str, Any]:
        """Process uploaded document"""
        try:
            # Generate unique ID
            doc_id = str(uuid.uuid4())
            
            # Save file
            upload_dir = Path("/app/uploads")
            upload_dir.mkdir(exist_ok=True)
            
            file_path = upload_dir / f"{doc_id}.{file.filename.split('.')[-1]}"
            
            async with aiofiles.open(file_path, 'wb') as f:
                content = await file.read()
                await f.write(content)
            
            # Extract text content
            text_content = await self.extract_text(file_path, file.content_type)
            
            # Create chunks
            chunks = self.create_chunks(text_content)
            
            # Generate embeddings and store in Qdrant
            await self.store_in_qdrant(doc_id, chunks)
            
            # Store metadata in PostgreSQL
            await self.store_in_postgres(doc_id, file.filename, file_path, len(content), department)
            
            return {
                "id": doc_id,
                "filename": file.filename,
                "size": len(content),
                "chunks": len(chunks),
                "status": "processed",
                "message": "Document processed successfully"
            }
            
        except Exception as e:
            logging.error(f"Error processing document: {e}")
            return {
                "id": doc_id if 'doc_id' in locals() else None,
                "filename": file.filename,
                "status": "error",
                "message": str(e)
            }
    
    async def extract_text(self, file_path: Path, content_type: str) -> str:
        """Extract text from document"""
        try:
            if content_type == "application/pdf":
                return await self.extract_pdf_text(file_path)
            elif content_type == "text/plain":
                async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                    return await f.read()
            else:
                # Try to read as text
                async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                    return await f.read()
                    
        except Exception as e:
            logging.error(f"Error extracting text: {e}")
            return ""
    
    async def extract_pdf_text(self, file_path: Path) -> str:
        """Extract text from PDF"""
        try:
            text = ""
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\n"
            return text
        except Exception as e:
            logging.error(f"Error extracting PDF text: {e}")
            return ""
    
    def create_chunks(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """Create text chunks for embedding"""
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
            
        return [chunk for chunk in chunks if chunk]
    
    async def store_in_qdrant(self, doc_id: str, chunks: List[str]):
        """Store document chunks in Qdrant"""
        try:
            points = []
            
            for i, chunk in enumerate(chunks):
                # Generate embedding
                embedding = self.embedding_model.encode(chunk).tolist()
                
                point = {
                    "id": f"{doc_id}_{i}",
                    "vector": embedding,
                    "payload": {
                        "document_id": doc_id,
                        "chunk_index": i,
                        "content": chunk,
                        "chunk_id": f"{doc_id}_{i}"
                    }
                }
                points.append(point)
            
            # Store in Qdrant
            async with httpx.AsyncClient() as client:
                response = await client.put(
                    f"{self.qdrant_url}/collections/{self.collection_name}/points",
                    json={"points": points}
                )
                
                if response.status_code == 200:
                    logging.info(f"Stored {len(points)} chunks in Qdrant for document {doc_id}")
                else:
                    logging.error(f"Failed to store in Qdrant: {response.text}")
                    
        except Exception as e:
            logging.error(f"Error storing in Qdrant: {e}")
    
    async def store_in_postgres(self, doc_id: str, filename: str, file_path: Path, size: int, department: str):
        """Store document metadata in PostgreSQL"""
        try:
            async with self.db_pool.acquire() as conn:
                await conn.execute("""
                    INSERT INTO documents (id, filename, file_path, size_bytes, department, status, created_at)
                    VALUES ($1, $2, $3, $4, $5, $6, NOW())
                    ON CONFLICT (id) DO UPDATE SET
                        filename = EXCLUDED.filename,
                        file_path = EXCLUDED.file_path,
                        size_bytes = EXCLUDED.size_bytes,
                        department = EXCLUDED.department,
                        status = EXCLUDED.status,
                        updated_at = NOW()
                """, doc_id, filename, str(file_path), size, department, "processed")
                
                logging.info(f"Stored document metadata in PostgreSQL: {doc_id}")
                
        except Exception as e:
            logging.error(f"Error storing in PostgreSQL: {e}")
    
    async def search_documents(self, query: str, limit: int = 5) -> List[Dict[str, Any]]:
        """Search documents using vector similarity"""
        try:
            # Generate query embedding
            query_embedding = self.embedding_model.encode(query).tolist()
            
            # Search in Qdrant
            async with httpx.AsyncClient() as client:
                search_request = {
                    "vector": query_embedding,
                    "limit": limit,
                    "with_payload": True
                }
                
                response = await client.post(
                    f"{self.qdrant_url}/collections/{self.collection_name}/points/search",
                    json=search_request
                )
                
                if response.status_code == 200:
                    results = response.json()["result"]
                    
                    # Format results
                    documents = []
                    for result in results:
                        documents.append({
                            "document_id": result["payload"]["document_id"],
                            "content": result["payload"]["content"],
                            "score": result["score"],
                            "chunk_id": result["payload"]["chunk_id"]
                        })
                    
                    return documents
                else:
                    logging.error(f"Qdrant search failed: {response.text}")
                    return []
                    
        except Exception as e:
            logging.error(f"Error searching documents: {e}")
            return []

# Global document processor instance
document_processor = DocumentProcessor()
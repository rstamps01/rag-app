# File: backend/app/services/integrated_document_processor.py
"""
Integrated Document Processing Service
Combines async processing capabilities with enhanced service layer architecture
"""

import os
import uuid
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
import asyncio
import aiofiles
from fastapi import UploadFile
import PyPDF2
import docx
import io
from app.services.integrated_database_service import integrated_database_service
from app.core.config import settings

logger = logging.getLogger(__name__)

class IntegratedDocumentProcessor:
    """Document processing service that preserves async capabilities and adds enhancements"""
    
    def __init__(self):
        self.database = integrated_database_service
        self.embedding_model = None
        self.qdrant_client = None
        self.qdrant_url = getattr(settings, 'QDRANT_URL', 'http://qdrant-07:6333' )
        self.collection_name = getattr(settings, 'QDRANT_COLLECTION_NAME', 'rag')
        self.upload_dir = Path(getattr(settings, 'UPLOAD_DIR', '/app/data/uploads'))
        self.is_initialized = False
        
    async def initialize(self):
        """Initialize the document processor with comprehensive error handling"""
        try:
            # Initialize embedding model
            try:
                from sentence_transformers import SentenceTransformer
                model_name = getattr(settings, 'EMBEDDING_MODEL_NAME', 'sentence-transformers/all-MiniLM-L6-v2')
                self.embedding_model = SentenceTransformer(model_name)
                logger.info(f"✅ Embedding model initialized: {model_name}")
            except Exception as e:
                logger.error(f"❌ Failed to initialize embedding model: {e}")
                self.embedding_model = None
            
            # Initialize Qdrant client
            try:
                from qdrant_client import QdrantClient
                self.qdrant_client = QdrantClient(url=self.qdrant_url)
                logger.info(f"✅ Qdrant client initialized: {self.qdrant_url}")
            except Exception as e:
                logger.error(f"❌ Failed to initialize Qdrant client: {e}")
                self.qdrant_client = None
            
            # Ensure Qdrant collection exists
            await self.ensure_qdrant_collection()
            
            # Ensure upload directory exists
            self.upload_dir.mkdir(parents=True, exist_ok=True)
            
            self.is_initialized = True
            logger.info("✅ Integrated document processor initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize document processor: {e}")
            self.is_initialized = False
            raise
    
    async def ensure_qdrant_collection(self):
        """Ensure Qdrant collection exists with proper error handling"""
        if not self.qdrant_client:
            logger.warning("⚠️ Qdrant client not available, skipping collection setup")
            return
        
        try:
            import httpx
            async with httpx.AsyncClient( ) as client:
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
                        logger.info(f"✅ Created Qdrant collection: {self.collection_name}")
                    else:
                        logger.error(f"❌ Failed to create Qdrant collection: {response.text}")
                elif response.status_code == 200:
                    logger.info(f"✅ Qdrant collection exists: {self.collection_name}")
                        
        except Exception as e:
            logger.error(f"❌ Error ensuring Qdrant collection: {e}")
    
    def extract_text(self, file_path: str, content_type: str) -> str:
        """Extract text from various document formats with enhanced error handling"""
        try:
            file_ext = Path(file_path).suffix.lower()
            
            if content_type == "application/pdf" or file_ext == '.pdf':
                return self._extract_pdf_text(file_path)
            elif content_type in [
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document", 
                "application/msword"
            ] or file_ext in ['.docx', '.doc']:
                return self._extract_docx_text(file_path)
            elif content_type == "text/plain" or file_ext in ['.txt', '.md']:
                return self._extract_txt_text(file_path)
            else:
                logger.warning(f"⚠️ Unsupported content type: {content_type}")
                return ""
                
        except Exception as e:
            logger.error(f"❌ Text extraction failed for {file_path}: {e}")
            return ""
    
    def _extract_pdf_text(self, file_path: str) -> str:
        """Extract text from PDF file with enhanced error handling"""
        text = ""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page_num, page in enumerate(pdf_reader.pages):
                    try:
                        page_text = page.extract_text()
                        if page_text:
                            text += page_text + "\n"
                    except Exception as e:
                        logger.warning(f"⚠️ Failed to extract text from page {page_num}: {e}")
                        continue
        except Exception as e:
            logger.error(f"❌ PDF extraction failed: {e}")
        return text.strip()
    
    def _extract_docx_text(self, file_path: str) -> str:
        """Extract text from DOCX file with enhanced error handling"""
        text = ""
        try:
            doc = docx.Document(file_path)
            for paragraph in doc.paragraphs:
                if paragraph.text.strip():
                    text += paragraph.text + "\n"
        except Exception as e:
            logger.error(f"❌ DOCX extraction failed: {e}")
        return text.strip()
    
    def _extract_txt_text(self, file_path: str) -> str:
        """Extract text from TXT file with enhanced error handling"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read().strip()
        except UnicodeDecodeError:
            try:
                with open(file_path, 'r', encoding='latin-1') as file:
                    return file.read().strip()
            except Exception as e:
                logger.error(f"❌ TXT extraction failed with latin-1: {e}")
        except Exception as e:
            logger.error(f"❌ TXT extraction failed: {e}")
        return ""
    
    def create_chunks(self, text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
        """Create overlapping text chunks with enhanced logic"""
        if not text or not text.strip():
            return []
        
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
            
            # Try to break at sentence boundary
            chunk_text = text[start:end]
            
            # Look for sentence endings
            sentence_endings = ['. ', '! ', '? ', '.\n', '!\n', '?\n']
            best_break = -1
            
            for ending in sentence_endings:
                pos = chunk_text.rfind(ending)
                if pos > chunk_size // 2:  # Don't break too early
                    best_break = max(best_break, pos + len(ending))
            
            if best_break > 0:
                chunk = text[start:start + best_break].strip()
                start = start + best_break - overlap
            else:
                # No good sentence break found, break at word boundary
                space_pos = chunk_text.rfind(' ')
                if space_pos > chunk_size // 2:
                    chunk = text[start:start + space_pos].strip()
                    start = start + space_pos - overlap
                else:
                    # Force break at chunk_size
                    chunk = chunk_text.strip()
                    start = end - overlap
            
            if chunk:
                chunks.append(chunk)
            
            # Ensure we make progress
            if start <= 0:
                start = chunk_size
        
        logger.info(f"✅ Created {len(chunks)} chunks from text ({len(text)} chars)")
        return chunks
    
    async def store_in_qdrant(self, document_id: str, chunks: List[str]) -> bool:
        """Store document chunks in Qdrant with enhanced error handling"""
        if not self.qdrant_client or not self.embedding_model or not chunks:
            logger.warning("⚠️ Qdrant storage skipped: missing client, model, or chunks")
            return False
        
        try:
            from qdrant_client.models import PointStruct
            
            # Generate embeddings for all chunks
            embeddings = self.embedding_model.encode(chunks)
            
            # Create points for Qdrant
            points = []
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                point_id = str(uuid.uuid4())  # Use UUID for point ID
                points.append(PointStruct(
                    id=point_id,
                    vector=embedding.tolist(),
                    payload={
                        "document_id": document_id,  # Original field name
                        "chunk_index": i,
                        "text": chunk,
                        "chunk_id": f"{document_id}_chunk_{i}"
                    }
                ))
            
            # Store in Qdrant
            self.qdrant_client.upsert(
                collection_name=self.collection_name,
                points=points
            )
            
            logger.info(f"✅ Stored {len(points)} vectors in Qdrant for document {document_id}")
            return True
            
        except Exception as e:
            logger.error(f"❌ Failed to store vectors in Qdrant: {e}")
            return False
    
    async def process_document(
        self, 
        file: UploadFile, 
        department: str = "General"
    ) -> Dict[str, Any]:
        """Process uploaded document with full async capabilities preserved"""
        try:
            # Generate unique document ID
            document_id = str(uuid.uuid4())  # Original field name pattern
            
            # Save file to disk
            file_path = self.upload_dir / f"{document_id}_{file.filename}"
            
            async with aiofiles.open(file_path, 'wb') as f:
                content = await file.read()
                await f.write(content)
            
            # Extract text content
            text_content = self.extract_text(str(file_path), file.content_type or "")
            
            if not text_content.strip():
                return {
                    "id": document_id,
                    "filename": file.filename,
                    "status": "error",
                    "message": "No text content could be extracted",
                    "size": len(content),
                    "department": department
                }
            
            # Store document metadata in database
            success = await self.database.store_document_async(
                document_id=document_id,  # Original field name
                filename=file.filename,
                file_path=str(file_path),
                size=len(content),
                department=department
            )
            
            if not success:
                logger.warning("⚠️ Failed to store document metadata, continuing with processing")
            
            # Create chunks and store in vector database (async)
            chunks = self.create_chunks(text_content)
            vector_success = await self.store_in_qdrant(document_id, chunks)
            
            # Update document status
            if vector_success:
                self.database.update_document_status(
                    document_id, 
                    "processed", 
                    f"Successfully processed {len(chunks)} chunks"
                )
                status = "processed"
                message = f"Document processed successfully with {len(chunks)} chunks"
            else:
                self.database.update_document_status(
                    document_id, 
                    "partial", 
                    "Text extracted but vector storage failed"
                )
                status = "partial"
                message = "Document processed but vector storage failed"
            
            return {
                "id": document_id,
                "filename": file.filename,
                "status": status,
                "message": message,
                "size": len(content),
                "department": department,
                "chunks_created": len(chunks),
                "vector_stored": vector_success,
                "text_length": len(text_content)
            }
            
        except Exception as e:
            logger.error(f"❌ Document processing failed: {e}")
            return {
                "id": document_id if 'document_id' in locals() else "unknown",
                "filename": file.filename,
                "status": "error",
                "message": f"Processing failed: {str(e)}",
                "size": 0,
                "department": department
            }
    
    def process_document_sync(
        self,
        document_id: str,
        filename: str,
        file_path: str,
        content_type: str,
        department: str = "General"
    ) -> Dict[str, Any]:
        """Synchronous document processing for compatibility with new architecture"""
        result = {
            "success": False,
            "document_id": document_id,  # Original field name
            "filename": filename,
            "text_extracted": False,
            "vector_stored": False,
            "database_updated": False,
            "error": None
        }
        
        try:
            # Step 1: Extract text
            logger.info(f"📄 Extracting text from {filename}")
            text_content = self.extract_text(file_path, content_type)
            
            if not text_content.strip():
                result["error"] = "No text content extracted"
                return result
            
            result["text_extracted"] = True
            logger.info(f"✅ Text extracted: {len(text_content)} characters")
            
            # Step 2: Create chunks
            chunks = self.create_chunks(text_content)
            if not chunks:
                result["error"] = "No chunks created from text"
                return result
            
            # Step 3: Store in vector database (sync version)
            if self.qdrant_client and self.embedding_model:
                try:
                    from qdrant_client.models import PointStruct
                    
                    # Generate embeddings
                    embeddings = self.embedding_model.encode(chunks)
                    
                    # Create points
                    points = []
                    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                        point_id = str(uuid.uuid4())
                        points.append(PointStruct(
                            id=point_id,
                            vector=embedding.tolist(),
                            payload={
                                "document_id": document_id,  # Original field name
                                "chunk_index": i,
                                "text": chunk,
                                "chunk_id": f"{document_id}_chunk_{i}"
                            }
                        ))
                    
                    # Store in Qdrant
                    self.qdrant_client.upsert(
                        collection_name=self.collection_name,
                        points=points
                    )
                    
                    result["vector_stored"] = True
                    logger.info(f"✅ Stored {len(points)} vectors in Qdrant")
                    
                except Exception as e:
                    logger.error(f"❌ Vector storage failed: {e}")
                    result["error"] = f"Vector storage failed: {str(e)}"
            
            # Step 4: Update database status
            status = "processed" if result["vector_stored"] else "partial"
            error_msg = None if result["vector_stored"] else "Vector storage failed"
            
            success = self.database.update_document_status(document_id, status, error_msg)
            result["database_updated"] = success
            
            result["success"] = result["text_extracted"] and (result["vector_stored"] or not self.qdrant_client)
            
            return result
            
        except Exception as e:
            logger.error(f"❌ Sync document processing failed: {e}")
            result["error"] = str(e)
            return result

# Global integrated document processor instance
integrated_document_processor = IntegratedDocumentProcessor()

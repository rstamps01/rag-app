# File Path: /backend/app/services/document_processor.py
# FIXED VERSION - Eliminates duplicate document creation and enables PDF processing

import os
import logging
from typing import List, Dict, Any, Optional, Tuple
import torch
import numpy as np
from qdrant_client import QdrantClient, models
from sentence_transformers import SentenceTransformer
from langchain.text_splitter import RecursiveCharacterTextSplitter

# Updated Langchain Community Imports
from langchain_community.document_loaders import (
    PyPDFLoader,
    TextLoader,
    Docx2txtLoader,
    CSVLoader
)

from app.core.config import settings
from app.core.pipeline_monitor import pipeline_monitor
from app.db.session import get_db

# FIXED: Import from documents.py instead of document.py to avoid circular import
from app.schemas.documents import DocumentCreate, DocumentUpdate

from sqlalchemy.orm import Session
import time
import uuid
import fitz  # PyMuPDF for PDF processing
import pytesseract
from PIL import Image
import io

logger = logging.getLogger(__name__)

# ENHANCED: Department validation constants
VALID_DEPARTMENTS = ["General", "IT", "HR", "Finance", "Legal"]

class DocumentProcessor:
    """FIXED: Enhanced document processor with OCR capabilities, GPU optimization, and department support"""
    
    def __init__(self):
        self.embedding_model = None
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=settings.CONTEXT_WINDOW_SIZE // 4,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        self.qdrant_client = None
        self._initialize_components()
        
    def _initialize_components(self):
        """Initialize embedding model and Qdrant client"""
        try:
            # Initialize embedding model with GPU support
            device = 'cuda' if torch.cuda.is_available() else 'cpu'
            logger.info(f"Initializing embedding model on device: {device}")
            
            self.embedding_model = SentenceTransformer(
                settings.EMBEDDING_MODEL_NAME,
                device=device
            )
            
            # Initialize Qdrant client
            self.qdrant_client = QdrantClient(
                host=settings.QDRANT_HOST,
                port=settings.QDRANT_PORT
            )
            
            # Ensure collection exists
            self._ensure_collection_exists()
            
            logger.info("Document processor initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize document processor: {str(e)}")
            raise
    
    def _ensure_collection_exists(self):
        """Ensure the Qdrant collection exists with proper configuration"""
        try:
            collections = self.qdrant_client.get_collections()
            collection_names = [col.name for col in collections.collections]
            
            if settings.QDRANT_COLLECTION_NAME not in collection_names:
                logger.info(f"Creating Qdrant collection: {settings.QDRANT_COLLECTION_NAME}")
                
                self.qdrant_client.create_collection(
                    collection_name=settings.QDRANT_COLLECTION_NAME,
                    vectors_config=models.VectorParams(
                        size=self.embedding_model.get_sentence_embedding_dimension(),
                        distance=models.Distance.COSINE
                    )
                )
                logger.info("Qdrant collection created successfully")
            else:
                logger.info(f"Qdrant collection {settings.QDRANT_COLLECTION_NAME} already exists")
                
        except Exception as e:
            logger.error(f"Failed to ensure collection exists: {str(e)}")
            raise

    def _extract_text_with_ocr(self, file_path: str, file_type: str) -> str:
        """FIXED: Extract text from documents using OCR when needed"""
        try:
            # FIXED: Handle content type properly - convert MIME types to extensions
            if file_type.lower() in ['application/pdf', 'pdf']:
                return self._extract_pdf_with_ocr(file_path)
            elif file_type.lower() in ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff', 'image/bmp', 'png', 'jpg', 'jpeg', 'tiff', 'bmp']:
                return self._extract_image_text(file_path)
            else:
                # For other file types, use standard text extraction
                return self._extract_standard_text(file_path, file_type)
                
        except Exception as e:
            logger.error(f"OCR extraction failed for {file_path}: {str(e)}")
            return ""

    def _extract_pdf_with_ocr(self, file_path: str) -> str:
        """Extract text from PDF using PyMuPDF with OCR fallback"""
        text_content = []
        
        try:
            doc = fitz.open(file_path)
            
            for page_num in range(len(doc)):
                page = doc.load_page(page_num)
                
                # Try to extract text directly first
                text = page.get_text()
                
                if text.strip():
                    text_content.append(text)
                else:
                    # If no text found, use OCR on the page image
                    logger.info(f"No text found on page {page_num + 1}, using OCR")
                    
                    # Render page as image
                    pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better OCR
                    img_data = pix.tobytes("png")
                    
                    # Convert to PIL Image and apply OCR
                    image = Image.open(io.BytesIO(img_data))
                    ocr_text = pytesseract.image_to_string(image)
                    
                    if ocr_text.strip():
                        text_content.append(ocr_text)
                        logger.info(f"OCR extracted {len(ocr_text)} characters from page {page_num + 1}")
            
            doc.close()
            
            full_text = "\n".join(text_content)
            logger.info(f"PDF text extraction completed: {len(full_text)} characters extracted")
            return full_text
            
        except Exception as e:
            logger.error(f"PDF extraction failed for {file_path}: {str(e)}")
            return ""

    def _extract_image_text(self, file_path: str) -> str:
        """Extract text from image files using OCR"""
        try:
            image = Image.open(file_path)
            text = pytesseract.image_to_string(image)
            logger.info(f"Image OCR completed: {len(text)} characters extracted")
            return text
            
        except Exception as e:
            logger.error(f"Image OCR failed for {file_path}: {str(e)}")
            return ""

    def _extract_standard_text(self, file_path: str, file_type: str) -> str:
        """FIXED: Extract text using standard document loaders with proper content type handling"""
        try:
            # FIXED: Handle both MIME types and file extensions
            if file_type.lower() in ['application/pdf', 'pdf']:
                loader = PyPDFLoader(file_path)
            elif file_type.lower() in ['text/plain', 'txt']:
                loader = TextLoader(file_path)
            elif file_type.lower() in ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'doc', 'docx']:
                loader = Docx2txtLoader(file_path)
            elif file_type.lower() in ['text/csv', 'csv']:
                loader = CSVLoader(file_path)
            else:
                logger.warning(f"Unsupported file type: {file_type}")
                return ""
            
            documents = loader.load()
            return "\n".join([doc.page_content for doc in documents])
            
        except Exception as e:
            logger.error(f"Standard text extraction failed: {str(e)}")
            return ""

    def process_document(self, file_path: str, filename: str, content_type: str, department: str = "General") -> Dict[str, Any]:
        """
        FIXED: Process document without creating duplicate database records
        
        Args:
            file_path: Path to the document file
            filename: Name of the document
            content_type: MIME type of the document
            department: Department for categorization
            
        Returns:
            Dictionary with processing results
        """
        start_time = time.time()
        
        try:
            # ENHANCED: Validate department
            if department not in VALID_DEPARTMENTS:
                logger.warning(f"Invalid department '{department}', defaulting to 'General'")
                department = "General"
            
            logger.info(f"Processing document {filename} for department: {department}")
            
            # Extract text content with OCR support
            text_content = self._extract_text_with_ocr(file_path, content_type)
            
            if not text_content or len(text_content.strip()) == 0:
                raise ValueError("No text content extracted from document")
            
            # Split text into chunks
            chunks = self.text_splitter.split_text(text_content)
            
            if not chunks:
                raise ValueError("No chunks created from document text")
            
            # Generate embeddings for chunks
            embeddings = self.embedding_model.encode(chunks)
            
            # Store in Qdrant vector database
            points = []
            for i, (chunk, embedding) in enumerate(zip(chunks, embeddings)):
                point_id = str(uuid.uuid4())
                
                points.append(models.PointStruct(
                    id=point_id,
                    vector=embedding.tolist(),
                    payload={
                        "filename": filename,
                        "chunk_index": i,
                        "content": chunk,
                        "content_type": content_type,
                        "department": department  # ENHANCED: Department stored in vector DB
                    }
                ))
            
            # Batch insert into Qdrant
            self.qdrant_client.upsert(
                collection_name=settings.QDRANT_COLLECTION_NAME,
                points=points
            )
            
            processing_time = time.time() - start_time
            
            # FIXED: Log processing metrics with correct parameters
            pipeline_monitor.log_document_processed(
                filename=filename,
                processing_time=processing_time,
                chunk_count=len(chunks),
                success=True,
                metadata={"department": department}  # ENHANCED: Include department in metrics
            )
            
            return {
                "status": "completed",
                "chunks_processed": len(chunks),
                "processing_time": processing_time,
                "text_length": len(text_content),
                "department": department  # ENHANCED: Return department info
            }
            
        except Exception as e:
            processing_time = time.time() - start_time
            error_msg = str(e)
            
            # FIXED: Log processing failure with correct parameters
            pipeline_monitor.log_document_processed(
                filename=filename,
                processing_time=processing_time,
                chunk_count=0,
                success=False,
                error=error_msg,
                metadata={"department": department}
            )
            
            logger.error(f"Document processing failed for {filename} (dept: {department}): {error_msg}")
            
            return {
                "status": "failed",
                "error": error_msg,
                "processing_time": processing_time,
                "department": department
            }

# Create global instance
document_processor = DocumentProcessor()

def process_and_store_document(file_path: str, filename: str, content_type: str, db: Session, department: str = "General") -> Dict[str, Any]:
    """
    FIXED: Process and store document WITHOUT creating duplicate database records
    
    This function now only handles the document processing and vector storage.
    Database record management is handled by the calling documents route.
    
    Args:
        file_path: Path to the uploaded file
        filename: Original filename
        content_type: MIME type of the file
        db: Database session (for compatibility, but not used for creation)
        department: Department for categorization
        
    Returns:
        Dictionary with processing results including document_id from caller
    """
    try:
        # FIXED: Only process the document, don't create database records
        # The documents route handles database record creation and management
        
        # Process document with vector database storage
        result = document_processor.process_document(file_path, filename, content_type, department)
        
        # ENHANCED: Add department to result
        result["department"] = department
        
        return {
            "processing_result": result,
            "department": department
        }
        
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Failed to process and store document {filename} (dept: {department}): {error_msg}")
        
        return {
            "processing_result": {
                "status": "failed",
                "error": error_msg,
                "processing_time": 0.0,
                "department": department
            },
            "department": department
        }

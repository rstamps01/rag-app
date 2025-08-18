# File: backend/app/services/document_processor.py
"""
Document Processing Service
Handles document upload, text extraction, and vector storage
"""

import os
import logging
from typing import Optional, Dict, Any
import PyPDF2
import docx
from app.services.enhanced_vector_db import enhanced_vector_db_service
from app.services.database_service import database_service

logger = logging.getLogger(__name__)

class DocumentProcessor:
    """Document processing service for RAG pipeline"""
    
    def __init__(self):
        self.vector_db = enhanced_vector_db_service
        self.database = database_service
    

        """Extract text from various document formats"""
        try:
            if content_type == "application/pdf" or file_path.endswith('.pdf'):
                return self._extract_pdf_text(file_path)
            elif content_type in ["application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"] or file_path.endswith(('.docx', '.doc')):
                return self._extract_docx_text(file_path)
            elif content_type == "text/plain" or file_path.endswith('.txt'):
                return self._extract_txt_text(file_path)
            else:
                logger.warning(f"Unsupported content type: {content_type}")
                return ""
        except Exception as e:
            logger.error(f"Text extraction failed for {file_path}: {e}")
            return ""
    
    def _extract_pdf_text(self, file_path: str) -> str:
        """Extract text from PDF file"""
        text = ""
        try:
            with open(file_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                for page in pdf_reader.pages:
                    text += page.extract_text() + "\\n"
        except Exception as e:
            logger.error(f"PDF extraction failed: {e}")
        return text
    
    def _extract_docx_text(self, file_path: str) -> str:
        """Extract text from DOCX file"""
        text = ""
        try:
            doc = docx.Document(file_path)
            for paragraph in doc.paragraphs:
                text += paragraph.text + "\\n"
        except Exception as e:
            logger.error(f"DOCX extraction failed: {e}")
        return text
    
    def _extract_txt_text(self, file_path: str) -> str:
        """Extract text from TXT file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return file.read()
        except Exception as e:
            logger.error(f"TXT extraction failed: {e}")
            return ""
    
    def process_document(
        self,
        document_id: str,
        filename: str,
        file_path: str,
        content_type: str,
        department: str = "General"
    ) -> Dict[str, Any]:
        """Complete document processing pipeline"""
        result = {
            "success": False,
            "document_id": document_id,
            "filename": filename,
            "text_extracted": False,
            "vector_stored": False,
            "database_updated": False,
            "error": None
        }
        
        try:
            # Step 1: Extract text
            logger.info(f"Extracting text from {filename}")
            text_content = self.extract_text(file_path, content_type)
            
            if not text_content.strip():
                result["error"] = "No text content extracted"
                return result
            
            result["text_extracted"] = True
            result["text_length"] = len(text_content)
            
            # Step 2: Process with vector database
            if self.vector_db.is_available():
                logger.info(f"Processing document for vector storage: {document_id}")
                vector_success = self.vector_db.process_document(
                    document_id=document_id,
                    filename=filename,
                    content=text_content,
                    department=department
                )
                result["vector_stored"] = vector_success
                
                if vector_success:
                    # Update document status in database
                    if self.database.is_available():
                        self.database.update_document_status(document_id, "processed")
                        result["database_updated"] = True
                else:
                    if self.database.is_available():
                        self.database.update_document_status(
                            document_id, 
                            "failed", 
                            "Vector processing failed"
                        )
            else:
                result["error"] = "Vector database not available"
                if self.database.is_available():
                    self.database.update_document_status(
                        document_id, 
                        "failed", 
                        "Vector database unavailable"
                    )
            
            result["success"] = result["text_extracted"] and result["vector_stored"]
            
        except Exception as e:
            logger.error(f"Document processing failed for {document_id}: {e}")
            result["error"] = str(e)
            
            # Update database with error status
            if self.database.is_available():
                self.database.update_document_status(document_id, "failed", str(e))
        
        return result

# Global document processor instance
document_processor = DocumentProcessor()
# File: backend/app/services/database_service.py
"""
Database Service Layer
Provides high-level database operations for the RAG application
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from app.models.models import User, Document, QueryHistory
from app.db.enhanced_session import db_manager
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class DatabaseService:
    """High-level database service for RAG operations"""
    
    def __init__(self):
        self.db_manager = db_manager
    
    def is_available(self) -> bool:
        """Check if database is available"""
        return self.db_manager.is_connected
    
    # Query History Operations
    def store_query(
        self,
        query_text: str,
        response_text: str,
        model_used: str,
        processing_time_ms: int,
        department: str = "General",
        user_id: Optional[int] = None,
        sources: Optional[List[Dict]] = None
    ) -> Optional[int]:
        """Store query in database"""
        if not self.is_available():
            return None
        
        try:
            with self.db_manager.get_session() as db:
                query_record = QueryHistory(
                    user_id=user_id,
                    query_text=query_text,
                    response_text=response_text,
                    llm_model_used=model_used,
                    processing_time_ms=processing_time_ms,
                    department_filter=department,
                    sources_retrieved=sources,
                    gpu_accelerated=True
                )
                
                db.add(query_record)
                db.commit()
                db.refresh(query_record)
                
                logger.info(f"Query stored with ID: {query_record.id}")
                return query_record.id
                
        except Exception as e:
            logger.error(f"Failed to store query: {e}")
            return None
    
    def get_query_history(
        self,
        skip: int = 0,
        limit: int = 10,
        user_id: Optional[int] = None,
        department: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get query history from database"""
        if not self.is_available():
            return {"queries": [], "total": 0, "source": "unavailable"}
        
        try:
            with self.db_manager.get_session() as db:
                query = db.query(QueryHistory)
                
                # Apply filters
                if user_id:
                    query = query.filter(QueryHistory.user_id == user_id)
                if department:
                    query = query.filter(QueryHistory.department_filter == department)
                
                # Get total count
                total = query.count()
                
                # Apply pagination and ordering
                queries = query.order_by(desc(QueryHistory.query_timestamp)).offset(skip).limit(limit).all()
                
                # Convert to dict format
                query_list = []
                for q in queries:
                    query_list.append({
                        "id": q.id,
                        "query": q.query_text,
                        "response": q.response_text,
                        "department": q.department_filter or "General",
                        "timestamp": q.query_timestamp.timestamp() if q.query_timestamp else 0,
                        "model": q.llm_model_used or "unknown",
                        "processing_time": q.processing_time_ms / 1000.0 if q.processing_time_ms else None,
                        "sources": q.sources_retrieved or []
                    })
                
                return {
                    "queries": query_list,
                    "total": total,
                    "source": "database"
                }
                
        except Exception as e:
            logger.error(f"Failed to get query history: {e}")
            return {"queries": [], "total": 0, "source": "error"}
    
    # Document Operations
    def store_document(
        self,
        document_id: str,
        filename: str,
        content_type: str,
        size: int,
        file_path: str,
        department: str = "General",
        status: str = "uploaded"
    ) -> bool:
        """Store document metadata in database"""
        if not self.is_available():
            return False
        
        try:
            with self.db_manager.get_session() as db:
                document = Document(
                    id=document_id,
                    filename=filename,
                    content_type=content_type,
                    size=size,
                    path=file_path,
                    department=department,
                    status=status
                )
                
                db.add(document)
                db.commit()
                
                logger.info(f"Document stored: {document_id}")
                return True
                
        except Exception as e:
            logger.error(f"Failed to store document: {e}")
            return False
    
    def get_documents(
        self,
        skip: int = 0,
        limit: int = 100,
        department: Optional[str] = None,
        status: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get documents from database"""
        if not self.is_available():
            return {"documents": [], "total": 0, "source": "unavailable"}
        
        try:
            with self.db_manager.get_session() as db:
                query = db.query(Document)
                
                # Apply filters
                if department:
                    query = query.filter(Document.department == department)
                if status:
                    query = query.filter(Document.status == status)
                
                # Get total count
                total = query.count()
                
                # Apply pagination and ordering
                documents = query.order_by(desc(Document.upload_date)).offset(skip).limit(limit).all()
                
                # Convert to dict format
                doc_list = []
                for doc in documents:
                    doc_list.append({
                        "id": doc.id,
                        "filename": doc.filename,
                        "upload_date": doc.upload_date.isoformat() if doc.upload_date else "",
                        "size": doc.size or 0,
                        "status": doc.status,
                        "department": doc.department,
                        "content_type": doc.content_type
                    })
                
                return {
                    "documents": doc_list,
                    "total": total,
                    "source": "database"
                }
                
        except Exception as e:
            logger.error(f"Failed to get documents: {e}")
            return {"documents": [], "total": 0, "source": "error"}
    
    def update_document_status(self, document_id: str, status: str, error_message: str = None) -> bool:
        """Update document processing status"""
        if not self.is_available():
            return False
        
        try:
            with self.db_manager.get_session() as db:
                document = db.query(Document).filter(Document.id == document_id).first()
                if document:
                    document.status = status
                    if error_message:
                        document.error_message = error_message
                    db.commit()
                    logger.info(f"Document {document_id} status updated to {status}")
                    return True
                
        except Exception as e:
            logger.error(f"Failed to update document status: {e}")
        
        return False

# Global database service instance
database_service = DatabaseService()
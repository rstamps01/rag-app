# File Path: /backend/app/crud/crud_document.py
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional, List, Dict, Any
from datetime import datetime

# Fixed imports - use direct imports instead of package imports
from app.models.models import Document
from app.schemas.documents import DocumentCreate, DocumentUpdate

import logging
import uuid

logger = logging.getLogger(__name__)

def get_document(db: Session, doc_id: str) -> Optional[Document]:
    """
    Retrieve a document by its ID.
    
    Args:
        db: Database session
        doc_id: Document ID
        
    Returns:
        Document object if found, None otherwise
    """
    try:
        return db.query(Document).filter(Document.id == doc_id).first()
    except Exception as e:
        logger.error(f"Error retrieving document {doc_id}: {str(e)}")
        return None

def get_document_by_filename(db: Session, filename: str) -> Optional[Document]:
    """
    Retrieve a document by its filename.
    
    Args:
        db: Database session
        filename: Document filename
        
    Returns:
        Document object if found, None otherwise
    """
    try:
        return db.query(Document).filter(Document.filename == filename).first()
    except Exception as e:
        logger.error(f"Error retrieving document by filename {filename}: {str(e)}")
        return None

def get_documents(
    db: Session, 
    skip: int = 0, 
    limit: int = 100,
    department: Optional[str] = None
) -> List[Document]:
    """
    Retrieve multiple documents with optional filtering.
    
    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        department: Optional department filter
        
    Returns:
        List of Document objects
    """
    try:
        query = db.query(Document)
        
        if department:
            query = query.filter(Document.department == department)
            
        return query.offset(skip).limit(limit).all()
    except Exception as e:
        logger.error(f"Error retrieving documents: {str(e)}")
        return []

def get_documents_with_ocr(db: Session) -> List[Document]:
    """
    Retrieve documents that have been processed with OCR.
    
    Args:
        db: Database session
        
    Returns:
        List of Document objects with OCR processing
    """
    try:
        return db.query(Document).filter(
            Document.status.in_(["completed", "ocr_processed"])
        ).all()
    except Exception as e:
        logger.error(f"Error retrieving OCR documents: {str(e)}")
        return []

def count_documents_with_ocr(db: Session) -> int:
    """
    Count documents that have been processed with OCR.
    
    Args:
        db: Database session
        
    Returns:
        Number of documents with OCR processing
    """
    try:
        return db.query(Document).filter(
            Document.status.in_(["completed", "ocr_processed"])
        ).count()
    except Exception as e:
        logger.error(f"Error counting OCR documents: {str(e)}")
        return 0

def create_document(db: Session, obj_in: DocumentCreate) -> Document:
    """
    Create a new document record.
    
    Args:
        db: Database session
        obj_in: Document creation data
        
    Returns:
        Created Document object
    """
    try:
        db_obj = Document(
            id=str(uuid.uuid4()),
            filename=obj_in.filename,
            content_type=obj_in.content_type,
            upload_date=datetime.utcnow(),
            status="uploaded"
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        logger.info(f"Created document: {db_obj.id}")
        return db_obj
    except Exception as e:
        logger.error(f"Error creating document: {str(e)}")
        db.rollback()
        raise

def update_document(
    db: Session, db_obj: Document, obj_in: DocumentUpdate
) -> Document:
    """
    Update an existing document record.
    
    Args:
        db: Database session
        db_obj: Existing document object
        obj_in: Update data
        
    Returns:
        Updated Document object
    """
    try:
        update_data = obj_in.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            if hasattr(db_obj, field):
                setattr(db_obj, field, value)
        
        db.commit()
        db.refresh(db_obj)
        logger.info(f"Updated document: {db_obj.id}")
        return db_obj
    except Exception as e:
        logger.error(f"Error updating document {db_obj.id}: {str(e)}")
        db.rollback()
        raise

def delete_document(db: Session, doc_id: str) -> bool:
    """
    Delete a document record.
    
    Args:
        db: Database session
        doc_id: Document ID to delete
        
    Returns:
        True if deleted successfully, False otherwise
    """
    try:
        db_obj = db.query(Document).filter(Document.id == doc_id).first()
        if db_obj:
            db.delete(db_obj)
            db.commit()
            logger.info(f"Deleted document: {doc_id}")
            return True
        return False
    except Exception as e:
        logger.error(f"Error deleting document {doc_id}: {str(e)}")
        db.rollback()
        return False

def get_document_stats(db: Session) -> Dict[str, Any]:
    """
    Get document statistics.
    
    Args:
        db: Database session
        
    Returns:
        Dictionary containing document statistics
    """
    try:
        total_docs = db.query(Document).count()
        completed_docs = db.query(Document).filter(Document.status == "completed").count()
        failed_docs = db.query(Document).filter(Document.status == "failed").count()
        processing_docs = db.query(Document).filter(Document.status == "processing").count()
        
        return {
            "total_documents": total_docs,
            "completed_documents": completed_docs,
            "failed_documents": failed_docs,
            "processing_documents": processing_docs,
            "success_rate": (completed_docs / total_docs * 100) if total_docs > 0 else 0
        }
    except Exception as e:
        logger.error(f"Error getting document stats: {str(e)}")
        return {
            "total_documents": 0,
            "completed_documents": 0,
            "failed_documents": 0,
            "processing_documents": 0,
            "success_rate": 0
        }

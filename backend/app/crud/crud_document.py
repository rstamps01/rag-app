# File Path: /home/ubuntu/rag-app-analysis/rag-app/backend/app/crud/crud_document.py
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from typing import Optional, List, Dict, Any
from datetime import datetime
from app import models, schemas
import logging
import uuid

logger = logging.getLogger(__name__)

def get_document(db: Session, doc_id: str) -> Optional[models.Document]:
    """
    Retrieve a document by its ID.
    
    Args:
        db: Database session
        doc_id: Document ID
        
    Returns:
        Document object or None if not found
    """
    return db.query(models.Document).filter(models.Document.id == doc_id).first()

def get_document_by_filename(db: Session, filename: str) -> Optional[models.Document]:
    """
    Retrieve a document by its filename.
    
    Args:
        db: Database session
        filename: Document filename
        
    Returns:
        Document object or None if not found
    """
    return db.query(models.Document).filter(models.Document.filename == filename).first()

def get_documents(
    db: Session, skip: int = 0, limit: int = 100
) -> List[models.Document]:
    """
    Fetches all documents with pagination.
    
    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        
    Returns:
        List of Document objects
    """
    return (
        db.query(models.Document)
        .order_by(desc(models.Document.upload_date))
        .offset(skip)
        .limit(limit)
        .all()
    )

def count_all_documents(db: Session) -> int:
    """
    Counts all documents in the database.
    
    Args:
        db: Database session
        
    Returns:
        Total count of documents
    """
    return db.query(func.count(models.Document.id)).scalar() or 0

def get_documents_by_department(
    db: Session, department: str, skip: int = 0, limit: int = 100
) -> List[models.Document]:
    """
    Fetches documents filtered by department with pagination.
    
    Args:
        db: Database session
        department: Department name to filter by
        skip: Number of records to skip
        limit: Maximum number of records to return
        
    Returns:
        List of Document objects
    """
    # Ensure department is queried in lowercase if stored in lowercase
    department_lower = department.lower()
    return (
        db.query(models.Document)
        .filter(models.Document.department == department_lower)
        .order_by(desc(models.Document.upload_date))
        .offset(skip)
        .limit(limit)
        .all()
    )

def count_documents_by_department(db: Session, department: str) -> int:
    """
    Counts documents filtered by department.
    
    Args:
        db: Database session
        department: Department name to filter by
        
    Returns:
        Count of documents in the specified department
    """
    # Ensure department is queried in lowercase if stored in lowercase
    department_lower = department.lower()
    return (
        db.query(func.count(models.Document.id))
        .filter(models.Document.department == department_lower)
        .scalar() or 0
    )

def create_document(db: Session, obj_in: schemas.DocumentCreate) -> models.Document:
    """
    Creates a new document record.
    
    Args:
        db: Database session
        obj_in: Document creation data
        
    Returns:
        Created Document object
    """
    try:
        # Generate a UUID for the document if not provided
        doc_id = str(uuid.uuid4())
        
        # Ensure department is stored in lowercase
        db_document_data = obj_in.model_dump()
        if 'department' in db_document_data and db_document_data['department']:
            db_document_data['department'] = db_document_data['department'].lower()
        else:
            # Handle cases where department might be None or empty
            db_document_data['department'] = 'general'  # Default department
            
        # Create the document object
        db_document = models.Document(id=doc_id, **db_document_data)
        
        # Add to database
        db.add(db_document)
        db.commit()
        db.refresh(db_document)
        
        logger.info(f"Created document record: {db_document.id} for department {db_document.department}")
        return db_document
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating document record: {str(e)}", exc_info=True)
        raise

def update_document(
    db: Session, db_obj: models.Document, obj_in: schemas.DocumentUpdate
) -> models.Document:
    """
    Updates an existing document.
    
    Args:
        db: Database session
        db_obj: Existing document object
        obj_in: Document update data
        
    Returns:
        Updated Document object
    """
    try:
        # Get update data, excluding unset fields
        update_data = obj_in.model_dump(exclude_unset=True)
        
        # Normalize department to lowercase if present
        if 'department' in update_data and update_data['department']:
            update_data['department'] = update_data['department'].lower()
        
        # Update the document object
        for field, value in update_data.items():
            setattr(db_obj, field, value)
        
        # Update last_updated timestamp
        db_obj.last_updated = datetime.now()
        
        # Commit changes
        db.commit()
        db.refresh(db_obj)
        
        logger.info(f"Updated document record: {db_obj.id}")
        return db_obj
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating document record: {str(e)}", exc_info=True)
        raise

def update_document_status(
    db: Session, doc_id: str, status: str, error_message: Optional[str] = None
) -> Optional[models.Document]:
    """
    Updates the status of a document.
    
    Args:
        db: Database session
        doc_id: Document ID
        status: New status
        error_message: Optional error message
        
    Returns:
        Updated Document object or None if not found
    """
    try:
        db_doc = get_document(db, doc_id=doc_id)
        if db_doc:
            db_doc.status = status
            db_doc.error_message = error_message
            db_doc.last_updated = datetime.now()
            
            db.commit()
            db.refresh(db_doc)
            
            logger.info(f"Updated status for document {doc_id} to {status}. Error: {error_message}")
            return db_doc
        else:
            logger.warning(f"Attempted to update status for non-existent document: {doc_id}")
            return None
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error updating document status: {str(e)}", exc_info=True)
        raise

def delete_document(db: Session, doc_id: str) -> Optional[models.Document]:
    """
    Deletes a document.
    
    Args:
        db: Database session
        doc_id: Document ID
        
    Returns:
        Deleted Document object or None if not found
    """
    try:
        db_doc = get_document(db, doc_id=doc_id)
        if db_doc:
            db.delete(db_doc)
            db.commit()
            
            logger.info(f"Deleted document record: {doc_id}")
            return db_doc
        else:
            logger.warning(f"Attempted to delete non-existent document record: {doc_id}")
            return None
    
    except Exception as e:
        db.rollback()
        logger.error(f"Error deleting document record: {str(e)}", exc_info=True)
        raise

def get_documents_with_ocr(
    db: Session, skip: int = 0, limit: int = 100
) -> List[models.Document]:
    """
    Fetches documents that have OCR applied.
    
    Args:
        db: Database session
        skip: Number of records to skip
        limit: Maximum number of records to return
        
    Returns:
        List of Document objects with OCR applied
    """
    return (
        db.query(models.Document)
        .filter(models.Document.ocr_applied == True)
        .order_by(desc(models.Document.upload_date))
        .offset(skip)
        .limit(limit)
        .all()
    )

def count_documents_with_ocr(db: Session) -> int:
    """
    Counts documents that have OCR applied.
    
    Args:
        db: Database session
        
    Returns:
        Count of documents with OCR applied
    """
    return (
        db.query(func.count(models.Document.id))
        .filter(models.Document.ocr_applied == True)
        .scalar() or 0
    )

def get_document_stats(db: Session) -> Dict[str, Any]:
    """
    Gets statistics about documents in the database.
    
    Args:
        db: Database session
        
    Returns:
        Dictionary with document statistics
    """
    total_count = count_all_documents(db)
    ocr_count = count_documents_with_ocr(db)
    
    # Get department counts
    department_counts = (
        db.query(
            models.Document.department,
            func.count(models.Document.id).label('count')
        )
        .group_by(models.Document.department)
        .all()
    )
    
    # Convert to dictionary
    departments = {dept: count for dept, count in department_counts}
    
    # Get status counts
    status_counts = (
        db.query(
            models.Document.status,
            func.count(models.Document.id).label('count')
        )
        .group_by(models.Document.status)
        .all()
    )
    
    # Convert to dictionary
    statuses = {status: count for status, count in status_counts}
    
    return {
        "total_count": total_count,
        "ocr_count": ocr_count,
        "departments": departments,
        "statuses": statuses
    }

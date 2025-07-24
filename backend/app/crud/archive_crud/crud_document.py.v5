# File Path: /home/ubuntu/rag_app_extracted/rag-app/backend/app/crud/crud_document.py
from sqlalchemy.orm import Session
from sqlalchemy import func, desc # Added desc for ordering
from app import models, schemas # Assuming schemas.DocumentCreate is defined
import logging

logger = logging.getLogger(__name__)

def get_document(db: Session, doc_id: str) -> models.Document | None:
    return db.query(models.Document).filter(models.Document.id == doc_id).first()

def get_documents(
    db: Session, skip: int = 0, limit: int = 100
) -> list[models.Document]:
    """Fetches all documents with pagination."""
    return (
        db.query(models.Document)
        .order_by(desc(models.Document.upload_date))
        .offset(skip)
        .limit(limit)
        .all()
    )

def count_all_documents(db: Session) -> int:
    """Counts all documents in the database."""
    return db.query(func.count(models.Document.id)).scalar() or 0

def get_documents_by_department(
    db: Session, department: str, skip: int = 0, limit: int = 100
) -> list[models.Document]:
    # Ensure department is queried in lowercase if stored in lowercase
    department_lower = department.lower()
    return (
        db.query(models.Document)
        .filter(models.Document.department == department_lower) # Query with lowercase
        .order_by(desc(models.Document.upload_date))
        .offset(skip)
        .limit(limit)
        .all()
    )

def count_documents_by_department(db: Session, department: str) -> int:
    # Ensure department is queried in lowercase if stored in lowercase
    department_lower = department.lower()
    return (
        db.query(func.count(models.Document.id))
        .filter(models.Document.department == department_lower) # Query with lowercase
        .scalar() or 0
    )

def create_document(db: Session, document_data: schemas.DocumentCreate) -> models.Document:
    # Ensure department is stored in lowercase
    # model_dump() is preferred over dict()
    db_document_data = document_data.model_dump()
    if 'department' in db_document_data and db_document_data['department']:
        db_document_data['department'] = db_document_data['department'].lower()
    else:
        # Handle cases where department might be None or empty if your schema allows
        db_document_data['department'] = None # Or a default value like 'general'
        
    db_document = models.Document(**db_document_data)
    db.add(db_document)
    db.commit()
    db.refresh(db_document)
    logger.info(f"Created document record: {db_document.id} for department {db_document.department}")
    return db_document

def update_document_status(
    db: Session, doc_id: str, status: str, error_message: str | None = None
) -> models.Document | None:
    db_doc = get_document(db, doc_id=doc_id)
    if db_doc:
        db_doc.status = status
        db_doc.error_message = error_message # This field was added to the model
        db.commit()
        db.refresh(db_doc)
        logger.info(f"Updated status for document {doc_id} to {status}. Error: {error_message}")
    else:
        logger.warning(f"Attempted to update status for non-existent document: {doc_id}")
    return db_doc

def delete_document(db: Session, doc_id: str) -> models.Document | None:
    db_doc = get_document(db, doc_id=doc_id)
    if db_doc:
        db.delete(db_doc)
        db.commit()
        logger.info(f"Deleted document record: {doc_id}")
        return db_doc
    else:
        logger.warning(f"Attempted to delete non-existent document record: {doc_id}")
        return None

# Placeholder for a function to update document details beyond just status
def update_document_details(
    db: Session, doc_id: str, document_update: schemas.DocumentUpdate
) -> models.Document | None:
    db_doc = get_document(db, doc_id=doc_id)
    if db_doc:
        update_data = document_update.model_dump(exclude_unset=True)
        if 'department' in update_data and update_data['department']:
            update_data['department'] = update_data['department'].lower()
            
        for key, value in update_data.items():
            setattr(db_doc, key, value)
        db.commit()
        db.refresh(db_doc)
        logger.info(f"Updated details for document {doc_id}")
        return db_doc
    logger.warning(f"Attempted to update details for non-existent document: {doc_id}")
    return None


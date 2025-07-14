"""
Corrected Documents Route - GitHub Codebase Compatible
Fixes all identified issues while maintaining existing functionality
"""

from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, status, Form, Depends
from typing import List, Optional, Dict, Any
import os
import uuid
import time
import logging
from pathlib import Path
from datetime import datetime

# CORRECTED: Add proper database imports
from sqlalchemy.orm import Session
from app.db.session import get_db

# CORRECTED: Add proper CRUD and schema imports
from app.crud.crud_document import create_document, update_document, get_document, get_documents
from app.schemas.documents import DocumentCreate, DocumentUpdate

# Import the document processor with CORRECT signature
from app.services.document_processor import process_and_store_document

# Import database models
from app.models.models import Document

# Pydantic models for API responses
from pydantic import BaseModel, Field

# CORRECTED: DocumentMetadata with field mapping for compatibility
class DocumentMetadata(BaseModel):
    """
    Frontend-compatible schema that maps database fields to expected field names
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    department: str = "General"
    content_type: Optional[str] = None
    file_size: int  # Maps from db.size
    upload_time: float = Field(default_factory=lambda: datetime.now().timestamp())  # Maps from db.upload_date
    status: str = "pending"
    path: Optional[str] = None
    error_message: Optional[str] = None

    @classmethod
    def from_db_document(cls, db_doc: Document, department: str = "General"):
        """Convert database Document to frontend-compatible DocumentMetadata"""
        return cls(
            id=db_doc.id,
            filename=db_doc.filename,
            department=department or db_doc.department or "General",
            content_type=db_doc.content_type,
            file_size=db_doc.size or 0,  # Map size → file_size
            upload_time=db_doc.upload_date.timestamp() if db_doc.upload_date else time.time(),  # Map upload_date → upload_time
            status=db_doc.status or "pending",
            path=db_doc.path,
            error_message=db_doc.error_message
        )

class DocumentList(BaseModel):
    """Compatible document list response"""
    documents: List[DocumentMetadata]
    total_count: int

logger = logging.getLogger(__name__)

router = APIRouter()

# Valid departments (preserved from existing implementation)
VALID_DEPARTMENTS = ["General", "IT", "HR", "Finance", "Legal"]

# Global placeholder database for status tracking (preserved for compatibility)
documents_db = {}

async def process_document_pipeline(
    doc_id: str, 
    file_path: str, 
    filename: str, 
    content_type: str,
    department: str,
    db_document_id: str
):
    """
    CORRECTED: Background task with proper function signature and database integration
    """
    print(f"--- PRINT: [BACKGROUND TASK process_document_pipeline ENTRY] doc_id: {doc_id}, file: {filename}, department: {department} ---")
    logger.info(f"--- LOGGER: [BACKGROUND TASK process_document_pipeline ENTRY] doc_id: {doc_id}, file: {filename}, department: {department} ---")
    
    global documents_db
    processing_start_time = time.time()
    
    # Create new database session for background task
    from app.db.session import SessionLocal
    db = SessionLocal()
    
    try:
        logger.info(f"[{doc_id}] Inside try block of process_document_pipeline.")
        
        # 1. Update Status to Processing (both systems)
        if doc_id in documents_db:
            documents_db[doc_id]["status"] = "processing"
            documents_db[doc_id]["department"] = department
            logger.info(f"[{doc_id}] Status set to 'processing' and department set to '{department}' in placeholder DB.")
        
        # Update database status
        db_document = get_document(db, db_document_id)
        if db_document:
            document_update = DocumentUpdate(status="processing")
            update_document(db, db_document, document_update)
            logger.info(f"[{doc_id}] Status set to 'processing' in database.")

        # 2. CORRECTED: Call the function with the ACTUAL GitHub signature
        logger.info(f"[{doc_id}] Attempting to call document_processor.process_and_store_document for file: {file_path}")
        
        # Call with GitHub codebase signature: (file_path, filename, content_type, db)
        result = process_and_store_document(
            file_path=file_path,
            filename=filename,
            content_type=content_type,
            db=db
        )
        
        logger.info(f"[{doc_id}] Successfully called process_and_store_document with GitHub-compatible signature")
        logger.info(f"[{doc_id}] Processing result: {result}")

        # 3. CORRECTED: Handle department separately (since it's not in the main function)
        if department and department != "General":
            db_document = get_document(db, db_document_id)
            if db_document:
                department_update = DocumentUpdate(department=department)
                update_document(db, db_document, department_update)
                logger.info(f"[{doc_id}] Department '{department}' updated in database.")

        # 4. Update Status to Completed (both systems)
        if doc_id in documents_db:
            documents_db[doc_id]["status"] = "completed"
            processing_time = time.time() - processing_start_time
            logger.info(f"[{doc_id}] Status set to 'completed' in placeholder DB. Processing time: {processing_time:.2f}s")
        
        # Update database status
        db_document = get_document(db, db_document_id)
        if db_document:
            completion_update = DocumentUpdate(status="completed")
            update_document(db, db_document, completion_update)
            logger.info(f"[{doc_id}] Status set to 'completed' in database.")

    except Exception as e:
        error_msg = f"[BACKGROUND TASK] Unhandled error in processing pipeline for doc_id {doc_id}: {e}"
        logger.error(error_msg, exc_info=True)
        print(f"--- PRINT: [BACKGROUND TASK process_document_pipeline ERROR] doc_id: {doc_id}, error: {e} ---")
        
        # Update error status in both systems
        if doc_id in documents_db:
            documents_db[doc_id]["status"] = "failed"
            documents_db[doc_id]["error_message"] = str(e)
            logger.info(f"[{doc_id}] Status set to 'failed' in placeholder DB due to unhandled error.")
        
        # Update database error status
        try:
            db_document = get_document(db, db_document_id)
            if db_document:
                error_update = DocumentUpdate(status="failed", error_message=str(e))
                update_document(db, db_document, error_update)
                logger.info(f"[{doc_id}] Status set to 'failed' in database.")
        except Exception as db_error:
            logger.error(f"[{doc_id}] Failed to update database error status: {db_error}")
    
    finally:
        # Always close the database session
        db.close()
        logger.info(f"--- LOGGER: [BACKGROUND TASK process_document_pipeline EXIT] doc_id: {doc_id} ---")
        print(f"--- PRINT: [BACKGROUND TASK process_document_pipeline EXIT] doc_id: {doc_id} ---")

@router.post("/", response_model=DocumentMetadata, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    department: str = Form(default="General"),
    db: Session = Depends(get_db)  # CORRECTED: Add database dependency
):
    """
    CORRECTED: Upload document with proper GitHub codebase integration
    """
    logger.info(f"--- API POST /documents - Received file: {file.filename}, Department: {department} ---")
    
    # Validate department (preserved from existing implementation)
    if department not in VALID_DEPARTMENTS:
        logger.warning(f"Invalid department '{department}', defaulting to 'General'")
        department = "General"
    
    # Generate unique document ID
    doc_id = str(uuid.uuid4())
    
    # Create upload directory if it doesn't exist
    upload_dir = Path("/app/data/uploads")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Save file with unique name
    unique_filename = f"{doc_id}_{file.filename}"
    file_path = upload_dir / unique_filename
    
    try:
        # Save uploaded file
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        file_size = len(content)
        upload_time = time.time()
        content_type = file.content_type or "application/octet-stream"
        logger.info(f"[{doc_id}] File saved: {file_path}, size: {file_size}")
        
        # CORRECTED: Create document in database using GitHub codebase CRUD
        document_create = DocumentCreate(
            filename=file.filename,
            content_type=content_type
        )
        
        db_document = create_document(db, document_create)
        logger.info(f"[{doc_id}] Document created in database with ID: {db_document.id}")
        
        # Store metadata in placeholder DB for compatibility
        documents_db[doc_id] = {
            "id": doc_id,
            "filename": file.filename,
            "department": department,
            "content_type": content_type,
            "file_size": file_size,
            "upload_time": upload_time,
            "status": "pending",
            "path": str(file_path),
            "error_message": None,
            "db_document_id": db_document.id  # Link to database record
        }
        
        logger.info(f"[{doc_id}] Initial metadata saved to placeholder DB with department: {department}.")
        
        # CORRECTED: Add background task with all required parameters
        logger.info(f"[{doc_id}] Adding background task for file: {file_path}")
        background_tasks.add_task(
            process_document_pipeline,
            doc_id=doc_id,
            file_path=str(file_path),
            filename=file.filename,
            content_type=content_type,
            department=department,
            db_document_id=db_document.id
        )
        logger.info(f"[{doc_id}] Successfully added background task.")
        
        # Return frontend-compatible metadata
        return DocumentMetadata(
            id=doc_id,
            filename=file.filename,
            department=department,
            content_type=content_type,
            file_size=file_size,
            upload_time=upload_time,
            status="pending",
            path=str(file_path)
        )
        
    except Exception as e:
        logger.error(f"[{doc_id}] Error uploading document: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading document: {str(e)}"
        )

@router.get("/", response_model=DocumentList)
async def list_documents(
    skip: int = 0, 
    limit: int = 100,
    department: Optional[str] = None,
    db: Session = Depends(get_db)  # CORRECTED: Add database dependency
):
    """
    CORRECTED: List documents from both database and filesystem with proper integration
    """
    try:
        # Get documents from database (GitHub codebase approach)
        db_documents = get_documents(db, skip=skip, limit=limit, department=department)
        
        documents = []
        
        # Convert database documents to frontend-compatible format
        for db_doc in db_documents:
            doc_metadata = DocumentMetadata.from_db_document(db_doc, db_doc.department)
            documents.append(doc_metadata)
        
        # Also check placeholder DB for any additional documents
        for doc_id, doc_data in documents_db.items():
            # Only add if not already in database results
            if not any(d.id == doc_id for d in documents):
                documents.append(DocumentMetadata(**doc_data))
        
        # Apply pagination to combined results
        paginated_docs = documents[skip:skip + limit]
        total_count = len(documents)
        
        logger.info(f"API GET /documents - Listing documents, skip={skip}, limit={limit}, returning {len(paginated_docs)} of {total_count}")
        return DocumentList(documents=paginated_docs, total_count=total_count)
        
    except Exception as e:
        logger.error(f"Error listing documents: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error listing documents: {str(e)}"
        )

@router.get("/departments")
async def get_departments():
    """
    Get list of available departments (preserved from existing implementation)
    """
    return {
        "departments": VALID_DEPARTMENTS
    }

@router.get("/{document_id}", response_model=DocumentMetadata)
async def get_document_by_id(
    document_id: str,
    db: Session = Depends(get_db)
):
    """
    CORRECTED: Get document by ID from database or placeholder
    """
    try:
        # First try database
        db_document = get_document(db, document_id)
        if db_document:
            return DocumentMetadata.from_db_document(db_document, db_document.department)
        
        # Fallback to placeholder DB
        if document_id in documents_db:
            return DocumentMetadata(**documents_db[document_id])
        
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error retrieving document {document_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error retrieving document: {str(e)}"
        )

@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str,
    db: Session = Depends(get_db)
):
    """
    CORRECTED: Delete document from both database and filesystem
    """
    try:
        # Delete from database
        from app.crud.crud_document import delete_document as crud_delete_document
        db_deleted = crud_delete_document(db, document_id)
        
        # Delete from placeholder DB
        placeholder_deleted = False
        if document_id in documents_db:
            file_path = documents_db[document_id].get("path")
            if file_path and os.path.exists(file_path):
                try:
                    os.remove(file_path)
                    logger.info(f"[{document_id}] Deleted file: {file_path}")
                except Exception as e:
                    logger.error(f"[{document_id}] Failed to delete file {file_path}: {e}")
            
            del documents_db[document_id]
            placeholder_deleted = True
            logger.info(f"[{document_id}] Deleted from placeholder DB.")
        
        if not db_deleted and not placeholder_deleted:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        return None
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document {document_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting document: {str(e)}"
        )

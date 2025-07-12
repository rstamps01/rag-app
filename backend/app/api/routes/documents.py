# File Path: /backend/app/api/routes/documents.py
# COMPREHENSIVE VERSION: Fixes validation issues while preserving all original features

import os
import uuid
import time
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form, BackgroundTasks
from sqlalchemy.orm import Session

# FIXED: Import from existing schema structure
from app.schemas.documents import DocumentCreate, DocumentUpdate, Document
from app.crud.crud_document import create_document, get_documents, get_document, update_document
from app.db.session import get_db
from app.services.document_processor import process_and_store_document
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()

# ENHANCED: Department validation
VALID_DEPARTMENTS = ["General", "IT", "HR", "Finance", "Legal"]

# In-memory storage for immediate status tracking (placeholder DB)
documents_db = {}

def convert_db_document_to_response(db_document) -> Document:
    """
    Convert database document model to API response format with proper type conversions
    
    Args:
        db_document: Database document object
        
    Returns:
        Document: API response format with FIXED type handling
    """
    return Document(
        id=str(db_document.id),  # FIXED: Ensure string conversion for UUID
        filename=db_document.filename,
        content_type=db_document.content_type,
        size=getattr(db_document, 'size', None),  # FIXED: Handle None values
        upload_date=db_document.upload_date.isoformat() if db_document.upload_date else time.strftime("%Y-%m-%dT%H:%M:%S"),  # FIXED: Ensure string format
        status=getattr(db_document, 'status', 'unknown'),
        path=getattr(db_document, 'path', None),  # FIXED: Handle None values
        department=getattr(db_document, 'department', 'General'),
        error_message=getattr(db_document, 'error_message', None)
    )

async def process_document_pipeline(doc_id: str, file_path: str, filename: str, content_type: str, department: str, db_document_id: str):
    """
    FIXED: Background task for document processing with corrected status logic
    
    Args:
        doc_id: Unique document processing ID
        file_path: Path to uploaded file
        filename: Original filename
        content_type: MIME type
        department: Department for categorization
        db_document_id: Database document ID from initial creation
    """
    processing_start_time = time.time()
    
    logger.info(f"--- LOGGER: [BACKGROUND TASK process_document_pipeline ENTRY] doc_id: {doc_id}")
    print(f"--- PRINT: [BACKGROUND TASK process_document_pipeline ENTRY] doc_id: {doc_id}")
    
    try:
        logger.info(f"[{doc_id}] Inside try block of process_document_pipeline")
        
        # 1. Update status to processing in placeholder DB
        if doc_id in documents_db:
            documents_db[doc_id]["status"] = "processing"
            documents_db[doc_id]["department"] = department
            logger.info(f"[{doc_id}] Status set to 'processing' and department set to '{department}' in placeholder DB")
        
        # 2. Get fresh database session for background task
        db = next(get_db())
        
        try:
            # 3. FIXED: Call document processor with correct signature and handle result
            logger.info(f"[{doc_id}] Attempting to call document_processor.process_and_store_document")
            
            # FIXED: Call with GitHub-compatible signature (4 parameters)
            result = process_and_store_document(
                file_path=file_path,
                filename=filename,
                content_type=content_type,
                db=db
            )
            
            logger.info(f"[{doc_id}] Successfully called process_and_store_document")
            logger.info(f"[{doc_id}] Processing result: {result}")
            
            # 4. FIXED: Update status based on actual processing result
            if isinstance(result, dict):
                processing_result = result.get("processing_result", {})
                actual_status = processing_result.get("status", "completed" if result.get("success", True) else "failed")
                error_message = processing_result.get("error") or result.get("error")
            else:
                # If result is not a dict, assume success
                actual_status = "completed"
                error_message = None
            
            # Update placeholder DB with actual result
            if doc_id in documents_db:
                documents_db[doc_id]["status"] = actual_status
                if error_message:
                    documents_db[doc_id]["error_message"] = error_message
                processing_time = time.time() - processing_start_time
                logger.info(f"[{doc_id}] Status set to '{actual_status}' in placeholder DB")
            else:
                logger.warning(f"[{doc_id}] doc_id not found in placeholder DB")
            
            # Update database with actual result
            if db_document_id:
                # FIXED: Use correct function name from CRUD
                db_document = get_document(db, doc_id=db_document_id)
                if db_document:
                    document_update = DocumentUpdate(
                        status=actual_status,
                        error_message=error_message,
                        department=department,
                        path=file_path  # FIXED: Set the actual file path
                    )
                    update_document(db, db_document, document_update)
                    logger.info(f"[{doc_id}] Status set to '{actual_status}' in database.")
                else:
                    logger.warning(f"[{doc_id}] Document with ID {db_document_id} not found in database")
        
        finally:
            db.close()
        
    except Exception as e:
        error_msg = f"[BACKGROUND TASK] Unhandled error in processing pipeline: {str(e)}"
        logger.error(error_msg, exc_info=True)
        print(f"--- PRINT: [BACKGROUND TASK process_document_pipeline ERROR] doc_id: {doc_id}, error: {str(e)}")
        
        # FIXED: Set status to failed on error
        if doc_id in documents_db:
            documents_db[doc_id]["status"] = "failed"
            documents_db[doc_id]["error_message"] = str(e)
            logger.info(f"[{doc_id}] Status set to 'failed' in placeholder DB")
        
        # Update database with error status
        if db_document_id:
            db = next(get_db())
            try:
                # FIXED: Use correct function name from CRUD
                db_document = get_document(db, doc_id=db_document_id)
                if db_document:
                    document_update = DocumentUpdate(
                        status="failed",
                        error_message=str(e),
                        department=department
                    )
                    update_document(db, db_document, document_update)
                    logger.info(f"[{doc_id}] Status set to 'failed' in database.")
            finally:
                db.close()
    
    finally:
        logger.info(f"--- LOGGER: [BACKGROUND TASK process_document_pipeline EXIT] doc_id: {doc_id}")
        print(f"--- PRINT: [BACKGROUND TASK process_document_pipeline EXIT] doc_id: {doc_id}")

@router.post("/", response_model=Document, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    department: str = Form("General"),
    db: Session = Depends(get_db)
):
    """
    FIXED: Upload document with corrected status logic and single document creation
    
    Args:
        background_tasks: FastAPI background tasks
        file: Uploaded file
        department: Department for categorization (default: General)
        db: Database session
        
    Returns:
        Document with upload confirmation
    """
    
    # ENHANCED: Validate department
    if department not in VALID_DEPARTMENTS:
        logger.warning(f"Invalid department '{department}', defaulting to 'General'")
        department = "General"
    
    # Generate unique document ID for tracking
    doc_id = str(uuid.uuid4())
    
    logger.info(f"--- API POST /documents - Received file: {file.filename}, Department: {department}")
    
    try:
        # 1. Save uploaded file
        upload_dir = "/app/data/uploads"
        os.makedirs(upload_dir, exist_ok=True)
        
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{doc_id}_{file.filename}"
        file_path = os.path.join(upload_dir, unique_filename)
        
        # Save file to disk
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        file_size = len(content)
        logger.info(f"[{doc_id}] File saved: {file_path}, size: {file_size}")
        
        # 2. FIXED: Create single document record in database with all fields
        document_create = DocumentCreate(
            filename=file.filename,
            content_type=file.content_type,
            size=file_size,  # FIXED: Include file size
            department=department
        )
        
        db_document = create_document(db, document_create)
        logger.info(f"[{doc_id}] Document created in database with ID: {db_document.id}")
        
        # 3. FIXED: Update the database document with path immediately
        if hasattr(db_document, 'id'):
            document_update = DocumentUpdate(path=file_path)
            update_document(db, db_document, document_update)
            # Refresh the document to get updated values
            db.refresh(db_document)
            logger.info(f"[{doc_id}] Document path updated in database: {file_path}")
        
        # 4. Store in placeholder DB for immediate status tracking
        documents_db[doc_id] = {
            "id": str(db_document.id),
            "filename": file.filename,
            "content_type": file.content_type,
            "department": department,
            "size": file_size,
            "status": "uploaded",
            "upload_date": time.strftime("%Y-%m-%dT%H:%M:%S"),
            "path": file_path
        }
        
        logger.info(f"[{doc_id}] Initial metadata saved to placeholder DB with status 'uploaded'")
        
        # 5. Add background processing task
        logger.info(f"[{doc_id}] Adding background task for file: {file_path}")
        
        background_tasks.add_task(
            process_document_pipeline,
            doc_id=doc_id,
            file_path=file_path,
            filename=file.filename,
            content_type=file.content_type,
            department=department,
            db_document_id=str(db_document.id)
        )
        
        # 6. FIXED: Return document with proper type conversions
        return convert_db_document_to_response(db_document)
        
    except Exception as e:
        logger.error(f"Error uploading document: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error uploading document: {str(e)}")

@router.get("/", response_model=List[Document])
def list_documents(
    skip: int = 0,
    limit: int = 100,
    department: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    List documents with optional filtering.
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        department: Optional department filter
        db: Database session
        
    Returns:
        List of documents
    """
    try:
        documents = get_documents(db=db, skip=skip, limit=limit)
        
        # FIXED: Convert to response format with proper type conversions
        result = []
        for doc in documents:
            # Apply department filter if specified
            if department and getattr(doc, 'department', None) != department:
                continue
            result.append(convert_db_document_to_response(doc))
        
        return result
        
    except Exception as e:
        logger.error(f"Error listing documents: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error listing documents: {str(e)}")

@router.get("/{document_id}", response_model=Document)
def get_document_by_id(document_id: str, db: Session = Depends(get_db)):
    """
    Get a specific document by ID.
    
    Args:
        document_id: Document ID
        db: Database session
        
    Returns:
        Document object
    """
    try:
        # FIXED: Use correct function name from CRUD
        db_document = get_document(db, doc_id=document_id)
        if not db_document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # FIXED: Return with proper type conversions
        return convert_db_document_to_response(db_document)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting document {document_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error getting document: {str(e)}")

@router.delete("/{document_id}")
def delete_document_by_id(document_id: str, db: Session = Depends(get_db)):
    """
    Delete a document by ID.
    
    Args:
        document_id: Document ID
        db: Database session
        
    Returns:
        Success message
    """
    try:
        # FIXED: Use correct function name from CRUD
        db_document = get_document(db, doc_id=document_id)
        if not db_document:
            raise HTTPException(status_code=404, detail="Document not found")
        
        # Delete file if it exists
        if hasattr(db_document, 'path') and db_document.path and os.path.exists(db_document.path):
            os.remove(db_document.path)
            logger.info(f"Deleted file: {db_document.path}")
        
        # Delete from database
        db.delete(db_document)
        db.commit()
        logger.info(f"Deleted document from database: {document_id}")
        
        return {"message": f"Document {document_id} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document {document_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error deleting document: {str(e)}")

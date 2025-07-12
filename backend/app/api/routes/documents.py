# File Path: /backend/app/api/routes/documents.py
# SCHEMA-COMPATIBLE VERSION - Uses existing schema classes and field names

import os
import uuid
import time
import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form, BackgroundTasks
from sqlalchemy.orm import Session

# FIXED: Import from existing schema structure
from app.schemas.documents import Document, DocumentCreate, DocumentUpdate, DocumentList
from app.crud.crud_document import create_document, get_documents, get_document_by_id, update_document
from app.db.session import get_db
from app.services.document_processor import process_and_store_document
from app.core.config import settings

router = APIRouter()
logger = logging.getLogger(__name__)

# In-memory storage for immediate status tracking (placeholder DB)
documents_db = {}

# ENHANCED: Department validation
VALID_DEPARTMENTS = ["General", "IT", "HR", "Finance", "Legal"]

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
    
    logger.info(f"--- LOGGER: [BACKGROUND TASK process_document_pipeline ENTRY] doc_id: {doc_id}, file: {filename}, department: {department} ---")
    print(f"--- PRINT: [BACKGROUND TASK process_document_pipeline ENTRY] doc_id: {doc_id}, file: {filename}, department: {department} ---")
    
    try:
        logger.info(f"[{doc_id}] Inside try block of process_document_pipeline.")
        
        # 1. Update status to processing in placeholder DB
        if doc_id in documents_db:
            documents_db[doc_id]["status"] = "processing"
            documents_db[doc_id]["department"] = department
            logger.info(f"[{doc_id}] Status set to 'processing' and department set to '{department}' in placeholder DB.")
        
        # 2. Update status to processing in database
        db = next(get_db())
        try:
            db_document = get_document_by_id(db, db_document_id)
            if db_document:
                document_update = DocumentUpdate(
                    status="processing"
                )
                update_document(db, db_document, document_update)
                logger.info(f"[{doc_id}] Status set to 'processing' in database.")
            
            # 3. FIXED: Call document processor with correct signature and handle result
            logger.info(f"[{doc_id}] Attempting to call document_processor.process_and_store_document for file: {file_path}")
            
            # FIXED: Call with GitHub-compatible signature (4 parameters)
            result = process_and_store_document(
                file_path=file_path,
                filename=filename,
                content_type=content_type,
                db=db
            )
            
            logger.info(f"[{doc_id}] Successfully called process_and_store_document with GitHub-compatible signature")
            logger.info(f"[{doc_id}] Processing result: {result}")
            
            # 4. FIXED: Update status based on actual processing result
            if isinstance(result, dict):
                processing_result = result.get("processing_result", {})
                actual_status = processing_result.get("status", "completed" if result.get("success", False) else "failed")
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
                logger.info(f"[{doc_id}] Status set to '{actual_status}' in placeholder DB. Processing time: {processing_time:.2f}s")
            else:
                logger.warning(f"[{doc_id}] doc_id not found in placeholder DB to set status to '{actual_status}'.")
            
            # Update database with actual result
            if db_document:
                document_update = DocumentUpdate(
                    status=actual_status,
                    error_message=error_message
                )
                update_document(db, db_document, document_update)
                logger.info(f"[{doc_id}] Status set to '{actual_status}' in database.")
                
        finally:
            db.close()

    except Exception as e:
        error_msg = f"[BACKGROUND TASK] Unhandled error in processing pipeline for doc_id {doc_id}: {e}"
        logger.error(error_msg, exc_info=True)
        print(f"--- PRINT: [BACKGROUND TASK process_document_pipeline ERROR] doc_id: {doc_id}, error: {e} ---")
        
        # FIXED: Set status to failed on error
        if doc_id in documents_db:
            documents_db[doc_id]["status"] = "failed"
            documents_db[doc_id]["error_message"] = str(e)
            logger.info(f"[{doc_id}] Status set to 'failed' in placeholder DB due to unhandled error.")
        
        # Update database status to failed
        db = next(get_db())
        try:
            db_document = get_document_by_id(db, db_document_id)
            if db_document:
                document_update = DocumentUpdate(
                    status="failed",
                    error_message=str(e)
                )
                update_document(db, db_document, document_update)
                logger.info(f"[{doc_id}] Status set to 'failed' in database.")
        finally:
            db.close()
    
    finally:
        logger.info(f"--- LOGGER: [BACKGROUND TASK process_document_pipeline EXIT] doc_id: {doc_id} ---")
        print(f"--- PRINT: [BACKGROUND TASK process_document_pipeline EXIT] doc_id: {doc_id} ---")

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
    
    logger.info(f"--- API POST /documents - Received file: {file.filename}, Department: {department} ---")
    
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
        
        # 2. FIXED: Create single document record in database
        document_create = DocumentCreate(
            filename=file.filename,
            content_type=file.content_type
        )
        
        db_document = create_document(db, document_create)
        logger.info(f"[{doc_id}] Document created in database with ID: {db_document.id}")
        
        # 3. Store in placeholder DB for immediate status tracking
        documents_db[doc_id] = {
            "id": str(db_document.id),
            "filename": file.filename,
            "content_type": file.content_type,
            "department": department,
            "size": file_size,
            "status": "uploaded",
            "upload_date": time.strftime("%Y-%m-%d %H:%M:%S"),
            "path": file_path
        }
        
        logger.info(f"[{doc_id}] Initial metadata saved to placeholder DB with department: {department}.")
        
        # 4. Add background processing task
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
        
        logger.info(f"[{doc_id}] Successfully added background task.")
        
        # 5. FIXED: Return response using existing Document schema
        return Document(
            id=str(db_document.id),
            filename=file.filename,
            content_type=file.content_type,
            size=file_size,
            upload_date=time.strftime("%Y-%m-%d %H:%M:%S"),
            status="uploaded",  # Initial status
            path=file_path
        )
        
    except Exception as e:
        logger.error(f"[{doc_id}] Upload failed: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload document: {str(e)}"
        )

@router.get("/", response_model=DocumentList)
async def list_documents(
    skip: int = 0,
    limit: int = 100,
    department: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    FIXED: List documents with proper database integration
    
    Args:
        skip: Number of documents to skip
        limit: Maximum number of documents to return
        department: Filter by department (optional)
        db: Database session
        
    Returns:
        DocumentList
    """
    
    try:
        # Get documents from database
        documents = get_documents(db, skip=skip, limit=limit, department=department)
        
        # Convert to response format using existing Document schema
        result = []
        for doc in documents:
            # FIXED: Map database fields to existing Document schema fields
            doc_response = Document(
                id=str(doc.id),
                filename=doc.filename,
                content_type=doc.content_type,
                size=getattr(doc, 'file_size', 0) or getattr(doc, 'size', 0),  # Handle both field names
                upload_date=doc.upload_time.strftime("%Y-%m-%d %H:%M:%S") if hasattr(doc, 'upload_time') and doc.upload_time else "Invalid Date",
                status=doc.status or "unknown",
                path=doc.path or ""
            )
            result.append(doc_response)
        
        logger.info(f"API GET /documents - Listing documents, skip={skip}, limit={limit}, returning {len(result)} documents")
        
        return DocumentList(
            documents=result,
            total=len(result),
            skip=skip,
            limit=limit
        )
        
    except Exception as e:
        logger.error(f"Failed to list documents: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to list documents: {str(e)}"
        )

@router.get("/{document_id}", response_model=Document)
async def get_document(
    document_id: str,
    db: Session = Depends(get_db)
):
    """
    Get specific document by ID
    
    Args:
        document_id: Document ID
        db: Database session
        
    Returns:
        Document
    """
    
    try:
        document = get_document_by_id(db, document_id)
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # FIXED: Map database fields to existing Document schema
        return Document(
            id=str(document.id),
            filename=document.filename,
            content_type=document.content_type,
            size=getattr(document, 'file_size', 0) or getattr(document, 'size', 0),
            upload_date=document.upload_time.strftime("%Y-%m-%d %H:%M:%S") if hasattr(document, 'upload_time') and document.upload_time else "Invalid Date",
            status=document.status or "unknown",
            path=document.path or ""
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get document {document_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get document: {str(e)}"
        )

@router.delete("/{document_id}")
async def delete_document(
    document_id: str,
    db: Session = Depends(get_db)
):
    """
    Delete document by ID
    
    Args:
        document_id: Document ID
        db: Database session
        
    Returns:
        Success message
    """
    
    try:
        document = get_document_by_id(db, document_id)
        
        if not document:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Document not found"
            )
        
        # Delete file if it exists
        if document.path and os.path.exists(document.path):
            os.remove(document.path)
            logger.info(f"Deleted file: {document.path}")
        
        # Delete from database
        db.delete(document)
        db.commit()
        
        logger.info(f"Deleted document: {document_id}")
        
        return {"message": "Document deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete document {document_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document: {str(e)}"
        )

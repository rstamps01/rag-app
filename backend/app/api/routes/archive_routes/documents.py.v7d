# Fixed version of app/api/routes/documents.py
# This fixes the process_and_store_document function call issue

from fastapi import (
    APIRouter, 
    Depends, 
    HTTPException, 
    status, 
    UploadFile, 
    File, 
    BackgroundTasks,
    Query
)
from typing import Any, List, Dict
import os
import uuid
from datetime import datetime
import time
import logging
import asyncio

# ✅ CORRECTED: Import only the schemas, not the processing function from schemas
from app.schemas.document import DocumentMetadata, DocumentList

# ✅ CORRECTED: Import the processing function from the correct location
from app.services.document_processor import process_and_store_document

# Setup logger
logger = logging.getLogger(__name__)

router = APIRouter()

# ✅ CORRECTED: Configuration
UPLOAD_DIR = "/app/data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# ✅ CORRECTED: Global placeholder database (in-memory for now)
documents_db: Dict[str, Dict[str, Any]] = {}

# ✅ CORRECTED: Background task function with proper error handling
async def process_document_pipeline(doc_id: str, file_path: str, filename: str, content_type: str):
    """
    Background task to process uploaded documents.
    
    Args:
        doc_id: Unique document identifier
        file_path: Path to the uploaded file
        filename: Original filename
        content_type: MIME type of the file
    """
    logger.info(f"--- LOGGER: [BACKGROUND TASK process_document_pipeline ENTRY] doc_id: {doc_id}, file: {filename} ---")
    print(f"--- PRINT: [BACKGROUND TASK process_document_pipeline ENTRY] doc_id: {doc_id}, file: {filename} ---")
    
    try:
        logger.info(f"[{doc_id}] Inside try block of process_document_pipeline.")
        
        # Update status to processing
        if doc_id in documents_db:
            documents_db[doc_id]["status"] = "processing"
            logger.info(f"[{doc_id}] Status set to 'processing' in placeholder DB.")
        
        # ✅ CORRECTED: Call the function with the correct parameters
        logger.info(f"[{doc_id}] Attempting to call document_processor.process_and_store_document for file: {file_path}")
        
        # The function signature is: async def process_and_store_document(file_path: str, department: str)
        await process_and_store_document(file_path=file_path, department="general")
        
        logger.info(f"[{doc_id}] Call to document_processor.process_and_store_document completed.")
        
        # Update status to completed
        if doc_id in documents_db:
            documents_db[doc_id]["status"] = "completed"
            documents_db[doc_id]["processed_date"] = datetime.now()
            logger.info(f"[{doc_id}] Status set to 'completed' in placeholder DB.")
        
    except Exception as e:
        error_msg = f"[BACKGROUND TASK] Unhandled error in processing pipeline for doc_id {doc_id}: {e}"
        logger.error(error_msg, exc_info=True)
        print(f"--- PRINT: [BACKGROUND TASK process_document_pipeline ERROR] doc_id: {doc_id}, error: {e} ---")
        
        # Update status to failed
        if doc_id in documents_db:
            documents_db[doc_id]["status"] = "failed"
            documents_db[doc_id]["error_message"] = str(e)
            logger.info(f"[{doc_id}] Status set to 'failed' in placeholder DB due to unhandled error.")
        else:
            logger.warning(f"[{doc_id}] doc_id not found in placeholder DB to set status to 'failed' after unhandled error.")
    
    finally:
        logger.info(f"--- LOGGER: [BACKGROUND TASK process_document_pipeline EXIT] doc_id: {doc_id} ---")
        print(f"--- PRINT: [BACKGROUND TASK process_document_pipeline EXIT] doc_id: {doc_id} ---")

# ✅ CORRECTED: Upload endpoint with proper error handling
@router.post("/", response_model=DocumentMetadata, status_code=status.HTTP_202_ACCEPTED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
) -> Any:
    """Upload a document for processing."""
    logger.info(f"--- API POST /documents - Received file: {file.filename} ---")
    global documents_db 
    
    doc_id = str(uuid.uuid4())
    safe_filename = f"{doc_id}_{os.path.basename(file.filename)}"
    file_location = os.path.join(UPLOAD_DIR, safe_filename)

    try:
        # ✅ CORRECTED: Proper file handling
        file_content = await file.read()
        file_size = len(file_content)
        
        with open(file_location, "wb") as f:
            f.write(file_content)
        
        logger.info(f"[{doc_id}] File saved: {file_location}, size: {file_size}")
        
    except Exception as e:
        logger.error(f"[{doc_id}] Failed to save file {safe_filename}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save uploaded file: {e}"
        )
    finally:
        await file.close()

    # ✅ CORRECTED: Create document metadata
    doc_metadata = DocumentMetadata(
        id=doc_id,
        filename=file.filename,
        content_type=file.content_type,
        size=file_size,
        status="pending",
        path=file_location
    )

    # ✅ CORRECTED: Store in placeholder database
    documents_db[doc_id] = doc_metadata.dict()
    logger.info(f"[{doc_id}] Initial metadata saved to placeholder DB.")

    # ✅ CORRECTED: Add background task with all required parameters
    try:
        logger.info(f"[{doc_id}] Adding background task for file: {file_location}")
        background_tasks.add_task(
            process_document_pipeline,
            doc_id=doc_id,
            file_path=file_location,
            filename=file.filename,
            content_type=file.content_type or "application/octet-stream"
        )
        logger.info(f"[{doc_id}] Successfully added background task.")
    except Exception as e:
        logger.error(f"[{doc_id}] Failed to add background task: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to start document processing: {e}"
        )

    return doc_metadata

# ✅ CORRECTED: List documents endpoint with filesystem scanning
@router.get("/", response_model=DocumentList)
async def list_documents(
    skip: int = Query(0, ge=0, description="Number of documents to skip"),
    limit: int = Query(10, ge=1, le=100, description="Maximum number of documents to return")
) -> Any:
    """List uploaded documents by scanning the filesystem."""
    try:
        # Get real uploaded documents from filesystem
        upload_dir = "/app/data/uploads"
        documents = []
        
        if os.path.exists(upload_dir):
            for filename in os.listdir(upload_dir):
                if filename.endswith((".pdf", ".txt", ".docx")):
                    file_path = os.path.join(upload_dir, filename)
                    file_stat = os.stat(file_path)
                    
                    # Extract document ID from filename (format: id_originalname.ext)
                    if '_' in filename:
                        doc_id = filename.split('_')[0]
                        original_name = '_'.join(filename.split('_')[1:])
                    else:
                        doc_id = str(uuid.uuid4())
                        original_name = filename
                    
                    # Get status from placeholder DB or default to 'uploaded'
                    status = "uploaded"
                    error_message = None
                    if doc_id in documents_db:
                        status = documents_db[doc_id].get("status", "uploaded")
                        error_message = documents_db[doc_id].get("error_message")
                    
                    # Determine content type from file extension
                    content_type = "application/octet-stream"
                    if filename.lower().endswith('.pdf'):
                        content_type = "application/pdf"
                    elif filename.lower().endswith('.txt'):
                        content_type = "text/plain"
                    elif filename.lower().endswith('.docx'):
                        content_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    
                    documents.append({
                        "id": doc_id,
                        "filename": original_name,
                        "content_type": content_type,
                        "size": file_stat.st_size,
                        "upload_date": datetime.fromtimestamp(file_stat.st_mtime),
                        "status": status,
                        "path": file_path,
                        "error_message": error_message
                    })
        
        # Sort by upload date (newest first)
        documents.sort(key=lambda x: x["upload_date"], reverse=True)
        
        # Apply pagination
        total_count = len(documents)
        paginated_docs = documents[skip:skip + limit]
        
        logger.info(f"API GET /documents - Listing documents from filesystem, skip={skip}, limit={limit}, returning {len(paginated_docs)} of {total_count}")
        return {"documents": paginated_docs, "total_count": total_count}
        
    except Exception as e:
        logger.error(f"API GET /documents - Error listing documents: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to retrieve documents")

# ✅ CORRECTED: Delete document endpoint
@router.delete("/{document_id}")
async def delete_document(document_id: str) -> Any:
    """Delete a document by ID."""
    try:
        # Find the document file
        upload_dir = "/app/data/uploads"
        file_to_delete = None
        
        if os.path.exists(upload_dir):
            for filename in os.listdir(upload_dir):
                if filename.startswith(f"{document_id}_"):
                    file_to_delete = os.path.join(upload_dir, filename)
                    break
        
        if not file_to_delete or not os.path.exists(file_to_delete):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Document with ID {document_id} not found"
            )
        
        # Delete the file
        os.remove(file_to_delete)
        
        # Remove from placeholder database
        if document_id in documents_db:
            del documents_db[document_id]
        
        logger.info(f"Document {document_id} deleted successfully")
        return {"message": f"Document {document_id} deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting document {document_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete document: {e}"
        )

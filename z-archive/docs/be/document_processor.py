# File Path: /home/ubuntu/rag-app-analysis/rag-app/backend/app/services/document_processor.py
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

from ..core.config import settings
from ..core.pipeline_monitor import pipeline_monitor
from ..db.session import get_db
from ..crud.crud_document import create_document, get_document_by_filename
from ..schemas.document import DocumentCreate, DocumentUpdate
from sqlalchemy.orm import Session
import time
import uuid
import pytesseract
from PIL import Image
import io
import fitz  # PyMuPDF for PDF image extraction
import tempfile

logger = logging.getLogger(__name__)

# --- Configuration ---
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
QDRANT_COLLECTION_NAME = settings.QDRANT_COLLECTION_NAME
OCR_ENABLED = getattr(settings, "OCR_ENABLED", True)
OCR_LANGUAGE = getattr(settings, "OCR_LANGUAGE", "eng")

# --- Component Initialization (Module Level) ---

# Determine device (reuse logic)
device = "cuda" if settings.USE_GPU and torch.cuda.is_available() else "cpu"
logger.info(f"Using device: {device}")

# Initialize Embedding Model (using SentenceTransformer for simplicity)
try:
    logger.info(f"Loading embedding model: {EMBEDDING_MODEL_NAME} onto {device} from cache /app/models_cache")
    
    # Enable TensorFloat-32 precision for RTX 5090
    if torch.cuda.is_available() and torch.cuda.get_device_capability()[0] >= 8:
        logger.info("Enabling TensorFloat-32 precision for Ampere or newer GPU architecture")
        torch.set_float32_matmul_precision('high')
    
    embedding_model = SentenceTransformer(
        EMBEDDING_MODEL_NAME, 
        device=device, 
        cache_folder="/app/models_cache"
    )
    logger.info(f"Embedding model {EMBEDDING_MODEL_NAME} loaded successfully.")
except Exception as e:
    logger.error(f"Failed to load embedding model {EMBEDDING_MODEL_NAME}: {e}", exc_info=True)
    embedding_model = None

# Initialize Qdrant Client
try:
    logger.info(f"Initializing Qdrant client at {settings.QDRANT_HOST}:{settings.QDRANT_PORT}")
    qdrant_client = QdrantClient(host=settings.QDRANT_HOST, port=settings.QDRANT_PORT)
    # Ensure collection exists (optional, depending on setup)
    try:
        qdrant_client.get_collection(collection_name=QDRANT_COLLECTION_NAME)
        logger.info(f"Qdrant collection \t'{QDRANT_COLLECTION_NAME}'\t already exists.") 
    except Exception:
        logger.info(f"Creating Qdrant collection: {QDRANT_COLLECTION_NAME}")
        actual_embedding_dimension = embedding_model.get_sentence_embedding_dimension() if embedding_model else 384
        logger.info(f"Using embedding dimension: {actual_embedding_dimension} for Qdrant collection.")
        qdrant_client.recreate_collection(
            collection_name=QDRANT_COLLECTION_NAME,
            vectors_config=models.VectorParams(
                size=actual_embedding_dimension, # Get dimension from model
                distance=models.Distance.COSINE
            )
        )
        logger.info(f"Qdrant collection \t'{QDRANT_COLLECTION_NAME}'\t created.") 
except Exception as e:
    logger.error(f"Failed to initialize Qdrant client or collection: {e}", exc_info=True)
    qdrant_client = None

# Initialize Text Splitter
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len,
)

# --- OCR Functions ---

def extract_text_from_image(image_data: bytes, pipeline_id: str) -> str:
    """
    Extract text from an image using OCR.
    
    Args:
        image_data: Binary image data
        pipeline_id: Pipeline ID for monitoring
        
    Returns:
        Extracted text from the image
    """
    stage_name = "OCR Processing"
    pipeline_monitor.record_event(pipeline_id, stage_name, data={"status": "start"})
    start_time = time.time()
    
    try:
        # Open image from binary data
        image = Image.open(io.BytesIO(image_data))
        
        # Perform OCR
        text = pytesseract.image_to_string(image, lang=OCR_LANGUAGE)
        
        processing_time_ms = (time.time() - start_time) * 1000
        pipeline_monitor.record_event(pipeline_id, stage_name, data={
            "status": "end",
            "text_length": len(text),
            "processing_time_ms": processing_time_ms
        })
        
        return text
    except Exception as e:
        processing_time_ms = (time.time() - start_time) * 1000
        pipeline_monitor.record_event(pipeline_id, stage_name, data={
            "status": "error",
            "error_message": str(e),
            "processing_time_ms": processing_time_ms
        })
        logger.error(f"Error in OCR processing: {e}", exc_info=True)
        return ""

def extract_images_from_pdf(pdf_path: str, pipeline_id: str) -> List[bytes]:
    """
    Extract images from a PDF file.
    
    Args:
        pdf_path: Path to the PDF file
        pipeline_id: Pipeline ID for monitoring
        
    Returns:
        List of binary image data
    """
    stage_name = "PDF Image Extraction"
    pipeline_monitor.record_event(pipeline_id, stage_name, data={"status": "start", "file_path": pdf_path})
    start_time = time.time()
    
    images = []
    
    try:
        # Open PDF
        pdf_document = fitz.open(pdf_path)
        
        # Extract images from each page
        for page_num in range(len(pdf_document)):
            page = pdf_document.load_page(page_num)
            
            # Get images
            image_list = page.get_images(full=True)
            
            for img_index, img_info in enumerate(image_list):
                xref = img_info[0]
                
                # Extract image
                base_image = pdf_document.extract_image(xref)
                image_bytes = base_image["image"]
                
                # Only process images of sufficient size (avoid small icons)
                if len(image_bytes) > 1000:  # Arbitrary threshold
                    images.append(image_bytes)
        
        processing_time_ms = (time.time() - start_time) * 1000
        pipeline_monitor.record_event(pipeline_id, stage_name, data={
            "status": "end",
            "num_images": len(images),
            "processing_time_ms": processing_time_ms
        })
        
        return images
    except Exception as e:
        processing_time_ms = (time.time() - start_time) * 1000
        pipeline_monitor.record_event(pipeline_id, stage_name, data={
            "status": "error",
            "error_message": str(e),
            "processing_time_ms": processing_time_ms
        })
        logger.error(f"Error extracting images from PDF: {e}", exc_info=True)
        return []

# --- Processing Functions ---

def load_and_split_document(file_path: str, pipeline_id: str) -> Tuple[List[Dict[str, Any]], Optional[str]]:
    """
    Loads and splits a document into chunks.
    
    Args:
        file_path: Path to the document file
        pipeline_id: Pipeline ID for monitoring
        
    Returns:
        Tuple of (list of chunks, OCR text if applicable)
    """
    stage_name = "Document Loading and Splitting"
    pipeline_monitor.record_event(pipeline_id, stage_name, data={"status": "start", "file_path": file_path})
    start_time = time.time()
    ocr_text = None
    
    try:
        extension = os.path.splitext(file_path)[1].lower()
        
        if extension == ".pdf":
            loader = PyPDFLoader(file_path)
            documents = loader.load()
            
            # Extract and process images from PDF if OCR is enabled
            if OCR_ENABLED:
                logger.info(f"[Pipeline ID: {pipeline_id}] Extracting images from PDF for OCR")
                images = extract_images_from_pdf(file_path, pipeline_id)
                
                if images:
                    logger.info(f"[Pipeline ID: {pipeline_id}] Processing {len(images)} images with OCR")
                    ocr_results = []
                    
                    for img_data in images:
                        ocr_text_part = extract_text_from_image(img_data, pipeline_id)
                        if ocr_text_part.strip():
                            ocr_results.append(ocr_text_part)
                    
                    if ocr_results:
                        ocr_text = "\n\n".join(ocr_results)
                        logger.info(f"[Pipeline ID: {pipeline_id}] OCR extracted {len(ocr_text)} characters of text")
                        
                        # Create a temporary file for the OCR text
                        with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as temp_file:
                            temp_file.write(ocr_text)
                            ocr_file_path = temp_file.name
                        
                        # Load and process the OCR text
                        try:
                            ocr_loader = TextLoader(ocr_file_path)
                            ocr_documents = ocr_loader.load()
                            documents.extend(ocr_documents)
                            logger.info(f"[Pipeline ID: {pipeline_id}] Added OCR text as additional document")
                        except Exception as ocr_e:
                            logger.error(f"[Pipeline ID: {pipeline_id}] Error processing OCR text: {ocr_e}", exc_info=True)
                        finally:
                            # Clean up temporary file
                            if os.path.exists(ocr_file_path):
                                os.remove(ocr_file_path)
        
        elif extension == ".txt":
            loader = TextLoader(file_path)
            documents = loader.load()
        
        elif extension in [".docx", ".doc"]:
            loader = Docx2txtLoader(file_path)
            documents = loader.load()
        
        elif extension == ".csv":
            loader = CSVLoader(file_path)
            documents = loader.load()
        
        # Handle image files directly
        elif extension in [".jpg", ".jpeg", ".png", ".tiff", ".tif", ".bmp"]:
            if OCR_ENABLED:
                logger.info(f"[Pipeline ID: {pipeline_id}] Processing image file with OCR")
                with open(file_path, "rb") as img_file:
                    img_data = img_file.read()
                
                ocr_text = extract_text_from_image(img_data, pipeline_id)
                
                if ocr_text.strip():
                    # Create a document from OCR text
                    from langchain.schema import Document as LangchainDocument
                    documents = [LangchainDocument(
                        page_content=ocr_text,
                        metadata={"source": os.path.basename(file_path), "page": 1}
                    )]
                else:
                    logger.warning(f"[Pipeline ID: {pipeline_id}] OCR did not extract any text from image")
                    documents = []
            else:
                logger.warning(f"[Pipeline ID: {pipeline_id}] OCR is disabled, cannot process image file")
                documents = []
        
        else:
            raise ValueError(f"Unsupported file type: {extension}")
        
        # Split documents into chunks
        chunks = text_splitter.split_documents(documents)
        
        chunk_dicts = []
        for i, chunk in enumerate(chunks):
            chunk_dicts.append({
                "id": str(uuid.uuid4()),  # Use UUID for Qdrant point ID
                "text": chunk.page_content,
                "metadata": {
                    "page": chunk.metadata.get("page", i),
                    "source": os.path.basename(file_path)  # Store only filename as source
                }
            })
        
        processing_time_ms = (time.time() - start_time) * 1000
        pipeline_monitor.record_event(pipeline_id, stage_name, data={
            "status": "end", 
            "num_chunks": len(chunk_dicts),
            "ocr_applied": ocr_text is not None,
            "processing_time_ms": processing_time_ms
        })
        
        return chunk_dicts, ocr_text
    
    except Exception as e:
        processing_time_ms = (time.time() - start_time) * 1000
        pipeline_monitor.record_event(pipeline_id, stage_name, data={
            "status": "error", 
            "error_message": str(e),
            "processing_time_ms": processing_time_ms
        })
        logger.error(f"Error in {stage_name} for {file_path}: {e}", exc_info=True)
        raise  # Re-raise the exception to be caught by the main processor

def generate_embeddings(texts: List[str], pipeline_id: str) -> Optional[List[List[float]]]:
    """
    Generates embeddings for a list of texts.
    
    Args:
        texts: List of text chunks to embed
        pipeline_id: Pipeline ID for monitoring
        
    Returns:
        List of embeddings or None if error
    """
    stage_name = "Embedding Generation"
    pipeline_monitor.record_event(pipeline_id, stage_name, data={"status": "start", "num_texts": len(texts)})
    start_time = time.time()
    
    if not embedding_model:
        logger.error("Embedding model not available.")
        pipeline_monitor.record_event(pipeline_id, stage_name, data={"status": "error", "error_message": "Embedding model not available."})
        return None
    
    try:
        # Calculate optimal batch size based on available GPU memory
        batch_size = 1
        if device == "cuda":
            # Simple heuristic based on available GPU memory
            free_memory = torch.cuda.get_device_properties(0).total_memory - torch.cuda.memory_allocated()
            free_memory_gb = free_memory / (1024**3)
            batch_size = max(1, min(32, int(free_memory_gb / 0.5)))  # Assume 0.5GB per batch of 32
            logger.info(f"[Pipeline ID: {pipeline_id}] Using batch size {batch_size} for embedding generation")
        
        # Use mixed precision if on GPU
        with torch.cuda.amp.autocast() if device == "cuda" else nullcontext():
            # Process in batches to avoid OOM
            all_embeddings = []
            for i in range(0, len(texts), batch_size):
                batch_texts = texts[i:i+batch_size]
                batch_embeddings = embedding_model.encode(batch_texts, convert_to_numpy=True).tolist()
                all_embeddings.extend(batch_embeddings)
                
                # Log progress for large batches
                if len(texts) > 100 and i % 100 == 0:
                    logger.info(f"[Pipeline ID: {pipeline_id}] Embedded {i}/{len(texts)} chunks")
        
        processing_time_ms = (time.time() - start_time) * 1000
        pipeline_monitor.record_event(pipeline_id, stage_name, data={
            "status": "end", 
            "num_embeddings": len(all_embeddings),
            "processing_time_ms": processing_time_ms
        })
        
        return all_embeddings
    
    except Exception as e:
        processing_time_ms = (time.time() - start_time) * 1000
        pipeline_monitor.record_event(pipeline_id, stage_name, data={
            "status": "error", 
            "error_message": str(e),
            "processing_time_ms": processing_time_ms
        })
        logger.error(f"Error generating embeddings: {e}", exc_info=True)
        return None

def store_embeddings(chunks: List[Dict[str, Any]], embeddings: List[List[float]], department: str, pipeline_id: str):
    """
    Stores chunks and embeddings in Qdrant.
    
    Args:
        chunks: List of text chunks with metadata
        embeddings: List of embeddings corresponding to chunks
        department: Department tag for filtering
        pipeline_id: Pipeline ID for monitoring
    """
    stage_name = "Vector DB Storage"
    pipeline_monitor.record_event(pipeline_id, stage_name, data={"status": "start", "num_points_to_store": len(chunks)})
    start_time = time.time()
    
    if not qdrant_client:
        logger.error("Qdrant client not available.")
        pipeline_monitor.record_event(pipeline_id, stage_name, data={"status": "error", "error_message": "Qdrant client not available."})
        return
    
    points = []
    for i, chunk in enumerate(chunks):
        chunk_metadata = chunk["metadata"].copy()
        standardized_department = department.lower()
        chunk_metadata["department"] = standardized_department 
        
        points.append(models.PointStruct(
            id=chunk["id"], 
            vector=embeddings[i],
            payload={"text": chunk["text"], **chunk_metadata}
        ))
    
    if points:
        logger.debug(f"Sample Qdrant point payload being stored (first point): ID={points[0].id}, Payload={points[0].payload}")

    try:
        # Use batching for large numbers of points
        batch_size = 100
        for i in range(0, len(points), batch_size):
            batch_points = points[i:i+batch_size]
            qdrant_client.upsert(
                collection_name=QDRANT_COLLECTION_NAME,
                points=batch_points,
                wait=True
            )
            logger.info(f"[Pipeline ID: {pipeline_id}] Stored batch of {len(batch_points)} points in Qdrant")
        
        processing_time_ms = (time.time() - start_time) * 1000
        pipeline_monitor.record_event(pipeline_id, stage_name, data={
            "status": "end", 
            "num_points_stored": len(points),
            "processing_time_ms": processing_time_ms
        })
        logger.info(f"Stored {len(points)} points in Qdrant collection \t'{QDRANT_COLLECTION_NAME}'.")
    
    except Exception as e:
        processing_time_ms = (time.time() - start_time) * 1000
        pipeline_monitor.record_event(pipeline_id, stage_name, data={
            "status": "error", 
            "error_message": str(e),
            "processing_time_ms": processing_time_ms
        })
        logger.error(f"Failed to store points in Qdrant: {e}", exc_info=True)

def store_document_metadata(
    db: Session, 
    file_path: str, 
    department: str, 
    chunk_count: int, 
    ocr_applied: bool, 
    pipeline_id: str
) -> Optional[int]:
    """
    Store document metadata in PostgreSQL database.
    
    Args:
        db: Database session
        file_path: Path to the document file
        department: Department tag
        chunk_count: Number of chunks created
        ocr_applied: Whether OCR was applied
        pipeline_id: Pipeline ID for monitoring
        
    Returns:
        Document ID if successful, None otherwise
    """
    stage_name = "Database Metadata Storage"
    pipeline_monitor.record_event(pipeline_id, stage_name, data={"status": "start"})
    start_time = time.time()
    
    try:
        # Get file information
        file_name = os.path.basename(file_path)
        file_size = os.path.getsize(file_path)
        file_extension = os.path.splitext(file_path)[1].lower()
        
        # Check if document already exists
        existing_doc = get_document_by_filename(db, file_name)
        
        if existing_doc:
            # Update existing document
            doc_update = DocumentUpdate(
                department=department.lower(),
                chunk_count=chunk_count,
                file_size=file_size,
                ocr_applied=ocr_applied,
                last_updated=datetime.datetime.now()
            )
            
            # Update document in database
            updated_doc = crud_document.update_document(
                db=db,
                db_obj=existing_doc,
                obj_in=doc_update
            )
            
            doc_id = updated_doc.id
            logger.info(f"[Pipeline ID: {pipeline_id}] Updated existing document metadata, ID: {doc_id}")
        
        else:
            # Create new document
            doc_create = DocumentCreate(
                filename=file_name,
                file_type=file_extension.lstrip('.'),
                department=department.lower(),
                chunk_count=chunk_count,
                file_size=file_size,
                ocr_applied=ocr_applied,
                upload_date=datetime.datetime.now()
            )
            
            # Store document in database
            new_doc = create_document(db=db, obj_in=doc_create)
            doc_id = new_doc.id
            logger.info(f"[Pipeline ID: {pipeline_id}] Stored new document metadata, ID: {doc_id}")
        
        processing_time_ms = (time.time() - start_time) * 1000
        pipeline_monitor.record_event(pipeline_id, stage_name, data={
            "status": "end",
            "document_id": doc_id,
            "processing_time_ms": processing_time_ms
        })
        
        return doc_id
    
    except Exception as e:
        processing_time_ms = (time.time() - start_time) * 1000
        pipeline_monitor.record_event(pipeline_id, stage_name, data={
            "status": "error",
            "error_message": str(e),
            "processing_time_ms": processing_time_ms
        })
        logger.error(f"Error storing document metadata: {e}", exc_info=True)
        return None

async def process_and_store_document(file_path: str, department: str):
    """
    Main function to process a document and store its embeddings.
    
    Args:
        file_path: Path to the document file
        department: Department tag for filtering
    """
    document_name = os.path.basename(file_path)
    pipeline_id = pipeline_monitor.start_pipeline(document_id=document_name)
    logger.info(f"[Pipeline ID: {pipeline_id}] Starting processing for document: {file_path}, Department: {department}")
    overall_start_time = time.time()
    
    # Get database session
    db = next(get_db())
    
    try:
        # Load and split document
        chunks, ocr_text = load_and_split_document(file_path, pipeline_id)
        
        if not chunks:
            logger.warning(f"[Pipeline ID: {pipeline_id}] No chunks generated for document: {file_path}")
            pipeline_monitor.record_event(pipeline_id, "Overall Document Processing", data={
                "status": "error", 
                "error_message": "No chunks generated"
            })
            return
        
        # Generate embeddings
        logger.info(f"[Pipeline ID: {pipeline_id}] Generated {len(chunks)} chunks. Generating embeddings...")
        embeddings = generate_embeddings([c["text"] for c in chunks], pipeline_id)
        
        if embeddings and len(embeddings) == len(chunks):
            # Store embeddings in vector database
            logger.info(f"[Pipeline ID: {pipeline_id}] Embeddings generated. Storing {len(chunks)} points in Qdrant...")
            store_embeddings(chunks, embeddings, department, pipeline_id)
            
            # Store document metadata in PostgreSQL
            doc_id = store_document_metadata(
                db=db,
                file_path=file_path,
                department=department,
                chunk_count=len(chunks),
                ocr_applied=ocr_text is not None,
                pipeline_id=pipeline_id
            )
            
            logger.info(f"[Pipeline ID: {pipeline_id}] Successfully processed and stored document: {file_path}")
            overall_processing_time_ms = (time.time() - overall_start_time) * 1000
            pipeline_monitor.record_event(pipeline_id, "Overall Document Processing", data={
                "status": "success", 
                "document_id": doc_id,
                "total_processing_time_ms": overall_processing_time_ms
            })
        else:
            logger.error(f"[Pipeline ID: {pipeline_id}] Failed to generate embeddings or mismatch in count for document: {file_path}")
            pipeline_monitor.record_event(pipeline_id, "Overall Document Processing", data={
                "status": "error", 
                "error_message": "Embedding generation failed or mismatch"
            })
    
    except Exception as e:
        logger.error(f"[Pipeline ID: {pipeline_id}] Error processing document {file_path}: {e}", exc_info=True)
        overall_processing_time_ms = (time.time() - overall_start_time) * 1000
        pipeline_monitor.record_event(pipeline_id, "Overall Document Processing", data={
            "status": "error", 
            "error_message": str(e),
            "total_processing_time_ms": overall_processing_time_ms
        })
    
    finally:
        # Close database session
        db.close()
        
        # Clean up temporary file
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"[Pipeline ID: {pipeline_id}] Removed temporary file: {file_path}")
            except Exception as e:
                logger.error(f"[Pipeline ID: {pipeline_id}] Failed to remove temporary file {file_path}: {e}")

# Context manager for mixed precision operations
class nullcontext:
    def __enter__(self):
        return None
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

# Import datetime here to avoid circular imports
import datetime

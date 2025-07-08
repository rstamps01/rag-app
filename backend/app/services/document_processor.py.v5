# File Path: /home/ubuntu/rag_app_extracted/rag-app/backend/app/services/document_processor.py
import os
import logging
from typing import List, Dict, Any, Optional
import torch
import numpy as np
from qdrant_client import QdrantClient, models
from sentence_transformers import SentenceTransformer # Use SentenceTransformer directly for simplicity
from langchain.text_splitter import RecursiveCharacterTextSplitter
# Updated Langchain Community Imports
from langchain_community.document_loaders import (
    PyPDFLoader,
    TextLoader,
    Docx2txtLoader,
    CSVLoader
)

from ..core.config import settings
from ..core.pipeline_monitor import pipeline_monitor # Added import
import time # Added import
import uuid # Added for generating UUIDs for chunk IDs

logger = logging.getLogger(__name__)

# --- Configuration ---
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
QDRANT_COLLECTION_NAME = settings.QDRANT_COLLECTION_NAME

# --- Component Initialization (Module Level) ---

# Determine device (reuse logic)
device = "cuda" if settings.USE_GPU and torch.cuda.is_available() else "cpu"
logger.info(f"Using device: {device}")

# Initialize Embedding Model (using SentenceTransformer for simplicity)
try:
    logger.info(f"Loading embedding model: {EMBEDDING_MODEL_NAME} onto {device} from cache /app/models_cache")
    embedding_model = SentenceTransformer(EMBEDDING_MODEL_NAME, device=device, cache_folder="/app/models_cache") # Added cache_folder
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

# --- Processing Functions (Can be called directly or via a class instance if preferred) ---

def load_and_split_document(file_path: str, pipeline_id: str) -> List[Dict[str, Any]]:
    """Loads and splits a document into chunks."""
    stage_name = "Document Loading and Splitting"
    pipeline_monitor.record_event(pipeline_id, stage_name, data={"status": "start", "file_path": file_path})
    start_time = time.time()
    try:
        extension = os.path.splitext(file_path)[1].lower()
        
        if extension == ".pdf":
            loader = PyPDFLoader(file_path)
        elif extension == ".txt":
            loader = TextLoader(file_path)
        elif extension in [".docx", ".doc"]:
            loader = Docx2txtLoader(file_path)
        elif extension == ".csv":
            loader = CSVLoader(file_path)
        else:
            raise ValueError(f"Unsupported file type: {extension}")
        
        documents = loader.load()
        chunks = text_splitter.split_documents(documents)
        
        chunk_dicts = []
        for i, chunk in enumerate(chunks):
            chunk_dicts.append({
                "id": str(uuid.uuid4()), # Use UUID for Qdrant point ID
                "text": chunk.page_content,
                "metadata": {
                    "page": chunk.metadata.get("page", i),
                    "source": os.path.basename(file_path) # Store only filename as source
                }
            })
        processing_time_ms = (time.time() - start_time) * 1000
        pipeline_monitor.record_event(pipeline_id, stage_name, data={
            "status": "end", 
            "num_chunks": len(chunk_dicts),
            "processing_time_ms": processing_time_ms
        })
        return chunk_dicts
    except Exception as e:
        processing_time_ms = (time.time() - start_time) * 1000
        pipeline_monitor.record_event(pipeline_id, stage_name, data={
            "status": "error", 
            "error_message": str(e),
            "processing_time_ms": processing_time_ms
        })
        logger.error(f"Error in {stage_name} for {file_path}: {e}", exc_info=True)
        raise # Re-raise the exception to be caught by the main processor

def generate_embeddings(texts: List[str], pipeline_id: str) -> Optional[List[List[float]]]:
    """Generates embeddings for a list of texts."""
    stage_name = "Embedding Generation"
    pipeline_monitor.record_event(pipeline_id, stage_name, data={"status": "start", "num_texts": len(texts)})
    start_time = time.time()
    if not embedding_model:
        logger.error("Embedding model not available.")
        pipeline_monitor.record_event(pipeline_id, stage_name, data={"status": "error", "error_message": "Embedding model not available."})
        return None
    try:
        embeddings = embedding_model.encode(texts, convert_to_numpy=True).tolist()
        processing_time_ms = (time.time() - start_time) * 1000
        pipeline_monitor.record_event(pipeline_id, stage_name, data={
            "status": "end", 
            "num_embeddings": len(embeddings),
            "processing_time_ms": processing_time_ms
        })
        return embeddings
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
    """Stores chunks and embeddings in Qdrant."""
    stage_name = "Vector DB Storage"
    pipeline_monitor.record_event(pipeline_id, stage_name, data={"status": "start", "num_points_to_store": len(chunks)})
    start_time = time.time()
    if not qdrant_client:
        logger.error("Qdrant client not available.")
        pipeline_monitor.record_event(pipeline_id, stage_name, data={"status": "error", "error_message": "Qdrant client not available."})
        return
    
    points = []
    for i, chunk in enumerate(chunks):
        chunk_metadata = chunk["metadata"]
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
        qdrant_client.upsert(
            collection_name=QDRANT_COLLECTION_NAME,
            points=points,
            wait=True
        )
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

async def process_and_store_document(file_path: str, department: str):
    """Main function to process a document and store its embeddings."""
    document_name = os.path.basename(file_path)
    pipeline_id = pipeline_monitor.start_pipeline(document_id=document_name)
    logger.info(f"[Pipeline ID: {pipeline_id}] Starting processing for document: {file_path}, Department: {department}")
    overall_start_time = time.time()
    
    try:
        chunks = load_and_split_document(file_path, pipeline_id)
        if not chunks:
            logger.warning(f"[Pipeline ID: {pipeline_id}] No chunks generated for document: {file_path}")
            pipeline_monitor.record_event(pipeline_id, "Overall Document Processing", data={"status": "error", "error_message": "No chunks generated"})
            return
        
        logger.info(f"[Pipeline ID: {pipeline_id}] Generated {len(chunks)} chunks. Generating embeddings...")
        embeddings = generate_embeddings([c["text"] for c in chunks], pipeline_id)
        
        if embeddings and len(embeddings) == len(chunks):
            logger.info(f"[Pipeline ID: {pipeline_id}] Embeddings generated. Storing {len(chunks)} points in Qdrant...")
            store_embeddings(chunks, embeddings, department, pipeline_id)
            logger.info(f"[Pipeline ID: {pipeline_id}] Successfully processed and stored document: {file_path}")
            overall_processing_time_ms = (time.time() - overall_start_time) * 1000
            pipeline_monitor.record_event(pipeline_id, "Overall Document Processing", data={
                "status": "success", 
                "total_processing_time_ms": overall_processing_time_ms
            })
        else:
            logger.error(f"[Pipeline ID: {pipeline_id}] Failed to generate embeddings or mismatch in count for document: {file_path}")
            pipeline_monitor.record_event(pipeline_id, "Overall Document Processing", data={"status": "error", "error_message": "Embedding generation failed or mismatch"})
            
    except Exception as e:
        logger.error(f"[Pipeline ID: {pipeline_id}] Error processing document {file_path}: {e}", exc_info=True)
        overall_processing_time_ms = (time.time() - overall_start_time) * 1000
        pipeline_monitor.record_event(pipeline_id, "Overall Document Processing", data={
            "status": "error", 
            "error_message": str(e),
            "total_processing_time_ms": overall_processing_time_ms
        })
    finally:
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
                logger.info(f"[Pipeline ID: {pipeline_id}] Removed temporary file: {file_path}")
            except Exception as e:
                logger.error(f"[Pipeline ID: {pipeline_id}] Failed to remove temporary file {file_path}: {e}")



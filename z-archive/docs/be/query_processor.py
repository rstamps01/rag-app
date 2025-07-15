# File Path: /home/ubuntu/rag-app-analysis/rag-app/backend/app/services/query_processor.py
import logging
from time import time
from fastapi import HTTPException
import torch
from typing import List, Dict, Any, Optional

from sqlalchemy.orm import Session
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient, models
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline

from ..core.config import settings
from ..core.pipeline_monitor import pipeline_monitor
from ..schemas.query import QueryResponse, SourceDocument, QueryHistoryCreate 
from .document_processor import embedding_model, qdrant_client, device, QDRANT_COLLECTION_NAME
from ..crud import crud_query_history

logger = logging.getLogger(__name__)

# --- Configuration ---
LLM_MODEL_NAME = "mistralai/Mistral-7B-Instruct-v0.2"
#LLM_MODEL_NAME = "mistralai/Mistral-7B-Instruct-v0.2"  # Updated to latest stable version
# Make context window size configurable based on model
MAX_CONTEXT_LENGTH = getattr(settings, "MAX_CONTEXT_LENGTH", 4096)
MAX_NEW_TOKENS = getattr(settings, "MAX_NEW_TOKENS", 512)

# --- LLM Initialization ---
llm_pipeline = None
if device == "cuda":
    try:
        logger.info(f"Loading LLM model: {LLM_MODEL_NAME} onto GPU ({device})")
        
        # Enable TensorFloat-32 precision for RTX 5090
        if torch.cuda.is_available() and torch.cuda.get_device_capability()[0] >= 8:
            logger.info("Enabling TensorFloat-32 precision for Ampere or newer GPU architecture")
            torch.set_float32_matmul_precision('high')
        
        # Load model with optimizations for RTX 5090
        model = AutoModelForCausalLM.from_pretrained(
            LLM_MODEL_NAME,
            torch_dtype=torch.float16,  # Use float16 for GPU
            device_map="auto",
            cache_dir="/app/models_cache"  # Use consistent cache directory
        )
        
        tokenizer = AutoTokenizer.from_pretrained(
            LLM_MODEL_NAME,
            cache_dir="/app/models_cache"
        )
        
        # Create pipeline with optimizations
        llm_pipeline = pipeline(
            "text-generation",
            model=model,
            tokenizer=tokenizer,
            torch_dtype=torch.float16,
            device_map="auto",
            max_new_tokens=MAX_NEW_TOKENS,
            # Enable Flash Attention if available
            model_kwargs={"attn_implementation": "flash_attention_2"} if torch.__version__ >= "2.0.0" else {}
        )
        logger.info(f"LLM pipeline created successfully for {LLM_MODEL_NAME} on GPU with optimizations.")
    except Exception as e:
        logger.error(f"Failed to load LLM model {LLM_MODEL_NAME} on GPU: {e}", exc_info=True)
        llm_pipeline = None
elif settings.USE_GPU:
     logger.warning(f"GPU requested but not available. LLM ({LLM_MODEL_NAME}) will not be loaded.")
else:
    logger.warning(f"GPU disabled. Loading LLM ({LLM_MODEL_NAME}) on CPU is not recommended for performance.")
    try:
        # Attempt to load on CPU with reduced precision
        model = AutoModelForCausalLM.from_pretrained(
            LLM_MODEL_NAME,
            device_map="auto",
            cache_dir="/app/models_cache",
            low_cpu_mem_usage=True
        )
        tokenizer = AutoTokenizer.from_pretrained(
            LLM_MODEL_NAME,
            cache_dir="/app/models_cache"
        )
        llm_pipeline = pipeline(
            "text-generation",
            model=model,
            tokenizer=tokenizer,
            max_new_tokens=MAX_NEW_TOKENS
        )
        logger.info(f"LLM pipeline created on CPU with memory optimizations.")
    except Exception as e:
        logger.error(f"Failed to load LLM model on CPU: {e}", exc_info=True)
        llm_pipeline = None

# --- Dynamic Batch Size Calculation ---
def calculate_batch_size(text_length: int) -> int:
    """Calculate optimal batch size based on available GPU memory and input length."""
    if not torch.cuda.is_available():
        return 1
    
    # Get available GPU memory in GB
    available_memory = torch.cuda.get_device_properties(0).total_memory / (1024**3)
    
    # Simple heuristic based on text length and available memory
    if text_length > 10000:
        return max(1, int(available_memory / 16))
    elif text_length > 5000:
        return max(1, int(available_memory / 8))
    else:
        return max(1, int(available_memory / 4))

# --- Core Query Function ---
async def process_query(
    db: Session,
    query_text: str, 
    department: str,
    user_id: Optional[int] = None,
    context_length: Optional[int] = None
) -> QueryResponse:
    """
    Processes a query using the RAG pipeline: embed, search, generate, and save history.
    
    Args:
        db: Database session
        query_text: The user's query text
        department: Department filter for document retrieval
        user_id: Optional user ID for query history
        context_length: Optional override for context window size
    
    Returns:
        QueryResponse object with generated answer and metadata
    """
    # Use provided context length or default
    max_context_length = context_length or MAX_CONTEXT_LENGTH
    
    pipeline_id = pipeline_monitor.start_pipeline(query_id=query_text)
    logger.info(f"[Pipeline ID: {pipeline_id}] --- LOGGER: query_processor.py: process_query ENTRY --- "
                f"Query: {query_text}, Department: {department}, User ID: {user_id}")
    
    # Validate dependencies
    if not embedding_model or not qdrant_client:
        logger.error(f"[Pipeline ID: {pipeline_id}] Embedding model or Qdrant client not available in query_processor.")
        pipeline_monitor.record_event(pipeline_id, "Overall Query Processing", 
                                     data={"status": "error", "error_message": "Embedding model or Qdrant client not available."})
        raise HTTPException(status_code=503, detail="Embedding model or Qdrant client not available.")
    if not llm_pipeline:
        logger.error(f"[Pipeline ID: {pipeline_id}] LLM pipeline not available in query_processor.")
        pipeline_monitor.record_event(pipeline_id, "Overall Query Processing", 
                                     data={"status": "error", "error_message": "LLM pipeline not available."})
        raise HTTPException(status_code=503, detail="LLM pipeline not available.")

    overall_start_time = time()
    
    # --- Query Embedding Generation ---
    stage_start_time = time()
    pipeline_monitor.record_event(pipeline_id, "Query Embedding Generation", data={"status": "start", "query_text": query_text})
    try:
        logger.info(f"[Pipeline ID: {pipeline_id}] Generating embedding for query: \"{query_text}\"")
        expected_dimension = embedding_model.get_sentence_embedding_dimension()
        logger.debug(f"[Pipeline ID: {pipeline_id}] Query processor using embedding model with dimension: {expected_dimension}")
        
        # Use mixed precision if on GPU
        with torch.cuda.amp.autocast() if device == "cuda" else nullcontext():
            query_vector = embedding_model.encode(query_text, convert_to_numpy=True).tolist()
            
        logger.debug(f"[Pipeline ID: {pipeline_id}] Generated query vector with dimension: {len(query_vector)}")
        stage_processing_time_ms = (time() - stage_start_time) * 1000
        pipeline_monitor.record_event(pipeline_id, "Query Embedding Generation", 
                                     data={"status": "end", "vector_dimension": len(query_vector), 
                                           "processing_time_ms": stage_processing_time_ms})
    except Exception as e:
        stage_processing_time_ms = (time() - stage_start_time) * 1000
        pipeline_monitor.record_event(pipeline_id, "Query Embedding Generation", 
                                     data={"status": "error", "error_message": str(e), 
                                           "processing_time_ms": stage_processing_time_ms})
        pipeline_monitor.record_event(pipeline_id, "Overall Query Processing", 
                                     data={"status": "error", "error_message": f"Query Embedding Error: {str(e)}", 
                                           "total_processing_time_ms": (time() - overall_start_time) * 1000})
        raise HTTPException(status_code=500, detail=f"Error generating query embedding: {e}")

    # --- Vector DB Search ---
    stage_start_time = time()
    standardized_department_query = department.lower()
    pipeline_monitor.record_event(pipeline_id, "Vector DB Search", 
                                 data={"status": "start", "department_filter": standardized_department_query})
    
    # Create filter for Qdrant search
    qdrant_filter = models.Filter(
        must=[
            models.FieldCondition(
                key="department",
                match=models.MatchValue(value=standardized_department_query)
            )
        ]
    )
    logger.info(f"[Pipeline ID: {pipeline_id}] Searching Qdrant collection \t{QDRANT_COLLECTION_NAME}\t with filter: {qdrant_filter.json()}")
    
    search_result = [] 
    try:
        # Perform vector search with retry logic
        for attempt in range(3):  # Try up to 3 times
            try:
                search_result = qdrant_client.search(
                    collection_name=QDRANT_COLLECTION_NAME,
                    query_vector=query_vector,
                    query_filter=qdrant_filter,
                    limit=5,
                    with_payload=True
                )
                break  # Success, exit retry loop
            except Exception as search_error:
                if attempt == 2:  # Last attempt failed
                    raise search_error
                logger.warning(f"[Pipeline ID: {pipeline_id}] Qdrant search attempt {attempt+1} failed, retrying: {search_error}")
                import time
                time.sleep(0.5)  # Wait before retry
        
        logger.info(f"[Pipeline ID: {pipeline_id}] Retrieved {len(search_result)} results from Qdrant.")
        if search_result:
            for i, hit in enumerate(search_result):
                logger.debug(f"[Pipeline ID: {pipeline_id}] Retrieved Qdrant Hit {i+1}: ID={hit.id}, Score={hit.score}")
        stage_processing_time_ms = (time() - stage_start_time) * 1000
        pipeline_monitor.record_event(pipeline_id, "Vector DB Search", 
                                     data={"status": "end", "num_results": len(search_result), 
                                           "processing_time_ms": stage_processing_time_ms})
    except Exception as e:
        logger.error(f"[Pipeline ID: {pipeline_id}] Error during Qdrant search: {e}", exc_info=True)
        stage_processing_time_ms = (time() - stage_start_time) * 1000
        pipeline_monitor.record_event(pipeline_id, "Vector DB Search", 
                                     data={"status": "error", "error_message": str(e), 
                                           "processing_time_ms": stage_processing_time_ms})
        # Not raising HTTPException here to allow saving history even if Qdrant fails

    # --- Context Preparation ---
    stage_start_time = time()
    pipeline_monitor.record_event(pipeline_id, "Context Preparation", data={"status": "start"})
    context = ""
    sources_for_response: List[SourceDocument] = []
    sources_for_history: List[Dict[str, Any]] = []

    if search_result:
        for hit in search_result:
            if hit.payload and isinstance(hit.payload, dict) and "text" in hit.payload:
                context += hit.payload["text"] + "\n\n"
                source_doc = SourceDocument(
                    document_id=str(hit.id),
                    document_name=hit.payload.get("source", str(hit.id)),
                    relevance_score=hit.score,
                    content_snippet=hit.payload["text"][:200] + "..."
                )
                sources_for_response.append(source_doc)
                sources_for_history.append(source_doc.model_dump())
            else:
                logger.warning(f"[Pipeline ID: {pipeline_id}] Qdrant hit {hit.id} missing payload or text field.")
        
        # Limit context to max_context_length
        if len(context) > max_context_length:
            logger.info(f"[Pipeline ID: {pipeline_id}] Truncating context from {len(context)} to {max_context_length} chars")
            context = context[:max_context_length]
            
        logger.info(f"[Pipeline ID: {pipeline_id}] Prepared context for LLM (length: {len(context)} chars). "
                    f"Number of sources: {len(sources_for_response)}")
    else:
        logger.info(f"[Pipeline ID: {pipeline_id}] No relevant documents found in Qdrant for the query and department.")
    
    stage_processing_time_ms = (time() - stage_start_time) * 1000
    pipeline_monitor.record_event(pipeline_id, "Context Preparation", 
                                 data={"status": "end", "context_length": len(context), 
                                       "num_sources": len(sources_for_response), 
                                       "processing_time_ms": stage_processing_time_ms})

    # --- LLM Prompt Preparation ---
    stage_start_time = time()
    pipeline_monitor.record_event(pipeline_id, "LLM Prompt Preparation", data={"status": "start"})
    
    # Construct prompt based on whether context is available
    if not context:
        prompt = f"<s>[INST] Answer the following question. If you don't know the answer from your general knowledge, say that you don't have specific information on this topic.\n\nQuestion: {query_text} [/INST]"
    else:
        prompt = f"<s>[INST] Use the following context to answer the question. If the answer is not in the context, say you don't know.\n\nContext:\n{context}\n\nQuestion: {query_text} [/INST]"
    
    logger.info(f"[Pipeline ID: {pipeline_id}] LLM Prompt (first 200 chars): {prompt[:200]}...")
    stage_processing_time_ms = (time() - stage_start_time) * 1000
    pipeline_monitor.record_event(pipeline_id, "LLM Prompt Preparation", 
                                 data={"status": "end", "prompt_length": len(prompt), 
                                       "processing_time_ms": stage_processing_time_ms})

    # --- LLM Call ---
    stage_start_time = time()
    pipeline_monitor.record_event(pipeline_id, "LLM Call", data={"status": "start", "llm_model": LLM_MODEL_NAME})
    answer = "Error: LLM processing failed."
    
    try:
        # Calculate optimal batch size based on input length
        batch_size = calculate_batch_size(len(prompt))
        logger.debug(f"[Pipeline ID: {pipeline_id}] Using batch size: {batch_size} for LLM inference")
        
        # Use CUDA Graphs for repeated operations if available
        use_cuda_graphs = torch.cuda.is_available() and hasattr(torch.cuda, 'graphs') and torch.__version__ >= "2.0.0"
        
        # Use mixed precision inference
        with torch.cuda.amp.autocast() if device == "cuda" else nullcontext():
            llm_response_data = llm_pipeline(
                prompt,
                do_sample=True,
                temperature=0.7,
                top_p=0.95,
                batch_size=batch_size,
                use_cache=True,
                use_cuda_graphs=use_cuda_graphs if use_cuda_graphs else None
            )
        
        if llm_response_data and isinstance(llm_response_data, list) and len(llm_response_data) > 0:
            full_generated_text = llm_response_data[0].get("generated_text", "")
            # Extract answer part after [/INST] tag
            answer_part = full_generated_text.split("[/INST]")[-1].strip()
            if not answer_part and full_generated_text:
                answer = full_generated_text
            else:
                answer = answer_part
                
            logger.info(f"[Pipeline ID: {pipeline_id}] LLM generated answer (first 200 chars): {answer[:200]}...")
            stage_processing_time_ms = (time() - stage_start_time) * 1000
            pipeline_monitor.record_event(pipeline_id, "LLM Call", 
                                         data={"status": "end", "answer_length": len(answer), 
                                               "processing_time_ms": stage_processing_time_ms})
        else:
            logger.error(f"[Pipeline ID: {pipeline_id}] LLM pipeline returned unexpected or empty output: {llm_response_data}")
            answer = "Error: Failed to get a valid response from LLM."
            stage_processing_time_ms = (time() - stage_start_time) * 1000
            pipeline_monitor.record_event(pipeline_id, "LLM Call", 
                                         data={"status": "error", 
                                               "error_message": "LLM pipeline returned unexpected or empty output", 
                                               "processing_time_ms": stage_processing_time_ms})
    except Exception as e: 
        logger.error(f"[Pipeline ID: {pipeline_id}] Error during LLM generation: {e}", exc_info=True)
        answer = f"Error: Exception during LLM generation - {e}"
        stage_processing_time_ms = (time() - stage_start_time) * 1000
        pipeline_monitor.record_event(pipeline_id, "LLM Call", 
                                     data={"status": "error", "error_message": str(e), 
                                           "processing_time_ms": stage_processing_time_ms})

    # --- Query History Saving ---
    processing_time_total_ms = (time() - overall_start_time) * 1000
    logger.info(f"[Pipeline ID: {pipeline_id}] --- LOGGER: query_processor.py: process_query EXIT --- "
                f"Time: {processing_time_total_ms / 1000:.2f}s ---")

    query_history_id = None
    try:
        # Begin transaction for database operations
        history_entry_data = QueryHistoryCreate(
            query_text=query_text,
            response_text=answer,
            llm_model_used=LLM_MODEL_NAME,
            sources_retrieved=sources_for_history,
            processing_time_ms=int(processing_time_total_ms),
            department_filter=standardized_department_query,
            gpu_accelerated=(device == "cuda")
        )
        
        # Use transaction to ensure atomicity
        try:
            created_history_entry = crud_query_history.create_query_history_entry(
                db=db, query_history_data=history_entry_data, user_id=user_id
            )
            query_history_id = created_history_entry.id
            logger.info(f"[Pipeline ID: {pipeline_id}] Saved query to history with ID: {query_history_id}")
        except Exception as db_error:
            # Rollback handled by FastAPI dependency
            logger.error(f"[Pipeline ID: {pipeline_id}] Database transaction failed: {db_error}", exc_info=True)
            raise
            
    except Exception as e:
        logger.error(f"[Pipeline ID: {pipeline_id}] Failed to save query to history: {e}", exc_info=True)

    # --- Final Response Construction ---
    final_response = QueryResponse(
        query=query_text,
        response=answer,
        model=LLM_MODEL_NAME,
        sources=sources_for_response,
        processing_time=round(processing_time_total_ms / 1000, 2),
        gpu_accelerated=(device == "cuda"),
        query_history_id=query_history_id
    )
    
    pipeline_monitor.record_event(pipeline_id, "Overall Query Processing", 
                                 data={"status": "success", "total_processing_time_ms": processing_time_total_ms})
    return final_response

# Context manager for mixed precision operations
class nullcontext:
    def __enter__(self):
        return None
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

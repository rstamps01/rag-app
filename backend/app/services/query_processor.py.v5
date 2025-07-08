# File Path: /home/ubuntu/rag_app_extracted/rag-app/backend/app/services/query_processor.py
import logging
from time import time # Corrected: time() is a function, not time.time
from fastapi import HTTPException
import torch
from typing import List, Dict, Any, Optional # Added Optional

from sqlalchemy.orm import Session # Added for DB session
from sentence_transformers import SentenceTransformer
from qdrant_client import QdrantClient, models
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline

from ..core.config import settings
from ..core.pipeline_monitor import pipeline_monitor # Added import
# Updated to import QueryHistoryCreate for saving history
from ..schemas.query import QueryResponse, SourceDocument, QueryHistoryCreate 
from .document_processor import embedding_model, qdrant_client, device, QDRANT_COLLECTION_NAME
from ..crud import crud_query_history # Added import for query history CRUD

logger = logging.getLogger(__name__)

# --- Configuration ---
LLM_MODEL_NAME = "mistralai/Mistral-7B-Instruct-v0.1" 
MAX_CONTEXT_LENGTH = 4096 
MAX_NEW_TOKENS = 512 

# --- LLM Initialization ---
llm_pipeline = None
if device == "cuda":
    try:
        logger.info(f"Loading LLM model: {LLM_MODEL_NAME} onto GPU ({device})")
        model = AutoModelForCausalLM.from_pretrained(
            LLM_MODEL_NAME,
            torch_dtype=torch.float16,
            device_map="auto"
        )
        tokenizer = AutoTokenizer.from_pretrained(LLM_MODEL_NAME)
        llm_pipeline = pipeline(
            "text-generation",
            model=model,
            tokenizer=tokenizer,
            torch_dtype=torch.float16,
            device_map="auto",
            max_new_tokens=MAX_NEW_TOKENS
        )
        logger.info(f"LLM pipeline created successfully for {LLM_MODEL_NAME} on GPU.")
    except Exception as e:
        logger.error(f"Failed to load LLM model {LLM_MODEL_NAME} on GPU: {e}", exc_info=True)
        llm_pipeline = None
elif settings.USE_GPU:
     logger.warning(f"GPU requested but not available. LLM ({LLM_MODEL_NAME}) will not be loaded.")
else:
    logger.warning(f"GPU disabled. Loading LLM ({LLM_MODEL_NAME}) on CPU is not recommended for performance.")

# --- Core Query Function ---
async def process_query(
    db: Session, # Added DB session
    query_text: str, 
    department: str,
    user_id: Optional[int] = None # Added user_id for query history
) -> QueryResponse:
    """
    Processes a query using the RAG pipeline: embed, search, generate, and save history.
    """
    pipeline_id = pipeline_monitor.start_pipeline(query_id=query_text) # Use query_text or a generated ID
    logger.info(f"[Pipeline ID: {pipeline_id}] --- LOGGER: query_processor.py: process_query ENTRY --- Query: {query_text}, Department: {department}, User ID: {user_id}")
    
    if not embedding_model or not qdrant_client:
        logger.error(f"[Pipeline ID: {pipeline_id}] Embedding model or Qdrant client not available in query_processor.")
        pipeline_monitor.record_event(pipeline_id, "Overall Query Processing", data={"status": "error", "error_message": "Embedding model or Qdrant client not available."})
        raise HTTPException(status_code=503, detail="Embedding model or Qdrant client not available.")
    if not llm_pipeline:
        logger.error(f"[Pipeline ID: {pipeline_id}] LLM pipeline not available in query_processor.")
        pipeline_monitor.record_event(pipeline_id, "Overall Query Processing", data={"status": "error", "error_message": "LLM pipeline not available."})
        raise HTTPException(status_code=503, detail="LLM pipeline not available.")

    overall_start_time = time()
    stage_start_time = time()
    pipeline_monitor.record_event(pipeline_id, "Query Embedding Generation", data={"status": "start", "query_text": query_text})
    try:
        logger.info(f"[Pipeline ID: {pipeline_id}] Generating embedding for query: \"{query_text}\"")
        if embedding_model is None:
            logger.error(f"[Pipeline ID: {pipeline_id}] Embedding model is None, cannot generate query vector.")
            raise HTTPException(status_code=500, detail="Embedding model not loaded")
        
        expected_dimension = embedding_model.get_sentence_embedding_dimension()
        logger.debug(f"[Pipeline ID: {pipeline_id}] Query processor using embedding model with dimension: {expected_dimension}")
        query_vector = embedding_model.encode(query_text, convert_to_numpy=True).tolist()
        logger.debug(f"[Pipeline ID: {pipeline_id}] Generated query vector with actual dimension: {len(query_vector)}")
        logger.info(f"[Pipeline ID: {pipeline_id}] Query vector generated. Dimension: {len(query_vector)}")
        stage_processing_time_ms = (time() - stage_start_time) * 1000
        pipeline_monitor.record_event(pipeline_id, "Query Embedding Generation", data={"status": "end", "vector_dimension": len(query_vector), "processing_time_ms": stage_processing_time_ms})
    except Exception as e:
        stage_processing_time_ms = (time() - stage_start_time) * 1000
        pipeline_monitor.record_event(pipeline_id, "Query Embedding Generation", data={"status": "error", "error_message": str(e), "processing_time_ms": stage_processing_time_ms})
        pipeline_monitor.record_event(pipeline_id, "Overall Query Processing", data={"status": "error", "error_message": f"Query Embedding Error: {str(e)}", "total_processing_time_ms": (time() - overall_start_time) * 1000})
        raise HTTPException(status_code=500, detail=f"Error generating query embedding: {e}")

    stage_start_time = time()
    pipeline_monitor.record_event(pipeline_id, "Vector DB Search", data={"status": "start", "department_filter": department.lower()})
    standardized_department_query = department.lower()
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
        search_result = qdrant_client.search(
            collection_name=QDRANT_COLLECTION_NAME,
            query_vector=query_vector,
            query_filter=qdrant_filter,
            limit=5,
            with_payload=True
        )
        logger.info(f"[Pipeline ID: {pipeline_id}] Retrieved {len(search_result)} results from Qdrant.")
        if search_result:
            for i, hit in enumerate(search_result):
                logger.debug(f"[Pipeline ID: {pipeline_id}] Retrieved Qdrant Hit {i+1}: ID={hit.id}, Score={hit.score}, Payload={hit.payload}")
        stage_processing_time_ms = (time() - stage_start_time) * 1000
        pipeline_monitor.record_event(pipeline_id, "Vector DB Search", data={"status": "end", "num_results": len(search_result), "processing_time_ms": stage_processing_time_ms})
    except Exception as e:
        logger.error(f"[Pipeline ID: {pipeline_id}] Error during Qdrant search: {e}", exc_info=True)
        stage_processing_time_ms = (time() - stage_start_time) * 1000
        pipeline_monitor.record_event(pipeline_id, "Vector DB Search", data={"status": "error", "error_message": str(e), "processing_time_ms": stage_processing_time_ms})
        # Not raising HTTPException here to allow saving history even if Qdrant fails

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
        context = context[:MAX_CONTEXT_LENGTH]
        logger.info(f"[Pipeline ID: {pipeline_id}] Prepared context for LLM (length: {len(context)} chars). Number of sources: {len(sources_for_response)}")
    else:
        logger.info(f"[Pipeline ID: {pipeline_id}] No relevant documents found in Qdrant for the query and department.")
    stage_processing_time_ms = (time() - stage_start_time) * 1000
    pipeline_monitor.record_event(pipeline_id, "Context Preparation", data={"status": "end", "context_length": len(context), "num_sources": len(sources_for_response), "processing_time_ms": stage_processing_time_ms})

    stage_start_time = time()
    pipeline_monitor.record_event(pipeline_id, "LLM Prompt Preparation", data={"status": "start"})
    if not context:
        prompt = f"<s>[INST] Answer the following question. If you don\\\'t know the answer from your general knowledge, say that you don\\\'t have specific information on this topic.\n\nQuestion: {query_text} [/INST]"
    else:
        prompt = f"<s>[INST] Use the following context to answer the question. If the answer is not in the context, say you don\\\'t know.\n\nContext:\n{context}\n\nQuestion: {query_text} [/INST]"
    logger.info(f"[Pipeline ID: {pipeline_id}] LLM Prompt (first 200 chars): {prompt[:200]}...")
    stage_processing_time_ms = (time() - stage_start_time) * 1000
    pipeline_monitor.record_event(pipeline_id, "LLM Prompt Preparation", data={"status": "end", "prompt_length": len(prompt), "processing_time_ms": stage_processing_time_ms})

    stage_start_time = time()
    pipeline_monitor.record_event(pipeline_id, "LLM Call", data={"status": "start", "llm_model": LLM_MODEL_NAME})
    answer = "Error: LLM processing failed."
    try: 
        llm_response_data = llm_pipeline(prompt)
        if llm_response_data and isinstance(llm_response_data, list) and len(llm_response_data) > 0:
            full_generated_text = llm_response_data[0].get("generated_text", "")
            answer_part = full_generated_text.split("[/INST]")[-1].strip()
            if not answer_part and full_generated_text:
                answer = full_generated_text
            else:
                answer = answer_part
            logger.info(f"[Pipeline ID: {pipeline_id}] LLM generated answer (first 200 chars): {answer[:200]}...")
            stage_processing_time_ms = (time() - stage_start_time) * 1000
            pipeline_monitor.record_event(pipeline_id, "LLM Call", data={"status": "end", "answer_length": len(answer), "processing_time_ms": stage_processing_time_ms})
        else:
            logger.error(f"[Pipeline ID: {pipeline_id}] LLM pipeline returned unexpected or empty output: {llm_response_data}")
            answer = "Error: Failed to get a valid response from LLM."
            stage_processing_time_ms = (time() - stage_start_time) * 1000
            pipeline_monitor.record_event(pipeline_id, "LLM Call", data={"status": "error", "error_message": "LLM pipeline returned unexpected or empty output", "processing_time_ms": stage_processing_time_ms})
    except Exception as e: 
        logger.error(f"[Pipeline ID: {pipeline_id}] Error during LLM generation: {e}", exc_info=True)
        answer = f"Error: Exception during LLM generation - {e}"
        stage_processing_time_ms = (time() - stage_start_time) * 1000
        pipeline_monitor.record_event(pipeline_id, "LLM Call", data={"status": "error", "error_message": str(e), "processing_time_ms": stage_processing_time_ms})

    processing_time_total_ms = (time() - overall_start_time) * 1000
    logger.info(f"[Pipeline ID: {pipeline_id}] --- LOGGER: query_processor.py: process_query EXIT --- Time: {processing_time_total_ms / 1000:.2f}s ---")

    query_history_id = None
    try:
        history_entry_data = QueryHistoryCreate(
            query_text=query_text,
            response_text=answer,
            llm_model_used=LLM_MODEL_NAME,
            sources_retrieved=sources_for_history,
            processing_time_ms=int(processing_time_total_ms),
            department_filter=standardized_department_query,
            gpu_accelerated=(device == "cuda")
        )
        created_history_entry = crud_query_history.create_query_history_entry(
            db=db, query_history_data=history_entry_data, user_id=user_id
        )
        query_history_id = created_history_entry.id
        logger.info(f"[Pipeline ID: {pipeline_id}] Saved query to history with ID: {query_history_id}")
    except Exception as e:
        logger.error(f"[Pipeline ID: {pipeline_id}] Failed to save query to history: {e}", exc_info=True)

    final_response = QueryResponse(
        query=query_text,
        response=answer,
        model=LLM_MODEL_NAME,
        sources=sources_for_response,
        processing_time=round(processing_time_total_ms / 1000, 2),
        gpu_accelerated=(device == "cuda"),
        query_history_id=query_history_id
    )
    pipeline_monitor.record_event(pipeline_id, "Overall Query Processing", data={"status": "success", "total_processing_time_ms": processing_time_total_ms})
    return final_response



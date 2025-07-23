# Add this to your existing query_wrapper.py

async def process_query_with_db_logging(
    db: Session,
    query_text: str,
    department: str = "General",
    user_id: Optional[int] = None
) -> QueryResponse:
    """
    Process query with guaranteed database logging.
    """
    start_time = time.time()
    
    try:
        # Process the query (existing logic)
        response = await process_query(db, query_text, department, user_id)
        
        # Ensure query history is logged
        try:
            from app.crud.crud_query_history import create_query_history
            from app.schemas.query import QueryHistoryCreate
            
            query_history_data = QueryHistoryCreate(
                query_text=query_text,
                response_text=response.response,
                llm_model_used=response.model,
                sources_retrieved=[
                    {
                        "document_id": source.document_id,
                        "document_name": source.document_name,
                        "relevance_score": source.relevance_score
                    }
                    for source in response.sources
                ],
                processing_time_ms=int(response.processing_time * 1000),
                department_filter=department,
                gpu_accelerated=response.gpu_accelerated
            )
            
            history_entry = create_query_history(db, query_history_data, user_id)
            response.query_history_id = history_entry.id
            
            logger.info(f"Query history logged with ID: {history_entry.id}")
            
        except Exception as e:
            logger.error(f"Failed to log query history: {e}")
            # Don't fail the request if logging fails
        
        return response
        
    except Exception as e:
        logger.error(f"Query processing failed: {e}")
        
        # Log the failed query attempt
        try:
            from app.crud.crud_query_history import create_query_history
            from app.schemas.query import QueryHistoryCreate
            
            query_history_data = QueryHistoryCreate(
                query_text=query_text,
                response_text=f"Error: {str(e)}",
                llm_model_used="error",
                sources_retrieved=[],
                processing_time_ms=int((time.time() - start_time) * 1000),
                department_filter=department,
                gpu_accelerated=False
            )
            
            create_query_history(db, query_history_data, user_id)
            
        except Exception as log_error:
            logger.error(f"Failed to log error query history: {log_error}")
        
        raise
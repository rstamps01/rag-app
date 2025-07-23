# File Path: /backend/app/schemas/query.py
# Fixed version - corrected schema field mappings and consistency

from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict
from datetime import datetime

# Request model for asking a question
class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, description="The user's query text")
    department: Optional[str] = "General"
    # Optional: Add parameters like desired model, temperature, etc.
    # model: Optional[str] = None

# Model for a single source document used in the response
class SourceDocument(BaseModel):
    document_id: str                                    # Maps to filename from vector DB
    document_name: str                                  # Maps to filename from vector DB  
    relevance_score: float                             # Maps to score from vector DB
    content_snippet: Optional[str] = None             # Maps to content from vector DB (truncated)

# Response model for the query result
class QueryResponse(BaseModel):
    query: str                                         # The original user query
    response: str                                      # The AI-generated response (NOT 'answer')
    model: Optional[str] = None                        # The LLM model used (NOT 'model_used')
    sources: List[SourceDocument] = []                 # List of source documents
    processing_time: Optional[float] = None            # Time taken to process query
    gpu_accelerated: Optional[bool] = None             # Whether GPU was used
    query_history_id: Optional[int] = None             # Link to persisted history

# Schema for creating a query history entry
class QueryHistoryCreate(BaseModel):
    query_text: str
    response_text: Optional[str] = None
    llm_model_used: Optional[str] = None
    sources_retrieved: Optional[List[Dict[str, Any]]] = None  # Store as JSON-compatible structure
    processing_time_ms: Optional[int] = None
    department_filter: Optional[str] = None
    gpu_accelerated: Optional[bool] = False

# Schema for reading a query history entry
class QueryHistoryResponse(BaseModel):
    id: int
    user_id: Optional[int] = None
    query_text: str
    response_text: Optional[str] = None
    llm_model_used: Optional[str] = None
    sources_retrieved: Optional[List[Dict[str, Any]]] = None
    processing_time_ms: Optional[int] = None
    query_timestamp: datetime
    department_filter: Optional[str] = None
    gpu_accelerated: Optional[bool] = False

    class Config:
        from_attributes = True  # For SQLAlchemy model conversion

# Helper function to create SourceDocument from vector DB result
def create_source_document_from_vector_result(result: Dict[str, Any], index: int = 0) -> SourceDocument:
    """
    Create a SourceDocument from vector database search result
    
    Args:
        result: Dictionary containing vector DB result with keys like 'filename', 'content', 'score'
        index: Index for fallback document_id generation
        
    Returns:
        SourceDocument with properly mapped fields
    """
    filename = result.get("filename", f"doc_{index + 1}")
    content = result.get("content", "")
    
    return SourceDocument(
        document_id=filename,                           # Map filename to document_id
        document_name=filename,                         # Map filename to document_name
        relevance_score=result.get("score", 0.0),      # Map score to relevance_score
        content_snippet=content[:200] + "..." if len(content) > 200 else content  # Truncate content
    )

# Helper function to create QueryResponse with proper field mapping
def create_query_response(
    query: str,
    response_text: str,
    model_name: str = "mistral-7b",
    sources: List[SourceDocument] = None,
    processing_time: float = 0.0,
    gpu_accelerated: bool = False,
    query_history_id: Optional[int] = None
) -> QueryResponse:
    """
    Create a QueryResponse with proper field mapping
    
    Args:
        query: The original user query
        response_text: The AI-generated response
        model_name: The LLM model used
        sources: List of source documents
        processing_time: Time taken to process
        gpu_accelerated: Whether GPU was used
        query_history_id: Optional history ID
        
    Returns:
        QueryResponse with all fields properly set
    """
    return QueryResponse(
        query=query,
        response=response_text,                         # Use 'response' not 'answer'
        model=model_name,                              # Use 'model' not 'model_used'
        sources=sources or [],
        processing_time=processing_time,
        gpu_accelerated=gpu_accelerated,
        query_history_id=query_history_id
    )

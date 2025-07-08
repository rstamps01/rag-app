# File Path: /home/ubuntu/rag_app_extracted/rag-app/backend/app/schemas/query.py
from pydantic import BaseModel, Field
from typing import List, Optional, Any, Dict # Added Dict to imports
from datetime import datetime # Added for QueryHistory models

# Request model for asking a question
class QueryRequest(BaseModel):
    query: str = Field(..., min_length=1, description="The user_s query text")
    department: Optional[str] = "General"
    # Optional: Add parameters like desired model, temperature, etc.
    # model: Optional[str] = None

# Model for a single source document used in the response
class SourceDocument(BaseModel):
    document_id: str
    document_name: str
    relevance_score: float
    content_snippet: Optional[str] = None # Optional snippet from the source

# Response model for the query result
class QueryResponse(BaseModel):
    query: str
    response: str
    model: Optional[str] # The LLM model used, made optional to match processor
    sources: List[SourceDocument]
    processing_time: Optional[float] = None
    gpu_accelerated: Optional[bool] = None
    query_history_id: Optional[int] = None # Added to link to persisted history

# Schema for creating a query history entry
class QueryHistoryCreate(BaseModel):
    query_text: str
    response_text: Optional[str] = None
    llm_model_used: Optional[str] = None
    sources_retrieved: Optional[List[Dict[str, Any]]] = None # Store as JSON-compatible structure
    processing_time_ms: Optional[int] = None
    department_filter: Optional[str] = None
    gpu_accelerated: Optional[bool] = False

# Schema for reading a query history entry (can be same as QueryResponse or more detailed)
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
        orm_mode = True # For SQLAlchemy model conversion


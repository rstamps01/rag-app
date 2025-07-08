from pydantic import BaseModel
from typing import List, Optional

class Source(BaseModel):
    document_id: str
    document_name: str
    relevance_score: float
    content_snippet: str

class QueryRequest(BaseModel):
    query: str
    model: str = "default"
    max_results: int = 5

class QueryResponse(BaseModel):
    query: str
    response: str
    model: str
    sources: List[Source]
    processing_time: float
    gpu_accelerated: bool

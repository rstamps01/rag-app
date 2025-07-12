# Fixed version of app/schemas/document.py
# This file should only contain Pydantic models, not API route logic

from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
import uuid

class DocumentMetadata(BaseModel):
    """Document metadata model for API responses."""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    content_type: Optional[str] = None
    size: int
    upload_date: datetime = Field(default_factory=datetime.now)
    status: str = "pending"  # e.g., pending, processing, completed, failed, uploaded
    path: Optional[str] = None  # Path where the raw file is stored
    error_message: Optional[str] = None

class DocumentCreate(BaseModel):
    """Document creation model for database operations."""
    filename: str
    content_type: Optional[str] = None
    size: int
    status: str = "pending"
    path: Optional[str] = None

class DocumentUpdate(BaseModel):
    """Document update model for database operations."""
    status: Optional[str] = None
    error_message: Optional[str] = None
    processed_date: Optional[datetime] = None

class DocumentList(BaseModel):
    """Document list response model."""
    documents: List[DocumentMetadata]
    total_count: int

class DocumentResponse(BaseModel):
    """Single document response model."""
    document: DocumentMetadata
    message: Optional[str] = None

# ✅ REMOVED: All router and API logic that was incorrectly placed in this schemas file
# The schemas file should only contain Pydantic models for data validation and serialization

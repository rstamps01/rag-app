# File Path: /backend/app/schemas/document.py
# Fixed version - removed circular import and route logic

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import uuid

class DocumentMetadata(BaseModel):
    """Schema for document metadata used in API responses"""
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    content_type: Optional[str] = None
    size: int
    upload_date: datetime = Field(default_factory=datetime.now)
    status: str = "pending"  # e.g., pending, processing, completed, failed
    path: Optional[str] = None  # Path where the raw file is stored
    error_message: Optional[str] = None

class DocumentList(BaseModel):
    """Schema for listing multiple documents"""
    documents: list[DocumentMetadata]
    total_count: int  # Added for pagination response

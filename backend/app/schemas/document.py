"""
Corrected Document Schema - Fixes Pydantic Validation Error
This schema matches the field names used in the documents route
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

class DocumentMetadata(BaseModel):
    """
    CORRECTED: Document metadata schema with proper field names
    """
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    filename: str
    department: str = "General"  # ADDED: Department field for categorization
    content_type: Optional[str] = None
    file_size: int  # CORRECTED: Changed from 'size' to 'file_size' to match route usage
    upload_time: float = Field(default_factory=lambda: datetime.now().timestamp())  # CORRECTED: Changed from 'upload_date' to 'upload_time'
    status: str = "pending"  # e.g., pending, processing, completed, failed
    path: Optional[str] = None  # Path where the raw file is stored
    error_message: Optional[str] = None

    class Config:
        """Pydantic configuration"""
        json_encoders = {
            datetime: lambda v: v.timestamp()
        }

class DocumentCreate(BaseModel):
    """Schema for creating a new document"""
    filename: str
    department: str = "General"
    content_type: Optional[str] = None

class DocumentUpdate(BaseModel):
    """Schema for updating document metadata"""
    status: Optional[str] = None
    department: Optional[str] = None
    error_message: Optional[str] = None

class DocumentList(BaseModel):
    """Schema for document list response"""
    documents: List[DocumentMetadata]
    total_count: int

class DocumentResponse(BaseModel):
    """Schema for single document response"""
    success: bool
    message: str
    document: Optional[DocumentMetadata] = None

# Department validation
VALID_DEPARTMENTS = ["General", "IT", "HR", "Finance", "Legal"]

def validate_department(department: str) -> str:
    """Validate and normalize department name"""
    if department not in VALID_DEPARTMENTS:
        return "General"  # Default fallback
    return department

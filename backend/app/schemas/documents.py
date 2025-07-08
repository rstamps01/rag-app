from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class DocumentBase(BaseModel):
    filename: str
    content_type: str

class DocumentCreate(DocumentBase):
    pass

class Document(DocumentBase):
    id: str
    size: int
    upload_date: str
    status: str
    path: str

class DocumentList(BaseModel):
    documents: List[Document]

# Import all necessary schemas to make them directly accessible from app.schemas

# Document schemas
from .documents import DocumentBase, DocumentCreate, Document, DocumentList
from .document import DocumentMetadata

# User schemas  
from .user import UserBase, UserCreate, UserUpdate, UserInDBBase, UserInDB, User

# Auth schemas
from .auth import Token, TokenPayload
from .auth import UserCreate as AuthUserCreate, User as AuthUser

# Query schemas
from .query import QueryRequest, QueryResponse, QueryHistoryCreate, QueryHistoryResponse
from .queries import Source
from .queries import QueryRequest as QueriesQueryRequest, QueryResponse as QueriesQueryResponse

# Admin schemas
from .admin import UserAdmin
from .admin import UserUpdate as AdminUserUpdate

# Token schemas
from .token import Token as TokenSchema, TokenData

# Make commonly used schemas available at package level
__all__ = [
    # Document schemas
    "DocumentBase", "DocumentCreate", "Document", "DocumentList", "DocumentMetadata",
    
    # User schemas
    "UserBase", "UserCreate", "UserUpdate", "UserInDBBase", "UserInDB", "User",
    
    # Auth schemas
    "Token", "TokenPayload", "AuthUserCreate", "AuthUser",
    
    # Query schemas
    "QueryRequest", "QueryResponse", "QueryHistoryCreate", "QueryHistoryResponse",
    "Source", "QueriesQueryRequest", "QueriesQueryResponse",
    
    # Admin schemas
    "UserAdmin", "AdminUserUpdate",
    
    # Token schemas
    "TokenSchema", "TokenData"
]

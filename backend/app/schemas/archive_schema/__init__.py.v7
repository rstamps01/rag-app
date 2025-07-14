# Import all necessary schemas to make them directly accessible from app.schemas

# Document schemas
from .documents import DocumentBase, DocumentCreate, Document, DocumentList
# Note: DocumentMetadata import commented out - uncomment if needed and available
from .document import DocumentMetadata

# User schemas  
from .user import UserBase, UserCreate, UserUpdate, UserInDBBase, UserInDB, User

# Auth schemas - consolidated imports with clear naming
from .auth import Token as AuthToken, TokenPayload, UserCreate as AuthUserCreate, User as AuthUser

# Query schemas - using primary query module
from .query import QueryRequest, QueryResponse, QueryHistoryCreate, QueryHistoryResponse

# Additional query schemas from queries module (with descriptive aliases)
from .queries import Source, QueryRequest as SpecializedQueryRequest, QueryResponse as SpecializedQueryResponse

# Admin schemas
from .admin import UserAdmin, UserUpdate as AdminUserUpdate

# Token schemas - using descriptive alias to avoid conflict with AuthToken
from .token import Token as TokenSchema, TokenData

# Make commonly used schemas available at package level
__all__ = [
    # Document schemas
    "DocumentBase", "DocumentCreate", "Document", "DocumentList",
    "DocumentMetadata",  # Commented out since import is commented out
    
    # User schemas
    "UserBase", "UserCreate", "UserUpdate", "UserInDBBase", "UserInDB", "User",
    
    # Auth schemas - using clear names
    "AuthToken", "TokenPayload", "AuthUserCreate", "AuthUser",
    
    # Query schemas - primary schemas
    "QueryRequest", "QueryResponse", "QueryHistoryCreate", "QueryHistoryResponse",
    
    # Specialized query schemas
    "Source", "SpecializedQueryRequest", "SpecializedQueryResponse",
    
    # Admin schemas
    "UserAdmin", "AdminUserUpdate",
    
    # Token schemas
    "TokenSchema", "TokenData"
]

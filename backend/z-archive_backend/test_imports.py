# test_imports.py
try:
    # Test document schemas
    from app.schemas import DocumentBase, DocumentCreate, Document, DocumentList
    
    # Test user schemas
    from app.schemas import UserBase, UserCreate, UserUpdate, UserInDBBase, UserInDB, User
    
    # Test auth schemas
    from app.schemas import AuthToken, TokenPayload, AuthUserCreate, AuthUser
    
    # Test query schemas
    from app.schemas import QueryRequest, QueryResponse, QueryHistoryCreate, QueryHistoryResponse
    
    # Test additional schemas
    from app.schemas import Source, UserAdmin, AdminUserUpdate, TokenSchema, TokenData
    
    print("✅ All imports successful!")
    
except ImportError as e:
    print(f"❌ Import error: {e}")

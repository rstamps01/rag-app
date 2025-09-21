# File: backend/app/services/integrated_database_service.py
"""
Integrated Database Service Layer
Combines the best of original and new approaches while preserving all functionality
"""

from typing import List, Optional, Dict, Any
from sqlalchemy.orm import Session
from sqlalchemy import desc, func, create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool
from sqlalchemy import text
from app.models.models import User, Document, QueryHistory
from app.core.config import settings
import logging
from datetime import datetime
import asyncio
import asyncpg

logger = logging.getLogger(__name__)

class IntegratedDatabaseManager:
    """Enhanced database manager with connection pooling and health checks"""
    
    def __init__(self):
        self.engine = None
        self.SessionLocal = None
        self.async_pool = None
        self.is_connected = False
        self.is_async_available = False
        self.initialize_database()
    
    def initialize_database(self):
        """Initialize both sync and async database connections with enhanced configuration"""
        try:
            # Initialize synchronous connection with pooling
            self.engine = create_engine(
                settings.DATABASE_URL,
                poolclass=QueuePool,
                pool_size=20,
                max_overflow=40,
                pool_pre_ping=True,
                pool_recycle=3600,
                echo=False  # Set to True for SQL debugging
            )
            
            # Create session factory
            self.SessionLocal = sessionmaker(
                autocommit=False,
                autoflush=False,
                bind=self.engine
            )
            
            # Test synchronous connection
            self.test_connection()
            
            # Initialize asynchronous connection pool (for backward compatibility)
            try:
                asyncio.create_task(self._initialize_async_pool())
                self.is_async_available = True
                logger.info("✅ Async database pool initialization started")
            except Exception as e:
                logger.warning(f"⚠️ Async database pool not available: {e}")
                self.is_async_available = False
            
            logger.info("✅ Integrated database manager initialized")
            
        except Exception as e:
            logger.error(f"❌ Database initialization failed: {e}")
            self.is_connected = False
    
    async def _initialize_async_pool(self):
        """Initialize async connection pool for backward compatibility"""
        try:
            # Convert PostgreSQL URL for asyncpg
            async_url = settings.DATABASE_URL.replace("postgresql://", "postgresql://")
            self.async_pool = await asyncpg.create_pool(async_url)
            logger.info("✅ Async database pool initialized")
        except Exception as e:
            logger.error(f"❌ Async database pool initialization failed: {e}")
            self.is_async_available = False

    def test_connection(self):
        try:
            with self.engine.connect() as conn:
                conn.execute(text("SELECT 1"))  # ✅ Fixed
            self.is_connected = True
            logger.info("✅ Database connection healthy")
        except Exception as e:
            logger.error(f"❌ Database connection failed: {e}")
            self.is_connected = False
    
    def get_session(self) -> Session:
        """Get database session with error handling"""
        if not self.is_connected:
            self.test_connection()
        
        if self.SessionLocal:
            return self.SessionLocal()
        else:
            raise Exception("Database not initialized")

    def health_check(self) -> bool:
        """Perform database health check"""
        try:
            with self.get_session() as session:
                session.execute(text("SELECT 1"))  # ✅ Fixed
            return True
        except Exception:
            return False
    
    async def get_async_connection(self):
        """Get async database connection for backward compatibility"""
        if self.is_async_available and self.async_pool:
            return self.async_pool.acquire()
        else:
            raise Exception("Async database pool not available")

class IntegratedDatabaseService:
    """High-level database service that preserves all original functionality"""
    
    def __init__(self):
        self.db_manager = IntegratedDatabaseManager()
    
    def is_available(self) -> bool:
        """Check if database is available"""
        return self.db_manager.is_connected
    
    def is_async_available(self) -> bool:
        """Check if async database operations are available"""
        return self.db_manager.is_async_available
    
    # Query History Operations (preserving original field names)
    def store_query(
        self,
        query_text: str,
        response_text: str,
        model_used: str,
        processing_time_ms: int,
        department: str = "General",
        user_id: Optional[int] = None,
        sources_retrieved: Optional[List[Dict]] = None  # Original field name preserved
    ) -> Optional[int]:
        """Store query in database with original field names"""
        if not self.is_available():
            return None
        
        try:
            with self.db_manager.get_session() as db:
                query_record = QueryHistory(
                    user_id=user_id,
                    query_text=query_text,
                    response_text=response_text,
                    llm_model_used=model_used,
                    processing_time_ms=processing_time_ms,
                    department_filter=department,
                    sources_retrieved=sources_retrieved,  # Original field name
                    gpu_accelerated=True
                )
                
                db.add(query_record)
                db.commit()
                db.refresh(query_record)
                
                logger.info(f"Query stored with ID: {query_record.id}")
                return query_record.id
                
        except Exception as e:
            logger.error(f"Failed to store query: {e}")
            return None
    
    def get_query_history(
        self,
        skip: int = 0,
        limit: int = 10,
        user_id: Optional[int] = None,
        department: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get query history from database with enhanced error handling"""
        if not self.is_available():
            return {"queries": [], "total": 0, "source": "unavailable"}
        
        try:
            with self.db_manager.get_session() as db:
                query = db.query(QueryHistory)
                
                # Apply filters
                if user_id:
                    query = query.filter(QueryHistory.user_id == user_id)
                if department:
                    query = query.filter(QueryHistory.department_filter == department)
                
                # Get total count
                total = query.count()
                
                # Apply pagination and ordering
                queries = query.order_by(desc(QueryHistory.query_timestamp)).offset(skip).limit(limit).all()
                
                # Convert to dict format (preserving original field names)
                query_list = []
                for q in queries:
                    query_list.append({
                        "id": q.id,
                        "query": q.query_text,
                        "response": q.response_text,
                        "department": q.department_filter or "General",
                        "timestamp": q.query_timestamp.timestamp() if q.query_timestamp else 0,
                        "model": q.llm_model_used or "unknown",
                        "processing_time": q.processing_time_ms / 1000.0 if q.processing_time_ms else None,
                        "sources": q.sources_retrieved or []  # Original field name
                    })
                
                return {
                    "queries": query_list,
                    "total": total,
                    "source": "database"
                }
                
        except Exception as e:
            logger.error(f"Failed to get query history: {e}")
            return {"queries": [], "total": 0, "source": "error"}
    
    # Document Operations (preserving original field names)
    def store_document(
        self,
        document_id: str,  # Original field name preserved
        filename: str,
        content_type: str,
        size: int,
        file_path: str,
        department: str = "General",
        status: str = "uploaded"
    ) -> bool:
        """Store document metadata in database with original field names"""
        if not self.is_available():
            return False
        
        try:
            with self.db_manager.get_session() as db:
                document = Document(
                    id=document_id,  # Original field name
                    filename=filename,
                    content_type=content_type,
                    size=size,
                    path=file_path,
                    department=department,
                    status=status
                )
                
                db.add(document)
                db.commit()
                
                logger.info(f"Document stored: {document_id}")
                return True
                
        except Exception as e:
            logger.error(f"Failed to store document: {e}")
            return False
    
    def get_documents(
        self,
        skip: int = 0,
        limit: int = 100,
        department: Optional[str] = None,
        status: Optional[str] = None
    ) -> Dict[str, Any]:
        """Get documents from database with enhanced error handling"""
        if not self.is_available():
            return {"documents": [], "total": 0, "source": "unavailable"}
        
        try:
            with self.db_manager.get_session() as db:
                query = db.query(Document)
                
                # Apply filters
                if department:
                    query = query.filter(Document.department == department)
                if status:
                    query = query.filter(Document.status == status)
                
                # Get total count
                total = query.count()
                
                # Apply pagination and ordering
                documents = query.order_by(desc(Document.upload_date)).offset(skip).limit(limit).all()
                
                # Convert to dict format
                doc_list = []
                for doc in documents:
                    doc_list.append({
                        "id": doc.id,  # Original field name
                        "filename": doc.filename,
                        "upload_date": doc.upload_date.isoformat() if doc.upload_date else "",
                        "size": doc.size or 0,
                        "status": doc.status,
                        "department": doc.department,
                        "content_type": doc.content_type
                    })
                
                return {
                    "documents": doc_list,
                    "total": total,
                    "source": "database"
                }
                
        except Exception as e:
            logger.error(f"Failed to get documents: {e}")
            return {"documents": [], "total": 0, "source": "error"}
    
    def update_document_status(
        self, 
        document_id: str,  # Original field name preserved
        status: str, 
        error_message: str = None
    ) -> bool:
        """Update document processing status with original field names"""
        if not self.is_available():
            return False
        
        try:
            with self.db_manager.get_session() as db:
                document = db.query(Document).filter(Document.id == document_id).first()
                if document:
                    document.status = status
                    if error_message:
                        document.error_message = error_message
                    db.commit()
                    logger.info(f"Document {document_id} status updated to {status}")
                    return True
                
        except Exception as e:
            logger.error(f"Failed to update document status: {e}")
        
        return False
    
    # Async methods for backward compatibility
    async def store_document_async(
        self,
        document_id: str,
        filename: str,
        file_path: str,
        size: int,
        department: str = "General"
    ) -> bool:
        """Async document storage for backward compatibility"""
        if not self.is_async_available():
            # Fall back to sync method
            return self.store_document(
                document_id=document_id,
                filename=filename,
                content_type="application/octet-stream",
                size=size,
                file_path=file_path,
                department=department
            )
        
        try:
            async with self.db_manager.get_async_connection() as conn:
                await conn.execute(
                    """
                    INSERT INTO documents (id, filename, path, size, department, status, upload_date)
                    VALUES ($1, $2, $3, $4, $5, $6, $7)
                    """,
                    document_id, filename, file_path, size, department, "uploaded", datetime.utcnow()
                )
                logger.info(f"Document stored async: {document_id}")
                return True
        except Exception as e:
            logger.error(f"Failed to store document async: {e}")
            return False

# Global integrated database service instance
integrated_database_service = IntegratedDatabaseService()

def get_db():
    """Database dependency for FastAPI routes"""
    if not integrated_database_service.is_available():
        return None
    
    db = integrated_database_service.db_manager.get_session()
    try:
        yield db
    finally:
        db.close()

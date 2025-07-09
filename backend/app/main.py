from fastapi import FastAPI, Depends, HTTPException, APIRouter, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, documents, queries, admin, system
from app.core.config import settings
from app.api.routes import monitoring
from typing import List
import os
import logging
import sys

# --- Database Table Creation --- 
from app.db.base import Base, engine
from app.models import models as db_models

# Configure basic logging to output to stdout
logging.basicConfig(
    level=logging.INFO, 
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    stream=sys.stdout
)

logger = logging.getLogger(__name__)

def create_db_and_tables():
    """
    Create database tables if they don't exist.
    Uses SQLAlchemy's create_all method which is safe to call multiple times.
    """
    logger.info("Creating database tables (if they don't exist)...")
    try:
        db_models.Base.metadata.create_all(bind=engine)
        logger.info("Database tables checked/created successfully.")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}", exc_info=True)
        # Log the error but don't raise to allow app to start even with table issues
        # This helps in scenarios where some tables exist but others have issues

app = FastAPI(
    title="RAG AI Application API", 
    version="1.0.0",
    description="Retrieval-Augmented Generation API for document processing and querying",
    docs_url="/docs",
    redoc_url="/redoc"
)

@app.on_event("startup")
async def on_startup():
    """
    Startup event handler that runs when the application starts.
    Initializes database tables and performs other startup tasks.
    """
    logger.info("Application startup: Initializing database...")
    create_db_and_tables()
    
    # Create necessary directories
    os.makedirs("/app/data/uploads", exist_ok=True)
    os.makedirs("/app/data/logs", exist_ok=True)
    os.makedirs("/app/models_cache", exist_ok=True)
    
    logger.info("Application startup completed successfully.")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, this should be restricted to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers with consistent prefix pattern
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["authentication"])
app.include_router(documents.router, prefix=f"{settings.API_V1_STR}/documents", tags=["documents"])
app.include_router(queries.router, prefix=f"{settings.API_V1_STR}/queries", tags=["queries"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin"])
app.include_router(system.router, prefix=f"{settings.API_V1_STR}/system", tags=["system"])
app.include_router(monitoring.router, prefix=f"{settings.API_V1_STR}/monitoring", tags=["monitoring"])

# Include monitoring router
app.include_router(monitoring.router, prefix="/api/v1/monitoring", tags=["monitoring"])

@app.get("/")
async def root():
    """
    Root endpoint that returns basic API information.
    """
    return {
        "message": "Welcome to RAG AI Application API",
        "version": "1.0.0",
        "documentation": "/docs",
        "redoc": "/redoc",
        "rtx5090_optimized": True
    }

@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring and load balancers.
    Returns a simple status indicating the API is running.
    """
    return {
        "status": "healthy",
        "database": "connected" if engine else "disconnected",
        "timestamp": datetime.datetime.now().isoformat()
    }



# Import here to avoid circular imports
import datetime

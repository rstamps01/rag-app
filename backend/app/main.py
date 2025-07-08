from fastapi import FastAPI, Depends, HTTPException, APIRouter, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, documents, queries, admin, system
from app.core.config import settings
from app.api.routes import monitoring
from typing import List
import os
import logging # Added
import sys # Added

# --- Database Table Creation --- 
from app.db.base import Base, engine # Import Base and engine
from app.models import models as db_models # Import all models to ensure they are registered with Base

# Configure basic logging to output to stdout
logging.basicConfig(
    level=logging.INFO, 
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    stream=sys.stdout
)

logger = logging.getLogger(__name__) # Get a logger instance

def create_db_and_tables():
    logger.info("Creating database tables (if they don't exist)...")
    try:
        db_models.Base.metadata.create_all(bind=engine)
        logger.info("Database tables checked/created successfully.")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}", exc_info=True)
        # Depending on the severity, you might want to raise the exception
        # or handle it to allow the app to start if tables already exist
        # and the error is non-critical (e.g., permissions issue for a specific index type)

app = FastAPI(title="RAG AI Application API", version="1.0.0")

@app.on_event("startup")
async def on_startup():
    logger.info("Application startup: Initializing database...")
    create_db_and_tables() # Call the function to create tables

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["authentication"])
app.include_router(documents.router, prefix=f"{settings.API_V1_STR}/documents", tags=["documents"])
app.include_router(queries.router, prefix=f"{settings.API_V1_STR}/queries", tags=["queries"])
app.include_router(admin.router, prefix=f"{settings.API_V1_STR}/admin", tags=["admin"])
app.include_router(system.router, prefix=f"{settings.API_V1_STR}/system", tags=["system"])
app.include_router(monitoring.router, tags=["monitoring"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to RAG AI Application API",
        "version": "1.0.0",
        "documentation": "/docs",
        "rtx5090_optimized": True
    }

@app.get("/health")
async def health_check():
    return {"status": "healthy"}


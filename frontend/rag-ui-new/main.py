from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import auth, documents, queries, admin, system
from app.core.config import settings
from app.api.routes import monitoring
import os

app = FastAPI(title="RAG AI Application API", version="1.0.0")

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

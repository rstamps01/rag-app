#!/usr/bin/env python3
"""
Model Download Script for RAG Application

This script pre-downloads models required by the RAG application during Docker build,
ensuring they're available when the application starts. This improves startup time
and ensures the application can run even without internet access after deployment.

Models downloaded:
1. Embedding model (sentence-transformers/all-MiniLM-L6-v2)
2. LLM model (mistralai/Mistral-7B-Instruct-v0.2) - Updated to latest stable version

Usage:
    python download_models.py

Environment variables:
    HUGGING_FACE_HUB_TOKEN: HuggingFace token for downloading models
"""

import os
import logging
import sys
from huggingface_hub import login
from sentence_transformers import SentenceTransformer
from transformers import AutoTokenizer, AutoModelForCausalLM
import torch

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    stream=sys.stdout
)
logger = logging.getLogger("model_downloader")

# Model configuration
EMBEDDING_MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"
LLM_MODEL_NAME = "mistralai/Mistral-7B-Instruct-v0.2"  # Updated to latest stable version
CACHE_DIR = "/app/models_cache"
HF_TOKEN = os.environ.get("HUGGING_FACE_HUB_TOKEN")

def main():
    """Main function to download all required models."""
    logger.info("Starting model download process")
    
    # Create cache directory if it doesn't exist
    os.makedirs(CACHE_DIR, exist_ok=True)
    logger.info(f"Using cache directory: {CACHE_DIR}")
    
    # Login to Hugging Face Hub if token is provided
    if HF_TOKEN:
        logger.info("Logging in to Hugging Face Hub")
        login(token=HF_TOKEN)
    else:
        logger.warning("No Hugging Face token provided. Some models may not download correctly.")
    
    # Determine device
    device = "cuda" if torch.cuda.is_available() else "cpu"
    logger.info(f"Using device: {device}")
    
    # Download embedding model
    try:
        logger.info(f"Downloading embedding model: {EMBEDDING_MODEL_NAME}")
        embedding_model = SentenceTransformer(
            EMBEDDING_MODEL_NAME, 
            device=device,
            cache_folder=CACHE_DIR
        )
        logger.info(f"Successfully downloaded embedding model. Dimension: {embedding_model.get_sentence_embedding_dimension()}")
    except Exception as e:
        logger.error(f"Failed to download embedding model: {e}", exc_info=True)
    
    # Download LLM model
    try:
        logger.info(f"Downloading LLM model: {LLM_MODEL_NAME}")
        
        # Download tokenizer
        tokenizer = AutoTokenizer.from_pretrained(
            LLM_MODEL_NAME,
            cache_dir=CACHE_DIR
        )
        logger.info("Successfully downloaded tokenizer")
        
        # Download model
        dtype = torch.float16 if device == "cuda" else torch.float32
        model = AutoModelForCausalLM.from_pretrained(
            LLM_MODEL_NAME,
            torch_dtype=dtype,
            cache_dir=CACHE_DIR,
            device_map="auto" if device == "cuda" else None
        )
        logger.info("Successfully downloaded LLM model")
    except Exception as e:
        logger.error(f"Failed to download LLM model: {e}", exc_info=True)
    
    logger.info("Model download process completed")

if __name__ == "__main__":
    main()

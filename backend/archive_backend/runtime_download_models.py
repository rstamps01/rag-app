#!/usr/bin/env python3
"""
Runtime Model Download Solution
Downloads models when container starts, not during build
This ensures environment variables and authentication are available
"""

import os
import sys
import logging
import torch
import asyncio
from pathlib import Path
from transformers import (
    AutoTokenizer, 
    AutoModelForCausalLM, 
    pipeline
)
from sentence_transformers import SentenceTransformer
import gc

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Model configurations
EMBEDDING_MODEL_NAME = os.getenv("EMBEDDING_MODEL_NAME", "sentence-transformers/all-MiniLM-L6-v2")
LLM_MODEL_NAME = os.getenv("LLM_MODEL_NAME", "mistralai/Mistral-7B-Instruct-v0.1")
MODELS_CACHE_DIR = os.getenv("MODELS_CACHE_DIR", "/app/models_cache")
HF_TOKEN = os.getenv("HUGGINGFACE_TOKEN")

def check_models_exist():
    """Check if models are already downloaded"""
    cache_path = Path(MODELS_CACHE_DIR)
    
    # Check for embedding model
    embedding_exists = any(cache_path.rglob("*all-MiniLM-L6-v2*"))
    
    # Check for LLM model  
    llm_exists = any(cache_path.rglob("*Mistral-7B-Instruct*"))
    
    logger.info(f"Models status - Embedding: {'✅' if embedding_exists else '❌'}, LLM: {'✅' if llm_exists else '❌'}")
    
    return embedding_exists and llm_exists

def setup_environment():
    """Setup environment and verify authentication"""
    logger.info("Setting up environment...")
    
    # Create cache directory
    os.makedirs(MODELS_CACHE_DIR, exist_ok=True)
    
    # Set HuggingFace cache directory
    os.environ['TRANSFORMERS_CACHE'] = MODELS_CACHE_DIR
    os.environ['HF_HOME'] = MODELS_CACHE_DIR
    
    # Check authentication
    if not HF_TOKEN:
        logger.warning("⚠️ No HUGGINGFACE_TOKEN found in environment")
        logger.warning("   Some models may not be accessible")
    else:
        logger.info("✅ HuggingFace token found")
        # Set token for transformers
        os.environ['HF_TOKEN'] = HF_TOKEN
    
    # Check GPU availability
    if torch.cuda.is_available():
        gpu_name = torch.cuda.get_device_name(0)
        gpu_memory = torch.cuda.get_device_properties(0).total_memory / 1024**3
        logger.info(f"GPU detected: {gpu_name} ({gpu_memory:.1f}GB)")
        
        # RTX 5090 optimizations
        if "RTX 5090" in gpu_name or "5090" in gpu_name:
            logger.info("RTX 5090 detected - enabling optimizations")
            torch.set_float32_matmul_precision('high')
            torch.backends.cuda.matmul.allow_tf32 = True
            torch.backends.cudnn.allow_tf32 = True
    else:
        logger.info("No GPU detected - using CPU mode")
    
    return torch.cuda.is_available()

def download_embedding_model():
    """Download embedding model with authentication"""
    try:
        logger.info(f"Downloading embedding model: {EMBEDDING_MODEL_NAME}")
        
        # Configure authentication
        model_kwargs = {"cache_folder": MODELS_CACHE_DIR}
        if HF_TOKEN:
            model_kwargs["token"] = HF_TOKEN
        
        # Download and cache the model
        model = SentenceTransformer(EMBEDDING_MODEL_NAME, **model_kwargs)
        
        # Test the model
        test_text = "This is a test sentence."
        embedding = model.encode(test_text)
        
        logger.info(f"✅ Embedding model downloaded successfully")
        logger.info(f"   Model dimension: {len(embedding)}")
        
        # Clean up memory
        del model
        gc.collect()
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to download embedding model: {str(e)}")
        if "401" in str(e) or "unauthorized" in str(e).lower():
            logger.error("   Authentication issue - check HUGGINGFACE_TOKEN")
        return False

def download_llm_model(use_gpu=True):
    """Download LLM model with authentication"""
    try:
        logger.info(f"Downloading LLM model: {LLM_MODEL_NAME}")
        
        # Configure device and dtype
        device = "cuda" if use_gpu and torch.cuda.is_available() else "cpu"
        dtype = torch.float16 if device == "cuda" else torch.float32
        
        logger.info(f"Using device: {device}, dtype: {dtype}")
        
        # Configure authentication
        auth_kwargs = {"cache_dir": MODELS_CACHE_DIR}
        if HF_TOKEN:
            auth_kwargs["token"] = HF_TOKEN
        
        # Step 1: Download tokenizer
        logger.info("Step 1: Downloading tokenizer...")
        tokenizer = AutoTokenizer.from_pretrained(
            LLM_MODEL_NAME,
            trust_remote_code=True,
            **auth_kwargs
        )
        logger.info("✅ Tokenizer downloaded successfully")
        
        # Step 2: Download model
        logger.info("Step 2: Downloading model...")
        
        model_kwargs = {
            "torch_dtype": dtype,
            "trust_remote_code": True,
            "low_cpu_mem_usage": True,
            **auth_kwargs
        }
        
        # Add device mapping for GPU
        if device == "cuda":
            model_kwargs["device_map"] = "auto"
            
            # Add quantization for memory efficiency
            if torch.cuda.get_device_properties(0).total_memory < 20 * 1024**3:
                logger.info("Enabling 8-bit quantization for memory efficiency")
                model_kwargs["load_in_8bit"] = True
        
        model = AutoModelForCausalLM.from_pretrained(LLM_MODEL_NAME, **model_kwargs)
        
        logger.info("✅ Model downloaded successfully")
        
        # Test the model
        logger.info("Step 3: Testing model functionality...")
        
        test_prompt = "Hello, how are you?"
        inputs = tokenizer(test_prompt, return_tensors="pt")
        
        if device == "cuda":
            inputs = {k: v.to(device) for k, v in inputs.items()}
        
        with torch.no_grad():
            outputs = model.generate(
                **inputs,
                max_new_tokens=10,
                do_sample=False,
                pad_token_id=tokenizer.eos_token_id
            )
        
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        logger.info(f"✅ Model test successful. Response: {response[:50]}...")
        
        # Clean up memory
        del model, tokenizer, inputs, outputs
        if device == "cuda":
            torch.cuda.empty_cache()
        gc.collect()
        
        return True
        
    except Exception as e:
        logger.error(f"❌ Failed to download LLM model: {str(e)}")
        
        if "401" in str(e) or "unauthorized" in str(e).lower():
            logger.error("   Authentication error - check HUGGINGFACE_TOKEN")
        elif "not found" in str(e).lower():
            logger.error("   Model not found - check model name or access permissions")
        elif "memory" in str(e).lower():
            logger.error("   Memory error - trying CPU mode")
            return download_llm_model(use_gpu=False)
        
        return False

async def download_models_async():
    """Async wrapper for model downloads"""
    logger.info("🚀 Starting runtime model download...")
    
    # Check if models already exist
    if check_models_exist():
        logger.info("🎉 Models already downloaded and cached!")
        return True
    
    # Setup environment
    use_gpu = setup_environment()
    
    success_count = 0
    total_models = 2
    
    # Download embedding model
    if download_embedding_model():
        success_count += 1
    
    # Download LLM model
    if download_llm_model(use_gpu=use_gpu):
        success_count += 1
    
    if success_count == total_models:
        logger.info("🎉 All models downloaded successfully!")
        return True
    else:
        logger.error(f"❌ Only {success_count}/{total_models} models downloaded")
        return False

def main():
    """Main download process"""
    try:
        # Run async download
        result = asyncio.run(download_models_async())
        return 0 if result else 1
    except Exception as e:
        logger.error(f"❌ Download process failed: {str(e)}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)

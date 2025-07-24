# In your LLM service
import os
from transformers import AutoModel, AutoTokenizer

# Backend cache configuration
MODEL_CACHE_DIR = "/app/models_cache"

def load_mistral_model():
    model_path = f"{MODEL_CACHE_DIR}/mistralai/Mistral-7B-Instruct-v0.2"
    
    # Load model and tokenizer
    model = AutoModel.from_pretrained(
        model_path,
        local_files_only=True,
        torch_dtype=torch.float16,  # RTX 5090 optimization
        device_map="auto"
    )
    
    tokenizer = AutoTokenizer.from_pretrained(
        model_path,
        local_files_only=True
    )
    
    return model, tokenizer

def load_embedding_model():
    model_path = f"{MODEL_CACHE_DIR}/models--sentence-transformers--all-MiniLM-L6-v2"
    
    from sentence_transformers import SentenceTransformer
    model = SentenceTransformer(model_path)
    
    return model
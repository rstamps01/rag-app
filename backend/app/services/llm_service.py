"""
LLM Service with PyTorch SDPA Support
Singleton pattern for efficient model management and RTX 5090 Blackwell optimizations
"""

import logging
import threading
import time
from typing import Dict, Any, Optional, List, Tuple
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, GenerationConfig
from gpu_accelerator import GPUAccelerator

logger = logging.getLogger(__name__)

class LLMService:
    """
    LLM Service with singleton pattern and PyTorch SDPA optimization
    """
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(LLMService, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if hasattr(self, '_initialized'):
            return
        
        self._initialized = True
        self.model = None
        self.tokenizer = None
        self.model_name = None
        self.gpu_accelerator = GPUAccelerator()
        self.generation_config = None
        self._model_lock = threading.Lock()
        
        # Model mapping for different model IDs
        self.model_map = {
            "gpt-j-6b": "EleutherAI/gpt-j-6b",
            "llama2-7b": "meta-llama/Llama-2-7b-chat-hf", 
            "mistral-7b": "mistralai/Mistral-7B-Instruct-v0.2",
            "mistral-7b-instruct": "mistralai/Mistral-7B-Instruct-v0.2",
            "codellama-7b": "codellama/CodeLlama-7b-Python-hf",
            "falcon-7b": "tiiuae/falcon-7b-instruct"
        }
        
        logger.info("LLM Service initialized with PyTorch SDPA support")
    
    def _supports_sdpa(self) -> bool:
        """Check if PyTorch SDPA is available"""
        if hasattr(torch.nn.functional, 'scaled_dot_product_attention'):
            logger.info("PyTorch SDPA available for LLM optimization")
            return True
        
        logger.info("PyTorch SDPA not available - using eager attention")
        return False
    
    def _get_attention_implementation(self) -> str:
        """Get the best available attention implementation"""
        if self._supports_sdpa():
            return "sdpa"
        return "eager"
    
    def _check_memory_availability(self, required_memory_gb: float = 7.0) -> bool:
        """Check if enough GPU memory is available"""
        if not self.gpu_accelerator.cuda_available:
            return True  # CPU loading
        
        memory_info = self.gpu_accelerator.get_memory_info()
        available_gb = memory_info["available"] / (1024**3)
        
        if available_gb < required_memory_gb:
            logger.warning(f"Insufficient GPU memory: {available_gb:.1f}GB available, {required_memory_gb:.1f}GB required")
            return False
        
        return True
    
    def _load_model(self, model_name: str):
        """Load model with PyTorch SDPA optimization"""
        try:
            logger.info(f"Loading model: {model_name}")
            
            # Check memory availability
            if not self._check_memory_availability():
                # Try to free up memory
                if self.gpu_accelerator.cuda_available:
                    torch.cuda.empty_cache()
                    logger.info("Cleared GPU cache to free memory")
            
            model_kwargs = {
                "torch_dtype": torch.float16,
                "device_map": "cuda" if self.gpu_accelerator.cuda_available else "cpu",
                "trust_remote_code": True,
                "attn_implementation": self._get_attention_implementation()
            }
            
            logger.info(f"Using {model_kwargs['attn_implementation']} attention implementation")
            
            # Load model
            model = AutoModelForCausalLM.from_pretrained(model_name, **model_kwargs)
            tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
            
            # Configure tokenizer
            if tokenizer.pad_token is None:
                tokenizer.pad_token = tokenizer.eos_token
            
            # Set up generation config
            generation_config = GenerationConfig(
                max_new_tokens=512,
                do_sample=True,
                temperature=0.7,
                top_p=0.9,
                top_k=50,
                repetition_penalty=1.1,
                pad_token_id=tokenizer.pad_token_id,
                eos_token_id=tokenizer.eos_token_id,
                use_cache=True
            )
            
            # Apply GPU optimizations
            if self.gpu_accelerator.cuda_available:
                model = self.gpu_accelerator.optimize_model(model)
                logger.info("Applied GPU optimizations to model")
            
            logger.info(f"Model {model_name} loaded successfully with {model_kwargs['attn_implementation']} attention")
            return model, tokenizer, generation_config
            
        except Exception as e:
            logger.error(f"Failed to load model {model_name}: {e}")
            raise
    
    def load_model(self, model_id: str) -> bool:
        """Load a model by ID with thread safety"""
        with self._model_lock:
            try:
                # Check if model is already loaded
                if self.model is not None and self.model_name == model_id:
                    logger.info(f"Model {model_id} already loaded")
                    return True
                
                # Get actual model name from mapping
                model_name = self.model_map.get(model_id, model_id)
                
                # Unload existing model if different
                if self.model is not None and self.model_name != model_id:
                    logger.info(f"Unloading existing model {self.model_name}")
                    self.unload_model()
                
                # Load new model
                start_time = time.time()
                self.model, self.tokenizer, self.generation_config = self._load_model(model_name)
                self.model_name = model_id
                load_time = time.time() - start_time
                
                logger.info(f"Model {model_id} loaded successfully in {load_time:.2f}s")
                return True
                
            except Exception as e:
                logger.error(f"Failed to load model {model_id}: {e}")
                self.model = None
                self.tokenizer = None
                self.model_name = None
                self.generation_config = None
                return False
    
    def unload_model(self):
        """Unload the current model"""
        with self._model_lock:
            if self.model is not None:
                logger.info(f"Unloading model {self.model_name}")
                del self.model
                del self.tokenizer
                del self.generation_config
                self.model = None
                self.tokenizer = None
                self.model_name = None
                self.generation_config = None
                
                # Clear GPU cache
                if self.gpu_accelerator.cuda_available:
                    torch.cuda.empty_cache()
                
                logger.info("Model unloaded and GPU cache cleared")
    
    def generate_response(self, prompt: str, max_new_tokens: int = 512, temperature: float = 0.7) -> str:
        """Generate response using the loaded model"""
        if self.model is None or self.tokenizer is None:
            raise RuntimeError("No model loaded. Call load_model() first.")
        
        try:
            # Tokenize input with proper attention mask
            inputs = self.tokenizer(
                prompt,
                return_tensors="pt",
                padding=True,
                truncation=True,
                max_length=2048,
                return_attention_mask=True
            )
            
            # Move to GPU if available
            if self.gpu_accelerator.cuda_available:
                inputs = {k: v.cuda() for k, v in inputs.items()}
            
            # Update generation config
            generation_config = GenerationConfig(
                max_new_tokens=max_new_tokens,
                do_sample=True,
                temperature=temperature,
                top_p=0.9,
                top_k=50,
                repetition_penalty=1.1,
                pad_token_id=self.tokenizer.pad_token_id,
                eos_token_id=self.tokenizer.eos_token_id,
                use_cache=True
            )
            
            # Generate response
            with torch.no_grad():
                if self.gpu_accelerator.cuda_available and self.gpu_accelerator.is_blackwell():
                    # Use RTX 5090 Blackwell optimizations
                    with torch.cuda.amp.autocast(dtype=torch.float16):
                        outputs = self.model.generate(
                            input_ids=inputs["input_ids"],
                            attention_mask=inputs["attention_mask"],
                            generation_config=generation_config
                        )
                else:
                    # Standard generation
                    outputs = self.model.generate(
                        input_ids=inputs["input_ids"],
                        attention_mask=inputs["attention_mask"],
                        generation_config=generation_config
                    )
            
            # Decode response
            input_length = inputs["input_ids"].shape[1]
            generated_tokens = outputs[0][input_length:]
            response = self.tokenizer.decode(generated_tokens, skip_special_tokens=True)
            
            return response.strip()
            
        except Exception as e:
            logger.error(f"Response generation failed: {e}")
            raise
    
    def generate_response_with_context(self, context: str, query: str, max_new_tokens: int = 512) -> str:
        """Generate response with context for RAG"""
        if self.model is None or self.tokenizer is None:
            raise RuntimeError("No model loaded. Call load_model() first.")
        
        # Create prompt with context
        prompt = f"""Context: {context}

Question: {query}

Answer: """
        
        return self.generate_response(prompt, max_new_tokens)
    
    def is_model_loaded(self) -> bool:
        """Check if a model is currently loaded"""
        return self.model is not None
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the currently loaded model"""
        if not self.is_model_loaded():
            return {"status": "no_model_loaded"}
        
        memory_info = self.gpu_accelerator.get_memory_info() if self.gpu_accelerator.cuda_available else {}
        
        return {
            "status": "loaded",
            "model_name": self.model_name,
            "model_type": type(self.model).__name__,
            "device": next(self.model.parameters()).device.type,
            "dtype": str(next(self.model.parameters()).dtype),
            "attention_implementation": self._get_attention_implementation(),
            "sdpa_available": self._supports_sdpa(),
            "gpu_available": self.gpu_accelerator.cuda_available,
            "memory_info": memory_info
        }
    
    def health_check(self) -> Dict[str, Any]:
        """Perform health check on the LLM service"""
        return {
            "status": "healthy" if self.is_model_loaded() else "no_model",
            "model_loaded": self.is_model_loaded(),
            "model_name": self.model_name,
            "gpu_available": self.gpu_accelerator.cuda_available,
            "sdpa_available": self._supports_sdpa(),
            "attention_implementation": self._get_attention_implementation()
        }

# Global service instance
_llm_service = None

def get_llm_service() -> LLMService:
    """Get the global LLM service instance"""
    global _llm_service
    if _llm_service is None:
        _llm_service = LLMService()
    return _llm_service

# Convenience functions for backward compatibility
def load_mistral_model():
    """Load Mistral model"""
    service = get_llm_service()
    return service.load_model("mistral-7b")

def load_embedding_model():
    """Load embedding model (placeholder for compatibility)"""
    logger.info("Embedding model loading - use model registry for embedding models")
    return None

"""
Model Registry with PyTorch SDPA Support
Centralized model management with singleton pattern and RTX 5090 Blackwell optimizations
"""

import logging
import threading
import time
from typing import Dict, Any, Optional, List
from dataclasses import dataclass
from enum import Enum
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, AutoModel
from app.services.gpu_accelerator import GPUAccelerator

logger = logging.getLogger(__name__)

class ModelStatus(Enum):
    NOT_LOADED = "not_loaded"
    LOADING = "loading"
    LOADED = "loaded"
    ERROR = "error"

@dataclass
class ModelInfo:
    model_id: str
    model_type: str
    status: ModelStatus
    model: Optional[Any] = None
    tokenizer: Optional[Any] = None
    load_time: Optional[float] = None
    memory_usage: Optional[int] = None
    error_message: Optional[str] = None

class ModelRegistry:
    """
    Centralized model registry with singleton pattern and PyTorch SDPA optimization
    """
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(ModelRegistry, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if hasattr(self, '_initialized'):
            return
        
        self._initialized = True
        self.models: Dict[str, ModelInfo] = {}
        self.model_configs = self._get_model_configurations()
        self.gpu_accelerator = GPUAccelerator()
        self._load_locks: Dict[str, threading.Lock] = {}
        self._stats = {
            "cache_hits": 0,
            "cache_misses": 0,
            "total_load_time": 0.0,
            "models_loaded": 0,
            "memory_usage": 0
        }
        
        logger.info("Model Registry initialized with PyTorch SDPA support")
    
    def _get_model_configurations(self) -> Dict[str, Dict[str, Any]]:
        """Get model configurations with PyTorch SDPA settings"""
        return {
            "mistral-7b": {
                "model_path": "mistralai/Mistral-7B-Instruct-v0.2",
                "model_type": "llm",
                "supports_sdpa": True,
                "memory_requirement": 6500,  # MB for FP16
                "description": "Mistral AI's 7B parameter instruction model"
            },
            "llama2-7b": {
                "model_path": "meta-llama/Llama-2-7b-chat-hf",
                "model_type": "llm", 
                "supports_sdpa": True,
                "memory_requirement": 6500,
                "description": "Meta's Llama 2 7B chat model"
            },
            "gpt-j-6b": {
                "model_path": "EleutherAI/gpt-j-6b",
                "model_type": "llm",
                "supports_sdpa": True,
                "memory_requirement": 5500,
                "description": "EleutherAI's GPT-J 6B model"
            },
            "sentence-transformer": {
                "model_path": "sentence-transformers/all-MiniLM-L6-v2",
                "model_type": "embedding",
                "supports_sdpa": False,  # Embedding models don't use attention optimization
                "memory_requirement": 400,
                "description": "Sentence transformer for embeddings"
            }
        }
    
    def _supports_sdpa(self) -> bool:
        """Check if PyTorch SDPA is available"""
        if hasattr(torch.nn.functional, 'scaled_dot_product_attention'):
            logger.info("PyTorch SDPA available - using optimized attention")
            return True
        
        logger.info("PyTorch SDPA not available - using eager attention")
        return False
    
    def _get_attention_implementation(self) -> str:
        """Get the best available attention implementation"""
        if self._supports_sdpa():
            return "sdpa"
        return "eager"
    
    def _check_memory_availability(self, required_memory: int) -> bool:
        """Check if enough memory is available for model loading"""
        if not self.gpu_accelerator.cuda_available:
            return True  # CPU loading, assume sufficient RAM
        
        available_memory = self.gpu_accelerator.get_memory_info()["available"]
        required_bytes = required_memory * 1024 * 1024  # Convert MB to bytes
        
        if available_memory < required_bytes:
            logger.warning(f"Insufficient GPU memory: {available_memory/1024**2:.1f}MB available, {required_memory}MB required")
            return False
        
        return True
    
    def _load_llm_model(self, model_id: str, config: Dict[str, Any]) -> Any:
        """Load LLM model with PyTorch SDPA optimization"""
        try:
            model_path = config.get("model_path", model_id)
            
            # Check memory availability
            required_memory = config.get("memory_requirement", 8000)
            if not self._check_memory_availability(required_memory):
                # Try to free up memory
                self.cleanup_unused_models()
                if not self._check_memory_availability(required_memory):
                    raise RuntimeError(f"Insufficient memory for {model_id}")
            
            model_kwargs = {
                "torch_dtype": torch.float16,
                "device_map": "cuda" if self.gpu_accelerator.cuda_available else "cpu",
                "trust_remote_code": True,
                "attn_implementation": self._get_attention_implementation()
            }
            
            logger.info(f"Loading {model_id} with {model_kwargs['attn_implementation']} attention")
            
            model = AutoModelForCausalLM.from_pretrained(model_path, **model_kwargs)
            
            # Apply GPU optimizations
            if self.gpu_accelerator.cuda_available:
                model = self.gpu_accelerator.optimize_model(model)
            
            logger.info(f"LLM model {model_id} loaded successfully with {model_kwargs['attn_implementation']} attention")
            return model
            
        except Exception as e:
            logger.error(f"Failed to load LLM model {model_id}: {e}")
            raise
    
    def _load_embedding_model(self, model_id: str, config: Dict[str, Any]) -> Any:
        """Load embedding model"""
        try:
            model_path = config.get("model_path", model_id)
            
            model_kwargs = {
                "torch_dtype": torch.float16 if self.gpu_accelerator.cuda_available else torch.float32,
                "device_map": "cuda" if self.gpu_accelerator.cuda_available else "cpu",
                "trust_remote_code": True
            }
            
            model = AutoModel.from_pretrained(model_path, **model_kwargs)
            
            if self.gpu_accelerator.cuda_available:
                model = self.gpu_accelerator.optimize_model(model)
            
            logger.info(f"Embedding model {model_id} loaded successfully")
            return model
            
        except Exception as e:
            logger.error(f"Failed to load embedding model {model_id}: {e}")
            raise
    
    def _load_tokenizer(self, model_id: str, config: Dict[str, Any]) -> Any:
        """Load tokenizer for the model"""
        try:
            model_path = config.get("model_path", model_id)
            tokenizer = AutoTokenizer.from_pretrained(model_path, trust_remote_code=True)
            
            # Configure tokenizer
            if tokenizer.pad_token is None:
                tokenizer.pad_token = tokenizer.eos_token
            
            logger.info(f"Tokenizer for {model_id} loaded successfully")
            return tokenizer
            
        except Exception as e:
            logger.error(f"Failed to load tokenizer for {model_id}: {e}")
            raise
    
    def load_model(self, model_id: str) -> ModelInfo:
        """Load a model with thread-safe singleton pattern"""
        # Check if model is already loaded
        if model_id in self.models and self.models[model_id].status == ModelStatus.LOADED:
            self._stats["cache_hits"] += 1
            logger.info(f"Model {model_id} retrieved from cache")
            return self.models[model_id]
        
        # Get or create lock for this model
        if model_id not in self._load_locks:
            self._load_locks[model_id] = threading.Lock()
        
        with self._load_locks[model_id]:
            # Double-check after acquiring lock
            if model_id in self.models and self.models[model_id].status == ModelStatus.LOADED:
                self._stats["cache_hits"] += 1
                return self.models[model_id]
            
            # Check if model configuration exists
            if model_id not in self.model_configs:
                error_msg = f"Model {model_id} not found in registry"
                logger.error(error_msg)
                self.models[model_id] = ModelInfo(
                    model_id=model_id,
                    model_type="unknown",
                    status=ModelStatus.ERROR,
                    error_message=error_msg
                )
                return self.models[model_id]
            
            config = self.model_configs[model_id]
            
            # Initialize model info
            self.models[model_id] = ModelInfo(
                model_id=model_id,
                model_type=config["model_type"],
                status=ModelStatus.LOADING
            )
            
            try:
                start_time = time.time()
                logger.info(f"Loading model {model_id}...")
                
                # Load model based on type
                if config["model_type"] == "llm":
                    model = self._load_llm_model(model_id, config)
                elif config["model_type"] == "embedding":
                    model = self._load_embedding_model(model_id, config)
                else:
                    raise ValueError(f"Unknown model type: {config['model_type']}")
                
                # Load tokenizer
                tokenizer = self._load_tokenizer(model_id, config)
                
                load_time = time.time() - start_time
                memory_usage = self._get_model_memory_usage(model)
                
                # Update model info
                self.models[model_id] = ModelInfo(
                    model_id=model_id,
                    model_type=config["model_type"],
                    status=ModelStatus.LOADED,
                    model=model,
                    tokenizer=tokenizer,
                    load_time=load_time,
                    memory_usage=memory_usage
                )
                
                # Update stats
                self._stats["cache_misses"] += 1
                self._stats["total_load_time"] += load_time
                self._stats["models_loaded"] += 1
                self._stats["memory_usage"] += memory_usage
                
                logger.info(f"Model {model_id} loaded successfully in {load_time:.2f}s, using {memory_usage}MB")
                return self.models[model_id]
                
            except Exception as e:
                error_msg = f"Failed to load model {model_id}: {str(e)}"
                logger.error(error_msg)
                
                self.models[model_id] = ModelInfo(
                    model_id=model_id,
                    model_type=config["model_type"],
                    status=ModelStatus.ERROR,
                    error_message=error_msg
                )
                
                return self.models[model_id]
    
    def get_model(self, model_id: str) -> Optional[Any]:
        """Get loaded model"""
        model_info = self.load_model(model_id)
        if model_info.status == ModelStatus.LOADED:
            return model_info.model
        return None
    
    def get_tokenizer(self, model_id: str) -> Optional[Any]:
        """Get loaded tokenizer"""
        model_info = self.load_model(model_id)
        if model_info.status == ModelStatus.LOADED:
            return model_info.tokenizer
        return None
    
    def _get_model_memory_usage(self, model) -> int:
        """Get model memory usage in MB"""
        try:
            if hasattr(model, 'get_memory_footprint'):
                return int(model.get_memory_footprint() / 1024 / 1024)
            elif hasattr(model, 'num_parameters'):
                # Estimate: 2 bytes per parameter for FP16
                return int(model.num_parameters() * 2 / 1024 / 1024)
            else:
                # Rough estimate
                return 1000
        except:
            return 1000
    
    def cleanup_unused_models(self, max_idle_time: int = 3600):
        """Clean up models that haven't been used recently"""
        current_time = time.time()
        models_to_remove = []
        
        for model_id, model_info in self.models.items():
            if (model_info.status == ModelStatus.LOADED and 
                hasattr(model_info, 'last_used') and
                current_time - model_info.last_used > max_idle_time):
                models_to_remove.append(model_id)
        
        for model_id in models_to_remove:
            self.unload_model(model_id)
            logger.info(f"Cleaned up unused model: {model_id}")
    
    def unload_model(self, model_id: str):
        """Unload a specific model"""
        if model_id in self.models:
            model_info = self.models[model_id]
            if model_info.memory_usage:
                self._stats["memory_usage"] -= model_info.memory_usage
            del self.models[model_id]
            
            # Clear GPU cache
            if self.gpu_accelerator.cuda_available:
                torch.cuda.empty_cache()
            
            logger.info(f"Model {model_id} unloaded")
    
    def get_registry_stats(self) -> Dict[str, Any]:
        """Get registry statistics"""
        return {
            **self._stats,
            "loaded_models": len([m for m in self.models.values() if m.status == ModelStatus.LOADED]),
            "total_models": len(self.models),
            "gpu_memory_info": self.gpu_accelerator.get_memory_info() if self.gpu_accelerator.cuda_available else None,
            "sdpa_available": self._supports_sdpa(),
            "attention_implementation": self._get_attention_implementation()
        }
    
    def get_model_info(self, model_id: str) -> Optional[ModelInfo]:
        """Get model information"""
        return self.models.get(model_id)
    
    def list_available_models(self) -> List[str]:
        """List all available models"""
        return list(self.model_configs.keys())
    
    def health_check(self) -> Dict[str, Any]:
        """Perform health check on the registry"""
        return {
            "status": "healthy",
            "gpu_available": self.gpu_accelerator.cuda_available,
            "sdpa_available": self._supports_sdpa(),
            "loaded_models": len([m for m in self.models.values() if m.status == ModelStatus.LOADED]),
            "memory_usage": self._stats["memory_usage"],
            "cache_hit_rate": self._stats["cache_hits"] / max(1, self._stats["cache_hits"] + self._stats["cache_misses"])
        }

# Global registry instance
_model_registry = None

def get_model_registry() -> ModelRegistry:
    """Get the global model registry instance"""
    global _model_registry
    if _model_registry is None:
        _model_registry = ModelRegistry()
    return _model_registry

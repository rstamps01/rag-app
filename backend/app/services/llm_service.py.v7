from typing import Dict, Any, Optional, List
import torch
from transformers import AutoTokenizer, AutoModelForCausalLM
from app.services.gpu_accelerator import GPUAccelerator

class LLMService:
    """Service for managing and using different LLM models with RTX 5090 optimizations"""
    
    def __init__(self, use_gpu: bool = True):
        # Initialize GPU accelerator with RTX 5090 optimizations
        self.gpu_accelerator = GPUAccelerator()
        self.use_gpu = use_gpu and self.gpu_accelerator.cuda_available
        self.device = torch.device("cuda" if self.use_gpu else "cpu")
        self.is_rtx5090 = self.gpu_accelerator.is_ada_lovelace if self.use_gpu else False
        
        # Set up mixed precision for RTX 5090
        self.scaler = self.gpu_accelerator.setup_mixed_precision() if self.is_rtx5090 else None
        
        # Initialize models dictionary
        self.models = {}
        self.tokenizers = {}
        
        # Available models
        self.available_models = {
            # "gpt-j-6b": {
            #     "name": "GPT-J 6B",
            #     "hf_model": "EleutherAI/gpt-j-6b",
            #     "description": "Open source 6B parameter model",
            #     "context_length": 2048
            # },
            # "llama-2-7b": {
            #     "name": "Llama 2 7B",
            #     "hf_model": "meta-llama/Llama-2-7b-hf",
            #     "description": "Meta's 7B parameter model",
            #     "context_length": 4096
            # },
            # "falcon-7b": {
            #     "name": "Falcon 7B",
            #     "hf_model": "tiiuae/falcon-7b",
            #     "description": "TII's 7B parameter model",
            #     "context_length": 2048
            # },
            "mistral-7b": {
                "name": "Mistral 7B",
                "hf_model": "mistralai/Mistral-7B-v0.1", # Keep only Mistral-7B
                "description": "Mistral AI's 7B parameter model",
                "context_length": 8192
            }
        }
    
    def get_available_models(self) -> List[Dict[str, Any]]:
        """
        Get list of available models
        
        Returns:
            List of model information dictionaries
        """
        return [
            {
                "id": model_id,
                "name": model_info["name"],
                "description": model_info["description"],
                "context_length": model_info["context_length"],
                "loaded": model_id in self.models,
                "rtx5090_optimized": self.is_rtx5090
            }
            for model_id, model_info in self.available_models.items()
        ]
    
    def load_model(self, model_id: str) -> bool:
        """
        Load a model if not already loaded with RTX 5090 optimizations
        
        Args:
            model_id: ID of the model to load
            
        Returns:
            True if successful, False otherwise
        """
        if model_id in self.models:
            return True
        
        if model_id not in self.available_models:
            return False
        
        try:
            hf_model_name = self.available_models[model_id]["hf_model"]
            
            # Load tokenizer
            self.tokenizers[model_id] = AutoTokenizer.from_pretrained(hf_model_name, cache_dir="/app/models_cache")
            
            # RTX 5090 specific optimizations for model loading
            if self.is_rtx5090:
                # Load model with 8-bit quantization and flash attention for RTX 5090
                self.models[model_id] = AutoModelForCausalLM.from_pretrained(
                    hf_model_name,
                    cache_dir="/app/models_cache", # Added cache_dir
                    torch_dtype=torch.float16,
                    load_in_8bit=True,
                    device_map="auto",
                    attn_implementation="flash_attention_2"  # RTX 5090 optimization
                )
            else:
                # Standard loading for other GPUs
                self.models[model_id] = AutoModelForCausalLM.from_pretrained(
                    hf_model_name,
                    cache_dir="/app/models_cache", # Added cache_dir
                    torch_dtype=torch.float16 if self.use_gpu else torch.float32,
                    load_in_8bit=self.use_gpu,
                    device_map="auto" if self.use_gpu else None
                )
            
            return True
        except Exception as e:
            print(f"Error loading model {model_id}: {e}")
            return False
    
    def generate_text(self, model_id: str, prompt: str, max_tokens: int = 512, temperature: float = 0.7) -> Optional[str]:
        """
        Generate text using the specified model with RTX 5090 optimizations
        
        Args:
            model_id: ID of the model to use
            prompt: Input prompt
            max_tokens: Maximum number of tokens to generate
            temperature: Temperature for sampling
            
        Returns:
            Generated text or None if error
        """
        # Ensure model is loaded
        if model_id not in self.models:
            if not self.load_model(model_id):
                return None
        
        try:
            tokenizer = self.tokenizers[model_id]
            model = self.models[model_id]
            
            inputs = tokenizer(prompt, return_tensors="pt").to(self.device)
            
            # Use mixed precision for RTX 5090
            if self.is_rtx5090 and self.scaler is not None:
                with torch.cuda.amp.autocast():
                    output = model.generate(
                        **inputs,
                        max_new_tokens=max_tokens,
                        temperature=temperature,
                        top_p=0.9,
                        do_sample=True
                    )
            else:
                with torch.no_grad():
                    output = model.generate(
                        **inputs,
                        max_new_tokens=max_tokens,
                        temperature=temperature,
                        top_p=0.9,
                        do_sample=True
                    )
            
            return tokenizer.decode(output[0], skip_special_tokens=True)
        except Exception as e:
            print(f"Error generating text with model {model_id}: {e}")
            return None
    
    def unload_model(self, model_id: str) -> bool:
        """
        Unload a model to free up GPU memory
        
        Args:
            model_id: ID of the model to unload
            
        Returns:
            True if successful, False otherwise
        """
        if model_id not in self.models:
            return True
        
        try:
            # Remove references to model and tokenizer
            del self.models[model_id]
            del self.tokenizers[model_id]
            
            # Force garbage collection
            import gc
            gc.collect()
            
            # Clear CUDA cache if using GPU
            if self.use_gpu:
                torch.cuda.empty_cache()
            
            return True
        except Exception as e:
            print(f"Error unloading model {model_id}: {e}")
            return False

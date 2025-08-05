"""
Enhanced LLM Service
Provides Mistral-7B-Instruct-v0.2 integration with GPU acceleration
"""

import logging
import time
import torch
from typing import Dict, Any, Optional, List
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import os

logger = logging.getLogger(__name__)

class EnhancedLLMService:
    """Enhanced LLM service with Mistral-7B integration"""
    
    def __init__(self):
        self.model = None
        self.tokenizer = None
        self.pipeline = None
        self.model_name = "mistralai/Mistral-7B-Instruct-v0.2"
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.is_loaded = False
        self.cache_dir = "/app/models_cache"
        
        # Initialize model
        self.initialize_model()
    
    def initialize_model(self):
        """Initialize the Mistral model and tokenizer"""
        try:
            logger.info(f"🚀 Initializing LLM service with {self.model_name}")
            logger.info(f"🔧 Device: {self.device}")
            logger.info(f"📁 Cache directory: {self.cache_dir}")
            
            # Check if CUDA is available and log GPU info
            if torch.cuda.is_available():
                gpu_count = torch.cuda.device_count()
                current_device = torch.cuda.current_device()
                gpu_name = torch.cuda.get_device_name(current_device)
                logger.info(f"🎮 GPU available: {gpu_name} (Device {current_device}/{gpu_count})")
                
                # Set memory optimization for RTX 5090
                torch.backends.cuda.matmul.allow_tf32 = True
                torch.backends.cudnn.allow_tf32 = True
                logger.info("⚡ Enabled TF32 for RTX 5090 optimization")
            else:
                logger.warning("⚠️  CUDA not available, using CPU")
            
            # Load tokenizer
            logger.info("📝 Loading tokenizer...")
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_name,
                cache_dir=self.cache_dir,
                trust_remote_code=True
            )
            
            # Set pad token if not present
            if self.tokenizer.pad_token is None:
                self.tokenizer.pad_token = self.tokenizer.eos_token
            
            logger.info("✅ Tokenizer loaded successfully")
            
            # Load model with optimizations
            logger.info("🤖 Loading model...")
            model_kwargs = {
                "cache_dir": self.cache_dir,
                "trust_remote_code": True,
                "torch_dtype": torch.float16 if self.device == "cuda" else torch.float32,
                "device_map": "auto" if self.device == "cuda" else None,
                "low_cpu_mem_usage": True
            }
            
            # Add GPU-specific optimizations
            if self.device == "cuda":
                model_kwargs.update({
                    "attn_implementation": "flash_attention_2",  # For RTX 5090 optimization
                    "use_cache": True
                })
            
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                **model_kwargs
            )
            
            logger.info("✅ Model loaded successfully")
            
            # Create pipeline
            self.pipeline = pipeline(
                "text-generation",
                model=self.model,
                tokenizer=self.tokenizer,
                device=0 if self.device == "cuda" else -1,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                return_full_text=False
            )
            
            logger.info("✅ Pipeline created successfully")
            
            # Test model with a simple generation
            test_prompt = "Hello, I am"
            test_result = self.pipeline(
                test_prompt,
                max_new_tokens=10,
                do_sample=True,
                temperature=0.7
            )
            
            logger.info(f"🧪 Model test successful: '{test_prompt}' -> '{test_result[0]['generated_text']}'")
            
            self.is_loaded = True
            logger.info("🎉 LLM service initialization completed successfully!")
            
        except Exception as e:
            logger.error(f"❌ LLM service initialization failed: {e}")
            self.is_loaded = False
            self.model = None
            self.tokenizer = None
            self.pipeline = None
    
    def is_available(self) -> bool:
        """Check if LLM service is available"""
        return self.is_loaded and self.model is not None
    
    def generate_response(
        self,
        query: str,
        context: str = "",
        max_length: int = 512,
        temperature: float = 0.7,
        top_p: float = 0.9,
        do_sample: bool = True
    ) -> Dict[str, Any]:
        """Generate response using Mistral model"""
        if not self.is_available():
            raise Exception("LLM service not available")
        
        start_time = time.time()
        
        try:
            # Prepare prompt with context
            if context:
                prompt = f"""<s>[INST] Based on the following context, please answer the question.

Context:
{context}

Question: {query}

Please provide a comprehensive and accurate answer based on the context provided. [/INST]"""
            else:
                prompt = f"<s>[INST] {query} [/INST]"
            
            logger.info(f"🤖 Generating response for query: '{query[:50]}...'")
            
            # Generate response
            with torch.cuda.amp.autocast() if self.device == "cuda" else torch.no_grad():
                result = self.pipeline(
                    prompt,
                    max_new_tokens=max_length,
                    temperature=temperature,
                    top_p=top_p,
                    do_sample=do_sample,
                    pad_token_id=self.tokenizer.eos_token_id,
                    eos_token_id=self.tokenizer.eos_token_id
                )
            
            generated_text = result[0]['generated_text'].strip()
            processing_time = time.time() - start_time
            
            # Calculate tokens per second
            input_tokens = len(self.tokenizer.encode(prompt))
            output_tokens = len(self.tokenizer.encode(generated_text))
            tokens_per_second = output_tokens / processing_time if processing_time > 0 else 0
            
            logger.info(f"✅ Response generated in {processing_time:.2f}s ({tokens_per_second:.1f} tokens/s)")
            
            return {
                "response": generated_text,
                "processing_time": processing_time,
                "input_tokens": input_tokens,
                "output_tokens": output_tokens,
                "tokens_per_second": tokens_per_second,
                "model": self.model_name,
                "device": self.device,
                "context_used": bool(context)
            }
            
        except Exception as e:
            logger.error(f"❌ Response generation failed: {e}")
            raise Exception(f"LLM generation failed: {str(e)}")
    
    def generate_embedding_friendly_summary(self, text: str, max_length: int = 200) -> str:
        """Generate a summary optimized for embedding generation"""
        if not self.is_available():
            return text[:max_length]
        
        try:
            prompt = f"""<s>[INST] Please provide a concise summary of the following text in {max_length} characters or less:

{text}

Summary: [/INST]"""
            
            result = self.pipeline(
                prompt,
                max_new_tokens=max_length // 4,  # Approximate token to character ratio
                temperature=0.3,  # Lower temperature for more focused summaries
                do_sample=True
            )
            
            summary = result[0]['generated_text'].strip()
            return summary[:max_length]
            
        except Exception as e:
            logger.error(f"Summary generation failed: {e}")
            return text[:max_length]
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get model information and status"""
        return {
            "model_name": self.model_name,
            "is_loaded": self.is_loaded,
            "device": self.device,
            "cache_dir": self.cache_dir,
            "cuda_available": torch.cuda.is_available(),
            "gpu_count": torch.cuda.device_count() if torch.cuda.is_available() else 0,
            "gpu_name": torch.cuda.get_device_name(0) if torch.cuda.is_available() else None,
            "memory_allocated": torch.cuda.memory_allocated() if torch.cuda.is_available() else 0,
            "memory_reserved": torch.cuda.memory_reserved() if torch.cuda.is_available() else 0
        }
    
    def clear_cache(self):
        """Clear GPU memory cache"""
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            logger.info("🧹 GPU memory cache cleared")

# Global enhanced LLM service instance
enhanced_llm_service = EnhancedLLMService()


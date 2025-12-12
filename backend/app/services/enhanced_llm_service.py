"""
Enhanced LLM Service
Provides Mistral-7B-Instruct-v0.2 integration with GPU acceleration
"""

# Suppress Pydantic validation errors from transformers library
import warnings
import os
import sys
warnings.filterwarnings('ignore', category=UserWarning, message='.*Args.*Parameters.*')
warnings.filterwarnings('ignore', message='.*No `Args` or `Parameters` section.*')
os.environ["PYDANTIC_DISABLE_VALIDATION"] = "1"
os.environ["TRANSFORMERS_VERBOSITY"] = "error"

# CRITICAL: Install import hook BEFORE importing transformers
# This patches transformers modules as they're imported
try:
    from app.utils.pydantic_suppress import TransformersImportHook
    # Install the import hook if not already installed
    hook_installed = any(isinstance(hook, TransformersImportHook) for hook in sys.meta_path)
    if not hook_installed:
        hook_instance = TransformersImportHook()
        sys.meta_path.insert(0, hook_instance)
except Exception:
    # If import hook fails, try direct patching
    try:
        from app.utils.pydantic_suppress import _patch_transformers_validation
        _patch_transformers_validation()
    except Exception:
        pass

import logging
import time
import torch
from typing import Dict, Any, Optional, List

# Import transformers with comprehensive error handling
# CRITICAL: Import AutoTokenizer and AutoModelForCausalLM first (these work)
# Defer pipeline import until needed to avoid triggering deep imports
try:
    from transformers import AutoTokenizer, AutoModelForCausalLM
    # Pipeline will be imported lazily when needed
    pipeline = None
except (ValueError, TypeError) as e:
    # Pydantic validation errors are non-fatal - models can still be used
    import io
    old_stderr = sys.stderr
    sys.stderr = io.StringIO()
    try:
        # Apply patches and retry
        try:
            from app.utils.pydantic_suppress import _patch_transformers_validation
            _patch_transformers_validation()
        except Exception:
            pass
        from transformers import AutoTokenizer, AutoModelForCausalLM
        pipeline = None
    finally:
        sys.stderr = old_stderr
    if AutoTokenizer is None or AutoModelForCausalLM is None:
        raise ImportError(f"Failed to import transformers: {e}")

# Function to lazily import pipeline when needed
def _get_pipeline():
    """Lazy import of pipeline with error handling"""
    global pipeline
    if pipeline is None:
        # Apply patches before importing pipeline
        try:
            from app.utils.pydantic_suppress import _patch_transformers_validation
            _patch_transformers_validation()
        except Exception:
            pass
        
        # Try importing pipeline
        import io
        import sys
        old_stderr = sys.stderr
        sys.stderr = io.StringIO()
        try:
            from transformers import pipeline
        except (ValueError, TypeError) as e:
            # If pipeline import fails, return None - we'll create it manually
            error_str = str(e)
            if "Args" in error_str or "Parameters" in error_str or "docstring" in error_str.lower():
                pipeline = None
            else:
                raise
        finally:
            sys.stderr = old_stderr
    return pipeline

import os

logger = logging.getLogger(__name__)

class LLMService:
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
            
            # Apply patches before model loading to prevent validation errors
            try:
                from app.utils.pydantic_suppress import _patch_transformers_validation
                _patch_transformers_validation()
            except Exception:
                pass
            
            model_kwargs = {
                "cache_dir": self.cache_dir,
                "trust_remote_code": True,
                "torch_dtype": torch.float16 if self.device == "cuda" else torch.float32,
                "device_map": "auto" if self.device == "cuda" else None,
                "low_cpu_mem_usage": True
            }
            
            # Add GPU-specific optimizations
            if self.device == "cuda":
                # Use device_map="cuda" instead of "auto" to avoid meta device offloading issues
                # With 2 workers, each gets ~12GB which should be enough for Mistral-7B (~14GB)
                # If memory is insufficient, the model will fail to load rather than partially offload
                model_kwargs["device_map"] = "cuda"  # Force all parameters to GPU, no offloading
                
                model_kwargs.update({
                    "attn_implementation": "eager",                # "flash_attention_2",  # For RTX 5090 optimization
                    "use_cache": True
                })
                
                if torch.cuda.is_available():
                    total_memory = torch.cuda.get_device_properties(0).total_memory / 1e9  # GB
                    logger.info(f"🔒 Loading model on GPU (device_map='cuda'): {total_memory:.1f}GB available")
            
            # Load model with comprehensive error suppression
            import sys
            import io
            old_stderr = sys.stderr
            sys.stderr = io.StringIO()
            try:
                self.model = AutoModelForCausalLM.from_pretrained(
                    self.model_name,
                    **model_kwargs
                )
            except (ValueError, TypeError) as model_e:
                error_str = str(model_e)
                # If it's a validation error, try again with patches applied
                if "Args" in error_str or "Parameters" in error_str or "docstring" in error_str.lower() or "expected string" in error_str.lower():
                    logger.warning(f"⚠️ Model loading encountered validation error, retrying with patches: {error_str[:100]}")
                    # Apply patches again and retry
                    try:
                        from app.utils.pydantic_suppress import _patch_transformers_validation
                        _patch_transformers_validation()
                    except Exception:
                        pass
                    # Retry model loading
                    self.model = AutoModelForCausalLM.from_pretrained(
                        self.model_name,
                        **model_kwargs
                    )
                else:
                    raise
            finally:
                sys.stderr = old_stderr
            
            logger.info("✅ Model loaded successfully")
            
            # Create pipeline lazily (import pipeline when needed to avoid import-time errors)
            pipeline_device = 0 if self.device == "cuda" else -1
            pipeline_func = _get_pipeline()
            if pipeline_func is not None:
                self.pipeline = pipeline_func(
                    "text-generation",
                    model=self.model,
                    tokenizer=self.tokenizer,
                    device=pipeline_device,  # Explicitly set device to avoid meta device issues
                    torch_dtype=torch.float16 if self.device == "cuda" else torch.float32,
                    return_full_text=False
                )
            else:
                # Fallback: Create pipeline manually using TextGenerationPipeline
                logger.warning("⚠️ Pipeline import failed, creating TextGenerationPipeline manually")
                from transformers.pipelines.text_generation import TextGenerationPipeline
                self.pipeline = TextGenerationPipeline(
                    model=self.model,
                    tokenizer=self.tokenizer,
                    device=pipeline_device,
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
        max_length: int = 1536,  # PHASE 1: Increased from 512 to 1536 tokens for longer, more detailed responses
        temperature: float = 0.7,
        top_p: float = 0.9,
        do_sample: bool = True,
        repetition_penalty: float = 1.15  # PHASE 1: Added to avoid repetitive responses
    ) -> Dict[str, Any]:
        """Generate response using Mistral model"""
        if not self.is_available():
            raise Exception("LLM service not available")
        
        start_time = time.time()
        
        try:
            # PHASE 1: Enhanced prompt template for better quality and detail
            if context:
                prompt = f"""<s>[INST] You are an expert assistant. Based on the following context, provide a comprehensive, detailed answer to the question.

Context:
{context}

Question: {query}

Instructions:
- Provide a thorough, well-structured answer
- Include relevant details from the context
- Use clear explanations and examples where appropriate
- If the context doesn't fully answer the question, indicate what information is available
[/INST]"""
            else:
                prompt = f"<s>[INST] {query} [/INST]"
            
            logger.info(f"🤖 Generating response for query: '{query[:50]}...'")
            
            # Generate response with repetition penalty
            with torch.amp.autocast(device_type='cuda') if self.device == "cuda" else torch.no_grad():
                result = self.pipeline(
                    prompt,
                    max_new_tokens=max_length,
                    temperature=temperature,
                    top_p=top_p,
                    top_k=50,  # PHASE 1: Added for better diversity
                    do_sample=do_sample,
                    repetition_penalty=repetition_penalty,  # PHASE 1: Added to avoid loops
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

# Global enhanced LLM service instance - lazy initialization to avoid import-time errors
_llm_service_instance = None
_llm_service_error = None

def get_enhanced_llm_service():
    """Get or create the enhanced LLM service instance (lazy initialization)"""
    global _llm_service_instance, _llm_service_error
    if _llm_service_instance is None and _llm_service_error is None:
        try:
            _llm_service_instance = LLMService()
        except Exception as e:
            _llm_service_error = e
            logger.error(f"⚠️ Failed to initialize LLM service: {e}")
    if _llm_service_instance is None:
        raise Exception(f"LLM service not available: {_llm_service_error}")
    return _llm_service_instance

# For backward compatibility, create instance but catch errors
try:
    enhanced_llm_service = LLMService()
except Exception as e:
    logger.warning(f"⚠️ LLM service initialization deferred due to: {e}")
    # Create a placeholder that will initialize on first use
    class LazyLLMService:
        def __init__(self):
            self._instance = None
        
        def __getattr__(self, name):
            if self._instance is None:
                self._instance = get_enhanced_llm_service()
            return getattr(self._instance, name)
    
    enhanced_llm_service = LazyLLMService()


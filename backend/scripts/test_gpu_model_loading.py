#!/usr/bin/env python3
"""
Test GPU Model Loading - Validation Script
Tests that models can be loaded into GPU memory without rebuilding container
"""

import os
import sys
import time
import traceback
import logging
from pathlib import Path

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def test_embedding_model_loading():
    """Test embedding model loading into GPU"""
    logger.info("=" * 60)
    logger.info("TEST 1: Embedding Model GPU Loading")
    logger.info("=" * 60)
    
    try:
        # Apply patches before importing
        sys.path.insert(0, '/app')
        try:
            from app.utils.pydantic_suppress import _patch_transformers_validation
            _patch_transformers_validation()
            logger.info("✅ Applied Pydantic validation patches")
        except Exception as e:
            logger.warning(f"⚠️ Failed to apply patches: {e}")
        
        import torch
        logger.info(f"PyTorch version: {torch.__version__}")
        logger.info(f"CUDA available: {torch.cuda.is_available()}")
        
        if not torch.cuda.is_available():
            logger.error("❌ CUDA not available - cannot test GPU loading")
            return False
        
        logger.info(f"GPU: {torch.cuda.get_device_name(0)}")
        logger.info(f"GPU Memory: {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
        
        # Check initial GPU memory
        torch.cuda.empty_cache()
        initial_memory = torch.cuda.memory_allocated(0) / 1e9
        logger.info(f"Initial GPU memory allocated: {initial_memory:.2f} GB")
        
        # Load embedding model
        logger.info("📥 Loading embedding model...")
        start_time = time.time()
        
        from sentence_transformers import SentenceTransformer
        import warnings
        import io
        
        old_stderr = sys.stderr
        sys.stderr = io.StringIO()
        warnings.filterwarnings('ignore')
        os.environ["TRANSFORMERS_VERBOSITY"] = "error"
        
        try:
            embedding_model = SentenceTransformer(
                'sentence-transformers/all-MiniLM-L6-v2',
                cache_folder='/app/models_cache',
                device='cuda'
            )
            
            # Test the model
            test_text = "This is a test sentence for embedding."
            embedding = embedding_model.encode(test_text, convert_to_numpy=True)
            
            load_time = time.time() - start_time
            
            # Check GPU memory after loading
            final_memory = torch.cuda.memory_allocated(0) / 1e9
            memory_used = final_memory - initial_memory
            
            logger.info(f"✅ Embedding model loaded successfully")
            logger.info(f"   Load time: {load_time:.2f} seconds")
            logger.info(f"   Embedding shape: {embedding.shape}")
            logger.info(f"   GPU memory used: {memory_used:.2f} GB")
            logger.info(f"   Total GPU memory allocated: {final_memory:.2f} GB")
            
            # Verify model is on GPU
            if hasattr(embedding_model, '_modules'):
                device_check = next(embedding_model._modules.values()).device
                logger.info(f"   Model device: {device_check}")
            
            # Cleanup
            del embedding_model
            torch.cuda.empty_cache()
            
            return True
            
        except Exception as e:
            logger.error(f"❌ Embedding model loading failed: {e}")
            logger.error(traceback.format_exc())
            return False
        finally:
            sys.stderr = old_stderr
            
    except Exception as e:
        logger.error(f"❌ Test failed: {e}")
        logger.error(traceback.format_exc())
        return False

def test_llm_model_loading():
    """Test LLM model loading into GPU"""
    logger.info("=" * 60)
    logger.info("TEST 2: LLM Model GPU Loading")
    logger.info("=" * 60)
    
    try:
        # Apply patches before importing
        sys.path.insert(0, '/app')
        try:
            from app.utils.pydantic_suppress import _patch_transformers_validation
            _patch_transformers_validation()
            logger.info("✅ Applied Pydantic validation patches")
        except Exception as e:
            logger.warning(f"⚠️ Failed to apply patches: {e}")
        
        import torch
        logger.info(f"PyTorch version: {torch.__version__}")
        logger.info(f"CUDA available: {torch.cuda.is_available()}")
        
        if not torch.cuda.is_available():
            logger.error("❌ CUDA not available - cannot test GPU loading")
            return False
        
        logger.info(f"GPU: {torch.cuda.get_device_name(0)}")
        
        # Check initial GPU memory
        torch.cuda.empty_cache()
        initial_memory = torch.cuda.memory_allocated(0) / 1e9
        logger.info(f"Initial GPU memory allocated: {initial_memory:.2f} GB")
        
        # Load tokenizer
        logger.info("📥 Loading LLM tokenizer...")
        from transformers import AutoTokenizer
        import warnings
        import io
        
        old_stderr = sys.stderr
        sys.stderr = io.StringIO()
        warnings.filterwarnings('ignore')
        os.environ["TRANSFORMERS_VERBOSITY"] = "error"
        
        try:
            tokenizer = AutoTokenizer.from_pretrained(
                'mistralai/Mistral-7B-Instruct-v0.2',
                cache_dir='/app/models_cache',
                trust_remote_code=True
            )
            logger.info("✅ Tokenizer loaded successfully")
            
            # Apply patches again before model loading
            _patch_transformers_validation()
            
            # Try to import modeling_layers to trigger patches
            try:
                import transformers.modeling_layers
                _patch_transformers_validation()
            except Exception:
                pass
            
            # Load model
            logger.info("📥 Loading LLM model into GPU...")
            start_time = time.time()
            
            from transformers import AutoModelForCausalLM
            
            model = AutoModelForCausalLM.from_pretrained(
                'mistralai/Mistral-7B-Instruct-v0.2',
                cache_dir='/app/models_cache',
                trust_remote_code=True,
                torch_dtype=torch.float16,
                device_map='cuda',
                low_cpu_mem_usage=True
            )
            
            load_time = time.time() - start_time
            
            # Check GPU memory after loading
            final_memory = torch.cuda.memory_allocated(0) / 1e9
            memory_used = final_memory - initial_memory
            
            # Verify model is on GPU
            is_on_gpu = next(model.parameters()).is_cuda
            
            logger.info(f"✅ LLM model loaded successfully")
            logger.info(f"   Load time: {load_time:.2f} seconds")
            logger.info(f"   Model on GPU: {is_on_gpu}")
            logger.info(f"   GPU memory used: {memory_used:.2f} GB")
            logger.info(f"   Total GPU memory allocated: {final_memory:.2f} GB")
            
            # Test generation
            logger.info("🧪 Testing model generation...")
            test_prompt = "What is artificial intelligence?"
            inputs = tokenizer(test_prompt, return_tensors="pt").to("cuda")
            
            with torch.no_grad():
                outputs = model.generate(
                    **inputs,
                    max_new_tokens=20,
                    do_sample=True,
                    temperature=0.7
                )
            
            generated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
            logger.info(f"   Test prompt: '{test_prompt}'")
            logger.info(f"   Generated: '{generated_text[:100]}...'")
            logger.info("✅ Model generation test successful")
            
            # Cleanup
            del model
            del tokenizer
            del inputs
            del outputs
            torch.cuda.empty_cache()
            
            return True
            
        except Exception as e:
            error_str = str(e)
            logger.error(f"❌ LLM model loading failed: {error_str[:200]}")
            if "expected string" in error_str.lower() or "Args" in error_str:
                logger.error("   This is a Pydantic validation error - patches may need adjustment")
            logger.error(traceback.format_exc())
            return False
        finally:
            sys.stderr = old_stderr
            
    except Exception as e:
        logger.error(f"❌ Test failed: {e}")
        logger.error(traceback.format_exc())
        return False

def test_background_loading_simulation():
    """Simulate background loading approach"""
    logger.info("=" * 60)
    logger.info("TEST 3: Background Loading Simulation")
    logger.info("=" * 60)
    
    try:
        import asyncio
        import time
        
        async def load_models_async():
            """Simulate async background loading"""
            logger.info("🔄 Starting background model loading...")
            
            # Simulate non-blocking initialization
            await asyncio.sleep(0.1)  # Simulate async delay
            
            # Load embedding model
            embedding_result = test_embedding_model_loading()
            
            # Load LLM model (commented out for faster testing)
            # llm_result = test_llm_model_loading()
            
            return embedding_result  # and llm_result
        
        # Simulate FastAPI startup
        logger.info("🚀 Simulating FastAPI startup (non-blocking)...")
        start_time = time.time()
        
        # Start background task
        loop = asyncio.get_event_loop()
        task = loop.create_task(load_models_async())
        
        # Simulate API responding immediately
        api_start_time = time.time() - start_time
        logger.info(f"✅ API would be available in {api_start_time:.2f} seconds")
        logger.info("   (Models loading in background)")
        
        # Wait for background loading
        result = loop.run_until_complete(task)
        total_time = time.time() - start_time
        
        logger.info(f"✅ Background loading completed in {total_time:.2f} seconds")
        logger.info(f"   API available: {api_start_time:.2f}s")
        logger.info(f"   Models ready: {total_time:.2f}s")
        
        return result
        
    except Exception as e:
        logger.error(f"❌ Background loading simulation failed: {e}")
        logger.error(traceback.format_exc())
        return False

def main():
    """Run all tests"""
    logger.info("=" * 60)
    logger.info("GPU MODEL LOADING VALIDATION TEST")
    logger.info("=" * 60)
    logger.info("")
    
    results = {
        'embedding_model': False,
        'llm_model': False,
        'background_simulation': False
    }
    
    # Test 1: Embedding model
    results['embedding_model'] = test_embedding_model_loading()
    logger.info("")
    
    # Test 2: LLM model
    results['llm_model'] = test_llm_model_loading()
    logger.info("")
    
    # Test 3: Background loading simulation
    results['background_simulation'] = test_background_loading_simulation()
    logger.info("")
    
    # Summary
    logger.info("=" * 60)
    logger.info("TEST SUMMARY")
    logger.info("=" * 60)
    logger.info(f"Embedding Model Loading: {'✅ PASS' if results['embedding_model'] else '❌ FAIL'}")
    logger.info(f"LLM Model Loading: {'✅ PASS' if results['llm_model'] else '❌ FAIL'}")
    logger.info(f"Background Loading Simulation: {'✅ PASS' if results['background_simulation'] else '❌ FAIL'}")
    logger.info("")
    
    if all(results.values()):
        logger.info("🎉 All tests passed! GPU model loading is working correctly.")
        return 0
    else:
        logger.error("❌ Some tests failed. Review logs above for details.")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)


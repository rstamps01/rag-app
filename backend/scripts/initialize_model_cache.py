#!/usr/bin/env python3
"""
Enhanced Model Cache Initialization Script
With comprehensive error handling, logging, and validation
"""

import os
import sys
import json
import logging
import time
import traceback
from pathlib import Path
from typing import Dict, Any, Optional

# Configure comprehensive logging
def setup_logging():
    """Setup comprehensive logging configuration"""
    log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    
    # Create logs directory if it doesn't exist
    log_dir = Path('/app/logs')
    log_dir.mkdir(exist_ok=True)
    
    # Configure root logger
    logging.basicConfig(
        level=logging.INFO,
        format=log_format,
        handlers=[
            logging.StreamHandler(sys.stdout),
            logging.FileHandler(log_dir / 'cache_init.log', mode='w')
        ]
    )
    
    return logging.getLogger(__name__)

# Initialize logger
logger = setup_logging()

class CacheInitializationError(Exception):
    """Custom exception for cache initialization errors"""
    pass

class EnhancedCacheInitializer:
    """
    Enhanced cache initializer with comprehensive error handling
    """
    
    def __init__(self):
        """Initialize the enhanced cache initializer"""
        self.start_time = time.time()
        self.cache_dir = Path(os.environ.get('HF_HOME', '/app/models_cache'))
        self.status = {
            'initialization_started': True,
            'environment_validated': False,
            'python_validated': False,
            'cache_directories_created': False,
            'dependencies_validated': False,
            'models_discovered': False,
            'initialization_completed': False,
            'errors': [],
            'warnings': []
        }
        
        logger.info("Enhanced Cache Initializer started")
        logger.info(f"Cache directory: {self.cache_dir}")
    
    def validate_environment(self) -> bool:
        """
        Comprehensive environment validation
        
        Returns:
            True if environment is valid, False otherwise
        """
        try:
            logger.info("=== Environment Validation ===")
            
            # Check Python version and executable
            python_version = sys.version
            python_executable = sys.executable
            logger.info(f"Python version: {python_version}")
            logger.info(f"Python executable: {python_executable}")
            
            # Verify python symlink works
            import subprocess
            try:
                result = subprocess.run(['python', '--version'], 
                                      capture_output=True, text=True, timeout=10)
                if result.returncode == 0:
                    logger.info(f"Python symlink working: {result.stdout.strip()}")
                    self.status['python_validated'] = True
                else:
                    logger.warning(f"Python symlink failed: {result.stderr}")
                    self.status['warnings'].append("Python symlink not working")
            except Exception as e:
                logger.warning(f"Python symlink test failed: {e}")
                self.status['warnings'].append(f"Python symlink test failed: {e}")
            
            # Check environment variables
            required_env_vars = ['HF_HOME', 'MODELS_CACHE_DIR']
            optional_env_vars = ['HUGGING_FACE_HUB_TOKEN', 'CUDA_VISIBLE_DEVICES']
            
            for var in required_env_vars:
                value = os.environ.get(var)
                if value:
                    logger.info(f"{var}: {value}")
                else:
                    error_msg = f"Required environment variable {var} not set"
                    logger.error(error_msg)
                    self.status['errors'].append(error_msg)
                    return False
            
            for var in optional_env_vars:
                value = os.environ.get(var, 'Not set')
                logger.info(f"{var}: {value}")
            
            # Check cache directory
            logger.info(f"Cache directory exists: {self.cache_dir.exists()}")
            
            if not self.cache_dir.exists():
                logger.info("Creating cache directory...")
                self.cache_dir.mkdir(parents=True, exist_ok=True)
            
            # Test write permissions
            test_file = self.cache_dir / 'test_write.tmp'
            try:
                test_file.write_text('test')
                test_file.unlink()
                logger.info("Cache directory is writable")
                self.status['cache_directories_created'] = True
            except Exception as e:
                error_msg = f"Cache directory not writable: {e}"
                logger.error(error_msg)
                self.status['errors'].append(error_msg)
                return False
            
            # Check CUDA availability (optional)
            try:
                import torch
                cuda_available = torch.cuda.is_available()
                logger.info(f"CUDA available: {cuda_available}")
                if cuda_available:
                    gpu_count = torch.cuda.device_count()
                    logger.info(f"GPU count: {gpu_count}")
                    for i in range(gpu_count):
                        gpu_name = torch.cuda.get_device_name(i)
                        logger.info(f"GPU {i}: {gpu_name}")
            except ImportError:
                logger.warning("PyTorch not available for CUDA check")
                self.status['warnings'].append("PyTorch not available")
            except Exception as e:
                logger.warning(f"CUDA check failed: {e}")
                self.status['warnings'].append(f"CUDA check failed: {e}")
            
            self.status['environment_validated'] = True
            logger.info("✅ Environment validation completed successfully")
            return True
            
        except Exception as e:
            error_msg = f"Environment validation failed: {e}"
            logger.error(error_msg)
            logger.error(f"Traceback: {traceback.format_exc()}")
            self.status['errors'].append(error_msg)
            return False
    
    def validate_dependencies(self) -> bool:
        """
        Validate required Python dependencies
        
        Returns:
            True if dependencies are valid, False otherwise
        """
        try:
            logger.info("=== Dependency Validation ===")
            
            required_packages = [
                'torch',
                'transformers',
                'sentence_transformers',
                'huggingface_hub'
            ]
            
            for package in required_packages:
                try:
                    __import__(package)
                    logger.info(f"✅ {package}: Available")
                except ImportError as e:
                    logger.warning(f"⚠️ {package}: Not available - {e}")
                    self.status['warnings'].append(f"Package {package} not available")
            
            self.status['dependencies_validated'] = True
            logger.info("✅ Dependency validation completed")
            return True
            
        except Exception as e:
            error_msg = f"Dependency validation failed: {e}"
            logger.error(error_msg)
            self.status['errors'].append(error_msg)
            return False
    
    def discover_existing_models(self) -> Dict[str, Any]:
        """
        Discover existing models in cache
        
        Returns:
            Dictionary with model discovery results
        """
        try:
            logger.info("=== Model Discovery ===")
            
            discovery_results = {
                'total_directories': 0,
                'potential_models': [],
                'cache_size_mb': 0
            }
            
            if self.cache_dir.exists():
                # Count directories and estimate size
                for item in self.cache_dir.iterdir():
                    if item.is_dir():
                        discovery_results['total_directories'] += 1
                        discovery_results['potential_models'].append(item.name)
                        
                        # Estimate size
                        try:
                            size = sum(f.stat().st_size for f in item.rglob('*') if f.is_file())
                            discovery_results['cache_size_mb'] += size / (1024 * 1024)
                        except Exception:
                            pass
                
                logger.info(f"Found {discovery_results['total_directories']} directories in cache")
                logger.info(f"Estimated cache size: {discovery_results['cache_size_mb']:.1f} MB")
                
                if discovery_results['potential_models']:
                    logger.info("Potential models found:")
                    for model in discovery_results['potential_models'][:10]:  # Show first 10
                        logger.info(f"  - {model}")
                    if len(discovery_results['potential_models']) > 10:
                        logger.info(f"  ... and {len(discovery_results['potential_models']) - 10} more")
                else:
                    logger.info("No existing models found in cache")
            else:
                logger.info("Cache directory does not exist")
            
            self.status['models_discovered'] = True
            return discovery_results
            
        except Exception as e:
            error_msg = f"Model discovery failed: {e}"
            logger.error(error_msg)
            self.status['errors'].append(error_msg)
            return {'error': error_msg}
    
    def create_status_report(self, discovery_results: Dict[str, Any]) -> str:
        """
        Create comprehensive status report
        
        Args:
            discovery_results: Results from model discovery
            
        Returns:
            Path to created status file
        """
        try:
            status_file = self.cache_dir / 'initialization_status.json'
            
            total_time = time.time() - self.start_time
            
            status_report = {
                'timestamp': time.time(),
                'initialization_time_seconds': total_time,
                'status': self.status,
                'discovery_results': discovery_results,
                'environment': {
                    'python_version': sys.version,
                    'python_executable': sys.executable,
                    'cache_directory': str(self.cache_dir),
                    'environment_variables': {
                        'HF_HOME': os.environ.get('HF_HOME'),
                        'MODELS_CACHE_DIR': os.environ.get('MODELS_CACHE_DIR'),
                        'CUDA_VISIBLE_DEVICES': os.environ.get('CUDA_VISIBLE_DEVICES'),
                        'HUGGING_FACE_HUB_TOKEN': 'SET' if os.environ.get('HUGGING_FACE_HUB_TOKEN') else 'NOT_SET'
                    }
                }
            }
            
            with open(status_file, 'w') as f:
                json.dump(status_report, f, indent=2)
            
            logger.info(f"Status report created: {status_file}")
            return str(status_file)
            
        except Exception as e:
            logger.error(f"Failed to create status report: {e}")
            return ""
    
    def load_models_into_gpu(self) -> Dict[str, Any]:
        """
        Load models into GPU memory to warm up the cache
        
        Returns:
            Dictionary with loading results
        """
        loading_results = {
            'embedding_model_loaded': False,
            'llm_model_loaded': False,
            'errors': []
        }
        
        try:
            logger.info("=== GPU Model Loading ===")
            
            # Check if CUDA is available
            try:
                import torch
                if not torch.cuda.is_available():
                    logger.warning("⚠️ CUDA not available, skipping GPU model loading")
                    return loading_results
            except ImportError:
                logger.warning("⚠️ PyTorch not available, skipping GPU model loading")
                return loading_results
            
            # Apply Pydantic validation patches before loading models
            try:
                sys.path.insert(0, '/app')
                from app.utils.pydantic_suppress import _patch_transformers_validation
                _patch_transformers_validation()
                logger.info("✅ Applied Pydantic validation patches")
            except Exception as e:
                logger.warning(f"⚠️ Failed to apply patches: {e}")
            
            # Load embedding model
            try:
                logger.info("📥 Loading embedding model into GPU cache...")
                from sentence_transformers import SentenceTransformer
                import warnings
                import io
                
                # Suppress warnings and errors during loading
                old_stderr = sys.stderr
                sys.stderr = io.StringIO()
                warnings.filterwarnings('ignore')
                os.environ["TRANSFORMERS_VERBOSITY"] = "error"
                
                try:
                    embedding_model = SentenceTransformer(
                        'sentence-transformers/all-MiniLM-L6-v2',
                        cache_folder=str(self.cache_dir),
                        device='cuda'
                    )
                    # Test the model
                    test_embedding = embedding_model.encode("test", convert_to_numpy=True)
                    if test_embedding is not None and len(test_embedding) > 0:
                        loading_results['embedding_model_loaded'] = True
                        logger.info("✅ Embedding model loaded into GPU successfully")
                    else:
                        logger.warning("⚠️ Embedding model loaded but encode() returned invalid result")
                except Exception as e:
                    error_str = str(e)
                    if "expected string" in error_str.lower() or "Args" in error_str:
                        logger.warning(f"⚠️ Embedding model loading encountered validation error (non-fatal): {error_str[:100]}")
                        # Try again with patches
                        _patch_transformers_validation()
                        try:
                            embedding_model = SentenceTransformer(
                                'sentence-transformers/all-MiniLM-L6-v2',
                                cache_folder=str(self.cache_dir),
                                device='cuda'
                            )
                            test_embedding = embedding_model.encode("test", convert_to_numpy=True)
                            if test_embedding is not None and len(test_embedding) > 0:
                                loading_results['embedding_model_loaded'] = True
                                logger.info("✅ Embedding model loaded into GPU successfully (after retry)")
                        except Exception as retry_e:
                            logger.warning(f"⚠️ Embedding model loading failed after retry: {retry_e}")
                            loading_results['errors'].append(f"Embedding model: {str(retry_e)[:100]}")
                    else:
                        logger.warning(f"⚠️ Embedding model loading failed: {error_str[:100]}")
                        loading_results['errors'].append(f"Embedding model: {error_str[:100]}")
                finally:
                    sys.stderr = old_stderr
                    if 'embedding_model' in locals():
                        del embedding_model
                    torch.cuda.empty_cache()
            except Exception as e:
                logger.warning(f"⚠️ Failed to load embedding model: {e}")
                loading_results['errors'].append(f"Embedding model: {str(e)[:100]}")
            
            # Load LLM model (tokenizer and model)
            try:
                logger.info("📥 Loading LLM model into GPU cache...")
                from transformers import AutoTokenizer, AutoModelForCausalLM
                import warnings
                import io
                
                # Suppress warnings and errors during loading
                old_stderr = sys.stderr
                sys.stderr = io.StringIO()
                warnings.filterwarnings('ignore')
                os.environ["TRANSFORMERS_VERBOSITY"] = "error"
                
                try:
                    # Load tokenizer
                    tokenizer = AutoTokenizer.from_pretrained(
                        'mistralai/Mistral-7B-Instruct-v0.2',
                        cache_dir=str(self.cache_dir),
                        trust_remote_code=True
                    )
                    logger.info("✅ LLM tokenizer loaded")
                    
                    # Apply patches again before model loading
                    _patch_transformers_validation()
                    
                    # Try to import modeling_layers to trigger patches
                    try:
                        import transformers.modeling_layers
                        _patch_transformers_validation()
                    except Exception:
                        pass
                    
                    # Load model
                    model = AutoModelForCausalLM.from_pretrained(
                        'mistralai/Mistral-7B-Instruct-v0.2',
                        cache_dir=str(self.cache_dir),
                        trust_remote_code=True,
                        torch_dtype=torch.float16,
                        device_map='cuda',
                        low_cpu_mem_usage=True
                    )
                    
                    # Verify model is on GPU
                    if next(model.parameters()).is_cuda:
                        loading_results['llm_model_loaded'] = True
                        logger.info("✅ LLM model loaded into GPU successfully")
                    else:
                        logger.warning("⚠️ LLM model loaded but not on GPU")
                        loading_results['errors'].append("LLM model not on GPU")
                    
                    # Clean up
                    del model
                    del tokenizer
                    torch.cuda.empty_cache()
                    
                except Exception as e:
                    error_str = str(e)
                    if "expected string" in error_str.lower() or "Args" in error_str:
                        logger.warning(f"⚠️ LLM model loading encountered validation error (non-fatal): {error_str[:100]}")
                        loading_results['errors'].append(f"LLM model validation error (non-fatal): {error_str[:100]}")
                    else:
                        logger.warning(f"⚠️ LLM model loading failed: {error_str[:100]}")
                        loading_results['errors'].append(f"LLM model: {error_str[:100]}")
                finally:
                    sys.stderr = old_stderr
                    torch.cuda.empty_cache()
            except Exception as e:
                logger.warning(f"⚠️ Failed to load LLM model: {e}")
                loading_results['errors'].append(f"LLM model: {str(e)[:100]}")
            
            logger.info("=== GPU Model Loading Complete ===")
            return loading_results
            
        except Exception as e:
            logger.error(f"❌ GPU model loading failed: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            loading_results['errors'].append(str(e))
            return loading_results
    
    def run_initialization(self) -> int:
        """
        Run complete cache initialization process
        
        Returns:
            Exit code (0 for success, 1 for failure)
        """
        try:
            logger.info("=== Cache Initialization Started ===")
            
            # Check if marker file already exists
            marker_file = self.cache_dir / '.initialization_complete'
            if marker_file.exists():
                logger.info(f"✅ Completion marker already exists: {marker_file}")
                logger.info("Cache appears to be already initialized. Running validation only...")
                # Still run validation to ensure everything is OK
            
            # Step 1: Validate environment
            if not self.validate_environment():
                logger.error("❌ Environment validation failed")
                return 1
            
            # Step 2: Validate dependencies
            if not self.validate_dependencies():
                logger.error("❌ Dependency validation failed")
                return 1
            
            # Step 3: Discover existing models
            discovery_results = self.discover_existing_models()
            
            # Step 4: Load models into GPU cache (NEW)
            loading_results = self.load_models_into_gpu()
            
            # Step 5: Create status report
            status_file = self.create_status_report(discovery_results)
            
            # Step 6: Final validation
            total_time = time.time() - self.start_time
            
            self.status['initialization_completed'] = True
            
            # Print summary
            print("\n" + "="*50)
            print("CACHE INITIALIZATION SUMMARY")
            print("="*50)
            print(f"✅ Initialization completed in {total_time:.2f} seconds")
            print(f"✅ Environment validated: {self.status['environment_validated']}")
            print(f"✅ Dependencies validated: {self.status['dependencies_validated']}")
            print(f"✅ Models discovered: {self.status['models_discovered']}")
            print(f"✅ Cache directory: {self.cache_dir}")
            
            if discovery_results.get('total_directories', 0) > 0:
                print(f"✅ Found {discovery_results['total_directories']} cached items")
                print(f"✅ Cache size: {discovery_results.get('cache_size_mb', 0):.1f} MB")
            else:
                print("ℹ️ No existing models found (normal for fresh deployment)")
            
            # GPU loading results
            if loading_results.get('embedding_model_loaded'):
                print("✅ Embedding model loaded into GPU cache")
            else:
                print("⚠️ Embedding model not loaded into GPU cache")
            
            if loading_results.get('llm_model_loaded'):
                print("✅ LLM model loaded into GPU cache")
            else:
                print("⚠️ LLM model not loaded into GPU cache")
            
            if loading_results.get('errors'):
                print(f"⚠️ GPU loading errors: {len(loading_results['errors'])}")
                for error in loading_results['errors'][:3]:  # Show first 3 errors
                    print(f"   - {error}")
            
            if self.status['warnings']:
                print(f"⚠️ Warnings: {len(self.status['warnings'])}")
                for warning in self.status['warnings']:
                    print(f"   - {warning}")
            
            if status_file:
                print(f"📄 Status report: {status_file}")
            
            print("="*50)
            
            # Create completion marker file for backend container
            marker_file = self.cache_dir / '.initialization_complete'
            try:
                marker_file.touch()
                logger.info(f"✅ Created completion marker: {marker_file}")
                print(f"✅ Created completion marker: {marker_file}")
            except Exception as e:
                logger.warning(f"⚠️ Failed to create completion marker: {e}")
                # Don't fail initialization if marker creation fails
            
            logger.info("✅ Cache initialization completed successfully")
            return 0
            
        except Exception as e:
            logger.error(f"❌ Cache initialization failed: {e}")
            logger.error(f"Traceback: {traceback.format_exc()}")
            self.status['errors'].append(str(e))
            return 1

def main():
    """Main function with comprehensive error handling"""
    try:
        # Create and run initializer
        initializer = EnhancedCacheInitializer()
        exit_code = initializer.run_initialization()
        
        logger.info(f"Cache initialization exiting with code: {exit_code}")
        return exit_code
        
    except KeyboardInterrupt:
        logger.info("Cache initialization interrupted by user")
        return 130
        
    except Exception as e:
        logger.error(f"Unexpected error in main: {e}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)
#!/usr/bin/env python3
"""
Model Cache Initialization Script
Initializes and validates model cache for RAG application
Ensures models are properly cached and accessible for container deployment
"""

import os
import sys
import json
import logging
import time
import shutil
from pathlib import Path
from typing import Dict, Any, List

# Add current directory to path for imports
sys.path.insert(0, '/app/scripts')

try:
    from model_cache_utils import ModelCacheManager, setup_cache_environment
except ImportError:
    # Fallback if running outside container
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
    from model_cache_utils import ModelCacheManager, setup_cache_environment

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class ModelCacheInitializer:
    """
    Model Cache Initialization and Validation System
    Ensures all required models are properly cached and accessible
    """
    
    def __init__(self):
        """Initialize the cache initializer"""
        self.cache_manager = ModelCacheManager()
        self.initialization_report = {
            "timestamp": time.time(),
            "initialization_type": "container_startup",
            "models": {},
            "summary": {
                "total_models": 0,
                "successfully_initialized": 0,
                "failed_initialization": 0,
                "already_cached": 0
            }
        }
        
        logger.info("ModelCacheInitializer started")
        logger.info(f"Backend cache: {self.cache_manager.backend_cache_dir}")
        logger.info(f"HuggingFace cache: {self.cache_manager.hf_cache_dir}")
    
    def initialize_all_models(self) -> Dict[str, Any]:
        """
        Initialize all supported models in cache
        
        Returns:
            Initialization report with status for each model
        """
        try:
            logger.info("Starting model cache initialization...")
            start_time = time.time()
            
            # Set up cache environment
            setup_cache_environment()
            
            # Initialize each supported model
            for model_name in self.cache_manager.supported_models:
                logger.info(f"Initializing model: {model_name}")
                model_result = self._initialize_model(model_name)
                self.initialization_report["models"][model_name] = model_result
                self.initialization_report["summary"]["total_models"] += 1
                
                if model_result["status"] == "success":
                    self.initialization_report["summary"]["successfully_initialized"] += 1
                elif model_result["status"] == "already_cached":
                    self.initialization_report["summary"]["already_cached"] += 1
                else:
                    self.initialization_report["summary"]["failed_initialization"] += 1
            
            # Calculate total time
            total_time = time.time() - start_time
            self.initialization_report["total_time_seconds"] = total_time
            
            # Log summary
            summary = self.initialization_report["summary"]
            logger.info(f"Cache initialization completed in {total_time:.2f} seconds")
            logger.info(f"Results: {summary['successfully_initialized']} initialized, "
                       f"{summary['already_cached']} already cached, "
                       f"{summary['failed_initialization']} failed")
            
            return self.initialization_report
            
        except Exception as e:
            logger.error(f"Cache initialization failed: {e}")
            self.initialization_report["error"] = str(e)
            return self.initialization_report
    
    def _initialize_model(self, model_name: str) -> Dict[str, Any]:
        """
        Initialize a specific model in cache
        
        Args:
            model_name: Model identifier
            
        Returns:
            Model initialization result
        """
        try:
            model_result = {
                "model_name": model_name,
                "status": "unknown",
                "cache_locations": {
                    "backend": False,
                    "hf": False
                },
                "actions_taken": [],
                "errors": []
            }
            
            # Check if model is already cached
            backend_cached = self.cache_manager._is_model_in_backend_cache(model_name)
            hf_cached = self.cache_manager._is_model_in_hf_cache(model_name)
            
            model_result["cache_locations"]["backend"] = backend_cached
            model_result["cache_locations"]["hf"] = hf_cached
            
            if backend_cached or hf_cached:
                model_result["status"] = "already_cached"
                model_result["actions_taken"].append("Model found in existing cache")
                logger.info(f"✅ Model {model_name} already cached")
                return model_result
            
            # Try to copy from alternative cache locations
            copy_success = self._try_copy_from_alternative_locations(model_name, model_result)
            
            if copy_success:
                model_result["status"] = "success"
                logger.info(f"✅ Model {model_name} successfully initialized")
            else:
                # Model not available - this is expected for fresh deployments
                model_result["status"] = "not_available"
                model_result["actions_taken"].append("Model not found in any cache location")
                logger.warning(f"⚠️ Model {model_name} not available in cache")
                logger.info("This is normal for fresh deployments - models will be downloaded on first use")
            
            return model_result
            
        except Exception as e:
            logger.error(f"Failed to initialize model {model_name}: {e}")
            return {
                "model_name": model_name,
                "status": "error",
                "error": str(e),
                "cache_locations": {"backend": False, "hf": False},
                "actions_taken": [],
                "errors": [str(e)]
            }
    
    def _try_copy_from_alternative_locations(self, model_name: str, model_result: Dict[str, Any]) -> bool:
        """
        Try to copy model from alternative cache locations
        
        Args:
            model_name: Model identifier
            model_result: Result dictionary to update
            
        Returns:
            True if copy was successful, False otherwise
        """
        try:
            # Alternative cache locations to check
            alternative_locations = [
                "/home/vastdata/rag-app-07/backend/models_cache",
                "/home/vastdata/.cache/huggingface/hub",
                "/mnt/wslg/distro/home/vastdata/.cache/huggingface/hub",
                "/app/host_cache",  # Potential host mount
                "/cache",  # Alternative mount point
            ]
            
            cache_name = self.cache_manager.supported_models[model_name]["cache_name"]
            
            for alt_location in alternative_locations:
                alt_path = Path(alt_location)
                if not alt_path.exists():
                    continue
                
                # Check for model in this location
                model_path = alt_path / cache_name
                if model_path.exists():
                    logger.info(f"Found model {model_name} in {alt_location}")
                    
                    # Try to copy to backend cache
                    target_path = self.cache_manager.backend_cache_dir / cache_name
                    
                    try:
                        if not target_path.exists():
                            logger.info(f"Copying model from {model_path} to {target_path}")
                            shutil.copytree(model_path, target_path)
                            model_result["actions_taken"].append(f"Copied from {alt_location}")
                            
                            # Validate the copy
                            if self.cache_manager._is_model_in_backend_cache(model_name):
                                logger.info(f"✅ Successfully copied {model_name} to backend cache")
                                return True
                            else:
                                logger.warning(f"Copy validation failed for {model_name}")
                                model_result["errors"].append("Copy validation failed")
                        else:
                            logger.info(f"Target already exists: {target_path}")
                            model_result["actions_taken"].append("Target already exists")
                            return True
                            
                    except Exception as copy_error:
                        logger.warning(f"Failed to copy from {alt_location}: {copy_error}")
                        model_result["errors"].append(f"Copy failed: {copy_error}")
                        continue
            
            return False
            
        except Exception as e:
            logger.error(f"Error in copy from alternative locations: {e}")
            model_result["errors"].append(f"Alternative copy error: {e}")
            return False
    
    def validate_initialization(self) -> Dict[str, Any]:
        """
        Validate that initialization was successful
        
        Returns:
            Validation report
        """
        try:
            logger.info("Validating cache initialization...")
            
            validation_report = {
                "timestamp": time.time(),
                "validation_type": "post_initialization",
                "models": {},
                "summary": {
                    "total_models": 0,
                    "valid_models": 0,
                    "invalid_models": 0,
                    "missing_models": 0
                }
            }
            
            for model_name in self.cache_manager.supported_models:
                is_cached = self.cache_manager.is_model_cached(model_name)
                cache_path = self.cache_manager.get_model_cache_path(model_name)
                
                model_validation = {
                    "model_name": model_name,
                    "is_cached": is_cached,
                    "cache_path": str(cache_path) if cache_path else None,
                    "status": "valid" if is_cached else "missing"
                }
                
                validation_report["models"][model_name] = model_validation
                validation_report["summary"]["total_models"] += 1
                
                if is_cached:
                    validation_report["summary"]["valid_models"] += 1
                    logger.info(f"✅ {model_name}: Valid")
                else:
                    validation_report["summary"]["missing_models"] += 1
                    logger.warning(f"⚠️ {model_name}: Missing")
            
            return validation_report
            
        except Exception as e:
            logger.error(f"Validation failed: {e}")
            return {"error": str(e)}
    
    def create_cache_status_file(self) -> str:
        """
        Create a cache status file for monitoring
        
        Returns:
            Path to created status file
        """
        try:
            status_file = Path("/app/cache_status.json")
            
            status_data = {
                "timestamp": time.time(),
                "cache_info": self.cache_manager.get_cache_info(),
                "initialization_report": self.initialization_report,
                "validation_report": self.validate_initialization()
            }
            
            with open(status_file, 'w') as f:
                json.dump(status_data, f, indent=2)
            
            logger.info(f"Cache status file created: {status_file}")
            return str(status_file)
            
        except Exception as e:
            logger.error(f"Failed to create status file: {e}")
            return ""

def main():
    """Main initialization function"""
    try:
        logger.info("=== Model Cache Initialization Started ===")
        
        # Create initializer
        initializer = ModelCacheInitializer()
        
        # Initialize all models
        init_report = initializer.initialize_all_models()
        
        # Validate initialization
        validation_report = initializer.validate_initialization()
        
        # Create status file
        status_file = initializer.create_cache_status_file()
        
        # Print summary
        print("\n=== CACHE INITIALIZATION SUMMARY ===")
        print(f"Total models: {init_report['summary']['total_models']}")
        print(f"Successfully initialized: {init_report['summary']['successfully_initialized']}")
        print(f"Already cached: {init_report['summary']['already_cached']}")
        print(f"Failed: {init_report['summary']['failed_initialization']}")
        print(f"Valid after initialization: {validation_report['summary']['valid_models']}")
        print(f"Missing after initialization: {validation_report['summary']['missing_models']}")
        
        if status_file:
            print(f"Status file: {status_file}")
        
        # Determine exit code
        total_available = (init_report['summary']['successfully_initialized'] + 
                          init_report['summary']['already_cached'])
        
        if total_available > 0:
            print("\n✅ Cache initialization completed successfully")
            logger.info("Cache initialization completed successfully")
            return 0
        else:
            print("\n⚠️ No models available in cache - will download on first use")
            logger.warning("No models available in cache - will download on first use")
            return 0  # Not an error for fresh deployments
            
    except Exception as e:
        print(f"\n❌ Cache initialization failed: {e}")
        logger.error(f"Cache initialization failed: {e}")
        return 1

if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)

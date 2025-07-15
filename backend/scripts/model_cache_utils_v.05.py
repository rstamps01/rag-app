#!/usr/bin/env python3
"""
Revised Model Cache Utilities for Actual Directory Structure
Optimized for /home/vastdata/rag-app-07/ deployment with existing cache
"""

import os
import sys
import logging
import json
import shutil
from pathlib import Path
from typing import Dict, Any, List, Optional, Union
import time
import hashlib

logger = logging.getLogger(__name__)

class ModelCacheManager:
    """
    Enhanced Model Cache Manager for Actual vastdata Deployment
    Handles both manual cache and HuggingFace cache structures
    """
    
    def __init__(
        self,
        cache_dir: Optional[str] = None,
        hf_cache_dir: Optional[str] = None,
        user: str = "vastdata"
    ):
        """
        Initialize cache manager with actual deployment paths
        
        Args:
            cache_dir: Manual models cache directory
            hf_cache_dir: HuggingFace cache directory  
            user: System user (vastdata)
        """
        self.user = user
        self.base_dir = f"/home/{user}/rag-app-07"
        
        # Set cache directories based on actual structure
        self.cache_dir = Path(cache_dir) if cache_dir else Path(self.base_dir) / "backend" / "models_cache"
        self.hf_cache_dir = Path(hf_cache_dir) if hf_cache_dir else Path(self.base_dir) / "huggingface_cache"
        self.hf_hub_dir = self.hf_cache_dir / "huggingface_cache"
        
        # Ensure directories exist
        self._ensure_directories()
        
        # Model configurations
        self.supported_models = {
            "mistralai/Mistral-7B-Instruct-v0.2": {
                "type": "llm",
                "cache_name": "models--mistralai--Mistral-7B-Instruct-v0.2",
                "required_files": ["config.json", "tokenizer.json", "tokenizer_config.json"]
            },
            "sentence-transformers/all-MiniLM-L6-v2": {
                "type": "embedding", 
                "cache_name": "models--sentence-transformers--all-MiniLM-L6-v2",
                "required_files": ["config.json", "tokenizer.json", "pytorch_model.bin"]
            }
        }
        
        logger.info(f"Cache manager initialized for user: {user}")
        logger.info(f"Manual cache: {self.cache_dir}")
        logger.info(f"HuggingFace cache: {self.hf_cache_dir}")
    
    def _ensure_directories(self):
        """Ensure all required cache directories exist with proper permissions"""
        directories = [
            self.cache_dir,
            self.hf_cache_dir,
            self.hf_hub_dir
        ]
        
        for directory in directories:
            try:
                directory.mkdir(parents=True, exist_ok=True)
                # Set permissions for vastdata user
                os.chmod(directory, 0o755)
                logger.debug(f"Directory ensured: {directory}")
            except Exception as e:
                logger.warning(f"Failed to create directory {directory}: {e}")
    
    def is_model_cached(self, model_name: str) -> bool:
        """
        Check if model is available in any cache location
        
        Args:
            model_name: Model identifier (e.g., 'mistralai/Mistral-7B-Instruct-v0.2')
            
        Returns:
            True if model is found in cache
        """
        try:
            # Check both manual cache and HuggingFace cache
            manual_path = self._get_manual_cache_path(model_name)
            hf_path = self._get_hf_cache_path(model_name)
            
            manual_exists = manual_path and manual_path.exists()
            hf_exists = hf_path and hf_path.exists()
            
            if manual_exists:
                logger.info(f"Model {model_name} found in manual cache: {manual_path}")
                return True
            elif hf_exists:
                logger.info(f"Model {model_name} found in HuggingFace cache: {hf_path}")
                return True
            else:
                logger.info(f"Model {model_name} not found in cache")
                return False
                
        except Exception as e:
            logger.error(f"Error checking cache for {model_name}: {e}")
            return False
    
    def get_model_cache_path(self, model_name: str) -> Optional[Path]:
        """
        Get the actual cache path for a model
        
        Args:
            model_name: Model identifier
            
        Returns:
            Path to cached model or None if not found
        """
        try:
            # Priority: Manual cache first, then HuggingFace cache
            manual_path = self._get_manual_cache_path(model_name)
            if manual_path and manual_path.exists():
                return manual_path
            
            hf_path = self._get_hf_cache_path(model_name)
            if hf_path and hf_path.exists():
                return hf_path
            
            logger.warning(f"No cache path found for {model_name}")
            return None
            
        except Exception as e:
            logger.error(f"Error getting cache path for {model_name}: {e}")
            return None
    
    def _get_manual_cache_path(self, model_name: str) -> Optional[Path]:
        """Get manual cache path for model"""
        if model_name not in self.supported_models:
            return None
        
        cache_name = self.supported_models[model_name]["cache_name"]
        return self.cache_dir / cache_name
    
    def _get_hf_cache_path(self, model_name: str) -> Optional[Path]:
        """Get HuggingFace cache path for model"""
        if model_name not in self.supported_models:
            return None
        
        cache_name = self.supported_models[model_name]["cache_name"]
        model_dir = self.hf_hub_dir / cache_name
        
        if not model_dir.exists():
            return None
        
        # Find the latest snapshot
        snapshots_dir = model_dir / "snapshots"
        if not snapshots_dir.exists():
            return None
        
        # Get the most recent snapshot
        snapshots = [d for d in snapshots_dir.iterdir() if d.is_dir()]
        if not snapshots:
            return None
        
        # Return the first (or most recent) snapshot
        return snapshots[0]
    
    def verify_model_integrity(self, model_name: str) -> Dict[str, Any]:
        """
        Verify model cache integrity
        
        Args:
            model_name: Model identifier
            
        Returns:
            Dictionary with verification results
        """
        result = {
            "model_name": model_name,
            "cached": False,
            "cache_path": None,
            "integrity_check": False,
            "missing_files": [],
            "file_sizes": {},
            "verification_time": time.time()
        }
        
        try:
            cache_path = self.get_model_cache_path(model_name)
            if not cache_path:
                return result
            
            result["cached"] = True
            result["cache_path"] = str(cache_path)
            
            # Check required files
            if model_name in self.supported_models:
                required_files = self.supported_models[model_name]["required_files"]
                missing_files = []
                file_sizes = {}
                
                for file_name in required_files:
                    file_path = cache_path / file_name
                    if file_path.exists():
                        file_sizes[file_name] = file_path.stat().st_size
                    else:
                        missing_files.append(file_name)
                
                result["missing_files"] = missing_files
                result["file_sizes"] = file_sizes
                result["integrity_check"] = len(missing_files) == 0
            
            logger.info(f"Model {model_name} integrity check: {result['integrity_check']}")
            return result
            
        except Exception as e:
            logger.error(f"Error verifying {model_name}: {e}")
            result["error"] = str(e)
            return result
    
    def get_cache_info(self) -> Dict[str, Any]:
        """Get comprehensive cache information"""
        info = {
            "user": self.user,
            "base_dir": str(self.base_dir),
            "cache_directories": {
                "manual_cache": str(self.cache_dir),
                "hf_cache": str(self.hf_cache_dir),
                "hf_hub": str(self.hf_hub_dir)
            },
            "directory_status": {},
            "models": {},
            "total_size_mb": 0,
            "last_updated": time.time()
        }
        
        # Check directory status
        for name, path_str in info["cache_directories"].items():
            path = Path(path_str)
            info["directory_status"][name] = {
                "exists": path.exists(),
                "readable": path.exists() and os.access(path, os.R_OK),
                "writable": path.exists() and os.access(path, os.W_OK),
                "size_mb": self._get_directory_size(path) if path.exists() else 0
            }
        
        # Check supported models
        total_size = 0
        for model_name in self.supported_models:
            model_info = self.verify_model_integrity(model_name)
            info["models"][model_name] = model_info
            
            if model_info["cached"] and model_info["file_sizes"]:
                model_size = sum(model_info["file_sizes"].values()) / (1024 * 1024)  # MB
                total_size += model_size
        
        info["total_size_mb"] = round(total_size, 2)
        
        return info
    
    def _get_directory_size(self, path: Path) -> float:
        """Get directory size in MB"""
        try:
            total_size = 0
            for file_path in path.rglob("*"):
                if file_path.is_file():
                    total_size += file_path.stat().st_size
            return round(total_size / (1024 * 1024), 2)  # MB
        except Exception as e:
            logger.warning(f"Error calculating size for {path}: {e}")
            return 0.0
    
    def copy_from_external_cache(
        self, 
        model_name: str, 
        external_path: Union[str, Path],
        target_cache: str = "manual"
    ) -> bool:
        """
        Copy model from external cache location
        
        Args:
            model_name: Model identifier
            external_path: Source path
            target_cache: Target cache type ('manual' or 'hf')
            
        Returns:
            True if copy successful
        """
        try:
            external_path = Path(external_path)
            if not external_path.exists():
                logger.error(f"External path does not exist: {external_path}")
                return False
            
            if target_cache == "manual":
                target_path = self._get_manual_cache_path(model_name)
            else:
                target_path = self._get_hf_cache_path(model_name)
            
            if not target_path:
                logger.error(f"Cannot determine target path for {model_name}")
                return False
            
            # Create target directory
            target_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Copy files
            if external_path.is_file():
                shutil.copy2(external_path, target_path)
            else:
                shutil.copytree(external_path, target_path, dirs_exist_ok=True)
            
            logger.info(f"Successfully copied {model_name} to {target_path}")
            return True
            
        except Exception as e:
            logger.error(f"Error copying {model_name}: {e}")
            return False
    
    def cleanup_cache(self, keep_models: Optional[List[str]] = None) -> Dict[str, Any]:
        """
        Clean up cache, optionally keeping specified models
        
        Args:
            keep_models: List of model names to keep
            
        Returns:
            Cleanup results
        """
        if keep_models is None:
            keep_models = list(self.supported_models.keys())
        
        result = {
            "cleaned_models": [],
            "kept_models": keep_models,
            "space_freed_mb": 0,
            "errors": []
        }
        
        try:
            # Clean manual cache
            if self.cache_dir.exists():
                for model_dir in self.cache_dir.iterdir():
                    if model_dir.is_dir():
                        model_name = self._cache_name_to_model_name(model_dir.name)
                        if model_name and model_name not in keep_models:
                            size_mb = self._get_directory_size(model_dir)
                            shutil.rmtree(model_dir)
                            result["cleaned_models"].append(model_name)
                            result["space_freed_mb"] += size_mb
            
            logger.info(f"Cache cleanup completed: {result}")
            return result
            
        except Exception as e:
            logger.error(f"Error during cache cleanup: {e}")
            result["errors"].append(str(e))
            return result
    
    def _cache_name_to_model_name(self, cache_name: str) -> Optional[str]:
        """Convert cache directory name to model name"""
        for model_name, config in self.supported_models.items():
            if config["cache_name"] == cache_name:
                return model_name
        return None

def find_model_in_cache(
    model_name: str, 
    cache_dirs: Optional[List[str]] = None,
    user: str = "vastdata"
) -> Optional[str]:
    """
    Find model in cache directories
    
    Args:
        model_name: Model identifier
        cache_dirs: List of cache directories to search
        user: System user
        
    Returns:
        Path to model if found
    """
    if cache_dirs is None:
        base_dir = f"/home/{user}/rag-app-07"
        cache_dirs = [
            f"{base_dir}/backend/models_cache",
            f"{base_dir}/huggingface_cache"
        ]
    
    manager = ModelCacheManager(user=user)
    cache_path = manager.get_model_cache_path(model_name)
    return str(cache_path) if cache_path else None

def setup_cache_environment(user: str = "vastdata"):
    """
    Set up cache environment variables for actual deployment
    
    Args:
        user: System user
    """
    base_dir = f"/home/{user}/rag-app-07"
    
    # Set environment variables
    os.environ["MODELS_CACHE_DIR"] = f"{base_dir}/backend/models_cache"
    os.environ["HF_HOME"] = f"{base_dir}/huggingface_cache"
    os.environ["TRANSFORMERS_CACHE"] = f"{base_dir}/huggingface_cache"
    os.environ["HF_HUB_CACHE"] = f"{base_dir}/huggingface_cache"
    
    logger.info(f"Cache environment set up for user: {user}")
    logger.info(f"MODELS_CACHE_DIR: {os.environ['MODELS_CACHE_DIR']}")
    logger.info(f"HF_HOME: {os.environ['HF_HOME']}")

def validate_actual_cache_structure(user: str = "vastdata") -> Dict[str, Any]:
    """
    Validate the actual cache structure matches expected format
    
    Args:
        user: System user
        
    Returns:
        Validation results
    """
    manager = ModelCacheManager(user=user)
    
    validation_result = {
        "user": user,
        "timestamp": time.time(),
        "cache_structure_valid": True,
        "issues": [],
        "cache_info": manager.get_cache_info(),
        "model_verification": {}
    }
    
    # Verify each supported model
    for model_name in manager.supported_models:
        verification = manager.verify_model_integrity(model_name)
        validation_result["model_verification"][model_name] = verification
        
        if not verification["cached"]:
            validation_result["issues"].append(f"Model {model_name} not found in cache")
            validation_result["cache_structure_valid"] = False
        elif not verification["integrity_check"]:
            validation_result["issues"].append(f"Model {model_name} has missing files: {verification['missing_files']}")
            validation_result["cache_structure_valid"] = False
    
    return validation_result

if __name__ == "__main__":
    # Test the cache manager with actual structure
    logging.basicConfig(level=logging.INFO)
    
    print("🔍 Validating actual cache structure...")
    result = validate_actual_cache_structure()
    
    print(f"\n📊 Validation Results:")
    print(f"User: {result['user']}")
    print(f"Cache Structure Valid: {result['cache_structure_valid']}")
    print(f"Issues: {len(result['issues'])}")
    
    if result['issues']:
        print("\n⚠️ Issues Found:")
        for issue in result['issues']:
            print(f"  - {issue}")
    
    print(f"\n📁 Cache Info:")
    cache_info = result['cache_info']
    print(f"Total Size: {cache_info['total_size_mb']} MB")
    
    for model_name, verification in result['model_verification'].items():
        status = "✅" if verification['cached'] and verification['integrity_check'] else "❌"
        print(f"{status} {model_name}: {'Cached' if verification['cached'] else 'Not Found'}")

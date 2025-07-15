#!/usr/bin/env python3
"""
Model Cache Utilities for RAG Application - Host Environment Compatible
Provides efficient model caching and loading for Mistral v0.2 and embedding models
Optimized for RTX 5090 GPU acceleration
Works in both host and container environments
"""

import os
import sys
import json
import logging
import hashlib
from pathlib import Path
from typing import Dict, Any, Optional, List, Union
import time

logger = logging.getLogger(__name__)

def detect_environment() -> str:
    """
    Detect if running in container or host environment
    
    Returns:
        "container" if running in Docker container, "host" if running on host
    """
    # Check for container indicators
    if os.path.exists("/.dockerenv"):
        return "container"
    
    # Check if we"re in a typical container path structure
    if os.getcwd().startswith("/app"):
        return "container"
    
    # Check for vastdata user (host environment indicator)
    if "vastdata" in os.path.expanduser("~"):
        return "host"
    
    # Default to host if uncertain
    return "host"

def get_environment_paths() -> Dict[str, str]:
    """
    Get appropriate cache paths based on environment
    
    Returns:
        Dictionary with backend_cache_dir and hf_cache_dir paths
    """
    env = detect_environment()
    
    if env == "container":
        # Container environment paths
        return {
            "backend_cache_dir": os.environ.get("MODELS_CACHE_DIR", "/app/models_cache"),
            "hf_cache_dir": os.environ.get("HF_HOME", "/app/models_cache/home")
        }
    else:
        # Host environment paths (vastdata)
        base_dir = "/home/vastdata/rag-app-07"
        return {
            "backend_cache_dir": f"{base_dir}/backend/models_cache",
            "hf_cache_dir": f"{base_dir}/backend/models_cache"
        }

class ModelCacheManager:
    """
    Advanced Model Cache Manager for RAG Application
    Handles both manual cache and HuggingFace cache structures
    Environment-aware (host vs container)
    """
    
    def __init__(self, 
                 backend_cache_dir: Optional[str] = None,
                 hf_cache_dir: Optional[str] = None):
        """
        Initialize ModelCacheManager with cache directories
        
        Args:
            backend_cache_dir: Path to backend models cache
            hf_cache_dir: Path to HuggingFace cache
        """
        # Detect environment and get appropriate paths
        env_paths = get_environment_paths()
        
        # Set up cache directories with environment detection
        self.backend_cache_dir = Path(backend_cache_dir or env_paths["backend_cache_dir"])
        self.hf_cache_dir = Path(hf_cache_dir or env_paths["hf_cache_dir"])
        
        # Detect environment
        self.environment = detect_environment()
        
        # Ensure cache directories exist (only if we have write permissions)
        try:
            self.backend_cache_dir.mkdir(parents=True, exist_ok=True)
        except PermissionError:
            logger.debug(f"No write permission for {self.backend_cache_dir}")
        
        try:
            self.hf_cache_dir.mkdir(parents=True, exist_ok=True)
        except PermissionError:
            logger.debug(f"No write permission for {self.hf_cache_dir}")
        
        # Model configurations
        self.supported_models = {
            "mistralai/Mistral-7B-Instruct-v0.2": {
                "type": "llm",
                "cache_name": "models--mistralai--Mistral-7B-Instruct-v0.2",
                "required_files": [
                    "config.json",
                    "tokenizer.json", 
                    "tokenizer_config.json",
                    "special_tokens_map.json"
                ],
                "model_files_pattern": "model-*.safetensors"
            },
            "sentence-transformers/all-MiniLM-L6-v2": {
                "type": "embedding",
                "cache_name": "models--sentence-transformers--all-MiniLM-L6-v2",
                "required_files": [
                    "config.json",
                    "tokenizer.json",
                    "config_sentence_transformers.json"
                ],
                "model_files_pattern": "model.safetensors"
            }
        }
        
        logger.info(f"ModelCacheManager initialized in {self.environment} environment:")
        logger.info(f"  Backend cache: {self.backend_cache_dir}")
        logger.info(f"  HuggingFace cache: {self.hf_cache_dir}")
    
    def is_model_cached(self, model_name: str) -> bool:
        """
        Check if model is available in any cache location
        
        Args:
            model_name: Model identifier (e.g., "mistralai/Mistral-7B-Instruct-v0.2")
            
        Returns:
            True if model is found in cache, False otherwise
        """
        try:
            # Check backend cache first
            if self._is_model_in_backend_cache(model_name):
                logger.debug(f"Model {model_name} found in backend cache")
                return True
            
            # Check HuggingFace cache
            if self._is_model_in_hf_cache(model_name):
                logger.debug(f"Model {model_name} found in HuggingFace cache")
                return True
            
            logger.debug(f"Model {model_name} not found in any cache")
            return False
            
        except Exception as e:
            logger.error(f"Error checking cache for {model_name}: {e}")
            return False
    
    def _is_model_in_backend_cache(self, model_name: str) -> bool:
        """Check if model exists in backend cache"""
        if model_name not in self.supported_models:
            return False
        
        cache_name = self.supported_models[model_name]["cache_name"]
        model_dir = self.backend_cache_dir / cache_name
        
        if not model_dir.exists():
            return False
        
        # Check for snapshot directory structure
        snapshots_dir = model_dir / "snapshots"
        if snapshots_dir.exists():
            # Find any snapshot directory
            snapshot_dirs = [d for d in snapshots_dir.iterdir() if d.is_dir()]
            if snapshot_dirs:
                # Check if required files exist in snapshot
                snapshot_dir = snapshot_dirs[0]  # Use first available snapshot
                return self._validate_model_files(snapshot_dir, model_name)
        
        # Check for direct model files (alternative structure)
        return self._validate_model_files(model_dir, model_name)
    
    def _is_model_in_hf_cache(self, model_name: str) -> bool:
        """Check if model exists in HuggingFace cache"""
        if model_name not in self.supported_models:
            return False
        
        cache_name = self.supported_models[model_name]["cache_name"]
        
        # Check in hub directory
        hub_dir = self.hf_cache_dir / "hub" / cache_name
        if hub_dir.exists():
            snapshots_dir = hub_dir / "snapshots"
            if snapshots_dir.exists():
                snapshot_dirs = [d for d in snapshots_dir.iterdir() if d.is_dir()]
                if snapshot_dirs:
                    snapshot_dir = snapshot_dirs[0]
                    return self._validate_model_files(snapshot_dir, model_name)
        
        # Check direct in hf_cache_dir (alternative structure for vastdata)
        direct_model_dir = self.hf_cache_dir / cache_name
        if direct_model_dir.exists():
            snapshots_dir = direct_model_dir / "snapshots"
            if snapshots_dir.exists():
                snapshot_dirs = [d for d in snapshots_dir.iterdir() if d.is_dir()]
                if snapshot_dirs:
                    snapshot_dir = snapshot_dirs[0]
                    return self._validate_model_files(snapshot_dir, model_name)
        
        return False
    
    def _validate_model_files(self, model_dir: Path, model_name: str) -> bool:
        """Validate that required model files exist"""
        try:
            if not model_dir.exists():
                return False
            
            model_config = self.supported_models[model_name]
            required_files = model_config["required_files"]
            
            # Check required configuration files
            for file_name in required_files:
                file_path = model_dir / file_name
                if not file_path.exists():
                    logger.debug(f"Missing required file: {file_path}")
                    return False
            
            # Check for model weight files
            model_pattern = model_config["model_files_pattern"]
            if "*" in model_pattern:
                # Pattern matching for multiple files
                pattern_prefix = model_pattern.split("*")[0]
                pattern_suffix = model_pattern.split("*")[1]
                
                model_files = [
                    f for f in model_dir.iterdir() 
                    if f.name.startswith(pattern_prefix) and f.name.endswith(pattern_suffix)
                ]
                
                if not model_files:
                    logger.debug(f"No model files matching pattern {model_pattern}")
                    return False
            else:
                # Single file check
                model_file = model_dir / model_pattern
                if not model_file.exists():
                    logger.debug(f"Missing model file: {model_file}")
                    return False
            
            logger.debug(f"Model validation successful for {model_name} in {model_dir}")
            return True
            
        except Exception as e:
            logger.error(f"Error validating model files: {e}")
            return False
    
    def get_model_cache_path(self, model_name: str) -> Optional[Path]:
        """
        Get the path to cached model, preferring backend cache
        
        Args:
            model_name: Model identifier
            
        Returns:
            Path to model cache directory or None if not found
        """
        try:
            # Prefer backend cache
            if self._is_model_in_backend_cache(model_name):
                cache_name = self.supported_models[model_name]["cache_name"]
                model_dir = self.backend_cache_dir / cache_name
                
                # Return snapshot directory if it exists
                snapshots_dir = model_dir / "snapshots"
                if snapshots_dir.exists():
                    snapshot_dirs = [d for d in snapshots_dir.iterdir() if d.is_dir()]
                    if snapshot_dirs:
                        return snapshot_dirs[0]  # Return first available snapshot
                
                return model_dir
            
            # Fallback to HuggingFace cache
            if self._is_model_in_hf_cache(model_name):
                cache_name = self.supported_models[model_name]["cache_name"]
                
                # Check hub directory first
                hub_dir = self.hf_cache_dir / "hub" / cache_name
                if hub_dir.exists():
                    snapshots_dir = hub_dir / "snapshots"
                    if snapshots_dir.exists():
                        snapshot_dirs = [d for d in snapshots_dir.iterdir() if d.is_dir()]
                        if snapshot_dirs:
                            return snapshot_dirs[0]
                
                # Check direct directory (vastdata structure)
                direct_dir = self.hf_cache_dir / cache_name
                if direct_dir.exists():
                    snapshots_dir = direct_dir / "snapshots"
                    if snapshots_dir.exists():
                        snapshot_dirs = [d for d in snapshots_dir.iterdir() if d.is_dir()]
                        if snapshot_dirs:
                            return snapshot_dirs[0]
            
            logger.warning(f"Model {model_name} not found in any cache")
            return None
            
        except Exception as e:
            logger.error(f"Error getting cache path for {model_name}: {e}")
            return None
    
    def get_cache_info(self) -> Dict[str, Any]:
        """
        Get comprehensive cache information
        
        Returns:
            Dictionary with cache status and statistics
        """
        try:
            info = {
                "environment": self.environment,
                "backend_cache": {
                    "path": str(self.backend_cache_dir),
                    "exists": self.backend_cache_dir.exists(),
                    "readable": os.access(self.backend_cache_dir, os.R_OK) if self.backend_cache_dir.exists() else False,
                    "writable": os.access(self.backend_cache_dir, os.W_OK) if self.backend_cache_dir.exists() else False,
                    "models": {}
                },
                "hf_cache": {
                    "path": str(self.hf_cache_dir),
                    "exists": self.hf_cache_dir.exists(),
                    "readable": os.access(self.hf_cache_dir, os.R_OK) if self.hf_cache_dir.exists() else False,
                    "writable": os.access(self.hf_cache_dir, os.W_OK) if self.hf_cache_dir.exists() else False,
                    "models": {}
                },
                "supported_models": list(self.supported_models.keys()),
                "cache_summary": {
                    "total_models_supported": len(self.supported_models),
                    "models_in_backend_cache": 0,
                    "models_in_hf_cache": 0,
                    "models_available": 0
                }
            }
            
            # Check each supported model
            for model_name in self.supported_models:
                backend_available = self._is_model_in_backend_cache(model_name)
                hf_available = self._is_model_in_hf_cache(model_name)
                
                info["backend_cache"]["models"][model_name] = backend_available
                info["hf_cache"]["models"][model_name] = hf_available
                
                if backend_available:
                    info["cache_summary"]["models_in_backend_cache"] += 1
                if hf_available:
                    info["cache_summary"]["models_in_hf_cache"] += 1
                if backend_available or hf_available:
                    info["cache_summary"]["models_available"] += 1
            
            return info
            
        except Exception as e:
            logger.error(f"Error getting cache info: {e}")
            return {"error": str(e)}
    
    def validate_cache_integrity(self) -> Dict[str, Any]:
        """
        Perform comprehensive cache integrity validation
        
        Returns:
            Detailed validation report
        """
        try:
            start_time = time.time()
            
            validation_report = {
                "timestamp": start_time,
                "environment": self.environment,
                "validation_type": "comprehensive_integrity_check",
                "models": {},
                "summary": {
                    "total_models": len(self.supported_models),
                    "valid_models": 0,
                    "invalid_models": 0,
                    "missing_models": 0
                }
            }
            
            for model_name in self.supported_models:
                model_report = {
                    "model_name": model_name,
                    "backend_cache": self._validate_cache_location(model_name, "backend"),
                    "hf_cache": self._validate_cache_location(model_name, "hf"),
                    "overall_status": "unknown"
                }
                
                # Determine overall status
                backend_valid = model_report["backend_cache"]["valid"]
                hf_valid = model_report["hf_cache"]["valid"]
                
                if backend_valid or hf_valid:
                    model_report["overall_status"] = "valid"
                    validation_report["summary"]["valid_models"] += 1
                else:
                    backend_exists = model_report["backend_cache"]["exists"]
                    hf_exists = model_report["hf_cache"]["exists"]
                    
                    if backend_exists or hf_exists:
                        model_report["overall_status"] = "invalid"
                        validation_report["summary"]["invalid_models"] += 1
                    else:
                        model_report["overall_status"] = "missing"
                        validation_report["summary"]["missing_models"] += 1
                
                validation_report["models"][model_name] = model_report
            
            validation_time = time.time() - start_time
            validation_report["validation_time_seconds"] = validation_time
            
            logger.info(f"Cache validation completed in {validation_time:.2f} seconds")
            logger.info(f"Results: {validation_report['summary']['valid_models']} valid, "
                       f"{validation_report['summary']['invalid_models']} invalid, "
                       f"{validation_report['summary']['missing_models']} missing")
            
            return validation_report
            
        except Exception as e:
            logger.error(f"Cache validation failed: {e}")
            return {"error": str(e)}
    
    def _validate_cache_location(self, model_name: str, cache_type: str) -> Dict[str, Any]:
        """Validate model in specific cache location"""
        try:
            if cache_type == "backend":
                exists = self._is_model_in_backend_cache(model_name)
                cache_path = self.backend_cache_dir / self.supported_models[model_name]["cache_name"]
            else:  # hf
                exists = self._is_model_in_hf_cache(model_name)
                cache_name = self.supported_models[model_name]["cache_name"]
                # Try both hub and direct paths
                hub_path = self.hf_cache_dir / "hub" / cache_name
                direct_path = self.hf_cache_dir / cache_name
                cache_path = hub_path if hub_path.exists() else direct_path
            
            if exists:
                actual_path = self.get_model_cache_path(model_name)
                file_count = len(list(actual_path.iterdir())) if actual_path else 0
                
                return {
                    "exists": True,
                    "valid": True,
                    "path": str(actual_path),
                    "file_count": file_count
                }
            else:
                return {
                    "exists": cache_path.exists(),
                    "valid": False,
                    "path": str(cache_path),
                    "file_count": 0
                }
                
        except Exception as e:
            return {
                "exists": False,
                "valid": False,
                "error": str(e),
                "file_count": 0
            }

def find_model_in_cache(model_name: str, cache_dirs: Optional[List[str]] = None) -> Optional[str]:
    """
    Find model in cache directories
    
    Args:
        model_name: Model identifier
        cache_dirs: Optional list of cache directories to search
        
    Returns:
        Path to model if found, None otherwise
    """
    try:
        # Use default cache manager if no specific directories provided
        if cache_dirs is None:
            cache_manager = ModelCacheManager()
            cache_path = cache_manager.get_model_cache_path(model_name)
            return str(cache_path) if cache_path else None
        
        # Search in provided directories
        for cache_dir in cache_dirs:
            cache_manager = ModelCacheManager(backend_cache_dir=cache_dir)
            if cache_manager.is_model_cached(model_name):
                cache_path = cache_manager.get_model_cache_path(model_name)
                return str(cache_path) if cache_path else None
        
        return None
        
    except Exception as e:
        logger.error(f"Error finding model in cache: {e}")
        return None

def setup_cache_environment():
    """
    Set up cache environment variables and directories
    """
    try:
        env_paths = get_environment_paths()
        
        # Set up environment variables for HuggingFace
        cache_vars = {
            "HF_HOME": env_paths["hf_cache_dir"],
            "TRANSFORMERS_CACHE": f"{env_paths["hf_cache_dir"]}/transformers",
            "HF_DATASETS_CACHE": f"{env_paths["hf_cache_dir"]}/datasets",
            "HF_HUB_CACHE": f"{env_paths["hf_cache_dir"]}/hub",
            "MODELS_CACHE_DIR": env_paths["backend_cache_dir"]
        }
        
        for var, value in cache_vars.items():
            if var not in os.environ:
                os.environ[var] = value
                logger.debug(f"Set {var}={value}")
        
        # Create cache directories (if we have permissions)
        cache_dirs = [
            env_paths["backend_cache_dir"],
            env_paths["hf_cache_dir"],
            f"{env_paths["hf_cache_dir"]}/transformers",
            f"{env_paths["hf_cache_dir"]}/hub"
        ]
        
        for cache_dir in cache_dirs:
            try:
                Path(cache_dir).mkdir(parents=True, exist_ok=True)
                logger.debug(f"Ensured cache directory exists: {cache_dir}")
            except PermissionError:
                logger.debug(f"No write permission for: {cache_dir}")
        
        logger.info("Cache environment setup completed successfully")
        
    except Exception as e:
        logger.error(f"Failed to setup cache environment: {e}")
        raise

def get_cache_status() -> Dict[str, Any]:
    """
    Get current cache status for all supported models
    
    Returns:
        Dictionary with cache status information
    """
    try:
        cache_manager = ModelCacheManager()
        return cache_manager.get_cache_info()
    except Exception as e:
        logger.error(f"Error getting cache status: {e}")
        return {"error": str(e)}

def validate_all_caches() -> Dict[str, Any]:
    """
    Validate integrity of all model caches
    
    Returns:
        Comprehensive validation report
    """
    try:
        cache_manager = ModelCacheManager()
        return cache_manager.validate_cache_integrity()
    except Exception as e:
        logger.error(f"Error validating caches: {e}")
        return {"error": str(e)}

# Global cache manager instance
_cache_manager = None

def get_cache_manager() -> ModelCacheManager:
    """Get or create global cache manager instance"""
    global _cache_manager
    if _cache_manager is None:
        _cache_manager = ModelCacheManager()
    return _cache_manager

if __name__ == "__main__":
    # Command line interface for cache utilities
    import argparse
    
    parser = argparse.ArgumentParser(description="Model Cache Utilities")
    parser.add_argument("--validate", action="store_true", help="Validate cache integrity")
    parser.add_argument("--status", action="store_true", help="Show cache status")
    parser.add_argument("--model", type=str, help="Check specific model")
    parser.add_argument("--env", action="store_true", help="Show environment detection")
    
    args = parser.parse_args()
    
    # Set up logging
    logging.basicConfig(level=logging.INFO)
    
    if args.env:
        env = detect_environment()
        paths = get_environment_paths()
        print(f"Environment: {env}")
        print(f"Backend cache: {paths["backend_cache_dir"]}")
        print(f"HF cache: {paths["hf_cache_dir"]}")
    
    elif args.validate:
        print("Validating cache integrity...")
        result = validate_all_caches()
        print(json.dumps(result, indent=2))
    
    elif args.status:
        print("Getting cache status...")
        result = get_cache_status()
        print(json.dumps(result, indent=2))
    
    elif args.model:
        print(f"Checking model: {args.model}")
        cache_manager = get_cache_manager()
        is_cached = cache_manager.is_model_cached(args.model)
        cache_path = cache_manager.get_model_cache_path(args.model)
        
        print(f"Model cached: {is_cached}")
        if cache_path:
            print(f"Cache path: {cache_path}")
    
    else:
        print("Model Cache Utilities - Environment Aware")
        print("Use --help for available options")
        print("Use --env to see environment detection")

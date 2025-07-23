"""
GPU Accelerator with PyTorch SDPA Support
Enhanced memory management and RTX 5090 Blackwell optimizations
"""

import logging
import threading
import time
from typing import Dict, Any, Optional, Tuple
import torch
import gc

logger = logging.getLogger(__name__)

class GPUAccelerator:
    """
    GPU Accelerator with singleton pattern and PyTorch SDPA optimization
    """
    
    _instance = None
    _lock = threading.Lock()
    
    def __new__(cls):
        if cls._instance is None:
            with cls._lock:
                if cls._instance is None:
                    cls._instance = super(GPUAccelerator, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if hasattr(self, '_initialized'):
            return
        
        self._initialized = True
        self.cuda_available = torch.cuda.is_available()
        self.device_count = torch.cuda.device_count() if self.cuda_available else 0
        self.device_properties = None
        self.architecture = None
        
        if self.cuda_available:
            self.device_properties = torch.cuda.get_device_properties(0)
            self.architecture = self._detect_gpu_architecture()
            self._configure_gpu_settings()
        
        logger.info(f"GPU Accelerator initialized - CUDA: {self.cuda_available}, Architecture: {self.architecture}")
    
    def _detect_gpu_architecture(self) -> str:
        """Detect GPU architecture"""
        if not self.cuda_available:
            return "cpu"
        
        compute_major = self.device_properties.major
        compute_minor = self.device_properties.minor
        device_name = self.device_properties.name.lower()
        
        # RTX 5090 uses Blackwell architecture (compute capability 12.0)
        if compute_major == 12:
            return "blackwell"
        # RTX 4090 uses Ada Lovelace architecture (compute capability 8.9)
        elif compute_major == 8 and compute_minor == 9:
            return "ada_lovelace"
        # RTX 3090 uses Ampere architecture (compute capability 8.6)
        elif compute_major == 8 and compute_minor == 6:
            return "ampere"
        # RTX 2080 uses Turing architecture (compute capability 7.5)
        elif compute_major == 7 and compute_minor == 5:
            return "turing"
        else:
            return f"unknown_sm_{compute_major}{compute_minor}"
    
    def _configure_gpu_settings(self):
        """Configure GPU settings based on architecture"""
        try:
            if self.is_blackwell():
                # RTX 5090 Blackwell optimizations
                torch.cuda.set_per_process_memory_fraction(0.95)  # Use 95% of 32GB VRAM
                torch.set_float32_matmul_precision('high')  # Enable TensorFloat-32
                logger.info("Configured RTX 5090 Blackwell optimizations")
                
            elif self.is_ada_lovelace():
                # RTX 4090 Ada Lovelace optimizations
                torch.cuda.set_per_process_memory_fraction(0.90)  # Use 90% of 24GB VRAM
                torch.set_float32_matmul_precision('high')  # Enable TensorFloat-32
                logger.info("Configured RTX 4090 Ada Lovelace optimizations")
                
            else:
                # Generic GPU optimizations
                torch.cuda.set_per_process_memory_fraction(0.85)
                torch.set_float32_matmul_precision('medium')
                logger.info(f"Configured generic GPU optimizations for {self.architecture}")
            
            # Enable optimized attention backends
            torch.backends.cuda.enable_flash_sdp(True)  # Enable PyTorch SDPA
            torch.backends.cuda.enable_math_sdp(True)   # Enable math fallback
            torch.backends.cuda.enable_mem_efficient_sdp(True)  # Enable memory efficient attention
            
            logger.info("Enabled PyTorch SDPA backends")
            
        except Exception as e:
            logger.warning(f"Failed to configure GPU settings: {e}")
    
    def _supports_sdpa(self) -> bool:
        """Check if PyTorch SDPA is available"""
        if hasattr(torch.nn.functional, 'scaled_dot_product_attention'):
            logger.info("PyTorch SDPA available for GPU acceleration")
            return True
        
        logger.info("PyTorch SDPA not available")
        return False
    
    def _supports_torch_compile(self) -> bool:
        """Check if torch.compile is available"""
        return hasattr(torch, 'compile') and torch.__version__ >= "2.0.0"
    
    def is_blackwell(self) -> bool:
        """Check if GPU is Blackwell architecture (RTX 5090)"""
        return self.architecture == "blackwell"
    
    def is_ada_lovelace(self) -> bool:
        """Check if GPU is Ada Lovelace architecture (RTX 4090)"""
        return self.architecture == "ada_lovelace"
    
    def get_memory_info(self) -> Dict[str, int]:
        """Get GPU memory information"""
        if not self.cuda_available:
            return {"total": 0, "allocated": 0, "reserved": 0, "available": 0}
        
        total = torch.cuda.get_device_properties(0).total_memory
        allocated = torch.cuda.memory_allocated(0)
        reserved = torch.cuda.memory_reserved(0)
        available = total - reserved
        
        return {
            "total": total,
            "allocated": allocated,
            "reserved": reserved,
            "available": available
        }
    
    def clear_memory(self):
        """Clear GPU memory cache"""
        if self.cuda_available:
            torch.cuda.empty_cache()
            gc.collect()
            logger.info("GPU memory cache cleared")
    
    def get_memory_usage_mb(self) -> float:
        """Get current GPU memory usage in MB"""
        if not self.cuda_available:
            return 0.0
        
        return torch.cuda.memory_allocated(0) / 1024 / 1024
    
    def check_memory_availability(self, required_mb: float) -> bool:
        """Check if enough GPU memory is available"""
        if not self.cuda_available:
            return True
        
        memory_info = self.get_memory_info()
        available_mb = memory_info["available"] / 1024 / 1024
        
        return available_mb >= required_mb
    
    def optimize_model(self, model):
        """Apply GPU optimizations to a model"""
        if not self.cuda_available:
            return model
        
        try:
            # Move to GPU
            model = model.cuda()
            
            # Apply architecture-specific optimizations
            if self.is_blackwell():
                model = self._apply_blackwell_model_optimizations(model)
            elif self.is_ada_lovelace():
                model = self._apply_ada_lovelace_model_optimizations(model)
            else:
                model = self._apply_generic_model_optimizations(model)
            
            return model
            
        except Exception as e:
            logger.warning(f"Model optimization failed: {e}")
            return model
    
    def _apply_blackwell_model_optimizations(self, model):
        """Apply Blackwell-specific model optimizations with PyTorch SDPA"""
        try:
            # Blackwell supports advanced precision
            if hasattr(model, 'half'):
                model = model.half()  # FP16 for Blackwell Tensor cores
                logger.info("FP16 precision enabled for Blackwell")
            
            # Configure PyTorch SDPA attention
            if hasattr(model, 'config') and hasattr(model.config, 'attn_implementation'):
                model.config.attn_implementation = 'sdpa'
                logger.info("PyTorch SDPA attention enabled for Blackwell")
            
            # Blackwell-specific torch compile
            if self._supports_torch_compile():
                try:
                    model = torch.compile(model, mode='max-autotune')
                    logger.info("Torch compile enabled for Blackwell")
                except Exception as e:
                    logger.info(f"Torch compile not available: {e}")
            
            return model
            
        except Exception as e:
            logger.warning(f"Blackwell model optimizations failed: {e}")
            return model
    
    def _apply_ada_lovelace_model_optimizations(self, model):
        """Apply Ada Lovelace-specific model optimizations with PyTorch SDPA"""
        try:
            # Ada Lovelace supports FP16
            if hasattr(model, 'half'):
                model = model.half()
                logger.info("FP16 precision enabled for Ada Lovelace")
            
            # Configure PyTorch SDPA attention
            if hasattr(model, 'config') and hasattr(model.config, 'attn_implementation'):
                model.config.attn_implementation = 'sdpa'
                logger.info("PyTorch SDPA attention enabled for Ada Lovelace")
            
            # Ada Lovelace torch compile
            if self._supports_torch_compile():
                try:
                    model = torch.compile(model, mode='reduce-overhead')
                    logger.info("Torch compile enabled for Ada Lovelace")
                except Exception as e:
                    logger.info(f"Torch compile not available: {e}")
            
            return model
            
        except Exception as e:
            logger.warning(f"Ada Lovelace model optimizations failed: {e}")
            return model
    
    def _apply_generic_model_optimizations(self, model):
        """Apply generic model optimizations with PyTorch SDPA"""
        try:
            # Generic FP16 optimization
            if hasattr(model, 'half'):
                model = model.half()
                logger.info("FP16 precision enabled")
            
            # Configure PyTorch SDPA attention if available
            if hasattr(model, 'config') and hasattr(model.config, 'attn_implementation'):
                if self._supports_sdpa():
                    model.config.attn_implementation = 'sdpa'
                    logger.info("PyTorch SDPA attention enabled")
                else:
                    model.config.attn_implementation = 'eager'
                    logger.info("Using eager attention")
            
            return model
            
        except Exception as e:
            logger.warning(f"Generic model optimizations failed: {e}")
            return model
    
    def get_device_info(self) -> Dict[str, Any]:
        """Get detailed device information"""
        if not self.cuda_available:
            return {
                "cuda_available": False,
                "device_count": 0,
                "architecture": "cpu"
            }
        
        memory_info = self.get_memory_info()
        
        return {
            "cuda_available": True,
            "device_count": self.device_count,
            "device_name": self.device_properties.name,
            "architecture": self.architecture,
            "compute_capability": f"{self.device_properties.major}.{self.device_properties.minor}",
            "total_memory_gb": memory_info["total"] / 1024**3,
            "allocated_memory_mb": memory_info["allocated"] / 1024**2,
            "available_memory_gb": memory_info["available"] / 1024**3,
            "sdpa_available": self._supports_sdpa(),
            "torch_compile_available": self._supports_torch_compile(),
            "is_blackwell": self.is_blackwell(),
            "is_ada_lovelace": self.is_ada_lovelace()
        }
    
    def monitor_memory_usage(self, threshold_mb: float = 1000.0) -> Dict[str, Any]:
        """Monitor GPU memory usage and provide warnings"""
        if not self.cuda_available:
            return {"status": "no_gpu", "warning": False}
        
        memory_info = self.get_memory_info()
        available_mb = memory_info["available"] / 1024 / 1024
        allocated_mb = memory_info["allocated"] / 1024 / 1024
        total_mb = memory_info["total"] / 1024 / 1024
        usage_percent = (allocated_mb / total_mb) * 100
        
        warning = available_mb < threshold_mb
        
        return {
            "status": "monitoring",
            "total_mb": total_mb,
            "allocated_mb": allocated_mb,
            "available_mb": available_mb,
            "usage_percent": usage_percent,
            "warning": warning,
            "threshold_mb": threshold_mb
        }
    
    def health_check(self) -> Dict[str, Any]:
        """Perform health check on GPU accelerator"""
        device_info = self.get_device_info()
        memory_monitor = self.monitor_memory_usage()
        
        return {
            "status": "healthy" if self.cuda_available else "no_gpu",
            "cuda_available": self.cuda_available,
            "architecture": self.architecture,
            "sdpa_available": self._supports_sdpa(),
            "memory_status": "ok" if not memory_monitor["warning"] else "low_memory",
            "device_info": device_info,
            "memory_info": memory_monitor
        }

# Global accelerator instance
_gpu_accelerator = None

def get_gpu_accelerator() -> GPUAccelerator:
    """Get the global GPU accelerator instance"""
    global _gpu_accelerator
    if _gpu_accelerator is None:
        _gpu_accelerator = GPUAccelerator()
    return _gpu_accelerator

"""GPU Configuration for RTX 5090 Optimization"""

import torch
import os
import gc
from typing import Dict, Any

class GPUMemoryOptimizer:
    """GPU Memory optimization for RTX 5090"""
    
    # RTX 5090 specific settings
    MEMORY_FRACTION = 0.8  # Use 80% of 32GB
    MAX_SPLIT_SIZE_MB = 512
    TRITON_CACHE_SIZE = 1024
    
    @classmethod
    def optimize_for_rtx5090(cls) -> Dict[str, Any]:
        """Apply RTX 5090 specific optimizations"""
        if not torch.cuda.is_available():
            return {"status": "skipped", "reason": "CUDA not available"}
        
        try:
            # Set memory fraction (80% of 32GB = ~25.6GB)
            torch.cuda.set_per_process_memory_fraction(cls.MEMORY_FRACTION)
            
            # Configure memory allocator
            os.environ['PYTORCH_CUDA_ALLOC_CONF'] = f'max_split_size_mb:{cls.MAX_SPLIT_SIZE_MB},expandable_segments:True'
            
            # Triton optimization
            os.environ['TRITON_CACHE_DIR'] = '/tmp/triton_cache'
            os.environ['TRITON_KERNEL_CACHE_SIZE'] = str(cls.TRITON_CACHE_SIZE)
            
            # Clear existing cache
            torch.cuda.empty_cache()
            gc.collect()
            
            # Get GPU info
            gpu_name = torch.cuda.get_device_name(0)
            total_memory = torch.cuda.get_device_properties(0).total_memory / 1e9
            
            print("✅ GPU memory optimized for RTX 5090")
            print(f"🎮 GPU: {gpu_name}")
            print(f"📊 Total Memory: {total_memory:.1f}GB")
            print(f"🔧 Allocated Fraction: {cls.MEMORY_FRACTION * 100}%")
            
            return {
                "status": "success",
                "gpu": gpu_name,
                "total_memory_gb": round(total_memory, 1),
                "allocated_fraction": cls.MEMORY_FRACTION,
                "max_memory_gb": round(total_memory * cls.MEMORY_FRACTION, 1)
            }
            
        except Exception as e:
            print(f"❌ GPU optimization failed: {e}")
            return {"status": "error", "error": str(e)}
    
    @staticmethod
    def clear_memory():
        """Clear GPU memory cache"""
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            gc.collect()
    
    @staticmethod
    def get_memory_stats() -> Dict[str, float]:
        """Get current GPU memory statistics"""
        if not torch.cuda.is_available():
            return {}
        
        return {
            "allocated_gb": torch.cuda.memory_allocated() / 1e9,
            "reserved_gb": torch.cuda.memory_reserved() / 1e9,
            "total_gb": torch.cuda.get_device_properties(0).total_memory / 1e9
        }

"""
GPU Optimizer with PyTorch SDPA Support and Blackwell Architecture Detection
Enhanced for RTX 5090 with CUDA 12.8 and PyTorch 2.9.0
"""

import torch
import os
import logging
from typing import Dict, Any, Optional, Tuple

logger = logging.getLogger(__name__)

def detect_gpu_architecture() -> str:
    """Detect GPU architecture with correct Blackwell identification"""
    if not torch.cuda.is_available():
        return "cpu"
    
    device_properties = torch.cuda.get_device_properties(0)
    compute_major = device_properties.major
    compute_minor = device_properties.minor
    device_name = device_properties.name.lower()
    
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

def supports_pytorch_sdpa() -> bool:
    """Check if PyTorch SDPA is available"""
    if hasattr(torch.nn.functional, 'scaled_dot_product_attention'):
        logger.info("PyTorch SDPA available for GPU optimization")
        return True
    
    logger.info("PyTorch SDPA not available - using eager attention")
    return False

def configure_pytorch_sdpa():
    """Configure PyTorch SDPA backends for optimal performance"""
    try:
        # Enable all SDPA backends for maximum performance
        torch.backends.cuda.enable_flash_sdp(True)  # Enable Flash Attention backend
        torch.backends.cuda.enable_math_sdp(True)   # Enable math fallback
        torch.backends.cuda.enable_mem_efficient_sdp(True)  # Enable memory efficient attention
        
        logger.info("PyTorch SDPA backends enabled successfully")
        return True
        
    except Exception as e:
        logger.warning(f"Failed to configure PyTorch SDPA backends: {e}")
        return False

def configure_gpu() -> bool:
    """Configure GPU settings for optimal performance with RTX 5090 using CUDA 12.8 and PyTorch 2.9.0"""
    if not torch.cuda.is_available():
        print("CUDA not available, using CPU")
        return False
    
    # Print GPU information
    device_count = torch.cuda.device_count()
    print(f"Found {device_count} CUDA device(s)")
    
    device_properties = torch.cuda.get_device_properties(0)
    architecture = detect_gpu_architecture()
    
    for i in range(device_count):
        device_name = torch.cuda.get_device_name(i)
        props = torch.cuda.get_device_properties(i)
        print(f"Device {i}: {device_name}")
        print(f"  Compute Capability: {props.major}.{props.minor}")
        print(f"  Architecture: {architecture}")
        print(f"  Total Memory: {props.total_memory / 1024**3:.1f}GB")
        
    # Print CUDA and PyTorch versions
    print(f"CUDA Version: {torch.version.cuda}")
    print(f"PyTorch Version: {torch.__version__}")
    print(f"PyTorch SDPA Available: {supports_pytorch_sdpa()}")
    
    # Configure architecture-specific optimizations
    if architecture == "blackwell":
        configure_blackwell_optimizations()
    elif architecture == "ada_lovelace":
        configure_ada_lovelace_optimizations()
    else:
        configure_generic_optimizations()
    
    # Configure PyTorch SDPA
    configure_pytorch_sdpa()
    
    # Set environment variables for better performance
    configure_environment_variables()
    
    print(f"GPU configuration completed for {architecture} architecture")
    return True

def configure_blackwell_optimizations():
    """Configure RTX 5090 Blackwell-specific optimizations"""
    try:
        # RTX 5090 Blackwell optimizations
        torch.cuda.set_per_process_memory_fraction(0.95)  # Use 95% of 32GB VRAM
        torch.set_float32_matmul_precision('high')  # Enable TensorFloat-32
        
        # Blackwell-specific settings
        torch.backends.cuda.matmul.allow_tf32 = True
        torch.backends.cudnn.allow_tf32 = True
        torch.backends.cudnn.benchmark = True
        torch.backends.cudnn.deterministic = False
        
        logger.info("RTX 5090 Blackwell optimizations configured")
        print("✅ RTX 5090 Blackwell optimizations enabled")
        print("  - 95% VRAM utilization")
        print("  - TensorFloat-32 precision")
        print("  - Advanced Tensor cores")
        
    except Exception as e:
        logger.warning(f"Blackwell optimization failed: {e}")

def configure_ada_lovelace_optimizations():
    """Configure RTX 4090 Ada Lovelace-specific optimizations"""
    try:
        # RTX 4090 Ada Lovelace optimizations
        torch.cuda.set_per_process_memory_fraction(0.90)  # Use 90% of 24GB VRAM
        torch.set_float32_matmul_precision('high')  # Enable TensorFloat-32
        
        # Ada Lovelace-specific settings
        torch.backends.cuda.matmul.allow_tf32 = True
        torch.backends.cudnn.allow_tf32 = True
        torch.backends.cudnn.benchmark = True
        
        logger.info("RTX 4090 Ada Lovelace optimizations configured")
        print("✅ RTX 4090 Ada Lovelace optimizations enabled")
        print("  - 90% VRAM utilization")
        print("  - TensorFloat-32 precision")
        
    except Exception as e:
        logger.warning(f"Ada Lovelace optimization failed: {e}")

def configure_generic_optimizations():
    """Configure generic GPU optimizations"""
    try:
        # Generic GPU optimizations
        torch.cuda.set_per_process_memory_fraction(0.85)  # Use 85% of VRAM
        torch.set_float32_matmul_precision('medium')  # Conservative precision
        
        # Generic settings
        torch.backends.cudnn.benchmark = True
        
        logger.info("Generic GPU optimizations configured")
        print("✅ Generic GPU optimizations enabled")
        print("  - 85% VRAM utilization")
        print("  - Medium precision")
        
    except Exception as e:
        logger.warning(f"Generic optimization failed: {e}")

def configure_environment_variables():
    """Configure environment variables for optimal performance"""
    # CUDA device ordering
    os.environ['CUDA_DEVICE_ORDER'] = 'PCI_BUS_ID'
    os.environ['CUDA_VISIBLE_DEVICES'] = '0'
    
    # PyTorch optimizations
    os.environ['PYTORCH_CUDA_ALLOC_CONF'] = 'max_split_size_mb:512'
    
    # Remove Flash Attention environment variables (using PyTorch SDPA instead)
    if 'PYTORCH_ENABLE_MPS_FALLBACK' in os.environ:
        del os.environ['PYTORCH_ENABLE_MPS_FALLBACK']
    
    # Enable PyTorch JIT optimizations
    os.environ['PYTORCH_JIT_USE_NNC_NOT_NVFUSER'] = '0'
    
    logger.info("Environment variables configured for optimal performance")

def get_optimal_batch_size(model_name: str) -> int:
    """Calculate optimal batch size based on GPU memory and architecture"""
    if not torch.cuda.is_available():
        return 1
    
    gpu_memory = torch.cuda.get_device_properties(0).total_memory
    architecture = detect_gpu_architecture()
    
    # Architecture-specific batch size optimization
    if architecture == "blackwell":
        # RTX 5090 with 32GB VRAM - can handle larger batches
        if "mistral-7b" in model_name.lower():
            return min(16, max(2, gpu_memory // (2 * 1024 * 1024 * 1024)))  # 2GB per sample
        elif "gpt-j" in model_name.lower():
            return min(12, max(2, gpu_memory // (3 * 1024 * 1024 * 1024)))  # 3GB per sample
        elif "llama" in model_name.lower():
            return min(8, max(1, gpu_memory // (4 * 1024 * 1024 * 1024)))   # 4GB per sample
        else:
            return min(20, max(1, gpu_memory // (1.5 * 1024 * 1024 * 1024))) # 1.5GB per sample
            
    elif architecture == "ada_lovelace":
        # RTX 4090 with 24GB VRAM
        if "mistral-7b" in model_name.lower():
            return min(8, max(1, gpu_memory // (3 * 1024 * 1024 * 1024)))
        elif "gpt-j" in model_name.lower():
            return min(6, max(1, gpu_memory // (4 * 1024 * 1024 * 1024)))
        elif "llama" in model_name.lower():
            return min(4, max(1, gpu_memory // (6 * 1024 * 1024 * 1024)))
        else:
            return min(12, max(1, gpu_memory // (2 * 1024 * 1024 * 1024)))
    
    else:
        # Generic GPU - conservative batch sizes
        if "gpt-j" in model_name.lower():
            return min(4, max(1, gpu_memory // (6 * 1024 * 1024 * 1024)))
        elif "llama" in model_name.lower():
            return min(2, max(1, gpu_memory // (8 * 1024 * 1024 * 1024)))
        else:
            return min(8, max(1, gpu_memory // (4 * 1024 * 1024 * 1024)))

def get_attention_implementation() -> str:
    """Get the best available attention implementation"""
    if supports_pytorch_sdpa():
        return "sdpa"
    else:
        return "eager"

def optimize_model_for_inference(model, model_name: str = ""):
    """Optimize a model for inference based on GPU architecture"""
    if not torch.cuda.is_available():
        return model
    
    architecture = detect_gpu_architecture()
    
    try:
        # Move to GPU
        model = model.cuda()
        
        # Apply precision optimizations based on architecture
        if architecture in ["blackwell", "ada_lovelace"]:
            # Use FP16 for modern architectures
            if hasattr(model, 'half'):
                model = model.half()
                logger.info(f"FP16 precision enabled for {architecture}")
        
        # Configure attention implementation
        if hasattr(model, 'config') and hasattr(model.config, 'attn_implementation'):
            attention_impl = get_attention_implementation()
            model.config.attn_implementation = attention_impl
            logger.info(f"Attention implementation set to: {attention_impl}")
        
        # Apply torch.compile for supported architectures
        if architecture == "blackwell" and hasattr(torch, 'compile') and torch.__version__ >= "2.0.0":
            try:
                model = torch.compile(model, mode='max-autotune')
                logger.info("Torch compile enabled for Blackwell")
            except Exception as e:
                logger.info(f"Torch compile not available: {e}")
        
        elif architecture == "ada_lovelace" and hasattr(torch, 'compile') and torch.__version__ >= "2.0.0":
            try:
                model = torch.compile(model, mode='reduce-overhead')
                logger.info("Torch compile enabled for Ada Lovelace")
            except Exception as e:
                logger.info(f"Torch compile not available: {e}")
        
        return model
        
    except Exception as e:
        logger.warning(f"Model optimization failed: {e}")
        return model

def get_gpu_info() -> Dict[str, Any]:
    """Get comprehensive GPU information"""
    if not torch.cuda.is_available():
        return {
            "cuda_available": False,
            "device_count": 0,
            "architecture": "cpu"
        }
    
    device_properties = torch.cuda.get_device_properties(0)
    architecture = detect_gpu_architecture()
    
    # Get memory information
    total_memory = device_properties.total_memory
    allocated_memory = torch.cuda.memory_allocated(0)
    reserved_memory = torch.cuda.memory_reserved(0)
    available_memory = total_memory - reserved_memory
    
    return {
        "cuda_available": True,
        "device_count": torch.cuda.device_count(),
        "device_name": device_properties.name,
        "architecture": architecture,
        "compute_capability": f"{device_properties.major}.{device_properties.minor}",
        "total_memory_gb": total_memory / 1024**3,
        "allocated_memory_mb": allocated_memory / 1024**2,
        "available_memory_gb": available_memory / 1024**3,
        "pytorch_version": torch.__version__,
        "cuda_version": torch.version.cuda,
        "sdpa_available": supports_pytorch_sdpa(),
        "attention_implementation": get_attention_implementation(),
        "is_blackwell": architecture == "blackwell",
        "is_ada_lovelace": architecture == "ada_lovelace"
    }

def clear_gpu_cache():
    """Clear GPU memory cache"""
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        logger.info("GPU memory cache cleared")

def monitor_gpu_memory() -> Dict[str, float]:
    """Monitor GPU memory usage"""
    if not torch.cuda.is_available():
        return {"status": "no_gpu"}
    
    total = torch.cuda.get_device_properties(0).total_memory
    allocated = torch.cuda.memory_allocated(0)
    reserved = torch.cuda.memory_reserved(0)
    available = total - reserved
    
    return {
        "total_gb": total / 1024**3,
        "allocated_mb": allocated / 1024**2,
        "reserved_mb": reserved / 1024**2,
        "available_gb": available / 1024**3,
        "usage_percent": (allocated / total) * 100
    }

# Convenience functions for backward compatibility
def get_optimal_batch_size_legacy(model_name):
    """Legacy function for backward compatibility"""
    return get_optimal_batch_size(model_name)

# Main configuration function
def main():
    """Main configuration function for testing"""
    print("🚀 GPU Optimizer Configuration")
    print("=" * 50)
    
    success = configure_gpu()
    
    if success:
        gpu_info = get_gpu_info()
        print("\n📊 GPU Information:")
        print(f"  Architecture: {gpu_info['architecture']}")
        print(f"  Device: {gpu_info['device_name']}")
        print(f"  Memory: {gpu_info['total_memory_gb']:.1f}GB")
        print(f"  SDPA Available: {gpu_info['sdpa_available']}")
        print(f"  Attention: {gpu_info['attention_implementation']}")
        
        memory_info = monitor_gpu_memory()
        print(f"\n💾 Memory Status:")
        print(f"  Available: {memory_info['available_gb']:.1f}GB")
        print(f"  Usage: {memory_info['usage_percent']:.1f}%")
        
        print("\n✅ GPU optimization completed successfully!")
    else:
        print("\n❌ GPU optimization failed - using CPU")

if __name__ == "__main__":
    main()

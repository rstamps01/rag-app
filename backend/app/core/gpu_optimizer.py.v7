import torch
import os

def configure_gpu():
    """Configure GPU settings for optimal performance with RTX 5090 using CUDA 12.8 and PyTorch 2.7.0"""
    if not torch.cuda.is_available():
        print("CUDA not available, using CPU")
        return False
    
    # Print GPU information
    device_count = torch.cuda.device_count()
    print(f"Found {device_count} CUDA device(s)")
    
    for i in range(device_count):
        device_name = torch.cuda.get_device_name(i)
        print(f"Device {i}: {device_name}")
        
    # Print CUDA and PyTorch versions
    print(f"CUDA Version: {torch.version.cuda}")
    print(f"PyTorch Version: {torch.__version__}")
    
    # Enable TensorFloat-32 precision for RTX 5090
    torch.set_float32_matmul_precision('high')
    
    # Enable flash attention if available
    os.environ['PYTORCH_ENABLE_MPS_FALLBACK'] = '1'
    
    # Set environment variables for better performance
    os.environ['CUDA_DEVICE_ORDER'] = 'PCI_BUS_ID'
    os.environ['CUDA_VISIBLE_DEVICES'] = '0'
    
    # Return True if GPU is available
    return True

def get_optimal_batch_size(model_name):
    """Calculate optimal batch size based on GPU memory for RTX 5090"""
    if not torch.cuda.is_available():
        return 1
    
    # RTX 5090 has substantial VRAM, adjust batch size accordingly
    gpu_memory = torch.cuda.get_device_properties(0).total_memory
    
    # Enhanced heuristic for RTX 5090
    if "gpt-j" in model_name.lower():
        return min(8, max(1, gpu_memory // (6 * 1024 * 1024 * 1024)))
    elif "llama" in model_name.lower():
        return min(4, max(1, gpu_memory // (8 * 1024 * 1024 * 1024)))
    else:
        return min(16, max(1, gpu_memory // (4 * 1024 * 1024 * 1024)))

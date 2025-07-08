import torch
import time
import gc
from contextlib import contextmanager

@contextmanager
def cuda_timer(name="Operation"):
    """Context manager for timing CUDA operations"""
    torch.cuda.synchronize()
    start = time.time()
    yield
    torch.cuda.synchronize()
    end = time.time()
    print(f"{name} took {(end - start) * 1000:.2f} ms")

def optimize_memory():
    """Optimize GPU memory usage"""
    # Clear PyTorch cache
    if torch.cuda.is_available():
        torch.cuda.empty_cache()
        gc.collect()

def create_cuda_graph(model, sample_input):
    """Create CUDA graph for faster inference"""
    if not torch.cuda.is_available():
        return None
    
    # Warmup
    for _ in range(3):
        model(**sample_input)
    
    # Create CUDA graph
    torch.cuda.synchronize()
    graph = torch.cuda.CUDAGraph()
    
    with torch.cuda.graph(graph):
        output = model(**sample_input)
    
    return graph, output

def optimize_embedding_generation(model):
    """Apply optimizations for embedding generation"""
    if not torch.cuda.is_available():
        return model
    
    # Enable torch.compile for PyTorch 2.0+
    if hasattr(torch, 'compile'):
        model = torch.compile(model, mode="reduce-overhead")
    
    return model

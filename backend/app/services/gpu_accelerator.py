import torch
import psutil
import os
import numpy as np
from typing import Dict, Any, Optional

class GPUAccelerator:
    """Service for GPU acceleration and monitoring with RTX 5090 optimizations"""
    
    def __init__(self):
        self.cuda_available = torch.cuda.is_available()
        if self.cuda_available:
            self.device = torch.device("cuda")
            self.device_properties = torch.cuda.get_device_properties(0)
            
            # Enable TensorFloat-32 for RTX 5090
            torch.set_float32_matmul_precision('high')
            
            # Check if we're running on Ada Lovelace architecture (RTX 5090)
            self.is_ada_lovelace = self._check_if_ada_lovelace()
        else:
            self.device = torch.device("cpu")
            self.device_properties = None
            self.is_ada_lovelace = False
    
    def _check_if_ada_lovelace(self) -> bool:
        """Check if GPU is Ada Lovelace architecture (RTX 5090)"""
        try:
            # RTX 5090 should have compute capability 9.x
            major = self.device_properties.major
            return major >= 9
        except:
            return False
    
    def optimize_model(self, model):
        """
        Optimize a model for GPU acceleration
        
        Args:
            model: PyTorch model or SentenceTransformer model to optimize
            
        Returns:
            Optimized model
        """
        if not self.cuda_available:
            return model
        
        try:
            # Move model to GPU if not already there
            if hasattr(model, 'to'):
                model = model.to(self.device)
            
            # Apply RTX 5090 specific optimizations
            if self.is_ada_lovelace:
                # Enable Flash Attention if available
                if hasattr(model, 'config') and hasattr(model.config, 'attn_implementation'):
                    try:
                        model.config.attn_implementation = 'flash_attention_2'
                    except:
                        pass  # Flash attention not available
                
                # Enable mixed precision for inference
                if hasattr(model, 'half'):
                    try:
                        model = model.half()  # Use FP16 for faster inference
                    except:
                        pass  # Model doesn't support half precision
            
            # Set model to evaluation mode for inference
            if hasattr(model, 'eval'):
                model.eval()
            
            # Disable gradient computation for inference
            if hasattr(model, 'requires_grad_'):
                for param in model.parameters():
                    param.requires_grad_(False)
            
            return model
            
        except Exception as e:
            print(f"Warning: Could not optimize model: {e}")
            return model
    
    def get_gpu_info(self) -> Dict[str, Any]:
        """
        Get GPU information
        
        Returns:
            Dictionary with GPU information
        """
        if not self.cuda_available:
            return {
                "available": False,
                "message": "CUDA is not available. Using CPU instead."
            }
        
        try:
            return {
                "available": True,
                "name": torch.cuda.get_device_name(0),
                "count": torch.cuda.device_count(),
                "memory": {
                    "allocated": torch.cuda.memory_allocated(0),
                    "reserved": torch.cuda.memory_reserved(0),
                    "total": self.device_properties.total_memory
                },
                "compute_capability": f"{self.device_properties.major}.{self.device_properties.minor}",
                "is_ada_lovelace": self.is_ada_lovelace,
                "tensor_cores_enabled": torch.get_float32_matmul_precision() != 'highest'
            }
        except Exception as e:
            return {
                "available": False,
                "error": str(e),
                "message": "Error getting GPU information. Using CPU instead."
            }
    
    def optimize_batch_size(self, input_size: int, max_batch_size: int = 32) -> int:
        """
        Optimize batch size based on available GPU memory
        
        Args:
            input_size: Size of each input item
            max_batch_size: Maximum batch size to consider
            
        Returns:
            Optimal batch size
        """
        if not self.cuda_available:
            return 1
        
        # Get available memory
        available_memory = self.device_properties.total_memory - torch.cuda.memory_allocated(0)
        
        # RTX 5090 has more memory, adjust calculations
        if self.is_ada_lovelace:
            # Estimate memory per item with less overhead for RTX 5090
            memory_per_item = input_size * 4 * 1.5  # Reduced overhead factor
        else:
            # Estimate memory per item (with safety factor)
            memory_per_item = input_size * 4 * 2  # Assuming float32 and 2x overhead
        
        # Calculate max possible batch size
        max_possible = available_memory // memory_per_item
        
        # Return the smaller of max_possible and max_batch_size
        return min(int(max_possible), max_batch_size)
    
    def setup_mixed_precision(self):
        """
        Set up mixed precision training/inference for RTX 5090
        
        Returns:
            GradScaler for mixed precision if available
        """
        if self.cuda_available and self.is_ada_lovelace:
            # Enable autocast for mixed precision
            return torch.amp.GradScaler('cuda')
        return None
    
    def get_system_resources(self) -> Dict[str, Any]:
        """
        Get system resource information
        
        Returns:
            Dictionary with system resource information
        """
        # Get CPU info
        cpu_info = {
            "cores": psutil.cpu_count(logical=False),
            "threads": psutil.cpu_count(logical=True),
            "usage": psutil.cpu_percent(interval=0.1)
        }
        
        # Get memory info
        memory = psutil.virtual_memory()
        memory_info = {
            "total": memory.total,
            "available": memory.available,
            "used": memory.used,
            "percent": memory.percent
        }
        
        # Get disk info
        disk = psutil.disk_usage('/')
        disk_info = {
            "total": disk.total,
            "used": disk.used,
            "free": disk.free,
            "percent": disk.percent
        }
        
        return {
            "cpu": cpu_info,
            "memory": memory_info,
            "disk": disk_info,
            "gpu": self.get_gpu_info()
        }
        
    def create_cuda_graph(self, model, sample_input):
        """
        Create CUDA graph for repeated operations (RTX 5090 optimization)
        
        Args:
            model: PyTorch model
            sample_input: Sample input for the model
            
        Returns:
            CUDA graph if available, None otherwise
        """
        if not (self.cuda_available and self.is_ada_lovelace):
            return None
            
        try:
            # Warmup
            s = torch.cuda.Stream()
            s.wait_stream(torch.cuda.current_stream())
            with torch.cuda.stream(s):
                for _ in range(3):  # warmup
                    output = model(sample_input)
            torch.cuda.current_stream().wait_stream(s)
            
            # Create graph
            g = torch.cuda.CUDAGraph()
            with torch.cuda.graph(g):
                output = model(sample_input)
                
            return g
        except Exception as e:
            print(f"Error creating CUDA graph: {e}")
            return None
    
    def clear_cache(self):
        """Clear GPU memory cache"""
        if self.cuda_available:
            torch.cuda.empty_cache()
    
    def get_memory_usage(self) -> Dict[str, int]:
        """Get current GPU memory usage"""
        if not self.cuda_available:
            return {"allocated": 0, "reserved": 0, "total": 0}
        
        return {
            "allocated": torch.cuda.memory_allocated(0),
            "reserved": torch.cuda.memory_reserved(0),
            "total": self.device_properties.total_memory if self.device_properties else 0
        }
    
    def optimize_for_inference(self, model):
        """
        Optimize model specifically for inference
        
        Args:
            model: Model to optimize
            
        Returns:
            Optimized model
        """
        if not self.cuda_available:
            return model
        
        try:
            # Move to GPU
            if hasattr(model, 'to'):
                model = model.to(self.device)
            
            # Set to eval mode
            if hasattr(model, 'eval'):
                model.eval()
            
            # Disable gradients
            if hasattr(model, 'parameters'):
                for param in model.parameters():
                    param.requires_grad_(False)
            
            # Apply torch.jit.script if possible for additional optimization
            try:
                if hasattr(torch.jit, 'script'):
                    model = torch.jit.script(model)
            except:
                pass  # JIT compilation not supported for this model
            
            return model
            
        except Exception as e:
            print(f"Warning: Could not optimize model for inference: {e}")
            return model

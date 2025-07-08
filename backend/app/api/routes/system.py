from fastapi import APIRouter, Depends, HTTPException, status
from typing import Any, Dict
import torch
import psutil
import os
from app.services.gpu_accelerator import GPUAccelerator

router = APIRouter()

# Initialize GPU accelerator with RTX 5090 optimizations
gpu_accelerator = GPUAccelerator()

@router.get("/info", response_model=Dict[str, Any])
async def get_system_info() -> Any:
    """
    Get system information including GPU status with RTX 5090 specific details.
    """
    # Get system resources with RTX 5090 optimizations
    system_info = gpu_accelerator.get_system_resources()
    
    # Get available models
    models = [
        {"id": "gpt-j-6b", "name": "GPT-J 6B", "description": "Open source 6B parameter model"},
        {"id": "llama2-7b", "name": "Llama 2 7B", "description": "Meta's 7B parameter model"},
        {"id": "falcon-7b", "name": "Falcon 7B", "description": "TII's 7B parameter model"},
        {"id": "mistral-7b", "name": "Mistral 7B", "description": "Mistral AI's 7B parameter model"}
    ]
    
    # Add RTX 5090 optimization status
    for model in models:
        model["rtx5090_optimized"] = gpu_accelerator.is_ada_lovelace
    
    # Add RTX 5090 specific information
    if gpu_accelerator.is_ada_lovelace:
        system_info["gpu"]["rtx5090_optimizations"] = {
            "tensor_cores_enabled": True,
            "mixed_precision_enabled": True,
            "flash_attention_enabled": True,
            "cuda_graphs_enabled": True,
            "memory_optimization_enabled": True
        }
    
    return {
        **system_info,
        "models": models
    }

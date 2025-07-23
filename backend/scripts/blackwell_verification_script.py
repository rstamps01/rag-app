#!/usr/bin/env python3
"""
RTX 5090 Blackwell Architecture Verification Script
"""

import torch
import sys

def verify_blackwell_detection():
    """Verify that RTX 5090 Blackwell architecture is correctly detected"""
    
    print("=== RTX 5090 Blackwell Architecture Verification ===\n")
    
    # Check CUDA availability
    if not torch.cuda.is_available():
        print("❌ CUDA is not available")
        return False
    
    print("✅ CUDA is available")
    
    # Get device properties
    device_name = torch.cuda.get_device_name(0)
    props = torch.cuda.get_device_properties(0)
    
    print(f"Device Name: {device_name}")
    print(f"Compute Capability: {props.major}.{props.minor}")
    print(f"Total Memory: {props.total_memory / 1024**3:.1f} GB")
    print(f"PyTorch Version: {torch.__version__}")
    print(f"CUDA Version: {torch.version.cuda}")
    
    # Verify RTX 5090
    is_rtx_5090 = "RTX 5090" in device_name or "5090" in device_name
    print(f"\nRTX 5090 Detection: {'✅' if is_rtx_5090 else '❌'}")
    
    # Verify Blackwell architecture (compute capability 12.x)
    is_blackwell = props.major == 12
    print(f"Blackwell Architecture: {'✅' if is_blackwell else '❌'}")
    
    if not is_blackwell:
        print(f"⚠️  Expected compute capability 12.x for Blackwell, got {props.major}.{props.minor}")
        
        # Identify actual architecture
        if props.major == 8 and props.minor == 9:
            print("   Detected: Ada Lovelace (RTX 40-series)")
        elif props.major == 8 and props.minor == 6:
            print("   Detected: Ampere (RTX 30-series)")
        elif props.major == 7 and props.minor == 5:
            print("   Detected: Turing (RTX 20-series)")
        else:
            print(f"   Detected: Unknown architecture")
    
    # Check for potential issues
    print("\n=== Potential Issues ===")
    
    # PyTorch version check
    pytorch_version = torch.__version__
    if pytorch_version < "2.7.0":
        print(f"⚠️  PyTorch {pytorch_version} may not fully support Blackwell")
        print("   Recommended: PyTorch 2.7.0+")
    else:
        print(f"✅ PyTorch {pytorch_version} supports Blackwell")
    
    # CUDA version check
    cuda_version = torch.version.cuda
    if cuda_version < "12.8":
        print(f"⚠️  CUDA {cuda_version} may not fully support Blackwell")
        print("   Recommended: CUDA 12.8+")
    else:
        print(f"✅ CUDA {cuda_version} supports Blackwell")
    
    # Memory check
    memory_gb = props.total_memory / 1024**3
    if memory_gb < 30:
        print(f"⚠️  Expected ~32GB for RTX 5090, detected {memory_gb:.1f}GB")
    else:
        print(f"✅ Memory capacity: {memory_gb:.1f}GB")
    
    # Overall assessment
    print("\n=== Assessment ===")
    if is_rtx_5090 and is_blackwell:
        print("✅ RTX 5090 with Blackwell architecture correctly detected")
        print("   All optimizations should work properly")
        return True
    else:
        print("❌ RTX 5090 Blackwell detection failed")
        print("   GPU optimizations may be suboptimal")
        return False

if __name__ == "__main__":
    success = verify_blackwell_detection()
    sys.exit(0 if success else 1)
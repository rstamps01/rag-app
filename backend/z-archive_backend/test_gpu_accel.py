# test_gpu_accelerator.py
from app.services.gpu_accelerator import GPUAccelerator

gpu_accelerator = GPUAccelerator()
print("✅ GPUAccelerator initialized successfully")

# Test optimize_model method exists
if hasattr(gpu_accelerator, 'optimize_model'):
    print("✅ optimize_model method available")
else:
    print("❌ optimize_model method missing")

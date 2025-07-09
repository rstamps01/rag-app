# test_gpu_optimization.py
from app.services.gpu_accelerator import GPUAccelerator
from sentence_transformers import SentenceTransformer

gpu_accelerator = GPUAccelerator()
model = SentenceTransformer('all-MiniLM-L6-v2')

try:
    optimized_model = gpu_accelerator.optimize_model(model)
    print("✅ Model optimization successful")
    print(f"Model device: {next(optimized_model.parameters()).device}")
except Exception as e:
    print(f"❌ Optimization failed: {e}")

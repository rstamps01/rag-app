# Production Cache Initialization Dockerfile
FROM nvidia/cuda:12.8.0-runtime-ubuntu22.04 AS base

# Metadata
LABEL maintainer="RAG Application Team"
LABEL version="1.0.0"
LABEL description="Production cache initialization for RAG application"

WORKDIR /app

# Environment configuration
ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    CUDA_VISIBLE_DEVICES=0 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies with Python symlink
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-dev \
    python3-venv \
    build-essential \
    tesseract-ocr \
    tesseract-ocr-eng \
    libpq-dev \
    curl \
    wget \
    git \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create Python symlinks conditionally (FIXED: Check if symlink exists first)
RUN if [ ! -f /usr/bin/python ]; then ln -s /usr/bin/python3 /usr/bin/python; fi
RUN if [ ! -f /usr/bin/pip ]; then ln -s /usr/bin/pip3 /usr/bin/pip; fi

# Verify Python installation
RUN python --version && pip --version

# Upgrade pip and install wheel
RUN python -m pip install --upgrade pip setuptools wheel

# Install NVIDIA CUDA libraries for RTX 5090
RUN pip install --no-cache-dir \
    nvidia-cublas-cu12==12.8.4.1 \
    nvidia-cuda-cupti-cu12==12.8.90 \
    nvidia-cuda-nvrtc-cu12==12.8.93 \
    nvidia-cuda-runtime-cu12==12.8.90 \
    nvidia-cudnn-cu12==9.10.2.21 \
    nvidia-cufft-cu12==11.3.3.83 \
    nvidia-cufile-cu12==1.13.1.3 \
    nvidia-curand-cu12==10.3.9.90 \
    nvidia-cusolver-cu12==11.7.3.90 \
    nvidia-cusparse-cu12==12.5.8.93 \
    nvidia-cusparselt-cu12==0.7.1 \
    nvidia-nccl-cu12==2.27.3 \
    nvidia-nvjitlink-cu12==12.8.93 \
    nvidia-nvshmem-cu12==3.3.9 \
    nvidia-nvtx-cu12==12.8.90 \
    pillow==11.2.1 \
    --index-url https://download.pytorch.org/whl/nightly/cu128

# Install PyTorch with CUDA 12.8 support for RTX 5090
RUN pip install --no-cache-dir \
    torch==2.9.0.dev20250708+cu128 \
    torchvision==0.24.0.dev20250708+cu128 \
    pytorch-triton==3.4.0+gitae848267 \
    --index-url https://download.pytorch.org/whl/nightly/cu128

# Copy requirements and install Python dependencies
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create necessary directories with proper permissions
RUN mkdir -p /app/models_cache \
             /app/scripts \
             /app/logs \
             /app/config \
             /app/data/logs \
             /app/data/uploads \
    && chmod 755 /app/models_cache \
    && chmod 755 /app/logs

# Copy application files
COPY scripts/model_cache_utils.py /app/scripts/
COPY scripts/initialize_model_cache.py /app/scripts/
#COPY scripts/start.sh /app/scripts/

# Create cache config file if it doesn't exist (FIXED: Handle missing config file)
RUN if [ ! -f config/cache_config.json ]; then \
    echo '{"cache_dir": "/app/models_cache", "models": ["sentence-transformers/all-MiniLM-L6-v2", "mistralai/Mistral-7B-Instruct-v0.2"], "settings": {"validate_on_startup": true, "create_completion_marker": true}}' > /app/config/cache_config.json; \
    fi

    # Validate configuration file
RUN python -m json.tool /app/config/cache_config.json > /dev/null || (echo "ERROR: Invalid JSON in cache_config.json"; exit 1)

# Set proper permissions
RUN chmod +x /app/scripts/*.py
#RUN chmod +x /app/scripts/start.sh
RUN chown -R root:root /app
RUN chmod -R 755 /app

# Set up cache environment variables
ENV MODELS_CACHE_DIR=/app/models_cache \
    HF_HUB_CACHE=/app/models_cache/hub \
    HF_HOME=/app/models_cache \
    TORCH_HOME=/app/models_cache/torch
    #HF_DATASETS_CACHE=/app/models_cache/datasets \
    #TRANSFORMERS_CACHE=/app/models_cache/transformers

# Health check script
COPY <<EOF /app/healthcheck.py
#!/usr/bin/env python3
import sys
import os
from pathlib import Path

def health_check():
    try:
        # Check Python
        import torch
        
        # Check cache directory
        cache_dir = Path(os.environ.get('HF_HOME', '/app/models_cache'))
        if not cache_dir.exists():
            return 1
            
        # Check if initialization completed
        status_file = cache_dir / 'initialization_status.json'
        if status_file.exists():
            import json
            with open(status_file) as f:
                status = json.load(f)
            if status.get('status', {}).get('initialization_completed'):
                return 0
        
        return 1
    except Exception:
        return 1

if __name__ == "__main__":
    sys.exit(health_check())
EOF

RUN chmod +x /app/healthcheck.py

# === Application Code ===
# Copy the entire application code into the container.
# This includes the core logic, API routes (including monitoring), etc.
COPY app/ ./app/

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=3 \
    CMD python /app/healthcheck.py

# Expose port for monitoring
EXPOSE 8000

# Default command
# CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
CMD ["python", "/app/scripts/initialize_model_cache.py"]
# CMD ["/app/scripts/start.sh"]
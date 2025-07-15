# File Path: /home/vastdata/rag-app/backend/Dockerfile
# Description: Dockerfile for the RAG application backend service.

# === Base Image ===
# Use NVIDIA CUDA 12.8 runtime image on Ubuntu 22.04 for RTX 5090 compatibility.
FROM nvidia/cuda:12.8.0-runtime-ubuntu22.04

# === Working Directory ===
WORKDIR /app

# === System Dependencies ===
# Install system dependencies
# NOTE - Added --no-install-recommends as seen in rag-app-05
# This reduces the size of the image by not installing unnecessary packages.
# It is important to keep the image size small for faster deployments and better performance.
# The packages installed here are essential for running Python, building Python packages, and OCR functionality.
# The tesseract-ocr package is used for Optical Character Recognition (OCR) tasks.
# The libpq-dev package is required for PostgreSQL database connectivity.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    tesseract-ocr \
    tesseract-ocr-eng \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Install Python packages listed in requirements.txt.
# RUN pip3 install --no-cache-dir -r requirements.txt
# RUN pip3 install -r requirements.txt

# === PyTorch Installation for CUDA 12.8 ===
# === Upddated Pytorch Installation for CUDA 12.8 - July 8, 2025 ===
# Install PyTorch and torchvision compatible with CUDA 12.8. #   Removed torchaudio==2.8.0.dev20250708+cu128
# This is done separately to ensure the correct CUDA version is used.
RUN pip3 install --no-cache-dir \
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
    --index-url https://download.pytorch.org/whl/nightly/cu128

RUN pip3 install --no-cache-dir \
    torch==2.9.0.dev20250708+cu128 \
    torchvision==0.24.0.dev20250708+cu128 \
    pytorch-triton==3.4.0+gitae848267 \
    --index-url https://download.pytorch.org/whl/nightly/cu128

# RUN pip3 install --no-cache-dir \
#     pillow==11.2.1 \
#     --index-url https://download.pytorch.org/whl/nightly/cu128
# === Python Dependencies ===
# Copy only the requirements file first to leverage Docker cache.
COPY requirements.txt .

# Install Python packages listed in requirements.txt.
RUN pip3 install --no-cache-dir -r requirements.txt

# === Pre-download Models ===
# Accept Hugging Face token as a build argument
# ARG HUGGINGFACE_TOKEN
ARG HUGGING_FACE_HUB_TOKEN
ENV HUGGING_FACE_HUB_TOKEN=${HUGGING_FACE_HUB_TOKEN}

# Create necessary directories
RUN mkdir -p /app/data/uploads /app/data/logs /app/models_cache

# Copy and run the script to download models during build time.
# COPY download_models.py .
# RUN python3 download_models.py

#### Potential Change to Local
ENV TRANSFORMERS_CACHE=/app/models_cache
COPY models_cache/ /app/models_cache

# === Application Code ===
# Copy the entire application code into the container.
# This includes the core logic, API routes (including monitoring), etc.
COPY app/ ./app/

# === Port Exposure ===
# Expose the port the FastAPI application will run on.
EXPOSE 8000

# === Run Command ===
# Command to start the Uvicorn server for the FastAPI application.
# Runs on all interfaces (0.0.0.0) inside the container.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
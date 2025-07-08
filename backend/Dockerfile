# File Path: /home/vastdata/rag-app/backend/Dockerfile
# Description: Dockerfile for the RAG application backend service.

# === Base Image ===
# Use NVIDIA CUDA 12.8 runtime image on Ubuntu 22.04 for RTX 5090 compatibility.
FROM nvidia/cuda:12.8.0-runtime-ubuntu22.04

# === Working Directory ===
WORKDIR /app

# === System Dependencies ===
# Install essential build tools, Python, pip, and git.
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    git \
    curl \
    && rm -rf /var/lib/apt/lists/*

# === Python Dependencies ===
# Copy only the requirements file first to leverage Docker cache.
COPY requirements.txt .
# Install Python packages listed in requirements.txt.
RUN pip3 install --no-cache-dir -r requirements.txt

# === PyTorch Installation for CUDA 12.8 ===
# Install PyTorch 2.7.0, torchvision, and torchaudio compatible with CUDA 12.8.
# This is done separately to ensure the correct CUDA version is used.
# RUN pip3 install --pre torch torchvision torchaudio --index-url https://download.pytorch.org/whl/nightly/cu128
# RUN pip3 install \
#    torch==2.8.0.dev20250504+cu128 \
#    torchvision==0.22.0.dev20250504+cu128 \
#    pytorch-triton==3.3.0+git96316ce5 \
#    nvidia-cublas-cu12==12.8.3.14 \
#    nvidia-cuda-cupti-cu12==12.8.57 \
#    nvidia-cuda-nvrtc-cu12==12.8.61 \
#    nvidia-cuda-runtime-cu12==12.8.57 \
#    nvidia-cudnn-cu12==9.8.0.87 \
#    nvidia-cufft-cu12==11.3.3.41 \
#    nvidia-cufile-cu12==1.13.0.11 \
#    nvidia-curand-cu12==10.3.9.55 \
#    nvidia-cusolver-cu12==11.7.2.55 \
#    nvidia-cusparse-cu12==12.5.7.53 \
#    nvidia-nvjitlink-cu12==12.8.61 \
#    nvidia-nvtx-cu12==12.8.55 \
#    --index-url https://download.pytorch.org/whl/nightly/cu128

# === Upddated Pytorch Installation for CUDA 12.8 - July 8, 2025 ===

RUN pip3 install \
    torch==2.9.0.dev20250708+cu128 \
    torchvision==0.24.0.dev20250708+cu128 \
    torchaudio==2.8.0.dev20250708+cu128 \
    pytorch-triton==3.4.0+gitae848267 \
    nvidia-cublas-cu12== \
    torch-2.9.0.dev20250708+cu128 \
    torchaudio-2.8.0.dev20250708+cu128 \
    torchvision-0.24.0.dev20250708+cu128 \
    pytorch-triton-3.4.0+gitae848267 \
    nvidia-cublas-cu12-12.8.4.1 \
    nvidia-cuda-cupti-cu12-12.8.90 \
    nvidia-cuda-nvrtc-cu12-12.8.93 \
    nvidia-cuda-runtime-cu12-12.8.90 \
    nvidia-cudnn-cu12-9.10.2.21 \
    nvidia-cufft-cu12-11.3.3.83 \
    nvidia-cufile-cu12-1.13.1.3 \
    nvidia-curand-cu12-10.3.9.90 \
    nvidia-cusolver-cu12-11.7.3.90 \
    nvidia-cusparse-cu12-12.5.8.93 \
    nvidia-cusparselt-cu12-0.7.1 \
    nvidia-nccl-cu12-2.27.3 \
    nvidia-nvjitlink-cu12-12.8.93 \
    nvidia-nvshmem-cu12-3.3.9 \
    nvidia-nvtx-cu12-12.8.90 \
    pillow-11.2.1 \
    --index-url https://download.pytorch.org/whl/nightly/cu128

# === Pre-download Models ===
# Accept Hugging Face token as a build argument
ARG HUGGING_FACE_HUB_TOKEN
# Set the token as an environment variable for the download script
ENV HUGGING_FACE_HUB_TOKEN=${HUGGING_FACE_HUB_TOKEN}

# Copy and run the script to download models during build time.
COPY download_models.py .
RUN python3 download_models.py

# === Application Code ===
# Copy the entire application code into the container.
# This includes the core logic, API routes (including monitoring), etc.
COPY app/ ./app/

# === Environment Variables ===
# Set the Python path so modules can be imported correctly.
ENV PYTHONPATH=/app
# Ensure Python output is sent straight to terminal without buffering.
ENV PYTHONUNBUFFERED=1

# === Port Exposure ===
# Expose the port the FastAPI application will run on.
EXPOSE 8000

# === Run Command ===
# Command to start the Uvicorn server for the FastAPI application.
# Runs on all interfaces (0.0.0.0) inside the container.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

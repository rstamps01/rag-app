# Production Backend Dockerfile for RAG Application
FROM nvidia/cuda:12.8.0-runtime-ubuntu22.04

LABEL maintainer="RAG Application Team"
LABEL version="1.0.0"
LABEL description="Production backend for RAG application"

WORKDIR /app

ENV DEBIAN_FRONTEND=noninteractive \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app \
    CUDA_VISIBLE_DEVICES=0 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

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

RUN if [ ! -f /usr/bin/python ]; then ln -s /usr/bin/python3 /usr/bin/python; fi && \
    if [ ! -f /usr/bin/pip ]; then ln -s /usr/bin/pip3 /usr/bin/pip; fi

RUN python -m pip install --upgrade pip setuptools wheel

RUN pip3 install --no-cache-dir pillow==11.2.1
RUN pip3 install torch torchvision --index-url https://download.pytorch.org/whl/cu129
RUN pip3 install pytorch-triton --index-url https://download.pytorch.org/whl/nightly/cu129

COPY requirements.txt .
COPY alembic.ini .
RUN pip install --no-cache-dir -r requirements.txt

RUN mkdir -p /app/models_cache /app/scripts /app/logs /app/config \
             /app/data/logs /app/data/uploads /tmp/triton_cache \
    && chmod 755 /app/models_cache /app/logs

COPY scripts/ /app/scripts/
RUN chmod +x /app/scripts/*.py 2>/dev/null || true

RUN if [ ! -f /app/config/cache_config.json ]; then \
    echo '{"cache_dir": "/app/models_cache", "models": ["sentence-transformers/all-MiniLM-L6-v2", "mistralai/Mistral-7B-Instruct-v0.2"]}' > /app/config/cache_config.json; \
    fi

ENV MODELS_CACHE_DIR=/app/models_cache \
    HF_HUB_CACHE=/app/models_cache/hub \
    HF_HOME=/app/models_cache \
    TORCH_HOME=/app/models_cache/torch \
    TRITON_CACHE_DIR=/tmp/triton_cache

COPY app/ ./app/

HEALTHCHECK --interval=30s --timeout=10s --start-period=120s --retries=5 \
    CMD curl -f http://localhost:8000/health || exit 1

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

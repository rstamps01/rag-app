#!/bin/bash
set -e

# Initialize model cache first
# python /app/scripts/initialize_model_cache.py

# Then start the uvicorn server
# exec uvicorn app.main:app --host 0.0.0.0 --port 8000
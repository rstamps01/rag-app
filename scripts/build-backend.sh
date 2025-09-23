#!/bin/bash

# Fast backend build script
set -e

echo "🚀 Building backend with optimizations..."

# Build base image (only when needed)
if [ "$1" = "--rebuild-base" ] || [ ! "$(docker images -q rag-app-07-backend-base:latest)" ]; then
    echo "📦 Building base image with ML dependencies..."
    docker build -f backend/Dockerfile.base -t rag-app-07-backend-base:latest .
    echo "✅ Base image built"
else
    echo "♻️  Using existing base image"
fi

# Build optimized backend
echo "🔨 Building optimized backend..."
docker build -f backend/Dockerfile.optimized -t rag-app-07-backend-07:latest .

echo "✅ Backend build complete!"

# Optional: Clean up intermediate images
if [ "$2" = "--clean" ]; then
    echo "🧹 Cleaning up intermediate images..."
    docker image prune -f
fi

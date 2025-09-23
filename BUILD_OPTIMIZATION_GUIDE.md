# 🚀 Build Optimization Guide

## Overview
This guide explains how to use the staged build approach to significantly reduce backend build times from 8+ minutes to 2-3 minutes.

## 🏗️ **Staged Build Architecture**

### Base Image (Dockerfile.base)
- Contains all heavy ML dependencies (PyTorch, Transformers, etc.)
- Built once and reused across multiple builds
- ~2-3 minutes to build initially, then cached

### Optimized Image (Dockerfile.optimized)
- Uses pre-built base image
- Only installs application-specific dependencies
- ~30-60 seconds to build

## 🚀 **Quick Start**

### 1. First Time Setup
```bash
# Build base image with ML dependencies (one-time)
./scripts/build-backend.sh --rebuild-base

# Build optimized backend
./scripts/build-backend.sh
```

### 2. Subsequent Builds
```bash
# Much faster - uses cached base image
./scripts/build-backend.sh
```

### 3. Development Mode
```bash
# Hot reloading for development
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up backend-07
```

## 📋 **Available Scripts**

### `scripts/build-backend.sh`
- **Purpose**: Fast backend builds using staged approach
- **Options**:
  - `--rebuild-base`: Force rebuild base image
  - `--clean`: Clean up intermediate images after build

### `docker-compose.dev.yml`
- **Purpose**: Development configuration with hot reloading
- **Features**:
  - Source code mounting for live updates
  - Automatic reload on code changes
  - Faster development cycle

## ⚡ **Build Time Comparison**

| Method | First Build | Subsequent Builds | Use Case |
|--------|-------------|-------------------|----------|
| **Standard** | 8-12 minutes | 8-12 minutes | Production |
| **Staged** | 5-6 minutes | 30-60 seconds | Development |
| **Dev Mode** | 2-3 minutes | 10-20 seconds | Active Development |

## 🔧 **Advanced Optimizations**

### 1. Docker BuildKit
```bash
export DOCKER_BUILDKIT=1
docker build --build-arg BUILDKIT_INLINE_CACHE=1 -t rag-app-07-backend-07 .
```

### 2. Registry Caching
```bash
# Push base image to registry
docker tag rag-app-07-backend-base:latest your-registry/rag-app-07-backend-base:latest
docker push your-registry/rag-app-07-backend-base:latest

# Pull base image instead of building
docker pull your-registry/rag-app-07-backend-base:latest
```

### 3. Multi-Architecture Builds
```bash
# Build for multiple architectures
docker buildx build --platform linux/amd64,linux/arm64 -t rag-app-07-backend-07 .
```

## 🐛 **Troubleshooting**

### Base Image Issues
```bash
# Check if base image exists
docker images | grep rag-app-07-backend-base

# Rebuild base image if corrupted
./scripts/build-backend.sh --rebuild-base
```

### Cache Issues
```bash
# Clear Docker build cache
docker builder prune -a

# Rebuild everything from scratch
./scripts/build-backend.sh --rebuild-base --clean
```

### Development Issues
```bash
# Check if dev mode is working
docker-compose -f docker-compose.dev.yml config

# Restart dev environment
docker-compose -f docker-compose.dev.yml down
docker-compose -f docker-compose.dev.yml up backend-07
```

## 📊 **Performance Tips**

1. **Use .dockerignore**: Exclude unnecessary files from build context
2. **Layer Caching**: Order Dockerfile commands from least to most frequently changing
3. **Multi-stage Builds**: Separate build and runtime environments
4. **Registry Caching**: Use private registry for base images
5. **Parallel Builds**: Build multiple services simultaneously

## 🎯 **Best Practices**

- Always use staged builds for development
- Keep base image updated with security patches
- Use development mode for active coding
- Clean up unused images regularly
- Monitor build times and optimize accordingly

## 📈 **Expected Results**

- **First build**: 5-6 minutes (vs 8-12 minutes)
- **Subsequent builds**: 30-60 seconds (vs 8-12 minutes)
- **Development mode**: 10-20 seconds (vs 8-12 minutes)
- **Overall improvement**: 80-90% faster builds

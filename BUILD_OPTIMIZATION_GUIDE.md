# 🚀 Build Optimization Guide

## Overview
This guide explains how to use the staged build approach to significantly reduce backend build times from 8+ minutes to 2-3 minutes.

## 🏗️ **Staged Build Architecture**

### Base Image (Dockerfile.base)
**Purpose**: Contains heavy, stable dependencies that rarely change
**What it includes**:
- **System Dependencies**: Python 3, build tools, system libraries
- **Heavy ML Libraries**: PyTorch, CUDA support, Transformers, Sentence-Transformers
- **Core ML Dependencies**: NumPy, Pandas, SciPy, Qdrant client
- **Python Symlinks**: `python` → `python3`, `pip` → `pip3`

**Size**: ~3-4 GB (mostly ML libraries)
**Build Time**: ~4 minutes (first time only)
**When it changes**: Rarely - only when ML library versions change

### Optimized Image (Dockerfile.optimized)
**Purpose**: Contains application-specific code and dependencies
**What it includes**:
- **Application Code**: Your RAG app source code (`/app/`)
- **Web Framework**: FastAPI, Uvicorn, WebSockets
- **Database Libraries**: SQLAlchemy, Alembic, PostgreSQL drivers
- **Document Processing**: PyPDF2, python-docx, pytesseract
- **Development Tools**: pytest, black, flake8
- **Configuration**: Environment files, scripts, health checks

**Size**: ~500MB-1GB (mostly application code)
**Build Time**: ~30 seconds (uses cached base image)
**When it changes**: Frequently - every code change

## 🔄 **Functional Workflow**

```
Code Change Made?
├── Application Code → Build Optimized Image Only (30s)
├── ML Libraries → Rebuild Base Image + Optimized (4-5min)
├── System Dependencies → Rebuild Base Image + Optimized (4-5min)
└── Development → Use Hot Reload Mode (instant updates)
```

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
# Hot reloading for development (detached mode)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d backend-07

# To stop development mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
```

### 4. Quick Reference - Common Commands
```bash
# Normal code changes
./scripts/build-backend.sh

# Docker cache issues (code not updated)
docker rmi rag-app-07-backend-07:latest && docker-compose down backend-07 && docker-compose up -d backend-07

# ML library updates
./scripts/build-backend.sh --rebuild-base

# Complete clean build
docker system prune -f && ./scripts/build-backend.sh --rebuild-base
```

## 📋 **Detailed Usage Scenarios**

### **Scenario 1: First Time Setup**
**When**: Setting up the project for the first time
**What happens**: Downloads and installs all ML dependencies
**Time**: ~4-5 minutes
```bash
# Build everything from scratch
./scripts/build-backend.sh --rebuild-base
```

### **Scenario 2: Code Changes (Most Common)**
**When**: Making changes to application code, API routes, or configuration
**What happens**: Only rebuilds optimized image using cached base
**Time**: ~30 seconds
```bash
# Fast rebuild for code changes
./scripts/build-backend.sh
```

### **Scenario 3: ML Library Updates**
**When**: Updating PyTorch, Transformers, or other ML dependencies
**What happens**: Rebuilds base image with new ML libraries
**Time**: ~4-5 minutes
```bash
# Rebuild base image with updated ML libraries
./scripts/build-backend.sh --rebuild-base
```

### **Scenario 4: System Dependency Changes**
**When**: Updating Python version, CUDA, or system libraries
**What happens**: Rebuilds base image with new system dependencies
**Time**: ~4-5 minutes
```bash
# Rebuild base image with updated system dependencies
./scripts/build-backend.sh --rebuild-base
```

### **Scenario 5: Development with Hot Reload**
**When**: Active development with frequent code changes
**What happens**: Mounts source code for instant updates
**Time**: ~30 seconds initial + instant updates
```bash
# Development mode with hot reload (detached)
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d backend-07

# To stop development mode
docker-compose -f docker-compose.yml -f docker-compose.dev.yml down
```

### **Scenario 6: Clean Build (Troubleshooting)**
**When**: Encountering build issues or wanting a completely fresh build
**What happens**: Rebuilds everything from scratch
**Time**: ~4-5 minutes
```bash
# Clean build - removes all cached layers
docker system prune -f
./scripts/build-backend.sh --rebuild-base
```

### **Scenario 7: Refresh Optimized Build (Docker Cache Issues)**
**When**: Docker cache prevents new code from being included in optimized build
**What happens**: Forces rebuild of optimized image with latest code
**Time**: ~30 seconds
```bash
# Remove old optimized image
docker rmi rag-app-07-backend-07:latest

# Stop and restart backend service
docker-compose down backend-07
docker-compose up -d backend-07
```

### **Scenario 8: CI/CD Pipeline**
**When**: Automated builds in CI/CD
**What happens**: Uses cached base image, builds optimized image
**Time**: ~30 seconds
```bash
# CI/CD build (assumes base image exists)
./scripts/build-backend.sh
```

## 🎯 **Decision Tree: Which Command to Use?**

```
Code Change Made?
├── Yes → Application code/API/config?
│   ├── Yes → ./scripts/build-backend.sh
│   └── No → ML libraries/system deps?
│       ├── Yes → ./scripts/build-backend.sh --rebuild-base
│       └── No → ./scripts/build-backend.sh
├── No → Development mode?
│   ├── Yes → docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d backend-07
│   └── No → ./scripts/build-backend.sh
├── Docker cache issues?
│   ├── Yes → docker rmi rag-app-07-backend-07:latest && docker-compose down backend-07 && docker-compose up -d backend-07
│   └── No → ./scripts/build-backend.sh
└── Build issues?
    └── Yes → docker system prune -f && ./scripts/build-backend.sh --rebuild-base
```

## 💡 **Practical Examples**

### **Example 1: Daily Development**
**Situation**: You're working on the admin panel and make 10 code changes
```bash
# First change
./scripts/build-backend.sh  # 30 seconds

# Second change  
./scripts/build-backend.sh  # 30 seconds

# ... 8 more changes
./scripts/build-backend.sh  # 30 seconds each

# Total time: 10 × 30s = 5 minutes
# vs Full rebuild: 10 × 8min = 80 minutes
# Time saved: 75 minutes (94% faster!)
```

### **Example 2: ML Library Update**
**Situation**: Updating Transformers from 4.53.2 to 4.56.1
```bash
# Update requirements.txt
echo "transformers==4.56.1" >> backend/requirements.txt

# Rebuild base image with new version
./scripts/build-backend.sh --rebuild-base  # 4-5 minutes

# All subsequent builds use new base
./scripts/build-backend.sh  # 30 seconds
```

### **Example 3: CI/CD Pipeline**
**Situation**: Automated build in GitHub Actions
```yaml
# .github/workflows/build.yml
- name: Build Backend
  run: ./scripts/build-backend.sh  # 30 seconds
  # Assumes base image is cached or pulled from registry
```

### **Example 4: Docker Cache Issues**
**Situation**: Code changes not appearing in container despite successful build
```bash
# Normal build (but code not updated in container)
./scripts/build-backend.sh  # 30 seconds

# Check if code is in container
docker exec backend-07 ls -la /app/app/api/routes/ | grep collection_management
# Result: File not found (Docker cache issue)

# Refresh optimized build
docker rmi rag-app-07-backend-07:latest
docker-compose down backend-07
docker-compose up -d backend-07  # 30 seconds

# Verify code is now in container
docker exec backend-07 ls -la /app/app/api/routes/ | grep collection_management
# Result: collection_management.py found ✅
```

### **Example 5: Team Onboarding**
**Situation**: New developer joining the project
```bash
# First time setup
git clone <repository>
cd rag-app-07
./scripts/build-backend.sh --rebuild-base  # 4-5 minutes

# Ready to develop!
./scripts/build-backend.sh  # 30 seconds for any changes
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

### Docker Cache Issues (Code Not Updated)
```bash
# Check if code is in container
docker exec backend-07 ls -la /app/app/api/routes/ | grep your_new_file

# If file not found, refresh optimized build
docker rmi rag-app-07-backend-07:latest
docker-compose down backend-07
docker-compose up -d backend-07

# Verify code is now in container
docker exec backend-07 ls -la /app/app/api/routes/ | grep your_new_file
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

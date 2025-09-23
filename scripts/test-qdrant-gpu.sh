#!/bin/bash

# Test Qdrant GPU functionality
echo "🔍 Testing Qdrant GPU functionality..."

# Check if Qdrant is running
if ! curl -s http://localhost:6333/health > /dev/null; then
    echo "❌ Qdrant is not running. Please start it first with:"
    echo "   docker-compose up -d qdrant-07"
    exit 1
fi

echo "✅ Qdrant is running"

# Check GPU indexing status
echo "🔍 Checking GPU indexing configuration..."
GPU_STATUS=$(curl -s http://localhost:6333/cluster | jq -r '.result.gpu_indexing // "not configured"')

if [ "$GPU_STATUS" = "true" ]; then
    echo "✅ GPU indexing is enabled"
elif [ "$GPU_STATUS" = "false" ]; then
    echo "⚠️  GPU indexing is disabled"
else
    echo "❓ GPU indexing status: $GPU_STATUS"
fi

# Check Qdrant logs for GPU device detection
echo "🔍 Checking Qdrant GPU device detection..."
echo "📋 Recent GPU-related logs:"
docker logs qdrant-07 2>&1 | grep -i "gpu\|device" | tail -5

# Check if NVIDIA runtime is available
echo "🔍 Checking NVIDIA runtime availability..."
if docker info | grep -q "nvidia"; then
    echo "✅ NVIDIA runtime is available"
else
    echo "⚠️  NVIDIA runtime not detected. Make sure Docker is configured with NVIDIA support."
fi

# Check Qdrant container GPU access
echo "🔍 Checking Qdrant container GPU access..."
if docker exec qdrant-07 nvidia-smi > /dev/null 2>&1; then
    echo "✅ Qdrant container has GPU access"
    echo "📊 GPU Information:"
    docker exec qdrant-07 nvidia-smi --query-gpu=name,memory.total,memory.used --format=csv,noheader,nounits
else
    echo "❌ Qdrant container does not have GPU access"
    echo "   Make sure to restart Qdrant with: docker-compose restart qdrant-07"
fi

echo "🏁 GPU test completed"

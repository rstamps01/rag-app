#!/bin/bash

# Monitor shared GPU usage for RAG application
echo "🖥️  Shared GPU Monitoring for RAG Application"
echo "=============================================="

# Check overall GPU status
echo "📊 Overall GPU Status:"
nvidia-smi --query-gpu=name,memory.total,memory.used,memory.free,utilization.gpu,utilization.memory,temperature.gpu --format=csv,noheader,nounits | while read line; do
    echo "  GPU: $line"
done

echo ""

# Check Docker containers using GPU
echo "🐳 Docker Containers Using GPU:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Image}}" | grep -E "(qdrant-07|backend-07)" || echo "  No RAG containers found"

echo ""

# Check Qdrant GPU status
echo "🔍 Qdrant GPU Status:"
if curl -s http://localhost:6333/health > /dev/null; then
    echo "  ✅ Qdrant is running"
    
    # Check Qdrant logs for GPU usage
    echo "  📋 Recent GPU activity in Qdrant:"
    docker logs qdrant-07 2>&1 | grep -i "gpu\|device" | tail -3 | sed 's/^/    /'
    
    # Check if GPU indexing is working
    GPU_LOGS=$(docker logs qdrant-07 2>&1 | grep -i "nvidia\|gpu.*device" | wc -l)
    if [ "$GPU_LOGS" -gt 0 ]; then
        echo "  ✅ GPU indexing appears to be active"
    else
        echo "  ⚠️  No GPU indexing activity detected"
    fi
else
    echo "  ❌ Qdrant is not running"
fi

echo ""

# Check Backend GPU status
echo "🔍 Backend GPU Status:"
if docker ps | grep -q "backend-07"; then
    echo "  ✅ Backend is running"
    
    # Check if backend can access GPU
    if docker exec backend-07 nvidia-smi > /dev/null 2>&1; then
        echo "  ✅ Backend has GPU access"
    else
        echo "  ❌ Backend does not have GPU access"
    fi
else
    echo "  ❌ Backend is not running"
fi

echo ""

# Memory usage breakdown
echo "💾 Memory Usage Breakdown:"
echo "  GPU Memory:"
nvidia-smi --query-gpu=memory.used,memory.total --format=csv,noheader,nounits | while read used total; do
    percentage=$((used * 100 / total))
    echo "    Used: ${used}MB / ${total}MB (${percentage}%)"
done

echo ""

# Recommendations for shared GPU
echo "💡 Shared GPU Recommendations:"
echo "  • Monitor GPU memory usage to avoid conflicts"
echo "  • Consider using GPU memory limits if needed"
echo "  • Qdrant GPU indexing is configured conservatively (groups_count=256)"
echo "  • Backend and Qdrant will share the same GPU resources"
echo "  • Use 'nvidia-smi' to monitor real-time GPU usage"

echo ""
echo "🔄 Run this script periodically to monitor shared GPU usage"

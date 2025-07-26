#!/bin/bash

# Emergency Fix Script for Container Reboot Loop
# This script fixes the deeper import issue in security.py

echo "🚨 EMERGENCY FIX: Breaking Container Reboot Loop"
echo "================================================"

# Step 1: Stop the reboot loop immediately
echo "🛑 Step 1: Stopping reboot loop..."
docker-compose down --remove-orphans
docker stop backend-07 2>/dev/null || true
docker rm backend-07 2>/dev/null || true

# Step 2: Navigate to project directory
echo "📁 Step 2: Navigating to project directory..."
cd ~/rag-app-07 || { echo "❌ Project directory not found"; exit 1; }

# Step 3: Fix the deeper import issue in security.py
echo "🔧 Step 3: Fixing security.py import issue..."
if [ -f "backend/app/core/security.py" ]; then
    echo "   Found security.py, fixing import..."
    sed -i 's/from core\.config import settings/from app.core.config import settings/g' backend/app/core/security.py
    echo "   ✅ Fixed security.py import"
else
    echo "   ❌ security.py not found"
fi

# Step 4: Fix ALL core imports in the entire backend
echo "🔧 Step 4: Fixing ALL core imports in backend..."
find backend -name "*.py" -type f -exec grep -l "from core\." {} \; | while read file; do
    echo "   Fixing imports in: $file"
    sed -i 's/from core\./from app.core./g' "$file"
done

# Step 5: Verify the fixes
echo "🔍 Step 5: Verifying fixes..."
echo "   Checking for remaining 'from core.' imports:"
remaining=$(find backend -name "*.py" -type f -exec grep -l "from core\." {} \; 2>/dev/null | wc -l)
if [ "$remaining" -eq 0 ]; then
    echo "   ✅ All 'from core.' imports fixed"
else
    echo "   ⚠️  Still found $remaining files with 'from core.' imports"
    find backend -name "*.py" -type f -exec grep -l "from core\." {} \; 2>/dev/null
fi

# Step 6: Create a minimal working main.py as backup
echo "🔧 Step 6: Creating backup minimal main.py..."
cat > backend/app/main_minimal.py << 'EOF'
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="RAG Application", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "RAG Application API", "status": "running", "mode": "minimal"}

@app.get("/health")
async def health():
    return {"status": "healthy", "mode": "minimal"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
EOF

# Step 7: Rebuild the container
echo "🔨 Step 7: Rebuilding backend container..."
docker-compose build backend-07 --no-cache

# Step 8: Start the container
echo "🚀 Step 8: Starting backend container..."
docker-compose up -d backend-07

# Step 9: Wait and check status
echo "⏳ Step 9: Waiting for container to start..."
sleep 10

# Check if container is running
if docker ps | grep -q backend-07; then
    echo "✅ Container is running!"
    
    # Test the API
    echo "🧪 Testing API..."
    if curl -s http://localhost:8000/ | grep -q "RAG Application"; then
        echo "✅ API is responding!"
        echo ""
        echo "🎉 SUCCESS: Container reboot loop fixed!"
        echo "   Your RAG application is now running at: http://localhost:8000"
    else
        echo "⚠️  Container running but API not responding"
        echo "   Checking logs..."
        docker-compose logs backend-07 --tail=10
    fi
else
    echo "❌ Container still not running"
    echo "   Trying minimal mode..."
    
    # Try with minimal main.py
    docker exec backend-07 cp /app/app/main_minimal.py /app/app/main.py 2>/dev/null || {
        echo "   Creating new container with minimal main.py..."
        docker run -d --name backend-07-minimal \
            --network rag-app-07_default \
            -v $(pwd)/backend/app/main_minimal.py:/app/app/main.py \
            -p 8000:8000 \
            rag-app-07-backend-07
    }
    
    sleep 5
    if curl -s http://localhost:8000/ | grep -q "minimal"; then
        echo "✅ Minimal mode working!"
        echo "   You can now fix remaining issues while the app is running"
    else
        echo "❌ Even minimal mode failed"
        echo "   Manual intervention required"
    fi
fi

echo ""
echo "📋 Next Steps:"
echo "1. If successful, your app is running at http://localhost:8000"
echo "2. Check logs: docker-compose logs backend-07"
echo "3. If still failing, the issue may be deeper in the codebase"
echo "4. Consider restoring from a working backup"



#!/bin/bash
# Deploy Frontend-Backend Communication Fix
# Fixes data format mismatch between backend and frontend

echo "🔧 Deploying Frontend-Backend Communication Fix"
echo "=============================================="

# Copy fixed WebSocket monitoring module
echo "📁 Copying fixed WebSocket module..."
cp /home/ubuntu/rag-app/backend/app/api/routes/websocket_monitoring.py \
   /home/vastdata/rag-app-07/backend/app/api/routes/

# Copy updated frontend hook (if needed)
if [ -f "/home/ubuntu/latest-rag-frontend/frontend/rag-ui-new/src/components/monitoring/hooks/usePipelineMonitoring.jsx" ]; then
    echo "📁 Copying updated frontend hook..."
    cp /home/ubuntu/latest-rag-frontend/frontend/rag-ui-new/src/components/monitoring/hooks/usePipelineMonitoring.jsx \
       /home/vastdata/rag-app-07/frontend/rag-ui-new/src/components/monitoring/hooks/
fi

# Restart backend container
echo "🔄 Restarting backend container..."
cd /home/vastdata/rag-app-07
docker-compose restart backend-07

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
sleep 10

# Test endpoints
echo "🧪 Testing endpoints..."
echo "WebSocket Test:"
curl -s http://localhost:8000/api/v1/ws/test | jq .

echo ""
echo "Monitoring Status:"
curl -s http://localhost:8000/api/v1/monitoring/status | jq .

echo ""
echo "✅ Deployment complete!"
echo "🌐 Open http://localhost:3000/monitoring to test Pipeline Monitor"


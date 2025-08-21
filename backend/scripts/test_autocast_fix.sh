#!/bin/bash
echo "🧪 Testing autocast fix..."

echo "Restarting backend container..."
docker restart backend-07

echo "Waiting for container to start..."
sleep 10

echo "Testing LLM generation..."
curl -X POST "http://localhost:8000/api/v1/queries/ask" \
  -H "Content-Type: application/json" \
  -d '{"query": "Test autocast fix"}' | jq '.'

echo ""
echo "Check container logs for errors:"
echo "docker logs backend-07 --tail 20"

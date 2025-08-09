#!/bin/bash
echo "=== RAG-App-07 External API Test Sequence ==="

echo "1. Testing system health..."
curl -s http://localhost:8000/health | jq .

echo -e "\n2. Testing document upload..."
echo "Test content" > test.txt
curl -s -X POST "http://localhost:8000/api/v1/documents/" \
  -F "file=@test.txt" -F "department=Test" | jq .

echo -e "\n3. Testing document listing..."
curl -s "http://localhost:8000/api/v1/documents/" | jq .

echo -e "\n4. Testing query processing..."
curl -s -X POST "http://localhost:8000/api/v1/queries/ask" \
  -H "Content-Type: application/json" \
  -d '{"query": "Test query"}' | jq .

echo -e "\n5. Testing monitoring..."
curl -s "http://localhost:8000/api/v1/monitoring/stats" | jq .

echo -e "\n6. Cleanup..."
rm -f test.txt

echo "=== Test Complete ==="

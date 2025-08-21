#!/bin/bash

echo "🔧 Fixing LLM response format extraction..."

# Backup the file
docker exec -it backend-07 cp /app/app/main.py /app/app/main.py.backup2

# Find and show current response handling
echo "📋 Current response handling:"
docker exec -it backend-07 grep -A 3 -B 3 "llm_response" /app/app/main.py

# Apply the fix for response text extraction
echo "🔧 Applying response text extraction fix..."
docker exec -it backend-07 sed -i 's/response_text = llm_response/response_text = llm_response.get("response", "") if isinstance(llm_response, dict) else str(llm_response)/g' /app/app/main.py

# Also fix any direct assignment to response field
docker exec -it backend-07 sed -i 's/"response": llm_response/"response": response_text/g' /app/app/main.py

# Restart container
echo "🔄 Restarting container..."
docker restart backend-07

echo "⏳ Waiting for startup..."
sleep 20

echo "🧪 Testing LLM response format..."
curl -s -X POST "http://localhost:8000/api/v1/queries/ask" \
  -H "Content-Type: application/json" \
  -d '{"query": "What is 2+2?", "use_llm": true}' | jq '.used_llm, .response'

echo "✅ Response format fix complete!"


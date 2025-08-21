#!/bin/bash

# Fix Autocast Syntax Error Script
# Corrects the torch.amp.autocast() parameter format

echo "🔧 Fixing Autocast Syntax Error..."

# Find the LLM service file
LLM_SERVICE_FILE=""
SEARCH_PATHS=(
    "./backend/app/services/llm_service.py"
    "./backend/services/llm_service.py"
    "./app/services/llm_service.py"
    "./services/llm_service.py"
    "./llm_service.py"
)

for path in "${SEARCH_PATHS[@]}"; do
    if [ -f "$path" ]; then
        LLM_SERVICE_FILE="$path"
        break
    fi
done

if [ -z "$LLM_SERVICE_FILE" ]; then
    echo "❌ Error: llm_service.py not found in common locations"
    echo "Please specify the path manually:"
    echo "Usage: $0 /path/to/llm_service.py"
    exit 1
fi

echo "📁 Found LLM service file: $LLM_SERVICE_FILE"

# Create backup
BACKUP_FILE="${LLM_SERVICE_FILE}.autocast_backup_$(date +%Y%m%d_%H%M%S)"
cp "$LLM_SERVICE_FILE" "$BACKUP_FILE"
echo "💾 Backup created: $BACKUP_FILE"

# Fix the autocast syntax
echo "🔧 Applying autocast syntax fix..."

# Use Python to fix the syntax
python3 << EOF
import re

# Read the file
with open('$LLM_SERVICE_FILE', 'r') as f:
    content = f.read()

# Fix incorrect autocast syntax
# Pattern 1: torch.amp.autocast('cuda', dtype=torch.float16)
content = re.sub(
    r"torch\.amp\.autocast\(\s*['\"]cuda['\"],\s*dtype=torch\.float16\s*\)",
    "torch.amp.autocast(device_type='cuda', dtype=torch.float16)",
    content
)

# Pattern 2: torch.amp.autocast('cuda')
content = re.sub(
    r"torch\.amp\.autocast\(\s*['\"]cuda['\"]s*\)",
    "torch.amp.autocast(device_type='cuda')",
    content
)

# Pattern 3: Any other positional cuda argument
content = re.sub(
    r"torch\.amp\.autocast\(\s*['\"]cuda['\"]([^)]*)\)",
    r"torch.amp.autocast(device_type='cuda'\1)",
    content
)

# Write the corrected content
with open('$LLM_SERVICE_FILE', 'w') as f:
    f.write(content)

print("✅ Autocast syntax corrected")
EOF

# Verify the fix
echo "🔍 Verifying the fix..."
if grep -q "torch.amp.autocast(device_type='cuda'" "$LLM_SERVICE_FILE"; then
    echo "✅ Autocast syntax fix applied successfully"
else
    echo "⚠️ Warning: Could not verify the fix. Please check manually."
fi

# Show the corrected lines
echo ""
echo "📋 Corrected autocast usage:"
grep -n "torch.amp.autocast" "$LLM_SERVICE_FILE" || echo "No autocast usage found"

echo ""
echo "🚀 Next steps:"
echo "1. Restart your backend container: docker restart backend-07"
echo "2. Test LLM generation to verify the fix"
echo ""
echo "💾 Backup available at: $BACKUP_FILE"

# Create a test script
cat > test_autocast_fix.sh << 'TESTEOF'
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
TESTEOF

chmod +x test_autocast_fix.sh
echo "📝 Created test script: test_autocast_fix.sh"


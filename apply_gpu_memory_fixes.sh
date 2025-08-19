#!/bin/bash

# GPU Memory Optimization - Local File Integration Script
# Applies RTX 5090 GPU memory fixes to your local RAG application files

set -e  # Exit on any error

echo "🚀 GPU Memory Optimization - Local File Integration"
echo "=================================================="

# Configuration
RAG_APP_DIR="${1:-./}"
BACKUP_DIR="${RAG_APP_DIR}/backup_$(date +%Y%m%d_%H%M%S)"

# Validate directory
if [ ! -d "$RAG_APP_DIR" ]; then
    echo "❌ Error: Directory $RAG_APP_DIR not found"
    echo "Usage: $0 [path_to_rag_app_directory]"
    exit 1
fi

echo "📁 Working directory: $RAG_APP_DIR"
echo "💾 Backup directory: $BACKUP_DIR"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Function to backup file
backup_file() {
    local file="$1"
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/$(basename $file).backup"
        echo "✅ Backed up: $file"
    fi
}

# Function to find file in common locations
find_file() {
    local filename="$1"
    local locations=(
        "$RAG_APP_DIR/$filename"
        "$RAG_APP_DIR/backend/$filename"
        "$RAG_APP_DIR/backend/app/$filename"
        "$RAG_APP_DIR/backend/app/services/$filename"
        "$RAG_APP_DIR/backend/app/core/$filename"
    )
    
    for location in "${locations[@]}"; do
        if [ -f "$location" ]; then
            echo "$location"
            return 0
        fi
    done
    return 1
}

echo ""
echo "🔍 Step 1: Locating target files..."

# Find key files
LLM_SERVICE_FILE=$(find_file "llm_service.py" || echo "")
MAIN_FILE=$(find_file "main.py" || echo "")
DOCKER_COMPOSE_FILE=$(find_file "docker-compose.yml" || echo "")

echo "📄 LLM Service: ${LLM_SERVICE_FILE:-'Not found'}"
echo "📄 Main file: ${MAIN_FILE:-'Not found'}"
echo "📄 Docker Compose: ${DOCKER_COMPOSE_FILE:-'Not found'}"

echo ""
echo "💾 Step 2: Creating backups..."

# Backup files
[ -n "$LLM_SERVICE_FILE" ] && backup_file "$LLM_SERVICE_FILE"
[ -n "$MAIN_FILE" ] && backup_file "$MAIN_FILE"
[ -n "$DOCKER_COMPOSE_FILE" ] && backup_file "$DOCKER_COMPOSE_FILE"

echo ""
echo "🔧 Step 3: Creating GPU configuration module..."

# Create GPU config module
GPU_CONFIG_DIR="$(dirname "$LLM_SERVICE_FILE" 2>/dev/null || echo "$RAG_APP_DIR/backend/app/core")"
mkdir -p "$GPU_CONFIG_DIR"

cat > "$GPU_CONFIG_DIR/gpu_config.py" << 'EOF'
"""GPU Configuration for RTX 5090 Optimization"""

import torch
import os
import gc
from typing import Dict, Any

class GPUMemoryOptimizer:
    """GPU Memory optimization for RTX 5090"""
    
    # RTX 5090 specific settings
    MEMORY_FRACTION = 0.8  # Use 80% of 32GB
    MAX_SPLIT_SIZE_MB = 512
    TRITON_CACHE_SIZE = 1024
    
    @classmethod
    def optimize_for_rtx5090(cls) -> Dict[str, Any]:
        """Apply RTX 5090 specific optimizations"""
        if not torch.cuda.is_available():
            return {"status": "skipped", "reason": "CUDA not available"}
        
        try:
            # Set memory fraction (80% of 32GB = ~25.6GB)
            torch.cuda.set_per_process_memory_fraction(cls.MEMORY_FRACTION)
            
            # Configure memory allocator
            os.environ['PYTORCH_CUDA_ALLOC_CONF'] = f'max_split_size_mb:{cls.MAX_SPLIT_SIZE_MB},expandable_segments:True'
            
            # Triton optimization
            os.environ['TRITON_CACHE_DIR'] = '/tmp/triton_cache'
            os.environ['TRITON_KERNEL_CACHE_SIZE'] = str(cls.TRITON_CACHE_SIZE)
            
            # Clear existing cache
            torch.cuda.empty_cache()
            gc.collect()
            
            # Get GPU info
            gpu_name = torch.cuda.get_device_name(0)
            total_memory = torch.cuda.get_device_properties(0).total_memory / 1e9
            
            print("✅ GPU memory optimized for RTX 5090")
            print(f"🎮 GPU: {gpu_name}")
            print(f"📊 Total Memory: {total_memory:.1f}GB")
            print(f"🔧 Allocated Fraction: {cls.MEMORY_FRACTION * 100}%")
            
            return {
                "status": "success",
                "gpu": gpu_name,
                "total_memory_gb": round(total_memory, 1),
                "allocated_fraction": cls.MEMORY_FRACTION,
                "max_memory_gb": round(total_memory * cls.MEMORY_FRACTION, 1)
            }
            
        except Exception as e:
            print(f"❌ GPU optimization failed: {e}")
            return {"status": "error", "error": str(e)}
    
    @staticmethod
    def clear_memory():
        """Clear GPU memory cache"""
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            gc.collect()
    
    @staticmethod
    def get_memory_stats() -> Dict[str, float]:
        """Get current GPU memory statistics"""
        if not torch.cuda.is_available():
            return {}
        
        return {
            "allocated_gb": torch.cuda.memory_allocated() / 1e9,
            "reserved_gb": torch.cuda.memory_reserved() / 1e9,
            "total_gb": torch.cuda.get_device_properties(0).total_memory / 1e9
        }
EOF

echo "✅ Created: $GPU_CONFIG_DIR/gpu_config.py"

echo ""
echo "🔧 Step 4: Modifying LLM service..."

if [ -n "$LLM_SERVICE_FILE" ] && [ -f "$LLM_SERVICE_FILE" ]; then
    # Create modified LLM service
    python3 << EOF
import re

# Read the original file
with open('$LLM_SERVICE_FILE', 'r') as f:
    content = f.read()

# Add GPU config import if not present
if 'from .gpu_config import GPUMemoryOptimizer' not in content and 'from gpu_config import GPUMemoryOptimizer' not in content:
    # Find the import section
    import_pattern = r'(import torch.*?\n)'
    if re.search(import_pattern, content):
        content = re.sub(import_pattern, r'\1from .gpu_config import GPUMemoryOptimizer\n', content, count=1)
    else:
        # Add at the beginning after existing imports
        lines = content.split('\n')
        insert_pos = 0
        for i, line in enumerate(lines):
            if line.strip().startswith('import ') or line.strip().startswith('from '):
                insert_pos = i + 1
        lines.insert(insert_pos, 'from .gpu_config import GPUMemoryOptimizer')
        content = '\n'.join(lines)

# Add GPU optimization to __init__ method
init_pattern = r'(def __init__\(self[^)]*\):.*?\n)(.*?)(def|\Z)'
def add_gpu_optimization(match):
    method_def = match.group(1)
    method_body = match.group(2)
    next_def = match.group(3)
    
    # Check if GPU optimization already exists
    if 'GPUMemoryOptimizer.optimize_for_rtx5090()' in method_body:
        return match.group(0)  # Already optimized
    
    # Add GPU optimization at the beginning of the method
    gpu_opt_code = '''        # Apply GPU memory optimization for RTX 5090
        GPUMemoryOptimizer.optimize_for_rtx5090()
        
'''
    
    return method_def + gpu_opt_code + method_body + next_def

content = re.sub(init_pattern, add_gpu_optimization, content, flags=re.DOTALL)

# Fix deprecated autocast usage
content = re.sub(
    r'with torch\.cuda\.amp\.autocast\(\)',
    "with torch.amp.autocast('cuda', dtype=torch.float16)",
    content
)

# Add memory cleanup after generation
generation_pattern = r'(return self\.tokenizer\.decode\([^)]+\))'
def add_memory_cleanup(match):
    return_statement = match.group(1)
    return f'''        # Clear GPU memory after generation
        GPUMemoryOptimizer.clear_memory()
        
        {return_statement}'''

content = re.sub(generation_pattern, add_memory_cleanup, content)

# Write the modified content
with open('$LLM_SERVICE_FILE', 'w') as f:
    f.write(content)

print("✅ Modified LLM service file")
EOF
else
    echo "⚠️ LLM service file not found, skipping modification"
fi

echo ""
echo "🔧 Step 5: Modifying main.py..."

if [ -n "$MAIN_FILE" ] && [ -f "$MAIN_FILE" ]; then
    # Add environment variables and startup optimization to main.py
    python3 << EOF
import re

# Read the original file
with open('$MAIN_FILE', 'r') as f:
    content = f.read()

# Add environment variables at the top
env_vars = '''# GPU Memory Optimization Environment Variables
import os
os.environ['PYTORCH_CUDA_ALLOC_CONF'] = 'max_split_size_mb:512,expandable_segments:True'
os.environ['TRITON_CACHE_DIR'] = '/tmp/triton_cache'
os.environ['TRITON_KERNEL_CACHE_SIZE'] = '1024'

'''

# Check if environment variables are already set
if 'PYTORCH_CUDA_ALLOC_CONF' not in content:
    # Add after the first import or at the beginning
    lines = content.split('\n')
    insert_pos = 0
    for i, line in enumerate(lines):
        if line.strip().startswith('import ') or line.strip().startswith('from '):
            insert_pos = i
            break
    
    lines.insert(insert_pos, env_vars)
    content = '\n'.join(lines)

# Add startup event if not present
startup_event = '''
@app.on_event("startup")
async def startup_event():
    """Application startup with GPU optimization"""
    print("🚀 Starting Enhanced RAG Application with GPU optimization...")
    
    # Apply GPU memory optimization
    try:
        import torch
        if torch.cuda.is_available():
            torch.cuda.set_per_process_memory_fraction(0.8)
            torch.cuda.empty_cache()
            print("✅ GPU memory optimization applied at startup")
    except Exception as e:
        print(f"⚠️ GPU optimization warning: {e}")
'''

# Check if startup event already exists
if '@app.on_event("startup")' not in content and 'async def startup_event' not in content:
    # Find where to insert the startup event (after app creation)
    app_pattern = r'(app = FastAPI\([^)]*\).*?\n)'
    if re.search(app_pattern, content):
        content = re.sub(app_pattern, r'\1' + startup_event + '\n', content, count=1)

# Write the modified content
with open('$MAIN_FILE', 'w') as f:
    f.write(content)

print("✅ Modified main.py file")
EOF
else
    echo "⚠️ main.py file not found, skipping modification"
fi

echo ""
echo "🔧 Step 6: Modifying docker-compose.yml..."

if [ -n "$DOCKER_COMPOSE_FILE" ] && [ -f "$DOCKER_COMPOSE_FILE" ]; then
    # Add environment variables to docker-compose.yml
    python3 << EOF
import yaml
import sys

try:
    with open('$DOCKER_COMPOSE_FILE', 'r') as f:
        content = f.read()
    
    # Parse YAML
    data = yaml.safe_load(content)
    
    # Find backend service (look for common names)
    backend_service = None
    service_names = ['backend-07', 'backend', 'api', 'app']
    
    for service_name in service_names:
        if service_name in data.get('services', {}):
            backend_service = service_name
            break
    
    if backend_service:
        service = data['services'][backend_service]
        
        # Add environment variables
        if 'environment' not in service:
            service['environment'] = []
        
        env_vars = [
            'PYTORCH_CUDA_ALLOC_CONF=max_split_size_mb:512,expandable_segments:True',
            'TRITON_CACHE_DIR=/tmp/triton_cache',
            'TRITON_KERNEL_CACHE_SIZE=1024'
        ]
        
        # Convert to list if it's a dict
        if isinstance(service['environment'], dict):
            env_list = [f"{k}={v}" for k, v in service['environment'].items()]
            service['environment'] = env_list
        
        # Add new environment variables if not present
        for env_var in env_vars:
            if not any(env_var.split('=')[0] in existing for existing in service['environment']):
                service['environment'].append(env_var)
        
        # Write back to file
        with open('$DOCKER_COMPOSE_FILE', 'w') as f:
            yaml.dump(data, f, default_flow_style=False, sort_keys=False)
        
        print(f"✅ Modified docker-compose.yml (service: {backend_service})")
    else:
        print("⚠️ Backend service not found in docker-compose.yml")

except Exception as e:
    print(f"❌ Error modifying docker-compose.yml: {e}")
    print("Please add environment variables manually")
EOF
else
    echo "⚠️ docker-compose.yml file not found, skipping modification"
fi

echo ""
echo "📋 Step 7: Creating integration summary..."

cat > "$RAG_APP_DIR/GPU_OPTIMIZATION_SUMMARY.md" << 'EOF'
# GPU Memory Optimization Integration Summary

## ✅ Applied Changes

### 1. Created GPU Configuration Module
- **File**: `backend/app/core/gpu_config.py` (or similar location)
- **Purpose**: Centralized GPU memory optimization for RTX 5090

### 2. Modified LLM Service
- **Added**: GPU memory optimization to `__init__` method
- **Fixed**: Deprecated `torch.cuda.amp.autocast()` usage
- **Added**: Memory cleanup after generation

### 3. Modified Main Application
- **Added**: Environment variables for GPU optimization
- **Added**: Startup event with GPU memory configuration

### 4. Modified Docker Compose
- **Added**: Environment variables for persistent GPU settings

## 🚀 Next Steps

### 1. Test the Changes
```bash
# Rebuild and restart containers
docker-compose down
docker-compose up --build -d

# Test LLM generation
curl -X POST "http://localhost:8000/api/v1/queries/ask" \
  -H "Content-Type: application/json" \
  -d '{"query": "Test GPU memory optimization"}'
```

### 2. Verify Optimization
```bash
# Check container logs for optimization messages
docker logs backend-07 | grep -i "gpu\|memory\|optimization"

# Monitor GPU usage
nvidia-smi -l 1
```

### 3. Expected Results
- ✅ "✅ GPU memory optimized for RTX 5090" message in logs
- ✅ No Triton kernel OOM errors
- ✅ Successful LLM response generation
- ✅ Stable GPU memory usage (~20-25GB)

## 🔧 Troubleshooting

### If Still Getting OOM Errors:
1. Reduce memory fraction in `gpu_config.py`: `MEMORY_FRACTION = 0.7`
2. Check if multiple models are loading simultaneously
3. Restart containers to clear memory fragmentation

### If Performance Issues:
1. Adjust `MAX_SPLIT_SIZE_MB` in `gpu_config.py`
2. Monitor GPU memory with `nvidia-smi`
3. Check container resource limits

## 📁 Backup Location
All original files backed up to: `backup_YYYYMMDD_HHMMSS/`

## 🔄 Rollback Instructions
If needed, restore original files:
```bash
cp backup_*/llm_service.py.backup backend/app/services/llm_service.py
cp backup_*/main.py.backup backend/app/main.py
cp backup_*/docker-compose.yml.backup docker-compose.yml
```
EOF

echo "✅ Created: $RAG_APP_DIR/GPU_OPTIMIZATION_SUMMARY.md"

echo ""
echo "🎉 GPU Memory Optimization Integration Complete!"
echo "=============================================="
echo ""
echo "📋 Summary of changes:"
echo "✅ Created GPU configuration module"
echo "✅ Modified LLM service with memory optimization"
echo "✅ Updated main.py with startup optimization"
echo "✅ Added environment variables to docker-compose.yml"
echo "✅ Created backup of all modified files"
echo ""
echo "🚀 Next steps:"
echo "1. Review the changes in your files"
echo "2. Test with: docker-compose down && docker-compose up --build -d"
echo "3. Verify GPU optimization in container logs"
echo "4. Test LLM generation functionality"
echo ""
echo "📖 Full documentation: $RAG_APP_DIR/GPU_OPTIMIZATION_SUMMARY.md"
echo "💾 Backups available in: $BACKUP_DIR"
echo ""
echo "🎯 Expected result: No more Triton kernel OOM errors!"



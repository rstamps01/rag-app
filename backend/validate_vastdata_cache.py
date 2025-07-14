#!/usr/bin/env python3
"""
Corrected HuggingFace Cache Validator
Properly handles HuggingFace cache structure with snapshots directories
"""

import os
import json
import time
from pathlib import Path
from datetime import datetime

def validate_hf_cache_model(base_path, model_name, required_files, model_type="llm"):
    """Validate model in HuggingFace cache format"""
    cache_name = model_name.replace("/", "--")
    model_dir = Path(base_path) / f"models--{cache_name}"
    
    result = {
        "model_name": model_name,
        "type": model_type,
        "cache_name": cache_name,
        "model_dir": str(model_dir),
        "exists": False,
        "integrity": 0.0,
        "found_files": [],
        "missing_files": required_files.copy(),
        "snapshot_path": None,
        "total_size_mb": 0,
        "file_details": {}
    }
    
    if not model_dir.exists():
        result["error"] = "Model directory not found"
        return result
    
    result["exists"] = True
    
    # Find snapshots directory
    snapshots_dir = model_dir / "snapshots"
    if not snapshots_dir.exists():
        result["error"] = "No snapshots directory found"
        return result
    
    # Find latest snapshot (should be only one in most cases)
    snapshots = [d for d in snapshots_dir.iterdir() if d.is_dir()]
    if not snapshots:
        result["error"] = "No snapshot directories found"
        return result
    
    # Use first (and typically only) snapshot
    snapshot_path = snapshots[0]
    result["snapshot_path"] = str(snapshot_path)
    result["snapshot_hash"] = snapshot_path.name
    
    # Validate files in snapshot
    found_files = []
    missing_files = []
    total_size = 0
    file_details = {}
    
    for file_name in required_files:
        file_path = snapshot_path / file_name
        if file_path.exists() and file_path.is_file():
            file_size = file_path.stat().st_size
            found_files.append(file_name)
            total_size += file_size
            file_details[file_name] = {
                "exists": True,
                "size_bytes": file_size,
                "size_mb": round(file_size / (1024 * 1024), 2),
                "path": str(file_path)
            }
        else:
            missing_files.append(file_name)
            file_details[file_name] = {
                "exists": False,
                "size_bytes": 0,
                "size_mb": 0,
                "path": str(file_path)
            }
    
    # Check for additional model files (safetensors, bin files)
    additional_files = []
    for pattern in ["*.safetensors", "*.bin", "*.pt"]:
        additional_files.extend(snapshot_path.glob(pattern))
    
    for file_path in additional_files:
        if file_path.name not in file_details:
            file_size = file_path.stat().st_size
            total_size += file_size
            file_details[file_path.name] = {
                "exists": True,
                "size_bytes": file_size,
                "size_mb": round(file_size / (1024 * 1024), 2),
                "path": str(file_path),
                "type": "model_weights"
            }
    
    result["found_files"] = found_files
    result["missing_files"] = missing_files
    result["integrity"] = len(found_files) / len(required_files) if required_files else 1.0
    result["total_size_mb"] = round(total_size / (1024 * 1024), 2)
    result["file_details"] = file_details
    result["total_files_found"] = len([f for f in file_details.values() if f["exists"]])
    
    return result

def validate_cache_directory(cache_path):
    """Validate overall cache directory structure"""
    cache_path = Path(cache_path)
    
    return {
        "path": str(cache_path),
        "exists": cache_path.exists(),
        "is_directory": cache_path.is_dir() if cache_path.exists() else False,
        "readable": os.access(cache_path, os.R_OK) if cache_path.exists() else False,
        "writable": os.access(cache_path, os.W_OK) if cache_path.exists() else False,
        "size_mb": round(sum(f.stat().st_size for f in cache_path.rglob('*') if f.is_file()) / (1024 * 1024), 2) if cache_path.exists() else 0
    }

def main():
    """Main validation function"""
    timestamp = time.time()
    
    # Configuration
    base_paths = {
        "backend_cache": "/home/vastdata/rag-app-07/backend/models_cache",
        "hf_cache": "/home/vastdata/.cache/huggingface/hub"
    }
    
    # Define required files for each model type
    model_configs = {
        "mistralai/Mistral-7B-Instruct-v0.2": {
            "type": "llm",
            "required_files": ["config.json", "tokenizer.json", "tokenizer_config.json", "special_tokens_map.json"]
        },
        "sentence-transformers/all-MiniLM-L6-v2": {
            "type": "embedding", 
            "required_files": ["config.json", "tokenizer.json", "config_sentence_transformers.json"]
        }
    }
    
    results = {
        "timestamp": timestamp,
        "datetime": datetime.fromtimestamp(timestamp).strftime("%Y-%m-%d %H:%M:%S"),
        "user": os.getenv("USER", "unknown"),
        "validation_type": "corrected_hf_cache_structure",
        "cache_directories": {},
        "model_validation": {},
        "summary": {}
    }
    
    # Validate cache directories
    print("🔍 Validating cache directories...")
    for cache_name, cache_path in base_paths.items():
        print(f"   📁 {cache_name}: {cache_path}")
        results["cache_directories"][cache_name] = validate_cache_directory(cache_path)
        
        if results["cache_directories"][cache_name]["exists"]:
            print(f"   ✅ Exists ({results['cache_directories'][cache_name]['size_mb']} MB)")
        else:
            print(f"   ❌ Not found")
    
    print()
    
    # Validate models in each cache
    for cache_name, cache_path in base_paths.items():
        if not results["cache_directories"][cache_name]["exists"]:
            continue
            
        print(f"🤖 Validating models in {cache_name}...")
        results["model_validation"][cache_name] = {}
        
        for model_name, config in model_configs.items():
            print(f"   🔍 {model_name}...")
            
            result = validate_hf_cache_model(
                cache_path, 
                model_name, 
                config["required_files"],
                config["type"]
            )
            
            results["model_validation"][cache_name][model_name] = result
            
            if result["integrity"] == 1.0:
                print(f"   ✅ Complete (100%) - {result['total_size_mb']} MB")
                print(f"      📁 Snapshot: {result['snapshot_hash']}")
                print(f"      📄 Files: {result['total_files_found']} found")
            else:
                print(f"   ❌ {result['integrity']*100:.1f}% complete - {result['total_size_mb']} MB")
                if result["missing_files"]:
                    print(f"      Missing: {', '.join(result['missing_files'])}")
                if "error" in result:
                    print(f"      Error: {result['error']}")
        
        print()
    
    # Generate summary
    total_models = len(model_configs)
    backend_complete = sum(1 for model in results["model_validation"].get("backend_cache", {}).values() if model["integrity"] == 1.0)
    hf_complete = sum(1 for model in results["model_validation"].get("hf_cache", {}).values() if model["integrity"] == 1.0)
    
    results["summary"] = {
        "total_models": total_models,
        "backend_cache_complete": backend_complete,
        "hf_cache_complete": hf_complete,
        "backend_cache_percentage": (backend_complete / total_models * 100) if total_models > 0 else 0,
        "hf_cache_percentage": (hf_complete / total_models * 100) if total_models > 0 else 0,
        "overall_status": "healthy" if (backend_complete == total_models or hf_complete == total_models) else "degraded"
    }
    
    # Print summary
    print("📊 VALIDATION SUMMARY")
    print("=" * 50)
    print(f"Backend Cache: {backend_complete}/{total_models} models complete ({results['summary']['backend_cache_percentage']:.0f}%)")
    print(f"HF Cache: {hf_complete}/{total_models} models complete ({results['summary']['hf_cache_percentage']:.0f}%)")
    print(f"Overall Status: {results['summary']['overall_status'].upper()}")
    
    if results['summary']['overall_status'] == 'healthy':
        print("\n🎉 SUCCESS: At least one complete cache available for all models!")
    else:
        print("\n⚠️  WARNING: Some models incomplete in all caches")
    
    # Save detailed results
    output_file = f"corrected_cache_validation_{datetime.fromtimestamp(timestamp).strftime('%Y%m%d_%H%M%S')}.json"
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📄 Detailed results saved to: {output_file}")
    
    return results

if __name__ == "__main__":
    results = main()

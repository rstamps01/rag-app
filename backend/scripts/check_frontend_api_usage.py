#!/usr/bin/env python3
"""
Check Frontend API Usage
Analyzes how the frontend code uses API environment variables
"""

import os
import re
import glob

def log_info(message):
    print(f"✅ {message}")

def log_warning(message):
    print(f"⚠️  {message}")

def log_error(message):
    print(f"❌ {message}")

def log_step(message):
    print(f"🔧 {message}")

def find_frontend_files():
    """Find all frontend JavaScript/TypeScript files"""
    patterns = [
        "frontend/**/*.js",
        "frontend/**/*.jsx", 
        "frontend/**/*.ts",
        "frontend/**/*.tsx"
    ]
    
    files = []
    for pattern in patterns:
        files.extend(glob.glob(pattern, recursive=True))
    
    return files

def analyze_api_usage(file_path):
    """Analyze how a file uses API environment variables"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
    except Exception as e:
        return None, f"Could not read file: {e}"
    
    issues = []
    api_usages = []
    
    # Check for environment variable usage
    env_patterns = [
        r'process\.env\.REACT_APP_API_URL',
        r'process\.env\.REACT_APP_API_URL_EXTERNAL',
        r'REACT_APP_API_URL',
        r'localhost:8000',
        r'http://localhost:8000',
        r'backend-07:8000',
        r'http://backend-07:8000'
    ]
    
    for pattern in env_patterns:
        matches = re.findall(pattern, content, re.IGNORECASE)
        if matches:
            api_usages.append((pattern, len(matches)))
    
    # Check for problematic patterns
    problematic_patterns = [
        (r'process\.env\.REACT_APP_API_URL_EXTERNAL\s*\|\|', "Uses EXTERNAL as fallback"),
        (r'localhost:8000', "Hardcoded localhost usage"),
        (r'http://localhost:8000', "Hardcoded localhost URL"),
        (r'\.env\.REACT_APP_API_URL_EXTERNAL', "References EXTERNAL variable")
    ]
    
    for pattern, description in problematic_patterns:
        if re.search(pattern, content, re.IGNORECASE):
            issues.append(description)
    
    return api_usages, issues

def main():
    """Main analysis function"""
    print("🔍 Frontend API Usage Analysis")
    print("=" * 40)
    
    if not os.path.exists("frontend"):
        log_error("Frontend directory not found")
        return
    
    log_step("Finding frontend files...")
    files = find_frontend_files()
    
    if not files:
        log_warning("No frontend JavaScript/TypeScript files found")
        return
    
    log_info(f"Found {len(files)} frontend files to analyze")
    
    total_issues = 0
    files_with_api_usage = 0
    
    print("\n📋 Analysis Results:")
    print("-" * 40)
    
    for file_path in files:
        api_usages, issues = analyze_api_usage(file_path)
        
        if api_usages is None:
            log_warning(f"Skipped {file_path}: {issues}")
            continue
        
        if api_usages or issues:
            files_with_api_usage += 1
            print(f"\n📄 {file_path}")
            
            if api_usages:
                print("   API Usage:")
                for pattern, count in api_usages:
                    print(f"     • {pattern}: {count} occurrences")
            
            if issues:
                print("   ⚠️  Potential Issues:")
                for issue in issues:
                    print(f"     • {issue}")
                total_issues += len(issues)
    
    # Summary
    print("\n" + "=" * 40)
    print("📊 SUMMARY")
    print("=" * 40)
    
    if total_issues == 0:
        log_info("🎉 No API configuration issues found!")
        log_info("✅ Your frontend should work correctly with backend-07:8000")
    else:
        log_warning(f"⚠️  Found {total_issues} potential issues in {files_with_api_usage} files")
        
        print("\n🔧 Recommendations:")
        print("1. Remove any hardcoded localhost:8000 references")
        print("2. Use only REACT_APP_API_URL environment variable")
        print("3. Avoid using REACT_APP_API_URL_EXTERNAL unless necessary")
        print("4. Test the application after making changes")
    
    print(f"\n📈 Statistics:")
    print(f"   Files analyzed: {len(files)}")
    print(f"   Files with API usage: {files_with_api_usage}")
    print(f"   Potential issues: {total_issues}")
    
    # Specific recommendations
    print(f"\n🎯 Configuration Recommendations:")
    if total_issues > 0:
        print("   • Use the safer docker-compose configuration (removes EXTERNAL variable)")
        print("   • Update frontend code to use only REACT_APP_API_URL")
    else:
        print("   • Current configuration should work fine")
        print("   • REACT_APP_API_URL_EXTERNAL can be safely removed if unused")

if __name__ == "__main__":
    main()


#!/usr/bin/env python3
"""
Targeted LLM Service Fix
Fixes the specific LLM service code to return string instead of Dict[str, Any]
"""

import re
import sys
import os
from typing import Dict, Any

def fix_llm_service_return_type(file_path: str) -> bool:
    """Fix LLM service to return string instead of dict"""
    
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return False
    
    # Create backup
    backup_path = f"{file_path}.return_type_backup"
    with open(file_path, 'r') as f:
        original_content = f.read()
    
    with open(backup_path, 'w') as f:
        f.write(original_content)
    
    print(f"💾 Backup created: {backup_path}")
    
    content = original_content
    
    # Step 1: Change return type annotation from Dict[str, Any] to str
    print("🔧 Changing return type annotation...")
    content = re.sub(
        r'(def generate_response\([^)]*\)) -> Dict\[str, Any\]:',
        r'\1 -> str:',
        content
    )
    
    # Step 2: Find and replace the return statement
    print("🔧 Modifying return statement...")
    
    # Pattern to match the return dictionary
    return_pattern = r'return \{\s*"response":\s*generated_text,\s*"processing_time":\s*processing_time,\s*"input_tokens":\s*input_tokens,\s*"output_tokens":\s*output_tokens,\s*"tokens_per_second":\s*tokens_per_second,\s*"model":\s*self\.model_name,\s*"device":\s*self\.device,\s*"context_used":\s*bool\(context\)\s*\}'
    
    replacement = '''# Store metadata for later retrieval
        self.last_generation_metadata = {
            "processing_time": processing_time,
            "input_tokens": input_tokens,
            "output_tokens": output_tokens,
            "tokens_per_second": tokens_per_second,
            "model": self.model_name,
            "device": self.device,
            "context_used": bool(context)
        }
        
        # Return only the response text
        return generated_text'''
    
    content = re.sub(return_pattern, replacement, content, flags=re.DOTALL)
    
    # Step 3: Add metadata getter method if not present
    if 'def get_generation_metadata' not in content:
        print("🔧 Adding metadata getter method...")
        
        metadata_method = '''
    def get_generation_metadata(self) -> Dict[str, Any]:
        """Get metadata from last generation"""
        return getattr(self, 'last_generation_metadata', {})
'''
        
        # Find the end of the generate_response method and add the new method
        # Look for the next method definition or end of class
        pattern = r'(def generate_response.*?return generated_text\s*\n\s*except.*?raise Exception.*?\n)'
        
        def add_metadata_method(match):
            return match.group(1) + metadata_method
        
        content = re.sub(pattern, add_metadata_method, content, flags=re.DOTALL)
    
    # Step 4: Add necessary imports if not present
    if 'from typing import Dict, Any' not in content and 'Dict[str, Any]' in content:
        print("🔧 Adding typing imports...")
        # Find existing imports and add after them
        import_pattern = r'(from typing import [^\n]*)'
        if re.search(import_pattern, content):
            content = re.sub(import_pattern, r'\1, Dict, Any', content)
        else:
            # Add new import line
            content = re.sub(r'(import [^\n]*\n)', r'\1from typing import Dict, Any\n', content, count=1)
    
    # Write the modified content
    with open(file_path, 'w') as f:
        f.write(content)
    
    print(f"✅ Fixed LLM service return type in {file_path}")
    return True

def validate_fix(file_path: str) -> bool:
    """Validate that the fix was applied correctly"""
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    checks = [
        ('Return type changed', 'def generate_response(' in content and ') -> str:' in content),
        ('Metadata storage added', 'self.last_generation_metadata' in content),
        ('String return added', 'return generated_text' in content),
        ('Metadata getter added', 'def get_generation_metadata' in content)
    ]
    
    print("\n🔍 Validation Results:")
    all_passed = True
    for check_name, passed in checks:
        status = "✅" if passed else "❌"
        print(f"  {status} {check_name}")
        if not passed:
            all_passed = False
    
    return all_passed

def find_llm_service_file(start_dir: str = ".") -> str:
    """Find the LLM service file in common locations"""
    
    common_paths = [
        "llm_service.py",
        "backend/app/services/llm_service.py",
        "backend/services/llm_service.py",
        "app/services/llm_service.py",
        "services/llm_service.py"
    ]
    
    for path in common_paths:
        full_path = os.path.join(start_dir, path)
        if os.path.exists(full_path):
            return full_path
    
    # Search recursively
    for root, dirs, files in os.walk(start_dir):
        if 'llm_service.py' in files:
            return os.path.join(root, 'llm_service.py')
    
    return None

def main():
    print("🔧 Targeted LLM Service Return Type Fix")
    print("=====================================")
    
    # Get file path
    if len(sys.argv) > 1:
        file_path = sys.argv[1]
    else:
        file_path = find_llm_service_file()
        if not file_path:
            print("❌ Could not find llm_service.py file")
            print("Usage: python3 fix_specific_llm_service.py /path/to/llm_service.py")
            return
        print(f"📁 Found LLM service file: {file_path}")
    
    # Apply the fix
    if fix_llm_service_return_type(file_path):
        # Validate the fix
        if validate_fix(file_path):
            print("\n🎉 Fix applied successfully!")
            print("\n🚀 Next steps:")
            print("1. Restart your backend container: docker restart backend-07")
            print("2. Test with a query to verify the fix")
            print("3. Check logs for any remaining errors")
        else:
            print("\n⚠️ Fix may not have been applied correctly. Please check manually.")
    else:
        print("\n❌ Fix failed. Please check the file path and try again.")

if __name__ == "__main__":
    main()


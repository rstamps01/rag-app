#!/usr/bin/env python3
# fix_llm_service_return_type.py

import re

def fix_llm_service_file(file_path):
    """Fix LLM service to return string instead of dict"""
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    # Change return type annotation
    content = re.sub(
        r'def generate_response\((.*?)\) -> Dict\[str, Any\]:',
        r'def generate_response(\1) -> str:',
        content,
        flags=re.DOTALL
    )
    
    # Find the return statement and modify it
    return_pattern = r'return \{[^}]*"response":\s*generated_text[^}]*\}'
    
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
    
    # Add metadata getter method if not present
    if 'def get_generation_metadata' not in content:
        metadata_method = '''
    def get_generation_metadata(self) -> Dict[str, Any]:
        """Get metadata from last generation"""
        return getattr(self, 'last_generation_metadata', {})
'''
        
        # Find end of class and add method
        content = re.sub(
            r'(\n    def generate_embedding_friendly_summary.*?)(\n\nclass|\Z)',
            r'\1' + metadata_method + r'\2',
            content,
            flags=re.DOTALL
        )
    
    # Write back
    with open(file_path, 'w') as f:
        f.write(content)
    
    print(f"✅ Fixed LLM service return type in {file_path}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        fix_llm_service_file(sys.argv[1])
    else:
        print("Usage: python3 fix_llm_service_return_type.py /path/to/llm_service.py")
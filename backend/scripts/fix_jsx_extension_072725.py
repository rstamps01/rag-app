#!/usr/bin/env python3
"""
Fix JSX File Extension Issue
Renames .js files containing JSX to .jsx and updates imports
"""

import os
import glob
import subprocess
from datetime import datetime

def log_message(message):
    """Print timestamped log message"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {message}")

def fix_ui_component_file():
    """Fix the problematic ui/index.js file"""
    
    ui_dir = "/home/vastdata/rag-app-07/frontend/rag-ui-new/src/components/ui"
    js_file = os.path.join(ui_dir, "index.js")
    jsx_file = os.path.join(ui_dir, "index.jsx")
    
    try:
        # Check if the problematic file exists
        if os.path.exists(js_file):
            log_message(f"📁 Found problematic file: {js_file}")
            
            # Read the content
            with open(js_file, 'r') as f:
                content = f.read()
            
            # Check if it contains JSX
            if '<div' in content or 'className=' in content:
                log_message("🔧 File contains JSX, renaming to .jsx...")
                
                # Rename to .jsx
                os.rename(js_file, jsx_file)
                log_message(f"✅ Renamed {js_file} to {jsx_file}")
                
                return True
            else:
                log_message("ℹ️ File doesn't contain JSX, no rename needed")
                return True
        else:
            log_message("ℹ️ Problematic file not found, might already be fixed")
            return True
            
    except Exception as e:
        log_message(f"❌ Failed to fix ui component file: {e}")
        return False

def find_and_fix_js_files_with_jsx():
    """Find all .js files that contain JSX and rename them to .jsx"""
    
    src_dir = "/home/vastdata/rag-app-07/frontend/rag-ui-new/src"
    
    # Find all .js files
    js_files = glob.glob(f"{src_dir}/**/*.js", recursive=True)
    
    fixed_files = []
    
    for js_file in js_files:
        try:
            # Skip node_modules and other non-source files
            if 'node_modules' in js_file or 'dist' in js_file:
                continue
                
            # Read file content
            with open(js_file, 'r') as f:
                content = f.read()
            
            # Check if it contains JSX syntax
            jsx_indicators = ['<div', '<span', '<button', 'className=', 'onClick=', 'return (', 'React.']
            
            if any(indicator in content for indicator in jsx_indicators):
                # This file contains JSX, rename it
                jsx_file = js_file.replace('.js', '.jsx')
                os.rename(js_file, jsx_file)
                fixed_files.append((js_file, jsx_file))
                log_message(f"✅ Renamed: {os.path.basename(js_file)} → {os.path.basename(jsx_file)}")
        
        except Exception as e:
            log_message(f"⚠️ Error processing {js_file}: {e}")
    
    return fixed_files

def update_import_statements(fixed_files):
    """Update import statements to use .jsx extensions"""
    
    src_dir = "/home/vastdata/rag-app-07/frontend/rag-ui-new/src"
    
    # Find all .jsx and .js files that might import the renamed files
    all_files = glob.glob(f"{src_dir}/**/*.jsx", recursive=True) + glob.glob(f"{src_dir}/**/*.js", recursive=True)
    
    for file_path in all_files:
        try:
            # Skip node_modules
            if 'node_modules' in file_path:
                continue
                
            # Read file content
            with open(file_path, 'r') as f:
                content = f.read()
            
            # Update imports for each fixed file
            updated = False
            for old_path, new_path in fixed_files:
                # Extract the import path
                old_import = old_path.replace('/home/vastdata/rag-app-07/frontend/rag-ui-new/src/', '').replace('.js', '')
                new_import = new_path.replace('/home/vastdata/rag-app-07/frontend/rag-ui-new/src/', '').replace('.jsx', '')
                
                # Update import statements
                import_patterns = [
                    f"from './{old_import}'",
                    f"from '../{old_import}'",
                    f"from '../../{old_import}'",
                    f"from './components/ui'",  # Special case for ui/index
                ]
                
                for pattern in import_patterns:
                    if pattern in content:
                        new_pattern = pattern.replace(old_import, new_import)
                        content = content.replace(pattern, new_pattern)
                        updated = True
            
            # Write back if updated
            if updated:
                with open(file_path, 'w') as f:
                    f.write(content)
                log_message(f"✅ Updated imports in: {os.path.basename(file_path)}")
                
        except Exception as e:
            log_message(f"⚠️ Error updating imports in {file_path}: {e}")

def test_build():
    """Test the frontend build"""
    try:
        log_message("🧪 Testing frontend build...")
        
        result = subprocess.run(
            ["npm", "run", "build"],
            cwd="/home/vastdata/rag-app-07/frontend/rag-ui-new",
            capture_output=True,
            text=True,
            timeout=120
        )
        
        if result.returncode == 0:
            log_message("✅ Frontend build successful!")
            return True
        else:
            log_message(f"❌ Frontend build failed:")
            log_message(f"STDERR: {result.stderr}")
            log_message(f"STDOUT: {result.stdout}")
            return False
            
    except subprocess.TimeoutExpired:
        log_message("❌ Frontend build timed out")
        return False
    except Exception as e:
        log_message(f"❌ Failed to test build: {e}")
        return False

def main():
    """Main execution function"""
    print("🔧 Fix JSX File Extension Issues")
    print("=" * 40)
    
    # Step 1: Fix the specific problematic file
    log_message("🔧 Fixing ui/index.js file...")
    if not fix_ui_component_file():
        print("❌ Failed to fix ui component file")
        return
    
    # Step 2: Find and fix all .js files with JSX
    log_message("🔍 Finding all .js files with JSX content...")
    fixed_files = find_and_fix_js_files_with_jsx()
    
    if fixed_files:
        log_message(f"✅ Fixed {len(fixed_files)} files with JSX content")
        
        # Step 3: Update import statements
        log_message("🔄 Updating import statements...")
        update_import_statements(fixed_files)
    else:
        log_message("ℹ️ No additional .js files with JSX found")
    
    # Step 4: Test the build
    log_message("🧪 Testing build...")
    if test_build():
        print("\n🎉 JSX extension fix completed!")
        print("✅ All .js files with JSX renamed to .jsx")
        print("✅ Import statements updated")
        print("✅ Build should now work successfully")
    else:
        print("\n⚠️ Build still has issues")
        print("Check the error messages above for remaining problems")

if __name__ == "__main__":
    main()


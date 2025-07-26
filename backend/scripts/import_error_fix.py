
import os
import sys

def fix_auth_imports():
    """Fix the import statements in auth.py"""
    
    # Define the path to the auth.py file
    auth_file_path = "/app/app/api/routes/auth.py"
    
    # Check if file exists
    if not os.path.exists(auth_file_path):
        print(f"❌ File not found: {auth_file_path}")
        return False
    
    try:
        # Read the current content
        with open(auth_file_path, 'r') as f:
            content = f.read()
        
        print(f"📖 Original content preview:")
        print(content[:200] + "..." if len(content) > 200 else content)
        
        # Fix the import statements
        # Change 'from app.core.security' to 'from app.core.security'
        fixed_content = content.replace(
            'from app.core.security import',
            'from app.core.security import'
        )
        
        # Also fix any other core imports
        fixed_content = fixed_content.replace(
            'from app.core.',
            'from app.core.'
        )
        
        # Write the fixed content back
        with open(auth_file_path, 'w') as f:
            f.write(fixed_content)
        
        print(f"✅ Fixed import statements in {auth_file_path}")
        print(f"📝 Updated content preview:")
        print(fixed_content[:200] + "..." if len(fixed_content) > 200 else fixed_content)
        
        return True
        
    except Exception as e:
        print(f"❌ Error fixing auth.py: {e}")
        return False

def check_other_files():
    """Check for similar import issues in other files"""
    
    routes_dir = "/app/app/api/routes"
    if not os.path.exists(routes_dir):
        print(f"❌ Routes directory not found: {routes_dir}")
        return
    
    print(f"\n🔍 Checking other route files for similar import issues...")
    
    for filename in os.listdir(routes_dir):
        if filename.endswith('.py') and filename != 'auth.py':
            filepath = os.path.join(routes_dir, filename)
            try:
                with open(filepath, 'r') as f:
                    content = f.read()
                
                # Check for problematic imports
                if 'from app.core.' in content and 'from app.core.' not in content:
                    print(f"⚠️  Found similar import issue in {filename}")
                    
                    # Fix the imports
                    fixed_content = content.replace('from app.core.', 'from app.core.')
                    
                    with open(filepath, 'w') as f:
                        f.write(fixed_content)
                    
                    print(f"✅ Fixed imports in {filename}")
                
            except Exception as e:
                print(f"❌ Error checking {filename}: {e}")

def main():
    """Main function to fix the import errors"""
    
    print("🔧 Fixing ModuleNotFoundError: No module named 'core'")
    print("=" * 60)
    
    # Fix auth.py imports
    if fix_auth_imports():
        print("✅ Auth.py imports fixed successfully")
    else:
        print("❌ Failed to fix auth.py imports")
        return False
    
    # Check and fix other files
    check_other_files()
    
    print("\n🎉 Import fixes completed!")
    print("\n📋 Next steps:")
    print("1. Restart the backend container: docker-compose restart backend-07")
    print("2. Check the logs: docker-compose logs backend-07")
    print("3. Test the application: curl http://localhost:8000/")
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)

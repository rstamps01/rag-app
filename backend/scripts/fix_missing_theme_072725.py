#!/usr/bin/env python3
"""
Fix Missing Theme Import
Creates missing theme file and fixes import issues
"""

import os
import subprocess
from datetime import datetime

def log_message(message):
    """Print timestamped log message"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {message}")

def create_theme_file():
    """Create the missing theme file"""
    
    theme_content = '''// Theme configuration for RAG Application
// Consistent dark theme matching Pipeline Monitor design

export const theme = {
  colors: {
    // Background colors
    background: {
      primary: 'bg-gray-900',
      secondary: 'bg-gray-800',
      tertiary: 'bg-gray-700',
    },
    
    // Text colors
    text: {
      primary: 'text-white',
      secondary: 'text-gray-300',
      muted: 'text-gray-400',
    },
    
    // Accent colors
    accent: {
      primary: 'text-blue-400',
      secondary: 'text-green-400',
      warning: 'text-yellow-400',
      error: 'text-red-400',
    },
    
    // Border colors
    border: {
      primary: 'border-gray-700',
      secondary: 'border-gray-600',
      accent: 'border-blue-500',
    }
  },
  
  components: {
    // Card component styles
    card: 'bg-gray-800 border border-gray-700 rounded-lg shadow-lg',
    
    // Button styles
    button: {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors duration-200',
      secondary: 'bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors duration-200',
      outline: 'border border-gray-600 hover:border-gray-500 text-gray-300 hover:text-white px-4 py-2 rounded-md transition-colors duration-200',
    },
    
    // Input styles
    input: 'bg-gray-700 border border-gray-600 text-white placeholder-gray-400 px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent',
    
    // Navigation styles
    nav: {
      background: 'bg-gray-800 border-b border-gray-700',
      link: 'text-gray-300 hover:bg-gray-700 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200',
      activeLink: 'bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium',
    }
  },
  
  layout: {
    container: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8',
    section: 'py-8',
    grid: 'grid gap-6',
  }
};

export default theme;
'''
    
    return theme_content

def create_styles_directory():
    """Create styles directory and theme file"""
    
    styles_dir = "/home/vastdata/rag-app-07/frontend/rag-ui-new/src/styles"
    theme_file = os.path.join(styles_dir, "theme.js")
    
    try:
        # Create styles directory
        os.makedirs(styles_dir, exist_ok=True)
        log_message(f"✅ Created directory: {styles_dir}")
        
        # Create theme file
        theme_content = create_theme_file()
        with open(theme_file, 'w') as f:
            f.write(theme_content)
        log_message(f"✅ Created theme file: {theme_file}")
        
        return True
        
    except Exception as e:
        log_message(f"❌ Failed to create theme file: {e}")
        return False

def fix_ui_component():
    """Fix the UI component to use the correct theme import"""
    
    ui_file = "/home/vastdata/rag-app-07/frontend/rag-ui-new/src/components/ui/index.jsx"
    
    # Create a simple UI component that works
    ui_content = '''import React from 'react';
import theme from '../../styles/theme';

// Card Component
export const Card = ({ children, className = '', ...props }) => (
    <div className={`${theme.components.card} p-4 ${className}`} {...props}>
        {children}
    </div>
);

// Button Component
export const Button = ({ children, variant = 'primary', className = '', ...props }) => (
    <button className={`${theme.components.button[variant]} ${className}`} {...props}>
        {children}
    </button>
);

// Input Component
export const Input = ({ className = '', ...props }) => (
    <input className={`${theme.components.input} ${className}`} {...props} />
);

// Container Component
export const Container = ({ children, className = '', ...props }) => (
    <div className={`${theme.layout.container} ${className}`} {...props}>
        {children}
    </div>
);

// Section Component
export const Section = ({ children, className = '', ...props }) => (
    <div className={`${theme.layout.section} ${className}`} {...props}>
        {children}
    </div>
);

// Export theme for direct use
export { theme };

// Default export
export default {
    Card,
    Button,
    Input,
    Container,
    Section,
    theme
};
'''
    
    try:
        with open(ui_file, 'w') as f:
            f.write(ui_content)
        log_message(f"✅ Fixed UI component: {ui_file}")
        return True
        
    except Exception as e:
        log_message(f"❌ Failed to fix UI component: {e}")
        return False

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
            return False
            
    except subprocess.TimeoutExpired:
        log_message("❌ Frontend build timed out")
        return False
    except Exception as e:
        log_message(f"❌ Failed to test build: {e}")
        return False

def main():
    """Main execution function"""
    print("🎨 Fix Missing Theme Import")
    print("=" * 30)
    
    # Step 1: Create styles directory and theme file
    log_message("📁 Creating styles directory and theme file...")
    if not create_styles_directory():
        print("❌ Failed to create theme file")
        return
    
    # Step 2: Fix UI component
    log_message("🔧 Fixing UI component...")
    if not fix_ui_component():
        print("❌ Failed to fix UI component")
        return
    
    # Step 3: Test the build
    log_message("🧪 Testing build...")
    if test_build():
        print("\n🎉 Theme import fix completed!")
        print("✅ Theme file created")
        print("✅ UI component fixed")
        print("✅ Build should now work successfully")
        print("\n🎨 Theme Features Added:")
        print("  • Consistent dark theme (gray-900/800)")
        print("  • Blue accent colors")
        print("  • Professional component styles")
        print("  • Responsive layout utilities")
    else:
        print("\n⚠️ Build still has issues")
        print("Check the error messages above for remaining problems")

if __name__ == "__main__":
    main()


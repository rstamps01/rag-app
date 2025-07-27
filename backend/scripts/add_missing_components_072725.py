#!/usr/bin/env python3
"""
Add Missing UI Components
Adds Alert and other missing components to the UI library
"""

import os
import subprocess
from datetime import datetime

def log_message(message):
    """Print timestamped log message"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {message}")

def create_complete_ui_components():
    """Create complete UI component library with all needed components"""
    
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

// Alert Component
export const Alert = ({ children, type = 'info', className = '', ...props }) => {
    const alertStyles = {
        info: 'bg-blue-900 border-blue-700 text-blue-200',
        success: 'bg-green-900 border-green-700 text-green-200',
        warning: 'bg-yellow-900 border-yellow-700 text-yellow-200',
        error: 'bg-red-900 border-red-700 text-red-200'
    };
    
    return (
        <div className={`border rounded-lg p-4 ${alertStyles[type]} ${className}`} {...props}>
            {children}
        </div>
    );
};

// Badge Component
export const Badge = ({ children, variant = 'default', className = '', ...props }) => {
    const badgeStyles = {
        default: 'bg-gray-700 text-gray-200',
        success: 'bg-green-600 text-white',
        warning: 'bg-yellow-600 text-white',
        error: 'bg-red-600 text-white',
        info: 'bg-blue-600 text-white'
    };
    
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badgeStyles[variant]} ${className}`} {...props}>
            {children}
        </span>
    );
};

// Progress Component
export const Progress = ({ value = 0, max = 100, className = '', ...props }) => (
    <div className={`w-full bg-gray-700 rounded-full h-2.5 ${className}`} {...props}>
        <div 
            className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
            style={{ width: `${(value / max) * 100}%` }}
        ></div>
    </div>
);

// Spinner Component
export const Spinner = ({ size = 'md', className = '', ...props }) => {
    const sizeStyles = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6',
        lg: 'w-8 h-8'
    };
    
    return (
        <div className={`animate-spin rounded-full border-2 border-gray-300 border-t-blue-600 ${sizeStyles[size]} ${className}`} {...props}></div>
    );
};

// Modal Component
export const Modal = ({ isOpen, onClose, children, className = '', ...props }) => {
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                    <div className="absolute inset-0 bg-gray-900 opacity-75" onClick={onClose}></div>
                </div>
                
                <div className={`inline-block align-bottom bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ${className}`} {...props}>
                    {children}
                </div>
            </div>
        </div>
    );
};

// Dropdown Component
export const Dropdown = ({ options = [], value, onChange, placeholder = 'Select...', className = '', ...props }) => (
    <select 
        className={`${theme.components.input} ${className}`}
        value={value}
        onChange={(e) => onChange && onChange(e.target.value)}
        {...props}
    >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((option, index) => (
            <option key={index} value={option.value || option}>
                {option.label || option}
            </option>
        ))}
    </select>
);

// Textarea Component
export const Textarea = ({ className = '', ...props }) => (
    <textarea className={`${theme.components.input} resize-vertical ${className}`} {...props} />
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

// Grid Component
export const Grid = ({ children, cols = 1, gap = 6, className = '', ...props }) => {
    const gridCols = {
        1: 'grid-cols-1',
        2: 'grid-cols-1 md:grid-cols-2',
        3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
    };
    
    return (
        <div className={`grid ${gridCols[cols]} gap-${gap} ${className}`} {...props}>
            {children}
        </div>
    );
};

// Loading Component
export const Loading = ({ text = 'Loading...', className = '', ...props }) => (
    <div className={`flex items-center justify-center space-x-2 ${className}`} {...props}>
        <Spinner />
        <span className="text-gray-300">{text}</span>
    </div>
);

// Export theme for direct use
export { theme };

// Default export
export default {
    Card,
    Button,
    Input,
    Alert,
    Badge,
    Progress,
    Spinner,
    Modal,
    Dropdown,
    Textarea,
    Container,
    Section,
    Grid,
    Loading,
    theme
};
'''
    
    return ui_content

def update_ui_components():
    """Update the UI components file with all missing components"""
    
    ui_file = "/home/vastdata/rag-app-07/frontend/rag-ui-new/src/components/ui/index.jsx"
    
    try:
        ui_content = create_complete_ui_components()
        with open(ui_file, 'w') as f:
            f.write(ui_content)
        log_message(f"✅ Updated UI components: {ui_file}")
        return True
        
    except Exception as e:
        log_message(f"❌ Failed to update UI components: {e}")
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
    print("🧩 Add Missing UI Components")
    print("=" * 35)
    
    # Step 1: Update UI components with all missing components
    log_message("🔧 Adding missing UI components...")
    if not update_ui_components():
        print("❌ Failed to update UI components")
        return
    
    # Step 2: Test the build
    log_message("🧪 Testing build...")
    if test_build():
        print("\n🎉 Missing components fix completed!")
        print("✅ Alert component added")
        print("✅ Badge, Progress, Spinner components added")
        print("✅ Modal, Dropdown, Textarea components added")
        print("✅ Grid, Loading components added")
        print("✅ Build should now work successfully")
        print("\n🧩 UI Components Available:")
        print("  • Card, Button, Input")
        print("  • Alert (info, success, warning, error)")
        print("  • Badge, Progress, Spinner")
        print("  • Modal, Dropdown, Textarea")
        print("  • Container, Section, Grid")
        print("  • Loading with spinner")
    else:
        print("\n⚠️ Build still has issues")
        print("Check the error messages above for remaining problems")

if __name__ == "__main__":
    main()


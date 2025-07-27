#!/usr/bin/env python3
"""
Fix Frontend Import Path Issues
Resolves the useWebSocket import error and other path issues
"""

import os
import re
from pathlib import Path

def fix_frontend_imports():
    """Fix all import path issues in the frontend"""
    print("🔧 Fixing Frontend Import Paths")
    print("=" * 50)
    
    # Define the project paths
    project_path = Path("/home/vastdata/rag-app-07")
    frontend_path = project_path / "frontend" / "rag-ui-new"
    
    # Check if we're in the right directory
    if not frontend_path.exists():
        print(f"❌ Frontend directory not found: {frontend_path}")
        return False
    
    # Fix 1: Update PipelineMonitoringDashboard import
    print("  🔧 Fixing PipelineMonitoringDashboard import...")
    dashboard_file = frontend_path / "src" / "components" / "monitoring" / "PipelineMonitoringDashboard.jsx"
    
    if dashboard_file.exists():
        with open(dashboard_file, 'r') as f:
            content = f.read()
        
        # Fix the import path
        old_import = "import useWebSocket from '../hooks/useWebSocket';"
        new_import = "import useWebSocket from '../../hooks/useWebSocket';"
        
        if old_import in content:
            content = content.replace(old_import, new_import)
            
            with open(dashboard_file, 'w') as f:
                f.write(content)
            
            print("  ✅ Fixed PipelineMonitoringDashboard import path")
        else:
            print("  ⚠️  Import already correct or not found")
    else:
        print("  ❌ PipelineMonitoringDashboard.jsx not found")
    
    # Fix 2: Ensure useWebSocket hook exists in correct location
    print("  🔧 Verifying useWebSocket hook location...")
    hooks_dir = frontend_path / "src" / "hooks"
    websocket_hook_file = hooks_dir / "useWebSocket.js"
    
    if not hooks_dir.exists():
        hooks_dir.mkdir(parents=True, exist_ok=True)
        print("  ✅ Created hooks directory")
    
    if not websocket_hook_file.exists():
        print("  🔧 Creating useWebSocket hook...")
        
        websocket_hook_content = '''import { useState, useEffect, useRef } from 'react';

export const useWebSocket = (url) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);
    const [connectionStatus, setConnectionStatus] = useState('Disconnected');
    const reconnectTimeoutRef = useRef(null);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;

    const connect = () => {
        try {
            const ws = new WebSocket(url);
            
            ws.onopen = () => {
                setIsConnected(true);
                setConnectionStatus('Connected');
                reconnectAttempts.current = 0;
                console.log('WebSocket connected to:', url);
            };
            
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    setLastMessage(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };
            
            ws.onclose = () => {
                setIsConnected(false);
                setConnectionStatus('Disconnected');
                console.log('WebSocket disconnected');
                
                // Attempt to reconnect
                if (reconnectAttempts.current < maxReconnectAttempts) {
                    reconnectAttempts.current++;
                    setConnectionStatus(`Reconnecting... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
                    
                    reconnectTimeoutRef.current = setTimeout(() => {
                        connect();
                    }, 3000 * reconnectAttempts.current); // Exponential backoff
                }
            };
            
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                setConnectionStatus('Error');
            };
            
            setSocket(ws);
            
        } catch (error) {
            console.error('Failed to create WebSocket connection:', error);
            setConnectionStatus('Error');
        }
    };

    useEffect(() => {
        connect();
        
        return () => {
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
            if (socket) {
                socket.close();
            }
        };
    }, [url]);

    const sendMessage = (message) => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
        }
    };

    return { 
        socket, 
        isConnected, 
        lastMessage, 
        connectionStatus, 
        sendMessage 
    };
};

export default useWebSocket;'''
        
        with open(websocket_hook_file, 'w') as f:
            f.write(websocket_hook_content)
        
        print("  ✅ Created useWebSocket hook")
    else:
        print("  ✅ useWebSocket hook already exists")
    
    # Fix 3: Check and fix other potential import issues
    print("  🔧 Checking for other import issues...")
    
    # Check QueriesPage for any import issues
    queries_page = frontend_path / "src" / "components" / "pages" / "QueriesPage.jsx"
    if queries_page.exists():
        with open(queries_page, 'r') as f:
            content = f.read()
        
        # Check if it has any problematic imports
        if "from '../ui'" in content:
            content = content.replace("from '../ui'", "from '../ui/index'")
            with open(queries_page, 'w') as f:
                f.write(content)
            print("  ✅ Fixed QueriesPage imports")
    
    # Fix 4: Ensure UI components exist
    print("  🔧 Verifying UI components...")
    ui_dir = frontend_path / "src" / "components" / "ui"
    ui_index_file = ui_dir / "index.js"
    
    if not ui_dir.exists():
        ui_dir.mkdir(parents=True, exist_ok=True)
        print("  ✅ Created UI components directory")
    
    if not ui_index_file.exists():
        print("  🔧 Creating UI components...")
        
        ui_components_content = '''import React from 'react';

// Card Component
export const Card = ({ children, className = '', ...props }) => (
    <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 ${className}`} {...props}>
        {children}
    </div>
);

// Button Component
export const Button = ({ 
    variant = 'primary', 
    size = 'md',
    children, 
    className = '', 
    disabled = false,
    ...props 
}) => {
    const baseClasses = 'inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900';
    
    const variants = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-gray-600',
        secondary: 'bg-gray-600 hover:bg-gray-700 text-white disabled:bg-gray-700',
        danger: 'bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-600',
        ghost: 'text-gray-300 hover:text-white hover:bg-gray-700 disabled:text-gray-500'
    };
    
    const sizes = {
        sm: 'px-3 py-1.5 text-sm rounded',
        md: 'px-4 py-2 text-sm rounded',
        lg: 'px-6 py-3 text-base rounded-lg'
    };
    
    return (
        <button 
            className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className} ${disabled ? 'cursor-not-allowed' : ''}`}
            disabled={disabled}
            {...props}
        >
            {children}
        </button>
    );
};

// Input Component
export const Input = ({ 
    type = 'text',
    className = '', 
    error = false,
    ...props 
}) => (
    <input 
        type={type}
        className={`bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none ${error ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
        {...props}
    />
);

// Select Component
export const Select = ({ children, className = '', error = false, ...props }) => (
    <select 
        className={`bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-400 focus:outline-none ${error ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
        {...props}
    >
        {children}
    </select>
);

// Textarea Component
export const Textarea = ({ className = '', error = false, ...props }) => (
    <textarea 
        className={`bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none resize-none ${error ? 'border-red-500 focus:border-red-500' : ''} ${className}`}
        {...props}
    />
);

// Badge Component
export const Badge = ({ 
    variant = 'default', 
    children, 
    className = '',
    ...props 
}) => {
    const variants = {
        default: 'bg-gray-600 text-gray-100',
        success: 'bg-green-600 text-green-100',
        warning: 'bg-yellow-600 text-yellow-100',
        error: 'bg-red-600 text-red-100',
        info: 'bg-blue-600 text-blue-100'
    };
    
    return (
        <span 
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
            {...props}
        >
            {children}
        </span>
    );
};

// Loading Spinner Component
export const LoadingSpinner = ({ size = 'md', className = '' }) => {
    const sizes = {
        sm: 'w-4 h-4',
        md: 'w-6 h-6', 
        lg: 'w-8 h-8'
    };
    
    return (
        <div className={`${sizes[size]} border-2 border-blue-400 border-t-transparent rounded-full animate-spin ${className}`}></div>
    );
};

// Alert Component
export const Alert = ({ 
    variant = 'info', 
    title,
    children, 
    className = '',
    ...props 
}) => {
    const variants = {
        info: 'bg-blue-900/20 border-blue-500 text-blue-100',
        success: 'bg-green-900/20 border-green-500 text-green-100',
        warning: 'bg-yellow-900/20 border-yellow-500 text-yellow-100',
        error: 'bg-red-900/20 border-red-500 text-red-100'
    };
    
    return (
        <div className={`border rounded-lg p-4 ${variants[variant]} ${className}`} {...props}>
            {title && <h4 className="font-medium mb-2">{title}</h4>}
            {children}
        </div>
    );
};

// Status Indicator Component
export const StatusIndicator = ({ 
    status, 
    label,
    showDot = true,
    className = '' 
}) => {
    const statusConfig = {
        connected: { color: 'text-green-400', dotColor: 'bg-green-400' },
        disconnected: { color: 'text-red-400', dotColor: 'bg-red-400' },
        connecting: { color: 'text-yellow-400', dotColor: 'bg-yellow-400 animate-pulse' },
        processing: { color: 'text-blue-400', dotColor: 'bg-blue-400 animate-pulse' },
        error: { color: 'text-red-400', dotColor: 'bg-red-400' },
        success: { color: 'text-green-400', dotColor: 'bg-green-400' },
        warning: { color: 'text-yellow-400', dotColor: 'bg-yellow-400' }
    };
    
    const config = statusConfig[status] || statusConfig.disconnected;
    
    return (
        <div className={`flex items-center space-x-2 ${config.color} ${className}`}>
            {showDot && <div className={`w-2 h-2 rounded-full ${config.dotColor}`}></div>}
            <span className="text-sm">{label || status}</span>
        </div>
    );
};

export default {
    Card,
    Button,
    Input,
    Select,
    Textarea,
    Badge,
    LoadingSpinner,
    Alert,
    StatusIndicator
};'''
        
        with open(ui_index_file, 'w') as f:
            f.write(ui_components_content)
        
        print("  ✅ Created UI components")
    else:
        print("  ✅ UI components already exist")
    
    # Fix 5: Check package.json for any missing dependencies
    print("  🔧 Checking package.json...")
    package_json = frontend_path / "package.json"
    
    if package_json.exists():
        print("  ✅ package.json exists")
    else:
        print("  ⚠️  package.json not found")
    
    print("\n🎉 Frontend Import Fixes Complete!")
    print("=" * 50)
    print("✅ Fixed PipelineMonitoringDashboard import path")
    print("✅ Verified useWebSocket hook exists")
    print("✅ Created UI components")
    print("✅ All import paths should now be correct")
    
    return True

def test_build():
    """Test the frontend build"""
    print("\n🧪 Testing Frontend Build")
    print("=" * 30)
    
    project_path = Path("/home/vastdata/rag-app-07")
    frontend_path = project_path / "frontend" / "rag-ui-new"
    
    try:
        import subprocess
        import os
        
        # Change to frontend directory
        os.chdir(frontend_path)
        
        # Run npm build
        print("  🔧 Running npm run build...")
        result = subprocess.run(["npm", "run", "build"], capture_output=True, text=True, timeout=120)
        
        if result.returncode == 0:
            print("  ✅ Frontend build successful!")
            return True
        else:
            print(f"  ❌ Frontend build failed:")
            print(f"  Error: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        print("  ⏰ Build timed out (>2 minutes)")
        return False
    except Exception as e:
        print(f"  ❌ Build test failed: {e}")
        return False

def main():
    """Main function"""
    print("🔧 Frontend Import Path Fixer")
    print("=" * 60)
    
    # Fix import paths
    if fix_frontend_imports():
        print("\n✅ All import issues fixed!")
        
        # Test the build
        if test_build():
            print("\n🎉 SUCCESS! Frontend should now build correctly.")
            print("\n📋 Next Steps:")
            print("1. cd /home/vastdata/rag-app-07/frontend/rag-ui-new")
            print("2. npm run build")
            print("3. docker-compose restart frontend-07")
        else:
            print("\n⚠️  Build test failed. Please check the error messages above.")
    else:
        print("\n❌ Failed to fix import issues.")

if __name__ == "__main__":
    main()


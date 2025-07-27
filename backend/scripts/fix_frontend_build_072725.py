#!/usr/bin/env python3
"""
Fix Frontend Build Issues
Creates missing components and fixes import paths
"""

import os
import subprocess
from datetime import datetime

def log_message(message):
    """Print timestamped log message"""
    timestamp = datetime.now().strftime("%H:%M:%S")
    print(f"[{timestamp}] {message}")

def create_missing_navbar():
    """Create the missing Navbar component"""
    
    navbar_content = '''import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navbar = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/documents', label: 'Documents' },
    { path: '/queries', label: 'Queries' },
    { path: '/monitoring', label: 'Pipeline Monitor' },
    { path: '/test', label: 'Test Page' }
  ];

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <nav className="bg-gray-800 border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="text-white text-xl font-bold">
              RAG AI Application
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                    isActive(item.path)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="bg-gray-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden" id="mobile-menu">
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                isActive(item.path)
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
'''
    
    return navbar_content

def create_missing_layout():
    """Create the Layout component if missing"""
    
    layout_content = '''import React from 'react';
import Navbar from './Navbar';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

export default Layout;
'''
    
    return layout_content

def create_missing_home_page():
    """Create a basic Home page component"""
    
    home_content = '''import React from 'react';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-8">
            Welcome to your GPU-accelerated RAG AI application
          </h1>
          <p className="text-xl text-gray-300 mb-12">
            Use the navigation links above to manage documents, run queries, or monitor the pipeline.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
            {/* Documents Card */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-blue-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Documents</h3>
              <p className="text-gray-400">Upload and manage your documents for AI processing</p>
            </div>

            {/* Queries Card */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-green-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Queries</h3>
              <p className="text-gray-400">Ask questions and get AI-powered responses</p>
            </div>

            {/* Pipeline Monitor Card */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <div className="text-purple-400 mb-4">
                <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Pipeline Monitor</h3>
              <p className="text-gray-400">Monitor real-time system performance and metrics</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
'''
    
    return home_content

def fix_app_jsx():
    """Fix the App.jsx file with correct imports"""
    
    app_content = '''import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './components/pages/HomePage';
import QueriesPage from './components/pages/QueriesPage';
import DocumentsPage from './components/pages/DocumentsPage';
import PipelineMonitoringDashboard from './components/monitoring/PipelineMonitoringDashboard';
import TestPage from './components/monitoring/TestPage';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/queries" element={<QueriesPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/monitoring" element={<PipelineMonitoringDashboard />} />
          <Route path="/test" element={<TestPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
'''
    
    return app_content

def create_directories_and_files():
    """Create all necessary directories and files"""
    
    base_path = "/home/vastdata/rag-app-07/frontend/rag-ui-new/src"
    
    # Create directory structure
    directories = [
        f"{base_path}/components",
        f"{base_path}/components/layout",
        f"{base_path}/components/pages",
        f"{base_path}/components/monitoring",
        f"{base_path}/hooks"
    ]
    
    for directory in directories:
        os.makedirs(directory, exist_ok=True)
        log_message(f"✅ Created directory: {directory}")
    
    # Create files
    files_to_create = [
        (f"{base_path}/components/layout/Navbar.jsx", create_missing_navbar()),
        (f"{base_path}/components/layout/Layout.jsx", create_missing_layout()),
        (f"{base_path}/components/pages/HomePage.jsx", create_missing_home_page()),
        (f"{base_path}/App.jsx", fix_app_jsx())
    ]
    
    for file_path, content in files_to_create:
        try:
            with open(file_path, 'w') as f:
                f.write(content)
            log_message(f"✅ Created file: {file_path}")
        except Exception as e:
            log_message(f"❌ Failed to create {file_path}: {e}")

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
            log_message(f"❌ Frontend build failed: {result.stderr}")
            return False
            
    except subprocess.TimeoutExpired:
        log_message("❌ Frontend build timed out")
        return False
    except Exception as e:
        log_message(f"❌ Failed to test build: {e}")
        return False

def main():
    """Main execution function"""
    print("🔧 Fix Frontend Build Issues")
    print("=" * 35)
    
    # Step 1: Create missing directories and files
    log_message("📁 Creating missing components...")
    create_directories_and_files()
    
    # Step 2: Test the build
    log_message("🧪 Testing build...")
    if test_build():
        print("\n🎉 Frontend build fix completed!")
        print("✅ All missing components created")
        print("✅ Build should now work successfully")
        print("✅ Ready to run the application")
    else:
        print("\n⚠️ Build still has issues")
        print("Check the error messages above for remaining problems")

if __name__ == "__main__":
    main()


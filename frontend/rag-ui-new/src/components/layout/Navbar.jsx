import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Monitor, Zap, FileText, TestTube, Network, Database, Shield } from 'lucide-react';

const Navbar = () => {
  const location = useLocation();
  const [isDashboardsOpen, setIsDashboardsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/documents', label: 'Documents' },
    { path: '/queries', label: 'Queries' },
    { path: '/admin', label: 'Admin', icon: Shield }
  ];

  const dashboardItems = [
    { 
      path: '/monitoring', 
      label: 'Pipeline Monitor', 
      icon: Monitor,
      description: 'Real-time pipeline monitoring with debug console'
    },
    { 
      path: '/dynamic-pipeline', 
      label: 'Dynamic Pipeline', 
      icon: Zap,
      description: 'Interactive pipeline visualization'
    },
    { 
      path: '/documentation-processing', 
      label: 'Documentation Processing', 
      icon: FileText,
      description: 'Document processing workflow'
    },
    { 
      path: '/test', 
      label: 'Test Page', 
      icon: TestTube,
      description: 'Testing and development tools'
    },
    { 
      path: '/qdrant-dashboard', 
      label: 'Qdrant Dashboard', 
      icon: Network,
      description: 'Vector database visualization and monitoring'
    },
    { 
      path: '/qdrant-advanced', 
      label: 'Qdrant Flow Dashboard', 
      icon: Network,
      description: 'Interactive React Flow visualization with real-time data'
    },
    { 
      path: '/database-dashboard', 
      label: 'Database Dashboard', 
      icon: Database,
      description: 'PostgreSQL & Qdrant comprehensive monitoring'
    }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDashboardsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const isDashboardActive = () => {
    return dashboardItems.some(item => isActive(item.path));
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
              {navItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1 ${
                      isActive(item.path)
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    {Icon && <Icon className="w-4 h-4" />}
                    <span>{item.label}</span>
                  </Link>
                );
              })}
              
              {/* Dashboards Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setIsDashboardsOpen(!isDashboardsOpen)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 flex items-center space-x-1 ${
                    isDashboardActive()
                      ? 'text-white'
                      : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <span>Dashboards</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${
                    isDashboardsOpen ? 'rotate-180' : ''
                  }`} />
                </button>

                {/* Dropdown Menu */}
                {isDashboardsOpen && (
                  <div className="absolute top-full left-0 mt-1 w-80 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-50">
                    <div className="p-2">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2">
                        Available Dashboards
                      </div>
                      {dashboardItems.map((item) => {
                        const Icon = item.icon;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setIsDashboardsOpen(false)}
                            className={`flex items-start space-x-3 px-3 py-3 rounded-lg transition-colors duration-200 ${
                              isActive(item.path)
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                            }`}
                          >
                            <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium">{item.label}</div>
                              <div className="text-xs text-gray-400 mt-1">{item.description}</div>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
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
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                  isActive(item.path)
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {Icon && <Icon className="w-4 h-4" />}
                <span>{item.label}</span>
              </Link>
            );
          })}
          
          {/* Mobile Dashboard Items */}
          <div className="border-t border-gray-700 pt-2 mt-2">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-3">
              Dashboards
            </div>
            {dashboardItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-start space-x-3 px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    isActive(item.path)
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 mt-0.5 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div>{item.label}</div>
                    <div className="text-xs text-gray-400 mt-1">{item.description}</div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;

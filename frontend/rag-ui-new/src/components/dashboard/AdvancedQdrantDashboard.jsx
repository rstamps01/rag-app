/**
 * Advanced Qdrant Dashboard Component
 * 
 * Enhanced dashboard with multiple Qdrant visualizations and real-time metrics
 */

import React, { useState, useEffect } from 'react';
import { QDRANT_URL } from '../../config';
import { 
  Database, 
  BarChart3, 
  Eye, 
  RefreshCw, 
  ExternalLink, 
  Settings,
  TrendingUp,
  Activity,
  Layers,
  Search,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

const AdvancedQdrantDashboard = () => {
  const [activeView, setActiveView] = useState('graph');
  const [isLoading, setIsLoading] = useState(false);
  const [qdrantStatus, setQdrantStatus] = useState('unknown');
  const [collectionInfo, setCollectionInfo] = useState(null);
  const [collections, setCollections] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [selectedCollection, setSelectedCollection] = useState('rag');

  // Qdrant configuration
  const qdrantBaseUrl = QDRANT_URL;
  const dashboardUrls = {
    graph: `${qdrantBaseUrl}/dashboard#/collections/${selectedCollection}/graph`,
    visualize: `${qdrantBaseUrl}/dashboard#/collections/${selectedCollection}/visualize`,
    collections: `${qdrantBaseUrl}/dashboard#/collections`,
    metrics: `${qdrantBaseUrl}/dashboard#/metrics`,
    search: `${qdrantBaseUrl}/dashboard#/collections/${selectedCollection}/search`
  };

  // Check Qdrant status and fetch data
  useEffect(() => {
    checkQdrantStatus();
    fetchCollections();
    fetchCollectionInfo();
    fetchMetrics();
  }, [selectedCollection]);

  const checkQdrantStatus = async () => {
    try {
      const response = await fetch(`${qdrantBaseUrl}/health`);
      const data = await response.json();
      setQdrantStatus(data.title === 'ok' ? 'healthy' : 'unhealthy');
    } catch (error) {
      console.error('Error checking Qdrant status:', error);
      setQdrantStatus('unreachable');
    }
  };

  const fetchCollections = async () => {
    try {
      const response = await fetch(`${qdrantBaseUrl}/collections`);
      const data = await response.json();
      setCollections(data.result?.collections || []);
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const fetchCollectionInfo = async () => {
    try {
      const response = await fetch(`${qdrantBaseUrl}/collections/${selectedCollection}`);
      const data = await response.json();
      setCollectionInfo(data.result);
    } catch (error) {
      console.error('Error fetching collection info:', error);
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`${qdrantBaseUrl}/metrics`);
      const data = await response.text();
      setMetrics(parsePrometheusMetrics(data));
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  };

  const parsePrometheusMetrics = (metricsText) => {
    const lines = metricsText.split('\n');
    const parsed = {};
    
    lines.forEach(line => {
      if (line && !line.startsWith('#')) {
        const [metric, value] = line.split(' ');
        if (metric && value) {
          parsed[metric] = parseFloat(value);
        }
      }
    });
    
    return parsed;
  };

  const handleRefresh = () => {
    setIsLoading(true);
    checkQdrantStatus();
    fetchCollections();
    fetchCollectionInfo();
    fetchMetrics();
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleViewChange = (view) => {
    setActiveView(view);
  };

  const handleCollectionChange = (collection) => {
    setSelectedCollection(collection);
  };

  const openInNewTab = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'unhealthy': return 'text-yellow-400';
      case 'unreachable': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-4 h-4" />;
      case 'unhealthy': return <AlertCircle className="w-4 h-4" />;
      case 'unreachable': return <AlertCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Database className="w-8 h-8 text-purple-400" />
            <div>
              <h1 className="text-2xl font-bold">Advanced Qdrant Dashboard</h1>
              <p className="text-gray-400">Vector database monitoring, visualization, and analytics</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Status Indicator */}
            <div className={`flex items-center space-x-2 ${getStatusColor(qdrantStatus)}`}>
              {getStatusIcon(qdrantStatus)}
              <span className="text-sm font-medium">
                {qdrantStatus === 'healthy' ? 'Connected' : 
                 qdrantStatus === 'unhealthy' ? 'Warning' : 'Disconnected'}
              </span>
            </div>
            
            {/* Collection Selector */}
            <select
              value={selectedCollection}
              onChange={(e) => handleCollectionChange(e.target.value)}
              className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm"
            >
              {collections.map((collection) => (
                <option key={collection.name} value={collection.name}>
                  {collection.name}
                </option>
              ))}
            </select>
            
            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={isLoading}
              className="flex items-center space-x-2 px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 rounded-md transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="px-6">
          <nav className="flex space-x-8">
            {[
              { id: 'graph', label: 'Collection Graph', icon: BarChart3 },
              { id: 'visualize', label: 'Vector Visualization', icon: Eye },
              { id: 'search', label: 'Search Interface', icon: Search },
              { id: 'collections', label: 'All Collections', icon: Database },
              { id: 'metrics', label: 'Metrics', icon: TrendingUp }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => handleViewChange(id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeView === id
                    ? 'border-purple-400 text-purple-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Collection Stats Panel */}
      {collectionInfo && (
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400">Collection</div>
              <div className="text-lg font-semibold">{collectionInfo.name || selectedCollection}</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400">Total Vectors</div>
              <div className="text-lg font-semibold">
                {collectionInfo.points_count?.toLocaleString() || '0'}
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400">Indexed Vectors</div>
              <div className="text-lg font-semibold">
                {collectionInfo.indexed_vectors_count?.toLocaleString() || '0'}
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400">Vector Size</div>
              <div className="text-lg font-semibold">
                {collectionInfo.config?.params?.vectors?.size || 'Unknown'}
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400">Distance</div>
              <div className="text-lg font-semibold">
                {collectionInfo.config?.params?.vectors?.distance || 'Unknown'}
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400">Status</div>
              <div className={`text-lg font-semibold ${getStatusColor(qdrantStatus)}`}>
                {qdrantStatus}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 p-6">
        {qdrantStatus === 'unreachable' ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                Qdrant Dashboard Unavailable
              </h3>
              <p className="text-gray-500 mb-4">
                Unable to connect to Qdrant at {qdrantBaseUrl}
              </p>
              <button
                onClick={handleRefresh}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-md transition-colors"
              >
                Retry Connection
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Dashboard Frame */}
            <div className="bg-gray-800 rounded-lg overflow-hidden">
              <div className="bg-gray-700 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-sm text-gray-300 ml-3">
                    {dashboardUrls[activeView]}
                  </span>
                </div>
                <button
                  onClick={() => openInNewTab(dashboardUrls[activeView])}
                  className="flex items-center space-x-2 px-3 py-1 bg-gray-600 hover:bg-gray-500 rounded text-sm transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open in New Tab</span>
                </button>
              </div>
              
              <div className="h-[600px]">
                <iframe
                  src={dashboardUrls[activeView]}
                  className="w-full h-full border-0"
                  title={`Qdrant ${activeView} Dashboard`}
                  sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                />
              </div>
            </div>

            {/* Metrics and Actions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Real-time Metrics */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  <span>Real-time Metrics</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Search Latency</span>
                    <span className="text-green-400 font-mono">
                      {metrics?.qdrant_search_duration_seconds ? 
                        `${(metrics.qdrant_search_duration_seconds * 1000).toFixed(2)}ms` : 
                        'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Memory Usage</span>
                    <span className="text-blue-400 font-mono">
                      {metrics?.qdrant_memory_usage_bytes ? 
                        `${(metrics.qdrant_memory_usage_bytes / 1024 / 1024).toFixed(2)}MB` : 
                        'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Active Connections</span>
                    <span className="text-purple-400 font-mono">
                      {metrics?.qdrant_connections_active || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <Settings className="w-5 h-5 text-blue-400" />
                  <span>Quick Actions</span>
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => openInNewTab(`${qdrantBaseUrl}/collections/${selectedCollection}`)}
                    className="w-full text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                  >
                    <Layers className="w-4 h-4 inline mr-2" />
                    Collection Details
                  </button>
                  <button
                    onClick={() => openInNewTab(`${qdrantBaseUrl}/collections/${selectedCollection}/points`)}
                    className="w-full text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                  >
                    <Database className="w-4 h-4 inline mr-2" />
                    Browse Points
                  </button>
                  <button
                    onClick={() => openInNewTab(`${qdrantBaseUrl}/metrics`)}
                    className="w-full text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                  >
                    <TrendingUp className="w-4 h-4 inline mr-2" />
                    View Metrics
                  </button>
                  <button
                    onClick={() => openInNewTab(`${qdrantBaseUrl}/collections/${selectedCollection}/search`)}
                    className="w-full text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                  >
                    <Search className="w-4 h-4 inline mr-2" />
                    Search Interface
                  </button>
                </div>
              </div>

              {/* Collection Health */}
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-orange-400" />
                  <span>Collection Health</span>
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Status:</span>
                    <span className={getStatusColor(qdrantStatus)}>
                      {qdrantStatus}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Collections:</span>
                    <span>{collections.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Last Update:</span>
                    <span>{new Date().toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">API Status:</span>
                    <span className={getStatusColor(qdrantStatus)}>
                      {qdrantStatus === 'healthy' ? 'OK' : 'Error'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdvancedQdrantDashboard;

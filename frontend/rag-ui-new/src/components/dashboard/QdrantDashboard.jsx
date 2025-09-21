/**
 * Qdrant Dashboard Component
 * 
 * Integrates Qdrant's built-in dashboard visualizations:
 * - Collection Graph: http://localhost:6333/dashboard#/collections/rag/graph
 * - Vector Visualization: http://localhost:6333/dashboard#/collections/rag/visualize
 */

import React, { useState, useEffect } from 'react';
import { Database, BarChart3, Eye, RefreshCw, ExternalLink, Settings } from 'lucide-react';

const QdrantDashboard = () => {
  const [activeView, setActiveView] = useState('graph');
  const [isLoading, setIsLoading] = useState(false);
  const [qdrantStatus, setQdrantStatus] = useState('unknown');
  const [collectionInfo, setCollectionInfo] = useState(null);

  // Qdrant dashboard URLs
  const qdrantBaseUrl = 'http://localhost:6333';
  const dashboardUrls = {
    graph: `${qdrantBaseUrl}/dashboard#/collections/rag/graph`,
    visualize: `${qdrantBaseUrl}/dashboard#/collections/rag/visualize`,
    collections: `${qdrantBaseUrl}/dashboard#/collections`,
    metrics: `${qdrantBaseUrl}/dashboard#/metrics`
  };

  // Check Qdrant status
  useEffect(() => {
    checkQdrantStatus();
    fetchCollectionInfo();
  }, []);

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

  const fetchCollectionInfo = async () => {
    try {
      const response = await fetch(`${qdrantBaseUrl}/collections/rag`);
      const data = await response.json();
      setCollectionInfo(data.result);
    } catch (error) {
      console.error('Error fetching collection info:', error);
    }
  };

  const handleRefresh = () => {
    setIsLoading(true);
    checkQdrantStatus();
    fetchCollectionInfo();
    setTimeout(() => setIsLoading(false), 1000);
  };

  const handleViewChange = (view) => {
    setActiveView(view);
  };

  const openInNewTab = (url) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Database className="w-8 h-8 text-purple-400" />
            <div>
              <h1 className="text-2xl font-bold">Qdrant Vector Database Dashboard</h1>
              <p className="text-gray-400">Real-time vector database monitoring and visualization</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Status Indicator */}
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${
                qdrantStatus === 'healthy' ? 'bg-green-400' : 
                qdrantStatus === 'unhealthy' ? 'bg-yellow-400' : 'bg-red-400'
              }`}></div>
              <span className="text-sm font-medium">
                {qdrantStatus === 'healthy' ? 'Connected' : 
                 qdrantStatus === 'unhealthy' ? 'Warning' : 'Disconnected'}
              </span>
            </div>
            
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
              { id: 'collections', label: 'All Collections', icon: Database },
              { id: 'metrics', label: 'Metrics', icon: Settings }
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

      {/* Collection Info Panel */}
      {collectionInfo && (
        <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400">Collection Name</div>
              <div className="text-lg font-semibold">{collectionInfo.name || 'rag'}</div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400">Total Vectors</div>
              <div className="text-lg font-semibold">
                {collectionInfo.points_count?.toLocaleString() || '0'}
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400">Vector Size</div>
              <div className="text-lg font-semibold">
                {collectionInfo.config?.params?.vectors?.size || 'Unknown'}
              </div>
            </div>
            <div className="bg-gray-700 rounded-lg p-4">
              <div className="text-sm text-gray-400">Distance Metric</div>
              <div className="text-lg font-semibold">
                {collectionInfo.config?.params?.vectors?.distance || 'Unknown'}
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

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => openInNewTab(`${qdrantBaseUrl}/collections/rag`)}
                    className="w-full text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                  >
                    View Collection Details
                  </button>
                  <button
                    onClick={() => openInNewTab(`${qdrantBaseUrl}/collections/rag/points`)}
                    className="w-full text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                  >
                    Browse Points
                  </button>
                  <button
                    onClick={() => openInNewTab(`${qdrantBaseUrl}/metrics`)}
                    className="w-full text-left px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                  >
                    View Metrics
                  </button>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">Collection Stats</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Status:</span>
                    <span className={qdrantStatus === 'healthy' ? 'text-green-400' : 'text-red-400'}>
                      {qdrantStatus}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Vectors:</span>
                    <span>{collectionInfo?.points_count?.toLocaleString() || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Indexed:</span>
                    <span>{collectionInfo?.indexed_vectors_count?.toLocaleString() || '0'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-3">API Endpoints</h3>
                <div className="space-y-2 text-sm">
                  <div className="text-gray-400">Health:</div>
                  <code className="block bg-gray-700 px-2 py-1 rounded text-xs">
                    GET {qdrantBaseUrl}/health
                  </code>
                  <div className="text-gray-400">Collections:</div>
                  <code className="block bg-gray-700 px-2 py-1 rounded text-xs">
                    GET {qdrantBaseUrl}/collections
                  </code>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QdrantDashboard;

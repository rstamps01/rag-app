/**
 * Enhanced Monitoring Dashboard
 * Main dashboard integrating React Flow pipeline visualization and Qdrant vector visualization
 * Features VAST Data branding and real-time monitoring capabilities
 */

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Maximize2, 
  Minimize2, 
  Split, 
  Monitor, 
  Database,
  Settings,
  RefreshCw,
  Activity,
  TrendingUp,
  Zap
} from 'lucide-react';

import RAGPipelineFlow from './RAGPipelineFlow';
import QdrantVectorVisualization from './QdrantVectorVisualization';
import useWebSocket from './hooks/useWebSocket';

const EnhancedMonitoringDashboard = () => {
  const [viewMode, setViewMode] = useState('split'); // 'pipeline', 'vectors', 'split'
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedVectorPoint, setSelectedVectorPoint] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  // WebSocket connection for real-time data
  const {
    connectionStatus,
    currentMetrics,
    isConnected,
    debugInfo
  } = useWebSocket('/ws/monitoring', {
    reconnectInterval: 3000,
    maxReconnectAttempts: 10,
    debug: true
  });

  // Handle node selection from pipeline
  const handleNodeSelect = useCallback((node) => {
    setSelectedNode(node);
    
    // If it's a vector node, switch to vector view
    if (node.type === 'vectorNode') {
      setViewMode('vectors');
    }
  }, []);

  // Handle vector point selection
  const handleVectorPointSelect = useCallback((point) => {
    setSelectedVectorPoint(point);
  }, []);

  // Toggle fullscreen mode
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }, []);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Trigger data refresh
      window.dispatchEvent(new CustomEvent('refresh-data'));
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval]);

  // Listen for fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div className="h-screen w-full bg-vast-dark flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/5 border-b border-white/10">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-6 h-6 text-vast-primary" />
            <h1 className="text-xl font-bold text-white">RAG Pipeline Monitor</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`} />
            <span className="text-sm text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* View Mode Toggle */}
          <div className="flex bg-white/10 rounded-lg p-1">
            <button
              onClick={() => setViewMode('pipeline')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'pipeline' 
                  ? 'bg-vast-primary text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Monitor className="w-4 h-4 inline mr-1" />
              Pipeline
            </button>
            <button
              onClick={() => setViewMode('vectors')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'vectors' 
                  ? 'bg-vast-primary text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Database className="w-4 h-4 inline mr-1" />
              Vectors
            </button>
            <button
              onClick={() => setViewMode('split')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'split' 
                  ? 'bg-vast-primary text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Split className="w-4 h-4 inline mr-1" />
              Split
            </button>
          </div>

          {/* Auto Refresh Toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`p-2 rounded transition-colors ${
              autoRefresh 
                ? 'bg-vast-primary text-white' 
                : 'bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className="p-2 bg-white/10 hover:bg-white/20 rounded text-gray-400 hover:text-white transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          {/* Settings */}
          <button className="p-2 bg-white/10 hover:bg-white/20 rounded text-gray-400 hover:text-white transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'split' && (
          <>
            {/* Pipeline View - Left Side */}
            <div className="flex-1 border-r border-white/10">
              <div className="h-full">
                <RAGPipelineFlow
                  metrics={currentMetrics}
                  isConnected={isConnected}
                  onNodeSelect={handleNodeSelect}
                />
              </div>
            </div>

            {/* Vector View - Right Side */}
            <div className="flex-1">
              <QdrantVectorVisualization
                collectionName="rag"
                onPointSelect={handleVectorPointSelect}
                selectedPoint={selectedVectorPoint}
                isConnected={isConnected}
              />
            </div>
          </>
        )}

        {viewMode === 'pipeline' && (
          <div className="flex-1">
            <RAGPipelineFlow
              metrics={currentMetrics}
              isConnected={isConnected}
              onNodeSelect={handleNodeSelect}
            />
          </div>
        )}

        {viewMode === 'vectors' && (
          <div className="flex-1">
            <QdrantVectorVisualization
              collectionName="rag"
              onPointSelect={handleVectorPointSelect}
              selectedPoint={selectedVectorPoint}
              isConnected={isConnected}
            />
          </div>
        )}
      </div>

      {/* Bottom Status Bar */}
      <div className="flex items-center justify-between p-3 bg-white/5 border-t border-white/10 text-xs text-gray-400">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-3 h-3" />
            <span>Queries/min: {currentMetrics?.pipeline_status?.queries_per_minute || 0}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Zap className="w-3 h-3" />
            <span>Avg Response: {currentMetrics?.pipeline_status?.avg_response_time || 0}ms</span>
          </div>
          <div className="flex items-center space-x-2">
            <Activity className="w-3 h-3" />
            <span>Active Queries: {currentMetrics?.pipeline_status?.active_queries || 0}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <span>Messages: {debugInfo.messagesReceived}</span>
          <span>Last Update: {debugInfo.lastMessageTime ? 
            new Date(debugInfo.lastMessageTime).toLocaleTimeString() : 'Never'}</span>
          <span>Auto Refresh: {autoRefresh ? 'ON' : 'OFF'}</span>
        </div>
      </div>

      {/* Selection Details Panel */}
      {(selectedNode || selectedVectorPoint) && (
        <div className="absolute bottom-4 right-4 w-80 bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-vast-neutral">
              {selectedNode ? 'Pipeline Node' : 'Vector Point'} Details
            </h3>
            <button
              onClick={() => {
                setSelectedNode(null);
                setSelectedVectorPoint(null);
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          </div>

          {selectedNode && (
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-vast-neutral">Type</div>
                <div className="text-sm text-gray-600 capitalize">{selectedNode.type?.replace('Node', '')}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-vast-neutral">Status</div>
                <div className="text-sm text-gray-600">{selectedNode.data?.status || 'Unknown'}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-vast-neutral">Position</div>
                <div className="text-sm text-gray-600">
                  ({selectedNode.position?.x?.toFixed(0)}, {selectedNode.position?.y?.toFixed(0)})
                </div>
              </div>
              {selectedNode.data && Object.entries(selectedNode.data).map(([key, value]) => (
                <div key={key}>
                  <div className="text-sm font-medium text-vast-neutral capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-sm text-gray-600">{value || 'N/A'}</div>
                </div>
              ))}
            </div>
          )}

          {selectedVectorPoint && (
            <div className="space-y-3">
              <div>
                <div className="text-sm font-medium text-vast-neutral">ID</div>
                <div className="text-sm text-gray-600 font-mono">{selectedVectorPoint.id}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-vast-neutral">Department</div>
                <div className="text-sm text-gray-600">{selectedVectorPoint.department}</div>
              </div>
              <div>
                <div className="text-sm font-medium text-vast-neutral">Confidence</div>
                <div className="text-sm text-gray-600">{selectedVectorPoint.confidence?.toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-sm font-medium text-vast-neutral">Content Preview</div>
                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded max-h-20 overflow-y-auto">
                  {selectedVectorPoint.content}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnhancedMonitoringDashboard;

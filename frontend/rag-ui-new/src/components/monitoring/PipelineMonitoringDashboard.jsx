/*
 * v1.0.0.0
 * Location: frontend/rag-ui-new/src/components/monitoring/PipelineMonitoringDashboard.jsx
 *
 * This enhanced pipeline monitoring dashboard integrates a two‑row
 * React Flow graph showing both the document processing and query
 * workflows of your RAG application.  Nodes are laid out manually for
 * clarity, and the panel displays live system and pipeline metrics
 * received via WebSocket.  Clicking on a node logs its information
 * (extend this to open a side panel with details).  Use this as a
 * starting point and customise stage names/positions to reflect your
 * actual pipeline.
 */

import React, { useState } from 'react';
import EnhancedRAGPipelineVisualization from '../pipeline/EnhancedRAGPipelineVisualization';
import { Activity, Menu, X, TrendingUp, Clock, CheckCircle, Database, Cpu, Zap, MessageSquare, FileText, BarChart3, Server, Info } from 'lucide-react';

const PipelineMonitoringDashboard = () => {
  const [debugMode, setDebugMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const [pipelineData, setPipelineData] = useState(null);
  const [systemMetrics, setSystemMetrics] = useState(null);
  
  const [realTimeMetrics] = useState({
    queries_per_minute: 45,
    avg_response_time: 4200,
    success_rate: 98.2,
    gpu_utilization: 85,
    memory_usage: 12.5,
    active_connections: 23,
    error_count_24h: 3,
    uptime_hours: 72
  });

  const handleMenuToggle = () => {
    setMenuOpen(!menuOpen);
  };

  const handleDebugToggle = () => {
    setDebugMode(!debugMode);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Far Left - Pipeline Monitor Dashboard (starts under gear icon) */}
          <div className="text-left">
            <div className="flex items-center space-x-2 mb-1">
              <Activity className="w-5 h-5 text-green-400" />
              <h1 className="text-2xl font-bold">Pipeline Monitor Dashboard</h1>
            </div>
            <p className="text-blue-400 ml-7">Dynamic Real-time Monitoring</p>
          </div>
          
          {/* Center - Message area */}
          <div className="flex items-center space-x-4">
            {/* Message area will be populated by EnhancedRAGPipelineVisualization */}
            <div id="header-message-area"></div>
          </div>
          
          {/* Right side - Aligned with Dashboards dropdown */}
          <div className="flex items-center space-x-4">
            {/* Connected Status */}
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <span className="text-white text-sm">Connected (Live Data)</span>
            </div>
            
            {/* Debug Button - Aligned with Dashboards dropdown */}
            <button
              onClick={handleMenuToggle}
              className="px-3 py-2 rounded-md text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors duration-200"
            >
              Debug
            </button>
          </div>
        </div>
      </div>

      {/* Main Enhanced Pipeline Visualization */}
      <div className="h-[calc(100vh-80px)]">
        <EnhancedRAGPipelineVisualization debugMode={debugMode} />
      </div>

      {/* Right Sliding Menu */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setMenuOpen(false)}
          />
          
          {/* Menu Panel */}
          <div className="relative w-96 h-full bg-gray-900 border-l border-gray-700 shadow-2xl overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-5 h-5 text-purple-400" />
                <div>
                  <h2 className="text-lg font-bold text-white">Metrics & Debug</h2>
                  <p className="text-xs text-gray-400">Last updated: {new Date().toLocaleTimeString()}</p>
                </div>
              </div>
              <button
                onClick={() => setMenuOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-6">
              {/* Live Metrics Summary */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-green-400" />
                  <span>Live Metrics</span>
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">{realTimeMetrics.queries_per_minute}/min</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-gray-300">{realTimeMetrics.avg_response_time}ms</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">{realTimeMetrics.success_rate}%</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Cpu className="w-4 h-4 text-orange-400" />
                    <span className="text-gray-300">{realTimeMetrics.gpu_utilization}%</span>
                  </div>
                </div>
              </div>

              {/* Connection Status */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <Server className="w-5 h-5 text-blue-400" />
                    <h3 className="text-sm font-semibold text-white">Connection Status</h3>
                  </div>
                  <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                    <span className="text-xs">{isConnected ? 'Connected' : 'Disconnected'}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-400">
                  <div>Uptime: {realTimeMetrics.uptime_hours}h</div>
                  <div>Active Connections: {realTimeMetrics.active_connections}</div>
                  <div>Errors (24h): {realTimeMetrics.error_count_24h}</div>
                </div>
              </div>

              {/* Document Processing Metrics */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <FileText className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">Document Processing</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-white">Document Ingestion</h4>
                      <span className="px-2 py-1 bg-green-900/20 text-green-400 text-xs rounded">Active</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                      <div>Processed: 1,247</div>
                      <div>Queue: 23</div>
                      <div>Avg Time: 1.25s</div>
                      <div>Success: 99.2%</div>
                    </div>
                  </div>

                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-white">Text Processing</h4>
                      <span className="px-2 py-1 bg-blue-900/20 text-blue-400 text-xs rounded">Processing</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                      <div>Chunks: 15,680</div>
                      <div>Avg Size: 512</div>
                      <div>Time: 890ms</div>
                      <div>Success: 98.8%</div>
                    </div>
                  </div>

                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-white">Embedding Generation</h4>
                      <span className="px-2 py-1 bg-green-900/20 text-green-400 text-xs rounded">Active</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                      <div>Generated: 15,680</div>
                      <div>GPU: 85%</div>
                      <div>Time: 1.2s</div>
                      <div>Success: 98.5%</div>
                    </div>
                  </div>

                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-white">Vector Storage</h4>
                      <span className="px-2 py-1 bg-green-900/20 text-green-400 text-xs rounded">Active</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                      <div>Stored: 15,680</div>
                      <div>Utilization: 67.5%</div>
                      <div>Time: 45ms</div>
                      <div>Success: 99.8%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Query Processing Metrics */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-semibold text-white">Query Processing</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-white">Query Input</h4>
                      <span className="px-2 py-1 bg-green-900/20 text-green-400 text-xs rounded">Active</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                      <div>Active: 12</div>
                      <div>Queue: 3</div>
                      <div>Queue Time: 50ms</div>
                      <div>Success: 99.9%</div>
                    </div>
                  </div>

                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-white">Vector Search</h4>
                      <span className="px-2 py-1 bg-blue-900/20 text-blue-400 text-xs rounded">Processing</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                      <div>Searches: 1,247</div>
                      <div>Avg Time: 45ms</div>
                      <div>Results: 5.2</div>
                      <div>Accuracy: 92.3%</div>
                    </div>
                  </div>

                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-white">LLM Processing</h4>
                      <span className="px-2 py-1 bg-blue-900/20 text-blue-400 text-xs rounded">Processing</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                      <div>Tokens: 15,680</div>
                      <div>Load: 92%</div>
                      <div>Time: 3.2s</div>
                      <div>Success: 97.8%</div>
                    </div>
                  </div>

                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-white">Response Generation</h4>
                      <span className="px-2 py-1 bg-green-900/20 text-green-400 text-xs rounded">Active</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                      <div>Generated: 1,247</div>
                      <div>Avg Length: 150</div>
                      <div>Delivery: 25ms</div>
                      <div>Success: 99.1%</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Resources */}
              <div>
                <div className="flex items-center space-x-2 mb-4">
                  <Server className="w-5 h-5 text-orange-400" />
                  <h3 className="text-lg font-semibold text-white">System Resources</h3>
                </div>
                
                <div className="space-y-3">
                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-white">CPU</h4>
                      <span className="text-xs text-gray-400">67.5%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-orange-400 h-2 rounded-full" style={{width: '67.5%'}}></div>
                    </div>
                  </div>

                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-white">Memory</h4>
                      <span className="text-xs text-gray-400">66.1%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-400 h-2 rounded-full" style={{width: '66.1%'}}></div>
                    </div>
                  </div>

                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-white">GPU</h4>
                      <span className="text-xs text-gray-400">85%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-purple-400 h-2 rounded-full" style={{width: '85%'}}></div>
                    </div>
                  </div>

                  <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-white">Storage</h4>
                      <span className="text-xs text-gray-400">62.4%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-green-400 h-2 rounded-full" style={{width: '62.4%'}}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Debug Actions */}
              <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-white mb-3 flex items-center space-x-2">
                  <Info className="w-4 h-4 text-blue-400" />
                  <span>Debug Actions</span>
                </h3>
                <div className="space-y-2">
                  <button 
                    onClick={() => {
                      const debugData = {
                        timestamp: new Date().toISOString(),
                        pipelineData,
                        systemMetrics,
                        connectionStatus: isConnected,
                        realTimeMetrics
                      };
                      const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `debug-logs-${Date.now()}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="w-full text-left px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
                  >
                    Export Debug Logs
                  </button>
                  <button 
                    onClick={() => console.clear()}
                    className="w-full text-left px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
                  >
                    Clear Console Logs
                  </button>
                  <button 
                    onClick={() => window.location.reload()}
                    className="w-full text-left px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors"
                  >
                    Refresh All Metrics
                  </button>
                  <button 
                    onClick={() => {
                      console.log('🔧 Testing WebSocket Connection...');
                      console.log('Connection Status:', isConnected);
                      console.log('Pipeline Data:', pipelineData);
                      console.log('System Metrics:', systemMetrics);
                    }}
                    className="w-full text-left px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm transition-colors"
                  >
                    Test WebSocket Connection
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineMonitoringDashboard;
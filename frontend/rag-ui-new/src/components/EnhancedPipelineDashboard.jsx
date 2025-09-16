import React, { useState, useMemo } from 'react';
import PipelineGraph from './PipelineGraph';
import usePipelineFlow from '../hooks/usePipelineFlow';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';

/**
 * Enhanced Pipeline Dashboard with Real-time React Flow Visualization
 * 
 * This component provides a comprehensive view of the RAG pipeline with:
 * - Real-time React Flow visualization
 * - Interactive node selection and metrics
 * - VAST Data branded styling
 * - Live performance monitoring
 */
const EnhancedPipelineDashboard = () => {
  const [viewMode, setViewMode] = useState('flow'); // 'flow', 'metrics', 'vector'
  const [selectedNodeDetails, setSelectedNodeDetails] = useState(null);
  
  // Use the enhanced pipeline flow hook
  const {
    nodes,
    edges,
    selectedNodeId,
    hoveredNodeId,
    selectedNode,
    hoveredNode,
    isConnected,
    connectionStatus,
    handleNodeClick,
    handleNodeHover,
    pipelineData,
    pipelineStats,
    setSelectedNodeId
  } = usePipelineFlow('/ws/pipeline-monitoring', {
    debug: true
  });
  
  // Handle node click for detailed view
  const onNodeClick = (event, node) => {
    handleNodeClick(event, node);
    setSelectedNodeDetails(node.data);
  };
  
  // Handle node hover for tooltips
  const onNodeHover = (event, node) => {
    handleNodeHover(event, node);
  };
  
  // Real-time metrics panel
  const RealTimeMetricsPanel = () => {
    if (!pipelineStats) {
      return (
        <div className="metrics-panel">
          <h3>Loading metrics...</h3>
        </div>
      );
    }
    
    return (
      <div className="metrics-panel space-y-4">
        <h3 className="text-xl font-bold mb-4">Real-time Pipeline Metrics</h3>
        
        {/* Connection Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">WebSocket</div>
                <div className={`font-semibold ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Status</div>
                <div className="font-semibold">{connectionStatus}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Pipeline Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">Queries/min</div>
                <div className="text-2xl font-bold text-blue-600">{pipelineStats.totalQueries}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Avg Response Time</div>
                <div className="text-2xl font-bold text-green-600">{pipelineStats.avgResponseTime}ms</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Active Queries</div>
                <div className="text-2xl font-bold text-orange-600">{pipelineStats.activeQueries}</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* System Resources */}
        <Card>
          <CardHeader>
            <CardTitle>System Resources</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">CPU Usage</div>
                <div className="text-2xl font-bold text-blue-600">{pipelineStats.cpuUsage}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">Memory Usage</div>
                <div className="text-2xl font-bold text-purple-600">{pipelineStats.memoryUsage}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">GPU Utilization</div>
                <div className="text-2xl font-bold text-green-600">{pipelineStats.gpuUtilization}%</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">GPU Temperature</div>
                <div className={`text-2xl font-bold ${pipelineStats.gpuTemperature > 80 ? 'text-red-600' : 'text-orange-600'}`}>
                  {pipelineStats.gpuTemperature}°C
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };
  
  // Node details panel
  const NodeDetailsPanel = ({ node, onClose }) => {
    if (!node) return null;
    
    return (
      <div className="node-details-panel fixed right-0 top-0 h-full w-80 bg-gray-900 text-white p-6 shadow-lg z-50">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">{node.data.label}</h3>
          <Button onClick={onClose} variant="ghost" size="sm">
            ✕
          </Button>
        </div>
        
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-400">Status</div>
            <div className={`font-semibold ${
              node.data.status === 'active' ? 'text-green-400' :
              node.data.status === 'processing' ? 'text-yellow-400' :
              node.data.status === 'error' ? 'text-red-400' :
              'text-gray-400'
            }`}>
              {node.data.status}
            </div>
          </div>
          
          <div>
            <div className="text-sm text-gray-400">Health</div>
            <div className={`font-semibold ${
              node.data.health === 'healthy' ? 'text-green-400' :
              node.data.health === 'warning' ? 'text-yellow-400' :
              node.data.health === 'critical' ? 'text-red-400' :
              'text-gray-400'
            }`}>
              {node.data.health}
            </div>
          </div>
          
          {node.data.metrics && (
            <div>
              <div className="text-sm text-gray-400 mb-2">Metrics</div>
              <div className="space-y-2">
                {Object.entries(node.data.metrics).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="text-sm text-gray-300 capitalize">
                      {key.replace(/_/g, ' ')}:
                    </span>
                    <span className="text-sm font-semibold">
                      {typeof value === 'number' ? value.toFixed(2) : value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="enhanced-pipeline-dashboard min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">RAG Pipeline Visualization</h1>
              <p className="text-sm text-gray-500">Real-time monitoring and visualization</p>
            </div>
            
            {/* Connection status */}
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                isConnected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                {isConnected ? 'Connected' : 'Disconnected'}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={viewMode} onValueChange={setViewMode} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="flow">Pipeline Flow</TabsTrigger>
            <TabsTrigger value="metrics">Real-time Metrics</TabsTrigger>
            <TabsTrigger value="vector">Vector Visualization</TabsTrigger>
          </TabsList>
          
          <TabsContent value="flow" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Interactive Pipeline Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96 w-full">
                  <PipelineGraph
                    stages={nodes.map(node => node.data)}
                    edges={edges}
                    onNodeClick={onNodeClick}
                    onNodeHover={onNodeHover}
                    selectedNodeId={selectedNodeId}
                    showTooltips={true}
                    realTimeData={pipelineData}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="metrics" className="mt-6">
            <RealTimeMetricsPanel />
          </TabsContent>
          
          <TabsContent value="vector" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Vector Database Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-96 w-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <div className="text-4xl mb-4">🎯</div>
                    <div>Vector visualization coming soon...</div>
                    <div className="text-sm mt-2">This will show Qdrant vector points and search results</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Node details sidebar */}
      {selectedNodeDetails && (
        <NodeDetailsPanel 
          node={selectedNode} 
          onClose={() => {
            setSelectedNodeDetails(null);
            setSelectedNodeId(null);
          }} 
        />
      )}
    </div>
  );
};

export default EnhancedPipelineDashboard;

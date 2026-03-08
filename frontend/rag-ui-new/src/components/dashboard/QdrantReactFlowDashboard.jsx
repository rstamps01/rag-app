/**
 * Qdrant React Flow Dashboard
 * 
 * Comprehensive React Flow visualization for Qdrant collections,
 * vector monitoring, performance metrics, and RAG integration.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { QDRANT_URL } from '../../config';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Position
} from 'reactflow';
import 'reactflow/dist/style.css';

// Import Lucide React icons
import {
  Database,
  BarChart3,
  Activity,
  TrendingUp,
  Search,
  Layers,
  Zap,
  Cpu,
  Server,
  HardDrive,
  Network,
  RefreshCw,
  Settings,
  Eye,
  ExternalLink
} from 'lucide-react';

// Custom Node Components
const QdrantCollectionNode = ({ data }) => {
  const { collection, metrics } = data;
  
  return (
    <div className="bg-gray-800 border-2 border-purple-500 rounded-lg p-4 min-w-[250px] shadow-lg">
      <div className="flex items-center space-x-2 mb-3">
        <Database className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-white">{collection.name}</h3>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Status:</span>
          <span className={`px-2 py-1 rounded text-xs ${
            collection.status === 'green' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'
          }`}>
            {collection.status}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Vectors:</span>
          <span className="text-white font-mono">{collection.points_count?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Dimensions:</span>
          <span className="text-white">{collection.config?.params?.vectors?.size}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Distance:</span>
          <span className="text-white">{collection.config?.params?.vectors?.distance}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Segments:</span>
          <span className="text-white">{collection.segments_count}</span>
        </div>
      </div>
    </div>
  );
};

const VectorMetricsNode = ({ data }) => {
  const { metrics } = data;
  
  return (
    <div className="bg-gray-800 border-2 border-blue-500 rounded-lg p-4 min-w-[200px] shadow-lg">
      <div className="flex items-center space-x-2 mb-3">
        <BarChart3 className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">Vector Metrics</h3>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Indexed:</span>
          <span className="text-white font-mono">{metrics?.indexed_vectors_count?.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Search Latency:</span>
          <span className="text-white">{metrics?.search_latency || 0}ms</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Memory Usage:</span>
          <span className="text-white">{metrics?.memory_usage || 0}MB</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Index Size:</span>
          <span className="text-white">{metrics?.index_size?.toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
};

const PerformanceNode = ({ data }) => {
  const { performance } = data;
  
  return (
    <div className="bg-gray-800 border-2 border-green-500 rounded-lg p-4 min-w-[200px] shadow-lg">
      <div className="flex items-center space-x-2 mb-3">
        <TrendingUp className="w-5 h-5 text-green-400" />
        <h3 className="text-lg font-semibold text-white">Performance</h3>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Queries/min:</span>
          <span className="text-white">{performance?.queries_per_minute || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Avg Response:</span>
          <span className="text-white">{performance?.avg_response_time || 0}ms</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Success Rate:</span>
          <span className="text-white">{performance?.success_rate || 0}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Active Queries:</span>
          <span className="text-white">{performance?.active_queries || 0}</span>
        </div>
      </div>
    </div>
  );
};

const RAGIntegrationNode = ({ data }) => {
  const { integration } = data;
  
  return (
    <div className="bg-gray-800 border-2 border-orange-500 rounded-lg p-4 min-w-[250px] shadow-lg">
      <div className="flex items-center space-x-2 mb-3">
        <Zap className="w-5 h-5 text-orange-400" />
        <h3 className="text-lg font-semibold text-white">RAG Integration</h3>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Status:</span>
          <span className={`px-2 py-1 rounded text-xs ${
            integration?.status === 'connected' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'
          }`}>
            {integration?.status || 'disconnected'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Documents:</span>
          <span className="text-white">{integration?.documents_processed || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Embeddings:</span>
          <span className="text-white">{integration?.embeddings_generated || 0}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Chunks:</span>
          <span className="text-white">{integration?.chunks_generated || 0}</span>
        </div>
      </div>
    </div>
  );
};

const SystemHealthNode = ({ data }) => {
  const { system } = data;
  
  return (
    <div className="bg-gray-800 border-2 border-cyan-500 rounded-lg p-4 min-w-[200px] shadow-lg">
      <div className="flex items-center space-x-2 mb-3">
        <Activity className="w-5 h-5 text-cyan-400" />
        <h3 className="text-lg font-semibold text-white">System Health</h3>
      </div>
      
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">CPU:</span>
          <span className="text-white">{system?.cpu_usage || 0}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Memory:</span>
          <span className="text-white">{system?.memory_usage || 0}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Disk:</span>
          <span className="text-white">{system?.disk_usage || 0}%</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Network:</span>
          <span className="text-white">{system?.network_usage || 0}%</span>
        </div>
      </div>
    </div>
  );
};

// Define node types
const nodeTypes = {
  qdrantCollection: QdrantCollectionNode,
  vectorMetrics: VectorMetricsNode,
  performance: PerformanceNode,
  ragIntegration: RAGIntegrationNode,
  systemHealth: SystemHealthNode
};

const QdrantReactFlowDashboard = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [qdrantData, setQdrantData] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  // Check if Qdrant service is available
  const [qdrantAvailable, setQdrantAvailable] = useState(false);

  // Check Qdrant availability
  const checkQdrantAvailability = useCallback(async () => {
    try {
      const response = await fetch(`${QDRANT_URL}/health`, {
        method: 'HEAD',
        timeout: 2000
      });
      setQdrantAvailable(response.ok);
    } catch (error) {
      setQdrantAvailable(false);
    }
  }, []);

  // Fetch Qdrant data only if service is available
  const fetchQdrantData = useCallback(async () => {
    if (!qdrantAvailable) {
      console.log('Qdrant service not available, using demo data');
      setQdrantData({
        collections: [],
        health: { title: 'unavailable' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      const [collectionsResponse, healthResponse] = await Promise.all([
        fetch(`${QDRANT_URL}/collections`),
        fetch(`${QDRANT_URL}/health`)
      ]);
      
      const collectionsData = await collectionsResponse.json();
      const healthData = await healthResponse.json();
      
      setQdrantData({
        collections: collectionsData.result?.collections || [],
        health: healthData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching Qdrant data:', error);
      setQdrantAvailable(false);
    }
  }, [qdrantAvailable]);

  // Initialize nodes and edges
  useEffect(() => {
    const initializeFlow = async () => {
      // Check Qdrant availability first
      await checkQdrantAvailability();
      
      const initialNodes = [
        {
          id: 'qdrant-main',
          type: 'qdrantCollection',
          position: { x: 100, y: 100 },
          data: {
            collection: {
              name: 'RAG Collection',
              status: 'green',
              points_count: 13122,
              config: {
                params: {
                  vectors: { size: 384, distance: 'Cosine' }
                }
              },
              segments_count: 8
            },
            metrics: {
              indexed_vectors_count: 13122,
              search_latency: 23,
              memory_usage: 45,
              index_size: 13122
            }
          }
        },
        {
          id: 'vector-metrics',
          type: 'vectorMetrics',
          position: { x: 450, y: 100 },
          data: {
            metrics: {
              indexed_vectors_count: 13122,
              search_latency: 23,
              memory_usage: 45,
              index_size: 13122
            }
          }
        },
        {
          id: 'performance',
          type: 'performance',
          position: { x: 100, y: 300 },
          data: {
            performance: {
              queries_per_minute: 45,
              avg_response_time: 23,
              success_rate: 98.5,
              active_queries: 3
            }
          }
        },
        {
          id: 'rag-integration',
          type: 'ragIntegration',
          position: { x: 450, y: 300 },
          data: {
            integration: {
              status: 'connected',
              documents_processed: 150,
              embeddings_generated: 13122,
              chunks_generated: 1500
            }
          }
        },
        {
          id: 'system-health',
          type: 'systemHealth',
          position: { x: 275, y: 500 },
          data: {
            system: {
              cpu_usage: 45,
              memory_usage: 62,
              disk_usage: 38,
              network_usage: 12
            }
          }
        }
      ];

      const initialEdges = [
        {
          id: 'qdrant-to-metrics',
          source: 'qdrant-main',
          target: 'vector-metrics',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#8b5cf6', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' }
        },
        {
          id: 'qdrant-to-performance',
          source: 'qdrant-main',
          target: 'performance',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#10b981', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' }
        },
        {
          id: 'metrics-to-rag',
          source: 'vector-metrics',
          target: 'rag-integration',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#f59e0b', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' }
        },
        {
          id: 'performance-to-rag',
          source: 'performance',
          target: 'rag-integration',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#f59e0b', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' }
        },
        {
          id: 'rag-to-system',
          source: 'rag-integration',
          target: 'system-health',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#06b6d4', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#06b6d4' }
        },
        {
          id: 'qdrant-to-system',
          source: 'qdrant-main',
          target: 'system-health',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#06b6d4', strokeWidth: 2 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#06b6d4' }
        }
      ];

      setNodes(initialNodes);
      setEdges(initialEdges);
      setIsLoading(false);
      
      // Fetch data after initialization
      fetchQdrantData();
    };

    initializeFlow();
  }, [checkQdrantAvailability, fetchQdrantData]);

  // Auto-refresh data only when Qdrant is available
  useEffect(() => {
    if (!qdrantAvailable) return;
    
    const interval = setInterval(() => {
      fetchQdrantData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchQdrantData, refreshInterval, qdrantAvailable]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleRefresh = () => {
    fetchQdrantData();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-4" />
          <p className="text-white">Loading Qdrant Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Database className="w-8 h-8 text-purple-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">
                Qdrant React Flow Dashboard
                {!qdrantAvailable && (
                  <span className="text-yellow-400 text-lg ml-2">*</span>
                )}
              </h1>
              <p className="text-gray-400">
                Vector database monitoring and RAG integration visualization
                {!qdrantAvailable && (
                  <span className="text-yellow-400 ml-1">*Demo Data</span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Service Status Indicator */}
            <div className={`flex items-center space-x-2 px-3 py-1 rounded-md text-sm ${
              qdrantAvailable 
                ? 'bg-green-900 text-green-400' 
                : 'bg-red-900 text-red-400'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                qdrantAvailable ? 'bg-green-400' : 'bg-red-400'
              }`}></div>
              <span>{qdrantAvailable ? 'Qdrant Connected' : 'Qdrant Offline'}</span>
            </div>
            
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-white"
              disabled={!qdrantAvailable}
            >
              <option value={1000}>1s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
            </select>
            
            <button
              onClick={handleRefresh}
              disabled={!qdrantAvailable}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                qdrantAvailable 
                  ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            
            <a
              href={qdrantAvailable ? `${QDRANT_URL}/dashboard` : "#"}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors ${
                qdrantAvailable 
                  ? 'bg-gray-600 hover:bg-gray-500 text-white' 
                  : 'bg-gray-700 text-gray-500 cursor-not-allowed'
              }`}
              onClick={!qdrantAvailable ? (e) => e.preventDefault() : undefined}
            >
              <ExternalLink className="w-4 h-4" />
              <span>Qdrant UI</span>
            </a>
          </div>
        </div>
      </div>

      {/* React Flow Visualization */}
      <div className="h-[calc(100vh-120px)]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          className="bg-gray-900"
        >
          <Controls className="bg-gray-800 border-gray-700" />
          <MiniMap 
            className="bg-gray-800 border-gray-700"
            nodeColor={(node) => {
              switch (node.type) {
                case 'qdrantCollection': return '#8b5cf6';
                case 'vectorMetrics': return '#3b82f6';
                case 'performance': return '#10b981';
                case 'ragIntegration': return '#f59e0b';
                case 'systemHealth': return '#06b6d4';
                default: return '#6b7280';
              }
            }}
          />
          <Background color="#374151" gap={20} />
        </ReactFlow>
      </div>
    </div>
  );
};

export default QdrantReactFlowDashboard;
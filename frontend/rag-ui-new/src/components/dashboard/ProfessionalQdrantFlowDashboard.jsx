/**
 * Professional Qdrant React Flow Dashboard
 * 
 * Enhanced with React Flow advanced features:
 * - Custom node shapes and colors
 * - Interactive zoom controls
 * - Real-time data visualization
 * - Professional UI components
 * - Advanced node interactions
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MarkerType,
  Position,
  NodeResizer,
  NodeToolbar,
  Panel,
  useReactFlow,
  useOnSelectionChange,
  useKeyPress
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
  HardDrive,
  Server,
  Network,
  RefreshCw,
  Settings,
  Eye,
  ExternalLink,
  AlertCircle,
  CheckCircle,
  Clock,
  Play,
  Pause,
  RotateCcw,
  Maximize2,
  Minimize2,
  Filter,
  Download,
  Upload,
  Trash2,
  Plus,
  Minus
} from 'lucide-react';

// Enhanced Node Components with Professional Styling
const QdrantCollectionNode = ({ data, selected }) => {
  const { collection, metrics, isRealTime, status } = data;
  
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy': return 'border-green-400 bg-green-900/20';
      case 'warning': return 'border-yellow-400 bg-yellow-900/20';
      case 'error': return 'border-red-400 bg-red-900/20';
      default: return 'border-purple-400 bg-purple-900/20';
    }
  };

  return (
    <div className={`relative group ${getStatusColor(status)} border-2 rounded-xl p-6 min-w-[320px] shadow-xl transition-all duration-300 hover:shadow-2xl ${
      selected ? 'ring-2 ring-purple-300 ring-opacity-50' : ''
    }`}>
      <NodeResizer 
        color="#8b5cf6" 
        isVisible={selected}
        minWidth={280}
        minHeight={200}
      />
      
      <NodeToolbar isVisible={selected} position={Position.Top}>
        <div className="flex space-x-2">
          <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white">
            <Settings className="w-4 h-4" />
          </button>
          <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white">
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-2 bg-red-700 hover:bg-red-600 rounded text-white">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </NodeToolbar>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-600 rounded-lg">
            <Database className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">{collection.name}</h3>
            <p className="text-sm text-gray-400">Vector Collection</p>
          </div>
        </div>
        {isRealTime && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400 font-medium">LIVE</span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Status:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              collection.status === 'green' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'
            }`}>
              {collection.status}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Vectors:</span>
            <span className="text-white font-mono text-lg">{collection.points_count?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Dimensions:</span>
            <span className="text-white font-semibold">{collection.config?.params?.vectors?.size}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-400">Distance:</span>
            <span className="text-white">{collection.config?.params?.vectors?.distance}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Segments:</span>
            <span className="text-white">{collection.segments_count}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Indexed:</span>
            <span className="text-white font-mono">{metrics?.indexed_vectors_count?.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Progress Bar for Indexing */}
      <div className="mt-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Index Progress</span>
          <span>{Math.round((metrics?.indexed_vectors_count / collection.points_count) * 100)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-purple-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${Math.round((metrics?.indexed_vectors_count / collection.points_count) * 100)}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

const VectorMetricsNode = ({ data, selected }) => {
  const { metrics, isRealTime } = data;
  
  return (
    <div className={`relative group bg-gradient-to-br from-blue-900/30 to-blue-800/20 border-2 border-blue-400 rounded-xl p-6 min-w-[280px] shadow-xl transition-all duration-300 hover:shadow-2xl ${
      selected ? 'ring-2 ring-blue-300 ring-opacity-50' : ''
    }`}>
      <NodeResizer 
        color="#3b82f6" 
        isVisible={selected}
        minWidth={260}
        minHeight={180}
      />
      
      <NodeToolbar isVisible={selected} position={Position.Top}>
        <div className="flex space-x-2">
          <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white">
            <BarChart3 className="w-4 h-4" />
          </button>
          <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </NodeToolbar>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-600 rounded-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Vector Metrics</h3>
            <p className="text-sm text-gray-400">Performance Analytics</p>
          </div>
        </div>
        {isRealTime && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400 font-medium">LIVE</span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-3">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex justify-between mb-1">
              <span className="text-gray-400">Search Latency</span>
              <span className="text-white font-bold">{metrics?.search_latency || 0}ms</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-blue-500 to-cyan-400 h-1.5 rounded-full"
                style={{ width: `${Math.min((metrics?.search_latency || 0) / 100 * 100, 100)}%` }}
              ></div>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex justify-between mb-1">
              <span className="text-gray-400">Memory Usage</span>
              <span className="text-white font-bold">{metrics?.memory_usage || 0}MB</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-blue-500 to-cyan-400 h-1.5 rounded-full"
                style={{ width: `${Math.min((metrics?.memory_usage || 0) / 100 * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex justify-between mb-1">
              <span className="text-gray-400">Cache Hit</span>
              <span className="text-white font-bold">{metrics?.cache_hit_ratio || 0}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-1.5">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-400 h-1.5 rounded-full"
                style={{ width: `${metrics?.cache_hit_ratio || 0}%` }}
              ></div>
            </div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex justify-between mb-1">
              <span className="text-gray-400">Index Size</span>
              <span className="text-white font-bold">{metrics?.index_size?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const PerformanceNode = ({ data, selected }) => {
  const { performance, isRealTime } = data;
  
  return (
    <div className={`relative group bg-gradient-to-br from-green-900/30 to-green-800/20 border-2 border-green-400 rounded-xl p-6 min-w-[280px] shadow-xl transition-all duration-300 hover:shadow-2xl ${
      selected ? 'ring-2 ring-green-300 ring-opacity-50' : ''
    }`}>
      <NodeResizer 
        color="#10b981" 
        isVisible={selected}
        minWidth={260}
        minHeight={200}
      />
      
      <NodeToolbar isVisible={selected} position={Position.Top}>
        <div className="flex space-x-2">
          <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white">
            <TrendingUp className="w-4 h-4" />
          </button>
          <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </NodeToolbar>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-600 rounded-lg">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Performance</h3>
            <p className="text-sm text-gray-400">Query Analytics</p>
          </div>
        </div>
        {isRealTime && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400 font-medium">LIVE</span>
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-white">{performance?.queries_per_minute || 0}</div>
            <div className="text-xs text-gray-400">Queries/min</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-white">{performance?.avg_response_time || 0}ms</div>
            <div className="text-xs text-gray-400">Avg Response</div>
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex justify-between mb-2">
            <span className="text-gray-400">Success Rate</span>
            <span className="text-white font-bold">{performance?.success_rate || 0}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
              style={{ width: `${performance?.success_rate || 0}%` }}
            ></div>
          </div>
        </div>
        
        <div className="flex justify-between text-sm">
          <span className="text-gray-400">Active Queries:</span>
          <span className="text-white font-semibold">{performance?.active_queries || 0}</span>
        </div>
      </div>
    </div>
  );
};

const RAGIntegrationNode = ({ data, selected }) => {
  const { integration, isRealTime } = data;
  
  return (
    <div className={`relative group bg-gradient-to-br from-orange-900/30 to-orange-800/20 border-2 border-orange-400 rounded-xl p-6 min-w-[320px] shadow-xl transition-all duration-300 hover:shadow-2xl ${
      selected ? 'ring-2 ring-orange-300 ring-opacity-50' : ''
    }`}>
      <NodeResizer 
        color="#f59e0b" 
        isVisible={selected}
        minWidth={300}
        minHeight={220}
      />
      
      <NodeToolbar isVisible={selected} position={Position.Top}>
        <div className="flex space-x-2">
          <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white">
            <Zap className="w-4 h-4" />
          </button>
          <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </NodeToolbar>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-orange-600 rounded-lg">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">RAG Integration</h3>
            <p className="text-sm text-gray-400">Document Processing</p>
          </div>
        </div>
        {isRealTime && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400 font-medium">LIVE</span>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="space-y-3">
          <div className="flex justify-between">
            <span className="text-gray-400">Status:</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              integration?.status === 'connected' ? 'bg-green-900 text-green-400' : 'bg-red-900 text-red-400'
            }`}>
              {integration?.status || 'disconnected'}
            </span>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-lg font-bold text-white">{integration?.documents_processed || 0}</div>
            <div className="text-xs text-gray-400">Documents</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-lg font-bold text-white">{integration?.chunks_generated || 0}</div>
            <div className="text-xs text-gray-400">Chunks</div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-lg font-bold text-white">{integration?.embeddings_generated || 0}</div>
            <div className="text-xs text-gray-400">Embeddings</div>
          </div>
          <div className="bg-gray-800/50 rounded-lg p-3">
            <div className="text-lg font-bold text-white">{integration?.processing_queue || 0}</div>
            <div className="text-xs text-gray-400">Queue</div>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Success:</span>
            <span className="text-white font-semibold">{integration?.success_rate || 0}%</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const SystemHealthNode = ({ data, selected }) => {
  const { system, isRealTime } = data;
  
  const getHealthColor = (usage) => {
    if (usage > 80) return 'text-red-400';
    if (usage > 60) return 'text-yellow-400';
    return 'text-green-400';
  };

  return (
    <div className={`relative group bg-gradient-to-br from-cyan-900/30 to-cyan-800/20 border-2 border-cyan-400 rounded-xl p-6 min-w-[280px] shadow-xl transition-all duration-300 hover:shadow-2xl ${
      selected ? 'ring-2 ring-cyan-300 ring-opacity-50' : ''
    }`}>
      <NodeResizer 
        color="#06b6d4" 
        isVisible={selected}
        minWidth={260}
        minHeight={200}
      />
      
      <NodeToolbar isVisible={selected} position={Position.Top}>
        <div className="flex space-x-2">
          <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white">
            <Activity className="w-4 h-4" />
          </button>
          <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </NodeToolbar>

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-cyan-600 rounded-lg">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">System Health</h3>
            <p className="text-sm text-gray-400">Resource Monitoring</p>
          </div>
        </div>
        {isRealTime && (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-xs text-green-400 font-medium">LIVE</span>
          </div>
        )}
      </div>
      
      <div className="space-y-3">
        {[
          { label: 'CPU', value: system?.cpu_usage || 0, icon: Cpu },
          { label: 'Memory', value: system?.memory_usage || 0, icon: Server },
          { label: 'Disk', value: system?.disk_usage || 0, icon: HardDrive },
          { label: 'Network', value: system?.network_usage || 0, icon: Network }
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-gray-800/50 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Icon className="w-4 h-4 text-gray-400" />
                <span className="text-gray-400">{label}</span>
              </div>
              <span className={`font-bold ${getHealthColor(value)}`}>{value}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-500 ${
                  value > 80 ? 'bg-gradient-to-r from-red-500 to-red-400' :
                  value > 60 ? 'bg-gradient-to-r from-yellow-500 to-yellow-400' :
                  'bg-gradient-to-r from-green-500 to-emerald-400'
                }`}
                style={{ width: `${value}%` }}
              ></div>
            </div>
          </div>
        ))}
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

const ProfessionalQdrantFlowDashboard = () => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [qdrantData, setQdrantData] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(5000);
  const [isRealTime, setIsRealTime] = useState(true);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [zoomLevel, setZoomLevel] = useState(1);

  const { fitView, zoomIn, zoomOut, zoomTo } = useReactFlow();

  // Handle selection changes
  useOnSelectionChange({
    onChange: ({ nodes }) => {
      setSelectedNodes(nodes);
    },
  });

  // Keyboard shortcuts
  useKeyPress('Delete', () => {
    if (selectedNodes.length > 0) {
      const nodeIds = selectedNodes.map(node => node.id);
      setNodes(nodes => nodes.filter(node => !nodeIds.includes(node.id)));
      setEdges(edges => edges.filter(edge => 
        !nodeIds.includes(edge.source) && !nodeIds.includes(edge.target)
      ));
    }
  });

  useKeyPress('Escape', () => {
    setSelectedNodes([]);
  });

  // Check if Qdrant service is available
  const [qdrantAvailable, setQdrantAvailable] = useState(false);

  // Check Qdrant availability
  const checkQdrantAvailability = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:6333/health', {
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
      return;
    }

    try {
      const [collectionsResponse, healthResponse] = await Promise.all([
        fetch('http://localhost:6333/collections'),
        fetch('http://localhost:6333/health')
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
          position: { x: 50, y: 50 },
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
              index_size: 13122,
              cache_hit_ratio: 92,
              compression_ratio: 15
            },
            isRealTime,
            status: 'healthy'
          }
        },
        {
          id: 'vector-metrics',
          type: 'vectorMetrics',
          position: { x: 450, y: 50 },
          data: {
            metrics: {
              indexed_vectors_count: 13122,
              search_latency: 23,
              memory_usage: 45,
              index_size: 13122,
              cache_hit_ratio: 92,
              compression_ratio: 15
            },
            isRealTime
          }
        },
        {
          id: 'performance',
          type: 'performance',
          position: { x: 50, y: 350 },
          data: {
            performance: {
              queries_per_minute: 45,
              avg_response_time: 23,
              success_rate: 98.5,
              active_queries: 3,
              throughput: 0.75
            },
            isRealTime
          }
        },
        {
          id: 'rag-integration',
          type: 'ragIntegration',
          position: { x: 450, y: 350 },
          data: {
            integration: {
              status: 'connected',
              documents_processed: 150,
              embeddings_generated: 13122,
              chunks_generated: 1500,
              processing_queue: 5,
              success_rate: 98.5
            },
            isRealTime
          }
        },
        {
          id: 'system-health',
          type: 'systemHealth',
          position: { x: 250, y: 650 },
          data: {
            system: {
              cpu_usage: 45,
              memory_usage: 62,
              disk_usage: 38,
              network_usage: 12,
              uptime: '72h'
            },
            isRealTime
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
          style: { stroke: '#8b5cf6', strokeWidth: 3 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#8b5cf6' },
          label: 'Data Flow'
        },
        {
          id: 'qdrant-to-performance',
          source: 'qdrant-main',
          target: 'performance',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#10b981', strokeWidth: 3 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#10b981' },
          label: 'Query Flow'
        },
        {
          id: 'metrics-to-rag',
          source: 'vector-metrics',
          target: 'rag-integration',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#f59e0b', strokeWidth: 3 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
          label: 'Integration'
        },
        {
          id: 'performance-to-rag',
          source: 'performance',
          target: 'rag-integration',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#f59e0b', strokeWidth: 3 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#f59e0b' },
          label: 'Performance'
        },
        {
          id: 'rag-to-system',
          source: 'rag-integration',
          target: 'system-health',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#06b6d4', strokeWidth: 3 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#06b6d4' },
          label: 'Monitoring'
        },
        {
          id: 'qdrant-to-system',
          source: 'qdrant-main',
          target: 'system-health',
          type: 'smoothstep',
          animated: true,
          style: { stroke: '#06b6d4', strokeWidth: 3 },
          markerEnd: { type: MarkerType.ArrowClosed, color: '#06b6d4' },
          label: 'Health Check'
        }
      ];

      setNodes(initialNodes);
      setEdges(initialEdges);
      setIsLoading(false);
    };

    initializeFlow();
  }, [checkQdrantAvailability, fetchQdrantData, isRealTime]);

  // Auto-refresh data
  useEffect(() => {
    if (!isRealTime || !qdrantAvailable) return;
    
    const interval = setInterval(() => {
      fetchQdrantData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [fetchQdrantData, refreshInterval, isRealTime, qdrantAvailable]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const handleRefresh = () => {
    fetchQdrantData();
  };

  const toggleRealTime = () => {
    setIsRealTime(!isRealTime);
  };

  const handleZoomIn = () => {
    zoomIn();
  };

  const handleZoomOut = () => {
    zoomOut();
  };

  const handleFitView = () => {
    fitView({ padding: 0.1 });
  };

  const handleZoomTo = (level) => {
    zoomTo(level);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-xl">Loading Professional Qdrant Dashboard...</p>
          <p className="text-gray-400 mt-2">Initializing React Flow components...</p>
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
                Professional Qdrant Flow Dashboard
                {!qdrantAvailable && (
                  <span className="text-yellow-400 text-lg ml-2">*</span>
                )}
              </h1>
              <p className="text-gray-400">
                Advanced vector database monitoring with React Flow
                {!qdrantAvailable && (
                  <span className="text-yellow-400 ml-1">*Demo Data</span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-400">Zoom:</span>
              <button onClick={handleZoomOut} className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white">
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm text-white min-w-[3rem] text-center">{Math.round(zoomLevel * 100)}%</span>
              <button onClick={handleZoomIn} className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white">
                <Plus className="w-4 h-4" />
              </button>
              <button onClick={handleFitView} className="p-2 bg-gray-700 hover:bg-gray-600 rounded text-white">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
            
            <button
              onClick={toggleRealTime}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors text-white ${
                isRealTime ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-600 hover:bg-gray-500'
              }`}
            >
              {isRealTime ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isRealTime ? 'Live' : 'Paused'}</span>
            </button>
            
            <select
              value={refreshInterval}
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
              className="bg-gray-700 border border-gray-600 rounded-md px-3 py-2 text-sm text-white"
              disabled={!isRealTime}
            >
              <option value={1000}>1s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
            </select>
            
            <button
              onClick={handleRefresh}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-white"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            
            <a
              href="http://localhost:6333/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-lg transition-colors text-white"
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
          fitViewOptions={{ padding: 0.1 }}
          className="bg-gray-900"
          onViewportChange={(viewport) => setZoomLevel(viewport.zoom)}
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
            maskColor="rgba(0, 0, 0, 0.6)"
          />
          <Background color="#374151" gap={20} />
          
          {/* Custom Panels */}
          <Panel position="top-right">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg">
              <h3 className="text-white font-semibold mb-2">Quick Actions</h3>
              <div className="space-y-2">
                <button 
                  onClick={() => handleZoomTo(0.5)}
                  className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm"
                >
                  50% Zoom
                </button>
                <button 
                  onClick={() => handleZoomTo(1)}
                  className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm"
                >
                  100% Zoom
                </button>
                <button 
                  onClick={() => handleZoomTo(2)}
                  className="w-full px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white text-sm"
                >
                  200% Zoom
                </button>
              </div>
            </div>
          </Panel>

          <Panel position="bottom-left">
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 shadow-lg">
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-purple-400 rounded-full"></div>
                  <span className="text-white">Collection</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-400 rounded-full"></div>
                  <span className="text-white">Metrics</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span className="text-white">Performance</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-orange-400 rounded-full"></div>
                  <span className="text-white">RAG Integration</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-cyan-400 rounded-full"></div>
                  <span className="text-white">System Health</span>
                </div>
              </div>
            </div>
          </Panel>
        </ReactFlow>
      </div>
    </div>
  );
};

export default ProfessionalQdrantFlowDashboard;

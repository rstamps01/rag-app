import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  Panel,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Error boundary component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('EnhancedPipelineVisualization Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-900 text-white">
          <div className="text-center">
            <div className="text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-semibold mb-2">Pipeline Visualization Error</h2>
            <p className="text-gray-400 mb-4">There was an error loading the pipeline visualization.</p>
            <button 
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Try Again
            </button>
            {this.state.error && (
              <details className="mt-4 text-left">
                <summary className="cursor-pointer text-sm text-gray-400">Error Details</summary>
                <pre className="mt-2 text-xs text-red-400 bg-gray-800 p-2 rounded overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// VAST Data Color Palette
const VAST_COLORS = {
  primary: '#00D4AA',
  secondary: '#0066CC', 
  accent: '#FF6B35',
  neutral: '#2C3E50',
  light: '#F8F9FA',
  dark: '#1A1A1A',
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6'
};

// Enhanced Pipeline Node Component
const EnhancedPipelineNode = ({ data, selected, isConnectable }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const animationRef = useRef(null);

  // Processing animation effect
  useEffect(() => {
    if (data.status === 'processing' || data.status === 'active') {
      setIsProcessing(true);
      animationRef.current = setInterval(() => {
        setIsProcessing(prev => !prev);
      }, 1000);
    } else {
      setIsProcessing(false);
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current);
      }
    };
  }, [data.status]);

  const getNodeIcon = (type) => {
    const icons = {
      'query-input': '🔍',
      'vector-search': '🗄️',
      'llm-processing': '🧠',
      'response': '📤',
      'resource-monitor': '📊',
      'data-processor': '⚙️',
      'memory-cache': '💾',
      'network-gateway': '🌐',
      'document-store': '📄'
    };
    return icons[type] || '⚡';
  };

  const getStatusColor = (status) => {
    const colors = {
      'idle': VAST_COLORS.neutral,
      'processing': VAST_COLORS.accent,
      'active': VAST_COLORS.primary,
      'success': VAST_COLORS.success,
      'error': VAST_COLORS.error,
      'warning': VAST_COLORS.warning
    };
    return colors[status] || VAST_COLORS.neutral;
  };

  const nodeStyle = {
    background: `linear-gradient(135deg, ${getStatusColor(data.status)}, ${getStatusColor(data.status)}dd)`,
    border: `2px solid ${selected ? VAST_COLORS.primary : getStatusColor(data.status)}`,
    borderRadius: '12px',
    boxShadow: selected 
      ? `0 8px 24px ${VAST_COLORS.primary}40` 
      : `0 4px 12px ${getStatusColor(data.status)}30`,
    minWidth: '200px',
    minHeight: '120px',
    opacity: 1,
    transform: isProcessing ? 'scale(1.02)' : 'scale(1)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  return (
    <div style={nodeStyle} className="enhanced-pipeline-node">
      <Handle
        type="target"
        position={Position.Left}
        style={{
          background: VAST_COLORS.primary,
          border: `2px solid ${VAST_COLORS.primary}`,
          width: 12,
          height: 12
        }}
        isConnectable={isConnectable}
      />
      
      {/* Node Header */}
      <div className="node-header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px 8px',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }}>
        <div className="flex items-center gap-2">
          <div style={{ color: 'white', fontSize: '20px' }}>
            {getNodeIcon(data.type)}
          </div>
          <div>
            <div className="font-bold text-white text-sm">{data.label}</div>
            <div className="text-xs text-white/70">{data.type}</div>
          </div>
        </div>
        
        {/* Status Indicator */}
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{
              backgroundColor: getStatusColor(data.status),
              boxShadow: `0 0 8px ${getStatusColor(data.status)}80`,
              animation: isProcessing ? 'pulse 1s infinite' : 'none'
            }}
          />
          <span 
            className="text-xs px-2 py-1 rounded-full"
            style={{ 
              backgroundColor: getStatusColor(data.status) + '20',
              color: getStatusColor(data.status)
            }}
          >
            {data.status}
          </span>
        </div>
      </div>

      {/* Node Content */}
      <div className="node-content" style={{ padding: '12px 16px' }}>
        {/* Metrics Display */}
        {data.metrics && (
          <div className="metrics-grid" style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginBottom: '8px'
          }}>
            {Object.entries(data.metrics).slice(0, 4).map(([key, value]) => (
              <div key={key} className="metric-item" style={{
                background: 'rgba(255,255,255,0.1)',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '11px'
              }}>
                <div className="text-white/70">{key.replace(/_/g, ' ')}</div>
                <div className="text-white font-semibold">
                  {typeof value === 'number' ? value.toFixed(1) : value}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="processing-indicator" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px',
            background: 'rgba(255,107,53,0.2)',
            borderRadius: '6px',
            marginTop: '8px'
          }}>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            <span className="text-xs text-white">Processing...</span>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        style={{
          background: VAST_COLORS.primary,
          border: `2px solid ${VAST_COLORS.primary}`,
          width: 12,
          height: 12
        }}
        isConnectable={isConnectable}
      />

      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.1); }
          100% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

// Animated Edge Component
const AnimatedEdge = ({ id, sourceX, sourceY, targetX, targetY, data, selected }) => {
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
  });

  const throughput = data?.throughput || 0;
  const latency = data?.latency || 0;
  const isActive = throughput > 0;
  const isHighLatency = latency > 1000;

  const getEdgeColor = () => {
    if (isHighLatency) return VAST_COLORS.error;
    if (isActive) return VAST_COLORS.primary;
    return VAST_COLORS.neutral;
  };

  const edgeColor = getEdgeColor();

  return (
    <>
      {/* Main edge path */}
      <path
        id={id}
        className="react-flow__edge-path"
        d={edgePath}
        style={{
          stroke: edgeColor,
          strokeWidth: isActive ? 4 : 2,
          strokeDasharray: isActive ? '8,4' : 'none',
          animation: isActive ? 'dash-flow 2s linear infinite' : 'none',
          filter: isActive ? `drop-shadow(0 0 4px ${edgeColor}80)` : 'none',
          strokeLinecap: 'round',
          strokeLinejoin: 'round'
        }}
        markerEnd="url(#arrowhead)"
      />
      
      {/* Throughput label */}
      {throughput > 0 && (
        <text>
          <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
            <tspan
              style={{
                fill: edgeColor,
                fontSize: '12px',
                fontWeight: 'bold',
                textShadow: `0 0 4px ${edgeColor}80`
              }}
            >
              {throughput}/min
            </tspan>
          </textPath>
        </text>
      )}

      <style jsx>{`
        @keyframes dash-flow {
          to { stroke-dashoffset: -12; }
        }
      `}</style>
    </>
  );
};

// Helper function for smooth step path
const getSmoothStepPath = ({ sourceX, sourceY, targetX, targetY }) => {
  const centerX = (sourceX + targetX) / 2;
  const centerY = (sourceY + targetY) / 2;
  
  const path = `M ${sourceX} ${sourceY} L ${centerX} ${sourceY} L ${centerX} ${targetY} L ${targetX} ${targetY}`;
  
  return [path, centerX, centerY];
};

// Main Enhanced Pipeline Visualization Component
const EnhancedPipelineVisualization = ({ 
  realTimeData, 
  connectionStatus, 
  onDebugToggle, 
  debugMode = false 
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const reactFlowInstance = useReactFlow();

  // Debug logging
  console.log('EnhancedPipelineVisualization rendered with:', {
    realTimeData: !!realTimeData,
    connectionStatus,
    nodesCount: nodes.length,
    edgesCount: edges.length
  });

  // Initialize nodes with RAG pipeline stages
  useEffect(() => {
    const initialNodes = [
      {
        id: 'upload',
        type: 'enhancedNode',
        position: { x: 100, y: 200 },
        data: {
          label: 'Upload',
          type: 'query-input',
          status: 'idle',
          health: 'unknown',
          metrics: {
            throughput: 0,
            latency: 0,
            active_uploads: 0
          }
        }
      },
      {
        id: 'chunk',
        type: 'enhancedNode',
        position: { x: 350, y: 200 },
        data: {
          label: 'Chunk',
          type: 'data-processor',
          status: 'idle',
          health: 'unknown',
          metrics: {
            throughput: 0,
            latency: 0,
            chunks_processed: 0
          }
        }
      },
      {
        id: 'embed',
        type: 'enhancedNode',
        position: { x: 600, y: 200 },
        data: {
          label: 'Embed',
          type: 'llm-processing',
          status: 'idle',
          health: 'unknown',
          metrics: {
            throughput: 0,
            latency: 0,
            vectors_created: 0
          }
        }
      },
      {
        id: 'upsert',
        type: 'enhancedNode',
        position: { x: 850, y: 200 },
        data: {
          label: 'Upsert',
          type: 'vector-search',
          status: 'idle',
          health: 'unknown',
          metrics: {
            throughput: 0,
            latency: 0,
            vectors_stored: 0
          }
        }
      },
      {
        id: 'search',
        type: 'enhancedNode',
        position: { x: 100, y: 400 },
        data: {
          label: 'Search',
          type: 'vector-search',
          status: 'idle',
          health: 'unknown',
          metrics: {
            throughput: 0,
            latency: 0,
            search_queries: 0
          }
        }
      },
      {
        id: 'generate',
        type: 'enhancedNode',
        position: { x: 350, y: 400 },
        data: {
          label: 'Generate',
          type: 'llm-processing',
          status: 'idle',
          health: 'unknown',
          metrics: {
            throughput: 0,
            latency: 0,
            responses_generated: 0
          }
        }
      },
      {
        id: 'resource-monitor',
        type: 'enhancedNode',
        position: { x: 600, y: 400 },
        data: {
          label: 'Resource Monitor',
          type: 'resource-monitor',
          status: 'active',
          health: 'healthy',
          metrics: {
            cpu_percent: 0,
            memory_percent: 0,
            gpu_utilization: 0,
            gpu_temperature: 0
          }
        }
      }
    ];

    const initialEdges = [
      {
        id: 'upload-to-chunk',
        source: 'upload',
        target: 'chunk',
        type: 'animated',
        data: { throughput: 0, latency: 0 }
      },
      {
        id: 'chunk-to-embed',
        source: 'chunk',
        target: 'embed',
        type: 'animated',
        data: { throughput: 0, latency: 0 }
      },
      {
        id: 'embed-to-upsert',
        source: 'embed',
        target: 'upsert',
        type: 'animated',
        data: { throughput: 0, latency: 0 }
      },
      {
        id: 'search-to-generate',
        source: 'search',
        target: 'generate',
        type: 'animated',
        data: { throughput: 0, latency: 0 }
      }
    ];

    setNodes(initialNodes);
    setEdges(initialEdges);
  }, []);

  // Update nodes with real-time data
  useEffect(() => {
    if (!realTimeData) return;

    setNodes(prevNodes => 
      prevNodes.map(node => {
        const { system_health, gpu_performance, pipeline_status } = realTimeData;
        const gpu = gpu_performance && gpu_performance.length > 0 ? gpu_performance[0] : {};
        
        // Determine status based on real data
        let status = 'idle';
        let health = 'unknown';
        
        if (node.id === 'resource-monitor') {
          status = 'active';
          health = system_health.cpu_percent > 90 ? 'critical' : 
                  system_health.cpu_percent > 80 ? 'warning' : 'healthy';
        } else if (pipeline_status.active_queries > 0) {
          // Simulate processing in different stages
          const stageOrder = ['search', 'generate', 'upload', 'chunk', 'embed', 'upsert'];
          const stageIndex = stageOrder.indexOf(node.id);
          if (stageIndex >= 0 && stageIndex < 2) {
            status = 'processing';
            health = 'healthy';
          } else if (stageIndex >= 2) {
            status = 'active';
            health = 'healthy';
          }
        }

        // Update metrics based on node type
        let metrics = { ...node.data.metrics };
        
        if (node.id === 'resource-monitor') {
          metrics = {
            cpu_percent: system_health.cpu_percent || 0,
            memory_percent: system_health.memory_percent || 0,
            gpu_utilization: gpu.utilization || 0,
            gpu_temperature: gpu.temperature || 0
          };
        } else {
          metrics = {
            ...metrics,
            throughput: pipeline_status.queries_per_minute || 0,
            latency: pipeline_status.avg_response_time || 0
          };
        }

        return {
          ...node,
          data: {
            ...node.data,
            status,
            health,
            metrics
          }
        };
      })
    );

    // Update edge data
    setEdges(prevEdges =>
      prevEdges.map(edge => ({
        ...edge,
        data: {
          ...edge.data,
          throughput: realTimeData.pipeline_status?.queries_per_minute || 0,
          latency: realTimeData.pipeline_status?.avg_response_time || 0
        }
      }))
    );
  }, [realTimeData]);

  const nodeTypes = useMemo(() => ({
    enhancedNode: EnhancedPipelineNode,
  }), []);

  const edgeTypes = useMemo(() => ({
    animated: AnimatedEdge,
  }), []);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge({
      ...params,
      type: 'animated',
      data: { throughput: 0, latency: 0 }
    }, eds)),
    [setEdges]
  );

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
    console.log('Node clicked:', node);
  }, []);

  // Error boundary fallback
  if (nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-6xl mb-4">⚙️</div>
          <h2 className="text-2xl font-semibold mb-2">Initializing Pipeline Visualization</h2>
          <p className="text-gray-400">Setting up enhanced pipeline components...</p>
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="enhanced-pipeline-container h-screen w-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          fitView
          fitViewOptions={{ padding: 0.1 }}
          proOptions={{ hideAttribution: true }}
        >
        {/* Custom Arrow Marker */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill={VAST_COLORS.primary}
            />
          </marker>
        </defs>

        <Background gap={20} size={1} color={VAST_COLORS.primary} style={{ opacity: 0.1 }} />
        <Controls style={{ background: VAST_COLORS.dark, border: `1px solid ${VAST_COLORS.primary}40` }} />
        <MiniMap
          nodeColor={(node) => {
            const statusColors = {
              'idle': VAST_COLORS.neutral,
              'processing': VAST_COLORS.accent,
              'active': VAST_COLORS.primary,
              'success': VAST_COLORS.success,
              'error': VAST_COLORS.error
            };
            return statusColors[node.data.status] || VAST_COLORS.neutral;
          }}
          style={{ background: VAST_COLORS.dark, border: `1px solid ${VAST_COLORS.primary}40` }}
        />

        {/* Control Panel */}
        <Panel position="top-left" className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsAnimating(!isAnimating)}
                className={`px-3 py-2 rounded text-sm font-medium ${
                  isAnimating 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                }`}
              >
                {isAnimating ? '⏸️ Pause' : '▶️ Play'}
              </button>
              
              {onDebugToggle && (
                <button
                  onClick={onDebugToggle}
                  className={`px-3 py-2 rounded text-sm font-medium ${
                    debugMode 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-600 text-white hover:bg-gray-700'
                  }`}
                >
                  🔧 Debug
                </button>
              )}
            </div>

            <div className="text-sm text-gray-600">
              <div>Status: {isAnimating ? 'Live' : 'Paused'}</div>
              <div>Connection: {connectionStatus || 'Unknown'}</div>
              <div>Nodes: {nodes.length}</div>
              <div>Connections: {edges.length}</div>
            </div>
          </div>
        </Panel>
      </ReactFlow>
      </div>
    </ErrorBoundary>
  );
};

export default EnhancedPipelineVisualization;

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
import AdvancedDataFlowAnimations from './AdvancedDataFlowAnimations';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Play, 
  Pause, 
  Settings, 
  Palette, 
  Zap, 
  Database, 
  Cpu, 
  MemoryStick,
  Network,
  FileText,
  Search,
  Brain,
  Send,
  BarChart3,
  Activity
} from 'lucide-react';

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

// Dynamic Pipeline Node Component
const DynamicPipelineNode = ({ data, selected, isConnectable }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [customization, setCustomization] = useState(data.customization || {});
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
      'query-input': <Search className="w-5 h-5" />,
      'vector-search': <Database className="w-5 h-5" />,
      'llm-processing': <Brain className="w-5 h-5" />,
      'response': <Send className="w-5 h-5" />,
      'resource-monitor': <BarChart3 className="w-5 h-5" />,
      'data-processor': <Cpu className="w-5 h-5" />,
      'memory-cache': <MemoryStick className="w-5 h-5" />,
      'network-gateway': <Network className="w-5 h-5" />,
      'document-store': <FileText className="w-5 h-5" />
    };
    return icons[type] || <Activity className="w-5 h-5" />;
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
    background: `linear-gradient(135deg, ${customization.backgroundColor || getStatusColor(data.status)}, ${customization.backgroundColor || getStatusColor(data.status)}dd)`,
    border: `2px solid ${selected ? VAST_COLORS.primary : customization.borderColor || getStatusColor(data.status)}`,
    borderRadius: customization.borderRadius || '12px',
    boxShadow: selected 
      ? `0 8px 24px ${VAST_COLORS.primary}40` 
      : `0 4px 12px ${customization.shadowColor || getStatusColor(data.status)}30`,
    minWidth: customization.minWidth || '200px',
    minHeight: customization.minHeight || '120px',
    opacity: customization.opacity || 1,
    transform: isProcessing ? 'scale(1.02)' : 'scale(1)',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  };

  return (
    <div style={nodeStyle} className="dynamic-pipeline-node">
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
          <div style={{ color: 'white' }}>
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
          <Badge 
            variant="secondary" 
            className="text-xs"
            style={{ 
              backgroundColor: getStatusColor(data.status) + '20',
              color: getStatusColor(data.status)
            }}
          >
            {data.status}
          </Badge>
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

        {/* Advanced Processing Indicator */}
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
            <AdvancedDataFlowAnimations.ProcessingIndicator 
              status={data.status}
              intensity={1}
              size={16}
              color={getStatusColor(data.status)}
            />
            <span className="text-xs text-white">Processing...</span>
          </div>
        )}

        {/* Throughput Indicator */}
        {data.metrics?.throughput > 0 && (
          <div style={{ marginTop: '8px', display: 'flex', justifyContent: 'center' }}>
            <AdvancedDataFlowAnimations.ThroughputIndicator 
              throughput={data.metrics.throughput}
              maxThroughput={100}
              size={40}
              showLabel={false}
            />
          </div>
        )}

        {/* Memory Usage Visualization */}
        {data.metrics?.memory_percent && (
          <div style={{ marginTop: '8px' }}>
            <AdvancedDataFlowAnimations.MemoryUsageVisualization 
              used={data.metrics.memory_percent}
              total={100}
              width={180}
              height={30}
            />
          </div>
        )}

        {/* Custom Information */}
        {customization.showCustomInfo && (
          <div className="custom-info" style={{
            marginTop: '8px',
            padding: '8px',
            background: 'rgba(255,255,255,0.05)',
            borderRadius: '6px',
            fontSize: '11px',
            color: 'white'
          }}>
            {customization.customInfo || 'Custom information here'}
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
      
      {/* Advanced Data Flow Particles */}
      <AdvancedDataFlowAnimations.DataFlowParticles
        sourceX={sourceX}
        sourceY={sourceY}
        targetX={targetX}
        targetY={targetY}
        isActive={isActive}
        throughput={throughput}
        particleCount={Math.min(Math.floor(throughput / 10) + 3, 8)}
        speed={1 + (throughput / 100)}
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

      <AdvancedDataFlowAnimations.AnimationStyles />
      <style jsx>{`
        @keyframes dash-flow {
          to { stroke-dashoffset: -12; }
        }
        
        @keyframes particle-flow {
          0% { opacity: 0; }
          10% { opacity: 0.8; }
          90% { opacity: 0.8; }
          100% { opacity: 0; }
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

// Node customization panel
const NodeCustomizationPanel = ({ selectedNode, onUpdate, onClose }) => {
  const [customization, setCustomization] = useState(selectedNode?.data?.customization || {});

  const handleUpdate = (key, value) => {
    const newCustomization = { ...customization, [key]: value };
    setCustomization(newCustomization);
    onUpdate(selectedNode.id, newCustomization);
  };

  if (!selectedNode) return null;

  return (
    <div className="fixed right-0 top-0 h-full w-80 bg-white shadow-lg z-50 border-l">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Customize Node</h3>
          <Button onClick={onClose} variant="ghost" size="sm">×</Button>
        </div>
        <p className="text-sm text-gray-600">{selectedNode.data.label}</p>
      </div>
      
      <div className="p-4 space-y-6 overflow-y-auto h-full">
        {/* Visual Customization */}
        <div>
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <Palette className="w-4 h-4" />
            Visual Properties
          </h4>
          
          <div className="space-y-4">
            <div>
              <Label>Background Color</Label>
              <Input
                type="color"
                value={customization.backgroundColor || VAST_COLORS.primary}
                onChange={(e) => handleUpdate('backgroundColor', e.target.value)}
                className="w-full"
              />
            </div>
            
            <div>
              <Label>Border Color</Label>
              <Input
                type="color"
                value={customization.borderColor || VAST_COLORS.primary}
                onChange={(e) => handleUpdate('borderColor', e.target.value)}
                className="w-full"
              />
            </div>
            
            <div>
              <Label>Border Radius: {customization.borderRadius || 12}px</Label>
              <Slider
                value={[customization.borderRadius || 12]}
                onValueChange={([value]) => handleUpdate('borderRadius', value)}
                min={0}
                max={30}
                step={1}
                className="w-full"
              />
            </div>
            
            <div>
              <Label>Opacity: {Math.round((customization.opacity || 1) * 100)}%</Label>
              <Slider
                value={[customization.opacity || 1]}
                onValueChange={([value]) => handleUpdate('opacity', value)}
                min={0.1}
                max={1}
                step={0.1}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Size Customization */}
        <div>
          <h4 className="font-semibold mb-3">Size Properties</h4>
          
          <div className="space-y-4">
            <div>
              <Label>Min Width: {customization.minWidth || 200}px</Label>
              <Slider
                value={[parseInt(customization.minWidth || 200)]}
                onValueChange={([value]) => handleUpdate('minWidth', value)}
                min={150}
                max={400}
                step={10}
                className="w-full"
              />
            </div>
            
            <div>
              <Label>Min Height: {customization.minHeight || 120}px</Label>
              <Slider
                value={[parseInt(customization.minHeight || 120)]}
                onValueChange={([value]) => handleUpdate('minHeight', value)}
                min={80}
                max={300}
                step={10}
                className="w-full"
              />
            </div>
          </div>
        </div>

        {/* Information Customization */}
        <div>
          <h4 className="font-semibold mb-3">Information Display</h4>
          
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="showCustomInfo"
                checked={customization.showCustomInfo || false}
                onCheckedChange={(checked) => handleUpdate('showCustomInfo', checked)}
              />
              <Label htmlFor="showCustomInfo">Show Custom Information</Label>
            </div>
            
            {customization.showCustomInfo && (
              <div>
                <Label>Custom Information</Label>
                <textarea
                  value={customization.customInfo || ''}
                  onChange={(e) => handleUpdate('customInfo', e.target.value)}
                  className="w-full p-2 border rounded-md text-sm"
                  rows={3}
                  placeholder="Enter custom information..."
                />
              </div>
            )}
          </div>
        </div>

        {/* Reset Button */}
        <Button
          onClick={() => {
            setCustomization({});
            onUpdate(selectedNode.id, {});
          }}
          variant="outline"
          className="w-full"
        >
          Reset to Default
        </Button>
      </div>
    </div>
  );
};

// Main Dynamic Pipeline Visualization Component
const DynamicPipelineVisualization = ({ 
  realTimeData, 
  connectionStatus, 
  onDebugToggle, 
  debugMode = false 
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [isAnimating, setIsAnimating] = useState(true);
  const [showCustomization, setShowCustomization] = useState(false);
  const reactFlowInstance = useReactFlow();

  // Initialize nodes with RAG pipeline stages
  useEffect(() => {
    const initialNodes = [
      {
        id: 'upload',
        type: 'dynamicNode',
        position: { x: 100, y: 200 },
        data: {
          label: 'Upload',
          type: 'upload',
          status: 'idle',
          health: 'unknown',
          metrics: {
            throughput: 0,
            latency: 0,
            active_uploads: 0
          },
          customization: {}
        }
      },
      {
        id: 'chunk',
        type: 'dynamicNode',
        position: { x: 350, y: 200 },
        data: {
          label: 'Chunk',
          type: 'chunk',
          status: 'idle',
          health: 'unknown',
          metrics: {
            throughput: 0,
            latency: 0,
            chunks_processed: 0
          },
          customization: {}
        }
      },
      {
        id: 'embed',
        type: 'dynamicNode',
        position: { x: 600, y: 200 },
        data: {
          label: 'Embed',
          type: 'embed',
          status: 'idle',
          health: 'unknown',
          metrics: {
            throughput: 0,
            latency: 0,
            vectors_created: 0
          },
          customization: {}
        }
      },
      {
        id: 'upsert',
        type: 'dynamicNode',
        position: { x: 850, y: 200 },
        data: {
          label: 'Upsert',
          type: 'upsert',
          status: 'idle',
          health: 'unknown',
          metrics: {
            throughput: 0,
            latency: 0,
            vectors_stored: 0
          },
          customization: {}
        }
      },
      {
        id: 'search',
        type: 'dynamicNode',
        position: { x: 100, y: 400 },
        data: {
          label: 'Search',
          type: 'search',
          status: 'idle',
          health: 'unknown',
          metrics: {
            throughput: 0,
            latency: 0,
            search_queries: 0
          },
          customization: {}
        }
      },
      {
        id: 'generate',
        type: 'dynamicNode',
        position: { x: 350, y: 400 },
        data: {
          label: 'Generate',
          type: 'generate',
          status: 'idle',
          health: 'unknown',
          metrics: {
            throughput: 0,
            latency: 0,
            responses_generated: 0
          },
          customization: {}
        }
      },
      {
        id: 'resource-monitor',
        type: 'dynamicNode',
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
          },
          customization: {}
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
    dynamicNode: DynamicPipelineNode,
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
    setShowCustomization(true);
  }, []);

  const onNodeUpdate = useCallback((nodeId, customization) => {
    setNodes(prevNodes =>
      prevNodes.map(node =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, customization } }
          : node
      )
    );
  }, [setNodes]);

  const onAddNode = useCallback((type) => {
    const newNode = {
      id: `${type}-${Date.now()}`,
      type: 'dynamicNode',
      position: { x: Math.random() * 800 + 100, y: Math.random() * 400 + 100 },
      data: {
        label: type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        type: type,
        status: 'idle',
        health: 'healthy',
        metrics: {},
        customization: {}
      }
    };
    setNodes(prevNodes => [...prevNodes, newNode]);
  }, [setNodes]);

  return (
    <div className="dynamic-pipeline-container h-screen w-full">
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
              <Button
                onClick={() => setIsAnimating(!isAnimating)}
                variant={isAnimating ? "default" : "outline"}
                size="sm"
              >
                {isAnimating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                {isAnimating ? 'Pause' : 'Play'}
              </Button>
              
              <Button
                onClick={() => setShowCustomization(!showCustomization)}
                variant={showCustomization ? "default" : "outline"}
                size="sm"
              >
                <Settings className="w-4 h-4" />
                Customize
              </Button>

              {onDebugToggle && (
                <Button
                  onClick={onDebugToggle}
                  variant={debugMode ? "default" : "outline"}
                  size="sm"
                >
                  <Activity className="w-4 h-4" />
                  Debug
                </Button>
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

        {/* Add Node Panel */}
        <Panel position="top-right" className="bg-white/90 backdrop-blur-sm rounded-lg shadow-lg p-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm">Add Components</h4>
            <div className="grid grid-cols-2 gap-2">
              {['data-processor', 'memory-cache', 'network-gateway', 'document-store'].map(type => (
                <Button
                  key={type}
                  onClick={() => onAddNode(type)}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  {type.replace('-', ' ')}
                </Button>
              ))}
            </div>
          </div>
        </Panel>
      </ReactFlow>

      {/* Node Customization Panel */}
      {showCustomization && (
        <NodeCustomizationPanel
          selectedNode={selectedNode}
          onUpdate={onNodeUpdate}
          onClose={() => setShowCustomization(false)}
        />
      )}
    </div>
  );
};

export default DynamicPipelineVisualization;

/*
  Version: v2.0.0.0 - Enhanced Pipeline Interactions

  Location: frontend/rag-ui-new/src/components/

  PipelineGraph.jsx

  This enhanced component uses React Flow to render an interactive
  node‑based graph of your RAG pipeline with advanced interaction features:
  - Click nodes for detailed component metrics
  - Hover effects with real-time data tooltips
  - Status tooltips with performance data
  - Component health indicators
  - Animated data flow between nodes
  - Throughput metrics on edges

  Usage:

    import PipelineGraph from './PipelineGraph';

    const stages = [
      { id: 'upload', label: 'Upload', status: 'idle', metrics: { throughput: 0, latency: 0 } },
      { id: 'chunk', label: 'Chunk', status: 'processing', metrics: { throughput: 5, latency: 120 } },
      { id: 'embed', label: 'Embed', status: 'idle', metrics: { throughput: 0, latency: 0 } },
      { id: 'upsert', label: 'Upsert to Qdrant', status: 'idle', metrics: { throughput: 0, latency: 0 } },
    ];
    const edges = [
      { id: 'e1-2', source: 'upload', target: 'chunk', throughput: 5 },
      { id: 'e2-3', source: 'chunk', target: 'embed', throughput: 3 },
      { id: 'e3-4', source: 'embed', target: 'upsert', throughput: 2 },
    ];

    <PipelineGraph 
      stages={stages} 
      edges={edges} 
      onNodeClick={(stage) => {
        console.log('Clicked stage', stage);
      }}
      onNodeHover={(stage) => {
        console.log('Hovered stage', stage);
      }}
    />

  Note: This component requires ``reactflow`` to be installed.  You can
  add it to your project with ``npm install reactflow`` or ``yarn
  add reactflow``.  The default styling is imported from the library.
*/

import React, { useMemo, useCallback, useEffect, useState } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  Handle,
  Position,
  EdgeLabelRenderer,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

// VAST Data branded status colors
const STATUS_COLOURS = {
  idle: '#6c7ae0',        // blue
  processing: '#f8b400',   // yellow
  error: '#e05858',       // red
  complete: '#4caf50',    // green
  warning: '#ff9800',     // orange
  success: '#00D4AA',     // VAST teal
  active: '#0066CC',      // VAST blue
  default: '#9e9e9e',     // grey
};

// VAST Data color palette
const VAST_COLORS = {
  primary: '#00D4AA',      // Teal/Green
  secondary: '#0066CC',    // Blue
  accent: '#FF6B35',       // Orange
  neutral: '#2C3E50',      // Dark Blue-Grey
  light: '#F8F9FA',        // Light Grey
  dark: '#1A1A1A',         // Dark Background
};

// Health indicator colors
const HEALTH_COLOURS = {
  healthy: '#4caf50',     // green
  warning: '#ff9800',     // orange
  critical: '#e05858',    // red
  unknown: '#9e9e9e',     // grey
};

// Enhanced custom node component with VAST Data branding and real-time features
const StageNode = ({ data, selected, onMouseEnter, onMouseLeave }) => {
  const [isHovered, setIsHovered] = useState(false);
  const colour = STATUS_COLOURS[data.status] || STATUS_COLOURS.default;
  const healthColor = HEALTH_COLOURS[data.health] || HEALTH_COLOURS.unknown;
  
  // Calculate health status based on metrics
  const getHealthStatus = (metrics) => {
    if (!metrics) return 'unknown';
    const { throughput, latency, errorRate } = metrics;
    
    if (errorRate > 0.1) return 'critical';
    if (latency > 5000 || throughput === 0) return 'warning';
    return 'healthy';
  };
  
  const healthStatus = getHealthStatus(data.metrics);
  const isProcessing = data.status === 'processing' || data.status === 'active';
  const isError = data.status === 'error';
  const isSuccess = data.status === 'success' || data.status === 'complete';
  
  // Get node icon based on type
  const getNodeIcon = (label) => {
    const iconMap = {
      'Query Input': '🔍',
      'Vector Search': '🎯',
      'LLM Processing': '🧠',
      'Response': '📤',
      'Resource Monitor': '📊',
      'Document Upload': '📄',
      'Embedding': '🔢',
      'Context Prep': '📝'
    };
    return iconMap[label] || '⚙️';
  };
  
  return (
    <div
      className={`vast-node stage-node ${selected ? 'selected' : ''} ${isProcessing ? 'processing' : ''} ${isError ? 'error' : ''} ${isSuccess ? 'success' : ''}`}
      style={{
        padding: 16,
        borderRadius: 16,
        background: `linear-gradient(135deg, ${colour}, ${colour}dd)`,
        color: '#fff',
        minWidth: 180,
        textAlign: 'center',
        boxShadow: selected 
          ? `0 8px 24px ${VAST_COLORS.primary}40` 
          : isHovered 
            ? `0 6px 20px ${colour}60` 
            : `0 4px 12px ${colour}30`,
        border: selected ? `3px solid ${VAST_COLORS.primary}` : `2px solid ${colour}80`,
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        setIsHovered(true);
        onMouseEnter?.(e, data);
      }}
      onMouseLeave={(e) => {
        setIsHovered(false);
        onMouseLeave?.(e, data);
      }}
    >
      <Handle type="target" position={Position.Left} style={{ 
        borderRadius: 0, 
        background: VAST_COLORS.primary,
        border: `2px solid ${VAST_COLORS.primary}`,
        width: 12,
        height: 12
      }} />
      
      {/* VAST Data branded header */}
      <div className="node-header" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 8
      }}>
        <div className="node-icon" style={{ fontSize: '1.2rem' }}>
          {getNodeIcon(data.label)}
        </div>
        <div className="node-title" style={{ 
          fontWeight: 700, 
          fontSize: '0.9rem',
          flex: 1,
          margin: '0 8px'
        }}>
          {data.label}
        </div>
        <div
          className={`health-indicator ${healthStatus}`}
          style={{
            width: 10,
            height: 10,
            borderRadius: '50%',
            backgroundColor: HEALTH_COLOURS[healthStatus],
            border: '2px solid #fff',
            boxShadow: `0 0 8px ${HEALTH_COLOURS[healthStatus]}80`
          }}
        />
      </div>
      
      {/* Status indicator */}
      <div className="status-indicator" style={{
        fontSize: '0.75rem',
        fontWeight: 600,
        marginBottom: 8,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        opacity: 0.9
      }}>
        {data.status}
      </div>
      
      {/* Real-time metrics display */}
      {data.metrics && (
        <div className="node-metrics" style={{
          fontSize: '0.7rem',
          marginTop: 8,
          opacity: 0.9,
          display: 'flex',
          flexDirection: 'column',
          gap: 4
        }}>
          {data.metrics.throughput > 0 && (
            <div className="metric-item" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '2px 6px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 4
            }}>
              <span>📊</span>
              <span>{data.metrics.throughput}/min</span>
            </div>
          )}
          {data.metrics.latency > 0 && (
            <div className="metric-item" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '2px 6px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 4
            }}>
              <span>⏱️</span>
              <span>{data.metrics.latency}ms</span>
            </div>
          )}
          {data.metrics.errorRate > 0 && (
            <div className="metric-item error" style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '2px 6px',
              background: 'rgba(224, 88, 88, 0.2)',
              borderRadius: 4,
              color: '#ff4444'
            }}>
              <span>⚠️</span>
              <span>{(data.metrics.errorRate * 100).toFixed(1)}%</span>
            </div>
          )}
        </div>
      )}
      
      {/* Processing animation overlay */}
      {isProcessing && (
        <div className="processing-overlay" style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
          animation: 'shimmer 2s infinite',
          pointerEvents: 'none'
        }} />
      )}
      
      {/* Processing indicator dot */}
      {isProcessing && (
        <div
          className="processing-dot"
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: VAST_COLORS.accent,
            animation: 'pulse 1.5s infinite',
            boxShadow: `0 0 8px ${VAST_COLORS.accent}80`
          }}
        />
      )}
      
      {/* Success indicator */}
      {isSuccess && (
        <div
          className="success-indicator"
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: VAST_COLORS.primary,
            boxShadow: `0 0 8px ${VAST_COLORS.primary}80`
          }}
        />
      )}
      
      {/* Error indicator */}
      {isError && (
        <div
          className="error-indicator"
          style={{
            position: 'absolute',
            bottom: 8,
            right: 8,
            fontSize: '0.8rem',
            color: '#ff4444',
            animation: 'pulse-red 1s infinite'
          }}
        >
          ⚠️
        </div>
      )}
      
      <Handle type="source" position={Position.Right} style={{ 
        borderRadius: 0, 
        background: VAST_COLORS.primary,
        border: `2px solid ${VAST_COLORS.primary}`,
        width: 12,
        height: 12
      }} />
      
      {/* Enhanced CSS animations */}
      <style jsx>{`
        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes pulse-red {
          0% { opacity: 1; }
          50% { opacity: 0.3; }
          100% { opacity: 1; }
        }
        
        .vast-node.processing {
          box-shadow: 0 0 20px ${VAST_COLORS.accent}40;
        }
        
        .vast-node.error {
          box-shadow: 0 0 20px #e0585840;
        }
        
        .vast-node.success {
          box-shadow: 0 0 20px ${VAST_COLORS.primary}40;
        }
      `}</style>
    </div>
  );
};

// Enhanced edge component with VAST Data styling and real-time animations
const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, data, selected }) => {
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
  
  // Calculate edge color based on performance
  const getEdgeColor = () => {
    if (isHighLatency) return '#e05858'; // Red for high latency
    if (isActive) return VAST_COLORS.primary; // VAST teal for active
    return '#666'; // Gray for inactive
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
      />
      
      {/* Throughput label */}
      {throughput > 0 && (
        <text>
          <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
            <tspan
              style={{
                fill: edgeColor,
                fontSize: '11px',
                fontWeight: 'bold',
                textShadow: `0 0 4px ${edgeColor}80`,
                paintOrder: 'stroke fill'
              }}
            >
              {throughput}/min
            </tspan>
          </textPath>
        </text>
      )}
      
      {/* Latency indicator */}
      {latency > 0 && (
        <circle
          cx={labelX}
          cy={labelY - 15}
          r="4"
          fill={isHighLatency ? '#e05858' : VAST_COLORS.primary}
          className="latency-indicator"
          style={{
            filter: `drop-shadow(0 0 4px ${isHighLatency ? '#e05858' : VAST_COLORS.primary}80)`,
            animation: isHighLatency ? 'pulse-red 1s infinite' : 'none'
          }}
        />
      )}
      
      {/* Data flow particles */}
      {isActive && (
        <g>
          {[...Array(3)].map((_, i) => (
            <circle
              key={i}
              r="2"
              fill={VAST_COLORS.primary}
              opacity="0.8"
              className="data-particle"
              style={{
                animation: `particle-flow 3s linear infinite`,
                animationDelay: `${i * 0.5}s`
              }}
            >
              <animateMotion
                dur="3s"
                repeatCount="indefinite"
                path={edgePath}
                begin={`${i * 0.5}s`}
              />
            </circle>
          ))}
        </g>
      )}
      
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
        
        .latency-indicator {
          transition: all 0.3s ease;
        }
        
        .data-particle {
          filter: drop-shadow(0 0 2px ${VAST_COLORS.primary});
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

const nodeTypes = { stage: StageNode };
const edgeTypes = { custom: CustomEdge };

export default function PipelineGraph({ 
  stages, 
  edges, 
  onNodeClick, 
  onNodeHover,
  selectedNodeId,
  showTooltips = true,
  realTimeData = null // New prop for real-time data integration
}) {
  const [hoveredNode, setHoveredNode] = useState(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  
  // Enhanced node positioning with better layout
  const getNodePosition = (stage, idx) => {
    const baseX = idx * 250;
    const baseY = 0;
    
    // Add some vertical variation for better visual flow
    const yOffset = Math.sin(idx * 0.5) * 50;
    
    return { x: baseX, y: baseY + yOffset };
  };
  
  // Convert stages to nodes expected by React Flow with real-time data integration
  const nodes = useMemo(() => {
    return stages
      .filter(stage => stage && stage.id && stage.label) // Filter out invalid stages
      .map((stage, idx) => {
        // Merge real-time data if available
        const realTimeStageData = realTimeData?.stages?.find(s => s.id === stage.id);
        const mergedData = realTimeStageData ? { ...stage, ...realTimeStageData } : stage;
        
        return {
          id: stage.id,
          type: 'stage',
          position: getNodePosition(stage, idx),
          data: { 
            label: mergedData.label || stage.id,
            status: mergedData.status || 'idle',
            metrics: {
              throughput: mergedData.metrics?.throughput || 0,
              latency: mergedData.metrics?.latency || 0,
              errorRate: mergedData.metrics?.errorRate || 0,
              ...mergedData.metrics
            },
            health: mergedData.health || 'unknown',
            ...mergedData 
          },
          selected: selectedNodeId === stage.id,
        };
      });
  }, [stages, selectedNodeId, realTimeData]);

  // Convert plain edges to React Flow edges with real-time data integration
  const rfEdges = useMemo(() => {
    return edges.map((e) => {
      // Merge real-time edge data if available
      const realTimeEdgeData = realTimeData?.edges?.find(edge => edge.id === e.id);
      const mergedEdgeData = realTimeEdgeData ? { ...e, ...realTimeEdgeData } : e;
      
      return {
        id: e.id,
        source: e.source,
        target: e.target,
        type: 'custom',
        data: { 
          throughput: mergedEdgeData.throughput || 0,
          latency: mergedEdgeData.latency || 0,
          ...mergedEdgeData
        },
        animated: (mergedEdgeData.throughput || 0) > 0,
        style: { 
          stroke: (mergedEdgeData.throughput || 0) > 0 ? VAST_COLORS.primary : '#666',
          strokeWidth: (mergedEdgeData.throughput || 0) > 0 ? 4 : 2,
        },
      };
    });
  }, [edges, realTimeData]);

  // Handle node click events
  const onNodeClickHandler = useCallback(
    (event, node) => {
      if (typeof onNodeClick === 'function') {
        onNodeClick(node.data);
      }
    },
    [onNodeClick]
  );

  // Handle node hover events
  const onNodeMouseEnter = useCallback(
    (event, node) => {
      setHoveredNode(node.data);
      setTooltipPosition({ x: event.clientX, y: event.clientY });
      if (typeof onNodeHover === 'function') {
        onNodeHover(node.data, 'enter');
      }
    },
    [onNodeHover]
  );

  const onNodeMouseLeave = useCallback(
    (event, node) => {
      setHoveredNode(null);
      if (typeof onNodeHover === 'function') {
        onNodeHover(node.data, 'leave');
      }
    },
    [onNodeHover]
  );

  // Enhanced tooltip component with VAST Data styling
  const Tooltip = ({ node, position }) => {
    if (!node || !showTooltips) return null;
    
    return (
      <div
        className="vast-tooltip"
        style={{
          position: 'fixed',
          left: position.x + 15,
          top: position.y - 10,
          background: `linear-gradient(135deg, ${VAST_COLORS.dark}, ${VAST_COLORS.neutral})`,
          color: 'white',
          padding: '12px 16px',
          borderRadius: '12px',
          fontSize: '12px',
          zIndex: 1000,
          pointerEvents: 'none',
          boxShadow: `0 8px 24px rgba(0,0,0,0.4), 0 0 0 1px ${VAST_COLORS.primary}40`,
          border: `1px solid ${VAST_COLORS.primary}`,
          minWidth: '200px',
          backdropFilter: 'blur(10px)',
        }}
      >
        {/* Tooltip header */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '8px',
          borderBottom: `1px solid ${VAST_COLORS.primary}40`,
          paddingBottom: '6px'
        }}>
          <div style={{ fontSize: '1.2rem', marginRight: '8px' }}>
            {node.label === 'Query Input' && '🔍'}
            {node.label === 'Vector Search' && '🎯'}
            {node.label === 'LLM Processing' && '🧠'}
            {node.label === 'Response' && '📤'}
            {node.label === 'Resource Monitor' && '📊'}
            {!['Query Input', 'Vector Search', 'LLM Processing', 'Response', 'Resource Monitor'].includes(node.label) && '⚙️'}
          </div>
          <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
            {node.label}
          </div>
        </div>
        
        {/* Status indicator */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          marginBottom: '8px',
          fontSize: '11px'
        }}>
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: HEALTH_COLOURS[node.health] || HEALTH_COLOURS.unknown,
              marginRight: '6px',
              boxShadow: `0 0 6px ${HEALTH_COLOURS[node.health] || HEALTH_COLOURS.unknown}80`
            }}
          />
          <span style={{ color: '#ccc', marginRight: '8px' }}>Status:</span>
          <span style={{ 
            color: STATUS_COLOURS[node.status] || STATUS_COLOURS.default,
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {node.status}
          </span>
        </div>
        
        {/* Metrics display */}
        {node.metrics && (
          <div style={{ marginBottom: '8px' }}>
            {node.metrics.throughput > 0 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '4px 8px',
                background: 'rgba(0, 212, 170, 0.1)',
                borderRadius: '6px',
                marginBottom: '4px'
              }}>
                <span style={{ color: '#ccc' }}>📊 Throughput:</span>
                <span style={{ color: VAST_COLORS.primary, fontWeight: '600' }}>
                  {node.metrics.throughput}/min
                </span>
              </div>
            )}
            {node.metrics.latency > 0 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '4px 8px',
                background: 'rgba(0, 102, 204, 0.1)',
                borderRadius: '6px',
                marginBottom: '4px'
              }}>
                <span style={{ color: '#ccc' }}>⏱️ Latency:</span>
                <span style={{ 
                  color: node.metrics.latency > 1000 ? '#e05858' : VAST_COLORS.secondary, 
                  fontWeight: '600' 
                }}>
                  {node.metrics.latency}ms
                </span>
              </div>
            )}
            {node.metrics.errorRate > 0 && (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                padding: '4px 8px',
                background: 'rgba(224, 88, 88, 0.1)',
                borderRadius: '6px',
                marginBottom: '4px'
              }}>
                <span style={{ color: '#ccc' }}>⚠️ Error Rate:</span>
                <span style={{ color: '#e05858', fontWeight: '600' }}>
                  {(node.metrics.errorRate * 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        )}
        
        {/* Click instruction */}
        <div style={{ 
          color: VAST_COLORS.primary, 
          marginTop: '8px',
          fontSize: '10px',
          textAlign: 'center',
          fontStyle: 'italic',
          borderTop: `1px solid ${VAST_COLORS.primary}40`,
          paddingTop: '6px'
        }}>
          Click for detailed metrics
        </div>
      </div>
    );
  };


  // Error boundary for ReactFlow
  try {
    return (
      <div className="enhanced-pipeline-graph" style={{ width: '100%', height: '100%', position: 'relative' }}>
        <ReactFlow
          nodes={nodes}
          edges={rfEdges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodeClick={onNodeClickHandler}
          onNodeMouseEnter={onNodeMouseEnter}
          onNodeMouseLeave={onNodeMouseLeave}
          fitView
          fitViewOptions={{ padding: 0.1 }}
          deleteKeyCode={null} // Disable delete key
          multiSelectionKeyCode={null} // Disable multi-selection
          nodesDraggable={false} // Disable dragging
          nodesConnectable={false} // Disable connections
          elementsSelectable={true} // Enable selection for better UX
          connectionMode={null} // Disable connection mode
          onConnect={null} // Disable connect handler
          onConnectStart={null} // Disable connect start
          onConnectEnd={null} // Disable connect end
          onSelectionChange={null} // Disable selection change
          onNodesChange={null} // Disable nodes change
          onEdgesChange={null} // Disable edges change
          connectionLineType="straight" // Use straight connection lines
          connectionLineStyle={{ display: 'none' }} // Hide connection line
          defaultEdgeOptions={{ style: { display: 'none' } }} // Hide default edges
          proOptions={{ hideAttribution: true }} // Hide ReactFlow attribution
        >
          <MiniMap
            nodeColor={(node) => STATUS_COLOURS[node.data.status] || STATUS_COLOURS.default}
            style={{ 
              background: VAST_COLORS.dark,
              border: `1px solid ${VAST_COLORS.primary}40`,
              borderRadius: '8px'
            }}
            maskColor={`${VAST_COLORS.dark}80`}
          />
          <Controls 
            style={{
              background: VAST_COLORS.dark,
              border: `1px solid ${VAST_COLORS.primary}40`,
              borderRadius: '8px'
            }}
          />
          <Background 
            gap={20} 
            size={1} 
            color={VAST_COLORS.primary}
            style={{ opacity: 0.1 }}
          />
        </ReactFlow>
        
        {/* Enhanced tooltip */}
        <Tooltip node={hoveredNode} position={tooltipPosition} />
        
        {/* Connection status indicator */}
        {realTimeData && (
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: `linear-gradient(135deg, ${VAST_COLORS.dark}, ${VAST_COLORS.neutral})`,
            color: 'white',
            padding: '8px 12px',
            borderRadius: '8px',
            fontSize: '12px',
            border: `1px solid ${VAST_COLORS.primary}`,
            boxShadow: `0 4px 12px rgba(0,0,0,0.3)`,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: VAST_COLORS.primary,
              animation: 'pulse 2s infinite'
            }} />
            Real-time Data
          </div>
        )}
      </div>
    );
  } catch (error) {
    console.error('❌ ReactFlow rendering error:', error);
    return (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'white', textAlign: 'center' }}>
          <h3>Pipeline Visualization Error</h3>
          <p>There was an error rendering the pipeline graph.</p>
          <p style={{ fontSize: '0.8em', color: '#888' }}>{error.message}</p>
        </div>
      </div>
    );
  }
}
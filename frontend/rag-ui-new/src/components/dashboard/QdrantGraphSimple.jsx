/**
 * Simple Qdrant Graph Component - Phase 1
 * 
 * Clean, minimal implementation focused on core functionality:
 * - Data loading from Qdrant
 * - Basic 2D force-directed graph
 * - Essential controls
 * - Error handling
 */

import React, { useState, useEffect, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { RefreshCw, Settings, Eye, EyeOff, ZoomIn, ZoomOut, RotateCcw, Target, Shuffle } from 'lucide-react';

const QdrantGraphSimple = ({ 
  collectionName = 'rag', 
  qdrantBaseUrl = 'http://localhost:6333', 
  height = '500px', 
  fullWidth = false
}) => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showLabels, setShowLabels] = useState(true);
  const [nodeSize, setNodeSize] = useState(3);
  const [linkWidth, setLinkWidth] = useState(1);
  const [selectedNode, setSelectedNode] = useState(null);
  const [graphHeight, setGraphHeight] = useState(500);
  const [is3D, setIs3D] = useState(false);
  const [graphType, setGraphType] = useState('force-directed-2d');
  const [movementSpeed, setMovementSpeed] = useState(2.0);
  const [forceUpdate, setForceUpdate] = useState(0);
  const graphRef = useRef();
  const graph3DRef = useRef();

  // Convert height prop to numeric value
  useEffect(() => {
    const calculateHeight = () => {
      if (typeof height === 'number') {
        setGraphHeight(height);
        console.log('Height set to number:', height);
        return;
      }
      
      if (typeof height === 'string') {
        if (height.includes('calc')) {
          // Handle calc() expressions
          const viewportHeight = window.innerHeight;
          const headerHeight = 200; // Approximate header height
          const calculatedHeight = viewportHeight - headerHeight;
          setGraphHeight(calculatedHeight);
          console.log('Height calculated from calc():', calculatedHeight);
        } else if (height.includes('vh')) {
          // Handle viewport height
          const vhValue = parseFloat(height.replace('vh', ''));
          const calculatedHeight = (window.innerHeight * vhValue) / 100;
          setGraphHeight(calculatedHeight);
          console.log('Height calculated from vh:', calculatedHeight);
        } else if (height.includes('px')) {
          // Handle pixel values
          const pixelHeight = parseInt(height.replace('px', ''));
          setGraphHeight(pixelHeight);
          console.log('Height set from pixels:', pixelHeight);
        } else {
          // Fallback
          setGraphHeight(500);
          console.log('Height set to fallback:', 500);
        }
      }
    };

    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    return () => window.removeEventListener('resize', calculateHeight);
  }, [height]);

  // Force graph re-render when node size changes
  useEffect(() => {
    if (forceUpdate > 0) {
      console.log('Forcing graph re-render due to node size change');
      // The key prop change will force a complete re-render
    }
  }, [forceUpdate]);

  // Fetch graph data from Qdrant
  const fetchGraphData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Fetching data from collection: ${collectionName}`);
      
      // Fetch points from Qdrant
      const response = await fetch(`${qdrantBaseUrl}/collections/${collectionName}/points/scroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: 100, // Limit for performance
          with_payload: true,
          with_vector: false // We don't need vectors for basic graph
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Qdrant response:', data);

      if (!data.result || !data.result.points) {
        throw new Error('No points found in collection');
      }

      // Convert Qdrant points to graph format
      const nodes = data.result.points.map((point, index) => ({
        id: point.id.toString(),
        label: point.payload?.filename || point.payload?.title || `Node ${index + 1}`,
        group: index % 5, // Simple grouping for colors
        size: nodeSize,
        radius: nodeSize * 2, // Radius for proper link connections
        payload: point.payload
      }));

      // Create simple links based on document similarity (mock for now)
      const links = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < Math.min(i + 3, nodes.length); j++) {
          links.push({
            source: nodes[i].id,
            target: nodes[j].id,
            value: Math.random() * 0.5 + 0.1
          });
        }
      }

      setGraphData({ nodes, links });
      console.log(`Loaded ${nodes.length} nodes and ${links.length} links`);
      
    } catch (err) {
      console.error('Error fetching graph data:', err);
      setError(err.message);
      
      // Fallback to mock data
      const mockNodes = Array.from({ length: 20 }, (_, i) => ({
        id: `node-${i}`,
        label: `Document ${i + 1}`,
        group: i % 5,
        size: nodeSize,
        radius: nodeSize * 2, // Radius for proper link connections
        payload: { filename: `document_${i + 1}.pdf` }
      }));
      
      const mockLinks = Array.from({ length: 15 }, (_, i) => ({
        source: `node-${i}`,
        target: `node-${(i + 1) % 20}`,
        value: Math.random() * 0.5 + 0.1
      }));
      
      setGraphData({ nodes: mockNodes, links: mockLinks });
      console.log('Using mock data due to error');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchGraphData();
  }, [collectionName, qdrantBaseUrl]);

  // Update node sizes when setting changes
  useEffect(() => {
    console.log('Updating node size to:', nodeSize);
    setGraphData(prev => ({
      ...prev,
      nodes: prev.nodes.map(node => ({ 
        ...node, 
        size: nodeSize,
        // Add radius property for proper link connections
        radius: nodeSize * 2
      }))
    }));
  }, [nodeSize]);

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    console.log('Node clicked:', node);
  };

  const handleBackgroundClick = () => {
    setSelectedNode(null);
  };

  const handleRefresh = () => {
    fetchGraphData();
  };

  // Custom link positioning to connect to node edges
  const getLinkPosition = (link, pos) => {
    const sourceNode = graphData.nodes.find(n => n.id === link.source);
    const targetNode = graphData.nodes.find(n => n.id === link.target);
    
    if (!sourceNode || !targetNode) return pos;
    
    const sourceRadius = (sourceNode.radius || sourceNode.size || 3) * 2;
    const targetRadius = (targetNode.radius || targetNode.size || 3) * 2;
    
    if (pos === 0) {
      // Source end of link
      const dx = targetNode.x - sourceNode.x;
      const dy = targetNode.y - sourceNode.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        const ratio = sourceRadius / distance;
        return {
          x: sourceNode.x + dx * ratio,
          y: sourceNode.y + dy * ratio
        };
      }
    } else {
      // Target end of link
      const dx = sourceNode.x - targetNode.x;
      const dy = sourceNode.y - targetNode.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      if (distance > 0) {
        const ratio = targetRadius / distance;
        return {
          x: targetNode.x + dx * ratio,
          y: targetNode.y + dy * ratio
        };
      }
    }
    
    return pos;
  };

  // Force simulation configuration to handle node sizes properly
  const configureD3Forces = (graph) => {
    if (!graph || !graph.d3Force) return;
    
    try {
      // Configure forces to respect node sizes
      graph.d3Force('link')
        .id(d => d.id)
        .distance(d => {
          const sourceNode = graphData.nodes.find(n => n.id === d.source);
          const targetNode = graphData.nodes.find(n => n.id === d.target);
          if (!sourceNode || !targetNode) return 30;
          
          const sourceRadius = (sourceNode.radius || sourceNode.size || 3) * 2;
          const targetRadius = (targetNode.radius || targetNode.size || 3) * 2;
          return sourceRadius + targetRadius + 10; // Minimum distance between node edges
        });
      
      // Configure collision detection - check if d exists and has properties
      graph.d3Force('collision')
        .radius(d => {
          if (!d) return 10; // Fallback radius
          return (d.radius || d.size || 3) * 2 + 5;
        })
        .strength(0.7);
    } catch (error) {
      console.error('Error configuring D3 forces:', error);
    }
  };

  return (
    <div className="w-full h-full bg-gray-900 flex flex-col">
      {/* Header Controls */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <h3 className="text-lg font-semibold text-white">
            Collection: {collectionName}
          </h3>
          {isLoading && (
            <div className="flex items-center text-blue-400">
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              Loading...
            </div>
          )}
          {error && (
            <div className="text-red-400 text-sm">
              Error: {error}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 flex-wrap">
          {/* 3D Toggle */}
          <button
            onClick={() => setIs3D(!is3D)}
            className={`p-2 rounded transition-colors ${
              is3D ? 'bg-blue-600 hover:bg-blue-500' : 'bg-gray-600 hover:bg-gray-500'
            }`}
            title={`Switch to ${is3D ? '2D' : '3D'} view`}
          >
            {is3D ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {/* Graph Type Selection (3D only) */}
          {is3D && (
            <select
              value={graphType}
              onChange={(e) => setGraphType(e.target.value)}
              className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-white text-sm"
            >
              <option value="force-directed-3d">Force Directed 3D</option>
              <option value="highlight-3d">Highlight Nodes/Links</option>
              <option value="click-focus-3d">Click to Focus</option>
            </select>
          )}

          {/* Movement Speed (3D only) */}
          {is3D && (
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-300">Speed:</label>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                value={movementSpeed}
                onChange={(e) => setMovementSpeed(parseFloat(e.target.value))}
                className="w-16"
              />
              <span className="text-sm text-gray-300 w-6">{movementSpeed}</span>
            </div>
          )}

          {/* Node Size Control */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-300">Node Size:</label>
            <input
              type="range"
              min="1"
              max="10"
              value={nodeSize}
              onChange={(e) => {
                const newSize = parseInt(e.target.value);
                setNodeSize(newSize);
                setForceUpdate(prev => prev + 1);
                console.log('Updating node size to:', newSize);
              }}
              className="w-20"
            />
            <span className="text-sm text-gray-300 w-6">{nodeSize}</span>
          </div>

          {/* Link Width Control */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-300">Link Width:</label>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.5"
              value={linkWidth}
              onChange={(e) => setLinkWidth(parseFloat(e.target.value))}
              className="w-20"
            />
            <span className="text-sm text-gray-300 w-6">{linkWidth}</span>
          </div>

          {/* Labels Toggle */}
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`p-2 rounded transition-colors ${
              showLabels ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-600 hover:bg-gray-500'
            }`}
            title={`${showLabels ? 'Hide' : 'Show'} labels`}
          >
            {showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="p-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Graph Visualization */}
      <div className="flex-1 relative" style={{ height: `${graphHeight}px` }}>
        {graphData.nodes.length > 0 ? (
          is3D ? (
            // 3D Graph
            <ForceGraph3D
              key={`3d-graph-${nodeSize}-${linkWidth}-${forceUpdate}`}
              ref={graph3DRef}
              graphData={graphData}
              nodeLabel={showLabels ? "label" : ""}
              nodeColor={(node) => {
                const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'];
                return colors[node.group % colors.length];
              }}
              nodeVal={() => nodeSize}
              linkWidth={() => linkWidth}
              linkColor={() => 'rgba(255,255,255,0.3)'}
              onNodeClick={handleNodeClick}
              onBackgroundClick={handleBackgroundClick}
              width={fullWidth ? window.innerWidth : 800}
              height={graphHeight}
              cooldownTicks={100}
              d3AlphaDecay={0.02}
              d3VelocityDecay={0.3}
              // 3D specific settings
              enableNodeDrag={true}
              enableZoomInteraction={true}
              enablePanInteraction={true}
              // Movement speed
              d3ReheatDecay={0.02 * movementSpeed}
              // Camera settings
              cameraPosition={{ x: 0, y: 0, z: 1000 }}
              // Orbit controls
              controlType="orbit"
              orbitControls={{
                enableDamping: true,
                dampingFactor: 0.25,
                rotateSpeed: movementSpeed,
                zoomSpeed: 1,
                panSpeed: 0.8,
                minDistance: 100,
                maxDistance: 4000
              }}
            />
          ) : (
            // 2D Graph
            <ForceGraph2D
              key={`2d-graph-${nodeSize}-${linkWidth}-${forceUpdate}`}
              ref={graphRef}
              graphData={graphData}
              nodeLabel={showLabels ? "label" : ""}
              nodeColor={(node) => {
                const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'];
                return colors[node.group % colors.length];
              }}
              nodeVal={() => nodeSize}
              nodeCanvasObject={showLabels ? (node, ctx, globalScale) => {
                const label = node.label || node.id;
                const fontSize = 12/globalScale;
                ctx.font = `${fontSize}px Sans-Serif`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = 'white';
                ctx.fillText(label, node.x, node.y);
              } : undefined}
              linkWidth={() => linkWidth}
              linkColor={() => 'rgba(255,255,255,0.3)'}
              onNodeClick={handleNodeClick}
              onBackgroundClick={handleBackgroundClick}
              width={fullWidth ? window.innerWidth : 800}
              height={graphHeight}
              cooldownTicks={100}
              d3AlphaDecay={0.02}
              d3VelocityDecay={0.3}
              onEngineStop={() => {
                // Simplified - just log that engine stopped
                console.log('2D Graph engine stopped');
              }}
            />
          )
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            {isLoading ? 'Loading graph data...' : 'No data available'}
          </div>
        )}
      </div>

      {/* Selected Node Info */}
      {selectedNode && (
        <div className="absolute bottom-4 left-4 bg-gray-800 p-4 rounded-lg border border-gray-600 max-w-sm">
          <h4 className="text-white font-semibold mb-2">Selected Node</h4>
          <p className="text-sm text-gray-300">ID: {selectedNode.id}</p>
          <p className="text-sm text-gray-300">Label: {selectedNode.label}</p>
          <p className="text-sm text-gray-300">Group: {selectedNode.group}</p>
          {selectedNode.payload && (
            <div className="mt-2">
              <p className="text-xs text-gray-400">Payload:</p>
              <pre className="text-xs text-gray-300 overflow-auto max-h-20">
                {JSON.stringify(selectedNode.payload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QdrantGraphSimple;
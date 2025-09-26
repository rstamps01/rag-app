/**
 * Working Qdrant Graph Component
 * 
 * Simplified version that works without the complex modular system
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';
import { RefreshCw, Palette, Eye, EyeOff, RotateCcw, ZoomIn, ZoomOut, Target, Shuffle } from 'lucide-react';
import { 
  calculateSimilarity, 
  generateSimilarityLinks, 
  filterNodesBySimilarity,
  getSimilarityStats 
} from '../../utils/similarityUtils';

// Import specialized 3D modules
import Highlight3DWorking from './graphs/modules/Highlight3DWorking';
import ClickFocus3DWorking from './graphs/modules/ClickFocus3DWorking';

const QdrantGraphWorking = ({ 
  collectionName = 'rag', 
  qdrantBaseUrl = 'http://localhost:6333', 
  height = '500px', 
  fullWidth = false,
  similarityMode = 'semantic',
  similarityThreshold = 0.7,
  onNodeSelect = () => {},
  onSimilarityChange = () => {}
}) => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [originalGraphData, setOriginalGraphData] = useState({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [graphType, setGraphType] = useState('force-directed-2d');
  const [is3D, setIs3D] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [nodeSize, setNodeSize] = useState(3);
  const [linkWidth, setLinkWidth] = useState(1);
  const [selectedNode, setSelectedNode] = useState(null);
  const [specialized3D, setSpecialized3D] = useState('none'); // none, highlight, click-focus
  const [movementSpeed, setMovementSpeed] = useState(2.0); // 3D movement speed multiplier
  const [similarityStats, setSimilarityStats] = useState(null);
  const [filteredNodes, setFilteredNodes] = useState([]);
  const current3DRef = useRef(null);

  // Process similarity data
  const processSimilarityData = useCallback((data) => {
    if (!data.nodes || data.nodes.length === 0) return data;

    // Generate similarity links
    const similarityLinks = generateSimilarityLinks(
      data.nodes, 
      data, 
      similarityMode, 
      similarityThreshold
    );

    // Calculate similarity statistics
    const stats = getSimilarityStats(data, similarityMode);
    setSimilarityStats(stats);

    // Combine original links with similarity links
    const allLinks = [...(data.links || []), ...similarityLinks];

    // Filter nodes based on similarity if a node is selected
    let filteredNodes = data.nodes;
    if (selectedNode) {
      filteredNodes = filterNodesBySimilarity(
        data.nodes, 
        selectedNode, 
        data, 
        similarityMode, 
        similarityThreshold
      );
    }
    setFilteredNodes(filteredNodes);

    // Notify parent component of similarity changes (only when stats change significantly)
    if (stats && (stats.count > 0 || !similarityStats)) {
      onSimilarityChange({
        mode: similarityMode,
        threshold: similarityThreshold,
        stats: stats,
        filteredCount: filteredNodes.length,
        totalCount: data.nodes.length
      });
    }

    return {
      ...data,
      nodes: filteredNodes,
      links: allLinks
    };
  }, [similarityMode, similarityThreshold, selectedNode, onSimilarityChange]);

  // Fetch graph data from Qdrant
  const fetchGraphData = useCallback(async () => {
    if (isLoading) {
      console.log('⏳ Graph data fetch already in progress, skipping...');
      return; // Prevent duplicate calls
    }
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching graph data from Qdrant...');
      
      const response = await fetch(`${qdrantBaseUrl}/collections/${collectionName}/points/scroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: 100,
          with_payload: true,
          with_vector: false,
          filter: null
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const points = data.result.points || [];
      
      console.log(`📊 Fetched ${points.length} points from Qdrant`);

      // Process nodes
      const nodes = points.map((point, index) => ({
        id: point.id || `point_${index}`,
        label: point.payload?.filename || `Node ${index}`,
        group: Math.floor(index / 10),
        payload: point.payload || {},
        x: Math.random() * 800,
        y: Math.random() * 500
      }));

      // Create simple links
      const links = [];
      for (let i = 0; i < Math.min(nodes.length, 50); i++) {
        for (let j = i + 1; j < Math.min(nodes.length, 50); j++) {
          if (Math.random() < 0.1) {
            links.push({
              source: nodes[i].id,
              target: nodes[j].id,
              value: 1,
              distance: 80
            });
          }
        }
      }

      const originalData = { nodes, links };
      setOriginalGraphData(originalData);
      
      // Process with similarity calculations
      const processedData = processSimilarityData(originalData);
      setGraphData(processedData);
      
      console.log(`✅ Graph loaded with ${nodes.length} nodes and ${links.length} links`);
      // console.log(`🔗 Similarity processing: ${similarityMode} mode, threshold: ${similarityThreshold}`);
    } catch (err) {
      console.error('❌ Error fetching graph data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [collectionName, qdrantBaseUrl]);

  // Reprocess data when similarity settings change
  useEffect(() => {
    if (originalGraphData.nodes.length > 0) {
      const processedData = processSimilarityData(originalGraphData);
      setGraphData(processedData);
    }
  }, [similarityMode, similarityThreshold, selectedNode, originalGraphData]);

  // Load data on mount
  useEffect(() => {
    fetchGraphData();
  }, [collectionName]);

  // Force re-render when switching 3D modes by updating a state
  const [modeSwitchKey, setModeSwitchKey] = useState(0);
  
  useEffect(() => {
    if (is3D) {
      setModeSwitchKey(prev => prev + 1);
      // Trigger fresh data fetch when switching 3D modes
      console.log('🔄 Switching 3D mode, fetching fresh data...');
      fetchGraphData();
    }
  }, [specialized3D, is3D]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-400" />
          <p className="text-gray-400">Loading graph data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-400 mb-2">⚠️</div>
          <p className="text-red-400 mb-2">Error loading graph data</p>
          <p className="text-gray-400 text-sm">{error}</p>
          <button
            onClick={fetchGraphData}
            className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (graphData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-gray-400 mb-2">📊</div>
          <p className="text-gray-400">No data available for visualization</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${fullWidth ? 'h-full w-full' : 'bg-gray-800 rounded-lg'} overflow-hidden relative`}>
      {/* Header */}
      <div className="bg-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-white">
            Collection Graph: {collectionName}
          </h3>
          <span className="text-sm text-gray-400">
            {graphData.nodes.length} nodes, {graphData.links.length} links
          </span>
          <span className="text-xs text-green-300 bg-green-900 px-2 py-1 rounded">
            WORKING
          </span>
          <span className="text-xs text-blue-300 bg-blue-900 px-2 py-1 rounded">
            {is3D ? '3D' : '2D'}
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
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
          
          {/* Labels Toggle */}
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`p-2 rounded transition-colors ${
              showLabels ? 'bg-green-600 hover:bg-green-500' : 'bg-gray-600 hover:bg-gray-500'
            }`}
            title={`${showLabels ? 'Hide' : 'Show'} labels`}
          >
            <Palette className="w-4 h-4" />
          </button>
          
          {/* Refresh */}
          <button
            onClick={fetchGraphData}
            className="p-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-gray-600 px-4 py-2 flex items-center justify-between text-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label className="text-gray-300">Node Size:</label>
            <input
              type="range"
              min="1"
              max="10"
              value={nodeSize}
              onChange={(e) => setNodeSize(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-gray-300 w-6">{nodeSize}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-gray-300">Link Width:</label>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.5"
              value={linkWidth}
              onChange={(e) => setLinkWidth(Number(e.target.value))}
              className="w-20"
            />
            <span className="text-gray-300 w-6">{linkWidth}</span>
          </div>

          {/* Specialized 3D Modules */}
          {is3D && (
            <div className="flex items-center space-x-2">
              <label className="text-gray-300">3D Mode:</label>
              <select
                value={specialized3D}
                onChange={(e) => setSpecialized3D(e.target.value)}
                className="bg-gray-700 text-white px-2 py-1 rounded text-xs"
              >
                <option value="none">Basic 3D</option>
                <option value="highlight">Highlight Nodes/Links</option>
                <option value="click-focus">Click-to-Focus</option>
              </select>
            </div>
          )}

          {/* 3D Movement Speed Control */}
          {is3D && (
            <div className="flex items-center space-x-2">
              <label className="text-gray-300">Speed:</label>
              <input
                type="range"
                min="0.5"
                max="5"
                step="0.5"
                value={movementSpeed}
                onChange={(e) => setMovementSpeed(Number(e.target.value))}
                className="w-20"
              />
              <span className="text-gray-300 w-8">{movementSpeed}x</span>
            </div>
          )}

        </div>
        
        {selectedNode && (
          <div className="text-gray-300">
            Selected: <span className="text-blue-300">{selectedNode.label}</span>
          </div>
        )}
      </div>

      {/* Graph */}
      <div style={{ height: height, backgroundColor: '#1f2937' }}>
        {is3D ? (
          // Render specialized 3D modules
          (() => {
            const commonProps = {
              graphData,
              width: fullWidth ? window.innerWidth : 800,
              height: fullWidth ? window.innerHeight - 100 : 500,
              movementSpeed,
              showLabels,
              nodeSize,
              linkWidth,
              onNodeClick: (node) => {
                console.log('Node clicked:', node);
                setSelectedNode(node);
                onNodeSelect(node);
              },
              onBackgroundClick: () => {
                console.log('Background clicked');
                setSelectedNode(null);
              }
            };

            switch (specialized3D) {
              case 'highlight':
                return <Highlight3DWorking key={`highlight-${specialized3D}-${graphData.nodes?.length}-${modeSwitchKey}`} ref={current3DRef} {...commonProps} />;
              case 'click-focus':
                return <ClickFocus3DWorking key={`click-focus-${specialized3D}-${graphData.nodes?.length}-${modeSwitchKey}`} ref={current3DRef} {...commonProps} />;
              default:
                return (
                  <ForceGraph3D
                    key={`basic-3d-${graphData.nodes?.length}-${modeSwitchKey}`}
                    ref={current3DRef}
                    graphData={graphData}
                    nodeLabel={showLabels ? "label" : ""}
                    nodeColor={(node) => {
                      const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'];
                      return colors[node.group % colors.length];
                    }}
                    nodeVal={() => nodeSize}
                    linkColor={() => '#666'}
                    linkWidth={() => linkWidth}
                    width={fullWidth ? window.innerWidth : 800}
                    height={fullWidth ? window.innerHeight - 100 : 500}
                    d3Force="link"
                    d3ForceConfig={{
                      charge: { strength: -300 },
                      link: { distance: 80, strength: 0.1 },
                      center: { strength: 0.1 }
                    }}
                    onNodeClick={(node) => {
                      console.log('Node clicked:', node);
                      setSelectedNode(node);
                      onNodeSelect(node);
                    }}
                    onBackgroundClick={() => {
                      console.log('Background clicked');
                      setSelectedNode(null);
                    }}
                    enableNodeDrag={true}
                    enableZoomPanRotate={true}
                    showNavInfo={true}
                    // Free rotation settings - no boundaries
                    cameraPosition={{ x: 0, y: 0, z: 400 }}
                    onEngineStart={() => {
                      // Increase rotation speed for better responsiveness
                      const controls = this.controls();
                      if (controls) {
                        controls.enableDamping = true;
                        controls.dampingFactor = 0.05;
                        controls.rotateSpeed = movementSpeed * 8; // Much faster rotation
                        controls.zoomSpeed = movementSpeed * 4.0; // Faster zoom
                        controls.panSpeed = movementSpeed * 4.0; // Faster pan
                        
                        // Default controls handle rotation properly
                        controls.enableRotate = true;
                        
                        // Set proper target
                        controls.target.set(0, 0, 0);
                        controls.update();
                      }
                      
                      // Optimize WebGL settings to reduce warnings
                      const renderer = this.scene()?.renderer;
                      if (renderer) {
                        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
                        renderer.antialias = true;
                        renderer.powerPreference = "high-performance";
                      }
                    }}
                  />
                );
            }
          })()
        ) : (
          <ForceGraph2D
            graphData={graphData}
            nodeLabel={showLabels ? "label" : ""}
            nodeColor={(node) => {
              const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'];
              return colors[node.group % colors.length];
            }}
            nodeVal={() => nodeSize}
            linkColor={() => '#666'}
            linkWidth={() => linkWidth}
            width={fullWidth ? window.innerWidth : 800}
            height={fullWidth ? window.innerHeight - 100 : 500}
            d3Force="link"
            d3ForceConfig={{
              charge: { strength: -300 },
              link: { distance: 80, strength: 0.1 },
              center: { strength: 0.1 }
            }}
            onNodeClick={(node) => {
              console.log('Node clicked:', node);
              setSelectedNode(node);
              onNodeSelect(node);
            }}
            onBackgroundClick={() => {
              console.log('Background clicked');
              setSelectedNode(null);
            }}
            enableNodeDrag={true}
            enableZoomPanRotate={true}
          />
        )}
      </div>
    </div>
  );
};

export default QdrantGraphWorking;

/**
 * Modular Graph Demo Component
 * 
 * Demonstrates how to use the modular graph system
 */

import React, { useState, useEffect } from 'react';
import GraphContainer from './core/GraphContainer';
import { getEnabledGraphTypes, getGraphTypesByDimension } from './core/GraphTypes';

const ModularGraphDemo = ({ 
  collectionName = 'rag', 
  qdrantBaseUrl = 'http://localhost:6333', 
  height = '500px', 
  fullWidth = false 
}) => {
  // State management
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [showContentFlag, setShowContentFlag] = useState(false);

  // Settings
  const [settings, setSettings] = useState({
    nodeLimit: 100,
    linkDistance: 30,
    chargeStrength: -300,
    showLabels: true,
    nodeSize: 3,
    linkWidth: 1
  });

  // Visualization settings
  const [visualizationSettings, setVisualizationSettings] = useState({
    labelMode: 'filename',
    colorScheme: 'group',
    sizeMode: 'fixed',
    nodeShape: 'circle',
    showTooltips: true,
    showClustering: true,
    showAnimations: true,
    enableFiltering: true,
    multiSelect: false,
    showText: false,
    textSize: 'small',
    showInterconnectivity: true,
    maxSeparationLevels: 3,
    highlightSelected: true,
    useVariableDistance: true,
    distanceMode: 'semantic',
    minDistance: 20,
    maxDistance: 200,
    similarityThreshold: 0.7,
    graphType: 'force-directed-2d', // Start with 2D force-directed
    showAnchors: true,
    use3D: false,
    anchorStrength: 0.02,
    maintainInterconnectivity: true,
    hubSpokeMode: true,
    spokesPerHub: 5,
    maxHubs: 10
  });

  // Refs for preventing duplicate fetches
  const fetchInProgressRef = useRef(false);
  const dataLoadedRef = useRef(new Set());

  // Fetch graph data
  const fetchGraphData = async () => {
    // Guard against concurrent fetches
    if (fetchInProgressRef.current) {
      return;
    }
    
    // Guard against duplicate fetches for same collection
    const collectionKey = `${collectionName}-${qdrantBaseUrl}`;
    if (dataLoadedRef.current.has(collectionKey) && graphData.nodes.length > 0) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    fetchInProgressRef.current = true;
    
    try {
      const response = await fetch(`${qdrantBaseUrl}/collections/${collectionName}/points/scroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: settings.nodeLimit,
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

      // Process nodes
      const nodes = points.map((point, index) => ({
        id: point.id || `point_${index}`,
        label: point.payload?.filename || `Node ${index}`,
        group: Math.floor(index / 10),
        payload: point.payload || {},
        x: Math.random() * 800,
        y: Math.random() * 500,
        z: Math.random() * 200
      }));

      // Create simple links based on similarity
      const links = [];
      for (let i = 0; i < Math.min(nodes.length, 50); i++) {
        for (let j = i + 1; j < Math.min(nodes.length, 50); j++) {
          if (Math.random() < 0.1) { // 10% chance of connection
            links.push({
              source: nodes[i].id,
              target: nodes[j].id,
              value: 1,
              distance: 80,
              type: 'connection'
            });
          }
        }
      }

      setGraphData({ nodes, links });
      console.log(`✅ Graph loaded with ${nodes.length} nodes and ${links.length} links`);
      
      // Mark as loaded for this collection
      dataLoadedRef.current.add(collectionKey);
    } catch (err) {
      console.error('Error fetching graph data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
      fetchInProgressRef.current = false;
    }

  };

  // Handle refresh - clear cache and refetch
  const handleRefresh = () => {
    const collectionKey = `${collectionName}-${qdrantBaseUrl}`;
    dataLoadedRef.current.delete(collectionKey);
    fetchInProgressRef.current = false;
    setGraphData({ nodes: [], links: [] });
    fetchGraphData();
  };

  // Load data on mount (only once per collection, even with React StrictMode)
  useEffect(() => {
    const collectionKey = `${collectionName}-${qdrantBaseUrl}`;
    
    // Skip if already loaded for this collection
    if (dataLoadedRef.current.has(collectionKey) && graphData.nodes.length > 0) {
      return;
    }
    
    // Call fetchGraphData - it will handle its own guards
    fetchGraphData();
    
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collectionName]); // Only depend on collectionName, not settings.nodeLimit

  // Event handlers
  const handleNodeClick = (node) => {
    console.log('Node clicked:', node);
    setSelectedNode(node);
  };

  const handleNodeHover = (node) => {
    // Optional: Add hover effects
  };

  const handleNodeDrag = (node) => {
    // Optional: Handle drag events
  };

  const handleNodeDragEnd = (node) => {
    // Optional: Handle drag end events
  };

  const handleBackgroundClick = () => {
    setSelectedNode(null);
    setSelectedNodes([]);
    setShowContentFlag(false);
  };

  const handleLinkClick = (link) => {
    console.log('Link clicked:', link);
  };

  const handleLinkHover = (link) => {
    // Optional: Handle link hover
  };

  // Get available graph types
  const availableGraphTypes = getEnabledGraphTypes();
  const graph2DTypes = getGraphTypesByDimension('2D');
  const graph3DTypes = getGraphTypesByDimension('3D');

  return (
    <div className="w-full h-full">
      {/* Demo Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <h2 className="text-xl font-semibold text-white mb-2">
          Modular Graph System Demo
        </h2>
        <div className="flex flex-wrap gap-4 text-sm text-gray-300">
          <div>
            <span className="font-medium">Available 2D Graphs:</span> {graph2DTypes.length}
          </div>
          <div>
            <span className="font-medium">Available 3D Graphs:</span> {graph3DTypes.length}
          </div>
          <div>
            <span className="font-medium">Total Modules:</span> {availableGraphTypes.length}
          </div>
          <div>
            <span className="font-medium">Current Type:</span> {visualizationSettings.graphType}
          </div>
        </div>
      </div>

      {/* Graph Container */}
      <GraphContainer
        collectionName={collectionName}
        qdrantBaseUrl={qdrantBaseUrl}
        height={height}
        fullWidth={fullWidth}
        graphData={graphData}
        isLoading={isLoading}
        error={error}
        onRefresh={handleRefresh}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        onNodeDrag={handleNodeDrag}
        onNodeDragEnd={handleNodeDragEnd}
        onBackgroundClick={handleBackgroundClick}
        onLinkClick={handleLinkClick}
        onLinkHover={handleLinkHover}
        visualizationSettings={visualizationSettings}
        setVisualizationSettings={setVisualizationSettings}
        settings={settings}
        setSettings={setSettings}
        selectedNode={selectedNode}
        setSelectedNode={setSelectedNode}
        selectedNodes={selectedNodes}
        setSelectedNodes={setSelectedNodes}
        showContentFlag={showContentFlag}
        setShowContentFlag={setShowContentFlag}
      />

      {/* Demo Info Panel */}
      <div className="bg-gray-900 p-4 border-t border-gray-700">
        <h3 className="text-lg font-semibold text-white mb-3">Modular Graph System Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div className="bg-gray-800 p-3 rounded">
            <h4 className="font-medium text-blue-300 mb-2">🎯 New 3D Modules</h4>
            <ul className="text-gray-300 space-y-1">
              <li>• Highlight Nodes/Links (3D)</li>
              <li>• Pause/Resume Animation (3D)</li>
              <li>• Click-to-Focus (3D)</li>
              <li>• Auto-Colored (3D)</li>
            </ul>
          </div>
          
          <div className="bg-gray-800 p-3 rounded">
            <h4 className="font-medium text-green-300 mb-2">🔧 Modular Architecture</h4>
            <ul className="text-gray-300 space-y-1">
              <li>• Static imports with removal capability</li>
              <li>• Enable/disable modules dynamically</li>
              <li>• Shared utilities and components</li>
              <li>• Consistent API across all modules</li>
            </ul>
          </div>
          
          <div className="bg-gray-800 p-3 rounded">
            <h4 className="font-medium text-purple-300 mb-2">📊 Graph Types</h4>
            <ul className="text-gray-300 space-y-1">
              <li>• Force-Directed (2D/3D)</li>
              <li>• Disjoint Force (2D/3D)</li>
              <li>• Force Tree (2D/3D)</li>
              <li>• Qdrant Native (2D/3D)</li>
              <li>• Hierarchical Cluster (2D/3D)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModularGraphDemo;


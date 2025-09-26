/**
 * Simple Modular Qdrant Graph Component
 * 
 * Uses the simplified GraphContainer for testing
 */

import React, { useState, useEffect } from 'react';
import GraphContainerSimple from './graphs/core/GraphContainerSimple';
import { getGraphTypeById } from './graphs/core/GraphTypesSimple';

const QdrantGraphModularSimple = ({ collectionName = 'rag', qdrantBaseUrl = 'http://localhost:6333', height = '500px', fullWidth = false }) => {
  // Core state
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
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
    graphType: 'force-directed-2d',
    showText: false,
    showInterconnectivity: true
  });

  // Selection state
  const [selectedNode, setSelectedNode] = useState(null);
  const [selectedNodes, setSelectedNodes] = useState([]);
  const [showContentFlag, setShowContentFlag] = useState(false);

  // Fetch graph data from Qdrant
  const fetchGraphData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching graph data from Qdrant...');
      console.log('🔄 URL:', `${qdrantBaseUrl}/collections/${collectionName}/points/scroll`);
      console.log('🔄 Request body:', {
        limit: settings.nodeLimit,
        with_payload: true,
        with_vector: false,
        filter: null
      });
      
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

      console.log('🔄 Response status:', response.status);
      console.log('🔄 Response headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error text:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const data = await response.json();
      console.log('🔄 Response data:', data);
      
      const points = data.result?.points || [];
      console.log(`📊 Fetched ${points.length} points from Qdrant`);

      if (points.length === 0) {
        console.warn('⚠️ No points found in collection');
        setError('No data found in collection. Please check if the collection has data.');
        return;
      }

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

      setGraphData({ nodes, links });
      console.log(`✅ Graph loaded with ${nodes.length} nodes and ${links.length} links`);
    } catch (err) {
      console.error('❌ Error fetching graph data:', err);
      setError(`Failed to fetch data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    console.log('🔄 QdrantGraphModularSimple: Component mounted, fetching data...');
    fetchGraphData();
  }, [collectionName, settings.nodeLimit]);

  // Event handlers
  const handleNodeClick = (node) => {
    console.log('Node clicked:', node);
    setSelectedNode(node);
    setShowContentFlag(true);
  };

  const handleNodeHover = (node) => {
    // Handle hover if needed
  };

  const handleNodeDrag = (node) => {
    // Handle drag if needed
  };

  const handleNodeDragEnd = (node) => {
    // Handle drag end if needed
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
    // Handle link hover if needed
  };

  return (
    <GraphContainerSimple
      collectionName={collectionName}
      qdrantBaseUrl={qdrantBaseUrl}
      height={height}
      fullWidth={fullWidth}
      graphData={graphData}
      isLoading={isLoading}
      error={error}
      onRefresh={fetchGraphData}
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
  );
};

export default QdrantGraphModularSimple;

/**
 * Simple Graph Container Component
 * 
 * Minimal version to test the modular system
 */

import React, { useState } from 'react';
import { QDRANT_URL } from '../../../../config';
import ForceGraph2D from 'react-force-graph-2d';

const GraphContainerSimple = ({ 
  collectionName = 'rag', 
  qdrantBaseUrl = QDRANT_URL, 
  height = '500px', 
  fullWidth = false,
  graphData,
  isLoading,
  error,
  onRefresh,
  onNodeClick,
  onNodeHover,
  onNodeDrag,
  onNodeDragEnd,
  onBackgroundClick,
  onLinkClick,
  onLinkHover,
  visualizationSettings,
  setVisualizationSettings,
  settings,
  setSettings,
  selectedNode,
  setSelectedNode,
  selectedNodes,
  setSelectedNodes,
  showContentFlag,
  setShowContentFlag
}) => {
  const [showVisualizationMenu, setShowVisualizationMenu] = useState(false);
  
  console.log('🔄 GraphContainerSimple: Rendering with data:', {
    collectionName,
    isLoading,
    error,
    nodeCount: graphData?.nodes?.length || 0,
    linkCount: graphData?.links?.length || 0
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-blue-400 mb-2">🔄</div>
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
            onClick={onRefresh}
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
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={onRefresh}
            className="p-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
            title="Refresh Data"
          >
            <div className="w-4 h-4">🔄</div>
          </button>
        </div>
      </div>

      {/* Graph */}
      <div style={{ height: height, backgroundColor: '#1f2937' }}>
        <ForceGraph2D
          graphData={graphData}
          nodeLabel="label"
          nodeColor={() => '#4CAF50'}
          nodeVal={() => 3}
          linkColor={() => '#666'}
          linkWidth={() => 1}
          width={fullWidth ? window.innerWidth : 800}
          height={fullWidth ? window.innerHeight - 100 : 500}
          d3Force="link"
          d3ForceConfig={{
            charge: { strength: -300 },
            link: { distance: 80, strength: 0.1 },
            center: { strength: 0.1 }
          }}
          onNodeClick={onNodeClick}
          onNodeHover={onNodeHover}
          onNodeDrag={onNodeDrag}
          onNodeDragEnd={onNodeDragEnd}
          onBackgroundClick={onBackgroundClick}
          onLinkClick={onLinkClick}
          onLinkHover={onLinkHover}
        />
      </div>
    </div>
  );
};

export default GraphContainerSimple;

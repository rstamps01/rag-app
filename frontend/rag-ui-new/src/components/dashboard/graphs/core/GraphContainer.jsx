/**
 * Graph Container Component
 * 
 * Main orchestrator for all graph modules with unified interface
 */

import React, { useState, useEffect, useRef } from 'react';
import { getGraphComponent, getGraphTypeById, getEnabledGraphTypes } from './GraphTypes';
import { RefreshCw, Eye, EyeOff, Palette, X, Pin, PinOff, Network } from 'lucide-react';

const GraphContainer = ({ 
  collectionName = 'rag', 
  qdrantBaseUrl = 'http://localhost:6333', 
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
  const [isMenuPinned, setIsMenuPinned] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const containerRef = useRef();

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Get current graph component
  const GraphComponent = getGraphComponent(visualizationSettings.graphType);
  const graphType = getGraphTypeById(visualizationSettings.graphType);

  // Common event handlers
  const handleNodeClick = (node) => {
    if (onNodeClick) {
      onNodeClick(node);
    }
    setSelectedNode(node);
  };

  const handleNodeHover = (node) => {
    if (onNodeHover) {
      onNodeHover(node);
    }
  };

  const handleBackgroundClick = () => {
    if (onBackgroundClick) {
      onBackgroundClick();
    }
    setSelectedNode(null);
    setSelectedNodes([]);
    setShowContentFlag(false);
  };

  // Clear selections
  const clearSelections = () => {
    setSelectedNode(null);
    setSelectedNodes([]);
    setShowContentFlag(false);
  };

  // Get available graph types for dropdown
  const availableGraphTypes = getEnabledGraphTypes();

  if (!GraphComponent) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-400 mb-2">⚠️</div>
          <p className="text-red-400 mb-2">Unknown graph type: {visualizationSettings.graphType}</p>
          <button
            onClick={onRefresh}
            className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm"
          >
            Refresh
          </button>
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
          {graphType && (
            <span className="text-xs text-blue-300 bg-blue-900 px-2 py-1 rounded">
              {graphType.name}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowVisualizationMenu(!showVisualizationMenu)}
            className="p-2 bg-purple-600 hover:bg-purple-500 rounded transition-colors"
            title="Visualization Options"
          >
            <Palette className="w-4 h-4" />
          </button>
          
          <button
            onClick={onRefresh}
            className="p-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          {(selectedNode || selectedNodes.length > 0) && (
            <button
              onClick={clearSelections}
              className="p-2 bg-red-600 hover:bg-red-500 rounded transition-colors"
              title="Clear Selections"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Graph Visualization */}
      <div ref={containerRef} className="relative" style={{ height: height, backgroundColor: '#1f2937' }}>
        {/* Interactive indicator when menu is pinned */}
        {showVisualizationMenu && isMenuPinned && (
          <div className="absolute top-2 right-2 z-10 bg-green-600 text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
            <span>Interactive</span>
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-400" />
              <p className="text-gray-400">Loading graph data...</p>
            </div>
          </div>
        ) : error ? (
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
        ) : graphData.nodes.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-gray-400 mb-2">📊</div>
              <p className="text-gray-400">No data available for visualization</p>
            </div>
          </div>
        ) : (
          <GraphComponent
            graphData={graphData}
            visualizationSettings={visualizationSettings}
            settings={settings}
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            onNodeDrag={onNodeDrag}
            onNodeDragEnd={onNodeDragEnd}
            onBackgroundClick={handleBackgroundClick}
            onLinkClick={onLinkClick}
            onLinkHover={onLinkHover}
            width={fullWidth ? dimensions.width : 800}
            height={fullWidth ? dimensions.height : 500}
          />
        )}
      </div>

      {/* Visualization Menu - Slide out from left */}
      {showVisualizationMenu && (
        <div className="fixed left-0 top-0 h-screen z-50 overflow-hidden">
          {/* Backdrop - only show when menu is not pinned */}
          {!isMenuPinned && (
            <div 
              className="fixed left-0 top-0 w-96 h-screen bg-black bg-opacity-20"
              onClick={() => setShowVisualizationMenu(false)}
            />
          )}
          
          {/* Slide-out Panel */}
          <div className="relative h-screen w-96 bg-gray-800 border-r border-gray-700 shadow-2xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-screen">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white flex items-center">
                  <Palette className="w-5 h-5 mr-2" />
                  Visualization Options
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsMenuPinned(!isMenuPinned)}
                    className={`p-2 rounded transition-colors ${
                      isMenuPinned 
                        ? 'bg-blue-600 hover:bg-blue-500' 
                        : 'bg-gray-600 hover:bg-gray-500'
                    }`}
                    title={isMenuPinned ? 'Unpin Menu' : 'Pin Menu'}
                  >
                    {isMenuPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      if (!isMenuPinned) {
                        setShowVisualizationMenu(false);
                      }
                    }}
                    className={`p-2 rounded transition-colors ${
                      isMenuPinned 
                        ? 'bg-gray-700 cursor-not-allowed opacity-50' 
                        : 'hover:bg-gray-700'
                    }`}
                    disabled={isMenuPinned}
                    title={isMenuPinned ? 'Menu is pinned - use pin button to close' : 'Close Menu'}
                  >
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6" style={{ paddingBottom: '100px' }}>
                {/* Graph Layout Options */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Network className="w-4 h-4 mr-2" />
                    Graph Layout
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Graph Type
                      </label>
                      <select
                        value={visualizationSettings.graphType}
                        onChange={(e) => setVisualizationSettings(prev => ({ ...prev, graphType: e.target.value }))}
                        className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
                      >
                        {availableGraphTypes.map(graphType => (
                          <option key={graphType.id} value={graphType.id}>
                            {graphType.name}
                          </option>
                        ))}
                      </select>
                      <p className="text-xs text-gray-400 mt-1">
                        {graphType?.description || 'Select a graph type'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Display Options */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4 flex items-center">
                    <Eye className="w-4 h-4 mr-2" />
                    Display Options
                  </h3>
                  <div className="space-y-3">
                    {[
                      { key: 'showText', label: 'Show Text Labels', desc: 'Display node labels on graph' },
                      { key: 'showInterconnectivity', label: 'Show Interconnectivity', desc: 'Highlight node connections' },
                      { key: 'highlightSelected', label: 'Highlight Selected', desc: 'Highlight selected nodes and connections' }
                    ].map((feature) => (
                      <label key={feature.key} className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visualizationSettings[feature.key]}
                          onChange={(e) => setVisualizationSettings(prev => ({ ...prev, [feature.key]: e.target.checked }))}
                          className="mt-1"
                        />
                        <div>
                          <div className="text-white text-sm">{feature.label}</div>
                          <div className="text-gray-400 text-xs">{feature.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Fixed Apply Changes Button at Bottom */}
              <div className="absolute bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 p-4 shadow-lg z-10">
                {/* Gradient fade effect above button */}
                <div className="absolute -top-4 left-0 right-0 h-4 bg-gradient-to-t from-gray-800 to-transparent pointer-events-none"></div>
                <button
                  onClick={() => {
                    onRefresh();
                    if (!isMenuPinned) {
                      setShowVisualizationMenu(false);
                    }
                  }}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded transition-colors shadow-md"
                >
                  Apply Changes
                </button>
                <div className="text-xs text-gray-400 text-center mt-2">
                  {isMenuPinned ? 'Settings auto-apply when pinned' : 'Click to apply and close menu'}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GraphContainer;

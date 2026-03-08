/**
 * Graph Container Component
 * 
 * Main orchestrator for all graph modules with unified interface
 */

import React, { useState, useEffect, useRef } from 'react';
import { QDRANT_URL } from '../../../../config';
import { getGraphComponent, getGraphTypeById, getEnabledGraphTypes } from './GraphTypes';
import { RefreshCw, Eye, EyeOff, Palette, X, Pin, PinOff, Network } from 'lucide-react';

const GraphContainer = ({ 
  collectionName = 'rag', 
  qdrantBaseUrl = QDRANT_URL, 
  height = '500px', 
  fullWidth = false,
  graphData = { nodes: [], links: [] },  // Default empty data to prevent errors
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
        // Guard against invalid dimensions
        const newWidth = Math.max(100, rect.width || 800);
        const newHeight = Math.max(100, rect.height || 500);
        setDimensions({ width: newWidth, height: newHeight });
      }
    };

    // Use a small delay to ensure container is mounted
    const timeoutId = setTimeout(updateDimensions, 100);
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updateDimensions);
    };
  }, []);

  // Get current graph component - use v2 if set, otherwise use main type
  const activeGraphType = visualizationSettings?.graphTypeV2 || visualizationSettings?.graphType;
  const GraphComponent = getGraphComponent(activeGraphType);
  const graphType = getGraphTypeById(activeGraphType);
  
  // Debug logging - REMOVED to reduce duplicate logs
  // State updates are logged in the rendering section below

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
      <div className="flex items-center justify-center h-full" style={{ backgroundColor: 'transparent' }}>
        <div className="text-center">
          <div className="text-red-400 mb-2">⚠️</div>
          <p className="text-red-400 mb-2">Unknown graph type: {visualizationSettings?.graphType || activeGraphType || 'undefined'}</p>
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
    <div 
      className={`${fullWidth ? 'h-full w-full' : ''} overflow-hidden relative flex flex-col`}
      style={{ backgroundColor: 'transparent' }}
    >
      {/* Header - Sticky but below left panel */}
      <div className="bg-gray-700 px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-white">
            Collection Graph: {collectionName}
          </h3>
          <span className="text-sm text-gray-400">
            {graphData?.nodes?.length || 0} nodes, {graphData?.links?.length || 0} links
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
            disabled={isLoading}
            className="p-2 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors"
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
      <div 
        ref={containerRef} 
        className="relative flex-1" 
          style={{ 
          height: height, 
          backgroundColor: 'transparent', // Background removed
          background: 'transparent', // Background removed
          position: 'relative',
          overflow: 'hidden',
          isolation: 'isolate', // Create new stacking context to prevent z-index issues
          width: '100%',
          minHeight: '400px',
          zIndex: 10  // Increased from 0 to ensure graph is above background
        }}
      >
        {/* Interactive indicator when menu is pinned */}
        {showVisualizationMenu && isMenuPinned && (
          <div className="absolute top-2 right-2 z-10 bg-green-600 text-white px-2 py-1 rounded text-xs flex items-center space-x-1">
            <div className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></div>
            <span>Interactive</span>
          </div>
        )}

        {isLoading ? (
          <div 
            className="flex items-center justify-center h-full"
            style={{ 
              backgroundColor: 'transparent',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1000,
              width: '100%',
              height: '100%'
            }}
          >
            <div className="text-center" style={{ zIndex: 1001, position: 'relative' }}>
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-400" />
              <p className="text-gray-400">Loading graph data...</p>
            </div>
          </div>
        ) : error ? (
          <div 
            className="flex items-center justify-center h-full"
            style={{ backgroundColor: 'transparent', width: '100%', height: '100%' }}
          >
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
        ) : !graphData || !graphData.nodes || graphData.nodes.length === 0 ? (
          <div 
            className="flex items-center justify-center h-full"
            style={{ backgroundColor: 'transparent', width: '100%', height: '100%' }}
          >
            <div className="text-center">
              <div className="text-gray-400 mb-2">📊</div>
              <p className="text-gray-400">No data available for visualization</p>
            </div>
          </div>
        ) : (
          <div 
            className="w-full h-full" 
            style={{ 
              position: 'relative', 
              overflow: 'hidden', 
              backgroundColor: 'transparent',
              width: '100%',
              height: '100%',
              minHeight: '400px',
              zIndex: 10  // Ensure graph container is above background
            }}
          >
            {(() => {
              try {
                // Validate graphData before rendering
                if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
                  return (
                    <div 
                      className="flex items-center justify-center h-full"
                      style={{ backgroundColor: 'transparent', width: '100%', height: '100%' }}
                    >
                      <div className="text-center">
                        <div className="text-gray-400 mb-2">📊</div>
                        <p className="text-gray-400">No data available for visualization</p>
                      </div>
                    </div>
                  );
                }
                
                const graphWidth = Math.max(100, fullWidth ? dimensions.width : 800);
                const graphHeight = Math.max(100, fullWidth ? dimensions.height : 500);
                
                // Ensure dimensions are valid
                if (graphWidth <= 0 || graphHeight <= 0 || !isFinite(graphWidth) || !isFinite(graphHeight)) {
                  console.warn('Invalid graph dimensions:', { graphWidth, graphHeight, dimensions });
                  return (
                    <div className="flex items-center justify-center h-full" style={{ backgroundColor: 'transparent' }}>
                      <div className="text-center">
                        <div className="text-yellow-400 mb-2">⚠️</div>
                        <p className="text-gray-400">Calculating dimensions...</p>
                      </div>
                    </div>
                  );
                }
                
                // Debug logging
                if (process.env.NODE_ENV === 'development') {
                  console.log('📊 GraphContainer: Rendering graph', {
                    graphType: activeGraphType,
                    nodeCount: graphData.nodes.length,
                    linkCount: graphData.links.length,
                    dimensions: { width: graphWidth, height: graphHeight },
                    isLoading
                  });
                }
                
                return (
                  <>
                    <style>{`
                      /* Constrain react-force-graph canvas to prevent expansion */
                      .graph-container-wrapper {
                        background-color: transparent !important;
                        background: transparent !important;
                        z-index: 15 !important;  // Ensure wrapper is above background
                      }
                      .graph-container-wrapper canvas {
                        position: absolute !important;
                        top: 0 !important;
                        left: 0 !important;
                        max-width: 100% !important;
                        max-height: 100% !important;
                        width: 100% !important;
                        height: 100% !important;
                        z-index: 20 !important;  // Increased from 1 to ensure canvas is on top
                        display: block !important;
                        visibility: visible !important;  // Explicitly make canvas visible
                        opacity: 1 !important;  // Ensure canvas is fully opaque
                        pointer-events: auto !important;  // Ensure canvas can receive events
                        /* Canvas will be drawn by backgroundRender, but wrapper provides fallback */
                      }
                      /* Prevent child elements from having black backgrounds */
                      .graph-container-wrapper > *:not(canvas) {
                        max-width: 100% !important;
                        max-height: 100% !important;
                      }
                    `}</style>
                    <div 
                      className="graph-container-wrapper" 
                      style={{ 
                        width: '100%', 
                        height: '100%', 
                        position: 'relative', 
                        overflow: 'hidden',
                        backgroundColor: 'transparent',
                        isolation: 'isolate',
                        zIndex: 15  // Ensure wrapper is above background but below canvas
                      }}
                    >
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
                        width={graphWidth}
                        height={graphHeight}
                      />
                    </div>
                  </>
                );
              } catch (error) {
                console.error('Error rendering graph component:', error);
                return (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="text-red-400 mb-2">⚠️</div>
                      <p className="text-red-400 mb-2">Error rendering graph</p>
                      <p className="text-gray-400 text-sm">{error.message}</p>
                    </div>
                  </div>
                );
              }
            })()}
          </div>
        )}
      </div>

      {/* Visualization Menu - Slide out from left - Above header */}
      {showVisualizationMenu && (
        <>
          {/* Backdrop - REMOVED to prevent black screen issue */}
          {/* The menu panel itself provides sufficient visual separation */}
          
          {/* Slide-out Panel */}
          <div className="fixed left-0 top-0 h-screen w-96 bg-gray-800 border-r border-gray-700 shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out">
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
                {/* Graph Layout - Primary Section */}
                <div className="bg-gray-700 rounded-lg p-4 border-2 border-purple-500">
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
                        value={visualizationSettings.graphTypeV2 || visualizationSettings.graphType}
                        onChange={(e) => {
                          const newType = e.target.value;
                          setVisualizationSettings(prev => ({ 
                            ...prev, 
                            graphTypeV2: newType,
                            // Apply v2 type if different from main type
                            graphType: newType !== visualizationSettings.graphType ? newType : prev.graphType
                          }));
                        }}
                        className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-purple-400 focus:border-purple-300 focus:outline-none"
                      >
                        <optgroup label="2D - Recommended for RAG">
                          <option value="force-directed-2d">Force-Directed (2D) - Standard</option>
                          <option value="force-directed-2d-arrows">Force-Directed with Arrows (2D) - Directional</option>
                          <option value="force-directed-2d-text">Force-Directed with Text Nodes (2D) - Labels</option>
                          <option value="force-directed-2d-curved">Force-Directed Curved (2D) - Complex Relations</option>
                          <option value="hierarchical-cluster-2d">Hierarchical Clustering (2D) - Document Structure</option>
                        </optgroup>
                        <optgroup label="3D - Large Datasets">
                          <option value="force-directed-3d">Force-Directed (3D) - Immersive</option>
                          <option value="force-directed-3d-collision">Force-Directed Collision (3D) - No Overlap</option>
                          <option value="hierarchical-cluster-3d">Hierarchical Clustering (3D) - 3D Structure</option>
                          <option value="auto-colored-3d">Auto-Colored (3D) - Property-Based</option>
                        </optgroup>
                        <optgroup label="Specialized - Advanced">
                          <option value="qdrant-native-2d">Qdrant Native (2D) - Hub-Spoke</option>
                          <option value="qdrant-native-3d">Qdrant Native (3D) - Multi-Star</option>
                          <option value="highlight-3d">Highlight Interactive (3D) - Exploration</option>
                          <option value="click-focus-3d">Click-to-Focus (3D) - Navigation</option>
                        </optgroup>
                      </select>
                      <p className="text-xs text-gray-400 mt-1">
                        {(() => {
                          const v2Type = visualizationSettings.graphTypeV2 || visualizationSettings.graphType;
                          const typeMap = {
                            'force-directed-2d-arrows': 'Shows relationship direction with arrows. Best for semantic similarity flows.',
                            'force-directed-2d-text': 'Displays document/chunk names as text. Best for content exploration.',
                            'force-directed-2d-curved': 'Uses curved lines to reduce clutter. Best for complex multi-document relationships.',
                            'force-directed-3d-collision': '3D layout with collision detection. Best for large collections without overlap.',
                            'default': 'Enhanced graph type optimized for RAG similarity visualization.'
                          };
                          return typeMap[v2Type] || typeMap['default'];
                        })()}
                      </p>
                      <div className="mt-2 p-2 bg-purple-900 bg-opacity-30 rounded text-xs text-purple-200">
                        💡 <strong>Note:</strong> Select a graph type optimized for RAG data similarity visualization. All options are fully functional.
                      </div>
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
        </>
      )}
    </div>
  );
};

export default GraphContainer;

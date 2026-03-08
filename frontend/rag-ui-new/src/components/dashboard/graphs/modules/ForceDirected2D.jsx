/**
 * Force-Directed 2D Graph Module
 * 
 * Standard 2D force-directed graph with natural clustering
 */

import React, { useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import * as d3 from 'd3';
import { generateNodeColor, generateNodeSize, generateNodeLabel, createCommonEventHandlers, createCommonGraphProps } from '../core/GraphUtils';

const ForceDirected2D = ({ 
  graphData, 
  visualizationSettings, 
  settings, 
  onNodeClick, 
  onNodeHover, 
  onNodeDrag, 
  onNodeDragEnd, 
  onBackgroundClick,
  onLinkClick,
  onLinkHover,
  width = 800, 
  height = 500,
  ...props 
}) => {
  const graphRef = useRef();
  const wrapperRef = useRef(); // Ref for the wrapper div to access canvas
  const forceConfigRef = useRef({ lastNodeCount: 0, lastLinkCount: 0 }); // Prevent duplicate force configuration

  // Provide default values for visualizationSettings and settings to prevent errors
  const safeVisualizationSettings = visualizationSettings || {
    showInterconnectivity: true,
    showText: false,
    nodeShape: 'circle',
    showAnimations: true
  };
  
  const safeSettings = settings || {
    nodeSize: 8,  // Increased from 3 for better visibility (radius = 4px)
    linkWidth: 2  // Increased from 1 for better visibility
  };

  // Enhanced node color function
  const getNodeColor = (node) => {
    return generateNodeColor(node, safeVisualizationSettings);
  };

  // Enhanced link color function - respect showInterconnectivity setting
  const getLinkColor = (link) => {
    // Hide links if interconnectivity is disabled
    if (!safeVisualizationSettings.showInterconnectivity) {
      return 'rgba(0,0,0,0)'; // Transparent
    }
    
    if (link.type === 'hub-spoke') return '#ff6b6b';
    if (link.type === 'anchor') return '#ffd700';
    
    // Use brighter color for better visibility on dark background
    // Color based on similarity if available
    if (link.similarity !== undefined) {
      const intensity = Math.max(0.3, Math.min(1, link.similarity));
      return `rgba(150, 150, 255, ${0.4 + intensity * 0.6})`; // Blue tint with variable opacity
    }
    
    return '#999'; // Brighter gray for better visibility
  };

  // Enhanced link width function - respect showInterconnectivity setting
  const getLinkWidth = (link) => {
    // Hide links if interconnectivity is disabled
    if (!safeVisualizationSettings.showInterconnectivity) {
      return 0; // No width
    }
    
    if (link.type === 'hub-spoke') return 3;
    if (link.type === 'anchor') return 2;
    
    // Width based on similarity if available
    if (link.similarity !== undefined) {
      const intensity = Math.max(0, Math.min(1, link.similarity));
      return (safeSettings.linkWidth || 1) * (0.5 + intensity * 1.5);
    }
    
    return safeSettings.linkWidth || 1;
  };

  // Create 2D node objects
  const createNodeObject = (node, ctx, globalScale) => {
    // CRITICAL: Check if node has valid x/y coordinates
    // Nodes might not have positions yet if force simulation hasn't run
    if (node.x === undefined || node.y === undefined || 
        !isFinite(node.x) || !isFinite(node.y) ||
        isNaN(node.x) || isNaN(node.y)) {
      // Skip rendering if node position is invalid
      // The force simulation will assign positions soon
      return;
    }
    
    const size = generateNodeSize(node, safeVisualizationSettings, safeSettings);
    const color = getNodeColor(node);
    const label = generateNodeLabel(node, safeVisualizationSettings);
    
    // Ensure size is valid
    if (!size || size <= 0 || !isFinite(size)) {
      return;
    }

    // Handle different node shapes
    if (safeVisualizationSettings.nodeShape === 'text') {
      // Text-only nodes
      ctx.font = `${8/globalScale}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = color;
      ctx.fillText(label, node.x, node.y);
    } else {
      // Shape-based nodes
      ctx.fillStyle = color;
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 1/globalScale;

      if (safeVisualizationSettings.nodeShape === 'square') {
        ctx.fillRect(node.x - size/2, node.y - size/2, size, size);
        ctx.strokeRect(node.x - size/2, node.y - size/2, size, size);
      } else if (safeVisualizationSettings.nodeShape === 'diamond') {
        ctx.save();
        ctx.translate(node.x, node.y);
        ctx.rotate(Math.PI / 4);
        ctx.fillRect(-size/2, -size/2, size, size);
        ctx.strokeRect(-size/2, -size/2, size, size);
        ctx.restore();
      } else {
        // Circle (default)
        ctx.beginPath();
        ctx.arc(node.x, node.y, size/2, 0, 2 * Math.PI);
        ctx.fill();
        ctx.stroke();
      }

      // Add text labels if enabled
      if (safeVisualizationSettings.showText && label) {
        const fontSize = 8/globalScale;
        ctx.font = `${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#fff';
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 0.5/globalScale;
        ctx.strokeText(label, node.x, node.y + size/2 + fontSize);
        ctx.fillText(label, node.x, node.y + size/2 + fontSize);
      }
    }
  };

  // Common event handlers
  const eventHandlers = createCommonEventHandlers({
    onNodeClick,
    onNodeHover,
    onNodeDrag,
    onNodeDragEnd,
    onBackgroundClick,
    onLinkClick,
    onLinkHover
  });

  // Validate graphData before creating props
  if (!graphData || !graphData.nodes || !Array.isArray(graphData.nodes) || graphData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ width, height, backgroundColor: 'transparent' }}>
        <div className="text-center">
          <div className="text-gray-400 mb-2">📊</div>
          <p className="text-gray-400">No nodes to display</p>
        </div>
      </div>
    );
  }

  // Create wrapper functions that capture visualizationSettings and settings
  const nodeValFn = (node) => generateNodeSize(node, safeVisualizationSettings, safeSettings);
  const nodeColorFn = (node) => getNodeColor(node);
  const linkColorFn = (link) => getLinkColor(link);
  const linkWidthFn = (link) => getLinkWidth(link);

  // Common graph props - matching QdrantGraphWorking approach
  const graphProps = createCommonGraphProps({
    ref: graphRef,
    graphData: {
      nodes: graphData.nodes || [],
      links: graphData.links || []
    },
    nodeLabel: safeVisualizationSettings.showText ? 'label' : '',  // Match QdrantGraphWorking: nodeLabel={localShowTextLabels ? "label" : ""}
    nodeColor: nodeColorFn,  // Use default rendering with nodeColor (not nodeCanvasObject)
    nodeVal: nodeValFn,      // Use default rendering with nodeVal (not nodeCanvasObject)
    linkColor: linkColorFn,
    linkWidth: linkWidthFn,
    linkDirectionalArrowLength: safeVisualizationSettings.showInterconnectivity ? 3 : 0,
    linkDirectionalArrowRelPos: 1,
    width: Math.max(100, width || 800),
    height: Math.max(100, height || 500),
    ...props
  });

  // Set canvas background color immediately after mount and on updates
  useEffect(() => {
    const setCanvasBackground = () => {
      // Use wrapperRef to access the DOM element, not graphRef
      if (wrapperRef.current) {
        // Try multiple ways to access the canvas from the wrapper div
        const canvas = wrapperRef.current.querySelector('canvas') || 
                      wrapperRef.current.getElementsByTagName('canvas')[0];
        if (canvas) {
          canvas.style.backgroundColor = 'transparent';
          canvas.style.background = 'transparent';
        }
      }
    };
    
    // Set after a short delay to catch canvas creation
    const timeoutId = setTimeout(setCanvasBackground, 100);
    const timeoutId2 = setTimeout(setCanvasBackground, 500);
    
    return () => {
      clearTimeout(timeoutId);
      clearTimeout(timeoutId2);
    };
  }, [graphData]);

  // Configure D3 forces - use ref to prevent duplicate executions
  useEffect(() => {
    if (graphRef.current && graphData && graphData.links && graphData.nodes) {
      // Skip if we've already configured for this exact data
      const nodeCount = graphData.nodes.length;
      const linkCount = graphData.links.length;
      if (forceConfigRef.current.lastNodeCount === nodeCount && 
          forceConfigRef.current.lastLinkCount === linkCount) {
        return; // Already configured for this data
      }
      forceConfigRef.current.lastNodeCount = nodeCount;
      forceConfigRef.current.lastLinkCount = linkCount;
      // Create a set of valid node IDs for quick lookup
      const nodeIds = new Set(graphData.nodes.map(node => String(node.id)));
      
      // Filter links and convert string IDs to node objects (D3 requires node objects, not IDs)
      const validLinks = graphData.links
        .map(link => {
          // Extract source and target IDs
          const sourceId = typeof link.source === 'object' ? String(link.source.id) : String(link.source);
          const targetId = typeof link.target === 'object' ? String(link.target.id) : String(link.target);
          
          // Find the actual node objects
          const sourceNode = graphData.nodes.find(n => String(n.id) === sourceId);
          const targetNode = graphData.nodes.find(n => String(n.id) === targetId);
          
          // Return null if either node is missing (will be filtered out)
          if (!sourceNode || !targetNode) {
            if (process.env.NODE_ENV === 'development') {
              console.warn(`⚠️ Invalid link filtered out: source=${sourceId} (found: ${!!sourceNode}), target=${targetId} (found: ${!!targetNode})`);
            }
            return null;
          }
          
          // Return link with node objects instead of IDs
          return {
            ...link,
            source: sourceNode,  // D3 needs node objects, not IDs
            target: targetNode   // D3 needs node objects, not IDs
          };
        })
        .filter(link => link !== null); // Remove null entries
      
      // Reduced logging - only warn if significant number of links filtered
      if (process.env.NODE_ENV === 'development' && 
          validLinks.length !== graphData.links.length && 
          graphData.links.length - validLinks.length > 5) {
        console.warn(`⚠️ Filtered out ${graphData.links.length - validLinks.length} invalid links (${validLinks.length} valid links remaining)`);
      }
      
      // Standard force-directed layout
      // Use link.distance if available (from similarity calculations), otherwise use default
      const linkDistanceFn = (link) => {
        // If link has a distance property (from similarity calculations), use it
        if (link.distance !== undefined && link.distance !== null) {
          return link.distance;
        }
        // Otherwise use default distance
        return 80;
      };
      
      // Configure charge force (repulsion between nodes)
      graphRef.current.d3Force('charge', d3.forceManyBody().strength(-300));
      
      // Configure link force - links now contain node objects, not IDs
      // D3's forceLink works with node objects directly, so we don't need an ID accessor
      const linkForce = d3.forceLink(validLinks)
        .id(d => {
          // ID accessor for nodes - always return string for consistency
          if (typeof d === 'object' && d !== null && d.id !== undefined) {
            return String(d.id);
          }
          return String(d);
        })
        .distance(linkDistanceFn)
        .strength(0.1);
      
      // Wrap in try-catch to handle any initialization errors
      try {
        graphRef.current.d3Force('link', linkForce);
      } catch (error) {
        console.error('❌ Error configuring D3 link force:', error);
        console.error('📊 Graph data:', {
          nodes: graphData.nodes.length,
          links: validLinks.length,
          nodeIds: graphData.nodes.slice(0, 5).map(n => ({ id: n.id, type: typeof n.id })),
          linkSample: validLinks.slice(0, 3).map(l => ({
            source: typeof l.source === 'object' ? l.source.id : l.source,
            target: typeof l.target === 'object' ? l.target.id : l.target,
            sourceType: typeof l.source,
            targetType: typeof l.target
          }))
        });
        // Don't throw - allow graph to render without links rather than crashing
      }
      
      // Configure center force (weaker to allow natural clustering)
      graphRef.current.d3Force('center', d3.forceCenter(width / 2, height / 2).strength(0.1));
      
      // Reduced logging - only log once per configuration, not on every render
      if (process.env.NODE_ENV === 'development' && 
          (forceConfigRef.current.lastNodeCount !== nodeCount || 
           forceConfigRef.current.lastLinkCount !== linkCount)) {
        console.log(`🔗 ForceDirected2D: Configured ${validLinks.length} valid links (${graphData.links.length} total)`);
        console.log(`📊 Nodes: ${graphData.nodes.length}, Valid Links: ${validLinks.length}`);
        
        if (validLinks.length === 0) {
          console.warn(`⚠️ No links in graphData! Check similarity threshold and data availability.`);
        }
      }
    }
  }, [width, height, graphData]);

  // Don't render if no data
  if (!graphData || !graphData.nodes || graphData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full" style={{ width, height, backgroundColor: 'transparent' }}>
        <div className="text-center">
          <div className="text-gray-400 mb-2">📊</div>
          <p className="text-gray-400">No nodes to display</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      ref={wrapperRef}
      style={{ 
        width: '100%', 
        height: '100%', 
        backgroundColor: 'transparent', 
        background: 'transparent',
        position: 'relative',
        overflow: 'hidden',
        zIndex: 20  // Ensure wrapper is on top layer
      }}
    >
      <ForceGraph2D
        {...graphProps}
        {...eventHandlers}
        // REMOVED nodeCanvasObject to use default rendering (like QdrantGraphWorking)
        // nodeCanvasObject={createNodeObject}
        onEngineStart={() => {
          // Force simulation started - nodes will get positions
          if (process.env.NODE_ENV === 'development') {
            console.log('🚀 Force simulation started', {
              nodeCount: graphData.nodes.length,
              linkCount: graphData.links.length
            });
          }
        }}
        onEngineTick={() => {
          // Force simulation is running - nodes are being positioned
        }}
        backgroundRender={(ctx, globalScale) => {
          // Background removed - canvas will be transparent
          // No background fill needed
        }}
        d3Force="link"
        d3ForceConfig={{
          charge: { strength: -300 },
          link: { distance: 80, strength: 0.1 },
          center: { strength: 0.1 }
        }}
        d3VelocityDecay={safeVisualizationSettings.showAnimations ? 0.4 : 0.8}
        d3AlphaDecay={0.0228}  // Slower decay for better stability
        cooldownTicks={100}  // More ticks before stopping
        enableZoomInteraction={true}
        enablePanInteraction={true}
        enableNodeDrag={true}
        enablePointerInteraction={true}
        onEngineStop={() => {
          if (process.env.NODE_ENV === 'development') {
            console.log('⏹️ Force simulation stopped');
          }
        }}
      />
    </div>
  );
};

export default ForceDirected2D;

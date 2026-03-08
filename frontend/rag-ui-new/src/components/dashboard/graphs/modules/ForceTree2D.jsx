/**
 * Force-Directed Tree 2D Graph Module
 * 
 * 2D tree-like hierarchy with force-directed positioning
 */

import React, { useRef, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import * as d3 from 'd3';
import { generateNodeColor, generateNodeSize, generateNodeLabel, createCommonEventHandlers, createCommonGraphProps } from '../core/GraphUtils';

const ForceTree2D = ({ 
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
  const wrapperRef = useRef();

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

  // Enhanced link color function
  const getLinkColor = (link) => {
    if (link.type === 'hub-spoke') return '#ff6b6b';
    if (link.type === 'anchor') return '#ffd700';
    // Use brighter color for better visibility on dark background
    if (link.similarity !== undefined) {
      const intensity = Math.max(0.3, Math.min(1, link.similarity));
      return `rgba(150, 150, 255, ${0.4 + intensity * 0.6})`; // Blue tint with variable opacity
    }
    return '#bbb'; // Brighter gray for better visibility on dark background
  };

  // Enhanced link width function
  const getLinkWidth = (link) => {
    if (link.type === 'hub-spoke') return 3;
    if (link.type === 'anchor') return 2;
    return safeSettings.linkWidth || 1;
  };

  // Create 2D node objects
  const createNodeObject = (node, ctx, globalScale) => {
    const size = generateNodeSize(node, safeVisualizationSettings, safeSettings);
    const color = getNodeColor(node);
    const label = generateNodeLabel(node, safeVisualizationSettings);

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

  // Common graph props
  // Create wrapper functions that capture visualizationSettings and settings
  const nodeValFn = (node) => generateNodeSize(node, safeVisualizationSettings, safeSettings);
  const nodeColorFn = (node) => getNodeColor(node);
  const linkColorFn = (link) => getLinkColor(link);
  const linkWidthFn = (link) => getLinkWidth(link);

  const graphProps = createCommonGraphProps({
    ref: graphRef,
    graphData,
    nodeLabel: safeVisualizationSettings.showText ? 'label' : '',
    nodeColor: nodeColorFn,
    nodeVal: nodeValFn,
    linkColor: linkColorFn,
    linkWidth: linkWidthFn,
    linkDirectionalArrowLength: safeVisualizationSettings.showInterconnectivity ? 3 : 0,
    linkDirectionalArrowRelPos: 1,
    width,
    height,
    ...props
  });

  // Configure D3 forces for tree layout
  useEffect(() => {
    if (graphRef.current && graphData && graphData.links && graphData.nodes) {
      // Filter links and convert string IDs to node objects (D3 requires node objects, not IDs)
      const validLinks = graphData.links
        .map(link => {
          const sourceId = typeof link.source === 'object' ? String(link.source.id) : String(link.source);
          const targetId = typeof link.target === 'object' ? String(link.target.id) : String(link.target);
          const sourceNode = graphData.nodes.find(n => String(n.id) === sourceId);
          const targetNode = graphData.nodes.find(n => String(n.id) === targetId);
          if (!sourceNode || !targetNode) {
            return null;
          }
          return {
            ...link,
            source: sourceNode,
            target: targetNode
          };
        })
        .filter(link => link !== null);
      
      // Tree layout with hierarchical positioning
      const linkDistanceFn = (link) => {
        if (link.distance !== undefined && link.distance !== null) {
          return link.distance;
        }
        return 100; // Default for tree
      };
      
      graphRef.current.d3Force('charge', d3.forceManyBody().strength(-400));
      
      const linkForce = d3.forceLink(validLinks)
        .id(d => {
          if (typeof d === 'object' && d !== null && d.id !== undefined) {
            return String(d.id);
          }
          return String(d);
        })
        .distance(linkDistanceFn)
        .strength(0.8);
      
      try {
        graphRef.current.d3Force('link', linkForce);
      } catch (error) {
        console.error('❌ Error configuring D3 link force:', error);
      }
      graphRef.current.d3Force('center', d3.forceCenter(width / 2, height / 2).strength(0.3));
    }
  }, [width, height, graphData]);

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
      nodeCanvasObject={createNodeObject}
      backgroundRender={(ctx, globalScale) => {
        // Guard against invalid canvas dimensions
        if (!ctx || !ctx.canvas || ctx.canvas.width === 0 || ctx.canvas.height === 0) {
          return;
        }
        // Set background to match UI theme
        // Background removed - canvas will be transparent
      }}
      d3Force="link"
      d3ForceConfig={{
        charge: { strength: -400 },
        link: { distance: 100, strength: 0.8 },
        center: { strength: 0.3 }
      }}
      d3VelocityDecay={safeVisualizationSettings.showAnimations ? 0.4 : 0.8}
      enableZoomInteraction={true}
      enablePanInteraction={true}
      enableNodeDrag={true}
      enablePointerInteraction={true}
    />
    </div>
  );
};

export default ForceTree2D;

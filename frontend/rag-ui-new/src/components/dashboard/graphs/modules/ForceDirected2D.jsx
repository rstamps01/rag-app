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

  // Enhanced node color function
  const getNodeColor = (node) => {
    return generateNodeColor(node, visualizationSettings);
  };

  // Enhanced link color function
  const getLinkColor = (link) => {
    if (link.type === 'hub-spoke') return '#ff6b6b';
    if (link.type === 'anchor') return '#ffd700';
    return '#666';
  };

  // Enhanced link width function
  const getLinkWidth = (link) => {
    if (link.type === 'hub-spoke') return 3;
    if (link.type === 'anchor') return 2;
    return settings.linkWidth;
  };

  // Create 2D node objects
  const createNodeObject = (node, ctx, globalScale) => {
    const size = generateNodeSize(node, visualizationSettings, settings);
    const color = getNodeColor(node);
    const label = generateNodeLabel(node, visualizationSettings);

    // Handle different node shapes
    if (visualizationSettings.nodeShape === 'text') {
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

      if (visualizationSettings.nodeShape === 'square') {
        ctx.fillRect(node.x - size/2, node.y - size/2, size, size);
        ctx.strokeRect(node.x - size/2, node.y - size/2, size, size);
      } else if (visualizationSettings.nodeShape === 'diamond') {
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
      if (visualizationSettings.showText && label) {
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
  const graphProps = createCommonGraphProps({
    ref: graphRef,
    graphData,
    nodeLabel: visualizationSettings.showText ? 'label' : '',
    nodeColor: getNodeColor,
    nodeVal: generateNodeSize,
    linkColor: getLinkColor,
    linkWidth: getLinkWidth,
    linkDirectionalArrowLength: visualizationSettings.showInterconnectivity ? 3 : 0,
    linkDirectionalArrowRelPos: 1,
    width,
    height,
    ...props
  });

  // Configure D3 forces
  useEffect(() => {
    if (graphRef.current) {
      // Standard force-directed layout
      graphRef.current.d3Force('charge', d3.forceManyBody().strength(-300));
      graphRef.current.d3Force('link', d3.forceLink()
        .id(d => d.id)
        .distance(80)
        .strength(0.1)
      );
      graphRef.current.d3Force('center', d3.forceCenter(width / 2, height / 2).strength(0.1));
    }
  }, [width, height]);

  return (
    <ForceGraph2D
      {...graphProps}
      {...eventHandlers}
      nodeCanvasObject={createNodeObject}
      backgroundRender={(ctx, globalScale) => {
        // Set background to match UI theme
        ctx.fillStyle = '#1f2937';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      }}
      d3Force="link"
      d3ForceConfig={{
        charge: { strength: -300 },
        link: { distance: 80, strength: 0.1 },
        center: { strength: 0.1 }
      }}
      d3VelocityDecay={visualizationSettings.showAnimations ? 0.4 : 0.8}
      enableZoomInteraction={true}
      enablePanInteraction={true}
      enableNodeDrag={true}
      enablePointerInteraction={true}
    />
  );
};

export default ForceDirected2D;

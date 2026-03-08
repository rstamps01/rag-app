/**
 * Disjoint Force-Directed 3D Graph Module
 * 
 * 3D force-directed graph that prevents detached subgraphs from escaping viewport
 */

import React, { useRef, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import * as d3 from 'd3';
import { generateNodeColor, generateNodeSize, generateNodeLabel, createCommonEventHandlers, createCommonGraphProps } from '../core/GraphUtils';

const DisjointForce3D = ({ 
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

  // Provide default values for visualizationSettings and settings to prevent errors
  const safeVisualizationSettings = visualizationSettings || {
    showInterconnectivity: true,
    showText: false,
    nodeShape: 'circle',
    showAnimations: true
  };
  
  const safeSettings = settings || {
    nodeSize: 6,  // Increased from 3 for better visibility in 3D (radius = 3px)
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

  // Create 3D node objects
  const createNodeObject = (node) => {
    const size = generateNodeSize(node, safeVisualizationSettings, safeSettings);
    const color = getNodeColor(node);
    
    // Create different geometries based on node shape
    let geometry;
    if (safeVisualizationSettings.nodeShape === 'square') {
      geometry = new THREE.BoxGeometry(size, size, size);
    } else if (safeVisualizationSettings.nodeShape === 'diamond') {
      geometry = new THREE.OctahedronGeometry(size / 2);
    } else {
      geometry = new THREE.SphereGeometry(size / 2, 16, 12);
    }

    const material = new THREE.MeshLambertMaterial({ color });
    return new THREE.Mesh(geometry, material);
  };

  // Create link text objects
  const createLinkObject = (link) => {
    if (!safeVisualizationSettings.showInterconnectivity) {
      return null;
    }

    const sprite = new SpriteText(link.label || `${link.source.id} → ${link.target.id}`);
    sprite.color = link.type === 'hub-spoke' ? '#ff6b6b' : '#fff';
    sprite.textHeight = 4;
    return sprite;
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

  // Configure D3 forces with containment
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
      
      // Disjoint force-directed layout with containment
      const linkDistanceFn = (link) => {
        if (link.distance !== undefined && link.distance !== null) {
          return link.distance;
        }
        return 60; // Default for disjoint
      };
      
      graphRef.current.d3Force('charge', d3.forceManyBody().strength(-600));
      
      const linkForce = d3.forceLink(validLinks)
        .id(d => {
          if (typeof d === 'object' && d !== null && d.id !== undefined) {
            return String(d.id);
          }
          return String(d);
        })
        .distance(linkDistanceFn)
        .strength(0.3);
      
      try {
        graphRef.current.d3Force('link', linkForce);
      } catch (error) {
        console.error('❌ Error configuring D3 link force:', error);
      }
      graphRef.current.d3Force('center', d3.forceCenter(width / 2, height / 2).strength(0.2));
    }
  }, [width, height, graphData]);

  return (
    <ForceGraph3D
      {...graphProps}
      {...eventHandlers}
      nodeThreeObject={createNodeObject}
      linkThreeObject={createLinkObject}
      linkPositionUpdate={(sprite, { start, end }) => {
        // Position link text at the midpoint
        const middlePos = Object.assign(...['x', 'y', 'z'].map(c => ({
          [c]: start[c] + (end[c] - start[c]) / 2
        })));
        Object.assign(sprite.position, middlePos);
      }}
      linkThreeObjectExtend={safeVisualizationSettings.showInterconnectivity}
      showNavInfo={false}
      controlType="orbit"
      backgroundColor="transparent"
      d3Force="link"
      d3ForceConfig={{
        charge: { strength: -600 },
        link: { distance: 60, strength: 0.3 },
        center: { strength: 0.2 }
      }}
      enableZoomInteraction={true}
      enablePanInteraction={true}
      enableNodeDrag={true}
      enablePointerInteraction={true}
    />
  );
};

export default DisjointForce3D;

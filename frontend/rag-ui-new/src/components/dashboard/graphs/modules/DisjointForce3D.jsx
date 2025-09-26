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

  // Create 3D node objects
  const createNodeObject = (node) => {
    const size = generateNodeSize(node, visualizationSettings, settings);
    const color = getNodeColor(node);
    
    // Create different geometries based on node shape
    let geometry;
    if (visualizationSettings.nodeShape === 'square') {
      geometry = new THREE.BoxGeometry(size, size, size);
    } else if (visualizationSettings.nodeShape === 'diamond') {
      geometry = new THREE.OctahedronGeometry(size / 2);
    } else {
      geometry = new THREE.SphereGeometry(size / 2, 16, 12);
    }

    const material = new THREE.MeshLambertMaterial({ color });
    return new THREE.Mesh(geometry, material);
  };

  // Create link text objects
  const createLinkObject = (link) => {
    if (!visualizationSettings.showInterconnectivity) {
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

  // Configure D3 forces with containment
  useEffect(() => {
    if (graphRef.current) {
      // Disjoint force-directed layout with containment
      graphRef.current.d3Force('charge', d3.forceManyBody().strength(-600));
      graphRef.current.d3Force('link', d3.forceLink()
        .id(d => d.id)
        .distance(60)
        .strength(0.3)
      );
      graphRef.current.d3Force('center', d3.forceCenter(width / 2, height / 2).strength(0.2));
    }
  }, [width, height]);

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
      linkThreeObjectExtend={visualizationSettings.showInterconnectivity}
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

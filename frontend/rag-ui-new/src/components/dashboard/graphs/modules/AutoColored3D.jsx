/**
 * Auto-Colored 3D Graph Module
 * 
 * 3D force-directed graph with automatic color assignment based on node properties
 * Based on: https://github.com/vasturiano/3d-force-graph/blob/master/example/auto-colored/index.html
 */

import React, { useRef, useEffect, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import * as d3 from 'd3';
import { generateNodeColor, generateNodeSize, generateNodeLabel, generateAutoColor, createCommonEventHandlers, createCommonGraphProps } from '../core/GraphUtils';

const AutoColored3D = ({ 
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
  const [colorScheme, setColorScheme] = useState(visualizationSettings.colorScheme || 'group');
  const [nodeColors, setNodeColors] = useState(new Map());

  // Generate colors for all nodes based on current color scheme
  useEffect(() => {
    const newColors = new Map();
    graphData.nodes.forEach((node, index) => {
      const color = generateAutoColor(node, index, graphData.nodes.length, { ...visualizationSettings, colorScheme });
      newColors.set(node.id, color);
    });
    setNodeColors(newColors);
  }, [graphData.nodes, colorScheme, visualizationSettings]);

  // Enhanced node color function with auto-coloring
  const getNodeColor = (node) => {
    return nodeColors.get(node.id) || generateAutoColor(node, graphData.nodes.indexOf(node), graphData.nodes.length, { ...visualizationSettings, colorScheme });
  };

  // Enhanced link color function with auto-coloring
  const getLinkColor = (link) => {
    if (link.type === 'hub-spoke') return '#ff6b6b';
    if (link.type === 'anchor') return '#ffd700';
    
    // Color links based on connected nodes
    const sourceColor = nodeColors.get(link.source.id) || '#666';
    const targetColor = nodeColors.get(link.target.id) || '#666';
    
    // Blend colors for inter-node connections
    if (sourceColor !== targetColor) {
      return '#999'; // Neutral color for different node types
    }
    
    return sourceColor; // Same color as connected nodes
  };

  // Enhanced link width function
  const getLinkWidth = (link) => {
    if (link.type === 'hub-spoke') return 3;
    if (link.type === 'anchor') return 2;
    return settings.linkWidth;
  };

  // Create 3D node objects with auto-coloring
  const createNodeObject = (node) => {
    const size = generateNodeSize(node, visualizationSettings, settings);
    const color = getNodeColor(node);
    
    // Create different geometries based on node properties
    let geometry;
    if (visualizationSettings.nodeShape === 'square') {
      geometry = new THREE.BoxGeometry(size, size, size);
    } else if (visualizationSettings.nodeShape === 'diamond') {
      geometry = new THREE.OctahedronGeometry(size / 2);
    } else {
      geometry = new THREE.SphereGeometry(size / 2, 16, 12);
    }

    const material = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    
    // Add subtle glow effect for better 3D appearance
    const glowGeometry = new THREE.SphereGeometry(size * 1.1, 16, 12);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.1
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    mesh.add(glowMesh);

    return mesh;
  };

  // Create link text objects with auto-coloring
  const createLinkObject = (link) => {
    if (!visualizationSettings.showInterconnectivity) {
      return null;
    }

    const sprite = new SpriteText(link.label || `${link.source.id} → ${link.target.id}`);
    sprite.color = getLinkColor(link);
    sprite.textHeight = 4;
    return sprite;
  };

  // Color scheme change handler
  const handleColorSchemeChange = (newScheme) => {
    setColorScheme(newScheme);
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

  return (
    <div style={{ position: 'relative', width, height }}>
      {/* Color Scheme Controls Overlay */}
      <div style={{
        position: 'absolute',
        top: 10,
        right: 10,
        zIndex: 10,
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '10px',
        borderRadius: '5px',
        color: 'white',
        fontSize: '12px'
      }}>
        <div style={{ marginBottom: '10px' }}>
          <label>Color Scheme:</label>
          <select
            value={colorScheme}
            onChange={(e) => handleColorSchemeChange(e.target.value)}
            style={{
              marginLeft: '10px',
              padding: '2px 5px',
              borderRadius: '3px',
              border: '1px solid #666',
              background: '#333',
              color: 'white'
            }}
          >
            <option value="group">Group</option>
            <option value="department">Department</option>
            <option value="file_type">File Type</option>
            <option value="document">Document</option>
            <option value="chunk_index">Chunk Index</option>
          </select>
        </div>
        
        <div style={{ fontSize: '10px', color: '#ccc' }}>
          Colors auto-assigned based on node properties
        </div>
      </div>

      {/* 3D Graph */}
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
          charge: { strength: -300 },
          link: { distance: 80, strength: 0.1 },
          center: { strength: 0.1 }
        }}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        enableNodeDrag={true}
        enablePointerInteraction={true}
      />
    </div>
  );
};

export default AutoColored3D;

/**
 * Highlight Nodes/Links 3D Graph Module
 * 
 * 3D force-directed graph with advanced highlighting capabilities
 * Based on: https://github.com/vasturiano/3d-force-graph/blob/master/example/highlight/index.html
 */

import React, { useRef, useEffect, useState } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import * as d3 from 'd3';
import { generateNodeColor, generateNodeSize, generateNodeLabel, createCommonEventHandlers, createCommonGraphProps } from '../core/GraphUtils';

const Highlight3D = ({ 
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
  const [highlightedNodes, setHighlightedNodes] = useState(new Set());
  const [highlightedLinks, setHighlightedLinks] = useState(new Set());
  const [hoveredNode, setHoveredNode] = useState(null);

  // Enhanced highlighting logic
  const updateHighlight = () => {
    if (!graphRef.current) return;

    const { nodes, links } = graphData;
    
    // Reset all nodes and links to default appearance
    nodes.forEach(node => {
      node.__highlighted = false;
    });
    links.forEach(link => {
      link.__highlighted = false;
    });

    // Highlight connected nodes and links
    highlightedNodes.forEach(nodeId => {
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        node.__highlighted = true;
        
        // Highlight connected links
        links.forEach(link => {
          if (link.source.id === nodeId || link.target.id === nodeId) {
            link.__highlighted = true;
          }
        });
      }
    });

    // Highlight specific links
    highlightedLinks.forEach(linkId => {
      const link = links.find(l => l.id === linkId);
      if (link) {
        link.__highlighted = true;
        link.source.__highlighted = true;
        link.target.__highlighted = true;
      }
    });

    // Trigger re-render
    graphRef.current.refresh();
  };

  // Update highlight when data changes
  useEffect(() => {
    updateHighlight();
  }, [graphData, highlightedNodes, highlightedLinks]);

  // Enhanced node color function with highlighting
  const getNodeColor = (node) => {
    if (node.__highlighted) {
      return '#ff6b6b'; // Highlighted nodes in red
    }
    if (hoveredNode && hoveredNode.id === node.id) {
      return '#4CAF50'; // Hovered nodes in green
    }
    return generateNodeColor(node, visualizationSettings);
  };

  // Enhanced link color function with highlighting
  const getLinkColor = (link) => {
    if (link.__highlighted) {
      return '#ff6b6b'; // Highlighted links in red
    }
    if (hoveredNode && (link.source.id === hoveredNode.id || link.target.id === hoveredNode.id)) {
      return '#4CAF50'; // Links connected to hovered node in green
    }
    return '#666'; // Default link color
  };

  // Enhanced link width function with highlighting
  const getLinkWidth = (link) => {
    if (link.__highlighted) {
      return 4; // Thicker highlighted links
    }
    if (hoveredNode && (link.source.id === hoveredNode.id || link.target.id === hoveredNode.id)) {
      return 3; // Medium thickness for hovered links
    }
    return settings.linkWidth;
  };

  // Enhanced node size function with highlighting
  const getNodeSize = (node) => {
    const baseSize = generateNodeSize(node, visualizationSettings, settings);
    if (node.__highlighted) {
      return baseSize * 1.5; // Larger highlighted nodes
    }
    if (hoveredNode && hoveredNode.id === node.id) {
      return baseSize * 1.2; // Slightly larger hovered nodes
    }
    return baseSize;
  };

  // Create 3D node objects with highlighting effects
  const createNodeObject = (node) => {
    const size = getNodeSize(node);
    const color = getNodeColor(node);
    
    // Create different geometries based on highlighting state
    let geometry;
    if (node.__highlighted) {
      // Highlighted nodes use octahedron for more dramatic effect
      geometry = new THREE.OctahedronGeometry(size / 2);
    } else if (hoveredNode && hoveredNode.id === node.id) {
      // Hovered nodes use box geometry
      geometry = new THREE.BoxGeometry(size, size, size);
    } else {
      // Normal nodes use sphere
      geometry = new THREE.SphereGeometry(size / 2, 16, 12);
    }

    const material = new THREE.MeshLambertMaterial({ 
      color,
      transparent: node.__highlighted,
      opacity: node.__highlighted ? 0.8 : 1.0
    });

    const mesh = new THREE.Mesh(geometry, material);
    
    // Add glow effect for highlighted nodes
    if (node.__highlighted) {
      const glowGeometry = new THREE.SphereGeometry(size * 1.2, 16, 12);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: '#ff6b6b',
        transparent: true,
        opacity: 0.3
      });
      const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
      mesh.add(glowMesh);
    }

    return mesh;
  };

  // Enhanced event handlers
  const handleNodeClick = (node) => {
    if (onNodeClick) {
      onNodeClick(node);
    }

    // Toggle node highlighting
    const newHighlighted = new Set(highlightedNodes);
    if (newHighlighted.has(node.id)) {
      newHighlighted.delete(node.id);
    } else {
      newHighlighted.add(node.id);
    }
    setHighlightedNodes(newHighlighted);
  };

  const handleNodeHover = (node) => {
    if (onNodeHover) {
      onNodeHover(node);
    }
    setHoveredNode(node);
  };

  const handleNodeUnhover = () => {
    setHoveredNode(null);
  };

  const handleLinkClick = (link) => {
    if (onLinkClick) {
      onLinkClick(link);
    }

    // Toggle link highlighting
    const linkId = `${link.source.id}-${link.target.id}`;
    const newHighlighted = new Set(highlightedLinks);
    if (newHighlighted.has(linkId)) {
      newHighlighted.delete(linkId);
    } else {
      newHighlighted.add(linkId);
    }
    setHighlightedLinks(newHighlighted);
  };

  const handleLinkHover = (link) => {
    if (onLinkHover) {
      onLinkHover(link);
    }
  };

  // Create link text objects
  const createLinkObject = (link) => {
    if (!visualizationSettings.showInterconnectivity) {
      return null;
    }

    const sprite = new SpriteText(link.label || `${link.source.id} → ${link.target.id}`);
    sprite.color = link.__highlighted ? '#ff6b6b' : '#fff';
    sprite.textHeight = link.__highlighted ? 6 : 4;
    return sprite;
  };

  // Common event handlers
  const eventHandlers = createCommonEventHandlers({
    onNodeClick: handleNodeClick,
    onNodeHover: handleNodeHover,
    onNodeDrag,
    onNodeDragEnd,
    onBackgroundClick,
    onLinkClick: handleLinkClick,
    onLinkHover: handleLinkHover
  });

  // Common graph props
  const graphProps = createCommonGraphProps({
    ref: graphRef,
    graphData,
    nodeLabel: visualizationSettings.showText ? 'label' : '',
    nodeColor: getNodeColor,
    nodeVal: getNodeSize,
    linkColor: getLinkColor,
    linkWidth: getLinkWidth,
    linkDirectionalArrowLength: visualizationSettings.showInterconnectivity ? 3 : 0,
    linkDirectionalArrowRelPos: 1,
    width,
    height,
    ...props
  });

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
      onNodeHover={handleNodeHover}
      onNodeUnhover={handleNodeUnhover}
      showNavInfo={false}
      controlType="orbit"
      backgroundColor="transparent"
      d3Force="link"
      d3ForceConfig={{
        charge: { strength: -300 },
        link: { distance: 80, strength: 0.1 },
        center: { strength: 0.1 }
      }}
    />
  );
};

export default Highlight3D;

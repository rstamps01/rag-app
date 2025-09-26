/**
 * Click-to-Focus 3D Graph Module
 * 
 * 3D force-directed graph with click-to-focus camera controls
 * Based on: https://github.com/vasturiano/3d-force-graph/blob/master/example/click-to-focus/index.html
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import * as d3 from 'd3';
import { generateNodeColor, generateNodeSize, generateNodeLabel, createCommonEventHandlers, createCommonGraphProps } from '../core/GraphUtils';

const ClickFocus3D = ({ 
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
  const [focusedNode, setFocusedNode] = useState(null);
  const [cameraPosition, setCameraPosition] = useState({ x: 0, y: 0, z: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionProgress, setTransitionProgress] = useState(0);

  // Camera focus functionality
  const focusOnNode = useCallback((node) => {
    if (!graphRef.current || !node) return;

    setIsTransitioning(true);
    setFocusedNode(node);
    setTransitionProgress(0);

    // Calculate target camera position
    const targetPosition = {
      x: node.x || 0,
      y: node.y || 0,
      z: (node.z || 0) + 100 // Offset to avoid being inside the node
    };

    // Smooth camera transition
    const startPosition = { ...cameraPosition };
    const duration = 1000; // 1 second transition
    const startTime = Date.now();

    const animateCamera = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function for smooth transition
      const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
      const easedProgress = easeInOutCubic(progress);

      const currentPosition = {
        x: startPosition.x + (targetPosition.x - startPosition.x) * easedProgress,
        y: startPosition.y + (targetPosition.y - startPosition.y) * easedProgress,
        z: startPosition.z + (targetPosition.z - startPosition.z) * easedProgress
      };

      // Update camera position
      graphRef.current.cameraPosition(currentPosition.x, currentPosition.y, currentPosition.z);
      setCameraPosition(currentPosition);
      setTransitionProgress(progress);

      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      } else {
        setIsTransitioning(false);
        setTransitionProgress(1);
      }
    };

    requestAnimationFrame(animateCamera);
  }, [cameraPosition]);

  // Reset camera to default position
  const resetCamera = useCallback(() => {
    if (!graphRef.current) return;

    setIsTransitioning(true);
    setFocusedNode(null);
    setTransitionProgress(0);

    const defaultPosition = { x: 0, y: 0, z: 500 };
    const startPosition = { ...cameraPosition };
    const duration = 1000;
    const startTime = Date.now();

    const animateCamera = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const easeInOutCubic = (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
      const easedProgress = easeInOutCubic(progress);

      const currentPosition = {
        x: startPosition.x + (defaultPosition.x - startPosition.x) * easedProgress,
        y: startPosition.y + (defaultPosition.y - startPosition.y) * easedProgress,
        z: startPosition.z + (defaultPosition.z - startPosition.z) * easedProgress
      };

      graphRef.current.cameraPosition(currentPosition.x, currentPosition.y, currentPosition.z);
      setCameraPosition(currentPosition);
      setTransitionProgress(progress);

      if (progress < 1) {
        requestAnimationFrame(animateCamera);
      } else {
        setIsTransitioning(false);
        setTransitionProgress(1);
      }
    };

    requestAnimationFrame(animateCamera);
  }, [cameraPosition]);

  // Enhanced node click handler
  const handleNodeClick = useCallback((node) => {
    if (onNodeClick) {
      onNodeClick(node);
    }

    // Focus on clicked node
    focusOnNode(node);
  }, [onNodeClick, focusOnNode]);

  // Enhanced node hover handler
  const handleNodeHover = useCallback((node) => {
    if (onNodeHover) {
      onNodeHover(node);
    }
  }, [onNodeHover]);

  // Enhanced background click handler
  const handleBackgroundClick = useCallback(() => {
    if (onBackgroundClick) {
      onBackgroundClick();
    }

    // Reset camera on background click
    resetCamera();
  }, [onBackgroundClick, resetCamera]);

  // Enhanced node color function with focus highlighting
  const getNodeColor = (node) => {
    if (focusedNode && focusedNode.id === node.id) {
      return '#ff6b6b'; // Focused node in red
    }
    if (isTransitioning && focusedNode && focusedNode.id === node.id) {
      // Pulsing effect during transition
      const pulseIntensity = 0.5 + 0.5 * Math.sin(Date.now() * 0.01);
      return `rgba(255, 107, 107, ${pulseIntensity})`;
    }
    return generateNodeColor(node, visualizationSettings);
  };

  // Enhanced link color function with focus highlighting
  const getLinkColor = (link) => {
    if (focusedNode && (link.source.id === focusedNode.id || link.target.id === focusedNode.id)) {
      return '#ff6b6b'; // Links connected to focused node
    }
    return '#666';
  };

  // Enhanced link width function with focus highlighting
  const getLinkWidth = (link) => {
    if (focusedNode && (link.source.id === focusedNode.id || link.target.id === focusedNode.id)) {
      return 4; // Thicker links to focused node
    }
    return settings.linkWidth;
  };

  // Enhanced node size function with focus highlighting
  const getNodeSize = (node) => {
    const baseSize = generateNodeSize(node, visualizationSettings, settings);
    if (focusedNode && focusedNode.id === node.id) {
      return baseSize * 2; // Much larger focused node
    }
    if (isTransitioning && focusedNode && focusedNode.id === node.id) {
      // Growing effect during transition
      const growthFactor = 1 + transitionProgress * 0.5;
      return baseSize * growthFactor;
    }
    return baseSize;
  };

  // Create 3D node objects with focus effects
  const createNodeObject = (node) => {
    const size = getNodeSize(node);
    const color = getNodeColor(node);
    
    // Create different geometries based on focus state
    let geometry;
    if (focusedNode && focusedNode.id === node.id) {
      // Focused nodes use octahedron for dramatic effect
      geometry = new THREE.OctahedronGeometry(size / 2);
    } else {
      // Normal nodes use sphere
      geometry = new THREE.SphereGeometry(size / 2, 16, 12);
    }

    const material = new THREE.MeshLambertMaterial({ 
      color,
      transparent: isTransitioning && focusedNode && focusedNode.id === node.id,
      opacity: isTransitioning && focusedNode && focusedNode.id === node.id ? 0.8 : 1.0
    });

    const mesh = new THREE.Mesh(geometry, material);
    
    // Add glow effect for focused nodes
    if (focusedNode && focusedNode.id === node.id) {
      const glowGeometry = new THREE.SphereGeometry(size * 1.3, 16, 12);
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

  // Create link text objects
  const createLinkObject = (link) => {
    if (!visualizationSettings.showInterconnectivity) {
      return null;
    }

    const sprite = new SpriteText(link.label || `${link.source.id} → ${link.target.id}`);
    sprite.color = focusedNode && (link.source.id === focusedNode.id || link.target.id === focusedNode.id) 
      ? '#ff6b6b' : '#fff';
    sprite.textHeight = focusedNode && (link.source.id === focusedNode.id || link.target.id === focusedNode.id) 
      ? 6 : 4;
    return sprite;
  };

  // Common event handlers
  const eventHandlers = createCommonEventHandlers({
    onNodeClick: handleNodeClick,
    onNodeHover: handleNodeHover,
    onNodeDrag,
    onNodeDragEnd,
    onBackgroundClick: handleBackgroundClick,
    onLinkClick,
    onLinkHover
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
    <div style={{ position: 'relative', width, height }}>
      {/* Focus Controls Overlay */}
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
          <button
            onClick={resetCamera}
            style={{
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '3px',
              cursor: 'pointer',
              marginRight: '10px'
            }}
          >
            🎯 Reset View
          </button>
          {focusedNode && (
            <span>Focused: {focusedNode.label || focusedNode.id}</span>
          )}
        </div>
        
        {isTransitioning && (
          <div>
            <div>Transitioning... {Math.round(transitionProgress * 100)}%</div>
            <div style={{
              width: '100px',
              height: '4px',
              background: '#333',
              borderRadius: '2px',
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${transitionProgress * 100}%`,
                height: '100%',
                background: '#4CAF50',
                transition: 'width 0.1s ease'
              }} />
            </div>
          </div>
        )}
        
        <div style={{ fontSize: '10px', color: '#ccc', marginTop: '5px' }}>
          Click any node to focus • Click background to reset
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

export default ClickFocus3D;

/**
 * Pause/Resume Animation 3D Graph Module
 * 
 * 3D force-directed graph with pause/resume animation controls
 * Based on: https://github.com/vasturiano/3d-force-graph/blob/master/example/pause-resume/index.html
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import SpriteText from 'three-spritetext';
import * as THREE from 'three';
import * as d3 from 'd3';
import { generateNodeColor, generateNodeSize, generateNodeLabel, createCommonEventHandlers, createCommonGraphProps } from '../core/GraphUtils';

const PauseResume3D = ({ 
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
  const [isPaused, setIsPaused] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState(1.0);
  const [showControls, setShowControls] = useState(true);

  // Pause/resume functionality
  const pauseAnimation = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.pauseAnimation();
      setIsPaused(true);
    }
  }, []);

  const resumeAnimation = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.resumeAnimation();
      setIsPaused(false);
    }
  }, []);

  const toggleAnimation = useCallback(() => {
    if (isPaused) {
      resumeAnimation();
    } else {
      pauseAnimation();
    }
  }, [isPaused, pauseAnimation, resumeAnimation]);

  // Animation speed control
  const setSpeed = useCallback((speed) => {
    setAnimationSpeed(speed);
    if (graphRef.current) {
      graphRef.current.d3Force('link').strength(0.1 * speed);
      graphRef.current.d3Force('charge').strength(-300 * speed);
    }
  }, []);

  // Auto-pause on hover (optional feature)
  const handleNodeHover = useCallback((node) => {
    if (onNodeHover) {
      onNodeHover(node);
    }
    
    // Auto-pause on hover if enabled
    if (visualizationSettings.autoPauseOnHover) {
      pauseAnimation();
    }
  }, [onNodeHover, visualizationSettings.autoPauseOnHover, pauseAnimation]);

  const handleNodeUnhover = useCallback(() => {
    // Auto-resume on unhover if enabled
    if (visualizationSettings.autoPauseOnHover) {
      resumeAnimation();
    }
  }, [visualizationSettings.autoPauseOnHover, resumeAnimation]);

  // Enhanced node color function
  const getNodeColor = (node) => {
    if (isPaused && node.__isMoving) {
      return '#ff6b6b'; // Red for moving nodes when paused
    }
    return generateNodeColor(node, visualizationSettings);
  };

  // Enhanced link color function
  const getLinkColor = (link) => {
    if (isPaused) {
      return '#666'; // Dimmed links when paused
    }
    return '#999';
  };

  // Enhanced link width function
  const getLinkWidth = (link) => {
    if (isPaused) {
      return settings.linkWidth * 0.5; // Thinner links when paused
    }
    return settings.linkWidth;
  };

  // Create 3D node objects with animation state indicators
  const createNodeObject = (node) => {
    const size = generateNodeSize(node, visualizationSettings, settings);
    const color = getNodeColor(node);
    
    // Create different geometries based on animation state
    let geometry;
    if (isPaused && node.__isMoving) {
      // Moving nodes when paused use octahedron
      geometry = new THREE.OctahedronGeometry(size / 2);
    } else if (isPaused) {
      // Stationary nodes when paused use box
      geometry = new THREE.BoxGeometry(size, size, size);
    } else {
      // Normal animated nodes use sphere
      geometry = new THREE.SphereGeometry(size / 2, 16, 12);
    }

    const material = new THREE.MeshLambertMaterial({ 
      color,
      transparent: isPaused,
      opacity: isPaused ? 0.7 : 1.0
    });

    const mesh = new THREE.Mesh(geometry, material);
    
    // Add pulsing effect for moving nodes when paused
    if (isPaused && node.__isMoving) {
      const pulseGeometry = new THREE.SphereGeometry(size * 1.1, 16, 12);
      const pulseMaterial = new THREE.MeshBasicMaterial({
        color: '#ff6b6b',
        transparent: true,
        opacity: 0.3
      });
      const pulseMesh = new THREE.Mesh(pulseGeometry, pulseMaterial);
      mesh.add(pulseMesh);
    }

    return mesh;
  };

  // Create link text objects
  const createLinkObject = (link) => {
    if (!visualizationSettings.showInterconnectivity) {
      return null;
    }

    const sprite = new SpriteText(link.label || `${link.source.id} → ${link.target.id}`);
    sprite.color = isPaused ? '#666' : '#fff';
    sprite.textHeight = isPaused ? 3 : 4;
    return sprite;
  };

  // Animation tick handler
  const handleTick = useCallback(() => {
    if (!graphRef.current) return;

    // Mark nodes as moving or stationary
    const nodes = graphData.nodes;
    nodes.forEach(node => {
      const velocity = Math.sqrt(node.vx * node.vx + node.vy * node.vy + node.vz * node.vz);
      node.__isMoving = velocity > 0.1;
    });
  }, [graphData.nodes]);

  // Common event handlers
  const eventHandlers = createCommonEventHandlers({
    onNodeClick,
    onNodeHover: handleNodeHover,
    onNodeDrag,
    onNodeDragEnd,
    onBackgroundClick,
    onLinkClick,
    onLinkHover
  });

  // Common graph props
  // Create wrapper functions that capture visualizationSettings and settings
  const nodeValFn = (node) => generateNodeSize(node, visualizationSettings, settings);
  const nodeColorFn = (node) => getNodeColor(node);
  const linkColorFn = (link) => getLinkColor(link);
  const linkWidthFn = (link) => getLinkWidth(link);

  const graphProps = createCommonGraphProps({
    ref: graphRef,
    graphData,
    nodeLabel: visualizationSettings.showText ? 'label' : '',
    nodeColor: nodeColorFn,
    nodeVal: nodeValFn,
    linkColor: linkColorFn,
    linkWidth: linkWidthFn,
    linkDirectionalArrowLength: visualizationSettings.showInterconnectivity ? 3 : 0,
    linkDirectionalArrowRelPos: 1,
    width,
    height,
    ...props
  });

  return (
    <div style={{ position: 'relative', width, height }}>
      {/* Animation Controls Overlay */}
      {showControls && (
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
              onClick={toggleAnimation}
              style={{
                background: isPaused ? '#4CAF50' : '#f44336',
                color: 'white',
                border: 'none',
                padding: '5px 10px',
                borderRadius: '3px',
                cursor: 'pointer',
                marginRight: '10px'
              }}
            >
              {isPaused ? '▶ Resume' : '⏸ Pause'}
            </button>
            <span>{isPaused ? 'Paused' : 'Playing'}</span>
          </div>
          
          <div style={{ marginBottom: '10px' }}>
            <label>Speed: {animationSpeed.toFixed(1)}x</label>
            <input
              type="range"
              min="0.1"
              max="3.0"
              step="0.1"
              value={animationSpeed}
              onChange={(e) => setSpeed(parseFloat(e.target.value))}
              style={{ width: '100px', marginLeft: '10px' }}
            />
          </div>
          
          <div>
            <label>
              <input
                type="checkbox"
                checked={visualizationSettings.autoPauseOnHover}
                onChange={(e) => {
                  // This would need to be handled by parent component
                  console.log('Auto-pause on hover:', e.target.checked);
                }}
                style={{ marginRight: '5px' }}
              />
              Auto-pause on hover
            </label>
          </div>
        </div>
      )}

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
        onNodeUnhover={handleNodeUnhover}
        onTick={handleTick}
        showNavInfo={false}
        controlType="orbit"
        backgroundColor="transparent"
        d3Force="link"
        d3ForceConfig={{
          charge: { strength: -300 * animationSpeed },
          link: { distance: 80, strength: 0.1 * animationSpeed },
          center: { strength: 0.1 }
        }}
        d3VelocityDecay={visualizationSettings.showAnimations ? 0.4 : 0.8}
        enableZoomInteraction={true}
        enablePanInteraction={true}
        enableNodeDrag={true}
        enablePointerInteraction={true}
      />
    </div>
  );
};

export default PauseResume3D;

/**
 * Click-to-Focus 3D Graph Module - Working Version
 * 
 * 3D graph with click-to-focus camera controls
 */

import React, { useState, useRef, useCallback } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { Target, RotateCcw, ZoomIn, ZoomOut } from 'lucide-react';

const ClickFocus3DWorking = React.forwardRef(({ 
  graphData, 
  width = 800, 
  height = 500,
  onNodeClick,
  onBackgroundClick,
  movementSpeed = 2.0,
  showLabels = false,
  nodeSize = 3,
  linkWidth = 1
}, ref) => {
  const [focusedNode, setFocusedNode] = useState(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Focus on a specific node
  const focusOnNode = useCallback((node) => {
    if (ref && ref.current && node) {
      setIsTransitioning(true);
      
      // Calculate distance for good viewing angle
      const distance = 200;
      const nodePosition = { x: node.x || 0, y: node.y || 0, z: node.z || 0 };
      
      // Focus camera on the node
      ref.current.cameraPosition(
        { x: nodePosition.x + distance, y: nodePosition.y + distance, z: nodePosition.z + distance },
        { x: nodePosition.x, y: nodePosition.y, z: nodePosition.z },
        2000 // Transition duration in ms
      );
      
      setFocusedNode(node);
      
      // Reset transition state after animation
      setTimeout(() => {
        setIsTransitioning(false);
      }, 2000);
    }
  }, [ref]);

  // Reset camera to default position
  const resetCamera = useCallback(() => {
    if (ref && ref.current) {
      ref.current.cameraPosition(
        { x: 0, y: 0, z: 400 },
        { x: 0, y: 0, z: 0 },
        1000
      );
      setFocusedNode(null);
    }
  }, [ref]);

  // Handle node click with focus
  const handleNodeClick = useCallback((node) => {
    if (onNodeClick) {
      onNodeClick(node);
    }
    focusOnNode(node);
  }, [onNodeClick, focusOnNode]);

  // Zoom in/out
  const zoomIn = useCallback(() => {
    if (ref && ref.current) {
      const currentPos = ref.current.cameraPosition();
      const newPos = {
        x: currentPos.x * 0.8,
        y: currentPos.y * 0.8,
        z: currentPos.z * 0.8
      };
      ref.current.cameraPosition(newPos, 500);
    }
  }, [ref]);

  const zoomOut = useCallback(() => {
    if (ref && ref.current) {
      const currentPos = ref.current.cameraPosition();
      const newPos = {
        x: currentPos.x * 1.2,
        y: currentPos.y * 1.2,
        z: currentPos.z * 1.2
      };
      ref.current.cameraPosition(newPos, 500);
    }
  }, [ref]);

  // Node color with focus highlighting
  const getNodeColor = useCallback((node) => {
    if (focusedNode && focusedNode.id === node.id) {
      return '#ff6b6b'; // Red for focused node
    }
    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'];
    return colors[node.group % colors.length];
  }, [focusedNode]);

  // Node size with focus highlighting
  const getNodeSize = useCallback((node) => {
    if (focusedNode && focusedNode.id === node.id) {
      return nodeSize * 2.5; // Larger for focused node
    }
    return nodeSize; // Use prop value
  }, [focusedNode, nodeSize]);

  return (
    <div className="relative">
      {/* Controls */}
      <div className="absolute top-2 left-2 z-10 bg-gray-800 bg-opacity-90 rounded-lg p-3">
        <div className="flex items-center space-x-3 text-sm text-white">
          {/* Focus Button */}
          <button
            onClick={() => focusedNode && focusOnNode(focusedNode)}
            className={`p-2 rounded transition-colors ${
              focusedNode ? 'bg-red-600 hover:bg-red-500' : 'bg-gray-600'
            }`}
            title="Focus on Selected Node"
            disabled={!focusedNode}
          >
            <Target className="w-4 h-4" />
          </button>

          {/* Reset Camera */}
          <button
            onClick={resetCamera}
            className="p-2 bg-blue-600 hover:bg-blue-500 rounded transition-colors"
            title="Reset Camera"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center space-x-1">
            <button
              onClick={zoomOut}
              className="p-1 bg-gray-600 hover:bg-gray-500 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-3 h-3" />
            </button>
            
            <button
              onClick={zoomIn}
              className="p-1 bg-gray-600 hover:bg-gray-500 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-3 h-3" />
            </button>
          </div>

          {/* Status */}
          <div className="text-gray-400">
            {isTransitioning ? 'Focusing...' : focusedNode ? `Focused: ${focusedNode.label}` : 'Click a node to focus'}
          </div>
        </div>
      </div>

      {/* Graph */}
        <ForceGraph3D
          ref={ref}
          graphData={graphData}
        nodeLabel={showLabels ? "label" : ""}
        nodeColor={getNodeColor}
        nodeVal={getNodeSize}
        linkColor={() => '#666'}
        linkWidth={() => linkWidth}
        width={width}
        height={height}
        d3Force="link"
        d3ForceConfig={{
          charge: { strength: -300 },
          link: { distance: 80, strength: 0.1 },
          center: { strength: 0.1 }
        }}
        onNodeClick={handleNodeClick}
        onBackgroundClick={onBackgroundClick}
        enableNodeDrag={true}
        enableZoomPanRotate={true}
        showNavInfo={true}
        backgroundColor="#1f2937"
        // Free rotation settings - no boundaries
        cameraPosition={{ x: 0, y: 0, z: 400 }}
        // Speed up camera controls and optimize WebGL
        onEngineStart={() => {
          if (ref && ref.current) {
            // Increase rotation speed based on movementSpeed parameter
            ref.current.controls().enableDamping = true;
            ref.current.controls().dampingFactor = 0.05;
            ref.current.controls().rotateSpeed = movementSpeed * 8; // Much faster rotation
            ref.current.controls().zoomSpeed = movementSpeed * 4.0; // Faster zoom
            ref.current.controls().panSpeed = movementSpeed * 4.0; // Faster pan
            
            // Default controls handle rotation properly
            ref.current.controls().enableRotate = true;
            
            // Set proper target
            ref.current.controls().target.set(0, 0, 0);
            ref.current.controls().update();
            
            // Optimize WebGL settings to reduce warnings
            const renderer = ref.current.scene()?.renderer;
            if (renderer) {
              renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
              renderer.antialias = true;
              renderer.powerPreference = "high-performance";
            }
          }
        }}
      />
    </div>
  );
});

export default ClickFocus3DWorking;
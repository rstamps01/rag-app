/**
 * Highlight 3D Graph Module - Working Version
 * 
 * 3D graph with animated path highlighting capabilities
 * Based on: https://github.com/vasturiano/3d-force-graph/blob/master/example/highlight/index.html
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import * as THREE from 'three';

const Highlight3DWorking = React.forwardRef(({ 
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
  const [highlightedNodes, setHighlightedNodes] = useState(new Set());
  const [highlightedLinks, setHighlightedLinks] = useState(new Set());
  
  const [animatedLinks, setAnimatedLinks] = useState(new Set()); // Separate set for animated links
  const [hoveredNode, setHoveredNode] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [connectionLevels, setConnectionLevels] = useState(1); // 1-5 levels of connections
  const [isDragging, setIsDragging] = useState(false); // Track drag state
  const fgRef = useRef();
  const animationRef = useRef();

  // Initialize all links as visible (in highlightedLinks) but without animation
  useEffect(() => {
    if (graphData.links && graphData.links.length > 0) {
      const allLinkIds = graphData.links.map(link => {
        // Handle both object and string source/target
        const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
        const targetId = typeof link.target === 'object' ? link.target.id : link.target;
        return `${sourceId}-${targetId}`;
      });
      console.log(`🔗 Highlight3D: Initializing ${allLinkIds.length} links as visible`);
      console.log(`🔗 Sample link IDs:`, allLinkIds.slice(0, 3));
      console.log(`🔗 Sample links:`, graphData.links.slice(0, 2));
      setHighlightedLinks(new Set(allLinkIds));
      // Only reset selection states, keep animation capability
      setSelectedNode(null);
      setHighlightedNodes(new Set());
      setAnimatedLinks(new Set()); // Clear animation on data refresh
      setHoveredNode(null);
      setIsDragging(false);
      
      // Force simulation will restart automatically when graphData changes
      // Add a small delay to ensure the graph is fully rendered
      setTimeout(() => {
        if (ref && ref.current) {
          ref.current.d3ReheatDecay && ref.current.d3ReheatDecay();
        }
      }, 100);
    }
  }, [graphData.links]);

  // Handle node hover with selective highlighting
  const handleNodeHover = useCallback((node) => {
    // Don't trigger hover effects while dragging
    if (isDragging) return;
    
    if (!node) {
      // Clear selection when hovering away
      setSelectedNode(null);
      setHighlightedNodes(new Set());
      setAnimatedLinks(new Set());
      setHoveredNode(null);
      return;
    }
    
    // Set new selected node
    setSelectedNode(node);
    setHoveredNode(node.id);
    
    // Find connected nodes up to specified levels
    const connectedNodes = new Set();
    const connectedLinks = new Set();
    
    // BFS to find nodes within connectionLevels
    const queue = [{ node, level: 0 }];
    const visited = new Set();
    connectedNodes.add(node.id);
    
    while (queue.length > 0) {
      const { node: currentNode, level } = queue.shift();
      
      if (level >= connectionLevels) continue;
      
      // Find all links connected to current node
      graphData.links.forEach(link => {
        if (link.source.id === currentNode.id || link.target.id === currentNode.id) {
          const linkId = `${link.source.id}-${link.target.id}`;
          if (!connectedLinks.has(linkId)) {
            connectedLinks.add(linkId);
            
            // Add the other node to connected nodes
            const otherNode = link.source.id === currentNode.id ? link.target : link.source;
            if (!visited.has(otherNode.id)) {
              visited.add(otherNode.id);
              connectedNodes.add(otherNode.id);
              queue.push({ node: otherNode, level: level + 1 });
            }
          }
        }
      });
    }
    
    setHighlightedNodes(connectedNodes);
    setAnimatedLinks(connectedLinks); // Animate all connections within levels
    // Keep highlightedLinks unchanged - all links stay visible
  }, [graphData, connectionLevels, isDragging]);

  // Handle node click (for external callbacks)
  const handleNodeClick = useCallback((node) => {
    if (onNodeClick) {
      onNodeClick(node);
    }
    // Don't change selection state on click - let hover handle it
  }, [onNodeClick]);

  // Handle node drag start
  const handleNodeDrag = useCallback((node) => {
    setIsDragging(true);
    // Don't clear hover effects immediately - let user see what they're dragging
  }, []);

  // Handle node drag end
  const handleNodeDragEnd = useCallback((node) => {
    setIsDragging(false);
    // Clear hover effects after drag ends
    setSelectedNode(null);
    setHighlightedNodes(new Set());
    setAnimatedLinks(new Set());
  }, []);

  // Handle link click - make links disappear
  const handleLinkClick = useCallback((link) => {
    setHighlightedLinks(prev => {
      const newSet = new Set(prev);
      const linkId = `${link.source.id}-${link.target.id}`;
      // Remove the link (make it disappear)
      newSet.delete(linkId);
      return newSet;
    });
  }, []);

  // Clear all highlights - deselect node and stop animation
  const clearHighlights = useCallback(() => {
    setHighlightedNodes(new Set());
    setSelectedNode(null);
    setAnimatedLinks(new Set()); // Stop animation
    setHoveredNode(null); // Clear hover state
    // Keep all links visible (highlightedLinks unchanged)
  }, []);

  // Create animated particles only for selected connections
  const createLinkParticles = useCallback(() => {
    if (!ref || !ref.current || !selectedNode) return;

    const scene = ref.current.scene();
    if (!scene) return;

    // Remove existing particles
    const existingParticles = scene.children.filter(child => child.userData.isLinkParticle);
    existingParticles.forEach(particle => scene.remove(particle));

    // Create particles only for animated links (selected connections)
    animatedLinks.forEach(linkId => {
      const link = graphData.links.find(l => `${l.source.id}-${l.target.id}` === linkId);
      if (!link) return;

      // Create small spheres instead of points
      const particleCount = 8; // Fewer particles for better performance
      const particleGroup = new THREE.Group();
      particleGroup.userData.isLinkParticle = true;
      particleGroup.userData.link = link;
      particleGroup.userData.time = 0;
      
      // Create individual sphere particles
      for (let i = 0; i < particleCount; i++) {
        const sphereGeometry = new THREE.SphereGeometry(0.5, 8, 6); // Small spheres
        const sphereMaterial = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.8
        });
        
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.set(0, 0, 0);
        sphere.userData.particleIndex = i;
        sphere.userData.totalParticles = particleCount;
        
        particleGroup.add(sphere);
      }
      
      scene.add(particleGroup);
    });
  }, [selectedNode, animatedLinks, graphData]);

  // Animation loop for particles
  useEffect(() => {
    const animate = () => {
      if (!ref || !ref.current) return;
      
      const scene = ref.current.scene();
      if (!scene) return;
      
      const particleGroups = scene.children.filter(child => child.userData.isLinkParticle);
      
      // If no animated links, remove all particles
      if (animatedLinks.size === 0) {
        particleGroups.forEach(particle => scene.remove(particle));
        return;
      }
      
      particleGroups.forEach(particleGroup => {
        const link = particleGroup.userData.link;
        const time = particleGroup.userData.time;
        
        if (!link || !link.source || !link.target) return;
        
        // Get link positions - try multiple ways to get node positions
        let sourcePos = { x: 0, y: 0, z: 0 };
        let targetPos = { x: 0, y: 0, z: 0 };
        
        // Try to get positions from __threeObj first
        if (link.source.__threeObj?.position) {
          sourcePos = link.source.__threeObj.position;
        } else if (link.source.x !== undefined) {
          sourcePos = { x: link.source.x, y: link.source.y, z: link.source.z };
        }
        
        if (link.target.__threeObj?.position) {
          targetPos = link.target.__threeObj.position;
        } else if (link.target.x !== undefined) {
          targetPos = { x: link.target.x, y: link.target.y, z: link.target.z };
        }
        
        // Animate sphere particles along the link
        particleGroup.children.forEach((sphere, i) => {
          const particleIndex = sphere.userData.particleIndex;
          const totalParticles = sphere.userData.totalParticles;
          
          // Slower movement - reduce speed by half
          const progress = ((time * 0.5 + particleIndex / totalParticles) % 1);
          const t = progress;
          
          // Smooth movement along the link
          sphere.position.x = sourcePos.x + (targetPos.x - sourcePos.x) * t;
          sphere.position.y = sourcePos.y + (targetPos.y - sourcePos.y) * t;
          sphere.position.z = sourcePos.z + (targetPos.z - sourcePos.z) * t;
        });
        
        particleGroup.userData.time += 0.01; // Slower time increment
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [animatedLinks]);

  // Update particles when highlights change
  useEffect(() => {
    // Add a small delay to ensure the graph is fully rendered
    const timer = setTimeout(() => {
      createLinkParticles();
    }, 100);
    
    return () => clearTimeout(timer);
  }, [createLinkParticles]);

  // Cleanup particles on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      if (ref && ref.current) {
        const scene = ref.current.scene();
        if (scene) {
          const particles = scene.children.filter(child => child.userData.isLinkParticle);
          particles.forEach(particle => scene.remove(particle));
        }
      }
    };
  }, []);

  // Node color - keep original colors, add glow for selected
  const getNodeColor = useCallback((node) => {
    // Keep original colors based on group
    const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336', '#00BCD4', '#E91E63', '#795548'];
    return colors[node.group % colors.length];
  }, []);

  // Node glow effect for selected node
  const getNodeGlow = useCallback((node) => {
    if (node.id === selectedNode?.id) {
      return 0.5; // Add glow effect
    }
    return 0; // No glow
  }, [selectedNode]);

  // Link color - visible by default, highlighted for animated connections
  const getLinkColor = useCallback((link) => {
    // Handle both object and string source/target
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    const linkId = `${sourceId}-${targetId}`;
    if (animatedLinks.has(linkId)) {
      return '#ffffff'; // White for animated connections
    }
    if (highlightedLinks.has(linkId)) {
      return '#666666'; // Gray for visible but not animated connections
    }
    return 'transparent'; // Completely transparent for hidden connections
  }, [highlightedLinks, animatedLinks]);

  // Link visibility - hide clicked links
  const getLinkVisibility = useCallback((link) => {
    // Handle both object and string source/target
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    const linkId = `${sourceId}-${targetId}`;
    const isVisible = highlightedLinks.has(linkId);
    // Debug: log occasionally to see what's happening
    if (Math.random() < 0.001) { // Log 0.1% of the time to avoid spam
      console.log(`🔗 Link visibility check: ${linkId} -> ${isVisible} (highlightedLinks size: ${highlightedLinks.size})`);
    }
    return isVisible;
  }, [highlightedLinks]);

  // Node size with highlighting
  const getNodeSize = useCallback((node) => {
    if (node.id === selectedNode?.id) {
      return nodeSize * 3; // Largest for selected node
    }
    if (highlightedNodes.has(node.id)) {
      return nodeSize * 2; // Medium for connected nodes
    }
    return nodeSize; // Use prop value for default size
  }, [highlightedNodes, selectedNode, nodeSize]);

  // Link width - visible by default, thicker for animated connections
  const getLinkWidth = useCallback((link) => {
    const linkId = `${link.source.id}-${link.target.id}`;
    if (animatedLinks.has(linkId)) {
      return linkWidth * 3; // Thicker for animated connections
    }
    if (highlightedLinks.has(linkId)) {
      return linkWidth; // Use prop value for visible connections
    }
    return linkWidth * 0.5; // Thin for hidden connections
  }, [highlightedLinks, animatedLinks, linkWidth]);

  return (
    <div className="relative">
      <style>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1f2937;
        }
        .slider::-moz-range-thumb {
          height: 16px;
          width: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1f2937;
        }
      `}</style>
      {/* Controls */}
      <div className="absolute top-2 left-2 z-10 bg-gray-800 bg-opacity-90 rounded-lg p-3">
        <div className="flex flex-col space-y-2 text-sm text-white">
          <div className="flex items-center space-x-2">
            <span className="font-semibold">Path Highlight Mode</span>
          </div>
          <div className="text-gray-300 text-xs">
            <div>Hover over a node to highlight connections</div>
            <div>Move mouse away to clear selection</div>
            <div className="text-gray-400">
              {selectedNode ? `Hovering: ${selectedNode.label || selectedNode.id}` : 'No node hovered'}
            </div>
            <div className="text-gray-400">
              {highlightedNodes.size} connected nodes, {animatedLinks.size} animated links
            </div>
          </div>
          
          {/* Connection Levels Control */}
          <div className="mt-3 pt-2 border-t border-gray-600">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-300 text-xs">Connection Levels:</span>
              <span className="text-gray-400 text-xs">{connectionLevels}</span>
            </div>
            <input
              type="range"
              min="1"
              max="5"
              value={connectionLevels}
              onChange={(e) => setConnectionLevels(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(connectionLevels - 1) * 25}%, #374151 ${(connectionLevels - 1) * 25}%, #374151 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>1</span>
              <span>2</span>
              <span>3</span>
              <span>4</span>
              <span>5</span>
            </div>
          </div>
        </div>
      </div>

        {/* Graph */}
        <ForceGraph3D
          ref={ref}
          key={`graph-${graphData.nodes?.length}-${graphData.links?.length}`}
          graphData={graphData}
        nodeLabel={showLabels ? "label" : ""}
        nodeColor={getNodeColor}
        nodeVal={getNodeSize}
        nodeGlow={getNodeGlow}
        linkColor={getLinkColor}
        linkWidth={getLinkWidth}
        linkDirectionalArrowLength={0}
        linkDirectionalArrowRelPos={1}
        width={width}
        height={height}
        d3Force="link"
        onNodeClick={handleNodeClick}
        onLinkClick={handleLinkClick}
        onBackgroundClick={onBackgroundClick}
        onNodeHover={(node) => {
          setHoveredNode(node ? node.id : null);
          handleNodeHover(node);
        }}
        onNodeDrag={handleNodeDrag}
        onNodeDragEnd={handleNodeDragEnd}
        onLinkHover={(link) => {
          // Optional: Add link hover effects
        }}
        enableNodeDrag={true}
        enableZoomPanRotate={true}
        cooldownTicks={100}
        showNavInfo={true}
        backgroundColor="#1f2937"
        // Free rotation settings - no boundaries
        cameraPosition={{ x: 0, y: 0, z: 400 }}
        // Force configuration
        d3ForceConfig={{
          charge: { strength: -300, distanceMax: 200 },
          link: { distance: 80, strength: 0.1 },
          center: { strength: 0.1 }
        }}
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
            
            // Restart force simulation to ensure nodes move
            setTimeout(() => {
              if (ref.current && ref.current.d3ReheatDecay) {
                ref.current.d3ReheatDecay();
              }
            }, 100);
            
            // Optimize WebGL settings to reduce warnings
            const renderer = ref.current.scene()?.renderer;
            if (renderer) {
              renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
              renderer.antialias = true;
              renderer.powerPreference = "high-performance";
              renderer.alpha = true;
              renderer.preserveDrawingBuffer = false;
              renderer.failIfMajorPerformanceCaveat = false;
            }
          }
        }}
      />
    </div>
  );
});

export default Highlight3DWorking;

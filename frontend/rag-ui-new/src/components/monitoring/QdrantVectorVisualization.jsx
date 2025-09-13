/**
 * Qdrant Vector Point Visualization Component
 * Interactive visualization of vector points from Qdrant database
 * Inspired by Qdrant's native visualization interface
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  RefreshCw,
  Eye,
  EyeOff,
  Maximize2,
  Settings,
  Database
} from 'lucide-react';

const QdrantVectorVisualization = ({ 
  collectionName = 'rag',
  onPointSelect,
  selectedPoint,
  vectorData = null,
  isConnected = false
}) => {
  const svgRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [filteredPoints, setFilteredPoints] = useState([]);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 800, height: 400 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [filters, setFilters] = useState({
    department: 'all',
    confidence: 0,
    showLabels: true
  });
  const [isLoading, setIsLoading] = useState(false);

  // Simulate vector data if not provided
  const generateMockVectorData = useCallback(() => {
    const mockPoints = [];
    const departments = ['Engineering', 'Marketing', 'Sales', 'Support', 'General'];
    
    for (let i = 0; i < 150; i++) {
      mockPoints.push({
        id: `point-${i}`,
        x: Math.random() * viewBox.width,
        y: Math.random() * viewBox.height,
        department: departments[Math.floor(Math.random() * departments.length)],
        confidence: Math.random() * 100,
        content: `Document chunk ${i + 1} - This is sample content for vector point ${i + 1}`,
        chunk_index: i,
        similarity: Math.random()
      });
    }
    
    return mockPoints;
  }, [viewBox]);

  // Load vector data
  useEffect(() => {
    if (vectorData) {
      setPoints(vectorData);
    } else {
      setPoints(generateMockVectorData());
    }
  }, [vectorData, generateMockVectorData]);

  // Apply filters
  useEffect(() => {
    let filtered = points;

    if (filters.department !== 'all') {
      filtered = filtered.filter(point => point.department === filters.department);
    }

    if (filters.confidence > 0) {
      filtered = filtered.filter(point => point.confidence >= filters.confidence);
    }

    setFilteredPoints(filtered);
  }, [points, filters]);

  // Handle point click
  const handlePointClick = useCallback((point) => {
    onPointSelect(point);
  }, [onPointSelect]);

  // Handle point hover
  const handlePointHover = useCallback((point) => {
    setHoveredPoint(point);
  }, []);

  // Handle zoom and pan
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.1, Math.min(5, prev * delta)));
  }, []);

  const handleMouseDown = useCallback((e) => {
    if (e.button === 0) { // Left mouse button
      const startX = e.clientX;
      const startY = e.clientY;
      const startPan = { ...pan };

      const handleMouseMove = (e) => {
        setPan({
          x: startPan.x + (e.clientX - startX),
          y: startPan.y + (e.clientY - startY)
        });
      };

      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
  }, [pan]);

  // Get point color based on department
  const getPointColor = useCallback((point) => {
    const colors = {
      'Engineering': '#00D4AA',
      'Marketing': '#0066CC',
      'Sales': '#FF6B35',
      'Support': '#8B5CF6',
      'General': '#6C757D'
    };
    return colors[point.department] || '#6C757D';
  }, []);

  // Refresh data
  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setPoints(generateMockVectorData());
      setIsLoading(false);
    }, 1000);
  }, [generateMockVectorData]);

  return (
    <div className="w-full h-full bg-vast-dark rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/5 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <Database className="w-6 h-6 text-vast-primary" />
          <div>
            <h3 className="text-lg font-semibold text-white">Qdrant Vector Points</h3>
            <p className="text-sm text-gray-400">Collection: {collectionName}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`} />
          <span className="text-sm text-gray-400">
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between p-4 bg-white/5 border-b border-white/10">
        <div className="flex items-center space-x-4">
          {/* Department Filter */}
          <select
            value={filters.department}
            onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
            className="px-3 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
          >
            <option value="all">All Departments</option>
            <option value="Engineering">Engineering</option>
            <option value="Marketing">Marketing</option>
            <option value="Sales">Sales</option>
            <option value="Support">Support</option>
            <option value="General">General</option>
          </select>

          {/* Confidence Filter */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-400">Min Confidence:</label>
            <input
              type="range"
              min="0"
              max="100"
              value={filters.confidence}
              onChange={(e) => setFilters(prev => ({ ...prev, confidence: parseInt(e.target.value) }))}
              className="w-20"
            />
            <span className="text-sm text-white w-8">{filters.confidence}%</span>
          </div>

          {/* Show Labels Toggle */}
          <button
            onClick={() => setFilters(prev => ({ ...prev, showLabels: !prev.showLabels }))}
            className={`p-2 rounded ${
              filters.showLabels ? 'bg-vast-primary text-white' : 'bg-white/10 text-gray-400'
            }`}
          >
            {filters.showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleRefresh}
            disabled={isLoading}
            className="p-2 bg-white/10 hover:bg-white/20 rounded text-gray-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          
          <button className="p-2 bg-white/10 hover:bg-white/20 rounded text-gray-400 hover:text-white transition-colors">
            <Download className="w-4 h-4" />
          </button>
          
          <button className="p-2 bg-white/10 hover:bg-white/20 rounded text-gray-400 hover:text-white transition-colors">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Vector Visualization */}
      <div className="flex-1 relative overflow-hidden">
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          viewBox={`${pan.x} ${pan.y} ${viewBox.width / zoom} ${viewBox.height / zoom}`}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          className="cursor-grab active:cursor-grabbing"
        >
          {/* Grid */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Vector Points */}
          {filteredPoints.map((point) => (
            <g key={point.id}>
              <circle
                cx={point.x}
                cy={point.y}
                r={selectedPoint?.id === point.id ? 8 : hoveredPoint?.id === point.id ? 6 : 4}
                fill={getPointColor(point)}
                stroke={selectedPoint?.id === point.id ? '#FF6B35' : 'rgba(255,255,255,0.3)'}
                strokeWidth={selectedPoint?.id === point.id ? 2 : 1}
                opacity={selectedPoint?.id === point.id ? 1 : 0.8}
                onClick={() => handlePointClick(point)}
                onMouseEnter={() => handlePointHover(point)}
                onMouseLeave={() => setHoveredPoint(null)}
                className="cursor-pointer transition-all duration-200 hover:opacity-100"
              />
              
              {/* Point Label */}
              {filters.showLabels && (selectedPoint?.id === point.id || hoveredPoint?.id === point.id) && (
                <text
                  x={point.x}
                  y={point.y - 12}
                  textAnchor="middle"
                  fill="white"
                  fontSize="10"
                  className="pointer-events-none"
                >
                  {point.department}
                </text>
              )}
            </g>
          ))}

          {/* Legend */}
          <g transform="translate(20, 20)">
            <rect x="0" y="0" width="180" height="120" fill="rgba(0,0,0,0.8)" rx="8" />
            <text x="10" y="20" fill="white" fontSize="12" fontWeight="bold">Departments</text>
            
            {['Engineering', 'Marketing', 'Sales', 'Support', 'General'].map((dept, index) => (
              <g key={dept} transform={`translate(10, ${30 + index * 16})`}>
                <circle cx="6" cy="6" r="4" fill={getPointColor({ department: dept })} />
                <text x="16" y="10" fill="white" fontSize="10">{dept}</text>
              </g>
            ))}
          </g>
        </svg>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="flex items-center space-x-2 text-white">
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Loading vector points...</span>
            </div>
          </div>
        )}
      </div>

      {/* Point Details Panel */}
      {selectedPoint && (
        <div className="p-4 bg-white/5 border-t border-white/10">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-gray-400">ID</div>
              <div className="text-white font-mono">{selectedPoint.id}</div>
            </div>
            <div>
              <div className="text-gray-400">Department</div>
              <div className="text-white">{selectedPoint.department}</div>
            </div>
            <div>
              <div className="text-gray-400">Confidence</div>
              <div className="text-white">{selectedPoint.confidence.toFixed(1)}%</div>
            </div>
            <div>
              <div className="text-gray-400">Chunk Index</div>
              <div className="text-white">{selectedPoint.chunk_index}</div>
            </div>
          </div>
          
          <div className="mt-3">
            <div className="text-gray-400 text-sm">Content Preview</div>
            <div className="text-white text-xs bg-white/5 p-2 rounded mt-1 max-h-20 overflow-y-auto">
              {selectedPoint.content}
            </div>
          </div>
        </div>
      )}

      {/* Stats Footer */}
      <div className="flex items-center justify-between p-3 bg-white/5 border-t border-white/10 text-xs text-gray-400">
        <div>
          Showing {filteredPoints.length} of {points.length} points
        </div>
        <div className="flex items-center space-x-4">
          <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
          <span>Position: ({pan.x.toFixed(0)}, {pan.y.toFixed(0)})</span>
        </div>
      </div>
    </div>
  );
};

export default QdrantVectorVisualization;

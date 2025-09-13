/**
 * Qdrant Real-time Vector Visualization Component
 * Enhanced version with live API integration for real-time vector point access
 * Features streaming updates, live clustering, and performance metrics
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
  Database,
  Activity,
  TrendingUp,
  Zap,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

import qdrantService from '../../services/qdrantService';

const QdrantRealtimeVisualization = ({ 
  collectionName = 'rag',
  onPointSelect,
  selectedPoint,
  isConnected = false,
  autoRefresh = true,
  refreshInterval = 5000
}) => {
  const svgRef = useRef(null);
  const [points, setPoints] = useState([]);
  const [clusters, setClusters] = useState([]);
  const [filteredPoints, setFilteredPoints] = useState([]);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [viewBox, setViewBox] = useState({ x: 0, y: 0, width: 800, height: 400 });
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [filters, setFilters] = useState({
    department: 'all',
    confidence: 0,
    showLabels: true,
    showClusters: true
  });
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [metrics, setMetrics] = useState({
    totalVectors: 0,
    indexedVectors: 0,
    diskUsage: 0,
    memoryUsage: 0,
    status: 'unknown'
  });
  const [streamingStats, setStreamingStats] = useState({
    updatesReceived: 0,
    lastUpdate: null,
    errors: 0
  });

  const stopStreamingRef = useRef(null);

  // Initialize connection and start streaming
  useEffect(() => {
    const initializeConnection = async () => {
      try {
        setIsLoading(true);
        
        // Health check
        const health = await qdrantService.healthCheck();
        setConnectionStatus(health.status);
        
        if (health.status === 'healthy') {
          // Get initial data
          await loadInitialData();
          
          // Start real-time streaming if auto-refresh is enabled
          if (autoRefresh) {
            startStreaming();
          }
        }
      } catch (error) {
        console.error('Failed to initialize connection:', error);
        setConnectionStatus('error');
      } finally {
        setIsLoading(false);
      }
    };

    initializeConnection();

    return () => {
      if (stopStreamingRef.current) {
        stopStreamingRef.current();
      }
    };
  }, [collectionName, autoRefresh]);

  // Load initial vector data and metrics
  const loadInitialData = useCallback(async () => {
    try {
      const [vectorData, clusterData, metricsData] = await Promise.all([
        qdrantService.scrollVectors(collectionName, { limit: 500 }),
        qdrantService.getClusterInfo(collectionName),
        qdrantService.getQueryMetrics(collectionName)
      ]);

      setPoints(vectorData.points);
      setClusters(clusterData.clusters);
      setMetrics(metricsData);
      
      // Transform points for visualization
      const transformedPoints = transformPointsForVisualization(vectorData.points);
      setPoints(transformedPoints);
      
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }, [collectionName]);

  // Transform Qdrant points for visualization
  const transformPointsForVisualization = useCallback((rawPoints) => {
    return rawPoints.map((point, index) => {
      // Use payload data for positioning and metadata
      const payload = point.payload || {};
      
      return {
        id: point.id,
        x: (index % 10) * 80 + Math.random() * 40, // Grid-like distribution with randomness
        y: Math.floor(index / 10) * 40 + Math.random() * 30,
        department: payload.department || 'General',
        confidence: payload.confidence || Math.random() * 100,
        content: payload.content || `Vector point ${point.id}`,
        chunk_index: payload.chunk_index || index,
        similarity: payload.similarity || Math.random(),
        payload: payload,
        vector: point.vector
      };
    });
  }, []);

  // Start real-time streaming
  const startStreaming = useCallback(() => {
    const stopStreaming = qdrantService.streamVectorUpdates(
      collectionName,
      (update) => {
        switch (update.type) {
          case 'vector_update':
            const newPoints = transformPointsForVisualization(update.points);
            setPoints(prevPoints => {
              // Merge new points with existing ones, avoiding duplicates
              const existingIds = new Set(prevPoints.map(p => p.id));
              const uniqueNewPoints = newPoints.filter(p => !existingIds.has(p.id));
              return [...prevPoints, ...uniqueNewPoints].slice(-1000); // Keep last 1000 points
            });
            setStreamingStats(prev => ({
              ...prev,
              updatesReceived: prev.updatesReceived + 1,
              lastUpdate: update.timestamp
            }));
            break;
            
          case 'stats_update':
            setMetrics(prev => ({
              ...prev,
              ...update.stats.result
            }));
            break;
            
          case 'error':
            console.error('Streaming error:', update.error);
            setStreamingStats(prev => ({
              ...prev,
              errors: prev.errors + 1
            }));
            break;
        }
      },
      { interval: refreshInterval }
    );
    
    stopStreamingRef.current = stopStreaming;
  }, [collectionName, refreshInterval, transformPointsForVisualization]);

  // Apply filters to points
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

  // Handle point interactions
  const handlePointClick = useCallback((point) => {
    onPointSelect(point);
  }, [onPointSelect]);

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
    if (e.button === 0) {
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

  // Manual refresh
  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    try {
      await loadInitialData();
      setStreamingStats(prev => ({
        ...prev,
        updatesReceived: 0,
        errors: 0,
        lastUpdate: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setIsLoading(false);
    }
  }, [loadInitialData]);

  // Get point color based on department
  const getPointColor = useCallback((point) => {
    return qdrantService.getDepartmentColor(point.department);
  }, []);

  // Format bytes for display
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="w-full h-full bg-vast-dark rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white/5 border-b border-white/10">
        <div className="flex items-center space-x-3">
          <Database className="w-6 h-6 text-vast-primary" />
          <div>
            <h3 className="text-lg font-semibold text-white">Qdrant Real-time Vectors</h3>
            <p className="text-sm text-gray-400">Collection: {collectionName}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* Connection Status */}
          <div className="flex items-center space-x-2">
            {connectionStatus === 'healthy' ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-500" />
            )}
            <span className="text-sm text-gray-400 capitalize">{connectionStatus}</span>
          </div>

          {/* Live Stats */}
          <div className="flex items-center space-x-4 text-xs text-gray-400">
            <div className="flex items-center space-x-1">
              <Activity className="w-3 h-3" />
              <span>{streamingStats.updatesReceived} updates</span>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-3 h-3" />
              <span>{metrics.totalVectors} vectors</span>
            </div>
          </div>
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

          {/* View Options */}
          <button
            onClick={() => setFilters(prev => ({ ...prev, showLabels: !prev.showLabels }))}
            className={`p-2 rounded transition-colors ${
              filters.showLabels ? 'bg-vast-primary text-white' : 'bg-white/10 text-gray-400'
            }`}
          >
            {filters.showLabels ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
          </button>

          <button
            onClick={() => setFilters(prev => ({ ...prev, showClusters: !prev.showClusters }))}
            className={`p-2 rounded transition-colors ${
              filters.showClusters ? 'bg-vast-secondary text-white' : 'bg-white/10 text-gray-400'
            }`}
          >
            <Database className="w-4 h-4" />
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

          {/* Clusters */}
          {filters.showClusters && clusters.map((cluster, index) => (
            <g key={cluster.id}>
              <circle
                cx={cluster.center.x}
                cy={cluster.center.y}
                r="30"
                fill={cluster.color}
                opacity="0.1"
                stroke={cluster.color}
                strokeWidth="1"
              />
              <text
                x={cluster.center.x}
                y={cluster.center.y}
                textAnchor="middle"
                fill={cluster.color}
                fontSize="12"
                fontWeight="bold"
              >
                {cluster.name}
              </text>
            </g>
          ))}

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
            <rect x="0" y="0" width="180" height="140" fill="rgba(0,0,0,0.8)" rx="8" />
            <text x="10" y="20" fill="white" fontSize="12" fontWeight="bold">Departments</text>
            
            {['Engineering', 'Marketing', 'Sales', 'Support', 'General'].map((dept, index) => (
              <g key={dept} transform={`translate(10, ${30 + index * 20})`}>
                <circle cx="6" cy="6" r="4" fill={qdrantService.getDepartmentColor(dept)} />
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

      {/* Metrics Panel */}
      <div className="p-4 bg-white/5 border-t border-white/10">
        <div className="grid grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-gray-400">Total Vectors</div>
            <div className="text-white font-bold">{metrics.totalVectors.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Indexed</div>
            <div className="text-vast-primary font-bold">{metrics.indexedVectors.toLocaleString()}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Disk Usage</div>
            <div className="text-vast-secondary font-bold">{formatBytes(metrics.diskUsage)}</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400">Memory Usage</div>
            <div className="text-vast-accent font-bold">{formatBytes(metrics.memoryUsage)}</div>
          </div>
        </div>
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
          <span>Updates: {streamingStats.updatesReceived}</span>
          <span>Errors: {streamingStats.errors}</span>
          <span>Zoom: {(zoom * 100).toFixed(0)}%</span>
          <span>Position: ({pan.x.toFixed(0)}, {pan.y.toFixed(0)})</span>
        </div>
      </div>
    </div>
  );
};

export default QdrantRealtimeVisualization;

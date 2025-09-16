import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import api from '../../lib/api';

/**
 * Qdrant Vector Point Visualization Component
 * 
 * This component provides interactive visualization of vector points
 * from the Qdrant vector database with real-time updates and
 * VAST Data branding.
 */
const QdrantVectorVisualization = ({ 
  collectionName = 'default',
  onPointSelect = null,
  showControls = true,
  autoRefresh = true,
  refreshInterval = 5000
}) => {
  const [vectorPoints, setVectorPoints] = useState([]);
  const [selectedPoint, setSelectedPoint] = useState(null);
  const [collectionInfo, setCollectionInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState('2d'); // '2d', '3d', 'list'
  const [filter, setFilter] = useState('');
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  
  // Fetch vector points from Qdrant
  const fetchVectorPoints = useCallback(async () => {
    if (!collectionName) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.get(`/api/vector/points/${collectionName}`);
      const data = response.data;
      
      setVectorPoints(data.points || []);
      setCollectionInfo(data.collection_info || null);
      
      if (data.points && data.points.length > 0) {
        // Normalize coordinates for visualization
        const normalizedPoints = data.points.map(point => ({
          ...point,
          x: Math.random(), // Placeholder - replace with actual coordinate extraction
          y: Math.random(), // Placeholder - replace with actual coordinate extraction
          selected: false
        }));
        setVectorPoints(normalizedPoints);
      }
    } catch (err) {
      console.error('Failed to fetch vector points:', err);
      setError(err.message || 'Failed to fetch vector data');
    } finally {
      setIsLoading(false);
    }
  }, [collectionName]);
  
  // Auto-refresh effect
  useEffect(() => {
    if (autoRefresh) {
      fetchVectorPoints();
      const interval = setInterval(fetchVectorPoints, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchVectorPoints, autoRefresh, refreshInterval]);
  
  // Handle point selection
  const handlePointClick = useCallback((point) => {
    setSelectedPoint(point);
    if (onPointSelect) {
      onPointSelect(point);
    }
  }, [onPointSelect]);
  
  // Filter points based on search
  const filteredPoints = useMemo(() => {
    if (!filter) return vectorPoints;
    
    return vectorPoints.filter(point => 
      point.id.toLowerCase().includes(filter.toLowerCase()) ||
      (point.metadata && JSON.stringify(point.metadata).toLowerCase().includes(filter.toLowerCase()))
    );
  }, [vectorPoints, filter]);
  
  // 2D Visualization Component
  const Vector2DView = () => (
    <div className="vector-2d-container" style={{ width: '100%', height: '400px', position: 'relative' }}>
      <svg 
        width="100%" 
        height="100%" 
        viewBox="0 0 800 400"
        style={{ background: 'linear-gradient(135deg, #1a1a1a, #2c3e50)' }}
      >
        {/* Grid lines */}
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#00D4AA" strokeWidth="0.5" opacity="0.3"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
        
        {/* Vector points */}
        {filteredPoints.map((point, index) => (
          <g key={point.id || index}>
            <circle
              cx={point.x * 800}
              cy={point.y * 400}
              r={point.selected ? 8 : 4}
              fill={point.selected ? '#FF6B35' : '#00D4AA'}
              opacity={point.selected ? 1 : 0.7}
              onClick={() => handlePointClick(point)}
              className="vector-point"
              style={{
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                filter: point.selected ? 'drop-shadow(0 0 8px #FF6B35)' : 'drop-shadow(0 0 4px #00D4AA)'
              }}
            />
            
            {/* Point label for selected points */}
            {point.selected && (
              <text
                x={point.x * 800 + 12}
                y={point.y * 400 - 8}
                fill="#FF6B35"
                fontSize="12"
                fontWeight="bold"
                className="point-label"
              >
                {point.id}
              </text>
            )}
          </g>
        ))}
        
        {/* Connection lines for similar vectors */}
        {selectedPoint && (
          <g>
            {filteredPoints
              .filter(point => point.id !== selectedPoint.id)
              .slice(0, 5) // Show connections to top 5 similar points
              .map((point, index) => (
                <line
                  key={`connection-${index}`}
                  x1={selectedPoint.x * 800}
                  y1={selectedPoint.y * 400}
                  x2={point.x * 800}
                  y2={point.y * 400}
                  stroke="#00D4AA"
                  strokeWidth="1"
                  opacity="0.5"
                  strokeDasharray="2,2"
                />
              ))}
          </g>
        )}
      </svg>
      
      {/* Legend */}
      <div className="vector-legend" style={{
        position: 'absolute',
        top: '10px',
        left: '10px',
        background: 'rgba(26, 26, 26, 0.9)',
        color: 'white',
        padding: '8px 12px',
        borderRadius: '6px',
        fontSize: '12px',
        border: '1px solid #00D4AA'
      }}>
        <div>🔵 Vector Points: {filteredPoints.length}</div>
        <div>🟠 Selected: {selectedPoint ? selectedPoint.id : 'None'}</div>
      </div>
    </div>
  );
  
  // 3D Visualization Component (simplified 2.5D)
  const Vector3DView = () => (
    <div className="vector-3d-container" style={{ width: '100%', height: '400px', position: 'relative' }}>
      <div style={{
        width: '100%',
        height: '100%',
        background: 'linear-gradient(135deg, #1a1a1a, #2c3e50)',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '18px'
      }}>
        <div className="text-center">
          <div className="text-4xl mb-4">🎯</div>
          <div>3D Vector Visualization</div>
          <div className="text-sm text-gray-400 mt-2">Coming Soon</div>
        </div>
      </div>
    </div>
  );
  
  // List View Component
  const VectorListView = () => (
    <div className="vector-list-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
      <div className="space-y-2">
        {filteredPoints.map((point, index) => (
          <div
            key={point.id || index}
            className={`vector-list-item p-3 rounded-lg cursor-pointer transition-all ${
              point.selected 
                ? 'bg-orange-100 border-orange-300 border-2' 
                : 'bg-gray-100 hover:bg-gray-200 border border-gray-200'
            }`}
            onClick={() => handlePointClick(point)}
          >
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold text-sm">ID: {point.id}</div>
                <div className="text-xs text-gray-500 mt-1">
                  Coordinates: ({point.x?.toFixed(3)}, {point.y?.toFixed(3)})
                </div>
                {point.metadata && (
                  <div className="text-xs text-gray-600 mt-1">
                    Metadata: {JSON.stringify(point.metadata).substring(0, 50)}...
                  </div>
                )}
              </div>
              <div className={`w-3 h-3 rounded-full ${
                point.selected ? 'bg-orange-500' : 'bg-blue-500'
              }`} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
  
  // Render the appropriate view
  const renderView = () => {
    switch (viewMode) {
      case '3d':
        return <Vector3DView />;
      case 'list':
        return <VectorListView />;
      default:
        return <Vector2DView />;
    }
  };
  
  return (
    <div className="qdrant-vector-visualization">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              Vector Database Visualization
            </CardTitle>
            <div className="flex items-center gap-2">
              {isLoading && (
                <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
              )}
              <Button
                onClick={fetchVectorPoints}
                disabled={isLoading}
                size="sm"
                variant="outline"
              >
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Controls */}
          {showControls && (
            <div className="mb-4 space-y-4">
              {/* View Mode Selector */}
              <div className="flex gap-2">
                <Button
                  onClick={() => setViewMode('2d')}
                  variant={viewMode === '2d' ? 'default' : 'outline'}
                  size="sm"
                >
                  2D View
                </Button>
                <Button
                  onClick={() => setViewMode('3d')}
                  variant={viewMode === '3d' ? 'default' : 'outline'}
                  size="sm"
                >
                  3D View
                </Button>
                <Button
                  onClick={() => setViewMode('list')}
                  variant={viewMode === 'list' ? 'default' : 'outline'}
                  size="sm"
                >
                  List View
                </Button>
              </div>
              
              {/* Search Filter */}
              <div>
                <input
                  type="text"
                  placeholder="Search vectors..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}
          
          {/* Collection Info */}
          {collectionInfo && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">
                <strong>Collection:</strong> {collectionInfo.name} | 
                <strong> Points:</strong> {collectionInfo.points_count || filteredPoints.length} |
                <strong> Dimensions:</strong> {collectionInfo.config?.params?.vectors?.size || 'Unknown'}
              </div>
            </div>
          )}
          
          {/* Error State */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <div className="font-semibold">Error loading vector data:</div>
              <div className="text-sm">{error}</div>
            </div>
          )}
          
          {/* Main Visualization */}
          {renderView()}
          
          {/* Selected Point Details */}
          {selectedPoint && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-900 mb-2">Selected Vector Point</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>ID:</strong> {selectedPoint.id}
                </div>
                <div>
                  <strong>Coordinates:</strong> ({selectedPoint.x?.toFixed(3)}, {selectedPoint.y?.toFixed(3)})
                </div>
                {selectedPoint.metadata && (
                  <div className="col-span-2">
                    <strong>Metadata:</strong>
                    <pre className="mt-1 text-xs bg-white p-2 rounded border overflow-x-auto">
                      {JSON.stringify(selectedPoint.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default QdrantVectorVisualization;

/**
 * Simple Qdrant Graph Component for Testing
 * 
 * Minimal version to test the modular system
 */

import React, { useState, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { RefreshCw, Palette } from 'lucide-react';

const QdrantGraphSimple = ({ collectionName = 'rag', qdrantBaseUrl = 'http://localhost:6333', height = '500px', fullWidth = false }) => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [graphType, setGraphType] = useState('force-directed-2d');

  // Fetch graph data from Qdrant
  const fetchGraphData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('🔄 Fetching graph data from Qdrant...');
      
      const response = await fetch(`${qdrantBaseUrl}/collections/${collectionName}/points/scroll`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          limit: 50,
          with_payload: true,
          with_vector: false,
          filter: null
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const points = data.result.points || [];
      
      console.log(`📊 Fetched ${points.length} points from Qdrant`);

      // Process nodes
      const nodes = points.map((point, index) => ({
        id: point.id || `point_${index}`,
        label: point.payload?.filename || `Node ${index}`,
        group: Math.floor(index / 10),
        payload: point.payload || {},
        x: Math.random() * 800,
        y: Math.random() * 500
      }));

      // Create simple links
      const links = [];
      for (let i = 0; i < Math.min(nodes.length, 20); i++) {
        for (let j = i + 1; j < Math.min(nodes.length, 20); j++) {
          if (Math.random() < 0.1) {
            links.push({
              source: nodes[i].id,
              target: nodes[j].id,
              value: 1,
              distance: 80
            });
          }
        }
      }

      setGraphData({ nodes, links });
      console.log(`✅ Graph loaded with ${nodes.length} nodes and ${links.length} links`);
    } catch (err) {
      console.error('❌ Error fetching graph data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchGraphData();
  }, [collectionName]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-400" />
          <p className="text-gray-400">Loading graph data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-400 mb-2">⚠️</div>
          <p className="text-red-400 mb-2">Error loading graph data</p>
          <p className="text-gray-400 text-sm">{error}</p>
          <button
            onClick={fetchGraphData}
            className="mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-sm"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (graphData.nodes.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-gray-400 mb-2">📊</div>
          <p className="text-gray-400">No data available for visualization</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${fullWidth ? 'h-full w-full' : 'bg-gray-800 rounded-lg'} overflow-hidden relative`}>
      {/* Header */}
      <div className="bg-gray-700 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <h3 className="text-lg font-semibold text-white">
            Collection Graph: {collectionName}
          </h3>
          <span className="text-sm text-gray-400">
            {graphData.nodes.length} nodes, {graphData.links.length} links
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={fetchGraphData}
            className="p-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Graph */}
      <div style={{ height: height, backgroundColor: '#1f2937' }}>
        <ForceGraph2D
          graphData={graphData}
          nodeLabel="label"
          nodeColor={() => '#4CAF50'}
          nodeVal={() => 3}
          linkColor={() => '#666'}
          linkWidth={() => 1}
          width={fullWidth ? window.innerWidth : 800}
          height={fullWidth ? window.innerHeight - 100 : 500}
          d3Force="link"
          d3ForceConfig={{
            charge: { strength: -300 },
            link: { distance: 80, strength: 0.1 },
            center: { strength: 0.1 }
          }}
        />
      </div>
    </div>
  );
};

export default QdrantGraphSimple;

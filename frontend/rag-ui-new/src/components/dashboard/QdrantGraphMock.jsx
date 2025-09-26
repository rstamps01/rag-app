/**
 * Mock Qdrant Graph Component
 * 
 * Uses mock data to test if the issue is with the API or component
 */

import React, { useState, useEffect } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { RefreshCw } from 'lucide-react';

const QdrantGraphMock = ({ collectionName = 'rag', qdrantBaseUrl = 'http://localhost:6333', height = '500px', fullWidth = false }) => {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Generate mock data
  const generateMockData = () => {
    console.log('🔄 Generating mock data...');
    
    const nodes = [];
    const links = [];
    
    // Generate 20 mock nodes
    for (let i = 0; i < 20; i++) {
      nodes.push({
        id: `node_${i}`,
        label: `Document ${i}`,
        group: Math.floor(i / 5),
        x: Math.random() * 800,
        y: Math.random() * 500,
        payload: {
          filename: `document_${i}.pdf`,
          department: ['Engineering', 'Marketing', 'Sales', 'HR'][Math.floor(i / 5)],
          file_type: 'pdf'
        }
      });
    }
    
    // Generate some random links
    for (let i = 0; i < 15; i++) {
      const source = Math.floor(Math.random() * nodes.length);
      const target = Math.floor(Math.random() * nodes.length);
      if (source !== target) {
        links.push({
          source: nodes[source].id,
          target: nodes[target].id,
          value: 1,
          distance: 80
        });
      }
    }
    
    console.log(`✅ Generated mock data: ${nodes.length} nodes, ${links.length} links`);
    return { nodes, links };
  };

  // Load mock data
  useEffect(() => {
    console.log('🔄 QdrantGraphMock: Component mounted, generating mock data...');
    setIsLoading(true);
    
    // Simulate loading delay
    setTimeout(() => {
      const data = generateMockData();
      setGraphData(data);
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-400" />
          <p className="text-gray-400">Loading mock data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="text-red-400 mb-2">⚠️</div>
          <p className="text-red-400 mb-2">Error: {error}</p>
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
            Mock Graph: {collectionName}
          </h3>
          <span className="text-sm text-gray-400">
            {graphData.nodes.length} nodes, {graphData.links.length} links
          </span>
          <span className="text-xs text-yellow-300 bg-yellow-900 px-2 py-1 rounded">
            MOCK DATA
          </span>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setIsLoading(true);
              setTimeout(() => {
                const data = generateMockData();
                setGraphData(data);
                setIsLoading(false);
              }, 500);
            }}
            className="p-2 bg-gray-600 hover:bg-gray-500 rounded transition-colors"
            title="Refresh Mock Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Graph */}
      <div style={{ height: height, backgroundColor: '#1f2937' }}>
        <ForceGraph2D
          graphData={graphData}
          nodeLabel="label"
          nodeColor={(node) => {
            const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'];
            return colors[node.group % colors.length];
          }}
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
          onNodeClick={(node) => console.log('Node clicked:', node)}
          onBackgroundClick={() => console.log('Background clicked')}
        />
      </div>
    </div>
  );
};

export default QdrantGraphMock;

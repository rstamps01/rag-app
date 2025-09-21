import React from 'react';
import { ReactFlow, MiniMap, Controls, Background } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const SimpleRAGPipeline = () => {
  const initialNodes = [
    {
      id: '1',
      type: 'input',
      data: { label: 'Query Input' },
      position: { x: 100, y: 100 },
      style: { 
        background: '#00D4AA', 
        color: 'white', 
        border: '2px solid #00D4AA',
        borderRadius: '8px',
        fontWeight: 'bold'
      },
    },
    {
      id: '2',
      data: { label: 'Vector Search' },
      position: { x: 300, y: 100 },
      style: { 
        background: '#0066CC', 
        color: 'white', 
        border: '2px solid #0066CC',
        borderRadius: '8px',
        fontWeight: 'bold'
      },
    },
    {
      id: '3',
      data: { label: 'LLM Processing' },
      position: { x: 500, y: 100 },
      style: { 
        background: '#FF6B35', 
        color: 'white', 
        border: '2px solid #FF6B35',
        borderRadius: '8px',
        fontWeight: 'bold'
      },
    },
    {
      id: '4',
      type: 'output',
      data: { label: 'Response' },
      position: { x: 700, y: 100 },
      style: { 
        background: '#6C5CE7', 
        color: 'white', 
        border: '2px solid #6C5CE7',
        borderRadius: '8px',
        fontWeight: 'bold'
      },
    },
  ];

  const initialEdges = [
    { id: 'e1-2', source: '1', target: '2', animated: true, style: { stroke: '#00D4AA', strokeWidth: 3 } },
    { id: 'e2-3', source: '2', target: '3', animated: true, style: { stroke: '#0066CC', strokeWidth: 3 } },
    { id: 'e3-4', source: '3', target: '4', animated: true, style: { stroke: '#FF6B35', strokeWidth: 3 } },
  ];

  return (
    <div style={{ width: '100%', height: '100%', background: '#1A1A1A' }}>
      <ReactFlow nodes={initialNodes} edges={initialEdges} fitView>
        <MiniMap 
          style={{
            background: '#2C3E50',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px'
          }}
        />
        <Controls 
          style={{
            background: '#2C3E50',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '8px'
          }}
        />
        <Background 
          variant="dots" 
          gap={20} 
          size={1} 
          color="#2C3E50"
          className="opacity-30"
        />
      </ReactFlow>
    </div>
  );
};

export default SimpleRAGPipeline;

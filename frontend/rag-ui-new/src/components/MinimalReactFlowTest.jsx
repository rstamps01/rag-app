import React from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
} from 'reactflow';
import 'reactflow/dist/style.css';

const MinimalReactFlowTest = () => {

  const initialNodes = [
    {
      id: '1',
      type: 'input',
      data: { label: 'Input Node' },
      position: { x: 200, y: 100 },
    },
    {
      id: '2',
      data: { label: 'Default Node' },
      position: { x: 400, y: 100 },
      style: { 
        background: '#3b82f6', 
        color: 'white', 
        border: '2px solid #1d4ed8',
        borderRadius: '8px',
        fontWeight: 'bold'
      },
    },
    {
      id: '3',
      type: 'output',
      data: { label: 'Output Node' },
      position: { x: 600, y: 100 },
    },
  ];

  const initialEdges = [
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e2-3', source: '2', target: '3' },
  ];

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={initialNodes}
        edges={initialEdges}
        fitView
      >
        <Controls />
        <MiniMap />
        <Background variant="dots" gap={12} size={1} />
      </ReactFlow>
    </div>
  );
};

export default MinimalReactFlowTest;

/*
  Version: v1.0.0.0

  Location: frontend/rag-ui-new/src/components/

  PipelineGraph.jsx

  This component uses the React Flow library to render an interactive
  node‑based graph of your RAG pipeline.  Each stage in the pipeline
  becomes a draggable node connected by edges to represent data flow.
  Node colours reflect the stage status (idle, processing, error), and
  clicking on a node invokes a callback so that you can display
  additional metrics in a side panel.

  Usage:

    import PipelineGraph from './PipelineGraph';

    const stages = [
      { id: 'upload', label: 'Upload', status: 'idle' },
      { id: 'chunk', label: 'Chunk', status: 'processing' },
      { id: 'embed', label: 'Embed', status: 'idle' },
      { id: 'upsert', label: 'Upsert to Qdrant', status: 'idle' },
    ];
    const edges = [
      { id: 'e1-2', source: 'upload', target: 'chunk' },
      { id: 'e2-3', source: 'chunk', target: 'embed' },
      { id: 'e3-4', source: 'embed', target: 'upsert' },
    ];

    <PipelineGraph stages={stages} edges={edges} onNodeClick={(stage) => {
      console.log('Clicked stage', stage);
    }} />

  Note: This component requires ``reactflow`` to be installed.  You can
  add it to your project with ``npm install reactflow`` or ``yarn
  add reactflow``.  The default styling is imported from the library.
*/

import React, { useMemo, useCallback } from 'react';
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  Handle,
  Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Mapping of stage status to node colour
const STATUS_COLOURS = {
  idle: '#6c7ae0',      // blue
  processing: '#f8b400', // yellow
  error: '#e05858',     // red
  complete: '#4caf50',  // green
  default: '#9e9e9e',   // grey
};

// Custom node component to display stage status and label
const StageNode = ({ data }) => {
  const colour = STATUS_COLOURS[data.status] || STATUS_COLOURS.default;
  return (
    <div
      style={{
        padding: 10,
        borderRadius: 8,
        backgroundColor: colour,
        color: '#fff',
        minWidth: 120,
        textAlign: 'center',
        boxShadow: '0 2px 4px rgba(0,0,0,0.15)',
      }}
    >
      <Handle type="target" position={Position.Left} style={{ borderRadius: 0 }} />
      <div style={{ fontWeight: 600 }}>{data.label}</div>
      <div style={{ fontSize: '0.75rem', marginTop: 4 }}>{data.status}</div>
      <Handle type="source" position={Position.Right} style={{ borderRadius: 0 }} />
    </div>
  );
};

const nodeTypes = { stage: StageNode };

export default function PipelineGraph({ stages, edges, onNodeClick }) {
  // Convert stages to nodes expected by React Flow
  const nodes = useMemo(() => {
    return stages
      .filter(stage => stage && stage.id && stage.label) // Filter out invalid stages
      .map((stage, idx) => ({
        id: stage.id,
        type: 'stage',
        position: { x: idx * 200, y: 0 },
        data: { 
          label: stage.label || stage.id,
          status: stage.status || 'idle',
          ...stage 
        },
      }));
  }, [stages]);

  // Convert plain edges to React Flow edges
  const rfEdges = useMemo(() => {
    return edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      animated: true,
      style: { stroke: '#888' },
    }));
  }, [edges]);

  // Handle node click events
  const onNodeClickHandler = useCallback(
    (event, node) => {
      if (typeof onNodeClick === 'function') {
        onNodeClick(node.data);
      }
    },
    [onNodeClick]
  );

  return (
    <div style={{ width: '100%', height: '100%' }}>
      <ReactFlow
        nodes={nodes}
        edges={rfEdges}
        nodeTypes={nodeTypes}
        onNodeClick={onNodeClickHandler}
        fitView
        deleteKeyCode={null} // Disable delete key
        multiSelectionKeyCode={null} // Disable multi-selection
        nodesDraggable={false} // Disable dragging
        nodesConnectable={false} // Disable connections
        elementsSelectable={false} // Disable selection
        connectionMode={null} // Disable connection mode
        onConnect={null} // Disable connect handler
        onConnectStart={null} // Disable connect start
        onConnectEnd={null} // Disable connect end
        onSelectionChange={null} // Disable selection change
        onNodesChange={null} // Disable nodes change
        onEdgesChange={null} // Disable edges change
      >
        <MiniMap
          nodeColor={(node) => STATUS_COLOURS[node.data.status] || STATUS_COLOURS.default}
        />
        <Controls />
        <Background gap={16} size={1} />
      </ReactFlow>
    </div>
  );
}
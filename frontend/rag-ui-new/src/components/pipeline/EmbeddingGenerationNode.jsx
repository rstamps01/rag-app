import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Brain, Zap, Clock, CheckCircle } from 'lucide-react';

const EmbeddingGenerationNode = ({ data, isConnectable }) => {
  const { 
    status = 'idle', 
    embeddingsGenerated = 0, 
    modelName = 'text-embedding-ada-002',
    embeddingDimension = 1536,
    processingTime = 0,
    tokensProcessed = 0,
    label = 'Embedding Generation'
  } = data;

  const getStatusColor = () => {
    switch (status) {
      case 'active': return '#3B82F6';
      case 'processing': return '#FFB800';
      case 'success': return '#3B82F6';
      case 'error': return '#FF4444';
      default: return '#4A5568';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'active': return 'Active';
      case 'processing': return 'Processing';
      case 'success': return 'Complete';
      case 'error': return 'Error';
      default: return 'Idle';
    }
  };

  return (
    <div className="vast-node rounded-xl shadow-lg border-2 transition-all duration-200 min-w-[280px] max-w-[320px] overflow-hidden" style={{
      background: 'var(--bg-card)',
      borderColor: 'var(--vast-neutral)'
    }}>
      {/* Multiple connection points on all sides */}
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        isConnectable={isConnectable}
        style={{ 
          background: '#3B82F6', 
          width: '16px', 
          height: '16px',
          border: '3px solid var(--bg-card)',
          boxShadow: '0 0 8px var(--glow-primary)'
        }}
      />
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        isConnectable={isConnectable}
        style={{ 
          background: '#3B82F6', 
          width: '16px', 
          height: '16px',
          border: '3px solid var(--bg-card)',
          boxShadow: '0 0 8px var(--glow-primary)'
        }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        isConnectable={isConnectable}
        style={{ 
          background: '#3B82F6', 
          width: '16px', 
          height: '16px',
          border: '3px solid var(--bg-card)',
          boxShadow: '0 0 8px var(--glow-primary)'
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        isConnectable={isConnectable}
        style={{ 
          background: '#3B82F6', 
          width: '16px', 
          height: '16px',
          border: '3px solid var(--bg-card)',
          boxShadow: '0 0 8px var(--glow-primary)'
        }}
      />
      
      {/* Header */}
      <div className="px-4 py-3" style={{
        background: 'linear-gradient(90deg, #1e3a8a, #1e40af)'
      }}>
        <div className="flex items-center space-x-3">
          <Brain className="w-5 h-5 text-white" />
          <div>
            <h3 className="text-white font-semibold text-base">{label}</h3>
            <div className="flex items-center space-x-2">
              <div 
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: getStatusColor() }}
              ></div>
              <span className="text-blue-100 text-sm font-medium">{getStatusText()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg p-3 text-center" style={{
            background: 'var(--bg-secondary)'
          }}>
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Embeddings*</div>
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{embeddingsGenerated.toLocaleString()}</div>
          </div>
          
          <div className="rounded-lg p-3 text-center" style={{
            background: 'var(--bg-secondary)'
          }}>
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Dimension</div>
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{embeddingDimension}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg p-3 text-center" style={{
            background: 'var(--bg-secondary)'
          }}>
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Tokens*</div>
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{tokensProcessed.toLocaleString()}</div>
          </div>
          
          <div className="rounded-lg p-3 text-center" style={{
            background: 'var(--bg-secondary)'
          }}>
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Process Time*</div>
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{(processingTime / 1000).toFixed(1)}s</div>
          </div>
        </div>

        <div className="rounded-lg p-3 text-center" style={{
          background: 'var(--bg-secondary)'
        }}>
          <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Model</div>
          <div className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{modelName}</div>
        </div>

        {status === 'processing' && (
          <div className="flex items-center space-x-2" style={{ color: '#FFB800' }}>
            <Clock className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Generating Embeddings...</span>
          </div>
        )}

        {status === 'success' && (
                  <div className="flex items-center space-x-2" style={{ color: '#3B82F6' }}>
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Embeddings Ready</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default EmbeddingGenerationNode;

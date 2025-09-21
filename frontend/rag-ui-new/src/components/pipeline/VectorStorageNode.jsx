import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Database, HardDrive, Clock, CheckCircle } from 'lucide-react';

const VectorStorageNode = ({ data, isConnectable }) => {
  const { 
    status = 'idle', 
    vectorsStored = 0, 
    storageUsed = 0,
    storageTotal = 100,
    indexingTime = 0,
    collectionName = 'documents',
    label = 'Vector Storage'
  } = data;

  const getStatusColor = () => {
    switch (status) {
      case 'active': return '#00FF88';
      case 'processing': return '#FFB800';
      case 'success': return '#00FF88';
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

  const storagePercentage = storageTotal > 0 ? (storageUsed / storageTotal) * 100 : 0;

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
          <Database className="w-5 h-5 text-white" />
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
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Vectors*</div>
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{vectorsStored.toLocaleString()}</div>
          </div>
          
          <div className="rounded-lg p-3 text-center" style={{
            background: 'var(--bg-secondary)'
          }}>
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Storage*</div>
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{storageUsed}GB</div>
          </div>
        </div>

        <div className="rounded-lg p-3" style={{
          background: 'var(--bg-secondary)'
        }}>
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>Storage Usage</span>
            <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{storagePercentage.toFixed(1)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${storagePercentage}%`,
                background: storagePercentage > 80 ? '#FF4444' : storagePercentage > 60 ? '#FFB800' : '#00FF88'
              }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg p-3 text-center" style={{
            background: 'var(--bg-secondary)'
          }}>
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Index Time*</div>
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{(indexingTime / 1000).toFixed(1)}s</div>
          </div>
          
          <div className="rounded-lg p-3 text-center" style={{
            background: 'var(--bg-secondary)'
          }}>
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Collection</div>
            <div className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>{collectionName}</div>
          </div>
        </div>

        {status === 'processing' && (
          <div className="flex items-center space-x-2" style={{ color: '#FFB800' }}>
            <Clock className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Indexing Vectors...</span>
          </div>
        )}

        {status === 'success' && (
          <div className="flex items-center space-x-2" style={{ color: '#00FF88' }}>
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Storage Complete</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VectorStorageNode;

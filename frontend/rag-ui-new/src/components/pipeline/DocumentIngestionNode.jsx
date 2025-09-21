import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { FileText, Upload, Clock, CheckCircle } from 'lucide-react';

const DocumentIngestionNode = ({ data, isConnectable }) => {
  const { 
    status = 'idle', 
    documentsProcessed = 0, 
    processingRate = 0, 
    queueSize = 0,
    supportedFormats = ['PDF', 'DOCX', 'TXT'],
    lastProcessed = '',
    label = 'Document Ingestion'
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

  return (
    <div className="vast-node rounded-xl shadow-lg border-2 transition-all duration-200 min-w-[280px] max-w-[320px] overflow-hidden" style={{
      background: 'var(--bg-card)',
      borderColor: 'var(--vast-neutral)'
    }}>
      {/* Multiple connection points on all sides */}
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
      
      {/* Header */}
      <div className="px-4 py-3" style={{
        background: 'linear-gradient(90deg, #1e3a8a, #1e40af)'
      }}>
        <div className="flex items-center space-x-3">
          <Upload className="w-5 h-5 text-white" />
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
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Processed*</div>
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{documentsProcessed}</div>
          </div>
          
          <div className="rounded-lg p-3 text-center" style={{
            background: 'var(--bg-secondary)'
          }}>
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Rate*</div>
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{processingRate}/min</div>
          </div>
        </div>

        <div className="rounded-lg p-3 text-center" style={{
          background: 'var(--bg-secondary)'
        }}>
          <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Queue Size*</div>
          <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{queueSize}</div>
        </div>

        {lastProcessed && (
          <div className="rounded-lg p-3 border" style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--vast-neutral)'
          }}>
            <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Last Processed*</div>
            <div className="text-sm truncate font-mono" style={{ color: 'var(--text-primary)' }}>{lastProcessed}</div>
          </div>
        )}

        <div className="flex flex-wrap gap-1">
          {supportedFormats.map((format) => (
            <span 
              key={format}
              className="px-2 py-1 text-xs rounded" 
              style={{ 
                background: 'var(--vast-primary)', 
                color: 'var(--bg-card)',
                opacity: 0.8
              }}
            >
              {format}
            </span>
          ))}
        </div>

        {status === 'processing' && (
          <div className="flex items-center space-x-2" style={{ color: '#FFB800' }}>
            <Clock className="w-4 h-4 animate-spin" />
            <span className="text-sm font-medium">Processing...</span>
          </div>
        )}

        {status === 'success' && (
          <div className="flex items-center space-x-2" style={{ color: '#00FF88' }}>
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Ingestion Complete</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentIngestionNode;

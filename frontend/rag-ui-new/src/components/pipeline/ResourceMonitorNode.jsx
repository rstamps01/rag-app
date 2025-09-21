import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Monitor, Cpu, MemoryStick, Thermometer, Clock, Activity } from 'lucide-react';

const ResourceMonitorNode = ({ data, isConnectable }) => {
  const { 
    status = 'idle', 
    cpuUsage = 0, 
    memoryUsage = 0, 
    gpuUsage = 0,
    temperature = 0,
    networkThroughput = 0,
    uptime = 0,
    label = 'Resource Monitor'
  } = data;

  const getStatusColor = () => {
    switch (status) {
      case 'active': return '#00FF88';
      case 'processing': return '#FFB800';
      case 'warning': return '#FFB800';
      case 'error': return '#FF4444';
      default: return '#4A5568';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'active': return 'Active';
      case 'processing': return 'Monitoring';
      case 'warning': return 'Warning';
      case 'error': return 'Error';
      default: return 'Idle';
    }
  };

  const getUsageColor = (usage) => {
    if (usage > 80) return '#FF4444';
    if (usage > 60) return '#FFB800';
    return '#00FF88';
  };

  return (
    <div className="vast-node rounded-xl shadow-lg border-2 transition-all duration-200 min-w-[280px] max-w-[320px] overflow-hidden" style={{
      background: 'var(--bg-card)',
      borderColor: 'var(--vast-neutral)'
    }}>
      {/* Multiple connection points on all sides */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        isConnectable={isConnectable}
        style={{ 
          background: '#4A5568', 
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
          background: '#4A5568', 
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
          background: '#4A5568', 
          width: '16px', 
          height: '16px',
          border: '3px solid var(--bg-card)',
          boxShadow: '0 0 8px var(--glow-primary)'
        }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        isConnectable={isConnectable}
        style={{ 
          background: '#4A5568', 
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
          <Monitor className="w-5 h-5 text-white" />
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
            <div className="text-xs font-medium mb-1 flex items-center justify-center space-x-1" style={{ color: 'var(--text-secondary)' }}>
              <Cpu className="w-3 h-3" />
              <span>CPU</span>
            </div>
            <div className="text-lg font-bold" style={{ color: getUsageColor(cpuUsage) }}>{cpuUsage}%</div>
          </div>
          
          <div className="rounded-lg p-3 text-center" style={{
            background: 'var(--bg-secondary)'
          }}>
            <div className="text-xs font-medium mb-1 flex items-center justify-center space-x-1" style={{ color: 'var(--text-secondary)' }}>
              <MemoryStick className="w-3 h-3" />
              <span>Memory</span>
            </div>
            <div className="text-lg font-bold" style={{ color: getUsageColor(memoryUsage) }}>{memoryUsage}%</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg p-3 text-center" style={{
            background: 'var(--bg-secondary)'
          }}>
            <div className="text-xs font-medium mb-1 flex items-center justify-center space-x-1" style={{ color: 'var(--text-secondary)' }}>
              <Activity className="w-3 h-3" />
              <span>GPU</span>
            </div>
            <div className="text-lg font-bold" style={{ color: getUsageColor(gpuUsage) }}>{gpuUsage}%</div>
          </div>
          
          <div className="rounded-lg p-3 text-center" style={{
            background: 'var(--bg-secondary)'
          }}>
            <div className="text-xs font-medium mb-1 flex items-center justify-center space-x-1" style={{ color: 'var(--text-secondary)' }}>
              <Thermometer className="w-3 h-3" />
              <span>Temp</span>
            </div>
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{temperature}°C</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg p-3 text-center" style={{
            background: 'var(--bg-secondary)'
          }}>
                    <div className="text-xs font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Network*</div>
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{networkThroughput} MB/s</div>
          </div>
          
          <div className="rounded-lg p-3 text-center" style={{
            background: 'var(--bg-secondary)'
          }}>
            <div className="text-xs font-medium mb-1 flex items-center justify-center space-x-1" style={{ color: 'var(--text-secondary)' }}>
              <Clock className="w-3 h-3" />
              <span>Uptime*</span>
            </div>
            <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{uptime}h</div>
          </div>
        </div>

        {status === 'warning' && (
          <div className="flex items-center space-x-2 rounded-lg p-2" style={{ 
            color: '#FFB800',
            background: 'var(--bg-secondary)'
          }}>
            <Activity className="w-4 h-4" />
            <span className="text-sm font-medium">High Resource Usage</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResourceMonitorNode;
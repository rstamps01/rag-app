import React from 'react';

interface GraphTypePreviewProps {
  graphType: string;
  className?: string;
}

const GraphTypePreview: React.FC<GraphTypePreviewProps> = ({ graphType, className = '' }) => {
  const renderPreview = () => {
    switch (graphType) {
      case 'force-directed':
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full">
            {/* Force-directed: nodes with connections */}
            <circle cx="50" cy="40" r="8" fill="#3b82f6" />
            <circle cx="100" cy="30" r="8" fill="#3b82f6" />
            <circle cx="150" cy="40" r="8" fill="#3b82f6" />
            <circle cx="80" cy="70" r="8" fill="#3b82f6" />
            <circle cx="120" cy="80" r="8" fill="#3b82f6" />
            <circle cx="60" cy="100" r="8" fill="#3b82f6" />
            <circle cx="140" cy="100" r="8" fill="#3b82f6" />
            {/* Connections */}
            <line x1="50" y1="40" x2="100" y2="30" stroke="#60a5fa" strokeWidth="1" opacity="0.6" />
            <line x1="100" y1="30" x2="150" y2="40" stroke="#60a5fa" strokeWidth="1" opacity="0.6" />
            <line x1="50" y1="40" x2="80" y2="70" stroke="#60a5fa" strokeWidth="1" opacity="0.6" />
            <line x1="100" y1="30" x2="120" y2="80" stroke="#60a5fa" strokeWidth="1" opacity="0.6" />
            <line x1="80" y1="70" x2="60" y2="100" stroke="#60a5fa" strokeWidth="1" opacity="0.6" />
            <line x1="120" y1="80" x2="140" y2="100" stroke="#60a5fa" strokeWidth="1" opacity="0.6" />
            <line x1="80" y1="70" x2="120" y2="80" stroke="#60a5fa" strokeWidth="1" opacity="0.6" />
          </svg>
        );
      
      case 'hierarchical':
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full">
            {/* Hierarchical: tree structure */}
            <circle cx="100" cy="20" r="8" fill="#10b981" />
            <circle cx="60" cy="50" r="6" fill="#10b981" />
            <circle cx="100" cy="50" r="6" fill="#10b981" />
            <circle cx="140" cy="50" r="6" fill="#10b981" />
            <circle cx="40" cy="80" r="5" fill="#10b981" />
            <circle cx="70" cy="80" r="5" fill="#10b981" />
            <circle cx="90" cy="80" r="5" fill="#10b981" />
            <circle cx="110" cy="80" r="5" fill="#10b981" />
            <circle cx="130" cy="80" r="5" fill="#10b981" />
            <circle cx="160" cy="80" r="5" fill="#10b981" />
            {/* Tree connections */}
            <line x1="100" y1="28" x2="60" y2="42" stroke="#34d399" strokeWidth="1.5" />
            <line x1="100" y1="28" x2="100" y2="42" stroke="#34d399" strokeWidth="1.5" />
            <line x1="100" y1="28" x2="140" y2="42" stroke="#34d399" strokeWidth="1.5" />
            <line x1="60" y1="56" x2="40" y2="72" stroke="#34d399" strokeWidth="1.5" />
            <line x1="60" y1="56" x2="70" y2="72" stroke="#34d399" strokeWidth="1.5" />
            <line x1="100" y1="56" x2="90" y2="72" stroke="#34d399" strokeWidth="1.5" />
            <line x1="100" y1="56" x2="110" y2="72" stroke="#34d399" strokeWidth="1.5" />
            <line x1="140" y1="56" x2="130" y2="72" stroke="#34d399" strokeWidth="1.5" />
            <line x1="140" y1="56" x2="160" y2="72" stroke="#34d399" strokeWidth="1.5" />
          </svg>
        );
      
      case 'circular':
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full">
            {/* Circular: nodes in circle */}
            <circle cx="100" cy="60" r="35" fill="none" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="2,2" opacity="0.3" />
            <circle cx="100" cy="25" r="6" fill="#8b5cf6" />
            <circle cx="135" cy="45" r="6" fill="#8b5cf6" />
            <circle cx="135" cy="75" r="6" fill="#8b5cf6" />
            <circle cx="100" cy="95" r="6" fill="#8b5cf6" />
            <circle cx="65" cy="75" r="6" fill="#8b5cf6" />
            <circle cx="65" cy="45" r="6" fill="#8b5cf6" />
            {/* Circular connections */}
            <line x1="100" y1="25" x2="135" y2="45" stroke="#a78bfa" strokeWidth="1" opacity="0.6" />
            <line x1="135" y1="45" x2="135" y2="75" stroke="#a78bfa" strokeWidth="1" opacity="0.6" />
            <line x1="135" y1="75" x2="100" y2="95" stroke="#a78bfa" strokeWidth="1" opacity="0.6" />
            <line x1="100" y1="95" x2="65" y2="75" stroke="#a78bfa" strokeWidth="1" opacity="0.6" />
            <line x1="65" y1="75" x2="65" y2="45" stroke="#a78bfa" strokeWidth="1" opacity="0.6" />
            <line x1="65" y1="45" x2="100" y2="25" stroke="#a78bfa" strokeWidth="1" opacity="0.6" />
            <line x1="100" y1="25" x2="100" y2="95" stroke="#a78bfa" strokeWidth="1" opacity="0.6" />
            <line x1="135" y1="45" x2="65" y2="45" stroke="#a78bfa" strokeWidth="1" opacity="0.6" />
          </svg>
        );
      
      case 'grid':
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full">
            {/* Grid: regular grid pattern */}
            <rect x="30" y="20" width="8" height="8" fill="#f59e0b" />
            <rect x="60" y="20" width="8" height="8" fill="#f59e0b" />
            <rect x="90" y="20" width="8" height="8" fill="#f59e0b" />
            <rect x="120" y="20" width="8" height="8" fill="#f59e0b" />
            <rect x="150" y="20" width="8" height="8" fill="#f59e0b" />
            <rect x="30" y="50" width="8" height="8" fill="#f59e0b" />
            <rect x="60" y="50" width="8" height="8" fill="#f59e0b" />
            <rect x="90" y="50" width="8" height="8" fill="#f59e0b" />
            <rect x="120" y="50" width="8" height="8" fill="#f59e0b" />
            <rect x="150" y="50" width="8" height="8" fill="#f59e0b" />
            <rect x="30" y="80" width="8" height="8" fill="#f59e0b" />
            <rect x="60" y="80" width="8" height="8" fill="#f59e0b" />
            <rect x="90" y="80" width="8" height="8" fill="#f59e0b" />
            <rect x="120" y="80" width="8" height="8" fill="#f59e0b" />
            <rect x="150" y="80" width="8" height="8" fill="#f59e0b" />
            {/* Grid connections */}
            <line x1="34" y1="24" x2="64" y2="24" stroke="#fbbf24" strokeWidth="1" opacity="0.4" />
            <line x1="64" y1="24" x2="94" y2="24" stroke="#fbbf24" strokeWidth="1" opacity="0.4" />
            <line x1="94" y1="24" x2="124" y2="24" stroke="#fbbf24" strokeWidth="1" opacity="0.4" />
            <line x1="34" y1="54" x2="64" y2="54" stroke="#fbbf24" strokeWidth="1" opacity="0.4" />
            <line x1="64" y1="54" x2="94" y2="54" stroke="#fbbf24" strokeWidth="1" opacity="0.4" />
            <line x1="34" y1="84" x2="64" y2="84" stroke="#fbbf24" strokeWidth="1" opacity="0.4" />
            <line x1="34" y1="24" x2="34" y2="54" stroke="#fbbf24" strokeWidth="1" opacity="0.4" />
            <line x1="64" y1="24" x2="64" y2="54" stroke="#fbbf24" strokeWidth="1" opacity="0.4" />
            <line x1="94" y1="24" x2="94" y2="54" stroke="#fbbf24" strokeWidth="1" opacity="0.4" />
          </svg>
        );
      
      case 'qdrant-native':
        return (
          <svg viewBox="0 0 200 120" className="w-full h-full">
            {/* Hub and spoke: central hub with spokes */}
            <circle cx="100" cy="60" r="10" fill="#ef4444" />
            <circle cx="50" cy="30" r="6" fill="#3b82f6" />
            <circle cx="150" cy="30" r="6" fill="#3b82f6" />
            <circle cx="50" cy="90" r="6" fill="#3b82f6" />
            <circle cx="150" cy="90" r="6" fill="#3b82f6" />
            <circle cx="30" cy="60" r="6" fill="#3b82f6" />
            <circle cx="170" cy="60" r="6" fill="#3b82f6" />
            {/* Hub-spoke connections */}
            <line x1="100" y1="60" x2="50" y2="30" stroke="#60a5fa" strokeWidth="2" />
            <line x1="100" y1="60" x2="150" y2="30" stroke="#60a5fa" strokeWidth="2" />
            <line x1="100" y1="60" x2="50" y2="90" stroke="#60a5fa" strokeWidth="2" />
            <line x1="100" y1="60" x2="150" y2="90" stroke="#60a5fa" strokeWidth="2" />
            <line x1="100" y1="60" x2="30" y2="60" stroke="#60a5fa" strokeWidth="2" />
            <line x1="100" y1="60" x2="170" y2="60" stroke="#60a5fa" strokeWidth="2" />
            {/* Secondary connections between spokes */}
            <line x1="50" y1="30" x2="150" y2="30" stroke="#93c5fd" strokeWidth="1" opacity="0.4" />
            <line x1="50" y1="90" x2="150" y2="90" stroke="#93c5fd" strokeWidth="1" opacity="0.4" />
          </svg>
        );
      
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Preview not available
          </div>
        );
    }
  };

  return (
    <div className={`w-full h-full ${className}`}>
      {renderPreview()}
    </div>
  );
};

export default GraphTypePreview;



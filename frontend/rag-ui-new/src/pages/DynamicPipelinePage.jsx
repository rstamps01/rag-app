import React from 'react';
import EnhancedRAGPipelineVisualization from '../components/pipeline/EnhancedRAGPipelineVisualization';

const DynamicPipelinePage = () => {
  return (
    <div className="h-screen bg-gray-900 text-white overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left side - Gear icon space (handled by EnhancedRAGPipelineVisualization) */}
          <div className="w-16"></div>
          
          {/* Center - Pipeline Monitor Dashboard */}
          <div className="flex-1 text-center">
            <h1 className="text-2xl font-bold">Pipeline Monitor Dashboard</h1>
            <p className="text-gray-400">Real-time monitoring of Query Processing (Green) and Document Processing (Blue) pipelines with centralized resource monitoring</p>
          </div>
          
          {/* Right side - Connected Status and Message area */}
          <div className="flex items-center space-x-4">
            {/* Connected Status will be populated by EnhancedRAGPipelineVisualization */}
            <div id="connected-status-area"></div>
            {/* Message area will be populated by EnhancedRAGPipelineVisualization */}
            <div id="header-message-area"></div>
          </div>
        </div>
      </div>

      {/* Main Enhanced Pipeline Visualization */}
      <div className="h-[calc(100vh-80px)]">
        <EnhancedRAGPipelineVisualization />
      </div>
    </div>
  );
};

export default DynamicPipelinePage;
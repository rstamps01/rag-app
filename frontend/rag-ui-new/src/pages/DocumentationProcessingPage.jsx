import React from 'react';
import DocumentationProcessingPipeline from '../components/pipeline/DocumentationProcessingPipeline';

const DocumentationProcessingPage = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold">RAG App Documentation Processing Pipeline</h1>
          <p className="text-gray-400">Real-time document ingestion, processing, and vector storage with VAST Data branding</p>
        </div>
      </div>

      {/* Main Documentation Processing Pipeline Visualization */}
      <div className="h-[calc(100vh-80px)]">
        <DocumentationProcessingPipeline />
      </div>
    </div>
  );
};

export default DocumentationProcessingPage;

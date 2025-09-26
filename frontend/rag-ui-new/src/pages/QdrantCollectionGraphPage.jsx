/**
 * Qdrant Collection Graph Page
 * 
 * Dedicated page for Qdrant collection graph visualization
 * with enhanced features and full-screen display.
 */

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Settings, RefreshCw, HelpCircle, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import QdrantGraphWorking from '../components/dashboard/QdrantGraphWorking';

const QdrantCollectionGraphPage = () => {
  const [selectedCollection, setSelectedCollection] = useState('rag');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isHelpMenuOpen, setIsHelpMenuOpen] = useState(false);
  const [graphHeight, setGraphHeight] = useState('calc(100vh - 200px)');

  // Update graph height on window resize
  useEffect(() => {
    const updateHeight = () => {
      const headerHeight = 128; // Approximate header height (64px + 64px for both headers)
      const newHeight = `calc(100vh - ${headerHeight}px)`;
      setGraphHeight(newHeight);
    };

    updateHeight();
    window.addEventListener('resize', updateHeight);
    return () => window.removeEventListener('resize', updateHeight);
  }, []);

  const collections = [
    { name: 'rag', label: 'RAG Collection', description: 'Main document collection' },
    { name: 'midjourney', label: 'Midjourney Collection', description: 'AI-generated content' },
    { name: 'qdrant-docs', label: 'Qdrant Docs Collection', description: 'Documentation collection' }
  ];

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
      setGraphHeight('100vh');
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
      setGraphHeight('calc(100vh - 128px)');
    }
  };

  return (
    <div className={`min-h-screen bg-gray-900 flex flex-col ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}>
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Back Button and Title */}
            <div className="flex items-center space-x-4">
              <Link
                to="/database-dashboard"
                className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Database Dashboard</span>
              </Link>
              <div className="h-6 w-px bg-gray-600"></div>
              <h1 className="text-xl font-semibold text-white">
                Qdrant Collection Graph Analytics
              </h1>
            </div>

            {/* Collection Selector and Controls */}
            <div className="flex items-center space-x-4">
              {/* Collection Selector */}
              <div className="flex items-center space-x-2">
                <label htmlFor="collection-select" className="text-sm text-gray-300">
                  Collection:
                </label>
                <select
                  id="collection-select"
                  value={selectedCollection}
                  onChange={(e) => setSelectedCollection(e.target.value)}
                  className="px-3 py-1 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
                >
                  {collections.map((collection) => (
                    <option key={collection.name} value={collection.name}>
                      {collection.label}
                    </option>
                  ))}
                </select>
              </div>

            {/* Control Buttons */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsHelpMenuOpen(true)}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                title="Open Help Menu"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <button
                onClick={toggleFullscreen}
                className="p-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
                title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Collection Info Banner */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">
                {collections.find(c => c.name === selectedCollection)?.label}
              </h2>
              <p className="text-sm text-gray-400">
                {collections.find(c => c.name === selectedCollection)?.description}
              </p>
            </div>
            <div className="text-sm text-gray-400">
              Interactive vector relationship visualization
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Full Page Graph */}
      <div className="flex-1 bg-gray-800 h-full">
        <QdrantGraphWorking 
          collectionName={selectedCollection}
          qdrantBaseUrl="http://localhost:6333"
          height={graphHeight}
          fullWidth={true}
        />
      </div>

      {/* Slide-out Help Menu */}
      {isHelpMenuOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-50"
            onClick={() => setIsHelpMenuOpen(false)}
          />
          
          {/* Slide-out Panel */}
          <div className="absolute right-0 top-0 h-full w-96 bg-gray-800 border-l border-gray-700 shadow-2xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-700">
                <h2 className="text-xl font-semibold text-white">Help & Guide</h2>
                <button
                  onClick={() => setIsHelpMenuOpen(false)}
                  className="p-2 hover:bg-gray-700 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Graph Visualization Guide */}
                <div className="bg-blue-900/20 border border-blue-700/30 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-blue-300 mb-3 flex items-center">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center mr-2">
                      <span className="text-white text-sm font-bold">i</span>
                    </div>
                    Graph Visualization Guide
                  </h3>
                  <div className="text-sm text-blue-200 space-y-2">
                    <p>• <strong>Nodes:</strong> Represent document chunks with color-coded groups</p>
                    <p>• <strong>Links:</strong> Show relationships between similar chunks</p>
                    <p>• <strong>Interactions:</strong> Click nodes for details, drag to pan, scroll to zoom</p>
                    <p>• <strong>Settings:</strong> Adjust node limit, size, and display options</p>
                  </div>
                </div>

                {/* Graph Statistics */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Graph Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Collection</span>
                      <span className="text-white font-medium">{selectedCollection}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Visualization Type</span>
                      <span className="text-white font-medium">Force-Directed Graph</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Layout Algorithm</span>
                      <span className="text-white font-medium">D3.js Physics</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Rendering Engine</span>
                      <span className="text-white font-medium">WebGL/Canvas</span>
                    </div>
                  </div>
                </div>

                {/* Interaction Features */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Interaction Features</h3>
                  <div className="space-y-3 text-sm text-gray-300">
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-blue-400 rounded-full flex-shrink-0"></div>
                      <span>Click nodes to view detailed information</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-green-400 rounded-full flex-shrink-0"></div>
                      <span>Drag to pan around the graph</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-purple-400 rounded-full flex-shrink-0"></div>
                      <span>Scroll to zoom in/out</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-orange-400 rounded-full flex-shrink-0"></div>
                      <span>Hover for node highlights</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-3 h-3 bg-yellow-400 rounded-full flex-shrink-0"></div>
                      <span>Use settings panel to customize view</span>
                    </div>
                  </div>
                </div>

                {/* Data Insights */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Data Insights</h3>
                  <div className="space-y-3 text-sm text-gray-300">
                    <div>
                      <p className="font-semibold text-white mb-1">Clustering</p>
                      <p>Similar documents group together, showing content relationships</p>
                    </div>
                    <div>
                      <p className="font-semibold text-white mb-1">Connections</p>
                      <p>Links represent semantic relationships between document chunks</p>
                    </div>
                    <div>
                      <p className="font-semibold text-white mb-1">Density</p>
                      <p>Tight clusters indicate high content similarity</p>
                    </div>
                    <div>
                      <p className="font-semibold text-white mb-1">Isolation</p>
                      <p>Standalone nodes represent unique or outlier content</p>
                    </div>
                    <div>
                      <p className="font-semibold text-white mb-1">Color Coding</p>
                      <p>Different colors represent different document groups or types</p>
                    </div>
                  </div>
                </div>

                {/* Collection Information */}
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-white mb-4">Current Collection</h3>
                  <div className="space-y-2 text-sm text-gray-300">
                    <p><strong>Name:</strong> {collections.find(c => c.name === selectedCollection)?.label}</p>
                    <p><strong>Description:</strong> {collections.find(c => c.name === selectedCollection)?.description}</p>
                    <p><strong>Data Source:</strong> Qdrant Vector Database</p>
                    <p><strong>Update Frequency:</strong> Real-time</p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-gray-700">
                <div className="text-xs text-gray-400 text-center">
                  Use the settings panel in the graph to customize your visualization experience
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QdrantCollectionGraphPage;

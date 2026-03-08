/**
 * Modular Graph Test Component
 * 
 * Test page to demonstrate the modular graph system
 */

import React, { useState } from 'react';
import { QDRANT_URL } from '../../config';
import QdrantGraphModular from './QdrantGraphModular';
import ModularGraphDemo from './graphs/ModularGraphDemo';
import { getEnabledGraphTypes, getGraphTypesByDimension } from './graphs/core/GraphTypes';

const ModularGraphTest = () => {
  const [activeTab, setActiveTab] = useState('modular');
  const [collectionName, setCollectionName] = useState('rag');
  const [qdrantBaseUrl, setQdrantBaseUrl] = useState(QDRANT_URL);
  
  // Similarity settings (matching QdrantGraphWorking defaults)
  const [similarityMode, setSimilarityMode] = useState('semantic');
  const [similarityThreshold, setSimilarityThreshold] = useState(0.45);
  const [minDistance, setMinDistance] = useState(20);
  const [maxDistance, setMaxDistance] = useState(200);

  const availableGraphTypes = getEnabledGraphTypes();
  const graph2DTypes = getGraphTypesByDimension('2D');
  const graph3DTypes = getGraphTypesByDimension('3D');

  return (
    <div className="h-screen flex flex-col" style={{ backgroundColor: 'transparent' }}>
      {/* Header */}
      <div className="bg-gray-800 p-4 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-white mb-4">
          Modular Graph System Test
        </h1>
        
        {/* Configuration */}
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="text-sm text-gray-300 mr-2">Collection:</label>
            <input
              type="text"
              value={collectionName}
              onChange={(e) => setCollectionName(e.target.value)}
              className="px-2 py-1 bg-gray-700 text-white rounded text-sm"
            />
          </div>
          <div>
            <label className="text-sm text-gray-300 mr-2">Qdrant URL:</label>
            <input
              type="text"
              value={qdrantBaseUrl}
              onChange={(e) => setQdrantBaseUrl(e.target.value)}
              className="px-2 py-1 bg-gray-700 text-white rounded text-sm w-64"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 mt-4">
          <button
            onClick={() => setActiveTab('modular')}
            className={`px-4 py-2 rounded ${
              activeTab === 'modular' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Modular Graph (QdrantGraphModular)
          </button>
          <button
            onClick={() => setActiveTab('demo')}
            className={`px-4 py-2 rounded ${
              activeTab === 'demo' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Demo Integration
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden" style={{ backgroundColor: 'transparent' }}>
        {activeTab === 'modular' && (
          <QdrantGraphModular
            collectionName={collectionName}
            qdrantBaseUrl={qdrantBaseUrl}
            height="100%"
            fullWidth={true}
            similarityMode={similarityMode}
            similarityThreshold={similarityThreshold}
            minDistance={minDistance}
            maxDistance={maxDistance}
          />
        )}
        
        {activeTab === 'demo' && (
          <ModularGraphDemo
            collectionName={collectionName}
            qdrantBaseUrl={qdrantBaseUrl}
            height="100%"
            fullWidth={true}
          />
        )}
      </div>

      {/* Footer with Stats */}
      <div className="bg-gray-800 p-4 border-t border-gray-700">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-400">{availableGraphTypes.length}</div>
            <div className="text-gray-400">Total Modules</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-400">{graph2DTypes.length}</div>
            <div className="text-gray-400">2D Graphs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-400">{graph3DTypes.length}</div>
            <div className="text-gray-400">3D Graphs</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-400">4</div>
            <div className="text-gray-400">Specialized 3D</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModularGraphTest;

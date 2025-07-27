import React from 'react';
import { Card } from '../ui';

const HomePage = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-4xl mx-auto py-12 px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to your GPU-accelerated RAG AI application
          </h1>
          <p className="text-xl text-gray-300">
            Use the navigation links above to manage documents, run queries, or monitor the pipeline.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="bg-gray-800 border-gray-700 hover:border-blue-500 transition-colors cursor-pointer">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Documents</h3>
                  <p className="text-gray-400">Upload and manage your documents</p>
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700 hover:border-blue-500 transition-colors cursor-pointer">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Queries</h3>
                  <p className="text-gray-400">Ask questions and view history</p>
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="bg-gray-800 border-gray-700 hover:border-blue-500 transition-colors cursor-pointer">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Pipeline Monitor</h3>
                  <p className="text-gray-400">Monitor system performance</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
        
        <div className="mt-12 text-center">
          <Card className="bg-gray-800 border-gray-700">
            <div className="p-8">
              <h2 className="text-2xl font-bold text-white mb-4">System Status</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-gray-300">Backend Online</p>
                </div>
                <div className="text-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-gray-300">Database Connected</p>
                </div>
                <div className="text-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mx-auto mb-2"></div>
                  <p className="text-sm text-gray-300">GPU Accelerated</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
/**
 * Test Dashboard Component
 * Simple test component to verify routing and rendering
 */

import React from 'react';

const TestDashboard = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Test Dashboard</h1>
        <p className="text-gray-400 mb-6">This is a simple test dashboard to verify routing works.</p>
        
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-green-600 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">✓</div>
              <div className="text-sm">Component Renders</div>
            </div>
            <div className="bg-blue-600 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">✓</div>
              <div className="text-sm">Routing Works</div>
            </div>
            <div className="bg-purple-600 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold">✓</div>
              <div className="text-sm">Styling Applied</div>
            </div>
          </div>
        </div>
        
        <div className="mt-6 bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Next Steps</h2>
          <ul className="space-y-2 text-gray-300">
            <li>• If you can see this, the basic routing is working</li>
            <li>• The issue might be with the complex dashboard components</li>
            <li>• We can now debug the specific dashboard components</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestDashboard;

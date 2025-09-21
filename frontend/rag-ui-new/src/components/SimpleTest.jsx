import React from 'react';

const SimpleTest = () => {
  return (
    <div className="w-full h-full bg-gray-900 text-white p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Simple Test</h1>
        <p className="text-xl text-gray-300 mb-8">This is a simple test to verify the component is rendering.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          <div className="bg-blue-600 p-4 rounded-lg">
            <h3 className="font-semibold">Test 1</h3>
            <p className="text-sm text-blue-200">Basic rendering</p>
          </div>
          <div className="bg-green-600 p-4 rounded-lg">
            <h3 className="font-semibold">Test 2</h3>
            <p className="text-sm text-green-200">Component working</p>
          </div>
          <div className="bg-purple-600 p-4 rounded-lg">
            <h3 className="font-semibold">Test 3</h3>
            <p className="text-sm text-purple-200">Vite dev mode</p>
          </div>
          <div className="bg-orange-600 p-4 rounded-lg">
            <h3 className="font-semibold">Test 4</h3>
            <p className="text-sm text-orange-200">Port 3001</p>
          </div>
        </div>
        
        <div className="mt-8">
          <div className="bg-gray-800 p-4 rounded-lg max-w-2xl mx-auto">
            <h3 className="font-semibold mb-2">Status</h3>
            <p className="text-green-400">✅ Simple component is rendering correctly</p>
            <p className="text-gray-400 text-sm mt-2">If you can see this, the basic component structure is working in Vite dev mode.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleTest;

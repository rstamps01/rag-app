import React from 'react';

const DebugTest = () => {
  console.log('DebugTest component is rendering');
  
  return (
    <div className="w-full h-full bg-green-900 text-white p-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Debug Test - Component Rendered</h1>
        <p className="text-xl text-green-300 mb-8">If you can see this, the component is mounting correctly</p>
        
        <div className="bg-green-800 p-4 rounded-lg max-w-2xl mx-auto">
          <h3 className="font-semibold mb-2">Status</h3>
          <p className="text-green-400">✅ Component is rendering successfully</p>
          <p className="text-gray-300 text-sm mt-2">Check browser console for "DebugTest component is rendering" message</p>
        </div>
        
        <div className="mt-4 text-xs text-gray-300">
          <p>Current time: {new Date().toLocaleTimeString()}</p>
          <p>React version: {React.version}</p>
        </div>
      </div>
    </div>
  );
};

export default DebugTest;

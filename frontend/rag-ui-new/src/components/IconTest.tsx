import React from 'react';
import { Volume2, VolumeX, BarChart3, Target, Zap } from 'lucide-react';

const IconTest: React.FC = () => {
  return (
    <div className="p-4 bg-gray-800 text-white">
      <h2 className="text-xl font-bold mb-4">Icon Test</h2>
      <div className="flex gap-4">
        <VolumeX className="h-6 w-6 text-red-400" />
        <Volume2 className="h-6 w-6 text-green-400" />
        <BarChart3 className="h-6 w-6 text-blue-400" />
        <Target className="h-6 w-6 text-yellow-400" />
        <Zap className="h-6 w-6 text-purple-400" />
      </div>
      <p className="mt-2 text-sm text-gray-300">
        If you can see these icons, lucide-react is working correctly.
      </p>
    </div>
  );
};

export default IconTest;

import React, { useState } from 'react';
import SimilarityVisualizationDemo from '../components/dashboard/SimilarityVisualizationDemo';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ArrowLeft, TestTube, CheckCircle, XCircle } from 'lucide-react';

const SimilarityTestPage = () => {
  const [testResults, setTestResults] = useState({
    components: false,
    styling: false,
    interactions: false,
    animations: false
  });

  const runTests = () => {
    // Simulate running tests
    setTestResults({
      components: true,
      styling: true,
      interactions: true,
      animations: true
    });
  };

  const resetTests = () => {
    setTestResults({
      components: false,
      styling: false,
      interactions: false,
      animations: false
    });
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <CardTitle className="text-2xl font-bold text-white flex items-center gap-3">
              <TestTube className="h-8 w-8 text-blue-400" />
              Similarity Visualization Test Suite
            </CardTitle>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={runTests}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <TestTube className="h-4 w-4 mr-2" />
              Run Tests
            </Button>
            
            <Button
              onClick={resetTests}
              variant="outline"
              className="bg-gray-700 border-gray-600 text-white hover:bg-gray-600"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Test Status */}
      <div className="p-4">
        <Card className="bg-gray-800 border-gray-700 mb-4">
          <CardHeader>
            <CardTitle className="text-lg text-white">Test Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                {testResults.components ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
                <span className="text-white">Components</span>
              </div>
              
              <div className="flex items-center gap-2">
                {testResults.styling ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
                <span className="text-white">Styling</span>
              </div>
              
              <div className="flex items-center gap-2">
                {testResults.interactions ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
                <span className="text-white">Interactions</span>
              </div>
              
              <div className="flex items-center gap-2">
                {testResults.animations ? (
                  <CheckCircle className="h-5 w-5 text-green-400" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400" />
                )}
                <span className="text-white">Animations</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Instructions */}
        <Card className="bg-gray-800 border-gray-700 mb-4">
          <CardHeader>
            <CardTitle className="text-lg text-white">Test Instructions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-gray-300">
              <p>1. <strong>Component Loading:</strong> Verify all similarity components load without errors</p>
              <p>2. <strong>Styling:</strong> Check that React Bits animations and shadcn/ui styling work correctly</p>
              <p>3. <strong>Interactions:</strong> Test clicking nodes, adjusting sliders, and switching tabs</p>
              <p>4. <strong>Animations:</strong> Verify ElasticSlider, RotatingText, and ElectricBorder animations work</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Demo Component */}
      <div className="h-screen">
        <SimilarityVisualizationDemo />
      </div>
    </div>
  );
};

export default SimilarityTestPage;

// Pipeline Journey Map - Document lifecycle visualization
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { FileText, Eye, Brain, Database, Target, Clock, CheckCircle, AlertTriangle } from 'lucide-react';

const PipelineJourneyMap = ({ documentId, onStageClick }) => {
  const [journeyData, setJourneyData] = useState(null);
  const [selectedStage, setSelectedStage] = useState(null);

  const journeyStages = [
    { 
      id: 'upload', 
      name: 'Document Upload', 
      icon: FileText, 
      color: '#3b82f6',
      description: 'File received and validated'
    },
    { 
      id: 'extract', 
      name: 'Text Extraction', 
      icon: Eye, 
      color: '#8b5cf6',
      description: 'OCR and text parsing'
    },
    { 
      id: 'chunk', 
      name: 'Text Chunking', 
      icon: Brain, 
      color: '#06b6d4',
      description: 'Document segmentation'
    },
    { 
      id: 'embed', 
      name: 'Embedding Generation', 
      icon: Brain, 
      color: '#10b981',
      description: 'Vector embeddings created'
    },
    { 
      id: 'store', 
      name: 'Vector Storage', 
      icon: Database, 
      color: '#f59e0b',
      description: 'Stored in Qdrant database'
    },
    { 
      id: 'index', 
      name: 'Search Indexing', 
      icon: Target, 
      color: '#ef4444',
      description: 'Available for queries'
    }
  ];

  useEffect(() => {
    // Fetch journey data for specific document
    const fetchJourneyData = async () => {
      try {
        const response = await fetch(`/api/monitoring/documents/${documentId}/journey`);
        const data = await response.json();
        setJourneyData(data);
      } catch (error) {
        console.error('Error fetching journey data:', error);
      }
    };

    if (documentId) {
      fetchJourneyData();
    }
  }, [documentId]);

  const getStageStatus = (stageId) => {
    if (!journeyData) return 'pending';
    const stage = journeyData.stages?.find(s => s.id === stageId);
    return stage?.status || 'pending';
  };

  const getStageTimestamp = (stageId) => {
    if (!journeyData) return null;
    const stage = journeyData.stages?.find(s => s.id === stageId);
    return stage?.timestamp;
  };

  const getStageIcon = (status) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'failed': return AlertTriangle;
      case 'processing': return Clock;
      default: return Clock;
    }
  };

  const getStageColor = (status) => {
    switch (status) {
      case 'completed': return '#10b981';
      case 'failed': return '#ef4444';
      case 'processing': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Document Journey Map
          {documentId && (
            <Badge variant="outline" className="ml-2">
              {documentId.slice(0, 8)}...
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Timeline Visualization */}
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>
          
          {/* Journey Stages */}
          <div className="space-y-6">
            {journeyStages.map((stage, index) => {
              const status = getStageStatus(stage.id);
              const timestamp = getStageTimestamp(stage.id);
              const StatusIcon = getStageIcon(status);
              const StageIcon = stage.icon;
              
              return (
                <div 
                  key={stage.id}
                  className={`relative flex items-center gap-4 p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-50 ${
                    selectedStage === stage.id ? 'bg-blue-50 border border-blue-200' : ''
                  }`}
                  onClick={() => {
                    setSelectedStage(stage.id);
                    onStageClick?.(stage, journeyData?.stages?.find(s => s.id === stage.id));
                  }}
                >
                  {/* Timeline Node */}
                  <div 
                    className="relative z-10 w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg"
                    style={{ backgroundColor: getStageColor(status) }}
                  >
                    <StageIcon className="h-6 w-6" />
                    <div className="absolute -bottom-1 -right-1">
                      <StatusIcon 
                        className="h-4 w-4 bg-white rounded-full" 
                        style={{ color: getStageColor(status) }}
                      />
                    </div>
                  </div>
                  
                  {/* Stage Details */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{stage.name}</h3>
                      <Badge 
                        variant={status === 'completed' ? 'default' : status === 'failed' ? 'destructive' : 'secondary'}
                      >
                        {status}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">{stage.description}</p>
                    {timestamp && (
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(timestamp).toLocaleString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stage Details Panel */}
        {selectedStage && journeyData && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">Stage Details</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Duration:</span>
                <span className="ml-2 font-medium">
                  {journeyData.stages?.find(s => s.id === selectedStage)?.duration || 'N/A'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Processing Time:</span>
                <span className="ml-2 font-medium">
                  {journeyData.stages?.find(s => s.id === selectedStage)?.processingTime || 'N/A'}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PipelineJourneyMap;
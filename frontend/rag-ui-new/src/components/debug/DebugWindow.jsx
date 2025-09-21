import React from 'react';
import { 
  X, 
  Activity, 
  Database, 
  Cpu, 
  Zap, 
  MessageSquare, 
  FileText, 
  BarChart3,
  Server,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';

const DebugWindow = ({ isOpen, onClose, pipelineData, systemMetrics, isConnected }) => {
  if (!isOpen) return null;

  // Get current timestamp for real-time display
  const currentTime = new Date().toLocaleTimeString();

  // Mock comprehensive metrics for both workflows
  const debugMetrics = {
    // Document Processing Workflow Metrics
    documentProcessing: {
      documentIngestion: {
        status: 'active',
        documentsProcessed: 1247,
        documentsInQueue: 23,
        avgProcessingTime: 1250,
        successRate: 99.2,
        errorCount: 8,
        throughputPerMinute: 45,
        lastProcessed: '2 minutes ago'
      },
      textProcessing: {
        status: 'processing',
        textChunksGenerated: 15680,
        avgChunkSize: 512,
        processingTime: 890,
        successRate: 98.8,
        errorCount: 3,
        throughputPerMinute: 42,
        lastProcessed: '30 seconds ago'
      },
      embeddingGeneration: {
        status: 'active',
        embeddingsGenerated: 15680,
        gpuUtilization: 85,
        avgGenerationTime: 1200,
        successRate: 98.5,
        errorCount: 5,
        throughputPerMinute: 40,
        lastProcessed: '1 minute ago'
      },
      vectorStorage: {
        status: 'active',
        vectorsStored: 15680,
        storageUtilization: 67.5,
        avgStorageTime: 45,
        successRate: 99.8,
        errorCount: 1,
        throughputPerMinute: 40,
        lastProcessed: '45 seconds ago'
      }
    },
    
    // Query Processing Workflow Metrics
    queryProcessing: {
      queryInput: {
        status: 'active',
        activeQueries: 12,
        queriesInQueue: 3,
        avgQueueTime: 50,
        successRate: 99.9,
        errorCount: 1,
        throughputPerMinute: 48,
        lastProcessed: '5 seconds ago'
      },
      vectorSearch: {
        status: 'processing',
        searchesPerformed: 1247,
        avgSearchTime: 45,
        resultsFound: 5.2,
        accuracy: 92.3,
        successRate: 98.7,
        errorCount: 4,
        throughputPerMinute: 46,
        lastProcessed: '10 seconds ago'
      },
      llmProcessing: {
        status: 'processing',
        tokensGenerated: 15680,
        modelLoad: 92,
        avgProcessingTime: 3200,
        successRate: 97.8,
        errorCount: 7,
        throughputPerMinute: 44,
        lastProcessed: '15 seconds ago'
      },
      responseGeneration: {
        status: 'active',
        responsesGenerated: 1247,
        avgResponseLength: 150,
        avgDeliveryTime: 25,
        successRate: 99.1,
        errorCount: 2,
        throughputPerMinute: 47,
        lastProcessed: '8 seconds ago'
      }
    },

    // System Resource Metrics
    systemResources: {
      cpu: {
        utilization: 67.5,
        cores: 16,
        loadAverage: 2.3,
        temperature: 65
      },
      memory: {
        total: 64,
        used: 42.3,
        available: 21.7,
        utilization: 66.1
      },
      gpu: {
        utilization: 85,
        memoryUsed: 12.5,
        memoryTotal: 24,
        temperature: 78
      },
      storage: {
        total: 2000,
        used: 1247.5,
        available: 752.5,
        utilization: 62.4
      },
      network: {
        bytesIn: 1024000,
        bytesOut: 2048000,
        packetsIn: 15680,
        packetsOut: 12470,
        latency: 12
      }
    },

    // Connection & WebSocket Metrics
    connectionMetrics: {
      webSocketStatus: isConnected ? 'connected' : 'disconnected',
      connectionUptime: '72h 15m 30s',
      messagesReceived: 45670,
      messagesSent: 12470,
      reconnectAttempts: 3,
      lastMessageTime: '2 seconds ago',
      connectionLatency: 12,
      errorCount: 5
    }
  };

  const MetricCard = ({ title, icon: Icon, metrics, status }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'active': return 'text-green-400 bg-green-900/20';
        case 'processing': return 'text-blue-400 bg-blue-900/20';
        case 'idle': return 'text-gray-400 bg-gray-900/20';
        case 'error': return 'text-red-400 bg-red-900/20';
        default: return 'text-gray-400 bg-gray-900/20';
      }
    };

    return (
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Icon className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">{title}</h3>
          </div>
          <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(status)}`}>
            {status}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {Object.entries(metrics).map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <span className="text-gray-400 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}:
              </span>
              <span className="text-white font-mono">
                {typeof value === 'number' && key.includes('Rate') ? `${value}%` :
                 typeof value === 'number' && key.includes('Time') ? `${value}ms` :
                 typeof value === 'number' && key.includes('Utilization') ? `${value}%` :
                 typeof value === 'number' && key.includes('Count') ? value.toLocaleString() :
                 typeof value === 'number' && key.includes('GB') ? `${value}GB` :
                 typeof value === 'number' && key.includes('MB') ? `${value}MB` :
                 typeof value === 'number' ? value.toLocaleString() :
                 value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Debug Window */}
      <div className="relative w-96 h-full bg-gray-900 border-l border-gray-700 shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-purple-400" />
            <div>
              <h2 className="text-lg font-bold text-white">Debug Console</h2>
              <p className="text-xs text-gray-400">Last updated: {currentTime}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Connection Status */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Server className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-semibold text-white">Connection Status</h3>
              </div>
              <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-xs">{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
            <MetricCard 
              title="WebSocket Metrics" 
              icon={Activity} 
              metrics={debugMetrics.connectionMetrics}
              status={debugMetrics.connectionMetrics.webSocketStatus}
            />
          </div>

          {/* Document Processing Workflow */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <FileText className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold text-white">Document Processing Workflow</h3>
            </div>
            
            <MetricCard 
              title="Document Ingestion" 
              icon={Database} 
              metrics={debugMetrics.documentProcessing.documentIngestion}
              status={debugMetrics.documentProcessing.documentIngestion.status}
            />
            
            <MetricCard 
              title="Text Processing" 
              icon={FileText} 
              metrics={debugMetrics.documentProcessing.textProcessing}
              status={debugMetrics.documentProcessing.textProcessing.status}
            />
            
            <MetricCard 
              title="Embedding Generation" 
              icon={Zap} 
              metrics={debugMetrics.documentProcessing.embeddingGeneration}
              status={debugMetrics.documentProcessing.embeddingGeneration.status}
            />
            
            <MetricCard 
              title="Vector Storage" 
              icon={Database} 
              metrics={debugMetrics.documentProcessing.vectorStorage}
              status={debugMetrics.documentProcessing.vectorStorage.status}
            />
          </div>

          {/* Query Processing Workflow */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <MessageSquare className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold text-white">Query Processing Workflow</h3>
            </div>
            
            <MetricCard 
              title="Query Input" 
              icon={MessageSquare} 
              metrics={debugMetrics.queryProcessing.queryInput}
              status={debugMetrics.queryProcessing.queryInput.status}
            />
            
            <MetricCard 
              title="Vector Search" 
              icon={BarChart3} 
              metrics={debugMetrics.queryProcessing.vectorSearch}
              status={debugMetrics.queryProcessing.vectorSearch.status}
            />
            
            <MetricCard 
              title="LLM Processing" 
              icon={Cpu} 
              metrics={debugMetrics.queryProcessing.llmProcessing}
              status={debugMetrics.queryProcessing.llmProcessing.status}
            />
            
            <MetricCard 
              title="Response Generation" 
              icon={MessageSquare} 
              metrics={debugMetrics.queryProcessing.responseGeneration}
              status={debugMetrics.queryProcessing.responseGeneration.status}
            />
          </div>

          {/* System Resources */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Server className="w-5 h-5 text-orange-400" />
              <h3 className="text-lg font-semibold text-white">System Resources</h3>
            </div>
            
            <MetricCard 
              title="CPU Resources" 
              icon={Cpu} 
              metrics={debugMetrics.systemResources.cpu}
              status="active"
            />
            
            <MetricCard 
              title="Memory Resources" 
              icon={Server} 
              metrics={debugMetrics.systemResources.memory}
              status="active"
            />
            
            <MetricCard 
              title="GPU Resources" 
              icon={Zap} 
              metrics={debugMetrics.systemResources.gpu}
              status="active"
            />
            
            <MetricCard 
              title="Storage Resources" 
              icon={Database} 
              metrics={debugMetrics.systemResources.storage}
              status="active"
            />
            
            <MetricCard 
              title="Network Resources" 
              icon={Activity} 
              metrics={debugMetrics.systemResources.network}
              status="active"
            />
          </div>

          {/* Debug Actions */}
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center space-x-2">
              <Info className="w-4 h-4 text-blue-400" />
              <span>Debug Actions</span>
            </h3>
            <div className="space-y-2">
              <button 
                onClick={() => {
                  const debugData = {
                    timestamp: new Date().toISOString(),
                    pipelineData,
                    systemMetrics,
                    connectionStatus: isConnected,
                    debugMetrics
                  };
                  const blob = new Blob([JSON.stringify(debugData, null, 2)], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `debug-logs-${Date.now()}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full text-left px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors"
              >
                Export Debug Logs
              </button>
              <button 
                onClick={() => console.clear()}
                className="w-full text-left px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm transition-colors"
              >
                Clear Console Logs
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="w-full text-left px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded text-sm transition-colors"
              >
                Refresh All Metrics
              </button>
              <button 
                onClick={() => {
                  console.log('🔧 Testing WebSocket Connection...');
                  console.log('Connection Status:', isConnected);
                  console.log('Pipeline Data:', pipelineData);
                  console.log('System Metrics:', systemMetrics);
                }}
                className="w-full text-left px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded text-sm transition-colors"
              >
                Test WebSocket Connection
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebugWindow;

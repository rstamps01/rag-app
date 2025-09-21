# Real Metrics Implementation Plan

## Phase 1: System Metrics Implementation (Immediate - 1-2 days)

### 1.1 Backend System Monitoring Service

#### Create System Metrics Collector
```python
# backend/services/system_metrics.py
import psutil
import time
import json
from datetime import datetime

class SystemMetricsCollector:
    def __init__(self):
        self.metrics = {}
    
    def collect_cpu_metrics(self):
        return {
            'cpu_usage': psutil.cpu_percent(interval=1),
            'cpu_count': psutil.cpu_count(),
            'cpu_freq': psutil.cpu_freq()._asdict() if psutil.cpu_freq() else None,
            'load_avg': psutil.getloadavg() if hasattr(psutil, 'getloadavg') else None
        }
    
    def collect_memory_metrics(self):
        memory = psutil.virtual_memory()
        return {
            'memory_usage': memory.percent,
            'memory_total': memory.total,
            'memory_available': memory.available,
            'memory_used': memory.used
        }
    
    def collect_gpu_metrics(self):
        try:
            import pynvml
            pynvml.nvmlInit()
            handle = pynvml.nvmlDeviceGetHandleByIndex(0)
            return {
                'gpu_utilization': pynvml.nvmlDeviceGetUtilizationRates(handle).gpu,
                'gpu_memory_used': pynvml.nvmlDeviceGetMemoryInfo(handle).used,
                'gpu_memory_total': pynvml.nvmlDeviceGetMemoryInfo(handle).total,
                'gpu_temperature': pynvml.nvmlDeviceGetTemperature(handle, pynvml.NVML_TEMPERATURE_GPU)
            }
        except ImportError:
            return {'gpu_utilization': 0, 'gpu_memory_used': 0, 'gpu_memory_total': 0, 'gpu_temperature': 0}
    
    def collect_storage_metrics(self):
        disk = psutil.disk_usage('/')
        return {
            'storage_usage': (disk.used / disk.total) * 100,
            'storage_total': disk.total,
            'storage_used': disk.used,
            'storage_free': disk.free
        }
    
    def collect_all_metrics(self):
        return {
            'timestamp': datetime.now().isoformat(),
            'cpu': self.collect_cpu_metrics(),
            'memory': self.collect_memory_metrics(),
            'gpu': self.collect_gpu_metrics(),
            'storage': self.collect_storage_metrics()
        }
```

#### Create WebSocket Endpoint for Real-time Metrics
```python
# backend/api/websocket.py
import asyncio
import websockets
import json
from services.system_metrics import SystemMetricsCollector

class MetricsWebSocketServer:
    def __init__(self):
        self.collector = SystemMetricsCollector()
        self.clients = set()
    
    async def register_client(self, websocket, path):
        self.clients.add(websocket)
        try:
            while True:
                metrics = self.collector.collect_all_metrics()
                await websocket.send(json.dumps({
                    'type': 'system_metrics',
                    'data': metrics
                }))
                await asyncio.sleep(2)  # Update every 2 seconds
        except websockets.exceptions.ConnectionClosed:
            self.clients.remove(websocket)

# Start WebSocket server
start_server = websockets.serve(MetricsWebSocketServer().register_client, "localhost", 8000)
```

### 1.2 Frontend Integration

#### Update Real-time Service
```javascript
// frontend/src/services/realTimePipelineService.js
class RealTimePipelineService {
  // ... existing code ...
  
  updateSystemMetrics(data) {
    if (data.cpu) {
      this.metrics.systemHealth = {
        cpuUsage: data.cpu.cpu_usage,
        memoryUsage: data.memory.memory_usage,
        memoryAvailable: `${Math.round(data.memory.memory_available / (1024**3))}GB`
      };
    }
    
    if (data.gpu) {
      this.metrics.gpuPerformance = [{
        utilization: data.gpu.gpu_utilization,
        memoryUsed: Math.round(data.gpu.gpu_memory_used / (1024**2)), // MB
        memoryTotal: Math.round(data.gpu.gpu_memory_total / (1024**2)), // MB
        temperature: data.gpu.gpu_temperature
      }];
    }
    
    if (data.storage) {
      this.metrics.storage = {
        usage: data.storage.storage_usage,
        total: data.storage.storage_total,
        used: data.storage.storage_used,
        free: data.storage.storage_free
      };
    }
  }
}
```

## Phase 2: Application Metrics Implementation (Short-term - 3-5 days)

### 2.1 Query Processing Metrics

#### Add Metrics to Query Processing Functions
```python
# backend/services/query_processor.py
import time
from collections import defaultdict

class QueryMetrics:
    def __init__(self):
        self.query_count = 0
        self.success_count = 0
        self.total_response_time = 0
        self.active_queries = 0
        self.queue_length = 0
    
    def start_query(self):
        self.query_count += 1
        self.active_queries += 1
        return time.time()
    
    def end_query(self, start_time, success=True):
        self.active_queries -= 1
        response_time = time.time() - start_time
        self.total_response_time += response_time
        if success:
            self.success_count += 1
    
    def get_metrics(self):
        avg_response_time = self.total_response_time / max(self.query_count, 1)
        success_rate = (self.success_count / max(self.query_count, 1)) * 100
        queries_per_minute = (self.query_count / 60) * 60  # Assuming 1 minute window
        
        return {
            'queries_per_minute': queries_per_minute,
            'avg_response_time': avg_response_time,
            'success_rate': success_rate,
            'active_queries': self.active_queries,
            'queue_length': self.queue_length
        }

# Global metrics instance
query_metrics = QueryMetrics()
```

### 2.2 Document Processing Metrics

#### Add Metrics to Document Processing Pipeline
```python
# backend/services/document_processor.py
class DocumentMetrics:
    def __init__(self):
        self.documents_processed = 0
        self.chunks_generated = 0
        self.embeddings_generated = 0
        self.vectors_stored = 0
        self.processing_times = []
        self.success_count = 0
    
    def record_document_processing(self, chunks_count, processing_time, success=True):
        self.documents_processed += 1
        self.chunks_generated += chunks_count
        self.processing_times.append(processing_time)
        if success:
            self.success_count += 1
    
    def record_embedding_generation(self, count, success=True):
        self.embeddings_generated += count
        if success:
            self.success_count += 1
    
    def record_vector_storage(self, count, success=True):
        self.vectors_stored += count
        if success:
            self.success_count += 1
    
    def get_metrics(self):
        avg_processing_time = sum(self.processing_times) / max(len(self.processing_times), 1)
        success_rate = (self.success_count / max(self.documents_processed, 1)) * 100
        
        return {
            'documents_processed': self.documents_processed,
            'chunks_generated': self.chunks_generated,
            'embeddings_generated': self.embeddings_generated,
            'vectors_stored': self.vectors_stored,
            'avg_processing_time': avg_processing_time,
            'success_rate': success_rate
        }

# Global metrics instance
document_metrics = DocumentMetrics()
```

## Phase 3: Frontend UI Updates (Immediate)

### 3.1 Update Debug Menu with Real Data

#### Replace Hardcoded Values
```javascript
// frontend/src/components/monitoring/PipelineMonitoringDashboard.jsx
const RealTimeMetricsDisplay = ({ pipelineData, systemMetrics }) => {
  // Document Processing Metrics
  const documentMetrics = {
    processed: pipelineData?.documentProcessing?.documentsProcessed || 0,
    queue: pipelineData?.documentProcessing?.queueLength || 0,
    avgTime: pipelineData?.documentProcessing?.avgProcessingTime || 0,
    success: pipelineData?.documentProcessing?.successRate || 0
  };
  
  // Query Processing Metrics
  const queryMetrics = {
    active: pipelineData?.queryProcessing?.activeQueries || 0,
    queue: pipelineData?.queryProcessing?.queueLength || 0,
    queueTime: pipelineData?.queryProcessing?.avgQueueTime || 0,
    success: pipelineData?.queryProcessing?.successRate || 0
  };
  
  // System Resources
  const systemResources = {
    cpu: systemMetrics?.systemHealth?.cpuUsage || 0,
    memory: systemMetrics?.systemHealth?.memoryUsage || 0,
    gpu: systemMetrics?.gpuPerformance?.[0]?.utilization || 0,
    storage: systemMetrics?.storage?.usage || 0
  };
  
  return (
    <div className="space-y-6">
      {/* Document Processing */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-white">Document Ingestion</h4>
          <span className="px-2 py-1 bg-green-900/20 text-green-400 text-xs rounded">
            {documentMetrics.success > 95 ? 'Active' : 'Warning'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
          <div>Processed: {documentMetrics.processed.toLocaleString()}</div>
          <div>Queue: {documentMetrics.queue}</div>
          <div>Avg Time: {(documentMetrics.avgTime * 1000).toFixed(0)}ms</div>
          <div>Success: {documentMetrics.success.toFixed(1)}%</div>
        </div>
      </div>
      
      {/* System Resources with Progress Bars */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-white">CPU</h4>
          <span className="text-xs text-gray-400">{systemResources.cpu.toFixed(1)}%</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-orange-400 h-2 rounded-full transition-all duration-300" 
            style={{width: `${systemResources.cpu}%`}}
          ></div>
        </div>
      </div>
    </div>
  );
};
```

## Phase 4: Data Flow Integration

### 4.1 Update WebSocket Message Handling
```javascript
// frontend/src/services/realTimePipelineService.js
handleMessage(data) {
  console.log('📊 Received WebSocket data:', data);
  
  if (data.type === 'system_metrics') {
    this.updateSystemMetrics(data.data);
  } else if (data.type === 'application_metrics') {
    this.updateApplicationMetrics(data.data);
  }
  
  this.notifyListeners('data', this.metrics);
}

updateApplicationMetrics(data) {
  if (data.query_metrics) {
    this.metrics.pipelineStatus = {
      queriesPerMinute: data.query_metrics.queries_per_minute,
      avgResponseTime: data.query_metrics.avg_response_time,
      activeQueries: data.query_metrics.active_queries
    };
  }
  
  if (data.document_metrics) {
    this.metrics.documentProcessing = {
      documentsProcessed: data.document_metrics.documents_processed,
      chunksGenerated: data.document_metrics.chunks_generated,
      embeddingsGenerated: data.document_metrics.embeddings_generated,
      vectorsStored: data.document_metrics.vectors_stored,
      avgProcessingTime: data.document_metrics.avg_processing_time,
      successRate: data.document_metrics.success_rate
    };
  }
}
```

## Implementation Priority

### High Priority (Week 1)
1. ✅ System metrics (CPU, Memory, GPU, Storage)
2. ✅ Basic application counters
3. ✅ WebSocket integration
4. ✅ Frontend UI updates

### Medium Priority (Week 2)
1. 🔄 Query processing metrics
2. 🔄 Document processing metrics
3. 🔄 Response time tracking
4. 🔄 Success rate calculation

### Low Priority (Week 3+)
1. ⏳ Accuracy metrics
2. ⏳ Quality scoring
3. ⏳ Predictive analytics
4. ⏳ Alerting system

## Next Steps

1. **Start with System Metrics**: Implement CPU, Memory, GPU, Storage monitoring
2. **Create Backend Service**: Build metrics collection service
3. **Update WebSocket**: Stream real metrics to frontend
4. **Update Frontend**: Connect real data to UI components
5. **Add Application Metrics**: Track query and document processing
6. **Test and Optimize**: Ensure performance and accuracy

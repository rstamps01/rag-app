# Enhanced Pipeline Visualization - Integration Guide

## 🎯 **Overview**

This guide shows how to integrate the enhanced React Flow pipeline visualization with VAST Data branding into your RAG application. The implementation provides real-time monitoring, interactive visualizations, and professional styling.

## 📁 **Files Overview**

### **Core Components**
- `PipelineGraph.jsx` - Enhanced React Flow visualization component
- `usePipelineFlow.jsx` - Real-time data integration hook
- `EnhancedPipelineDashboard.jsx` - Complete dashboard implementation
- `pipeline-visualization.css` - VAST Data styling system

### **Integration Points**
- WebSocket data from `/ws/pipeline-monitoring`
- Existing monitoring infrastructure
- UI component library (shadcn/ui)

## 🚀 **Quick Start**

### **1. Import the Enhanced Components**

```jsx
// In your main dashboard or monitoring page
import EnhancedPipelineDashboard from './components/EnhancedPipelineDashboard';
import PipelineGraph from './components/PipelineGraph';
import usePipelineFlow from './hooks/usePipelineFlow';
import './styles/pipeline-visualization.css';
```

### **2. Basic Implementation**

```jsx
// Replace your existing pipeline visualization
function MonitoringPage() {
  return (
    <div className="monitoring-container">
      <EnhancedPipelineDashboard />
    </div>
  );
}
```

### **3. Custom Implementation**

```jsx
// For custom integration with existing components
function CustomPipelineView() {
  const {
    nodes,
    edges,
    selectedNodeId,
    handleNodeClick,
    handleNodeHover,
    isConnected,
    pipelineStats
  } = usePipelineFlow('/ws/pipeline-monitoring', {
    debug: true
  });

  return (
    <div className="custom-pipeline-container">
      <div className="connection-status">
        {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
      </div>
      
      <PipelineGraph
        stages={nodes.map(node => node.data)}
        edges={edges}
        onNodeClick={handleNodeClick}
        onNodeHover={handleNodeHover}
        selectedNodeId={selectedNodeId}
        showTooltips={true}
        realTimeData={pipelineStats}
      />
    </div>
  );
}
```

## 🔧 **Configuration Options**

### **usePipelineFlow Hook Options**

```jsx
const options = {
  onNodeClick: (event, node) => {
    console.log('Node clicked:', node);
    // Custom click handling
  },
  onNodeHover: (event, node) => {
    console.log('Node hovered:', node);
    // Custom hover handling
  },
  debug: true, // Enable debug logging
  websocketUrl: '/ws/pipeline-monitoring' // Custom WebSocket URL
};
```

### **PipelineGraph Component Props**

```jsx
<PipelineGraph
  stages={stages}                    // Array of pipeline stages
  edges={edges}                      // Array of connections
  onNodeClick={handleNodeClick}      // Node click handler
  onNodeHover={handleNodeHover}      // Node hover handler
  selectedNodeId={selectedNodeId}    // Currently selected node
  showTooltips={true}                // Enable/disable tooltips
  realTimeData={realTimeData}        // Real-time data for updates
/>
```

## 🎨 **Styling Customization**

### **CSS Variables**

The styling system uses CSS variables for easy customization:

```css
:root {
  --vast-primary: #00D4AA;      /* Teal/Green */
  --vast-secondary: #0066CC;    /* Blue */
  --vast-accent: #FF6B35;       /* Orange */
  --vast-neutral: #2C3E50;      /* Dark Blue-Grey */
  --vast-light: #F8F9FA;        /* Light Grey */
  --vast-dark: #1A1A1A;         /* Dark Background */
}
```

### **Custom Node Styling**

```css
/* Override node colors */
.vast-node.query-input {
  background: linear-gradient(135deg, var(--node-query), var(--node-query)dd);
}

.vast-node.vector-search {
  background: linear-gradient(135deg, var(--node-process), var(--node-process)dd);
}

.vast-node.llm-processing {
  background: linear-gradient(135deg, var(--node-resource), var(--node-resource)dd);
}
```

## 📊 **Data Integration**

### **WebSocket Data Format**

The system expects WebSocket data in this format:

```json
{
  "type": "metrics_update",
  "data": {
    "system_health": {
      "cpu_percent": 45.2,
      "memory_percent": 67.8,
      "memory_available": "8.2GB"
    },
    "gpu_performance": [
      {
        "utilization": 85.3,
        "memory_used": 18432,
        "memory_total": 24576,
        "temperature": 72
      }
    ],
    "pipeline_status": {
      "queries_per_minute": 12,
      "avg_response_time": 2.5,
      "active_queries": 3
    },
    "connection_status": {
      "websocket_connections": 2,
      "backend_status": "connected",
      "database_status": "connected",
      "vector_db_status": "connected"
    }
  }
}
```

### **Custom Data Transformation**

```jsx
// Custom data transformation
const customTransformToPipelineData = (rawMetrics) => {
  // Your custom transformation logic
  return {
    nodes: transformedNodes,
    edges: transformedEdges
  };
};

// Use with hook
const { nodes, edges } = usePipelineFlow('/ws/pipeline-monitoring', {
  transformData: customTransformToPipelineData
});
```

## 🔄 **Real-time Updates**

### **Automatic Updates**

The system automatically updates when WebSocket data changes:

```jsx
// Real-time updates are handled automatically
const { pipelineStats } = usePipelineFlow('/ws/pipeline-monitoring');

// pipelineStats updates automatically with:
// - totalQueries
// - avgResponseTime
// - activeQueries
// - cpuUsage
// - memoryUsage
// - gpuUtilization
// - gpuTemperature
// - isConnected
```

### **Manual Refresh**

```jsx
// Force refresh if needed
const { pipelineStats, refresh } = usePipelineFlow('/ws/pipeline-monitoring');

// Call refresh() to force data update
<button onClick={refresh}>Refresh Data</button>
```

## 🎯 **Advanced Features**

### **Custom Node Types**

```jsx
// Define custom node types
const customNodeTypes = {
  customNode: CustomNodeComponent,
  // ... other custom types
};

// Use in PipelineGraph
<PipelineGraph
  nodeTypes={customNodeTypes}
  // ... other props
/>
```

### **Custom Edge Types**

```jsx
// Define custom edge types
const customEdgeTypes = {
  customEdge: CustomEdgeComponent,
  // ... other custom types
};

// Use in PipelineGraph
<PipelineGraph
  edgeTypes={customEdgeTypes}
  // ... other props
/>
```

## 🐛 **Troubleshooting**

### **Common Issues**

1. **WebSocket Connection Issues**
   ```jsx
   // Check connection status
   const { isConnected, connectionStatus } = usePipelineFlow('/ws/pipeline-monitoring');
   console.log('Connected:', isConnected, 'Status:', connectionStatus);
   ```

2. **Data Not Updating**
   ```jsx
   // Enable debug mode
   const { pipelineData } = usePipelineFlow('/ws/pipeline-monitoring', {
     debug: true
   });
   ```

3. **Styling Issues**
   ```jsx
   // Ensure CSS is imported
   import './styles/pipeline-visualization.css';
   ```

### **Debug Mode**

Enable debug mode for detailed logging:

```jsx
const { nodes, edges, pipelineData } = usePipelineFlow('/ws/pipeline-monitoring', {
  debug: true // Enables console logging
});
```

## 📱 **Responsive Design**

The visualization automatically adapts to different screen sizes:

- **Desktop**: Full feature set with detailed tooltips
- **Tablet**: Optimized layout with touch-friendly interactions
- **Mobile**: Compact view with essential information

## 🔒 **Performance Considerations**

### **Optimization Tips**

1. **Limit Real-time Updates**: The system automatically throttles updates
2. **Use Memoization**: Components are optimized with React.memo
3. **Efficient Rendering**: Only changed nodes/edges are re-rendered

### **Memory Management**

```jsx
// Cleanup on unmount
useEffect(() => {
  return () => {
    // Cleanup is handled automatically
  };
}, []);
```

## 🚀 **Next Steps**

1. **Test Integration**: Start with the basic implementation
2. **Customize Styling**: Adjust colors and animations to your needs
3. **Add Features**: Implement additional node types or custom behaviors
4. **Monitor Performance**: Use the built-in performance monitoring

## 📞 **Support**

For issues or questions:
1. Check the debug console for error messages
2. Verify WebSocket connection status
3. Ensure all required CSS is imported
4. Check data format matches expected structure

---

This enhanced pipeline visualization provides a professional, real-time monitoring solution that integrates seamlessly with your existing RAG application infrastructure.

# Modular Graph System

A modular, extensible graph visualization system for Qdrant data with support for both 2D and 3D visualizations.

## 🏗️ Architecture

### Core Components
- **`GraphContainer.jsx`** - Main orchestrator component
- **`GraphUtils.js`** - Shared utilities and helper functions
- **`GraphTypes.js`** - Graph type registry and configuration

### Module Structure
```
src/components/dashboard/graphs/
├── core/
│   ├── GraphContainer.jsx          # Main container with shared UI
│   ├── GraphUtils.js               # Shared utilities
│   └── GraphTypes.js               # Graph type registry
├── modules/
│   ├── ForceDirected2D.jsx         # 2D force-directed graph
│   ├── ForceDirected3D.jsx         # 3D force-directed graph
│   ├── DisjointForce2D.jsx         # 2D disjoint force graph
│   ├── DisjointForce3D.jsx         # 3D disjoint force graph
│   ├── ForceTree2D.jsx             # 2D force tree graph
│   ├── ForceTree3D.jsx             # 3D force tree graph
│   ├── QdrantNative2D.jsx          # 2D Qdrant native graph
│   ├── QdrantNative3D.jsx          # 3D Qdrant native graph
│   ├── HierarchicalCluster2D.jsx   # 2D hierarchical cluster
│   ├── HierarchicalCluster3D.jsx   # 3D hierarchical cluster
│   ├── AutoColored3D.jsx           # 3D auto-colored graph
│   ├── Highlight3D.jsx             # 3D highlight nodes/links
│   ├── PauseResume3D.jsx           # 3D pause/resume animation
│   └── ClickFocus3D.jsx            # 3D click-to-focus
└── ModularGraphDemo.jsx            # Demo integration
```

## 🚀 Usage

### Basic Usage
```jsx
import GraphContainer from './core/GraphContainer';

<GraphContainer
  collectionName="rag"
  qdrantBaseUrl="http://localhost:6333"
  height="500px"
  fullWidth={false}
  graphData={graphData}
  isLoading={isLoading}
  error={error}
  onRefresh={fetchGraphData}
  visualizationSettings={visualizationSettings}
  setVisualizationSettings={setVisualizationSettings}
  settings={settings}
  setSettings={setSettings}
  // ... other props
/>
```

### Demo Integration
```jsx
import ModularGraphDemo from './ModularGraphDemo';

<ModularGraphDemo
  collectionName="rag"
  qdrantBaseUrl="http://localhost:6333"
  height="500px"
  fullWidth={false}
/>
```

## 📊 Available Graph Types

### 2D Graphs
- **Force-Directed (2D)** - Standard D3 force-directed layout
- **Disjoint Force (2D)** - Prevents detached subgraphs from escaping
- **Force Tree (2D)** - Tree-like hierarchy with force-directed positioning
- **Qdrant Native (2D)** - Replicates Qdrant dashboard visualization style
- **Hierarchical Cluster (2D)** - Document hierarchy and semantic clustering

### 3D Graphs
- **Force-Directed (3D)** - 3D force-directed layout with depth
- **Disjoint Force (3D)** - 3D layout preventing detached subgraphs
- **Force Tree (3D)** - 3D tree hierarchy with force-directed positioning
- **Qdrant Native (3D)** - 3D Qdrant dashboard visualization style
- **Hierarchical Cluster (3D)** - 3D document hierarchy and clustering
- **Auto-Colored (3D)** - 3D with automatic color assignment
- **Highlight (3D)** - 3D with advanced highlighting capabilities
- **Pause/Resume (3D)** - 3D with pause/resume animation controls
- **Click-to-Focus (3D)** - 3D with click-to-focus camera controls

## 🔧 Adding New Graph Modules

### 1. Create Module Component
```jsx
// modules/MyCustom3D.jsx
import React, { useRef, useEffect } from 'react';
import ForceGraph3D from 'react-force-graph-3d';
import { createCommonEventHandlers, createCommonGraphProps } from '../core/GraphUtils';

const MyCustom3D = ({ 
  graphData, 
  visualizationSettings, 
  settings, 
  onNodeClick, 
  onNodeHover, 
  // ... other props
  width = 800, 
  height = 500,
  ...props 
}) => {
  const graphRef = useRef();

  // Custom implementation
  const createNodeObject = (node) => {
    // Custom 3D node rendering
  };

  const eventHandlers = createCommonEventHandlers({
    onNodeClick,
    onNodeHover,
    // ... other handlers
  });

  const graphProps = createCommonGraphProps({
    ref: graphRef,
    graphData,
    // ... other props
    width,
    height,
    ...props
  });

  return (
    <ForceGraph3D
      {...graphProps}
      {...eventHandlers}
      nodeThreeObject={createNodeObject}
      // ... other custom props
    />
  );
};

export default MyCustom3D;
```

### 2. Register in GraphTypes.js
```jsx
// core/GraphTypes.js
import MyCustom3D from '../modules/MyCustom3D';

export const GRAPH_TYPES = {
  // ... existing types
  'my-custom-3d': {
    id: 'my-custom-3d',
    name: 'My Custom 3D',
    description: 'Custom 3D graph with special features',
    component: MyCustom3D,
    dimension: '3D',
    category: 'custom',
    enabled: true,
    settings: {
      showClustering: true,
      showAnimations: true,
      enableFiltering: true
    }
  }
};
```

### 3. Enable/Disable Module
```jsx
import { setGraphTypeEnabled } from './core/GraphTypes';

// Enable module
setGraphTypeEnabled('my-custom-3d', true);

// Disable module
setGraphTypeEnabled('my-custom-3d', false);
```

## 🎯 Key Features

### Modular Design
- **Static Imports** - All modules included in build
- **Enable/Disable** - Dynamic module activation
- **Consistent API** - Same interface across all modules
- **Shared Utilities** - Common functions and helpers

### 3D Specialized Modules
- **Highlight3D** - Advanced node/link highlighting
- **PauseResume3D** - Animation control with speed adjustment
- **ClickFocus3D** - Camera focus with smooth transitions
- **AutoColored3D** - Automatic color assignment based on properties

### Extensibility
- **Easy to Add** - Simple module creation pattern
- **Easy to Remove** - Disable modules without code changes
- **Future Libraries** - Ready for additional 3D libraries
- **Custom Settings** - Module-specific configuration options

## 🔄 Migration from Existing System

The modular system is designed to be a drop-in replacement for the existing QdrantGraph component:

1. **Replace Import**:
   ```jsx
   // Old
   import QdrantGraph from './QdrantGraph';
   
   // New
   import GraphContainer from './graphs/core/GraphContainer';
   ```

2. **Update Props**:
   ```jsx
   // Old props work with new system
   <GraphContainer
     collectionName={collectionName}
     qdrantBaseUrl={qdrantBaseUrl}
     height={height}
     fullWidth={fullWidth}
     // ... existing props
   />
   ```

3. **Add New Graph Types**:
   ```jsx
   // New graph types available
   visualizationSettings.graphType = 'highlight-3d';
   visualizationSettings.graphType = 'pause-resume-3d';
   visualizationSettings.graphType = 'click-focus-3d';
   ```

## 📚 Dependencies

### Required Libraries
- `react-force-graph-2d` - 2D graph rendering
- `react-force-graph-3d` - 3D graph rendering
- `three` - 3D graphics library
- `three-spritetext` - 3D text rendering
- `d3` - Data visualization and force simulation

### Optional Libraries (Future)
- Additional 3D libraries can be added as needed
- Custom rendering libraries for specialized visualizations
- Animation libraries for enhanced effects

## 🎨 Customization

### Node Rendering
```jsx
const createNodeObject = (node) => {
  const size = generateNodeSize(node, visualizationSettings, settings);
  const color = getNodeColor(node);
  
  // Custom 3D geometry
  const geometry = new THREE.SphereGeometry(size / 2, 16, 12);
  const material = new THREE.MeshLambertMaterial({ color });
  return new THREE.Mesh(geometry, material);
};
```

### Link Rendering
```jsx
const createLinkObject = (link) => {
  if (!visualizationSettings.showInterconnectivity) return null;
  
  const sprite = new SpriteText(link.label || `${link.source.id} → ${link.target.id}`);
  sprite.color = '#fff';
  sprite.textHeight = 4;
  return sprite;
};
```

### Event Handling
```jsx
const eventHandlers = createCommonEventHandlers({
  onNodeClick: (node) => {
    // Custom node click handling
  },
  onNodeHover: (node) => {
    // Custom hover effects
  },
  // ... other events
});
```

## 🚀 Future Enhancements

### Planned Features
- **Module Management UI** - Visual interface for enabling/disabling modules
- **Custom Module Builder** - Drag-and-drop module creation
- **Performance Optimization** - Lazy loading and code splitting
- **Advanced 3D Effects** - Particle systems, lighting, shadows
- **Real-time Updates** - WebSocket integration for live data
- **Export Capabilities** - Save graphs as images or 3D models

### Extension Points
- **Custom Force Algorithms** - Add new D3 force configurations
- **Custom Layouts** - Implement specialized graph layouts
- **Custom Interactions** - Add unique interaction patterns
- **Custom Styling** - Advanced theming and styling options

## 📝 License

This modular graph system is part of the RAG application and follows the same licensing terms.

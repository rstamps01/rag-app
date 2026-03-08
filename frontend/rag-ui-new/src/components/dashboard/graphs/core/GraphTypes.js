/**
 * Graph Type Registry
 * Central registry for all available graph types and their configurations
 */

// Import all graph modules
import ForceDirected2D from '../modules/ForceDirected2D';
import ForceDirected3D from '../modules/ForceDirected3D';
import DisjointForce2D from '../modules/DisjointForce2D';
import DisjointForce3D from '../modules/DisjointForce3D';
import ForceTree2D from '../modules/ForceTree2D';
import ForceTree3D from '../modules/ForceTree3D';
import QdrantNative2D from '../modules/QdrantNative2D';
import QdrantNative3D from '../modules/QdrantNative3D';
import HierarchicalCluster2D from '../modules/HierarchicalCluster2D';
import HierarchicalCluster3D from '../modules/HierarchicalCluster3D';
import AutoColored3D from '../modules/AutoColored3D';
import Highlight3D from '../modules/Highlight3D';
import PauseResume3D from '../modules/PauseResume3D';
import ClickFocus3D from '../modules/ClickFocus3D';
// Enhanced variants for Graph Layout v2
import ForceDirected2DArrows from '../modules/ForceDirected2DArrows';
import ForceDirected2DText from '../modules/ForceDirected2DText';
import ForceDirected2DCurved from '../modules/ForceDirected2DCurved';
import ForceDirected3DCollision from '../modules/ForceDirected3DCollision';

// Graph type definitions
export const GRAPH_TYPES = {
  // 2D Graph Types
  'force-directed-2d': {
    id: 'force-directed-2d',
    name: 'Force-Directed Graph (2D)',
    description: 'Standard D3 force-directed layout with natural clustering',
    component: ForceDirected2D,
    dimension: '2D',
    category: 'basic',
    enabled: true,
    settings: {
      showClustering: true,
      showAnimations: true,
      enableFiltering: true
    }
  },
  'disjoint-force-2d': {
    id: 'disjoint-force-2d',
    name: 'Disjoint Force-Directed (2D)',
    description: 'Prevents detached subgraphs from escaping viewport',
    component: DisjointForce2D,
    dimension: '2D',
    category: 'basic',
    enabled: true,
    settings: {
      showClustering: false,
      showAnimations: true,
      enableFiltering: true
    }
  },
  'force-tree-2d': {
    id: 'force-tree-2d',
    name: 'Force-Directed Tree (2D)',
    description: 'Tree-like hierarchy with force-directed positioning',
    component: ForceTree2D,
    dimension: '2D',
    category: 'hierarchical',
    enabled: true,
    settings: {
      showClustering: true,
      showAnimations: true,
      enableFiltering: false
    }
  },
  'qdrant-native-2d': {
    id: 'qdrant-native-2d',
    name: 'Qdrant Native Style (2D)',
    description: 'Replicates Qdrant dashboard visualization style',
    component: QdrantNative2D,
    dimension: '2D',
    category: 'specialized',
    enabled: true,
    settings: {
      showClustering: false,
      showAnimations: true,
      enableFiltering: false,
      hubSpokeMode: true
    }
  },
  'hierarchical-cluster-2d': {
    id: 'hierarchical-cluster-2d',
    name: 'Hierarchical Clustering (2D)',
    description: 'Shows document hierarchy and semantic clustering',
    component: HierarchicalCluster2D,
    dimension: '2D',
    category: 'hierarchical',
    enabled: true,
    settings: {
      showClustering: true,
      showAnimations: true,
      enableFiltering: true
    }
  },
  
  // Enhanced 2D Graph Types (Graph Layout v2)
  'force-directed-2d-arrows': {
    id: 'force-directed-2d-arrows',
    name: 'Force-Directed with Arrows (2D)',
    description: 'Shows relationship direction with arrows. Best for semantic similarity flows.',
    component: ForceDirected2DArrows,
    dimension: '2D',
    category: 'enhanced',
    enabled: true,
    settings: {
      showClustering: true,
      showAnimations: true,
      enableFiltering: true,
      showArrows: true
    }
  },
  'force-directed-2d-text': {
    id: 'force-directed-2d-text',
    name: 'Force-Directed with Text Nodes (2D)',
    description: 'Displays document/chunk names as text. Best for content exploration.',
    component: ForceDirected2DText,
    dimension: '2D',
    category: 'enhanced',
    enabled: true,
    settings: {
      showClustering: true,
      showAnimations: true,
      enableFiltering: true,
      showText: true
    }
  },
  'force-directed-2d-curved': {
    id: 'force-directed-2d-curved',
    name: 'Force-Directed Curved (2D)',
    description: 'Uses curved lines to reduce clutter. Best for complex multi-document relationships.',
    component: ForceDirected2DCurved,
    dimension: '2D',
    category: 'enhanced',
    enabled: true,
    settings: {
      showClustering: true,
      showAnimations: true,
      enableFiltering: true,
      curvedLinks: true
    }
  },

  // 3D Graph Types
  'force-directed-3d': {
    id: 'force-directed-3d',
    name: 'Force-Directed Graph (3D)',
    description: '3D force-directed layout with depth and perspective',
    component: ForceDirected3D,
    dimension: '3D',
    category: 'basic',
    enabled: true,
    settings: {
      showClustering: true,
      showAnimations: true,
      enableFiltering: true
    }
  },
  'disjoint-force-3d': {
    id: 'disjoint-force-3d',
    name: 'Disjoint Force-Directed (3D)',
    description: '3D layout preventing detached subgraphs',
    component: DisjointForce3D,
    dimension: '3D',
    category: 'basic',
    enabled: true,
    settings: {
      showClustering: false,
      showAnimations: true,
      enableFiltering: true
    }
  },
  'force-tree-3d': {
    id: 'force-tree-3d',
    name: 'Force-Directed Tree (3D)',
    description: '3D tree hierarchy with force-directed positioning',
    component: ForceTree3D,
    dimension: '3D',
    category: 'hierarchical',
    enabled: true,
    settings: {
      showClustering: true,
      showAnimations: true,
      enableFiltering: false
    }
  },
  'qdrant-native-3d': {
    id: 'qdrant-native-3d',
    name: 'Qdrant Native Style (3D)',
    description: '3D Qdrant dashboard visualization style',
    component: QdrantNative3D,
    dimension: '3D',
    category: 'specialized',
    enabled: true,
    settings: {
      showClustering: false,
      showAnimations: true,
      enableFiltering: false,
      hubSpokeMode: true
    }
  },
  'hierarchical-cluster-3d': {
    id: 'hierarchical-cluster-3d',
    name: 'Hierarchical Clustering (3D)',
    description: '3D document hierarchy and semantic clustering',
    component: HierarchicalCluster3D,
    dimension: '3D',
    category: 'hierarchical',
    enabled: true,
    settings: {
      showClustering: true,
      showAnimations: true,
      enableFiltering: true
    }
  },
  'auto-colored-3d': {
    id: 'auto-colored-3d',
    name: 'Auto-Colored 3D',
    description: '3D visualization with automatic color assignment based on node properties',
    component: AutoColored3D,
    dimension: '3D',
    category: 'specialized',
    enabled: true,
    settings: {
      showClustering: true,
      showAnimations: true,
      enableFiltering: true
    }
  },
  
  // Enhanced 3D Graph Types (Graph Layout v2)
  'force-directed-3d-collision': {
    id: 'force-directed-3d-collision',
    name: 'Force-Directed Collision (3D)',
    description: '3D layout with collision detection. Best for large collections without overlap.',
    component: ForceDirected3DCollision,
    dimension: '3D',
    category: 'enhanced',
    enabled: true,
    settings: {
      showClustering: true,
      showAnimations: true,
      enableFiltering: true,
      collisionDetection: true
    }
  },

  // New 3D Specialized Modules
  'highlight-3d': {
    id: 'highlight-3d',
    name: 'Highlight Nodes/Links (3D)',
    description: '3D graph with advanced highlighting capabilities for nodes and links',
    component: Highlight3D,
    dimension: '3D',
    category: 'interactive',
    enabled: true,
    settings: {
      showClustering: true,
      showAnimations: true,
      enableFiltering: true,
      highlightMode: 'advanced'
    }
  },
  'pause-resume-3d': {
    id: 'pause-resume-3d',
    name: 'Pause/Resume Animation (3D)',
    description: '3D graph with pause/resume animation controls',
    component: PauseResume3D,
    dimension: '3D',
    category: 'interactive',
    enabled: true,
    settings: {
      showClustering: true,
      showAnimations: true,
      enableFiltering: true,
      animationControl: true
    }
  },
  'click-focus-3d': {
    id: 'click-focus-3d',
    name: 'Click-to-Focus (3D)',
    description: '3D graph with click-to-focus camera controls',
    component: ClickFocus3D,
    dimension: '3D',
    category: 'interactive',
    enabled: true,
    settings: {
      showClustering: true,
      showAnimations: true,
      enableFiltering: true,
      cameraControl: true
    }
  }
};

// Get all enabled graph types
export const getEnabledGraphTypes = () => {
  return Object.values(GRAPH_TYPES).filter(graphType => graphType.enabled);
};

// Get graph types by dimension
export const getGraphTypesByDimension = (dimension) => {
  return Object.values(GRAPH_TYPES).filter(graphType => 
    graphType.enabled && graphType.dimension === dimension
  );
};

// Get graph types by category
export const getGraphTypesByCategory = (category) => {
  return Object.values(GRAPH_TYPES).filter(graphType => 
    graphType.enabled && graphType.category === category
  );
};

// Get graph type by ID
export const getGraphTypeById = (id) => {
  return GRAPH_TYPES[id] || null;
};

// Enable/disable graph type
export const setGraphTypeEnabled = (id, enabled) => {
  if (GRAPH_TYPES[id]) {
    GRAPH_TYPES[id].enabled = enabled;
  }
};

// Get graph component by ID
export const getGraphComponent = (id) => {
  const graphType = getGraphTypeById(id);
  return graphType ? graphType.component : null;
};

// Get default settings for graph type
export const getDefaultSettings = (id) => {
  const graphType = getGraphTypeById(id);
  return graphType ? graphType.settings : {};
};

/**
 * Simple Graph Type Registry
 * 
 * Minimal version without complex module imports
 */

// Simple graph type definitions without imports
export const GRAPH_TYPES = {
  'force-directed-2d': {
    id: 'force-directed-2d',
    name: 'Force-Directed Graph (2D)',
    description: 'Standard D3 force-directed layout with natural clustering',
    dimension: '2D',
    category: 'basic',
    enabled: true,
    settings: {
      showClustering: true,
      showAnimations: true,
      enableFiltering: true
    }
  },
  'force-directed-3d': {
    id: 'force-directed-3d',
    name: 'Force-Directed Graph (3D)',
    description: '3D force-directed layout with depth and perspective',
    dimension: '3D',
    category: 'basic',
    enabled: true,
    settings: {
      showClustering: true,
      showAnimations: true,
      enableFiltering: true
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

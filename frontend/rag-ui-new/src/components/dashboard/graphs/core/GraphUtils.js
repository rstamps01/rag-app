/**
 * Shared utilities for all graph modules
 */

// Color generation utilities
export const generateNodeColor = (node, visualizationSettings) => {
  // Add safety check for undefined visualizationSettings
  if (!visualizationSettings) {
    console.warn('generateNodeColor: visualizationSettings is undefined, using defaults');
    visualizationSettings = { colorScheme: 'group' };
  }
  
  const { colorScheme } = visualizationSettings;
  const payload = node.payload || {};
  
  const colorPalette = {
    department: {
      'General': '#4ecdc4',
      'Engineering': '#45b7d1',
      'Marketing': '#96ceb4',
      'Sales': '#feca57',
      'HR': '#ff9ff3',
      'Finance': '#54a0ff',
      'Operations': '#5f27cd',
      'Legal': '#00d2d3',
      'IT': '#ff9f43',
      'Research': '#ff6b6b'
    },
    file_type: {
      'pdf': '#e74c3c',
      'doc': '#3498db',
      'txt': '#2ecc71',
      'html': '#f39c12',
      'json': '#9b59b6',
      'xml': '#1abc9c',
      'csv': '#34495e',
      'xlsx': '#e67e22',
      'pptx': '#95a5a6',
      'unknown': '#f1c40f'
    },
    document: {
      // Generate consistent colors based on document_id hash
    },
    chunk_index: {
      // Generate colors based on chunk index
    },
    processing_time: {
      // Generate colors based on processing time
    },
    content_length: {
      // Generate colors based on content length
    }
  };

  switch (colorScheme) {
    case 'department':
      return colorPalette.department[payload.department] || '#95a5a6';
    case 'file_type':
      return colorPalette.file_type[payload.file_type] || '#95a5a6';
    case 'document':
      // Generate consistent color based on document_id hash
      const docId = payload.document_id || node.id;
      const hash = docId.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      const hue = hash % 360;
      return `hsl(${hue}, 70%, 60%)`;
    case 'chunk_index':
      const chunkIdx = payload.chunk_index || 0;
      const chunkHue = (chunkIdx * 137.5) % 360; // Golden angle for good distribution
      return `hsl(${chunkHue}, 70%, 60%)`;
    case 'processing_time':
      const processingTime = payload.processing_time || 0;
      const timeIntensity = Math.min(processingTime / 1000, 1);
      return `hsl(${120 + timeIntensity * 120}, 70%, 60%)`;
    case 'content_length':
      const contentLength = payload.content?.length || 0;
      const lengthIntensity = Math.min(contentLength / 1000, 1);
      return `hsl(${120 + lengthIntensity * 120}, 70%, 60%)`;
    case 'group':
    default:
      // Special color for star centers ONLY in Qdrant Native layout
      if (node.isStarCenter && visualizationSettings.graphType === 'qdrant-native') {
        return '#ff6b6b'; // Bright red for star centers
      }
      // Different colors for different stars ONLY in Qdrant Native layout
      if (node.starId && visualizationSettings.graphType === 'qdrant-native') {
        const starIndex = parseInt(node.starId.split('_')[1]) || 0;
        const colors = ['#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff'];
        return colors[starIndex % colors.length];
      }
      // Enhanced color scheme for clustering
      const group = node.group || 0;
      const palette = [
        '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', 
        '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43', '#ff6b6b', '#4ecdc4'
      ];
      return palette[group % palette.length];
  }
};

// Node size generation utilities
export const generateNodeSize = (node, visualizationSettings, settings) => {
  // Add safety check for undefined visualizationSettings
  if (!visualizationSettings) {
    console.warn('generateNodeSize: visualizationSettings is undefined, using defaults');
    visualizationSettings = { sizeMode: 'fixed' };
  }
  if (!settings) {
    console.warn('generateNodeSize: settings is undefined, using defaults');
    settings = { nodeSize: 3 };
  }
  
  const { sizeMode } = visualizationSettings;
  const payload = node.payload || {};
  const baseSize = settings.nodeSize;
  
  // Make star centers larger ONLY in Qdrant Native layout
  if (node.isStarCenter && visualizationSettings.graphType === 'qdrant-native') {
    return baseSize * 2.0; // Star centers are 2x larger
  }
  
  switch (sizeMode) {
    case 'content_length':
      const contentLength = payload.content?.length || 0;
      const lengthMultiplier = Math.min(1 + (contentLength / 2000), 3);
      return baseSize * lengthMultiplier;
    case 'chunk_index':
      const chunkIndex = payload.chunk_index || 0;
      return baseSize * (1 + chunkIndex * 0.1);
    case 'department':
      const deptSizes = {
        'Engineering': 1.5,
        'Marketing': 1.2,
        'Sales': 1.3,
        'HR': 1.0,
        'Finance': 1.1,
        'Operations': 1.4,
        'Legal': 0.9,
        'IT': 1.6,
        'Research': 1.7,
        'General': 1.0
      };
      return baseSize * (deptSizes[payload.department] || 1.0);
    case 'file_type':
      const fileTypeSizes = {
        'pdf': 1.3,
        'doc': 1.1,
        'txt': 0.8,
        'html': 1.0,
        'json': 1.2,
        'xml': 1.1,
        'csv': 0.9,
        'xlsx': 1.4,
        'pptx': 1.5,
        'unknown': 1.0
      };
      return baseSize * (fileTypeSizes[payload.file_type] || 1.0);
    case 'fixed':
    default:
      return baseSize;
  }
};

// Node label generation utilities
export const generateNodeLabel = (node, visualizationSettings) => {
  const { labelMode } = visualizationSettings;
  const payload = node.payload || {};
  
  switch (labelMode) {
    case 'filename':
      return payload.filename || String(node.id || '').substring(0, 20);
    case 'chunk_index':
      return `Chunk ${payload.chunk_index || 0}`;
    case 'document_id':
      return `Doc ${payload.document_id || 'Unknown'}`;
    case 'department':
      return payload.department || 'Unknown';
    case 'file_type':
      return payload.file_type || 'Unknown';
    case 'content_preview':
      const content = payload.content || '';
      return content.substring(0, 30) + (content.length > 30 ? '...' : '');
    case 'combined':
      const filename = payload.filename || 'Unknown';
      const dept = payload.department || 'Unknown';
      return `${filename} (${dept})`;
    default:
      return String(node.id || '').substring(0, 20);
  }
};

// Similarity calculation utilities
export const calculateNodeSimilarity = (node1, node2) => {
  if (!node1.payload || !node2.payload) return 0;
  
  const payload1 = node1.payload;
  const payload2 = node2.payload;
  
  let similarity = 0;
  let factors = 0;
  
  // Department similarity
  if (payload1.department && payload2.department) {
    similarity += payload1.department === payload2.department ? 0.3 : 0;
    factors++;
  }
  
  // File type similarity
  if (payload1.file_type && payload2.file_type) {
    similarity += payload1.file_type === payload2.file_type ? 0.2 : 0;
    factors++;
  }
  
  // Document ID similarity (same document = high similarity)
  if (payload1.document_id && payload2.document_id) {
    similarity += payload1.document_id === payload2.document_id ? 0.8 : 0;
    factors++;
  }
  
  // Chunk index proximity (closer chunks = higher similarity)
  if (payload1.chunk_index !== undefined && payload2.chunk_index !== undefined) {
    const chunkDiff = Math.abs(payload1.chunk_index - payload2.chunk_index);
    const chunkSimilarity = Math.max(0, 1 - (chunkDiff / 10));
    similarity += chunkSimilarity * 0.3;
    factors++;
  }
  
  // Content length similarity
  if (payload1.content && payload2.content) {
    const len1 = payload1.content.length;
    const len2 = payload2.content.length;
    const lengthDiff = Math.abs(len1 - len2) / Math.max(len1, len2);
    similarity += (1 - lengthDiff) * 0.1;
    factors++;
  }
  
  return factors > 0 ? similarity / factors : 0;
};

// Auto color generation for 3D graphs
export const generateAutoColor = (node, index, totalNodes, visualizationSettings) => {
  const { colorScheme } = visualizationSettings;
  const payload = node.payload || {};

  const colorPalettes = {
    'group': ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43'],
    'department': ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#34495e', '#e67e22', '#95a5a6', '#f1c40f'],
    'file_type': ['#ff4757', '#3742fa', '#2ed573', '#ffa502', '#ff6348', '#5352ed', '#ff3838', '#2f3542', '#ff6b6b', '#5f27cd'],
    'document': ['#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43', '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'],
    'chunk_index': ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57', '#ff9ff3', '#54a0ff', '#5f27cd', '#00d2d3', '#ff9f43']
  };

  const palette = colorPalettes[colorScheme] || colorPalettes['group'];

  let colorIndex = 0;
  switch (colorScheme) {
    case 'group':
      colorIndex = (node.group || 0) % palette.length;
      break;
    case 'department':
      const dept = payload.department || 'unknown';
      colorIndex = dept.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % palette.length;
      break;
    case 'file_type':
      const fileType = payload.file_type || 'unknown';
      colorIndex = fileType.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % palette.length;
      break;
    case 'document':
      const docId = payload.document_id || node.id;
      colorIndex = docId.toString().split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % palette.length;
      break;
    case 'chunk_index':
      const chunkIdx = payload.chunk_index || 0;
      colorIndex = chunkIdx % palette.length;
      break;
    default:
      colorIndex = index % palette.length;
  }

  return palette[colorIndex];
};

// Common event handlers
export const createCommonEventHandlers = (handlers) => {
  return {
    onNodeClick: handlers.onNodeClick || (() => {}),
    onNodeHover: handlers.onNodeHover || (() => {}),
    onNodeDrag: handlers.onNodeDrag || (() => {}),
    onNodeDragEnd: handlers.onNodeDragEnd || (() => {}),
    onBackgroundClick: handlers.onBackgroundClick || (() => {}),
    onLinkClick: handlers.onLinkClick || (() => {}),
    onLinkHover: handlers.onLinkHover || (() => {})
  };
};

// Common graph props
export const createCommonGraphProps = (props) => {
  return {
    ref: props.ref,
    graphData: props.graphData,
    nodeLabel: props.nodeLabel || '',
    nodeColor: props.nodeColor || (() => '#666'),
    nodeVal: props.nodeVal || (() => 1),
    linkColor: props.linkColor || (() => '#666'),
    linkWidth: props.linkWidth || (() => 1),
    linkDirectionalArrowLength: props.linkDirectionalArrowLength || 0,
    linkDirectionalArrowRelPos: props.linkDirectionalArrowRelPos || 1,
    width: props.width || 800,
    height: props.height || 500,
    ...props
  };
};

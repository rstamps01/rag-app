/**
 * Similarity Calculation Utilities
 * 
 * Implements different similarity modes for graph visualization
 */

// Cosine similarity calculation
export const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
  
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  if (normA === 0 || normB === 0) return 0;
  
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

// Euclidean distance calculation
export const euclideanDistance = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length) return Infinity;
  
  let sum = 0;
  for (let i = 0; i < vecA.length; i++) {
    sum += Math.pow(vecA[i] - vecB[i], 2);
  }
  
  return Math.sqrt(sum);
};

// Jaccard similarity for sets
export const jaccardSimilarity = (setA, setB) => {
  if (!setA || !setB) return 0;
  
  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  
  return intersection.size / union.size;
};

// Generate base links for structural similarity calculation
// This creates initial links using semantic similarity so structural similarity has something to work with
export const generateBaseLinksForStructural = (nodes, threshold = 0.3) => {
  const baseLinks = [];
  
  // Generate links using semantic similarity (embeddings or content) as a base
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      let similarity = 0;
      
      // Try semantic similarity first (embeddings)
      if (nodes[i].embedding && nodes[j].embedding) {
        similarity = cosineSimilarity(nodes[i].embedding, nodes[j].embedding);
      } 
      // Fallback to content similarity
      else if (nodes[i].content && nodes[j].content) {
        similarity = calculateTextSimilarity(nodes[i].content, nodes[j].content);
      }
      
      // Create base link if similarity meets threshold
      if (similarity >= threshold) {
        baseLinks.push({
          id: `base-${nodes[i].id}-${nodes[j].id}`,
          source: nodes[i].id,
          target: nodes[j].id,
          similarity: similarity,
          type: 'base-structural'
        });
      }
    }
  }
  
  return baseLinks;
};

// Structural similarity based on graph connections
export const structuralSimilarity = (nodeA, nodeB, graphData) => {
  if (!nodeA || !nodeB || !graphData) return 0;
  
  // If no links exist, structural similarity cannot be calculated
  if (!graphData.links || graphData.links.length === 0) return 0;
  
  const connectionsA = graphData.links.filter(link => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    return sourceId === nodeA.id || targetId === nodeA.id;
  }).length;
  
  const connectionsB = graphData.links.filter(link => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    return sourceId === nodeB.id || targetId === nodeB.id;
  }).length;
  
  const commonConnections = graphData.links.filter(link => {
    const sourceId = typeof link.source === 'object' ? link.source.id : link.source;
    const targetId = typeof link.target === 'object' ? link.target.id : link.target;
    return (sourceId === nodeA.id || targetId === nodeA.id) && 
           (sourceId === nodeB.id || targetId === nodeB.id);
  }).length;
  
  if (connectionsA === 0 && connectionsB === 0) return 0;
  
  return commonConnections / Math.max(connectionsA, connectionsB);
};

// Temporal similarity based on timestamps
export const temporalSimilarity = (nodeA, nodeB) => {
  if (!nodeA.timestamp || !nodeB.timestamp) return 0;
  
  const timeA = new Date(nodeA.timestamp).getTime();
  const timeB = new Date(nodeB.timestamp).getTime();
  const timeDiff = Math.abs(timeA - timeB);
  
  // Convert to similarity (closer in time = higher similarity)
  const maxTimeDiff = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  return Math.max(0, 1 - (timeDiff / maxTimeDiff));
};

// Hybrid similarity combining multiple measures
export const hybridSimilarity = (nodeA, nodeB, graphData, weights = {}) => {
  const defaultWeights = {
    semantic: 0.4,
    structural: 0.3,
    temporal: 0.2,
    content: 0.1
  };
  
  const w = { ...defaultWeights, ...weights };
  
  let similarity = 0;
  let totalWeight = 0;
  
  // Semantic similarity (if embeddings available)
  if (nodeA.embedding && nodeB.embedding) {
    similarity += w.semantic * cosineSimilarity(nodeA.embedding, nodeB.embedding);
    totalWeight += w.semantic;
  } else if (nodeA.content && nodeB.content) {
    // Fallback to content similarity if no embeddings
    const contentSim = calculateTextSimilarity(nodeA.content, nodeB.content);
    similarity += w.semantic * contentSim;
    totalWeight += w.semantic;
  }
  
  // Structural similarity (ensure we have links for calculation)
  let workingGraphData = graphData;
  if ((!graphData.links || graphData.links.length === 0) && graphData.nodes) {
    // Generate base links for structural similarity
    const baseLinks = generateBaseLinksForStructural(graphData.nodes, 0.2);
    workingGraphData = {
      ...graphData,
      links: baseLinks
    };
  }
  const structuralSim = structuralSimilarity(nodeA, nodeB, workingGraphData);
  if (structuralSim > 0) {
    similarity += w.structural * structuralSim;
    totalWeight += w.structural;
  }
  
  // Temporal similarity
  const temporalSim = temporalSimilarity(nodeA, nodeB);
  if (temporalSim > 0) {
    similarity += w.temporal * temporalSim;
    totalWeight += w.temporal;
  }
  
  // Content similarity (if text content available and not already used for semantic)
  if (nodeA.content && nodeB.content && (!nodeA.embedding || !nodeB.embedding)) {
    const contentSim = calculateTextSimilarity(nodeA.content, nodeB.content);
    similarity += w.content * contentSim;
    totalWeight += w.content;
  }
  
  // Normalize by actual weights used (in case some components couldn't be calculated)
  if (totalWeight > 0) {
    similarity = similarity / totalWeight;
  }
  
  return Math.min(1, Math.max(0, similarity));
};

// Simple text similarity using word overlap
export const calculateTextSimilarity = (textA, textB) => {
  if (!textA || !textB) return 0;
  
  const wordsA = new Set(textA.toLowerCase().split(/\s+/));
  const wordsB = new Set(textB.toLowerCase().split(/\s+/));
  
  return jaccardSimilarity(wordsA, wordsB);
};

// Main similarity calculation function
export const calculateSimilarity = (nodeA, nodeB, graphData, mode = 'semantic', threshold = 0.5) => {
  let similarity = 0;
  
  switch (mode) {
    case 'semantic':
      if (nodeA.embedding && nodeB.embedding) {
        similarity = cosineSimilarity(nodeA.embedding, nodeB.embedding);
      } else {
        // Fallback to content similarity if no embeddings
        similarity = calculateTextSimilarity(nodeA.content || '', nodeB.content || '');
      }
      break;
      
    case 'structural':
      similarity = structuralSimilarity(nodeA, nodeB, graphData);
      break;
      
    case 'temporal':
      similarity = temporalSimilarity(nodeA, nodeB);
      break;
      
    case 'hybrid':
      similarity = hybridSimilarity(nodeA, nodeB, graphData);
      break;
      
    default:
      similarity = 0;
  }
  
  return similarity >= threshold ? similarity : 0;
};

// Generate similarity links for graph
export const generateSimilarityLinks = (nodes, graphData, mode = 'semantic', threshold = 0.5, minDistance = 20, maxDistance = 200) => {
  const links = [];
  
  // For structural mode, we need to generate base links first
  let workingGraphData = { ...graphData };
  if (mode === 'structural' && (!graphData.links || graphData.links.length === 0)) {
    // Generate base links using semantic similarity to bootstrap structural similarity
    const baseLinks = generateBaseLinksForStructural(nodes, Math.max(0.2, threshold * 0.5)); // Lower threshold for base links
    workingGraphData = {
      ...graphData,
      links: baseLinks
    };
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔧 Structural mode: Generated ${baseLinks.length} base links for structural similarity calculation`);
    }
  }
  
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const similarity = calculateSimilarity(nodes[i], nodes[j], workingGraphData, mode, threshold);
      
      if (similarity > 0) {
        // Convert similarity to distance: higher similarity = shorter distance
        // Scale from [0, 1] similarity to [minDistance, maxDistance] distance
        // Inverse relationship: similarity 1.0 -> minDistance, similarity 0.0 -> maxDistance
        const distance = maxDistance - (similarity * (maxDistance - minDistance));
        
        links.push({
          id: `similarity-${nodes[i].id}-${nodes[j].id}`,
          source: nodes[i].id,
          target: nodes[j].id,
          similarity: similarity,
          type: 'similarity',
          distance: distance, // Scaled distance based on similarity
          value: similarity
        });
      }
    }
  }
  
  return links;
};

// Filter nodes by similarity threshold
export const filterNodesBySimilarity = (nodes, targetNode, graphData, mode = 'semantic', threshold = 0.5) => {
  if (!targetNode) return nodes;
  
  return nodes.filter(node => {
    if (node.id === targetNode.id) return true;
    const similarity = calculateSimilarity(node, targetNode, graphData, mode, threshold);
    return similarity >= threshold;
  });
};

// Validate data availability for similarity modes
export const validateSimilarityData = (nodes, mode = 'semantic') => {
  const validation = {
    mode: mode,
    hasEmbeddings: 0,
    hasContent: 0,
    hasTimestamps: 0,
    hasLinks: 0,
    totalNodes: nodes.length,
    isValid: false,
    warnings: []
  };
  
  if (!nodes || nodes.length === 0) {
    validation.warnings.push('No nodes available');
    return validation;
  }
  
  // Check data availability
  nodes.forEach(node => {
    if (node.embedding && Array.isArray(node.embedding) && node.embedding.length > 0) {
      validation.hasEmbeddings++;
    }
    if (node.content && typeof node.content === 'string' && node.content.length > 0) {
      validation.hasContent++;
    }
    if (node.timestamp) {
      validation.hasTimestamps++;
    }
  });
  
  // Mode-specific validation
  switch (mode) {
    case 'semantic':
      if (validation.hasEmbeddings > 0) {
        validation.isValid = true;
      } else if (validation.hasContent > 0) {
        validation.isValid = true;
        validation.warnings.push('Using content-based similarity (embeddings not available)');
      } else {
        validation.warnings.push('No embeddings or content available for semantic similarity');
      }
      break;
      
    case 'structural':
      // Structural needs links, but we'll generate base links if needed
      validation.isValid = true;
      if (validation.hasLinks === 0) {
        validation.warnings.push('No existing links - will generate base links using semantic similarity');
      }
      break;
      
    case 'temporal':
      if (validation.hasTimestamps > 0) {
        validation.isValid = true;
      } else {
        validation.warnings.push('No timestamps available for temporal similarity');
      }
      break;
      
    case 'hybrid':
      validation.isValid = true; // Hybrid can work with any combination
      if (validation.hasEmbeddings === 0) {
        validation.warnings.push('No embeddings - semantic component will use content similarity');
      }
      if (validation.hasTimestamps === 0) {
        validation.warnings.push('No timestamps - temporal component will be 0');
      }
      break;
      
    default:
      validation.warnings.push(`Unknown similarity mode: ${mode}`);
  }
  
  return validation;
};

// Get similarity statistics
export const getSimilarityStats = (graphData, mode = 'semantic') => {
  const similarities = [];
  
  // For structural mode, ensure we have base links
  let workingGraphData = { ...graphData };
  if (mode === 'structural' && (!graphData.links || graphData.links.length === 0)) {
    const baseLinks = generateBaseLinksForStructural(graphData.nodes, 0.2);
    workingGraphData = {
      ...graphData,
      links: baseLinks
    };
  }
  
  for (let i = 0; i < graphData.nodes.length; i++) {
    for (let j = i + 1; j < graphData.nodes.length; j++) {
      const similarity = calculateSimilarity(
        graphData.nodes[i], 
        graphData.nodes[j], 
        workingGraphData, 
        mode, 
        0
      );
      if (similarity > 0) {
        similarities.push(similarity);
      }
    }
  }
  
  if (similarities.length === 0) {
    return {
      count: 0,
      average: 0,
      min: 0,
      max: 0,
      median: 0
    };
  }
  
  similarities.sort((a, b) => a - b);
  
  return {
    count: similarities.length,
    average: similarities.reduce((sum, val) => sum + val, 0) / similarities.length,
    min: similarities[0],
    max: similarities[similarities.length - 1],
    median: similarities[Math.floor(similarities.length / 2)]
  };
};

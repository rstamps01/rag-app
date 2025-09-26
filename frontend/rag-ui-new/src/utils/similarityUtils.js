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

// Structural similarity based on graph connections
export const structuralSimilarity = (nodeA, nodeB, graphData) => {
  if (!nodeA || !nodeB || !graphData) return 0;
  
  const connectionsA = graphData.links.filter(link => 
    link.source === nodeA.id || link.target === nodeA.id
  ).length;
  
  const connectionsB = graphData.links.filter(link => 
    link.source === nodeB.id || link.target === nodeB.id
  ).length;
  
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
  
  // Semantic similarity (if embeddings available)
  if (nodeA.embedding && nodeB.embedding) {
    similarity += w.semantic * cosineSimilarity(nodeA.embedding, nodeB.embedding);
  }
  
  // Structural similarity
  similarity += w.structural * structuralSimilarity(nodeA, nodeB, graphData);
  
  // Temporal similarity
  similarity += w.temporal * temporalSimilarity(nodeA, nodeB);
  
  // Content similarity (if text content available)
  if (nodeA.content && nodeB.content) {
    const contentSim = calculateTextSimilarity(nodeA.content, nodeB.content);
    similarity += w.content * contentSim;
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
export const generateSimilarityLinks = (nodes, graphData, mode = 'semantic', threshold = 0.5) => {
  const links = [];
  
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const similarity = calculateSimilarity(nodes[i], nodes[j], graphData, mode, threshold);
      
      if (similarity > 0) {
        links.push({
          id: `similarity-${nodes[i].id}-${nodes[j].id}`,
          source: nodes[i].id,
          target: nodes[j].id,
          similarity: similarity,
          type: 'similarity',
          distance: 1 - similarity, // Convert similarity to distance
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

// Get similarity statistics
export const getSimilarityStats = (graphData, mode = 'semantic') => {
  const similarities = [];
  
  for (let i = 0; i < graphData.nodes.length; i++) {
    for (let j = i + 1; j < graphData.nodes.length; j++) {
      const similarity = calculateSimilarity(
        graphData.nodes[i], 
        graphData.nodes[j], 
        graphData, 
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

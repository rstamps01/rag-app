# Similarity Modes Assessment

## Overview
This document assesses whether each similarity mode in the Visualization Controls left pane is currently calculated using real similarity types based on actual data from Qdrant.

## Available Similarity Modes

The system supports 4 similarity modes:
1. **Semantic** - Content-based similarity using embeddings
2. **Structural** - Graph structure and connections
3. **Temporal** - Time-based similarity patterns
4. **Hybrid** - Combination of multiple similarity measures

---

## Mode-by-Mode Assessment

### 1. Semantic Mode ✅ **REAL DATA**

**Status:** ✅ Fully implemented with real data

**Implementation:**
- Uses `cosineSimilarity()` function on vector embeddings from Qdrant
- Data source: `point.vector` from Qdrant (fetched with `with_vector: true`)
- Fallback: If embeddings unavailable, uses `calculateTextSimilarity()` on content text
- Content source: `point.payload?.content` or `point.payload?.text` from Qdrant

**Code Location:**
- `frontend/rag-ui-new/src/utils/similarityUtils.js` (lines 8-24, 129-140)
- `frontend/rag-ui-new/src/components/dashboard/QdrantGraphWorking.jsx` (line 260: `with_vector: true`, line 292: `embedding: point.vector`)

**Verification:**
```javascript
// In QdrantGraphWorking.jsx
embedding: point.vector || null,  // Real embeddings from Qdrant
content: point.payload?.content || point.payload?.text || '',  // Real content

// In similarityUtils.js
case 'semantic':
  if (nodeA.embedding && nodeB.embedding) {
    similarity = cosineSimilarity(nodeA.embedding, nodeB.embedding);  // Real calculation
  } else {
    similarity = calculateTextSimilarity(nodeA.content || '', nodeB.content || '');  // Real fallback
  }
```

---

### 2. Structural Mode ⚠️ **PARTIALLY FUNCTIONAL**

**Status:** ⚠️ Has implementation but circular dependency issue

**Implementation:**
- Uses `structuralSimilarity()` function which analyzes graph connections
- Calculates similarity based on:
  - Number of connections each node has
  - Common connections between nodes
  - Formula: `commonConnections / max(connectionsA, connectionsB)`

**Problem:**
- **Circular Dependency**: Structural similarity requires existing graph links to calculate similarity
- However, links are generated FROM similarity calculations
- When `processSimilarityData()` is called, it receives `originalData` with `links: []` (empty array)
- Structural similarity is calculated with empty links array, resulting in 0 similarity for all node pairs
- Links are generated AFTER similarity calculation, creating a chicken-and-egg problem

**Code Location:**
- `frontend/rag-ui-new/src/utils/similarityUtils.js` (lines 48-70)
- `frontend/rag-ui-new/src/components/dashboard/QdrantGraphWorking.jsx` (line 301: `const links = []`, line 313: `processSimilarityData(originalData)`)

**Current Behavior:**
```javascript
// In QdrantGraphWorking.jsx
const links = [];  // Empty array - no pre-existing links
const originalData = { nodes, links };
const processedData = processSimilarityData(originalData);  // Links are empty here

// In processSimilarityData
const similarityLinks = generateSimilarityLinks(...);  // Generates links based on similarity
// But structural similarity needs links to calculate similarity - circular dependency!
```

**Impact:**
- Structural mode will always return 0 similarity for all node pairs
- No links will be generated when using structural mode
- The mode appears functional but produces no results

---

### 3. Temporal Mode ✅ **REAL DATA**

**Status:** ✅ Fully implemented with real data

**Implementation:**
- Uses `temporalSimilarity()` function which compares timestamps
- Data source: `point.payload?.timestamp` from Qdrant
- Calculates time difference and converts to similarity (closer in time = higher similarity)
- Max time window: 7 days (configurable in code)

**Code Location:**
- `frontend/rag-ui-new/src/utils/similarityUtils.js` (lines 72-83)
- `frontend/rag-ui-new/src/components/dashboard/QdrantGraphWorking.jsx` (line 294: `timestamp: point.payload?.timestamp`)

**Verification:**
```javascript
// In QdrantGraphWorking.jsx
timestamp: point.payload?.timestamp || null,  // Real timestamps from Qdrant

// In similarityUtils.js
case 'temporal':
  similarity = temporalSimilarity(nodeA, nodeB);  // Real calculation
  // Uses: new Date(nodeA.timestamp).getTime() - new Date(nodeB.timestamp).getTime()
```

**Note:** Temporal similarity only works if nodes have timestamps in their payload. If timestamps are missing, similarity will be 0.

---

### 4. Hybrid Mode ✅ **REAL DATA (with structural limitation)**

**Status:** ✅ Mostly real data, but structural component has same issue as Structural mode

**Implementation:**
- Combines multiple similarity measures with weighted average:
  - Semantic: 40% weight (uses real embeddings/content)
  - Structural: 30% weight (has circular dependency issue)
  - Temporal: 20% weight (uses real timestamps)
  - Content: 10% weight (uses real text content)

**Code Location:**
- `frontend/rag-ui-new/src/utils/similarityUtils.js` (lines 85-116)

**Verification:**
```javascript
// In similarityUtils.js
export const hybridSimilarity = (nodeA, nodeB, graphData, weights = {}) => {
  const defaultWeights = {
    semantic: 0.4,    // ✅ Real embeddings
    structural: 0.3,  // ⚠️ Circular dependency issue
    temporal: 0.2,    // ✅ Real timestamps
    content: 0.1      // ✅ Real content
  };
  
  // Semantic similarity (if embeddings available)
  if (nodeA.embedding && nodeB.embedding) {
    similarity += w.semantic * cosineSimilarity(nodeA.embedding, nodeB.embedding);  // ✅ Real
  }
  
  // Structural similarity
  similarity += w.structural * structuralSimilarity(nodeA, nodeB, graphData);  // ⚠️ Issue
  
  // Temporal similarity
  similarity += w.temporal * temporalSimilarity(nodeA, nodeB);  // ✅ Real
  
  // Content similarity
  if (nodeA.content && nodeB.content) {
    similarity += w.content * calculateTextSimilarity(nodeA.content, nodeB.content);  // ✅ Real
  }
}
```

**Impact:**
- Hybrid mode will work but structural component contributes 0 (30% weight wasted)
- Effective weights become: Semantic 40%, Temporal 20%, Content 10% (70% total)
- Still produces meaningful results from the other components

---

## Summary Table

| Mode | Status | Real Data? | Issues |
|------|--------|------------|--------|
| **Semantic** | ✅ Working | ✅ Yes | None |
| **Structural** | ⚠️ Non-functional | ❌ No | Circular dependency - needs links to calculate, but links are generated from similarity |
| **Temporal** | ✅ Working | ✅ Yes | Only works if timestamps exist in payload |
| **Hybrid** | ⚠️ Partially working | ✅ Mostly | Structural component (30% weight) doesn't work due to circular dependency |

---

## Recommendations

### 1. Fix Structural Similarity Mode
**Option A: Pre-generate base links**
- Generate initial links based on metadata or other criteria before similarity calculation
- Use these base links for structural similarity calculation
- Then generate similarity links based on all modes

**Option B: Two-pass approach**
- First pass: Generate links using semantic/temporal similarity
- Second pass: Use those links for structural similarity calculation
- Regenerate links with structural component included

**Option C: Remove structural from initial calculation**
- Use structural similarity only for analysis/display purposes
- Don't use it for link generation
- Calculate it separately after links are generated

### 2. Add Data Validation
- Check if required data exists before calculating similarity
- Show warnings when modes are selected but required data is missing
- Example: "Temporal mode selected but no timestamps found in data"

### 3. Improve User Feedback
- Display which similarity components are active for each mode
- Show data availability status (embeddings, timestamps, content)
- Warn users when selected mode won't produce results

---

## Code References

- Similarity calculations: `frontend/rag-ui-new/src/utils/similarityUtils.js`
- Graph data fetching: `frontend/rag-ui-new/src/components/dashboard/QdrantGraphWorking.jsx` (lines 215-353)
- Similarity mode selection: `frontend/rag-ui-new/src/components/dashboard/EnhancedSimilarityDemo.tsx` (lines 184-189)
- Controls UI: `frontend/rag-ui-new/src/components/dashboard/EnhancedSimilarityControls.tsx`


# Qdrant Vector Database Analytics & Development URLs
## URLs Specifically for Data Ingestion Analytics

**Base URL:** `http://localhost:3000`

---

## 🎯 **Primary Qdrant Analytics URLs**

These URLs were specifically created for analyzing and visualizing data ingested into the Qdrant vector database:

### 1. **Qdrant Collection Graph** 
**URL:** `http://localhost:3000/qdrant-collection-graph`  
**Route:** `/qdrant-collection-graph`  
**Component:** `QdrantCollectionGraphPage`  
**Purpose:** Interactive vector relationship visualization  
**Features:**
- Full-screen graph visualization of vector points
- Collection selector (rag, midjourney, qdrant-docs)
- Interactive node/link exploration
- Real-time data from Qdrant collection
- Help menu with graph statistics and interaction guide
- Fullscreen mode support

**Description:** Dedicated page for visualizing relationships between document chunks stored in Qdrant. Shows semantic relationships, clustering patterns, and vector similarities.

---

### 2. **Modular Graph Test**
**URL:** `http://localhost:3000/modular-graph-test`  
**Route:** `/modular-graph-test`  
**Component:** `ModularGraphTest`  
**Purpose:** Test page for modular graph system with Qdrant data  
**Features:**
- Side-by-side comparison of modular vs demo views
- Multiple graph type testing (2D and 3D)
- Collection configuration (default: 'rag')
- Qdrant URL configuration
- Module statistics display
- Graph type selection (Force-Directed, Disjoint Force, Force Tree, Hierarchical Cluster, Qdrant Native)

**Description:** Development/testing page for the modular graph system. Allows testing different visualization algorithms with actual Qdrant vector data.

---

### 3. **Similarity Test Page**
**URL:** `http://localhost:3000/similarity-test`  
**Route:** `/similarity-test`  
**Component:** `SimilarityTestPage`  
**Purpose:** Similarity testing and visualization tools for vector data  
**Features:**
- Similarity visualization demo component
- Test suite for component loading, styling, interactions, animations
- Icon testing
- Real-time similarity analysis
- Vector point comparison
- Test status tracking

**Description:** Testing interface for similarity visualization components. Used to verify how similar document chunks are represented and visualized from Qdrant data.

---

### 4. **Similarity Dashboard**
**URL:** `http://localhost:3000/similarity-dashboard`  
**Route:** `/similarity-dashboard`  
**Component:** `SimilarityDashboardPage`  
**Purpose:** Comprehensive similarity analysis dashboard  
**Features:**
- Full similarity visualization with sidebar navigation
- Breadcrumb navigation
- Test information drawer
- Sidebar controls and metrics
- Context sheet for detailed metrics
- Similarity analysis tools

**Description:** Production-ready dashboard for analyzing document similarity patterns in ingested Qdrant data. Includes sidebar navigation and comprehensive metrics.

---

## 📊 **Secondary Qdrant Analytics URLs**

These URLs also provide Qdrant data analytics but may have broader purposes:

### 5. **Qdrant Dashboard**
**URL:** `http://localhost:3000/qdrant-dashboard`  
**Route:** `/qdrant-dashboard`  
**Component:** `QdrantReactFlowDashboard`  
**Purpose:** Vector database visualization and monitoring  
**Description:** React Flow-based visualization of Qdrant vector database with real-time monitoring capabilities.

---

### 6. **Qdrant Advanced Flow Dashboard**
**URL:** `http://localhost:3000/qdrant-advanced`  
**Route:** `/qdrant-advanced`  
**Component:** `AdvancedQdrantFlowDashboard`  
**Purpose:** Interactive React Flow visualization with real-time data  
**Description:** Advanced version of Qdrant dashboard with enhanced React Flow features and real-time data streaming.

---

### 7. **Qdrant Professional Dashboard**
**URL:** `http://localhost:3000/qdrant-professional`  
**Route:** `/qdrant-professional`  
**Component:** `ProfessionalQdrantFlowDashboard`  
**Purpose:** Professional-grade Qdrant flow dashboard  
**Description:** Enterprise-level visualization dashboard for Qdrant vector database analytics.

---

### 8. **Database Dashboard** (Includes Qdrant Analytics)
**URL:** `http://localhost:3000/database-dashboard`  
**Route:** `/database-dashboard`  
**Component:** `DatabaseDashboard`  
**Purpose:** PostgreSQL & Qdrant comprehensive analytics  
**Description:** Combined analytics dashboard that includes Qdrant collection metrics, vector statistics, and database performance data.

---

## 🔍 **Key Characteristics of Development/Analytics URLs**

### Common Features:
1. **Vector Data Visualization** - All URLs visualize vector points from Qdrant
2. **Collection Selection** - Most allow selecting different Qdrant collections
3. **Real-time Updates** - Many support real-time data streaming from Qdrant
4. **Interactive Exploration** - Click, zoom, pan capabilities for exploring vector relationships
5. **Similarity Analysis** - Focus on showing relationships between ingested documents
6. **Graph Algorithms** - Use various graph layout algorithms (Force-Directed, Hierarchical, etc.)

### Development-Specific Indicators:
- **Test/Test Page** in name (`/modular-graph-test`, `/similarity-test`)
- **Graph/Visualization** focus (not general application features)
- **Collection-specific** data display
- **Analytics-focused** rather than user-facing features
- **Multiple visualization modes** (2D, 3D, different algorithms)

---

## 📋 **Summary**

### Primary Development/Analytics URLs (4):
1. `/qdrant-collection-graph` - Main collection graph visualization
2. `/modular-graph-test` - Graph system testing
3. `/similarity-test` - Similarity testing interface
4. `/similarity-dashboard` - Similarity analysis dashboard

### Secondary Analytics URLs (4):
5. `/qdrant-dashboard` - Basic Qdrant visualization
6. `/qdrant-advanced` - Advanced Qdrant flow
7. `/qdrant-professional` - Professional Qdrant dashboard
8. `/database-dashboard` - Combined database analytics (includes Qdrant)

---

## 🎯 **Primary Focus URLs**

The **4 primary URLs** specifically created for development and analytics of Qdrant data ingestion are:

1. **`http://localhost:3000/qdrant-collection-graph`** ⭐
   - Main analytics page for vector relationships

2. **`http://localhost:3000/modular-graph-test`** ⭐
   - Development/testing for graph visualization algorithms

3. **`http://localhost:3000/similarity-test`** ⭐
   - Testing interface for similarity analysis

4. **`http://localhost:3000/similarity-dashboard`** ⭐
   - Production similarity analysis dashboard

---

**Note:** These URLs are specifically designed for analyzing and visualizing data that has been ingested into the Qdrant vector database, showing relationships, similarities, and clustering patterns between document chunks.


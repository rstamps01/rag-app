# RAG-APP-07 Frontend UI URLs
## Complete List of Available Routes

**Base URL:** `http://localhost:3000`

---

## 📋 **Main Navigation Pages**

### Core Application Pages
| URL | Route | Component | Description |
|-----|-------|-----------|-------------|
| `http://localhost:3000/` | `/` | `HomePage` | Home page with welcome message and feature cards |
| `http://localhost:3000/documents` | `/documents` | `DocumentsPage` | Document upload and management interface |
| `http://localhost:3000/queries` | `/queries` | `QueriesPage` | Query interface for asking questions and getting AI responses |
| `http://localhost:3000/admin` | `/admin` | `AdminPanel` | Administrative panel for system management |

---

## 📊 **Dashboards** (Available via "Dashboards" dropdown menu)

### Monitoring & Pipeline Dashboards
| URL | Route | Component | Description |
|-----|-------|-----------|-------------|
| `http://localhost:3000/monitoring` | `/monitoring` | `PipelineMonitoringDashboard` | Real-time pipeline monitoring with debug console |
| `http://localhost:3000/dynamic-pipeline` | `/dynamic-pipeline` | `DynamicPipelinePage` | Interactive pipeline visualization |
| `http://localhost:3000/documentation-processing` | `/documentation-processing` | `DocumentationProcessingPage` | Document processing workflow visualization |
| `http://localhost:3000/test` | `/test` | `TestPage` | Testing and development tools page |

### Qdrant Vector Database Dashboards
| URL | Route | Component | Description |
|-----|-------|-----------|-------------|
| `http://localhost:3000/qdrant-dashboard` | `/qdrant-dashboard` | `QdrantReactFlowDashboard` | Vector database visualization and monitoring |
| `http://localhost:3000/qdrant-flow` | `/qdrant-flow` | `QdrantReactFlowDashboard` | Alternative route to Qdrant Dashboard (same component) |
| `http://localhost:3000/qdrant-advanced` | `/qdrant-advanced` | `AdvancedQdrantFlowDashboard` | Interactive React Flow visualization with real-time data |
| `http://localhost:3000/qdrant-professional` | `/qdrant-professional` | `ProfessionalQdrantFlowDashboard` | Professional-grade Qdrant flow dashboard |

---

## 📈 **Analytics** (Available via "Analytics" dropdown menu)

### Graph & Visualization Pages
| URL | Route | Component | Description |
|-----|-------|-----------|-------------|
| `http://localhost:3000/qdrant-collection-graph` | `/qdrant-collection-graph` | `QdrantCollectionGraphPage` | Interactive vector relationship visualization |
| `http://localhost:3000/database-dashboard` | `/database-dashboard` | `DatabaseDashboard` | PostgreSQL & Qdrant comprehensive analytics |

### Similarity & Graph Testing Pages
| URL | Route | Component | Description |
|-----|-------|-----------|-------------|
| `http://localhost:3000/modular-graph-test` | `/modular-graph-test` | `ModularGraphTest` | Test page for modular graph system with side-by-side comparison |
| `http://localhost:3000/similarity-test` | `/similarity-test` | `SimilarityTestPage` | Similarity testing and visualization tools |
| `http://localhost:3000/similarity-dashboard` | `/similarity-dashboard` | `SimilarityDashboardPage` | Comprehensive similarity analysis dashboard |

---

## 📝 **Route Summary**

### Total Routes: **18**

**By Category:**
- **Main Navigation:** 4 routes
- **Dashboards:** 6 routes
- **Analytics:** 5 routes
- **Testing/Development:** 3 routes

---

## 🗺️ **Navigation Structure**

### Main Navigation Bar Items:
1. **Home** (`/`)
2. **Documents** (`/documents`)
3. **Queries** (`/queries`)
4. **Admin** (`/admin`)
5. **Dashboards** (Dropdown)
   - Pipeline Monitor
   - Dynamic Pipeline
   - Documentation Processing
   - Test Page
   - Qdrant Dashboard
   - Qdrant Flow Dashboard
6. **Analytics** (Dropdown)
   - Qdrant Collection Graph
   - Database Analytics

### Additional Routes (Not in Main Nav):
- `/qdrant-professional` - Professional Qdrant dashboard
- `/modular-graph-test` - Modular graph testing
- `/similarity-test` - Similarity testing
- `/similarity-dashboard` - Similarity dashboard

---

## 🔍 **Route Details**

### Component Locations:
- **Pages:** `frontend/rag-ui-new/src/pages/`
- **Components:** `frontend/rag-ui-new/src/components/pages/`
- **Dashboards:** `frontend/rag-ui-new/src/components/dashboard/`
- **Monitoring:** `frontend/rag-ui-new/src/components/monitoring/`

### Route Configuration:
- **Main Router:** `frontend/rag-ui-new/src/App.jsx`
- **Navigation:** `frontend/rag-ui-new/src/components/layout/Navbar.jsx`

---

## 📌 **Notes**

1. **Duplicate Routes:**
   - `/qdrant-dashboard` and `/qdrant-flow` both render the same component (`QdrantReactFlowDashboard`)

2. **Navigation Organization:**
   - Main navigation items are always visible
   - Dashboards are grouped in a dropdown menu
   - Analytics are grouped in a separate dropdown menu
   - Some routes are accessible directly via URL but not shown in main navigation

3. **Mobile Support:**
   - All routes are accessible via mobile menu
   - Navigation structure is responsive

4. **Route Prefixes:**
   - All routes are relative to base URL `http://localhost:3000`
   - No route requires authentication (based on current implementation)

---

**Last Updated:** Based on codebase analysis  
**Source Files:** `App.jsx`, `Navbar.jsx`


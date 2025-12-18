import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './components/pages/HomePage';
import QueriesPage from './components/pages/QueriesPage';
import DocumentsPage from './components/pages/DocumentsPage';
import PipelineMonitoringDashboard from './components/monitoring/PipelineMonitoringDashboard';
import DynamicPipelinePage from './pages/DynamicPipelinePage';
import DocumentationProcessingPage from './pages/DocumentationProcessingPage';
import TestPage from './components/TestPage';
import QdrantReactFlowDashboard from './components/dashboard/QdrantReactFlowDashboard';
import AdvancedQdrantFlowDashboard from './components/dashboard/AdvancedQdrantFlowDashboard';
import ProfessionalQdrantFlowDashboard from './components/dashboard/ProfessionalQdrantFlowDashboard';
import DatabaseDashboard from './components/dashboard/DatabaseDashboard';
import AdminPanel from './components/admin/AdminPanel';
import QdrantCollectionGraphPage from './pages/QdrantCollectionGraphPage';
import ModularGraphTest from './components/dashboard/ModularGraphTest';
import SimilarityTestPage from './pages/SimilarityTestPage';
import SimilarityDashboardPage from './pages/SimilarityDashboardPage';
import MetricsDashboardPage from './pages/MetricsDashboardPage';

// Simple test component to debug
const TestComponent = () => {
  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-4">🎯 React App Working!</h1>
      <p className="text-xl mb-4">If you can see this, React is rendering correctly.</p>
      <p className="text-lg">Current time: {new Date().toLocaleString()}</p>
      <div className="mt-8 p-4 bg-gray-800 rounded-lg">
        <h2 className="text-2xl font-semibold mb-2">Debug Info</h2>
        <p>URL: {window.location.pathname}</p>
        <p>User Agent: {navigator.userAgent}</p>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Routes that need Layout wrapper */}
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        <Route path="/queries" element={<Layout><QueriesPage /></Layout>} />
        <Route path="/documents" element={<Layout><DocumentsPage /></Layout>} />
        <Route path="/monitoring" element={<Layout><PipelineMonitoringDashboard /></Layout>} />
        <Route path="/dynamic-pipeline" element={<Layout><DynamicPipelinePage /></Layout>} />
        <Route path="/documentation-processing" element={<Layout><DocumentationProcessingPage /></Layout>} />
        <Route path="/test" element={<Layout><TestPage /></Layout>} />
        <Route path="/qdrant-dashboard" element={<Layout><QdrantReactFlowDashboard /></Layout>} />
        <Route path="/qdrant-flow" element={<Layout><QdrantReactFlowDashboard /></Layout>} />
        <Route path="/qdrant-advanced" element={<Layout><AdvancedQdrantFlowDashboard /></Layout>} />
        <Route path="/qdrant-professional" element={<Layout><ProfessionalQdrantFlowDashboard /></Layout>} />
        <Route path="/database-dashboard" element={<Layout><DatabaseDashboard /></Layout>} />
        <Route path="/qdrant-collection-graph" element={<Layout><QdrantCollectionGraphPage /></Layout>} />
        <Route path="/modular-graph-test" element={<Layout><ModularGraphTest /></Layout>} />
        <Route path="/metrics" element={<Layout><MetricsDashboardPage /></Layout>} />
        <Route path="/admin" element={<Layout><AdminPanel /></Layout>} />
        
        {/* Routes that don't need Layout wrapper (full-screen pages) */}
        <Route path="/similarity-test" element={<SimilarityTestPage />} />
        <Route path="/similarity-dashboard" element={<SimilarityDashboardPage />} />
      </Routes>
    </Router>
  );
}

export default App;

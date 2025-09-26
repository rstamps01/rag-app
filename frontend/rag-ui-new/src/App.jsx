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
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/queries" element={<QueriesPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/monitoring" element={<PipelineMonitoringDashboard />} />
          <Route path="/dynamic-pipeline" element={<DynamicPipelinePage />} />
          <Route path="/documentation-processing" element={<DocumentationProcessingPage />} />
          <Route path="/test" element={<TestPage />} />
          <Route path="/qdrant-dashboard" element={<QdrantReactFlowDashboard />} />
          <Route path="/qdrant-flow" element={<QdrantReactFlowDashboard />} />
          <Route path="/qdrant-advanced" element={<AdvancedQdrantFlowDashboard />} />
          <Route path="/qdrant-professional" element={<ProfessionalQdrantFlowDashboard />} />
          <Route path="/database-dashboard" element={<DatabaseDashboard />} />
          <Route path="/qdrant-collection-graph" element={<QdrantCollectionGraphPage />} />
          <Route path="/modular-graph-test" element={<ModularGraphTest />} />
          <Route path="/similarity-test" element={<SimilarityTestPage />} />
          <Route path="/similarity-dashboard" element={<SimilarityDashboardPage />} />
          <Route path="/admin" element={<AdminPanel />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

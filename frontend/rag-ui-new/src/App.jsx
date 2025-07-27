import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import HomePage from './components/pages/HomePage';
import QueriesPage from './components/pages/QueriesPage';
import DocumentsPage from './components/pages/DocumentsPage';
import PipelineMonitoringDashboard from './components/monitoring/PipelineMonitoringDashboard';
import TestPage from './components/monitoring/TestPage';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/queries" element={<QueriesPage />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/monitoring" element={<PipelineMonitoringDashboard />} />
          <Route path="/test" element={<TestPage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;

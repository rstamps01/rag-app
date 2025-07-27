import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import HomePage from './components/pages/HomePage';
import DocumentsPage from './components/pages/DocumentsPage';
import QueriesPage from './components/pages/QueriesPage';
import PipelineMonitoringDashboard from './components/monitoring/PipelineMonitoringDashboard';
import TestPage from './components/monitoring/TestPage';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <Router>
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/documents" element={<DocumentsPage />} />
            <Route path="/queries" element={<QueriesPage />} />
            <Route path="/monitoring" element={<PipelineMonitoringDashboard />} />
            <Route path="/testpage" element={<TestPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </Router>
    </div>
  );
}

export default App;
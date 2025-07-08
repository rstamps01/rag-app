// File Path: /home/vastdata/rag-app/frontend/rag-ui-new/src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';

// Import Page Components
import DocumentsPage from './components/pages/DocumentsPage'; // <-- Import DocumentsPage
import QueriesPage from './components/pages/QueriesPage';   // <-- Import QueriesPage
import PipelineDashboard from './components/monitoring/PipelineDashboard'; // Assuming this path is correct

function App() {
  return (
    <Router>
      <div className="App min-h-screen flex flex-col">
        {/* Header and Navigation */}
        <header className="bg-gray-800 text-white shadow-md">
          <nav className="container mx-auto px-4 py-3 flex justify-between items-center">
            <h1 className="text-xl font-bold">RAG AI Application</h1>
            <ul className="flex space-x-4">
              <li><Link to="/" className="hover:text-gray-300">Home</Link></li>
              <li><Link to="/documents" className="hover:text-gray-300">Documents</Link></li>
              <li><Link to="/queries" className="hover:text-gray-300">Queries</Link></li>
              <li><Link to="/monitoring" className="hover:text-gray-300">Pipeline Monitoring</Link></li>
            </ul>
          </nav>
        </header>

        {/* Main Content Area */}
        <main className="flex-grow container mx-auto px-4 py-6">
          <Routes>
            {/* Home Route */}
            <Route path="/" element={
              <div className="bg-white p-6 rounded shadow">
                <h2 className="text-2xl font-semibold mb-3">Welcome to your GPU-accelerated RAG AI application</h2>
                <p>Use the navigation links above to manage documents, run queries, or monitor the pipeline.</p>
              </div>
            } />
            
            {/* Documents Route - Use the new component */}
            <Route path="/documents" element={<DocumentsPage />} /> 
            
            {/* Queries Route - Use the new component */}
            <Route path="/queries" element={<QueriesPage />} />
            
            {/* Monitoring Route */}
            <Route path="/monitoring" element={<PipelineDashboard />} />
          </Routes>
        </main>

        {/* Optional Footer */}
        {/* <footer className="bg-gray-200 text-center p-4 mt-auto">
          RAG App Footer
        </footer> */}
      </div>
    </Router>
  );
}

export default App;

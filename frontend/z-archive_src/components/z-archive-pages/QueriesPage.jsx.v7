// File Path: /home/ubuntu/rag-app/frontend/rag-ui-new/src/components/pages/QueriesPage.jsx
import React, { useState } from 'react';
import api, { endpoints } from '../../lib/api'; // Adjust path if necessary

const QueriesPage = () => {
  // --- State Variables ---
  const [query, setQuery] = useState(''); // Input field state
  const [response, setResponse] = useState(null); // Stores the full response object from backend
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // --- Event Handlers ---
  const handleQueryChange = (event) => {
    setQuery(event.target.value);
  };

  // Renamed and corrected function to handle submission
  const handleSubmitQuery = async (e) => {
    // Allow form submission via button click or Enter key in textarea (optional)
    if (e) e.preventDefault(); 
    
    if (!query.trim()) {
        setError('Please enter a query.');
        return;
    }

    setIsLoading(true);
    setError('');
    setResponse(null); // Clear previous response

    try {
      // *** Corrected: Send payload with the key "query" using the component's state ***
      const payload = { query: query }; 
      const result = await api.post(endpoints.query, payload); 
      
      // Store the entire response object in state
      setResponse(result.data); 
      
    } catch (err) {
      console.error("Error submitting query:", err);
      setError(err.response?.data?.detail || err.message || "Failed to submit query");
      setResponse(null); // Clear response on error
    } finally {
      setIsLoading(false);
    }
  };

  // --- JSX Structure ---
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Ask a Question</h2>

      {/* Query Input Section - Using a form for better accessibility */}
      <form onSubmit={handleSubmitQuery} className="mb-6 p-4 border rounded shadow-sm">
        <h3 className="text-lg font-semibold mb-2">Enter your query:</h3>
        <textarea 
          value={query}
          onChange={handleQueryChange}
          rows="4"
          className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
          placeholder="Type your question about the uploaded documents here..."
          aria-label="Query Input"
        />
        <div className="mt-4 flex justify-end">
          <button 
            type="submit" // Use type="submit" within a form
            disabled={!query.trim() || isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Submit Query'}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
      </form>

      {/* Response Section */}
      {isLoading && <p role="status">Loading response...</p>}
      
      {/* Check if response object exists before accessing its properties */}
      {response && (
        <div className="p-4 border rounded shadow-sm bg-gray-50">
          <h3 className="text-lg font-semibold mb-2">Response:</h3>
          {/* Access the 'response' property for the answer text */}
          <p className="mb-4 whitespace-pre-wrap">{response.response || 'No answer provided.'}</p>
          
          {/* Check if sources exist and have items */}
          {response.sources && response.sources.length > 0 && (
            <div>
              <h4 className="text-md font-semibold mb-1">Retrieved Sources:</h4>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                {response.sources.map((source, index) => (
                  <li key={source.document_id + '-' + index} className="p-2 border-l-4 border-gray-300 bg-white rounded">
                    {/* Display source details */}
                    <p className="font-medium text-gray-700">
                      Source: {source.document_name || source.document_id} (Score: {source.relevance_score?.toFixed(2)})
                    </p>
                    <p className="italic">{source.content_snippet || 'No snippet'}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {/* Optionally display other info like processing time */} 
          {response.processing_time !== undefined && (
             <p className="text-xs text-gray-500 mt-2">Processing time: {response.processing_time}s</p>
          )}
        </div>
      )}
    </div>
  );
};

export default QueriesPage;

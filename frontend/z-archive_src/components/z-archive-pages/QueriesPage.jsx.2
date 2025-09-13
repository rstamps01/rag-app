import React, { useState } from 'react';
import api, { endpoints } from '../../lib/api'; // Adjust path if your api.js is elsewhere

const QueriesPage = () => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null); // To store the backend response object
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Handle changes in the query input textarea
  const handleQueryChange = (event) => {
    setQuery(event.target.value);
  };

    // Inside QueriesPage component
  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    if (!queryInput.trim()) return;

    setLoading(true);
    setError(null);
    setResponse(null);
    setSources([]);

    try {
      // *** Corrected: Send data in the expected JSON format ***
      const payload = { query: queryInput }; 
      const result = await api.post(endpoints.query, payload); 
      
      setResponse(result.data.response);
      setSources(result.data.sources || []);
    } catch (err) {
      console.error("Error submitting query:", err);
      setError(err.response?.data?.detail || err.message || "Failed to submit query");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Ask a Question</h2>

      {/* Query Input Section */}
      <div className="mb-6 p-4 border rounded shadow-sm">
        <h3 className="text-lg font-semibold mb-2">Enter your query:</h3>
        <textarea 
          value={query}
          onChange={handleQueryChange}
          rows="4"
          className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
          placeholder="Type your question about the uploaded documents here..."
        />
        <div className="mt-4 flex justify-end">
          <button 
            onClick={handleSubmitQuery} 
            disabled={!query.trim() || isLoading}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Processing...' : 'Submit Query'}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {/* Response Section */}
      {isLoading && <p>Loading response...</p>}
      
      {response && (
        <div className="p-4 border rounded shadow-sm bg-gray-50">
          <h3 className="text-lg font-semibold mb-2">Response:</h3>
          <p className="mb-4 whitespace-pre-wrap">{response.answer || 'No answer provided.'}</p>
          
          {response.context && response.context.length > 0 && (
            <div>
              <h4 className="text-md font-semibold mb-1">Retrieved Context:</h4>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                {response.context.map((ctx, index) => (
                  <li key={index} className="p-2 border-l-4 border-gray-300 bg-white rounded">
                    <p className="font-medium text-gray-700">Source: {ctx.metadata?.source || 'Unknown'}</p>
                    <p className="italic">{ctx.page_content || 'No content'}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QueriesPage;


import React, { useState, useEffect } from 'react';

const QueriesPage = () => {
  // State management
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQueries, setTotalQueries] = useState(0);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(false);
  
  // Pagination settings
  const queriesPerPage = 10;

  // Fetch queries from API
  const fetchQueries = async (page = 1, filters = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        limit: queriesPerPage.toString(),
        skip: ((page - 1) * queriesPerPage).toString(),
        ...filters
      });

      const response = await fetch(`/api/v1/queries/history?${params}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Handle both array and object responses
      if (Array.isArray(data)) {
        setQueries(data);
        setTotalQueries(data.length);
        setTotalPages(Math.ceil(data.length / queriesPerPage));
      } else if (data.queries) {
        setQueries(data.queries);
        setTotalQueries(data.total || data.queries.length);
        setTotalPages(Math.ceil((data.total || data.queries.length) / queriesPerPage));
      } else {
        setQueries([]);
        setTotalQueries(0);
        setTotalPages(1);
      }
    } catch (err) {
      console.error('Error fetching queries:', err);
      setError(`Failed to load query history: ${err.message}`);
      setQueries([]);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchQueries(currentPage, getFilters());
  }, [currentPage]);

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchQueries(currentPage, getFilters());
    }, 30000); // Refresh every 30 seconds
    
    return () => clearInterval(interval);
  }, [autoRefresh, currentPage]);

  // Get current filters
  const getFilters = () => {
    const filters = {};
    
    if (searchTerm.trim()) {
      filters.search = searchTerm.trim();
    }
    
    if (departmentFilter !== 'all') {
      filters.department = departmentFilter;
    }
    
    if (dateRange !== 'all') {
      const now = new Date();
      let startDate;
      
      switch (dateRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        default:
          startDate = null;
      }
      
      if (startDate) {
        filters.start_date = startDate.toISOString();
      }
    }
    
    return filters;
  };

  // Handle filter changes
  const handleFilterChange = () => {
    setCurrentPage(1);
    fetchQueries(1, getFilters());
  };

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    handleFilterChange();
  };

  // Export queries
  const handleExport = async () => {
    try {
      const response = await fetch('/api/v1/queries/export');
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `query_history_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Export failed:', err);
      setError('Failed to export query history');
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    try {
      return new Date(timestamp).toLocaleString();
    } catch {
      return 'Invalid date';
    }
  };

  // Format processing time
  const formatProcessingTime = (time) => {
    if (typeof time === 'number') {
      return `${time.toFixed(2)}s`;
    }
    return 'N/A';
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'success':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Query History</h1>
          <p className="text-gray-600 mt-1">
            {totalQueries} total queries • Page {currentPage} of {totalPages}
          </p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => fetchQueries(currentPage, getFilters())}
            disabled={loading}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <svg className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white shadow rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
            </svg>
            Filters
          </h3>
        </div>
        <div className="p-6">
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <input
                type="text"
                placeholder="Search queries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Department Filter */}
            <select
              value={departmentFilter}
              onChange={(e) => setDepartmentFilter(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Departments</option>
              <option value="General">General</option>
              <option value="IT">IT</option>
              <option value="Sales">Sales</option>
              <option value="Support">Support</option>
              <option value="admin">Admin</option>
            </select>

            {/* Date Range Filter */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
            </select>

            {/* Apply Filters Button */}
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              )}
              Apply Filters
            </button>
          </form>

          {/* Auto-refresh toggle */}
          <div className="mt-4 flex items-center">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="autoRefresh" className="ml-2 block text-sm text-gray-600">
              Auto-refresh every 30 seconds
            </label>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-400 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="font-medium text-red-800">Error:</span>
            <span className="ml-1 text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Queries List */}
      <div className="space-y-4">
        {loading && queries.length === 0 ? (
          <div className="bg-white shadow rounded-lg border border-gray-200 p-8">
            <div className="flex items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-gray-400 mr-3" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-gray-600">Loading query history...</span>
            </div>
          </div>
        ) : queries.length === 0 ? (
          <div className="bg-white shadow rounded-lg border border-gray-200 p-8">
            <div className="text-center text-gray-500">
              <svg className="h-12 w-12 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a4 4 0 118 0v4m-4 8a2 2 0 100-4 2 2 0 000 4zm0 0v4a2 2 0 002 2h6a2 2 0 002-2v-4" />
              </svg>
              <p className="text-lg font-medium">No queries found</p>
              <p className="text-sm">Try adjusting your filters or submit a new query</p>
            </div>
          </div>
        ) : (
          queries.map((query) => (
            <div key={query.id} className="bg-white shadow rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
              <div className="p-6 space-y-4">
                {/* Query Header */}
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-900 mb-2">
                      {query.query_text || query.query || 'No query text'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
                        {query.department || 'General'}
                      </span>
                      <span>•</span>
                      <span>{formatTimestamp(query.query_timestamp || query.timestamp)}</span>
                      <span>•</span>
                      <span>Processing: {formatProcessingTime(query.processing_time)}</span>
                      {query.gpu_accelerated && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                            GPU
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(query.status)}`}>
                    {query.status || 'completed'}
                  </span>
                </div>

                {/* Response */}
                {query.response_text && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Response:</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">
                      {query.response_text.length > 300 
                        ? `${query.response_text.substring(0, 300)}...` 
                        : query.response_text
                      }
                    </p>
                  </div>
                )}

                {/* Sources */}
                {query.sources && query.sources.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Sources ({query.sources.length}):
                    </h4>
                    <div className="space-y-2">
                      {query.sources.slice(0, 3).map((source, index) => (
                        <div key={index} className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                          <div className="flex justify-between items-start">
                            <span className="font-medium text-blue-900 text-sm">
                              {source.document_name || source.filename || `Document ${index + 1}`}
                            </span>
                            {source.relevance_score && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
                                {Math.round(source.relevance_score * 100)}% relevant
                              </span>
                            )}
                          </div>
                          {source.content_snippet && (
                            <p className="text-blue-800 text-xs mt-1 leading-relaxed">
                              {source.content_snippet.length > 150 
                                ? `${source.content_snippet.substring(0, 150)}...` 
                                : source.content_snippet
                              }
                            </p>
                          )}
                        </div>
                      ))}
                      {query.sources.length > 3 && (
                        <p className="text-gray-500 text-sm">
                          ... and {query.sources.length - 3} more sources
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white shadow rounded-lg border border-gray-200 p-4">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {((currentPage - 1) * queriesPerPage) + 1} to {Math.min(currentPage * queriesPerPage, totalQueries)} of {totalQueries} queries
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1 || loading}
                className="px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Previous
              </button>
              
              <div className="flex items-center gap-1">
                {[...Array(Math.min(5, totalPages))].map((_, i) => {
                  const pageNum = Math.max(1, currentPage - 2) + i;
                  if (pageNum > totalPages) return null;
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      disabled={loading}
                      className={`px-3 py-1 text-sm font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 ${
                        pageNum === currentPage
                          ? 'bg-blue-600 text-white border border-blue-600'
                          : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || loading}
                className="px-3 py-1 border border-gray-300 rounded text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueriesPage;



live

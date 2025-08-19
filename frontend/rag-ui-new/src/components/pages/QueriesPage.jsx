/*
 * v1.0.0.0
 * Location: frontend/rag-ui-new/src/components/pages/QueriesPage.jsx
 *
 * This file enhances the existing QueriesPage by integrating the
 * improved query input component and restoring a fully functional
 * query history view.  Users can submit queries via the improved
 * input (Enter to send, Shift+Enter for new lines) and browse
 * previous queries stored in the Postgres database.  Filters for
 * search term, department and date range are provided along with
 * pagination and auto‑refresh options.
 */

import React, { useState, useEffect } from 'react';
import ImprovedQueryInput from '../../components/ImprovedQueryInput';

/**
 * Card component for rendering a single query and its response.
 */
const QueryCard = ({ query, formatTimestamp }) => {
  const [expanded, setExpanded] = useState(false);
  const responseText = query.response || query.answer || '';
  const truncated = responseText.substring(0, 200);
  return (
    <div className="bg-gray-800 p-4 rounded shadow">
      <div className="flex justify-between items-center text-sm text-gray-400">
        <span>{query.department || 'General'}</span>
        <span>{formatTimestamp(query.timestamp)}</span>
      </div>
      <div className="mt-2">
        <h3 className="font-medium">Query:</h3>
        <p className="text-white break-words">{query.query}</p>
      </div>
      <div className="mt-2">
        <h3 className="font-medium">Response:</h3>
        <p className="text-gray-200 break-words">
          {expanded ? responseText : truncated}
          {responseText.length > 200 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="ml-2 text-blue-400 hover:text-blue-300 text-sm"
            >
              {expanded ? 'Show less' : 'Show more'}
            </button>
          )}
        </p>
      </div>
      <div className="mt-2 text-sm text-gray-500">
        Model: {query.model || 'Unknown'} • ID: {query.id || 'N/A'}
      </div>
    </div>
  );
};

/**
 * History view containing filter controls, list of queries and pagination.
 */
const QueryHistoryView = ({
  queries,
  loading,
  error,
  currentPage,
  totalPages,
  totalQueries,
  searchTerm,
  setSearchTerm,
  departmentFilter,
  setDepartmentFilter,
  dateRange,
  setDateRange,
  autoRefresh,
  setAutoRefresh,
  onApplyFilters,
  onRefresh,
  onPageChange,
  formatTimestamp,
}) => {
  return (
    <div className="mt-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-2 md:space-y-0">
        <div>
          <h2 className="text-xl font-semibold text-white">Query History</h2>
          <div className="text-sm text-gray-400">
            {totalQueries} total queries • Page {currentPage} of {totalPages}
          </div>
        </div>
        <button
          onClick={onRefresh}
          className="px-3 py-1 bg-blue-600 rounded text-sm text-white hover:bg-blue-500"
        >
          Refresh
        </button>
      </div>
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search term"
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
        />
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
        >
          <option value="all">All Departments</option>
          <option value="General">General</option>
          <option value="Technical">Technical</option>
          <option value="Sales">Sales</option>
          <option value="Support">Support</option>
          <option value="Research">Research</option>
        </select>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
        >
          <option value="all">All Time</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
        <div className="flex flex-col space-y-2">
          <button
            onClick={onApplyFilters}
            className="px-3 py-2 bg-blue-600 rounded text-white hover:bg-blue-500"
          >
            Apply Filters
          </button>
          <label className="flex items-center space-x-2 text-sm text-gray-200">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <span>Auto‑refresh</span>
          </label>
        </div>
      </div>
      {/* Loading and error states */}
      {loading && <p className="text-gray-300">Loading query history...</p>}
      {error && <div className="text-red-400">{error}</div>}
      {/* List */}
      {!loading && !error && (
        <div className="space-y-4">
          {queries.length === 0 ? (
            <p className="text-gray-400">No queries found</p>
          ) : (
            queries.map((q) => <QueryCard key={q.id} query={q} formatTimestamp={formatTimestamp} />)
          )}
        </div>
      )}
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center space-x-4">
          <button
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 rounded transition-colors"
          >
            Previous
          </button>
          <span className="text-gray-300">Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 rounded transition-colors"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * Query submission form.  Uses the ImprovedQueryInput component and displays
 * submission status, errors and the AI response.
 */
const QuerySubmissionForm = ({ department, setDepartment, onSubmit, isSubmitting, response, error }) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Submit New Query</h2>
      {/* Department selection */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-gray-300">Department</label>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white focus:border-blue-400 focus:outline-none"
        >
          <option value="General">General</option>
          <option value="Technical">Technical</option>
          <option value="Sales">Sales</option>
          <option value="Support">Support</option>
          <option value="Research">Research</option>
        </select>
      </div>
      {/* Query input */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Your Query</label>
        <ImprovedQueryInput
          onSubmit={(text) => {
            if (!isSubmitting) {
              onSubmit(text);
            }
          }}
        />
      </div>
      {/* Loading indicator */}
      {isSubmitting && (
        <div className="flex items-center space-x-2 text-blue-400">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            ></path>
          </svg>
          <span>Processing…</span>
        </div>
      )}
      {/* Error display */}
      {error && (
        <div className="bg-red-900 border border-red-500 rounded-lg p-4">
          <span className="text-red-300 font-medium">Error</span>
          <p className="text-red-400">{error}</p>
        </div>
      )}
      {/* Response display */}
      {response && (
        <div className="bg-gray-900 border border-gray-700 rounded p-4 space-y-2">
          <h3 className="text-lg font-medium text-white">AI Response</h3>
          <p className="text-gray-200 whitespace-pre-wrap break-words">{response.response || response.answer}</p>
          {response.sources && response.sources.length > 0 && (
            <div className="text-sm text-gray-400 space-y-1">
              <strong>Sources:</strong>
              {response.sources.map((source, idx) => (
                <div key={idx} className="ml-2">
                  <span className="text-blue-400">
                    {source.document_name || source.filename || `Document ${idx + 1}`}
                  </span>
                  <span className="ml-1">• Score: {(source.relevance_score || source.score || 0).toFixed(2)}</span>
                </div>
              ))}
            </div>
          )}
          <div className="text-sm text-gray-500">
            Model: {response.model || 'Unknown'} • Department: {response.department || department}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Top‑level QueriesPage component.  Manages tabs, fetches history and
 * orchestrates submission and filtering state.
 */
const QueriesPage = () => {
  // Tab management
  const [activeTab, setActiveTab] = useState('submit');
  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState(null);
  const [submissionError, setSubmissionError] = useState(null);
  // Department selection
  const [department, setDepartment] = useState('General');
  // History state
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalQueries, setTotalQueries] = useState(0);
  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const queriesPerPage = 10;

  /**
   * Submit a new query.  Invoked by the ImprovedQueryInput component.
   */
  const submitQuery = async (queryText) => {
    const trimmed = queryText.trim();
    if (!trimmed) {
      setSubmissionError('Please enter a query');
      return;
    }
    setIsSubmitting(true);
    setSubmissionError(null);
    setResponse(null);
    try {
      const result = await fetch('/api/v1/queries/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({ query: trimmed, department }),
      });
      if (!result.ok) {
        throw new Error(`HTTP error! status: ${result.status}`);
      }
      const data = await result.json();
      setResponse(data);
      // Refresh history if currently viewing history
      if (activeTab === 'history') {
        fetchQueries(currentPage, getFilters());
      }
    } catch (err) {
      console.error('Query submission failed:', err);
      setSubmissionError(`Failed to submit query: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Fetch query history from the backend with optional filters.
   */
  const fetchQueries = async (page = 1, filters = {}) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        limit: queriesPerPage.toString(),
        skip: ((page - 1) * queriesPerPage).toString(),
        ...filters,
      });
      const res = await fetch(`/api/v1/queries/history?${params}`);
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
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

  /**
   * Build filter object based on search term, department filter and date range.
   */
  const getFilters = () => {
    const filters = {};
    if (searchTerm.trim()) filters.search = searchTerm.trim();
    if (departmentFilter !== 'all') filters.department = departmentFilter;
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
      if (startDate) filters.start_date = startDate.toISOString();
    }
    return filters;
  };

  // Fetch history when switching to history tab or changing page
  useEffect(() => {
    if (activeTab === 'history') {
      fetchQueries(currentPage, getFilters());
    }
  }, [activeTab, currentPage]);

  // Auto‑refresh query history every 30 seconds if enabled
  useEffect(() => {
    if (!autoRefresh || activeTab !== 'history') return;
    const timer = setInterval(() => {
      fetchQueries(currentPage, getFilters());
    }, 30000);
    return () => clearInterval(timer);
  }, [autoRefresh, activeTab, currentPage]);

  const handleApplyFilters = () => {
    setCurrentPage(1);
    fetchQueries(1, getFilters());
  };
  const handleRefresh = () => {
    fetchQueries(currentPage, getFilters());
  };
  const formatTimestamp = (ts) => {
    if (!ts) return 'Unknown';
    const date = new Date(ts * 1000);
    return date.toLocaleString();
  };

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold text-white">Query Interface</h1>
      {/* Tab navigation */}
      <div className="flex space-x-4">
        <button
          onClick={() => setActiveTab('submit')}
          className={`flex items-center space-x-2 px-4 py-2 rounded transition-colors ${
            activeTab === 'submit'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-600 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <span>Submit Query</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center space-x-2 px-4 py-2 rounded transition-colors ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-600 text-gray-300 hover:bg-gray-700'
          }`}
        >
          <span>Query History</span>
        </button>
      </div>
      {/* Tab content */}
      <div>
        {activeTab === 'submit' ? (
          <QuerySubmissionForm
            department={department}
            setDepartment={setDepartment}
            onSubmit={submitQuery}
            isSubmitting={isSubmitting}
            response={response}
            error={submissionError}
          />
        ) : (
          <QueryHistoryView
            queries={queries}
            loading={loading}
            error={error}
            currentPage={currentPage}
            totalPages={totalPages}
            totalQueries={totalQueries}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            departmentFilter={departmentFilter}
            setDepartmentFilter={setDepartmentFilter}
            dateRange={dateRange}
            setDateRange={setDateRange}
            autoRefresh={autoRefresh}
            setAutoRefresh={setAutoRefresh}
            onApplyFilters={handleApplyFilters}
            onRefresh={handleRefresh}
            onPageChange={setCurrentPage}
            formatTimestamp={formatTimestamp}
          />
        )}
      </div>
    </div>
  );
};

export default QueriesPage;
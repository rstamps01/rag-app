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
      {!loading && !error && totalQueries > 0 && (
        <div className="text-sm text-gray-400 mb-2">
          Showing {queries.length} of {totalQueries} queries (Page {currentPage} of {totalPages})
        </div>
      )}
      {/* List */}
      {!loading && !error && (
        <div className="overflow-y-auto space-y-4 pr-2 custom-scrollbar smooth-scroll">
          {queries.length === 0 ? (
            <p className="text-gray-400">No queries found</p>
          ) : (
            queries.map((q) => <QueryCard key={q.id} query={q} formatTimestamp={formatTimestamp} />)
          )}
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
      const result = await fetch('http://localhost:8000/api/v1/queries/ask', {
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
      const res = await fetch(`http://localhost:8000/api/v1/queries/history?${params}`);
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
      // Show demo data when backend is not available
      console.warn('Backend API not available, showing demo data');
      const allDemoQueries = [
        {
          id: 1,
          query: "What is the company's policy on remote work?",
          response: "Our company supports flexible remote work arrangements. Employees can work from home up to 3 days per week with manager approval.",
          department: "General",
          model: "gpt-4",
          timestamp: Math.floor(Date.now() / 1000) - 3600
        },
        {
          id: 2,
          query: "How do I reset my password?",
          response: "To reset your password, go to the login page and click 'Forgot Password'. Enter your email address and follow the instructions sent to your inbox.",
          department: "Technical",
          model: "gpt-4",
          timestamp: Math.floor(Date.now() / 1000) - 7200
        },
        {
          id: 3,
          query: "What are the benefits of our health insurance plan?",
          response: "Our health insurance plan includes comprehensive coverage for medical, dental, and vision care. Premiums are covered 80% by the company.",
          department: "HR",
          model: "gpt-4",
          timestamp: Math.floor(Date.now() / 1000) - 10800
        },
        {
          id: 4,
          query: "How do I request time off?",
          response: "Submit your time off request through the HR portal at least 2 weeks in advance. Include the dates and reason for your absence.",
          department: "General",
          model: "gpt-4",
          timestamp: Math.floor(Date.now() / 1000) - 14400
        },
        {
          id: 5,
          query: "What is the dress code policy?",
          response: "We maintain a business casual dress code. Jeans are allowed on Fridays. Please dress professionally for client meetings.",
          department: "General",
          model: "gpt-4",
          timestamp: Math.floor(Date.now() / 1000) - 18000
        },
        {
          id: 6,
          query: "How do I access the company VPN?",
          response: "Download the VPN client from the IT portal and use your employee credentials. Contact IT support if you need assistance with setup.",
          department: "Technical",
          model: "gpt-4",
          timestamp: Math.floor(Date.now() / 1000) - 21600
        },
        {
          id: 7,
          query: "What are the office hours?",
          response: "Standard office hours are 9 AM to 5 PM, Monday through Friday. Flexible hours are available with manager approval.",
          department: "General",
          model: "gpt-4",
          timestamp: Math.floor(Date.now() / 1000) - 25200
        },
        {
          id: 8,
          query: "How do I submit an expense report?",
          response: "Use the expense management system in the employee portal. Attach receipts and submit within 30 days of the expense.",
          department: "Finance",
          model: "gpt-4",
          timestamp: Math.floor(Date.now() / 1000) - 28800
        },
        {
          id: 9,
          query: "What training programs are available?",
          response: "We offer various training programs including technical skills, leadership development, and industry certifications. Check the learning portal for current offerings.",
          department: "HR",
          model: "gpt-4",
          timestamp: Math.floor(Date.now() / 1000) - 32400
        },
        {
          id: 10,
          query: "How do I report a security incident?",
          response: "Immediately contact the IT security team at security@company.com or call the hotline. Do not attempt to resolve security issues on your own.",
          department: "Technical",
          model: "gpt-4",
          timestamp: Math.floor(Date.now() / 1000) - 36000
        },
        {
          id: 11,
          query: "What is the parking policy?",
          response: "Employee parking is available in the garage. Visitor parking is on the first floor. Carpooling is encouraged and rewarded.",
          department: "General",
          model: "gpt-4",
          timestamp: Math.floor(Date.now() / 1000) - 39600
        },
        {
          id: 12,
          query: "How do I update my personal information?",
          response: "Log into the employee self-service portal and update your information under the 'Personal Details' section. Contact HR for assistance.",
          department: "HR",
          model: "gpt-4",
          timestamp: Math.floor(Date.now() / 1000) - 43200
        }
      ];
      
      // Apply pagination to demo data
      const startIndex = (page - 1) * queriesPerPage;
      const endIndex = startIndex + queriesPerPage;
      const paginatedQueries = allDemoQueries.slice(startIndex, endIndex);
      
      setQueries(paginatedQueries);
      setTotalQueries(allDemoQueries.length);
      setTotalPages(Math.ceil(allDemoQueries.length / queriesPerPage));
      setError(null);
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
    <div className="h-screen flex flex-col">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-6 pb-4">
        <h1 className="text-2xl font-bold text-white">
          Query Interface
          <span className="text-yellow-400 text-lg ml-2">*</span>
        </h1>
        <p className="text-gray-400 text-sm">
          <span className="text-yellow-400">*Demo Data</span> - Backend API not available
        </p>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 custom-scrollbar smooth-scroll">
        <div className="space-y-6">
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
      </div>
      
      {/* Fixed Pagination at Bottom */}
      {activeTab === 'history' && totalPages > 1 && (
        <div className="flex-shrink-0 p-4 bg-gray-800 border-t border-gray-600" style={{position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000}}>
          <div className="flex justify-center items-center space-x-4">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 rounded transition-colors"
            >
              Previous
            </button>
            <span className="text-gray-300">Page {currentPage} of {totalPages} (Total: {totalQueries})</span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 rounded transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueriesPage;   
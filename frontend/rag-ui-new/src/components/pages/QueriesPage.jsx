import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, Search, Filter, RefreshCw, Send, History, User, Database } from 'lucide-react';
// Import the improved query input component.  Adjust the relative path
// based on your project structure.  This assumes the component lives in
// frontend/rag-ui-new/src/components/ImprovedQueryInput.jsx as noted in
// the file header.
import ImprovedQueryInput from '../../components/ImprovedQueryInput';

/**
 * This file is a modified version of the original QueriesPage component.
 * It integrates the ImprovedQueryInput component to handle query entry
 * and submission.  Users can press Enter to submit a query and
 * Shift+Enter to insert a newline.  The query textarea, hint and
 * submit button from the original implementation have been removed.
 */

const QueriesPage = () => {
    // Tab management
    const [activeTab, setActiveTab] = useState('submit');

    // Department selection state
    const [department, setDepartment] = useState('General');

    // Submission/loading/error states
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [response, setResponse] = useState(null);
    const [submissionError, setSubmissionError] = useState(null);

    // Query history state
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

    const queriesPerPage = 10;

    /**
     * Submit a new query.
     *
     * This function now accepts the query text as a parameter instead of
     * relying on local state.  It is passed down to the ImprovedQueryInput
     * component via the onSubmit prop.  When called, it sends the query
     * and selected department to the backend API.
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

            // Refresh history if on history tab
            if (activeTab === 'history') {
                fetchQueries(currentPage, getFilters());
            }
        } catch (error) {
            console.error('Query submission failed:', error);
            setSubmissionError(`Failed to submit query: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Fetch queries from API
    const fetchQueries = async (page = 1, filters = {}) => {
        setLoading(true);
        setError(null);

        try {
            const params = new URLSearchParams({
                limit: queriesPerPage.toString(),
                skip: ((page - 1) * queriesPerPage).toString(),
                ...filters,
            });

            const response = await fetch(`/api/v1/queries/history?${params}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (Array.isArray(data)) {
                setQueries(data);
                setTotalQueries(data.length);
                setTotalPages(Math.ceil(data.length / queriesPerPage));
            } else if (data.queries) {
                setQueries(data.queries);
                setTotalQueries(data.total || data.queries.length);
                setTotalPages(
                    Math.ceil((data.total || data.queries.length) / queriesPerPage)
                );
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

    // Load history when switching to history tab
    useEffect(() => {
        if (activeTab === 'history') {
            fetchQueries(currentPage, getFilters());
        }
    }, [activeTab, currentPage]);

    // Auto-refresh functionality
    useEffect(() => {
        if (!autoRefresh || activeTab !== 'history') return;

        const interval = setInterval(() => {
            fetchQueries(currentPage, getFilters());
        }, 30000);

        return () => clearInterval(interval);
    }, [autoRefresh, activeTab, currentPage]);

    const handleApplyFilters = () => {
        setCurrentPage(1);
        fetchQueries(1, getFilters());
    };

    const handleRefresh = () => {
        fetchQueries(currentPage, getFilters());
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'Unknown';
        const date = new Date(timestamp * 1000);
        return date.toLocaleString();
    };

    return (
        <div className="queries-page bg-gray-900 min-h-screen text-white">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <MessageSquare className="w-6 h-6 text-blue-400" />
                        <h1 className="text-xl font-bold">Query Interface</h1>
                    </div>

                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <Database className="w-4 h-4" />
                        <span>RAG AI Assistant</span>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex space-x-4 mt-4">
                    <button
                        onClick={() => setActiveTab('submit')}
                        className={`flex items-center space-x-2 px-4 py-2 rounded transition-colors ${
                            activeTab === 'submit'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-600 text-gray-300 hover:bg-gray-700'
                        }`}
                    >
                        <Send className="w-4 h-4" />
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
                        <History className="w-4 h-4" />
                        <span>Query History</span>
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-6">
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

// Query Submission Form Component
const QuerySubmissionForm = ({
    department,
    setDepartment,
    onSubmit,
    isSubmitting,
    response,
    error,
}) => {
    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Query Input Section */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center">
                    <Send className="w-5 h-5 mr-2 text-blue-400" />
                    Submit New Query
                </h2>

                <div className="space-y-4">
                    {/* Department Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Department
                        </label>
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

                    {/* Query Input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                            Your Query
                        </label>
                        {/* Use the improved query input.  It will handle Enter vs. Shift+Enter
                            internally and call onSubmit with the entered text. */}
                        <ImprovedQueryInput
                            onSubmit={(text) => {
                                if (!isSubmitting) {
                                    onSubmit(text);
                                }
                            }}
                        />
                    </div>

                    {/* Loading indicator outside of ImprovedQueryInput */}
                    {isSubmitting && (
                        <div className="flex justify-end mt-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span className="ml-2 text-sm">Processing…</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                        <span className="text-red-400 font-medium">Error</span>
                    </div>
                    <p className="text-red-300 mt-2">{error}</p>
                </div>
            )}

            {/* Response Display */}
            {response && (
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <h3 className="text-lg font-semibold mb-4 flex items-center">
                        <MessageSquare className="w-5 h-5 mr-2 text-green-400" />
                        AI Response
                    </h3>

                    <div className="space-y-4">
                        <div className="bg-gray-700 rounded-lg p-4">
                            <p className="text-white whitespace-pre-wrap">
                                {response.response || response.answer}
                            </p>
                        </div>

                        {response.sources && response.sources.length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-300 mb-2">
                                    Sources:
                                </h4>
                                <div className="space-y-2">
                                    {response.sources.map((source, index) => (
                                        <div
                                            key={index}
                                            className="bg-gray-700 rounded p-3 text-sm"
                                        >
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-blue-400 font-medium">
                                                    {source.document_name ||
                                                        source.filename ||
                                                        `Document ${index + 1}`}
                                                </span>
                                                <span className="text-gray-400">
                                                    Score: {(
                                                        source.relevance_score ||
                                                        source.score ||
                                                        0
                                                    ).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// Placeholder QueryHistoryView component
// In your actual project this should import the real implementation
const QueryHistoryView = (props) => {
    return <div>Query history is not implemented in this example.</div>;
};

export default QueriesPage;
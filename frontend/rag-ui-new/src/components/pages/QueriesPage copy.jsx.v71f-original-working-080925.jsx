import React, { useState, useEffect } from 'react';
import { MessageSquare, Clock, Search, Filter, RefreshCw, Send, History, User, Database } from 'lucide-react';

const QueriesPage = () => {
    // Tab management
    const [activeTab, setActiveTab] = useState('submit');
    
    // Query submission state
    const [query, setQuery] = useState('');
    const [department, setDepartment] = useState('General');
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

    // Submit new query
    const submitQuery = async () => {
        if (!query.trim()) {
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
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    query: query.trim(), 
                    department: department 
                })
            });

            if (!result.ok) {
                throw new Error(`HTTP error! status: ${result.status}`);
            }

            const data = await result.json();
            setResponse(data);
            
            // Clear the query input after successful submission
            setQuery('');
            
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
                ...filters
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
                        query={query}
                        setQuery={setQuery}
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
    query, 
    setQuery, 
    department, 
    setDepartment, 
    onSubmit, 
    isSubmitting, 
    response, 
    error 
}) => {
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && e.ctrlKey) {
            onSubmit();
        }
    };

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
                        <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask me anything about VAST storage, data management, or related topics..."
                            className="w-full h-32 bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none resize-none"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            Press Ctrl+Enter to submit
                        </p>
                    </div>
                    
                    {/* Submit Button */}
                    <div className="flex justify-end">
                        <button
                            onClick={onSubmit}
                            disabled={isSubmitting || !query.trim()}
                            className={`flex items-center space-x-2 px-6 py-2 rounded transition-colors ${
                                isSubmitting || !query.trim()
                                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                            }`}
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <Send className="w-4 h-4" />
                                    <span>Submit Query</span>
                                </>
                            )}
                        </button>
                    </div>
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
                            <p className="text-white whitespace-pre-wrap">{response.response || response.answer}</p>
                        </div>
                        
                        {response.sources && response.sources.length > 0 && (
                            <div>
                                <h4 className="text-sm font-medium text-gray-300 mb-2">Sources:</h4>
                                <div className="space-y-2">
                                    {response.sources.map((source, index) => (
                                        <div key={index} className="bg-gray-700 rounded p-3 text-sm">
                                            <div className="flex justify-between items-start mb-1">
                                                <span className="text-blue-400 font-medium">
                                                    {source.document_name || source.filename || `Document ${index + 1}`}
                                                </span>
                                                <span className="text-gray-400">
                                                    Score: {(source.relevance_score || source.score || 0).toFixed(2)}
                                                </span>
                                            </div>
                                            <p className="text-gray-300">{source.content_snippet || source.content}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        <div className="flex justify-between text-sm text-gray-400">
                            <span>Model: {response.model || 'Unknown'}</span>
                            <span>Department: {response.department || department}</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Query History View Component
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
    formatTimestamp 
}) => {
    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-semibold">Query History</h2>
                    <p className="text-gray-400 text-sm">
                        {totalQueries} total queries • Page {currentPage} of {totalPages}
                    </p>
                </div>
                
                <div className="flex items-center space-x-2">
                    <button
                        onClick={onRefresh}
                        disabled={loading}
                        className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        <span>Refresh</span>
                    </button>
                </div>
            </div>
            
            {/* Filters */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-4">
                    <Filter className="w-4 h-4 text-gray-400" />
                    <span className="text-sm font-medium">Filters</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <input
                            type="text"
                            placeholder="Search queries..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-blue-400 focus:outline-none"
                        />
                    </div>
                    
                    <div>
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
                    </div>
                    
                    <div>
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
                    </div>
                    
                    <div>
                        <button
                            onClick={onApplyFilters}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
                        >
                            Apply Filters
                        </button>
                    </div>
                </div>
                
                <div className="flex items-center space-x-2 mt-4">
                    <input
                        type="checkbox"
                        id="autoRefresh"
                        checked={autoRefresh}
                        onChange={(e) => setAutoRefresh(e.target.checked)}
                        className="rounded"
                    />
                    <label htmlFor="autoRefresh" className="text-sm text-gray-300">
                        Auto-refresh every 30 seconds
                    </label>
                </div>
            </div>
            
            {/* Loading State */}
            {loading && (
                <div className="text-center py-8">
                    <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading query history...</p>
                </div>
            )}
            
            {/* Error State */}
            {error && (
                <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 text-center">
                    <p className="text-red-400">{error}</p>
                </div>
            )}
            
            {/* Query List */}
            {!loading && !error && (
                <div className="space-y-4">
                    {queries.length === 0 ? (
                        <div className="text-center py-8">
                            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-400">No queries found</p>
                        </div>
                    ) : (
                        queries.map((query, index) => (
                            <QueryCard 
                                key={query.id || index} 
                                query={query} 
                                formatTimestamp={formatTimestamp} 
                            />
                        ))
                    )}
                </div>
            )}
            
            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center space-x-2">
                    <button
                        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="px-3 py-2 bg-gray-600 hover:bg-gray-700 disabled:bg-gray-800 disabled:text-gray-500 rounded transition-colors"
                    >
                        Previous
                    </button>
                    
                    <span className="px-3 py-2 bg-gray-700 rounded">
                        Page {currentPage} of {totalPages}
                    </span>
                    
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

// Query Card Component
const QueryCard = ({ query, formatTimestamp }) => {
    const [expanded, setExpanded] = useState(false);
    
    return (
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                    <User className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-gray-400">
                        {query.department || 'General'}
                    </span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-400">
                    <Clock className="w-4 h-4" />
                    <span>{formatTimestamp(query.timestamp)}</span>
                </div>
            </div>
            
            <div className="mb-3">
                <h3 className="text-white font-medium mb-2">Query:</h3>
                <p className="text-gray-300 bg-gray-700 rounded p-3">
                    {query.query}
                </p>
            </div>
            
            <div className="mb-3">
                <h3 className="text-white font-medium mb-2">Response:</h3>
                <div className="text-gray-300 bg-gray-700 rounded p-3">
                    {expanded ? (
                        <p className="whitespace-pre-wrap">{query.response || query.answer}</p>
                    ) : (
                        <p className="line-clamp-3">
                            {(query.response || query.answer || '').substring(0, 200)}
                            {(query.response || query.answer || '').length > 200 && '...'}
                        </p>
                    )}
                </div>
                
                {(query.response || query.answer || '').length > 200 && (
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="text-blue-400 hover:text-blue-300 text-sm mt-2"
                    >
                        {expanded ? 'Show less' : 'Show more'}
                    </button>
                )}
            </div>
            
            <div className="flex justify-between items-center text-sm text-gray-400">
                <span>Model: {query.model || 'Unknown'}</span>
                <span>ID: {query.id || 'N/A'}</span>
            </div>
        </div>
    );
};

export default QueriesPage;
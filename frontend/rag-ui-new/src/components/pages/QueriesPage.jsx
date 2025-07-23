import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Loader2, Search, Download, RefreshCw, Calendar, Filter } from 'lucide-react';

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
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Query History</h1>
          <p className="text-gray-600 mt-1">
            {totalQueries} total queries • Page {currentPage} of {totalPages}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fetchQueries(currentPage, getFilters())}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            variant="outline"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search queries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Department Filter */}
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                <SelectItem value="General">General</SelectItem>
                <SelectItem value="IT">IT</SelectItem>
                <SelectItem value="Sales">Sales</SelectItem>
                <SelectItem value="Support">Support</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range Filter */}
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="All Time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last Week</SelectItem>
                <SelectItem value="month">Last Month</SelectItem>
              </SelectContent>
            </Select>

            {/* Apply Filters Button */}
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Apply Filters
            </Button>
          </form>

          {/* Auto-refresh toggle */}
          <div className="mt-4 flex items-center gap-2">
            <input
              type="checkbox"
              id="autoRefresh"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded"
            />
            <label htmlFor="autoRefresh" className="text-sm text-gray-600">
              Auto-refresh every 30 seconds
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-800">
              <span className="font-medium">Error:</span>
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Queries List */}
      <div className="space-y-4">
        {loading && queries.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">Loading query history...</span>
              </div>
            </CardContent>
          </Card>
        ) : queries.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p className="text-lg font-medium">No queries found</p>
                <p className="text-sm">Try adjusting your filters or submit a new query</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          queries.map((query) => (
            <Card key={query.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Query Header */}
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg text-gray-900 mb-2">
                        {query.query_text || query.query || 'No query text'}
                      </h3>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                        <Badge variant="outline">
                          {query.department || 'General'}
                        </Badge>
                        <span>•</span>
                        <span>{formatTimestamp(query.query_timestamp || query.timestamp)}</span>
                        <span>•</span>
                        <span>Processing: {formatProcessingTime(query.processing_time)}</span>
                        {query.gpu_accelerated && (
                          <>
                            <span>•</span>
                            <Badge className="bg-green-100 text-green-800">GPU</Badge>
                          </>
                        )}
                      </div>
                    </div>
                    <Badge className={getStatusColor(query.status)}>
                      {query.status || 'completed'}
                    </Badge>
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
                          <div key={index} className="bg-blue-50 rounded-lg p-3">
                            <div className="flex justify-between items-start">
                              <span className="font-medium text-blue-900 text-sm">
                                {source.document_name || source.filename || `Document ${index + 1}`}
                              </span>
                              {source.relevance_score && (
                                <Badge variant="outline" className="text-xs">
                                  {Math.round(source.relevance_score * 100)}% relevant
                                </Badge>
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
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Showing {((currentPage - 1) * queriesPerPage) + 1} to {Math.min(currentPage * queriesPerPage, totalQueries)} of {totalQueries} queries
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </Button>
                
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = Math.max(1, currentPage - 2) + i;
                    if (pageNum > totalPages) return null;
                    
                    return (
                      <Button
                        key={pageNum}
                        variant={pageNum === currentPage ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        disabled={loading}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default QueriesPage;

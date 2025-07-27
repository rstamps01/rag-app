import React, { useState, useEffect } from 'react';
import { Search, Send, History, Filter, RefreshCw, Download, Clock, User, Tag } from 'lucide-react';

const QueriesPage = () => {
  const [activeTab, setActiveTab] = useState('submit');
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('General');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [queryHistory, setQueryHistory] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    department: 'All Departments',
    timeRange: 'All Time'
  });

  // Sample query history
  useEffect(() => {
    setQueryHistory([
      {
        id: 1,
        query: "What is VAST storage architecture?",
        response: "VAST Data provides a disaggregated shared everything architecture...",
        department: "Technical",
        timestamp: Date.now() - 3600000,
        model: "mistralai/Mistral-7B-Instruct-v0.2",
        processing_time: 3.2
      },
      {
        id: 2,
        query: "How does VAST handle data deduplication?",
        response: "VAST uses advanced deduplication techniques...",
        department: "Engineering",
        timestamp: Date.now() - 7200000,
        model: "mistralai/Mistral-7B-Instruct-v0.2",
        processing_time: 2.8
      }
    ]);
  }, []);

  const handleSubmitQuery = async () => {
    if (!query.trim()) return;
    
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/v1/queries/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: query,
          department: department
        })
      });
      
      if (response.ok) {
        const result = await response.json();
        setQueryHistory(prev => [result, ...prev]);
        setQuery('');
        setActiveTab('history');
      }
    } catch (error) {
      console.error('Query submission failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const filteredQueries = queryHistory.filter(q => {
    const matchesSearch = q.query.toLowerCase().includes(filters.search.toLowerCase()) ||
                         q.response.toLowerCase().includes(filters.search.toLowerCase());
    const matchesDepartment = filters.department === 'All Departments' || q.department === filters.department;
    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Query Interface</h1>
              <p className="mt-2 text-gray-600">Submit queries and view response history</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setActiveTab('submit')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'submit'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Send className="w-4 h-4 inline mr-2" />
                Submit Query
              </button>
              <button
                onClick={() => setActiveTab('history')}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === 'history'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <History className="w-4 h-4 inline mr-2" />
                Query History
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'submit' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Submit New Query</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="General">General</option>
                    <option value="Technical">Technical</option>
                    <option value="Engineering">Engineering</option>
                    <option value="Sales">Sales</option>
                    <option value="Support">Support</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Query
                  </label>
                  <textarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Enter your question about VAST storage, architecture, or any related topic..."
                    rows={6}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  />
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSubmitQuery}
                    disabled={!query.trim() || isSubmitting}
                    className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 inline mr-2" />
                        Submit Query
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search queries..."
                      value={filters.search}
                      onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <select
                  value={filters.department}
                  onChange={(e) => setFilters(prev => ({ ...prev, department: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="All Departments">All Departments</option>
                  <option value="General">General</option>
                  <option value="Technical">Technical</option>
                  <option value="Engineering">Engineering</option>
                  <option value="Sales">Sales</option>
                  <option value="Support">Support</option>
                </select>
                <select
                  value={filters.timeRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, timeRange: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="All Time">All Time</option>
                  <option value="Today">Today</option>
                  <option value="This Week">This Week</option>
                  <option value="This Month">This Month</option>
                </select>
              </div>
            </div>

            {/* Query History */}
            <div className="space-y-4">
              {filteredQueries.map((queryItem) => (
                <div key={queryItem.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {queryItem.query}
                      </h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatTimestamp(queryItem.timestamp)}
                        </span>
                        <span className="flex items-center">
                          <Tag className="w-4 h-4 mr-1" />
                          {queryItem.department}
                        </span>
                        <span className="flex items-center">
                          <User className="w-4 h-4 mr-1" />
                          {queryItem.model}
                        </span>
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {queryItem.processing_time}s
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">Response:</h4>
                    <p className="text-gray-700">{queryItem.response}</p>
                  </div>
                </div>
              ))}
              
              {filteredQueries.length === 0 && (
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No queries found</h3>
                  <p className="text-gray-500">Try adjusting your filters or submit a new query.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QueriesPage;
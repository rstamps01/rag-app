import React, { useState, useEffect } from 'react';
import { 
  Trash2, 
  Database, 
  AlertTriangle, 
  BarChart3, 
  RefreshCw, 
  CheckCircle, 
  XCircle,
  FileText,
  Search,
  Settings,
  Shield
} from 'lucide-react';
import adminService from '../../services/adminService';
import { apiHelpers } from '../../lib/api';

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [orphans, setOrphans] = useState(null);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [error, setError] = useState(null);

  // Load initial data
  useEffect(() => {
    const initializeData = async () => {
      try {
        setInitialLoading(true);
        setError(null);
        // Load initial data - don't fail if one fails
        const results = await Promise.allSettled([loadStats(), loadDocuments()]);
        const errors = results.filter(r => r.status === 'rejected');
        if (errors.length > 0) {
          console.warn('Some admin panel data failed to load:', errors);
          // Don't set error state if documents fail - just show empty list
          if (errors.some(e => e.reason?.message?.includes('statistics'))) {
            setError('Failed to load statistics. Document management may still work.');
          }
        }
        console.log('Admin panel initialized');
      } catch (err) {
        console.error('Failed to initialize admin panel:', err);
        setError('Failed to initialize admin panel: ' + (err.message || 'Unknown error'));
      } finally {
        setInitialLoading(false);
      }
    };
    
    initializeData();
  }, []);

  const loadStats = async () => {
    try {
      const data = await adminService.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load statistics:', error);
      addNotification('Failed to load statistics: ' + error.message, 'error');
    }
  };

  const loadDocuments = async () => {
    try {
      // Use the API helper which handles the correct base URL and response format
      const data = await apiHelpers.getDocuments(0, 1000); // Get up to 1000 documents
      // Handle both response formats: { documents: [...] } or direct array
      const documentsList = Array.isArray(data) ? data : (data.documents || data.items || []);
      setDocuments(documentsList);
      console.log(`Loaded ${documentsList.length} documents for admin panel`);
    } catch (error) {
      console.error('Failed to load documents:', error);
      addNotification('Failed to load documents: ' + (error.message || 'Unknown error'), 'error');
      // Set empty array on error to prevent rendering issues
      setDocuments([]);
    }
  };

  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const handleCleanupTestQueries = async (daysOld, pattern, dryRun = true) => {
    setLoading(true);
    try {
      const result = await adminService.cleanupTestQueries(daysOld, pattern, dryRun);
      addNotification(
        dryRun 
          ? `Found ${result.queries_found} test queries to delete`
          : `Deleted ${result.queries_deleted} test queries`,
        dryRun ? 'info' : 'success'
      );
      if (!dryRun) loadStats();
    } catch (error) {
      addNotification(`Failed to cleanup test queries: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupOldQueries = async (daysOld, dryRun = true) => {
    setLoading(true);
    try {
      const result = await adminService.cleanupOldQueries(daysOld, dryRun);
      addNotification(
        dryRun 
          ? `Found ${result.queries_found} old queries to delete`
          : `Deleted ${result.queries_deleted} old queries`,
        dryRun ? 'info' : 'success'
      );
      if (!dryRun) loadStats();
    } catch (error) {
      addNotification(`Failed to cleanup old queries: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDeleteDocuments = async (dryRun = true) => {
    if (selectedDocuments.length === 0) {
      addNotification('No documents selected', 'warning');
      return;
    }

    setLoading(true);
    try {
      const result = await adminService.bulkDeleteDocuments(selectedDocuments, dryRun);
      addNotification(
        dryRun 
          ? `Found ${result.documents_found} documents to delete`
          : `Deleted ${result.database_deleted} documents (${result.vector_deleted} from vector DB, ${result.files_deleted} files)`,
        dryRun ? 'info' : 'success'
      );
      if (!dryRun) {
        setSelectedDocuments([]);
        loadDocuments();
        loadStats();
      }
    } catch (error) {
      addNotification(`Failed to bulk delete documents: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDetectOrphans = async () => {
    setLoading(true);
    try {
      const result = await adminService.detectOrphans();
      setOrphans(result);
      addNotification('Orphan detection completed', 'success');
    } catch (error) {
      addNotification(`Failed to detect orphans: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCleanupOrphans = async (cleanupFiles = true, cleanupVectors = true, dryRun = true) => {
    setLoading(true);
    try {
      const result = await adminService.cleanupOrphans(cleanupFiles, cleanupVectors, dryRun);
      addNotification(
        dryRun 
          ? `Found ${result.files_cleaned} orphaned files and ${result.vectors_cleaned} orphaned vectors`
          : `Cleaned up ${result.files_cleaned} files and ${result.vectors_cleaned} vectors`,
        dryRun ? 'info' : 'success'
      );
      if (!dryRun) {
        setOrphans(null);
        loadStats();
      }
    } catch (error) {
      addNotification(`Failed to cleanup orphans: ${error.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleDocumentSelection = (docId) => {
    setSelectedDocuments(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const selectAllDocuments = () => {
    setSelectedDocuments(documents.map(doc => doc.id));
  };

  const clearSelection = () => {
    setSelectedDocuments([]);
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'queries', label: 'Query Cleanup', icon: Search },
    { id: 'documents', label: 'Document Management', icon: FileText },
    { id: 'orphans', label: 'Orphan Detection', icon: AlertTriangle },
  ];

  // Show loading state
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading admin panel...</p>
        </div>
      </div>
    );
  }


  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto bg-gray-800 border border-gray-700 rounded-lg p-8">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Admin Panel Error</h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">Administration Panel</h1>
                <p className="text-gray-400">Manage and cleanup your RAG application</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => {
                  loadStats();
                  loadDocuments();
                }}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Refresh All</span>
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-6 space-y-2">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg flex items-center space-x-2 border ${
                  notification.type === 'error' ? 'bg-red-900/20 border-red-700 text-red-300' :
                  notification.type === 'success' ? 'bg-green-900/20 border-green-700 text-green-300' :
                  notification.type === 'warning' ? 'bg-yellow-900/20 border-yellow-700 text-yellow-300' :
                  'bg-blue-900/20 border-blue-700 text-blue-300'
                }`}
              >
                {notification.type === 'error' ? <XCircle className="h-5 w-5" /> :
                 notification.type === 'success' ? <CheckCircle className="h-5 w-5" /> :
                 <AlertTriangle className="h-5 w-5" />}
                <span>{notification.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg mb-6">
          <div className="border-b border-gray-700">
            <nav className="flex space-x-8 px-6">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-400'
                        : 'border-transparent text-gray-400 hover:text-gray-300 hover:border-gray-600'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-white">System Overview</h3>
                {stats ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-900/30 border border-blue-700/50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-400">Total Documents</p>
                          <p className="text-2xl font-bold text-white">{stats.documents.total}</p>
                        </div>
                        <FileText className="h-8 w-8 text-blue-400" />
                      </div>
                      <div className="mt-2 text-sm text-gray-300">
                        <p>With files: {stats.documents.with_files || 0}</p>
                        <p>Vector stored: {stats.documents.vector_stored || stats.documents.processed || 0}</p>
                      </div>
                    </div>

                    <div className="bg-green-900/30 border border-green-700/50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-400">Total Queries</p>
                          <p className="text-2xl font-bold text-white">{stats.queries.total}</p>
                        </div>
                        <Search className="h-8 w-8 text-green-400" />
                      </div>
                      <div className="mt-2 text-sm text-gray-300">
                        <p>Last 24h: {stats.queries.last_24h}</p>
                        <p>Last 7d: {stats.queries.last_7d}</p>
                      </div>
                    </div>

                    <div className="bg-purple-900/30 border border-purple-700/50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-400">Vector Database</p>
                          <p className="text-2xl font-bold text-white">
                            {stats.vector_db.connected ? 'Connected' : 'Disconnected'}
                          </p>
                        </div>
                        <Database className="h-8 w-8 text-purple-400" />
                      </div>
                      <div className="mt-2 text-sm text-gray-300">
                        <p>Points: {stats.vector_db?.points_count ?? 'N/A'}</p>
                        <p>Status: {stats.vector_db?.status || (stats.vector_db?.connected ? 'Connected' : 'Disconnected')}</p>
                        {stats.vector_db?.error && (
                          <p className="text-xs text-red-400 mt-1">⚠️ {stats.vector_db.error.substring(0, 50)}...</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-400">Loading statistics...</p>
                  </div>
                )}
              </div>
            )}

            {/* Query Cleanup Tab */}
            {activeTab === 'queries' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Query Cleanup</h3>
                  {stats && (
                    <div className="text-sm text-gray-400">
                      Total queries: <span className="font-semibold text-white">{stats.queries.total}</span>
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-6">
                    <h4 className="text-md font-medium text-white mb-4">Clean Test Queries</h4>
                    <p className="text-sm text-gray-400 mb-4">
                      Remove queries containing test patterns from the query history.
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Days Old
                        </label>
                        <input
                          type="number"
                          defaultValue="7"
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          id="test-days"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Pattern
                        </label>
                        <input
                          type="text"
                          defaultValue="test"
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          id="test-pattern"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleCleanupTestQueries(
                            parseInt(document.getElementById('test-days').value),
                            document.getElementById('test-pattern').value,
                            true
                          )}
                          disabled={loading}
                          className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => handleCleanupTestQueries(
                            parseInt(document.getElementById('test-days').value),
                            document.getElementById('test-pattern').value,
                            false
                          )}
                          disabled={loading}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-6">
                    <h4 className="text-md font-medium text-white mb-4">Clean Old Queries</h4>
                    <p className="text-sm text-gray-400 mb-4">
                      Remove queries older than specified days from the query history.
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Days Old
                        </label>
                        <input
                          type="number"
                          defaultValue="30"
                          className="w-full px-3 py-2 bg-gray-800 border border-gray-600 text-white rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          id="old-days"
                        />
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleCleanupOldQueries(
                            parseInt(document.getElementById('old-days').value),
                            true
                          )}
                          disabled={loading}
                          className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => handleCleanupOldQueries(
                            parseInt(document.getElementById('old-days').value),
                            false
                          )}
                          disabled={loading}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Document Management Tab */}
            {activeTab === 'documents' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Document Management</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={selectAllDocuments}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      onClick={clearSelection}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>

                <div className="bg-gray-700/50 border border-gray-600 rounded-lg">
                  <div className="p-4 border-b border-gray-600">
                    <p className="text-sm text-gray-400">
                      Selected {selectedDocuments.length} of {documents.length} documents
                    </p>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {documents.length === 0 ? (
                      <div className="p-8 text-center text-gray-400">
                        <FileText className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                        <p className="text-sm">No documents found</p>
                        <p className="text-xs mt-2">Upload documents to see them here</p>
                      </div>
                    ) : (
                      documents.map(doc => (
                        <div
                          key={doc.id}
                          className="flex items-center space-x-3 p-4 border-b border-gray-600 hover:bg-gray-700/50 transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedDocuments.includes(doc.id)}
                            onChange={() => toggleDocumentSelection(doc.id)}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-500 rounded bg-gray-800"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">
                              {doc.filename || doc.id || 'Unknown document'}
                            </p>
                            <div className="flex items-center space-x-3 mt-1">
                              <p className="text-xs text-gray-400">
                                {doc.upload_date 
                                  ? new Date(doc.upload_date).toLocaleDateString() 
                                  : doc.created_at 
                                  ? new Date(doc.created_at).toLocaleDateString()
                                  : 'Unknown date'}
                              </p>
                              {doc.department && (
                                <span className="text-xs px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded border border-blue-700">
                                  {doc.department}
                                </span>
                              )}
                              {doc.status && (
                                <span className={`text-xs px-2 py-0.5 rounded border ${
                                  doc.status === 'processed' ? 'bg-green-900/50 text-green-300 border-green-700' :
                                  doc.status === 'processing' ? 'bg-yellow-900/50 text-yellow-300 border-yellow-700' :
                                  doc.status === 'error' ? 'bg-red-900/50 text-red-300 border-red-700' :
                                  'bg-gray-800 text-gray-400 border-gray-600'
                                }`}>
                                  {doc.status}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-sm text-gray-400 text-right">
                            <div>
                              {doc.status === 'processed' ? (
                                <span className="text-green-400">✓ Vectorized</span>
                              ) : doc.status === 'processing' ? (
                                <span className="text-yellow-400">⏳ Processing</span>
                              ) : (
                                <span className="text-gray-500">Not vectorized</span>
                              )}
                            </div>
                            {doc.size && (
                              <div className="text-xs text-gray-500 mt-1">
                                {(doc.size / 1024).toFixed(1)} KB
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {selectedDocuments.length > 0 && (
                    <div className="p-4 bg-gray-800/50 border-t border-gray-600">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleBulkDeleteDocuments(true)}
                          disabled={loading}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 transition-colors"
                        >
                          Preview Deletion
                        </button>
                        <button
                          onClick={() => handleBulkDeleteDocuments(false)}
                          disabled={loading}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          Delete Selected ({selectedDocuments.length})
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Orphan Detection Tab */}
            {activeTab === 'orphans' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Orphan Detection</h3>
                  <button
                    onClick={handleDetectOrphans}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    Detect Orphans
                  </button>
                </div>

                {loading && !orphans && (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-400">Detecting orphans...</p>
                  </div>
                )}

                {!loading && !orphans && (
                  <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-6 text-center">
                    <AlertTriangle className="h-12 w-12 text-blue-400 mx-auto mb-2" />
                    <p className="text-blue-300 font-medium">No orphan detection performed yet</p>
                    <p className="text-sm text-blue-400/80 mt-1">Click "Detect Orphans" to scan for orphaned content.</p>
                  </div>
                )}

                {orphans && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-red-900/30 border border-red-700/50 p-4 rounded-lg">
                        <h4 className="font-medium text-red-300 mb-2">File Orphans</h4>
                        <p className="text-3xl font-bold text-white">{orphans.file_orphans?.length || 0}</p>
                        <p className="text-xs text-gray-400 mt-1">Files without DB records</p>
                      </div>
                      <div className="bg-orange-900/30 border border-orange-700/50 p-4 rounded-lg">
                        <h4 className="font-medium text-orange-300 mb-2">Vector Orphans</h4>
                        <p className="text-3xl font-bold text-white">{orphans.qdrant_orphans?.length || 0}</p>
                        <p className="text-xs text-gray-400 mt-1">Vectors without documents</p>
                      </div>
                      <div className="bg-yellow-900/30 border border-yellow-700/50 p-4 rounded-lg">
                        <h4 className="font-medium text-yellow-300 mb-2">PostgreSQL Orphans</h4>
                        <p className="text-3xl font-bold text-white">{orphans.postgres_orphans?.length || 0}</p>
                        <p className="text-xs text-gray-400 mt-1">DB records without files</p>
                      </div>
                    </div>

                    {(orphans.file_orphans?.length > 0 || orphans.qdrant_orphans?.length > 0 || orphans.postgres_orphans?.length > 0) && (
                      <div className="space-y-4">
                        {orphans.file_orphans?.length > 0 && (
                          <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                            <h4 className="font-medium text-white mb-2">Orphaned Files ({orphans.file_orphans.length})</h4>
                            <div className="max-h-48 overflow-y-auto">
                              {orphans.file_orphans.map((orphan, index) => (
                                <div key={index} className="text-sm text-gray-300 py-1 border-b border-gray-600 last:border-0">
                                  <span className="font-medium">{orphan.filename || orphan.path}</span>
                                  <span className="text-xs text-gray-500 ml-2">({orphan.type})</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {orphans.qdrant_orphans?.length > 0 && (
                          <div className="bg-gray-700/50 border border-gray-600 rounded-lg p-4">
                            <h4 className="font-medium text-white mb-2">Orphaned Vectors ({orphans.qdrant_orphans.length})</h4>
                            <div className="max-h-48 overflow-y-auto">
                              {orphans.qdrant_orphans.slice(0, 20).map((orphan, index) => (
                                <div key={index} className="text-sm text-gray-300 py-1 border-b border-gray-600 last:border-0">
                                  <span className="font-medium">Document ID: {orphan.document_id}</span>
                                  <span className="text-xs text-gray-500 ml-2">(Point: {orphan.point_id})</span>
                                </div>
                              ))}
                              {orphans.qdrant_orphans.length > 20 && (
                                <div className="text-xs text-gray-500 mt-2">
                                  ... and {orphans.qdrant_orphans.length - 20} more
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {(!orphans.file_orphans?.length && !orphans.qdrant_orphans?.length && !orphans.postgres_orphans?.length) && (
                      <div className="bg-green-900/20 border border-green-700 rounded-lg p-6 text-center">
                        <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-2" />
                        <p className="text-green-300 font-medium">No orphaned content detected!</p>
                        <p className="text-sm text-gray-400 mt-1">All files, vectors, and database records are properly linked.</p>
                      </div>
                    )}

                    {(orphans.file_orphans?.length > 0 || orphans.qdrant_orphans?.length > 0) && (
                      <div className="flex space-x-2 pt-4 border-t border-gray-600">
                        <button
                          onClick={() => handleCleanupOrphans(true, true, true)}
                          disabled={loading}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50 flex items-center space-x-2 transition-colors"
                        >
                          <Search className="h-4 w-4" />
                          <span>Preview Cleanup</span>
                        </button>
                        <button
                          onClick={() => handleCleanupOrphans(true, true, false)}
                          disabled={loading}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>Cleanup Orphans</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;

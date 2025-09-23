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
        // Load initial data
        await Promise.all([loadStats(), loadDocuments()]);
        console.log('Admin panel initialized with data');
      } catch (err) {
        console.error('Failed to initialize admin panel:', err);
        setError('Failed to initialize admin panel: ' + err.message);
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
      const response = await fetch('/api/v1/documents');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      const data = await response.json();
      setDocuments(data);
    } catch (error) {
      console.error('Failed to load documents:', error);
      addNotification('Failed to load documents: ' + error.message, 'error');
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }


  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Admin Panel Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Administration Panel</h1>
                <p className="text-gray-600">Manage and cleanup your RAG application</p>
              </div>
            </div>
            <button
              onClick={loadStats}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Notifications */}
        {notifications.length > 0 && (
          <div className="mb-6 space-y-2">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg flex items-center space-x-2 ${
                  notification.type === 'error' ? 'bg-red-50 text-red-800' :
                  notification.type === 'success' ? 'bg-green-50 text-green-800' :
                  notification.type === 'warning' ? 'bg-yellow-50 text-yellow-800' :
                  'bg-blue-50 text-blue-800'
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
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map(tab => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
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
                <h3 className="text-lg font-semibold text-gray-900">System Overview</h3>
                {stats ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Total Documents</p>
                          <p className="text-2xl font-bold text-blue-900">{stats.documents.total}</p>
                        </div>
                        <FileText className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="mt-2 text-sm text-blue-700">
                        <p>With files: {stats.documents.with_files}</p>
                        <p>Vector stored: {stats.documents.vector_stored}</p>
                      </div>
                    </div>

                    <div className="bg-green-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600">Total Queries</p>
                          <p className="text-2xl font-bold text-green-900">{stats.queries.total}</p>
                        </div>
                        <Search className="h-8 w-8 text-green-600" />
                      </div>
                      <div className="mt-2 text-sm text-green-700">
                        <p>Last 24h: {stats.queries.last_24h}</p>
                        <p>Last 7d: {stats.queries.last_7d}</p>
                      </div>
                    </div>

                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-600">Vector Database</p>
                          <p className="text-2xl font-bold text-purple-900">
                            {stats.vector_db.connected ? 'Connected' : 'Disconnected'}
                          </p>
                        </div>
                        <Database className="h-8 w-8 text-purple-600" />
                      </div>
                      <div className="mt-2 text-sm text-purple-700">
                        <p>Points: {stats.vector_db.points_count || 'N/A'}</p>
                        <p>Status: {stats.vector_db.status || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Loading statistics...</p>
                  </div>
                )}
              </div>
            )}

            {/* Query Cleanup Tab */}
            {activeTab === 'queries' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold text-gray-900">Query Cleanup</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Clean Test Queries</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Remove queries containing test patterns from the query history.
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Days Old
                        </label>
                        <input
                          type="number"
                          defaultValue="7"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          id="test-days"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pattern
                        </label>
                        <input
                          type="text"
                          defaultValue="test"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
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
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Clean Old Queries</h4>
                    <p className="text-sm text-gray-600 mb-4">
                      Remove queries older than specified days from the query history.
                    </p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Days Old
                        </label>
                        <input
                          type="number"
                          defaultValue="30"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
                        >
                          Preview
                        </button>
                        <button
                          onClick={() => handleCleanupOldQueries(
                            parseInt(document.getElementById('old-days').value),
                            false
                          )}
                          disabled={loading}
                          className="flex-1 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
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
                  <h3 className="text-lg font-semibold text-gray-900">Document Management</h3>
                  <div className="flex space-x-2">
                    <button
                      onClick={selectAllDocuments}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Select All
                    </button>
                    <button
                      onClick={clearSelection}
                      className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg">
                  <div className="p-4 border-b border-gray-200">
                    <p className="text-sm text-gray-600">
                      Selected {selectedDocuments.length} of {documents.length} documents
                    </p>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {documents.map(doc => (
                      <div
                        key={doc.id}
                        className="flex items-center space-x-3 p-4 border-b border-gray-100 hover:bg-gray-50"
                      >
                        <input
                          type="checkbox"
                          checked={selectedDocuments.includes(doc.id)}
                          onChange={() => toggleDocumentSelection(doc.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {doc.filename}
                          </p>
                          <p className="text-sm text-gray-500">
                            {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : 'Unknown date'}
                          </p>
                        </div>
                        <div className="text-sm text-gray-500">
                          {doc.vector_stored ? 'Vectorized' : 'Not vectorized'}
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedDocuments.length > 0 && (
                    <div className="p-4 bg-gray-50 border-t border-gray-200">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleBulkDeleteDocuments(true)}
                          disabled={loading}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
                        >
                          Preview Deletion
                        </button>
                        <button
                          onClick={() => handleBulkDeleteDocuments(false)}
                          disabled={loading}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
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
                  <h3 className="text-lg font-semibold text-gray-900">Orphan Detection</h3>
                  <button
                    onClick={handleDetectOrphans}
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Detect Orphans
                  </button>
                </div>

                {orphans && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-red-50 p-4 rounded-lg">
                        <h4 className="font-medium text-red-900">File Orphans</h4>
                        <p className="text-2xl font-bold text-red-600">{orphans.file_orphans.length}</p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg">
                        <h4 className="font-medium text-orange-900">Vector Orphans</h4>
                        <p className="text-2xl font-bold text-orange-600">{orphans.qdrant_orphans.length}</p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="font-medium text-yellow-900">PostgreSQL Orphans</h4>
                        <p className="text-2xl font-bold text-yellow-600">{orphans.postgres_orphans.length}</p>
                      </div>
                    </div>

                    {orphans.file_orphans.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Orphaned Files</h4>
                        <div className="max-h-32 overflow-y-auto">
                          {orphans.file_orphans.map((orphan, index) => (
                            <div key={index} className="text-sm text-gray-600 py-1">
                              {orphan.filename} ({orphan.type})
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {(orphans.file_orphans.length > 0 || orphans.qdrant_orphans.length > 0) && (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleCleanupOrphans(true, true, true)}
                          disabled={loading}
                          className="px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700 disabled:opacity-50"
                        >
                          Preview Cleanup
                        </button>
                        <button
                          onClick={() => handleCleanupOrphans(true, true, false)}
                          disabled={loading}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                        >
                          Cleanup Orphans
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

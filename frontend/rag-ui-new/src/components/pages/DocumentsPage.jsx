import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Alert } from '../ui';

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState([]);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(new Set());
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  // Auto-clear success messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/v1/documents/');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
      setError('Failed to fetch documents');
    }
  };

  const handleMultipleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;

    // Validate file sizes
    const oversizedFiles = files.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError(`Files too large (max 10MB): ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);
    
    // Initialize progress tracking for all files
    const initialProgress = files.map(file => ({
      filename: file.name,
      status: 'uploading',
      progress: 0,
      size: file.size
    }));
    setUploadProgress(initialProgress);

    try {
      // Upload files concurrently with progress tracking
      const uploadPromises = files.map(async (file, index) => {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('department', 'General');

          const response = await fetch('/api/v1/documents/', {
            method: 'POST',
            body: formData,
          });

          if (response.ok) {
            const result = await response.json();
            // Update progress for this specific file
            setUploadProgress(prev => 
              prev.map((item, i) => 
                i === index 
                  ? { ...item, status: 'complete', progress: 100, documentId: result.document_id }
                  : item
              )
            );
            return { success: true, filename: file.name, documentId: result.document_id };
          } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Upload failed for ${file.name}`);
          }
        } catch (error) {
          // Update progress for failed file
          setUploadProgress(prev => 
            prev.map((item, i) => 
              i === index 
                ? { ...item, status: 'error', progress: 0, error: error.message }
                : item
            )
          );
          return { success: false, filename: file.name, error: error.message };
        }
      });

      const results = await Promise.all(uploadPromises);
      
      // Check results and show appropriate messages
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => !r.success);
      
      if (successful.length > 0) {
        setSuccess(`Successfully uploaded ${successful.length} file${successful.length > 1 ? 's' : ''}`);
      }
      
      if (failed.length > 0) {
        setError(`Failed to upload ${failed.length} file${failed.length > 1 ? 's' : ''}: ${failed.map(f => f.filename).join(', ')}`);
      }

      // Refresh document list
      await fetchDocuments();

      // Clear progress after delay
      setTimeout(() => {
        setUploadProgress([]);
      }, 4000);

    } catch (error) {
      setError(`Upload failed: ${error.message}`);
      setUploadProgress([]);
    } finally {
      setUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  const handleDeleteDocument = async (documentId, filename) => {
    setDeleting(prev => new Set([...prev, documentId]));
    
    try {
      const response = await fetch(`/api/v1/documents/${documentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove document from local state
        setDocuments(prev => prev.filter(doc => doc.id !== documentId));
        setDeleteConfirm(null);
        setSuccess(`Successfully deleted "${filename}"`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Delete failed');
      }
    } catch (error) {
      setError(`Failed to delete ${filename}: ${error.message}`);
    } finally {
      setDeleting(prev => {
        const newSet = new Set(prev);
        newSet.delete(documentId);
        return newSet;
      });
    }
  };

  const handleChooseFiles = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDragEnter = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDrop = (event) => {
    event.preventDefault();
    event.stopPropagation();
    setDragActive(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      // Create a synthetic event object for handleMultipleFileUpload
      const syntheticEvent = {
        target: {
          files: files,
          value: ''
        }
      };
      handleMultipleFileUpload(syntheticEvent);
    }
  };

  const confirmDelete = (doc) => {
    setDeleteConfirm(doc);
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    switch (extension) {
      case 'pdf':
        return 'bg-red-600';
      case 'txt':
      case 'md':
        return 'bg-blue-600';
      case 'docx':
      case 'doc':
        return 'bg-blue-700';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <div className="max-w-6xl mx-auto py-8 px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white">Document Management</h1>
          </div>
          <div className="text-sm text-gray-400">
            {documents.length} document{documents.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <Alert variant="success" className="mb-6 bg-green-900 border-green-700 text-green-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-green-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>{success}</span>
              </div>
              <button 
                onClick={() => setSuccess(null)}
                className="text-green-300 hover:text-green-100"
              >
                ✕
              </button>
            </div>
          </Alert>
        )}

        {/* Error Message */}
        {error && (
          <Alert variant="error" className="mb-6 bg-red-900 border-red-700 text-red-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{error}</span>
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-red-300 hover:text-red-100"
              >
                ✕
              </button>
            </div>
          </Alert>
        )}

        {/* Upload Section */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-4">
              <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <h2 className="text-lg font-semibold text-white">Upload Documents</h2>
            </div>
            
            <div 
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 ${
                dragActive 
                  ? 'border-blue-400 bg-blue-900/20' 
                  : uploading 
                    ? 'border-gray-500 bg-gray-800/50' 
                    : 'border-gray-600 hover:border-blue-500'
              }`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
                  dragActive ? 'bg-blue-600' : 'bg-gray-700'
                }`}>
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg text-gray-300 mb-2">
                    {dragActive ? 'Drop files here' : 'Drop files here or click to upload'}
                  </p>
                  <p className="text-sm text-gray-500">Supports PDF, TXT, DOCX, MD files (max 10MB each)</p>
                  <p className="text-xs text-gray-600 mt-1">Select multiple files for batch upload</p>
                </div>
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    className="hidden"
                    accept=".pdf,.txt,.docx,.md"
                    onChange={handleMultipleFileUpload}
                    disabled={uploading}
                  />
                  <Button 
                    disabled={uploading} 
                    onClick={handleChooseFiles}
                    className={`transition-all ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {uploading ? (
                      <div className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Uploading...
                      </div>
                    ) : (
                      'Choose Files'
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Upload Progress */}
            {uploadProgress.length > 0 && (
              <div className="mt-6 space-y-3">
                <h3 className="text-sm font-medium text-gray-300 flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Upload Progress:
                </h3>
                <div className="space-y-2">
                  {uploadProgress.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-700 rounded-lg border border-gray-600">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-300 truncate flex-1 mr-4 font-medium">
                          {item.filename}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatFileSize(item.size)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex-1 mr-4">
                          <div className="w-full bg-gray-600 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                item.status === 'complete' ? 'bg-green-500' : 
                                item.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${item.progress}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className={`text-sm flex items-center ${
                          item.status === 'complete' ? 'text-green-400' : 
                          item.status === 'error' ? 'text-red-400' : 'text-blue-400'
                        }`}>
                          {item.status === 'complete' && (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              Complete
                            </>
                          )}
                          {item.status === 'error' && (
                            <>
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Failed
                            </>
                          )}
                          {item.status === 'uploading' && (
                            <>
                              <svg className="animate-spin w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Uploading...
                            </>
                          )}
                        </span>
                      </div>
                      {item.error && (
                        <p className="text-xs text-red-400 mt-2">{item.error}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-red-600 rounded-full flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Confirm Delete</h3>
              </div>
              <p className="text-gray-300 mb-6">
                Are you sure you want to delete <strong>"{deleteConfirm.filename}"</strong>? 
                This will remove the document from the RAG system and cannot be undone.
              </p>
              <div className="flex space-x-3">
                <Button 
                  variant="secondary" 
                  onClick={cancelDelete}
                  className="flex-1 bg-gray-600 hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={() => handleDeleteDocument(deleteConfirm.id, deleteConfirm.filename)}
                  disabled={deleting.has(deleteConfirm.id)}
                  className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50"
                >
                  {deleting.has(deleteConfirm.id) ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </div>
                  ) : (
                    'Delete'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Documents List */}
        <Card className="bg-gray-800 border-gray-700">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Uploaded Documents</h2>
              <Button variant="secondary" onClick={fetchDocuments} className="bg-gray-600 hover:bg-gray-700">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Refresh
              </Button>
            </div>

            {documents.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-400 text-lg">No documents uploaded yet</p>
                <p className="text-sm text-gray-500 mt-2">Upload your first document to get started with the RAG system</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600 relative group hover:border-gray-500 transition-colors">
                    <div className="flex items-start space-x-3">
                      <div className={`w-10 h-10 ${getFileIcon(doc.filename)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white truncate" title={doc.filename}>
                          {doc.filename}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatFileSize(doc.size)}
                        </p>
                        <div className="flex items-center mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-900 text-green-200">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                            processed
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Delete Button */}
                    <button
                      onClick={() => confirmDelete(doc)}
                      disabled={deleting.has(doc.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 hover:bg-red-700 text-white rounded-full w-7 h-7 flex items-center justify-center text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete document"
                    >
                      {deleting.has(doc.id) ? (
                        <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                      ) : (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default DocumentsPage;


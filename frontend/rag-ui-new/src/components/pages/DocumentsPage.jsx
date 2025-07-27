import React, { useState, useEffect } from 'react';
import { FileText, Upload, Trash2, Download, Eye, AlertCircle, CheckCircle, Clock, Database } from 'lucide-react';

const DocumentsPage = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [dragOver, setDragOver] = useState(false);
    const [error, setError] = useState(null);
    const [uploadProgress, setUploadProgress] = useState({});

    // Fetch documents on component mount
    useEffect(() => {
        fetchDocuments();
    }, []);

    const fetchDocuments = async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch('/api/v1/documents/');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (Array.isArray(data)) {
                setDocuments(data);
            } else if (data.documents) {
                setDocuments(data.documents);
            } else {
                setDocuments([]);
            }
        } catch (err) {
            console.error('Error fetching documents:', err);
            setError(`Failed to load documents: ${err.message}`);
            setDocuments([]);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (files) => {
        if (!files || files.length === 0) return;
        
        setUploading(true);
        setError(null);
        
        const uploadPromises = Array.from(files).map(async (file) => {
            const formData = new FormData();
            formData.append('file', file);
            
            try {
                // Update progress
                setUploadProgress(prev => ({
                    ...prev,
                    [file.name]: { status: 'uploading', progress: 0 }
                }));
                
                const response = await fetch('/api/v1/documents/', {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    const result = await response.json();
                    
                    // Update progress
                    setUploadProgress(prev => ({
                        ...prev,
                        [file.name]: { status: 'success', progress: 100 }
                    }));
                    
                    return result;
                } else {
                    throw new Error(`Upload failed: ${response.statusText}`);
                }
            } catch (error) {
                console.error(`Upload failed for ${file.name}:`, error);
                
                // Update progress
                setUploadProgress(prev => ({
                    ...prev,
                    [file.name]: { status: 'error', progress: 0, error: error.message }
                }));
                
                return null;
            }
        });
        
        try {
            const results = await Promise.all(uploadPromises);
            const successfulUploads = results.filter(result => result !== null);
            
            if (successfulUploads.length > 0) {
                // Refresh document list
                await fetchDocuments();
            }
            
            // Clear progress after 3 seconds
            setTimeout(() => {
                setUploadProgress({});
            }, 3000);
            
        } catch (error) {
            setError(`Upload failed: ${error.message}`);
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteDocument = async (documentId) => {
        if (!confirm('Are you sure you want to delete this document?')) {
            return;
        }
        
        try {
            const response = await fetch(`/api/v1/documents/${documentId}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                // Remove document from list
                setDocuments(prev => prev.filter(doc => doc.id !== documentId));
            } else {
                throw new Error(`Delete failed: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Delete failed:', error);
            setError(`Failed to delete document: ${error.message}`);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);
        
        const files = Array.from(e.dataTransfer.files);
        const validFiles = files.filter(file => {
            const validTypes = ['.pdf', '.txt', '.docx', '.md'];
            const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
            return validTypes.includes(fileExtension);
        });
        
        if (validFiles.length !== files.length) {
            setError('Some files were skipped. Only PDF, TXT, DOCX, and MD files are supported.');
        }
        
        if (validFiles.length > 0) {
            handleFileUpload(validFiles);
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatTimestamp = (timestamp) => {
        if (!timestamp) return 'Unknown';
        const date = new Date(timestamp);
        return date.toLocaleString();
    };

    return (
        <div className="documents-page bg-gray-900 min-h-screen text-white">
            {/* Header */}
            <div className="bg-gray-800 border-b border-gray-700 p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                        <FileText className="w-6 h-6 text-blue-400" />
                        <h1 className="text-xl font-bold">Document Management</h1>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-sm text-gray-400">
                        <Database className="w-4 h-4" />
                        <span>{documents.length} documents</span>
                    </div>
                </div>
            </div>

            <div className="p-6 max-w-6xl mx-auto space-y-6">
                {/* Upload Area */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <h2 className="text-lg font-semibold mb-4 flex items-center">
                        <Upload className="w-5 h-5 mr-2 text-blue-400" />
                        Upload Documents
                    </h2>
                    
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 transition-colors text-center ${
                            dragOver 
                                ? 'border-blue-400 bg-blue-400/10' 
                                : 'border-gray-600 hover:border-gray-500'
                        }`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p className="text-lg mb-2">Drop files here or click to upload</p>
                        <p className="text-sm text-gray-400 mb-4">
                            Supports PDF, TXT, DOCX, MD files (max 10MB each)
                        </p>
                        
                        <input
                            type="file"
                            multiple
                            accept=".pdf,.txt,.docx,.md"
                            onChange={(e) => handleFileUpload(e.target.files)}
                            className="hidden"
                            id="file-upload"
                        />
                        <label
                            htmlFor="file-upload"
                            className="inline-flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded cursor-pointer transition-colors"
                        >
                            <Upload className="w-4 h-4" />
                            <span>Choose Files</span>
                        </label>
                    </div>
                    
                    {/* Upload Progress */}
                    {Object.keys(uploadProgress).length > 0 && (
                        <div className="mt-4 space-y-2">
                            <h3 className="text-sm font-medium text-gray-300">Upload Progress:</h3>
                            {Object.entries(uploadProgress).map(([filename, progress]) => (
                                <div key={filename} className="bg-gray-700 rounded p-3">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm text-white">{filename}</span>
                                        <div className="flex items-center space-x-2">
                                            {progress.status === 'uploading' && (
                                                <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                            )}
                                            {progress.status === 'success' && (
                                                <CheckCircle className="w-4 h-4 text-green-400" />
                                            )}
                                            {progress.status === 'error' && (
                                                <AlertCircle className="w-4 h-4 text-red-400" />
                                            )}
                                            <span className={`text-sm ${
                                                progress.status === 'success' ? 'text-green-400' :
                                                progress.status === 'error' ? 'text-red-400' :
                                                'text-blue-400'
                                            }`}>
                                                {progress.status === 'success' ? 'Complete' :
                                                 progress.status === 'error' ? 'Failed' :
                                                 'Uploading...'}
                                            </span>
                                        </div>
                                    </div>
                                    {progress.status === 'error' && progress.error && (
                                        <p className="text-xs text-red-400">{progress.error}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-900/20 border border-red-500 rounded-lg p-4">
                        <div className="flex items-center space-x-2">
                            <AlertCircle className="w-4 h-4 text-red-400" />
                            <span className="text-red-400 font-medium">Error</span>
                        </div>
                        <p className="text-red-300 mt-2">{error}</p>
                    </div>
                )}

                {/* Documents List */}
                <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-semibold flex items-center">
                            <FileText className="w-5 h-5 mr-2 text-blue-400" />
                            Uploaded Documents
                        </h2>
                        
                        <button
                            onClick={fetchDocuments}
                            disabled={loading}
                            className="flex items-center space-x-2 px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
                        >
                            <Database className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            <span>Refresh</span>
                        </button>
                    </div>

                    {/* Loading State */}
                    {loading && (
                        <div className="text-center py-8">
                            <div className="w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                            <p className="text-gray-400">Loading documents...</p>
                        </div>
                    )}

                    {/* Documents Grid */}
                    {!loading && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {documents.length === 0 ? (
                                <div className="col-span-full text-center py-8">
                                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-400">No documents uploaded yet</p>
                                    <p className="text-sm text-gray-500 mt-2">
                                        Upload your first document to get started
                                    </p>
                                </div>
                            ) : (
                                documents.map((document) => (
                                    <DocumentCard
                                        key={document.id}
                                        document={document}
                                        onDelete={handleDeleteDocument}
                                        formatFileSize={formatFileSize}
                                        formatTimestamp={formatTimestamp}
                                    />
                                ))
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

// Document Card Component
const DocumentCard = ({ document, onDelete, formatFileSize, formatTimestamp }) => {
    const getFileIcon = (filename) => {
        const extension = filename.split('.').pop().toLowerCase();
        switch (extension) {
            case 'pdf':
                return <FileText className="w-8 h-8 text-red-400" />;
            case 'txt':
            case 'md':
                return <FileText className="w-8 h-8 text-blue-400" />;
            case 'docx':
                return <FileText className="w-8 h-8 text-blue-600" />;
            default:
                return <FileText className="w-8 h-8 text-gray-400" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'processed':
                return 'text-green-400';
            case 'processing':
                return 'text-yellow-400';
            case 'error':
                return 'text-red-400';
            default:
                return 'text-gray-400';
        }
    };

    return (
        <div className="bg-gray-700 border border-gray-600 rounded-lg p-4 hover:border-gray-500 transition-colors">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-3">
                    {getFileIcon(document.filename || document.name || 'unknown')}
                    <div className="flex-1 min-w-0">
                        <h3 className="text-white font-medium truncate">
                            {document.filename || document.name || 'Untitled'}
                        </h3>
                        <p className="text-sm text-gray-400">
                            {formatFileSize(document.size || 0)}
                        </p>
                    </div>
                </div>
                
                <div className="flex items-center space-x-1">
                    <button
                        onClick={() => onDelete(document.id)}
                        className="p-1 text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete document"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            </div>
            
            <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Status:</span>
                    <span className={`font-medium ${getStatusColor(document.status)}`}>
                        {document.status || 'uploaded'}
                    </span>
                </div>
                
                <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Uploaded:</span>
                    <span className="text-gray-300">
                        {formatTimestamp(document.created_at || document.timestamp)}
                    </span>
                </div>
                
                {document.document_id && (
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">ID:</span>
                        <span className="text-gray-300 font-mono text-xs">
                            {document.document_id.substring(0, 8)}...
                        </span>
                    </div>
                )}
            </div>
            
            {document.processing_status === 'processing' && (
                <div className="mt-3 flex items-center space-x-2 text-sm text-yellow-400">
                    <Clock className="w-4 h-4 animate-spin" />
                    <span>Processing for search...</span>
                </div>
            )}
        </div>
    );
};

export default DocumentsPage;
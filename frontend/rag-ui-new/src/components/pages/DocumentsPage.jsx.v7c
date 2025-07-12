import React, { useState, useEffect, useCallback } from 'react';
import { Upload, File, Clock, CheckCircle, AlertCircle, RefreshCw, Trash2, Download } from 'lucide-react';
import { apiHelpers } from '../../lib/api';

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState(null);

  // ✅ CORRECTED: Fetch documents using the validated API helper
  const fetchDocuments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiHelpers.getDocuments();
      // ✅ CORRECTED: Access the documents array from the response
      const fetchedDocs = response.documents || [];
      setDocuments(fetchedDocs);
      console.log(`✅ Fetched ${fetchedDocs.length} documents`);
    } catch (err) {
      console.error('Error fetching documents:', err);
      setError('Failed to fetch documents. Please check the backend connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file);
      setError(''); // Clear previous errors
    }
  };

  // ✅ CORRECTED: Handle file upload with progress
  const handleFileUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file to upload.');
      return;
    }

    setUploading(true);
    setUploadProgress(0);
    setError('');

    try {
      const response = await apiHelpers.uploadDocument(selectedFile, (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(percentCompleted);
      });

      // Add the newly uploaded document to the list
      setDocuments(prevDocs => [response, ...prevDocs]);
      setSelectedFile(null); // Clear selection after upload
      console.log('✅ File uploaded successfully:', response);

    } catch (err) {
      console.error('Upload failed:', err);
      setError(`Upload failed: ${err.message || 'Please check the server logs.'}`);
    } finally {
      setUploading(false);
    }
  };

  // Handle document deletion
  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await apiHelpers.deleteDocument(documentId);
      setDocuments(prevDocs => prevDocs.filter(doc => doc.id !== documentId));
      console.log(`✅ Document ${documentId} deleted`);
    } catch (err) {
      console.error(`Error deleting document ${documentId}:`, err);
      setError(`Failed to delete document: ${err.message}`);
    }
  };
  
  // ✅ IMPROVED: Format file size helper
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // ✅ IMPROVED: Get status color and icon helpers
  const getStatusInfo = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'processed':
        return { icon: <CheckCircle className="text-green-600" />, color: 'text-green-700' };
      case 'processing':
        return { icon: <RefreshCw className="text-blue-600 animate-spin" />, color: 'text-blue-700' };
      case 'failed':
        return { icon: <AlertCircle className="text-red-600" />, color: 'text-red-700' };
      default:
        return { icon: <Clock className="text-gray-600" />, color: 'text-gray-700' };
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Document Management</h1>

      {/* Upload Section */}
      <div className="bg-white rounded-lg border shadow-sm p-6">
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Upload size={20} />
          Upload New Document
        </h2>
        <div className="mt-4 flex items-center gap-4">
          <input 
            type="file"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <button 
            onClick={handleFileUpload} 
            disabled={uploading || !selectedFile}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
          >
            {uploading ? <RefreshCw className="animate-spin" /> : <Upload size={16} />}
            {uploading ? `Uploading... ${uploadProgress}%` : 'Upload'}
          </button>
        </div>
        {selectedFile && (
          <p className="text-sm text-gray-600 mt-2">Selected: {selectedFile.name}</p>
        )}
        {uploading && (
          <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${uploadProgress}%` }}></div>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Documents List */}
      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <File size={20} />
            Uploaded Documents
          </h2>
          <button 
            onClick={fetchDocuments} 
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading documents...</p>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <File size={48} className="mx-auto mb-4 opacity-50" />
              <p>No documents uploaded yet.</p>
              <p className="text-sm">Use the upload form above to add your first document!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Filename</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded At</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {documents.map((doc) => {
                    const statusInfo = getStatusInfo(doc.status);
                    return (
                      <tr key={doc.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{doc.filename}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatFileSize(doc.size)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <div className={`inline-flex items-center gap-2 ${statusInfo.color}`}>
                            {statusInfo.icon}
                            <span>{doc.status || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(doc.created_at).toLocaleString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end gap-2">
                            <button className="text-blue-600 hover:text-blue-900" title="Download">
                              <Download size={16} />
                            </button>
                            <button 
                              onClick={() => handleDeleteDocument(doc.id)} 
                              className="text-red-600 hover:text-red-900" 
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;

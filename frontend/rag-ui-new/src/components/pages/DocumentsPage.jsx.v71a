import React, { useState, useEffect } from 'react';
import { Card, Button, Alert } from '../ui';

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/v1/documents/');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error('Error fetching documents:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    setUploadProgress({ filename: file.name, status: 'uploading' });

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
        setUploadProgress({ filename: file.name, status: 'complete' });
        await fetchDocuments();
        
        setTimeout(() => {
          setUploadProgress(null);
        }, 2000);
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      setError(`Upload failed: ${error.message}`);
      setUploadProgress(null);
    } finally {
      setUploading(false);
      event.target.value = '';
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
            {documents.length} documents
          </div>
        </div>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
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
            
            <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg text-gray-300 mb-2">Drop files here or click to upload</p>
                  <p className="text-sm text-gray-500">Supports PDF, TXT, DOCX, MD files (max 10MB each)</p>
                </div>
                <label className="cursor-pointer">
                  <Button disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Choose Files'}
                  </Button>
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.txt,.docx,.md"
                    onChange={handleFileUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>

            {uploadProgress && (
              <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-300">{uploadProgress.filename}</span>
                  <span className={`text-sm ${uploadProgress.status === 'complete' ? 'text-green-400' : 'text-blue-400'}`}>
                    {uploadProgress.status === 'complete' ? '✅ Complete' : '⏳ Uploading...'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Documents List */}
        <Card className="bg-gray-800 border-gray-700">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-white">Uploaded Documents</h2>
              <Button variant="secondary" onClick={fetchDocuments}>
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
                <p className="text-gray-400">No documents uploaded yet</p>
                <p className="text-sm text-gray-500 mt-2">Upload your first document to get started</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc) => (
                  <div key={doc.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600">
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-white truncate" title={doc.filename}>
                          {doc.filename}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">
                          {(doc.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <div className="flex items-center mt-2">
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-900 text-green-200">
                            <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                            processed
                          </span>
                        </div>
                      </div>
                    </div>
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
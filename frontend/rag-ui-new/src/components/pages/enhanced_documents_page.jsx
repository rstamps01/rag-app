import React, { useState, useEffect } from 'react';
import { Upload, FileText, Trash2, Download, Search, Filter, RefreshCw, Plus, Eye } from 'lucide-react';

const DocumentsPage = () => {
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    type: 'All Types',
    status: 'All Status'
  });

  // Sample documents
  useEffect(() => {
    setDocuments([
      {
        id: 1,
        filename: "vast_storage_overview.pdf",
        size: 2048576,
        upload_date: "2024-01-15 10:30:00",
        status: "processed",
        type: "PDF",
        department: "Technical"
      },
      {
        id: 2,
        filename: "vast_technical_specifications.pdf",
        size: 1536000,
        upload_date: "2024-01-16 14:20:00",
        status: "processed",
        type: "PDF",
        department: "Engineering"
      },
      {
        id: 3,
        filename: "vast_architecture_whitepaper.pdf",
        size: 3072000,
        upload_date: "2024-01-17 09:15:00",
        status: "processed",
        type: "PDF",
        department: "Technical"
      }
    ]);
  }, []);

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    
    for (const file of files) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('department', 'General');
        
        const response = await fetch('/api/v1/documents/', {
          method: 'POST',
          body: formData
        });
        
        if (response.ok) {
          const result = await response.json();
          const newDoc = {
            id: result.id,
            filename: result.filename,
            size: result.size,
            upload_date: new Date().toLocaleString(),
            status: "uploaded",
            type: file.name.split('.').pop().toUpperCase(),
            department: "General"
          };
          setDocuments(prev => [newDoc, ...prev]);
        }
      } catch (error) {
        console.error('Upload failed:', error);
      }
    }
    
    setIsUploading(false);
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.filename.toLowerCase().includes(filters.search.toLowerCase());
    const matchesType = filters.type === 'All Types' || doc.type === filters.type;
    const matchesStatus = filters.status === 'All Status' || doc.status === filters.status;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Document Management</h1>
              <p className="mt-2 text-gray-600">Upload and manage your documents for RAG processing</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => document.getElementById('file-input').click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4 inline mr-2" />
                Upload Document
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4 inline mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Area */}
        <div className="mb-8">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isUploading ? 'Uploading...' : 'Upload Documents'}
            </h3>
            <p className="text-gray-500 mb-4">
              Drag and drop files here, or click to select files
            </p>
            <p className="text-sm text-gray-400">
              Supported formats: PDF, TXT, DOCX, MD (Max 100MB)
            </p>
            <input
              id="file-input"
              type="file"
              multiple
              accept=".pdf,.txt,.docx,.md,.doc"
              onChange={(e) => handleFileUpload(e.target.files)}
              className="hidden"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <select
              value={filters.type}
              onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All Types">All Types</option>
              <option value="PDF">PDF</option>
              <option value="TXT">TXT</option>
              <option value="DOCX">DOCX</option>
              <option value="MD">MD</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All Status">All Status</option>
              <option value="uploaded">Uploaded</option>
              <option value="processed">Processed</option>
              <option value="processing">Processing</option>
            </select>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Documents ({filteredDocuments.length})
            </h2>
          </div>
          
          <div className="divide-y divide-gray-200">
            {filteredDocuments.map((doc) => (
              <div key={doc.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0">
                      <FileText className="w-8 h-8 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">{doc.filename}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{formatFileSize(doc.size)}</span>
                        <span>{doc.upload_date}</span>
                        <span className="capitalize">{doc.department}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          doc.status === 'processed' 
                            ? 'bg-green-100 text-green-800'
                            : doc.status === 'processing'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {doc.status}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {filteredDocuments.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No documents found</h3>
                <p className="text-gray-500">Upload your first document to get started.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;
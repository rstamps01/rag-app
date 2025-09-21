/*
 * v1.0.0.0
 * Location: frontend/rag-ui-new/src/components/pages/DocumentsPage.jsx
 *
 * This version increases the maximum upload size from 10 MB to 100 MB and
 * refactors size checking to use a constant.  Users can now upload
 * larger documents without encountering immediate client‑side errors.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Card, Button, Alert } from '../ui';

// Define a single source of truth for maximum upload size in megabytes
const MAX_FILE_SIZE_MB = 100;

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

  // Auto‑clear success messages
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const fetchDocuments = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/documents');
      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      } else {
        // If backend is not available, show demo data
        console.warn('Backend API not available, showing demo data');
        setDocuments([
          { id: 1, filename: 'demo-document-1.pdf', department: 'General' },
          { id: 2, filename: 'demo-document-2.txt', department: 'Engineering' },
          { id: 3, filename: 'demo-document-3.docx', department: 'Marketing' }
        ]);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
      // Show demo data when backend is not available
      setDocuments([
        { id: 1, filename: 'demo-document-1.pdf', department: 'General' },
        { id: 2, filename: 'demo-document-2.txt', department: 'Engineering' },
        { id: 3, filename: 'demo-document-3.docx', department: 'Marketing' }
      ]);
    }
  };

  /**
   * Handle multiple file uploads with client‑side size validation.  Files
   * exceeding MAX_FILE_SIZE_MB will be rejected and a descriptive
   * message will be shown to the user.
   */
  const handleMultipleFileUpload = async (event) => {
    const files = Array.from(event.target.files);
    if (files.length === 0) return;
    // Validate file sizes against new limit
    const oversizedFiles = files.filter((file) => file.size > MAX_FILE_SIZE_MB * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError(
        `Files too large (max ${MAX_FILE_SIZE_MB}MB): ${oversizedFiles.map((f) => f.name).join(', ')}`
      );
      return;
    }
    setUploading(true);
    setError(null);
    setSuccess(null);
    // Initialize progress trackers
    const initialProgress = files.map((file) => ({
      filename: file.name,
      status: 'uploading',
      progress: 0,
      size: file.size,
    }));
    setUploadProgress(initialProgress);
    try {
      const uploadPromises = files.map(async (file, index) => {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('department', 'General');
          const response = await fetch('http://localhost:8000/api/v1/documents', {
            method: 'POST',
            body: formData,
          });
          if (response.ok) {
            const result = await response.json();
            setUploadProgress((prev) =>
              prev.map((item, i) =>
                i === index ? { ...item, status: 'complete', progress: 100, documentId: result.document_id } : item
              )
            );
            return { success: true, filename: file.name, documentId: result.document_id };
          } else {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || `Upload failed for ${file.name}`);
          }
        } catch (uploadErr) {
          setUploadProgress((prev) =>
            prev.map((item, i) => (i === index ? { ...item, status: 'error', progress: 0, error: uploadErr.message } : item))
          );
          return { success: false, filename: file.name, error: uploadErr.message };
        }
      });
      const results = await Promise.all(uploadPromises);
      const successful = results.filter((r) => r.success);
      const failed = results.filter((r) => !r.success);
      if (successful.length > 0) {
        setSuccess(
          `Successfully uploaded ${successful.length} file${successful.length > 1 ? 's' : ''}`
        );
      }
      if (failed.length > 0) {
        setError(
          `Failed to upload ${failed.length} file${failed.length > 1 ? 's' : ''}: ${failed
            .map((f) => f.filename)
            .join(', ')}`
        );
      }
      await fetchDocuments();
      setTimeout(() => {
        setUploadProgress([]);
      }, 4000);
    } catch (err) {
      setError(`Upload failed: ${err.message}`);
      setUploadProgress([]);
    } finally {
      setUploading(false);
      if (event.target) {
        event.target.value = '';
      }
    }
  };

  // Remaining handlers (delete, drag & drop) mirror the original implementation
  const handleDeleteDocument = async (documentId, filename) => {
    setDeleting((prev) => new Set([...prev, documentId]));
    try {
      const response = await fetch(`http://localhost:8000/api/v1/documents/${documentId}`, { method: 'DELETE' });
      if (response.ok) {
        setDocuments((prev) => prev.filter((doc) => doc.id !== documentId));
        setDeleteConfirm(null);
        setSuccess(`Successfully deleted "${filename}"`);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Delete failed');
      }
    } catch (delErr) {
      setError(`Failed to delete ${filename}: ${delErr.message}`);
    } finally {
      setDeleting((prev) => {
        const next = new Set(prev);
        next.delete(documentId);
        return next;
      });
    }
  };

  const handleChooseFiles = () => {
    if (fileInputRef.current) fileInputRef.current.click();
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
      const syntheticEvent = { target: { files: files, value: '' } };
      handleMultipleFileUpload(syntheticEvent);
    }
  };
  const confirmDelete = (doc) => {
    setDeleteConfirm(doc);
  };
  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header - Fixed */}
      <div className="flex-shrink-0 p-6 pb-4">
        <h1 className="text-2xl font-bold text-white">
          Documents
          <span className="text-yellow-400 text-lg ml-2">*</span>
        </h1>
        <p className="text-gray-400 text-sm">
          <span className="text-yellow-400">*Demo Data</span> - Backend API not available
        </p>
      </div>
      
      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar smooth-scroll">
        <div className="space-y-4">
      {/* File upload area */}
      <div
        className={`border-2 border-dashed rounded p-6 text-center ${
          dragActive ? 'border-blue-500 bg-gray-700' : 'border-gray-600'
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          onChange={handleMultipleFileUpload}
          ref={fileInputRef}
          className="hidden"
        />
        <p className="text-gray-400 mb-2">Drag and drop files here or click to select</p>
        <button
          onClick={handleChooseFiles}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
        >
          Choose Files
        </button>
        <p className="text-xs text-gray-500 mt-2">Maximum file size: {MAX_FILE_SIZE_MB}MB</p>
      </div>
      {/* Upload progress */}
      {uploadProgress.length > 0 && (
        <div className="space-y-2">
          {uploadProgress.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm text-gray-300">
              <span>{item.filename}</span>
              <span>
                {item.status === 'uploading' && `${item.progress}%`}
                {item.status === 'complete' && '✅ Uploaded'}
                {item.status === 'error' && '❌ Error'}
              </span>
            </div>
          ))}
        </div>
      )}
      {/* Error and success messages */}
      {error && (
        <div className="bg-red-900 border border-red-500 rounded p-4 text-red-300">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-900 border border-green-500 rounded p-4 text-green-300">
          {success}
        </div>
      )}
      {/* Documents list */}
      <div className="overflow-y-auto pr-2 custom-scrollbar smooth-scroll">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map((doc) => (
            <div key={doc.id} className="bg-gray-800 p-4 rounded shadow relative">
              <div className="text-lg text-white mb-2 truncate" title={doc.filename || doc.document_name}>
                {doc.filename || doc.document_name}
              </div>
              <div className="text-sm text-gray-400 mb-4">Department: {doc.department || 'General'}</div>
              <div className="flex justify-between items-center">
                <button
                  onClick={() => confirmDelete(doc)}
                  disabled={deleting.has(doc.id)}
                  className="px-3 py-1 bg-red-600 rounded text-white hover:bg-red-500 disabled:bg-red-800"
                >
                  {deleting.has(doc.id) ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Delete confirmation modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-800 p-6 rounded shadow w-80 space-y-4">
            <h3 className="text-lg text-white font-semibold">Confirm Deletion</h3>
            <p className="text-gray-300">Are you sure you want to delete "{deleteConfirm.filename || deleteConfirm.document_name}"?</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={cancelDelete}
                className="px-3 py-1 bg-gray-600 rounded text-white hover:bg-gray-500"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteDocument(deleteConfirm.id, deleteConfirm.filename || deleteConfirm.document_name)}
                className="px-3 py-1 bg-red-600 rounded text-white hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
};

export default DocumentsPage;
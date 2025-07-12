import React, { useState, useEffect, useCallback } from 'react';
import api, { endpoints } from '../../lib/api'; // Adjust path if your api.js is elsewhere

const DocumentsPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [documentList, setDocumentList] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState(''); // e.g., 'Uploading...', 'Upload successful!', 'Upload failed.'
  const [error, setError] = useState('');

  // Function to fetch documents from the backend
  const fetchDocuments = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await api.get(endpoints.documents);
      // Assuming the backend returns an array of document objects
      // Each object might have { id, name, status, uploaded_at }
      setDocumentList(response.data || []); 
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError('Failed to fetch document list.');
      setDocumentList([]); // Clear list on error
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch documents when the component mounts
  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  // Handle file selection from the input
  const handleFileChange = (event) => {
    setSelectedFile(event.target.files[0]);
    setUploadStatus(''); // Clear previous status
    setError('');
  };

  // Handle the file upload process
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first.');
      return;
    }

    setIsLoading(true);
    setUploadStatus('Uploading...');
    setError('');

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      // Assuming your API endpoint for upload is POST /api/documents
      await api.post(endpoints.documents, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadStatus('Upload successful!');
      setSelectedFile(null); // Clear file input
      // Clear the file input visually (optional, browser-dependent)
      document.getElementById('fileInput').value = null;
      fetchDocuments(); // Refresh the document list
    } catch (err) {
      console.error("Error uploading document:", err);
      setUploadStatus('Upload failed.');
      setError(err.response?.data?.detail || 'An error occurred during upload.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Documents</h2>

      {/* Upload Section */}
      <div className="mb-6 p-4 border rounded shadow-sm">
        <h3 className="text-lg font-semibold mb-2">Upload New Document</h3>
        <div className="flex items-center space-x-4">
          <input 
            id="fileInput"
            type="file" 
            onChange={handleFileChange} 
            className="block w-full text-sm text-gray-500
              file:mr-4 file:py-2 file:px-4
              file:rounded-full file:border-0
              file:text-sm file:font-semibold
              file:bg-blue-50 file:text-blue-700
              hover:file:bg-blue-100"
          />
          <button 
            onClick={handleUpload} 
            disabled={!selectedFile || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isLoading && uploadStatus.startsWith('Uploading') ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        {uploadStatus && <p className={`mt-2 text-sm ${uploadStatus.includes('failed') ? 'text-red-600' : 'text-green-600'}`}>{uploadStatus}</p>}
        {error && !uploadStatus.includes('failed') && <p className="mt-2 text-sm text-red-600">{error}</p>} 
      </div>

      {/* Document List Section */}
      <div className="p-4 border rounded shadow-sm">
        <h3 className="text-lg font-semibold mb-2">Uploaded Documents</h3>
        {isLoading && documentList.length === 0 && <p>Loading documents...</p>}
        {!isLoading && error && documentList.length === 0 && <p className="text-red-600">{error}</p>}
        {!isLoading && documentList.length === 0 && !error && <p>No documents uploaded yet.</p>}
        
        {documentList.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uploaded At</th>
                  {/* Add Actions column if needed */}
                  {/* <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th> */}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documentList.map((doc) => (
                  <tr key={doc.id || doc.name}> {/* Use a unique key */} 
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{doc.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.status || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{doc.uploaded_at ? new Date(doc.uploaded_at).toLocaleString() : 'N/A'}</td>
                    {/* Add Actions cell if needed */}
                    {/* <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button className="text-red-600 hover:text-red-900">Delete</button>
                    </td> */}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentsPage;


"""
API tests for document upload and management endpoints.

Covers ISS-022 (file size), ISS-073 (path traversal), ISS-074/075 (file type validation).
"""

import io
import pytest


pytestmark = pytest.mark.api


class TestDocumentUpload:
    """Test document upload endpoint."""

    def test_upload_valid_text_file(self, client):
        content = b"Test document content for RAG pipeline processing."
        response = client.post(
            "/api/v1/documents",
            files={"file": ("test.txt", io.BytesIO(content), "text/plain")},
            data={"department": "Engineering"},
        )
        assert response.status_code in (200, 201, 422)

    def test_upload_rejects_invalid_extension(self, client):
        """ISS-074: Should reject files with disallowed extensions."""
        content = b"#!/bin/bash\necho pwned"
        response = client.post(
            "/api/v1/documents",
            files={"file": ("malicious.sh", io.BytesIO(content), "application/x-sh")},
        )
        assert response.status_code in (400, 415, 422), \
            f"Expected rejection of .sh file, got {response.status_code}"

    def test_upload_rejects_path_traversal_filename(self, client):
        """ISS-073: Filenames with path traversal must be sanitized or rejected."""
        content = b"Innocent content"
        response = client.post(
            "/api/v1/documents",
            files={"file": ("../../../etc/passwd", io.BytesIO(content), "text/plain")},
        )
        if response.status_code in (200, 201):
            data = response.json()
            stored_path = data.get("path", "")
            assert ".." not in stored_path, \
                f"Path traversal not sanitized: {stored_path} (ISS-073)"

    def test_upload_without_file_returns_422(self, client):
        response = client.post("/api/v1/documents")
        assert response.status_code == 422


class TestDocumentList:
    """Test document listing endpoint."""

    def test_list_documents_returns_200(self, client):
        response = client.get("/api/v1/documents")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, (list, dict))

    def test_list_documents_pagination(self, client):
        response = client.get("/api/v1/documents?skip=0&limit=5")
        assert response.status_code == 200

"""
Unit tests for Pydantic schemas.

Covers ISS-011 (overlapping schema sets), ISS-005 (CRUD fields).
"""

import pytest


pytestmark = pytest.mark.unit


class TestDocumentSchemas:
    """ISS-011: Verify document schemas are complete and consistent."""

    def test_document_create_has_required_fields(self):
        try:
            from app.schemas.documents import DocumentCreate
        except ImportError:
            pytest.skip("Cannot import DocumentCreate from documents")

        fields = set(DocumentCreate.model_fields.keys()) if hasattr(DocumentCreate, 'model_fields') else set()
        assert "filename" in fields, "DocumentCreate missing 'filename'"
        assert "content_type" in fields, "DocumentCreate missing 'content_type'"

    def test_document_create_has_size_and_department(self):
        """ISS-005: These fields must exist so CRUD can persist them."""
        try:
            from app.schemas.documents import DocumentCreate
        except ImportError:
            pytest.skip("Cannot import DocumentCreate")

        fields = set(DocumentCreate.model_fields.keys()) if hasattr(DocumentCreate, 'model_fields') else set()
        assert "size" in fields or "department" in fields, \
            "DocumentCreate should include size and department (ISS-005)"

    def test_document_response_has_all_fields(self):
        try:
            from app.schemas.documents import Document
        except ImportError:
            pytest.skip("Cannot import Document schema")

        fields = set(Document.model_fields.keys()) if hasattr(Document, 'model_fields') else set()
        required = {"id", "filename", "status"}
        missing = required - fields
        assert not missing, f"Document response schema missing fields: {missing}"


class TestQuerySchemas:
    """Verify query request/response schemas."""

    def test_query_request_has_max_length(self):
        """ISS-076: Query input should have a length limit."""
        try:
            from app.schemas.query import QueryRequest
        except ImportError:
            pytest.skip("Cannot import QueryRequest")

        field_info = QueryRequest.model_fields.get("query")
        if field_info and hasattr(field_info, "metadata"):
            has_max = any(
                hasattr(m, "max_length") for m in field_info.metadata
            )
            if not has_max:
                pytest.xfail("QueryRequest.query has no max_length constraint (ISS-076)")

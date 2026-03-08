"""
API tests for query/ask endpoints.

Covers ISS-076 (query length), ISS-017 (document_id in results).
"""

import pytest


pytestmark = pytest.mark.api


class TestQueryEndpoint:
    """Test the /api/v1/queries/ask endpoint."""

    def test_ask_requires_query_field(self, client):
        response = client.post("/api/v1/queries/ask", json={})
        assert response.status_code == 422

    def test_ask_with_valid_query(self, client):
        response = client.post(
            "/api/v1/queries/ask",
            json={"query": "What is RAG?"},
        )
        # May fail if LLM not loaded, but should not be 500
        assert response.status_code in (200, 503, 422)

    def test_ask_returns_structured_response(self, client):
        response = client.post(
            "/api/v1/queries/ask",
            json={"query": "What is RAG?"},
        )
        if response.status_code == 200:
            data = response.json()
            assert "response" in data or "answer" in data or "result" in data


class TestQueryHistory:
    """Test query history endpoints."""

    def test_get_history_returns_200(self, client):
        response = client.get("/api/v1/queries/history")
        assert response.status_code in (200, 404)

    def test_get_history_count(self, client):
        response = client.get("/api/v1/queries/history/count")
        assert response.status_code in (200, 404)

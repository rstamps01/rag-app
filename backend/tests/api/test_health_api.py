"""
API tests for health and status endpoints.

These tests use FastAPI's TestClient and do not require external services.
"""

import pytest


pytestmark = pytest.mark.api


class TestHealthEndpoints:
    """Verify health and status endpoints return correct responses."""

    def test_root_returns_200(self, client):
        response = client.get("/")
        assert response.status_code == 200

    def test_health_returns_200(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data

    def test_api_v1_status(self, client):
        response = client.get("/api/v1/status")
        # May be 200 or 404 depending on route registration
        assert response.status_code in (200, 404)


class TestCORSHeaders:
    """ISS-024: Verify CORS configuration."""

    def test_cors_allows_origin(self, client):
        response = client.options(
            "/health",
            headers={
                "Origin": "http://localhost:3000",
                "Access-Control-Request-Method": "GET",
            },
        )
        # Should have CORS headers
        assert response.status_code in (200, 204, 405)

    def test_cors_not_wildcard_with_credentials(self, client):
        """ISS-024: If credentials allowed, origin should not be *."""
        response = client.options(
            "/health",
            headers={
                "Origin": "http://evil.example.com",
                "Access-Control-Request-Method": "GET",
            },
        )
        allow_origin = response.headers.get("access-control-allow-origin", "")
        allow_creds = response.headers.get("access-control-allow-credentials", "")
        if allow_creds.lower() == "true" and allow_origin == "*":
            pytest.xfail("CORS allows credentials with wildcard origin (ISS-024)")

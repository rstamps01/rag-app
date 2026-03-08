"""
Shared test fixtures for the RAG application backend.

Provides database sessions, test clients, mock services, and factories
for creating test data across all test categories.
"""

import os
import sys
import uuid
from datetime import datetime
from unittest.mock import MagicMock, patch

import pytest

# Ensure backend app is importable
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

# Override settings before any app imports
os.environ.setdefault("DATABASE_URL", "postgresql://rag:rag@localhost:5432/rag_test")
os.environ.setdefault("QDRANT_URL", "http://localhost:6333")
os.environ.setdefault("QDRANT_COLLECTION_NAME", "rag_test")
os.environ.setdefault("USE_GPU", "false")
os.environ.setdefault("ENABLE_GPU", "false")
os.environ.setdefault("SECRET_KEY", "test-secret-key-not-for-production")
os.environ.setdefault("JWT_SECRET", "test-secret-key-not-for-production")
os.environ.setdefault("ALGORITHM", "HS256")


# ---------------------------------------------------------------------------
# Markers
# ---------------------------------------------------------------------------

def pytest_configure(config):
    """Register custom markers."""
    config.addinivalue_line("markers", "unit: Unit tests (no external dependencies)")
    config.addinivalue_line("markers", "integration: Integration tests (requires DB/Qdrant)")
    config.addinivalue_line("markers", "api: API endpoint tests (requires TestClient)")
    config.addinivalue_line("markers", "e2e: End-to-end tests (full pipeline)")
    config.addinivalue_line("markers", "slow: Tests that take > 5 seconds")


# ---------------------------------------------------------------------------
# Database fixtures
# ---------------------------------------------------------------------------

@pytest.fixture(scope="session")
def db_engine():
    """Create a test database engine (session-scoped for speed)."""
    try:
        from sqlalchemy import create_engine
        engine = create_engine(
            os.environ["DATABASE_URL"],
            pool_pre_ping=True,
            pool_size=5,
            max_overflow=10,
        )
        yield engine
        engine.dispose()
    except Exception:
        pytest.skip("PostgreSQL not available")


@pytest.fixture(scope="session")
def create_tables(db_engine):
    """Create all tables at session start."""
    try:
        from app.db.base import Base
        Base.metadata.create_all(bind=db_engine)
        yield
        Base.metadata.drop_all(bind=db_engine)
    except Exception:
        pytest.skip("Cannot create tables")


@pytest.fixture
def db_session(db_engine, create_tables):
    """Provide a transactional database session that rolls back after each test."""
    from sqlalchemy.orm import sessionmaker
    Session = sessionmaker(bind=db_engine)
    session = Session()
    try:
        yield session
    finally:
        session.rollback()
        session.close()


# ---------------------------------------------------------------------------
# FastAPI TestClient
# ---------------------------------------------------------------------------

@pytest.fixture
def client(db_session):
    """FastAPI TestClient with overridden DB dependency."""
    try:
        from fastapi.testclient import TestClient
        from app.main import app
        from app.db.session import get_db

        def override_get_db():
            try:
                yield db_session
            finally:
                pass

        app.dependency_overrides[get_db] = override_get_db
        with TestClient(app) as c:
            yield c
        app.dependency_overrides.clear()
    except Exception as e:
        pytest.skip(f"Cannot create TestClient: {e}")


# ---------------------------------------------------------------------------
# Mock services
# ---------------------------------------------------------------------------

@pytest.fixture
def mock_embedding_model():
    """Mock SentenceTransformer that returns deterministic 384-dim vectors."""
    import numpy as np
    model = MagicMock()
    model.encode.side_effect = lambda texts, **kwargs: np.random.RandomState(42).rand(
        len(texts) if isinstance(texts, list) else 1, 384
    ).astype(np.float32)
    return model


@pytest.fixture
def mock_qdrant_client():
    """Mock QdrantClient for unit tests."""
    client = MagicMock()
    client.get_collections.return_value = MagicMock(collections=[])
    client.upsert.return_value = MagicMock(status="completed")
    client.search.return_value = []
    client.scroll.return_value = ([], None)
    return client


# ---------------------------------------------------------------------------
# Test data factories
# ---------------------------------------------------------------------------

class DocumentFactory:
    """Factory for creating test document data."""

    @staticmethod
    def create(
        filename="test_document.pdf",
        content_type="application/pdf",
        department="Engineering",
        size=1024,
        status="uploaded",
    ):
        return {
            "id": str(uuid.uuid4()),
            "filename": filename,
            "content_type": content_type,
            "department": department,
            "size": size,
            "status": status,
            "upload_date": datetime.utcnow(),
            "path": f"/tmp/uploads/{filename}",
        }

    @staticmethod
    def create_text_content(paragraphs=5, words_per_paragraph=100):
        """Generate realistic test text content."""
        import random
        words = [
            "the", "RAG", "application", "processes", "documents", "using",
            "natural", "language", "processing", "and", "vector", "embeddings",
            "to", "enable", "semantic", "search", "across", "enterprise",
            "knowledge", "bases", "with", "high", "accuracy", "retrieval",
            "augmented", "generation", "pipeline", "transforms", "raw", "text",
            "into", "queryable", "chunks", "stored", "in", "Qdrant", "database",
        ]
        paragraphs_list = []
        rng = random.Random(42)
        for _ in range(paragraphs):
            paragraph = " ".join(rng.choices(words, k=words_per_paragraph))
            paragraphs_list.append(paragraph)
        return "\n\n".join(paragraphs_list)


class ChunkFactory:
    """Factory for creating test chunk data."""

    @staticmethod
    def create(document_id=None, chunk_index=0, content="Test chunk content"):
        return {
            "document_id": document_id or str(uuid.uuid4()),
            "chunk_index": chunk_index,
            "content": content,
            "chunk_id": f"{document_id}_chunk_{chunk_index}",
            "filename": "test.pdf",
            "department": "Engineering",
            "file_type": ".pdf",
            "processed_at": datetime.utcnow().timestamp(),
        }


@pytest.fixture
def document_factory():
    return DocumentFactory


@pytest.fixture
def chunk_factory():
    return ChunkFactory


# ---------------------------------------------------------------------------
# Sample files
# ---------------------------------------------------------------------------

@pytest.fixture
def sample_text_file(tmp_path):
    """Create a temporary text file for upload tests."""
    content = "This is a test document for the RAG pipeline.\n" * 50
    file_path = tmp_path / "test_document.txt"
    file_path.write_text(content)
    return file_path


@pytest.fixture
def sample_pdf_bytes():
    """Minimal valid PDF bytes for upload tests."""
    return (
        b"%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
        b"2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n"
        b"3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R>>endobj\n"
        b"xref\n0 4\n0000000000 65535 f \n0000000009 00000 n \n"
        b"0000000058 00000 n \n0000000115 00000 n \n"
        b"trailer<</Size 4/Root 1 0 R>>\nstartxref\n190\n%%EOF"
    )

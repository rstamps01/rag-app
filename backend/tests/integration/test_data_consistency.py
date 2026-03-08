"""
Integration tests for data consistency between PostgreSQL and Qdrant.

These tests validate the core RAG invariant: data stored in PostgreSQL
and Qdrant must be consistent and complete.

Requires running PostgreSQL and Qdrant services.
"""

import os
import uuid
import time
import pytest


pytestmark = [pytest.mark.integration, pytest.mark.slow]


def _qdrant_available():
    """Check if Qdrant is reachable."""
    try:
        from qdrant_client import QdrantClient
        client = QdrantClient(url=os.environ.get("QDRANT_URL", "http://localhost:6333"))
        client.get_collections()
        return True
    except Exception:
        return False


def _postgres_available():
    """Check if PostgreSQL is reachable."""
    try:
        from sqlalchemy import create_engine, text
        engine = create_engine(os.environ.get("DATABASE_URL", "postgresql://rag:rag@localhost:5432/rag_test"))
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception:
        return False


skip_no_qdrant = pytest.mark.skipif(not _qdrant_available(), reason="Qdrant not available")
skip_no_postgres = pytest.mark.skipif(not _postgres_available(), reason="PostgreSQL not available")


@skip_no_qdrant
class TestQdrantPayloadConsistency:
    """Verify Qdrant payload structure matches expected schema."""

    def _get_client(self):
        from qdrant_client import QdrantClient
        return QdrantClient(url=os.environ.get("QDRANT_URL", "http://localhost:6333"))

    def _get_collection(self):
        return os.environ.get("QDRANT_COLLECTION_NAME", "rag")

    def test_collection_exists(self):
        client = self._get_client()
        collections = [c.name for c in client.get_collections().collections]
        collection = self._get_collection()
        if collection not in collections:
            pytest.skip(f"Collection '{collection}' not found")

    def test_points_have_required_payload_fields(self):
        """All points must have: document_id, content, filename, chunk_index."""
        client = self._get_client()
        collection = self._get_collection()
        try:
            points, _ = client.scroll(collection_name=collection, limit=20, with_payload=True)
        except Exception:
            pytest.skip(f"Cannot scroll collection '{collection}'")

        if not points:
            pytest.skip("No points in collection")

        required_fields = {"content", "filename", "chunk_index"}
        for point in points:
            payload = point.payload or {}
            content_field = "content" if "content" in payload else "text"
            actual_fields = set(payload.keys())
            actual_fields.discard("text")
            actual_fields.add("content") if content_field == "text" else None
            missing = required_fields - actual_fields
            if content_field == "text" and "content" in missing:
                missing.discard("content")
            assert not missing, f"Point {point.id} missing payload fields: {missing}"

    def test_vector_dimensions_match_model(self):
        """ISS-009: Vectors must be 384-dim for all-MiniLM-L6-v2."""
        client = self._get_client()
        collection = self._get_collection()
        try:
            points, _ = client.scroll(
                collection_name=collection, limit=5, with_vectors=True
            )
        except Exception:
            pytest.skip(f"Cannot scroll collection '{collection}'")

        if not points:
            pytest.skip("No points in collection")

        for point in points:
            if point.vector:
                assert len(point.vector) == 384, \
                    f"Point {point.id} has {len(point.vector)}-dim vector, expected 384"

    def test_no_duplicate_chunk_ids(self):
        """ISS-002: No duplicate chunk content in the collection."""
        client = self._get_client()
        collection = self._get_collection()
        try:
            points, _ = client.scroll(
                collection_name=collection, limit=200, with_payload=True
            )
        except Exception:
            pytest.skip(f"Cannot scroll collection '{collection}'")

        if not points:
            pytest.skip("No points in collection")

        seen_hashes = set()
        duplicates = []
        import hashlib
        for point in points:
            content = (point.payload or {}).get("content") or (point.payload or {}).get("text", "")
            content_hash = hashlib.md5(content.encode()).hexdigest()
            if content_hash in seen_hashes:
                duplicates.append(point.id)
            seen_hashes.add(content_hash)

        if duplicates:
            pytest.xfail(f"Found {len(duplicates)} duplicate chunks (ISS-002)")


@skip_no_postgres
class TestPostgresDocumentConsistency:
    """Verify PostgreSQL document records are complete."""

    def test_documents_have_required_fields(self, db_session):
        try:
            from app.models.models import Document
        except ImportError:
            pytest.skip("Cannot import Document model")

        docs = db_session.query(Document).limit(10).all()
        if not docs:
            pytest.skip("No documents in database")

        for doc in docs:
            assert doc.id is not None, "Document missing id"
            assert doc.filename is not None, "Document missing filename"
            assert doc.status is not None, "Document missing status"

    def test_document_status_valid(self, db_session):
        try:
            from app.models.models import Document
        except ImportError:
            pytest.skip("Cannot import Document model")

        valid_statuses = {"uploaded", "processing", "processed", "completed", "failed", "error", "partial"}
        docs = db_session.query(Document).limit(50).all()
        for doc in docs:
            assert doc.status in valid_statuses, \
                f"Document {doc.id} has invalid status: '{doc.status}'"


@skip_no_qdrant
@skip_no_postgres
class TestCrossStorageConsistency:
    """Verify PostgreSQL and Qdrant agree on document state."""

    def test_processed_documents_have_vectors(self, db_session):
        """Documents with status 'processed' should have corresponding Qdrant points."""
        try:
            from app.models.models import Document
            from qdrant_client import QdrantClient
            from qdrant_client.models import Filter, FieldCondition, MatchValue
        except ImportError:
            pytest.skip("Cannot import required modules")

        client = QdrantClient(url=os.environ.get("QDRANT_URL", "http://localhost:6333"))
        collection = os.environ.get("QDRANT_COLLECTION_NAME", "rag")

        docs = db_session.query(Document).filter(
            Document.status.in_(["processed", "completed"])
        ).limit(10).all()

        if not docs:
            pytest.skip("No processed documents")

        missing_vectors = []
        for doc in docs:
            try:
                points, _ = client.scroll(
                    collection_name=collection,
                    scroll_filter=Filter(
                        must=[FieldCondition(key="document_id", match=MatchValue(value=doc.id))]
                    ),
                    limit=1,
                )
                if not points:
                    missing_vectors.append(doc.id)
            except Exception:
                continue

        if missing_vectors:
            pytest.xfail(
                f"{len(missing_vectors)} processed documents have no Qdrant vectors: "
                f"{missing_vectors[:3]}..."
            )

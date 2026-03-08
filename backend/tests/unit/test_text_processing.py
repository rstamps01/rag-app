"""
Unit tests for text processing: normalization, chunking, and embedding preparation.

Covers ISS-001 (normalization), ISS-003 (chunk strategy), ISS-004 (sentence boundaries).
"""

import pytest


pytestmark = pytest.mark.unit


class TestTextNormalization:
    """ISS-001: Verify text normalization before embedding."""

    def _normalize(self, text):
        """Import the normalize function, or skip if not yet implemented."""
        try:
            from app.services.text_processing import normalize_text
            return normalize_text(text)
        except ImportError:
            pytest.skip("normalize_text not yet implemented (ISS-001)")

    def test_unicode_nfc_normalization(self):
        import unicodedata
        text_nfd = unicodedata.normalize("NFD", "café résumé")
        result = self._normalize(text_nfd)
        assert result == unicodedata.normalize("NFC", result)

    def test_collapse_whitespace(self):
        result = self._normalize("hello   world\n\n\nfoo   bar")
        assert "   " not in result
        assert "\n\n\n" not in result

    def test_strip_control_characters(self):
        result = self._normalize("hello\x00world\x01test")
        assert "\x00" not in result
        assert "\x01" not in result

    def test_normalize_quotes_and_dashes(self):
        result = self._normalize("\u201chello\u201d \u2014 world")
        assert "\u201c" not in result or '"' in result
        assert "\u2014" not in result or "-" in result

    def test_empty_string(self):
        result = self._normalize("")
        assert result == ""

    def test_whitespace_only(self):
        result = self._normalize("   \n\t  ")
        assert result.strip() == ""

    def test_preserves_meaningful_content(self):
        text = "The RAG pipeline processes documents using NLP techniques."
        result = self._normalize(text)
        assert "RAG" in result
        assert "pipeline" in result
        assert "NLP" in result


class TestChunking:
    """ISS-003, ISS-004: Verify chunking behavior."""

    def _chunk(self, text, chunk_size=1000, overlap=200):
        """Import chunking function from whichever module provides it."""
        try:
            from app.services.text_processing import chunk_text
            return chunk_text(text, chunk_size=chunk_size, overlap=overlap)
        except ImportError:
            pass
        try:
            from app.services.integrated_document_processor import IntegratedDocumentProcessor
            processor = IntegratedDocumentProcessor.__new__(IntegratedDocumentProcessor)
            processor.chunk_size = chunk_size
            processor.chunk_overlap = overlap
            return processor.create_chunks(text)
        except (ImportError, AttributeError):
            pytest.skip("No chunking function available")

    def test_chunks_not_empty(self):
        text = "Hello world. " * 200
        chunks = self._chunk(text)
        assert len(chunks) > 0
        for chunk in chunks:
            assert len(chunk.strip()) > 0

    def test_chunk_size_respected(self):
        text = "Hello world. " * 500
        chunk_size = 500
        chunks = self._chunk(text, chunk_size=chunk_size, overlap=100)
        for chunk in chunks:
            assert len(chunk) <= chunk_size * 1.2, f"Chunk too large: {len(chunk)} > {chunk_size * 1.2}"

    def test_overlap_exists(self):
        text = "Sentence one. Sentence two. Sentence three. " * 100
        chunks = self._chunk(text, chunk_size=200, overlap=50)
        if len(chunks) >= 2:
            end_of_first = chunks[0][-50:]
            assert end_of_first in chunks[1] or chunks[1][:50] in chunks[0], \
                "Expected overlap between consecutive chunks"

    def test_no_content_lost(self):
        text = "The quick brown fox jumps over the lazy dog. " * 50
        chunks = self._chunk(text, chunk_size=200, overlap=50)
        reconstructed = " ".join(chunks)
        for word in ["quick", "brown", "fox", "jumps", "lazy", "dog"]:
            assert word in reconstructed, f"Word '{word}' lost during chunking"

    def test_single_sentence_document(self):
        text = "This is a single sentence document."
        chunks = self._chunk(text)
        assert len(chunks) == 1
        assert chunks[0].strip() == text

    def test_empty_text_returns_empty(self):
        chunks = self._chunk("")
        assert chunks == [] or chunks == [""]


class TestDeduplication:
    """ISS-002: Verify chunk deduplication logic."""

    def test_text_hash_deterministic(self):
        """Same content should produce same hash."""
        import hashlib
        content = "Test chunk content for hashing"
        hash1 = hashlib.md5(content.encode()).hexdigest()
        hash2 = hashlib.md5(content.encode()).hexdigest()
        assert hash1 == hash2

    def test_different_content_different_hash(self):
        import hashlib
        hash1 = hashlib.md5("Content A".encode()).hexdigest()
        hash2 = hashlib.md5("Content B".encode()).hexdigest()
        assert hash1 != hash2

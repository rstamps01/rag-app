"""
Unified Document Ingestion Service (ISS-006).

Single code path: upload → extract → normalize → chunk → deduplicate → embed → store.
Replaces four divergent pipeline implementations.
"""

import hashlib
import logging
import os
import time
import uuid
from typing import Dict, List, Optional, Tuple

from app.core.config import settings
from app.services.text_processing import chunk_text, normalize_text, text_hash

logger = logging.getLogger(__name__)


class DocumentIngestionService:
    """Orchestrates the full document ingestion pipeline."""

    def __init__(
        self,
        embedding_model=None,
        qdrant_client=None,
    ):
        self.embedding_model = embedding_model
        self.qdrant_client = qdrant_client

    # ------------------------------------------------------------------
    # Text extraction
    # ------------------------------------------------------------------

    def extract_text(self, file_path: str, file_ext: str) -> str:
        """Extract text from a file. Supports .txt, .md, .pdf, .docx."""
        ext = file_ext.lower()
        try:
            if ext in (".txt", ".md"):
                with open(file_path, "r", encoding="utf-8", errors="replace") as f:
                    return f.read()

            if ext == ".pdf":
                return self._extract_pdf(file_path)

            if ext == ".docx":
                return self._extract_docx(file_path)

            logger.warning("Unsupported file extension %s, returning empty", ext)
            return ""
        except Exception:
            logger.exception("Text extraction failed for %s", file_path)
            return ""

    @staticmethod
    def _extract_pdf(file_path: str) -> str:
        try:
            import PyPDF2
        except ImportError:
            logger.error("PyPDF2 not installed — cannot read PDFs")
            return ""

        pages: List[str] = []
        with open(file_path, "rb") as f:
            reader = PyPDF2.PdfReader(f)
            for page_num, page in enumerate(reader.pages, 1):
                page_text = page.extract_text() or ""
                if page_text.strip():
                    pages.append(page_text)
        return "\n".join(pages)

    @staticmethod
    def _extract_docx(file_path: str) -> str:
        try:
            import docx
        except ImportError:
            logger.error("python-docx not installed — cannot read DOCX")
            return ""

        doc = docx.Document(file_path)
        return "\n".join(p.text for p in doc.paragraphs if p.text.strip())

    # ------------------------------------------------------------------
    # Embedding
    # ------------------------------------------------------------------

    def embed_chunks(self, chunks: List[str]) -> List[List[float]]:
        """
        Embed a list of text chunks. Uses batch encoding with GPU if available (ISS-009).
        """
        if self.embedding_model is None:
            raise RuntimeError("Embedding model not loaded")

        batch_size = int(getattr(settings, "BATCH_SIZE", 32))
        device = None
        if settings.ENABLE_GPU:
            try:
                import torch
                if torch.cuda.is_available():
                    device = "cuda"
            except ImportError:
                pass

        vectors = self.embedding_model.encode(
            chunks,
            batch_size=batch_size,
            show_progress_bar=False,
            device=device,
        )
        return [v.tolist() for v in vectors]

    # ------------------------------------------------------------------
    # Deduplication
    # ------------------------------------------------------------------

    def deduplicate_chunks(
        self, chunks: List[str], document_id: str
    ) -> Tuple[List[str], int]:
        """
        Remove duplicate chunks within a document (ISS-002).

        Returns (unique_chunks, duplicates_removed).
        """
        seen_hashes: set = set()
        unique: List[str] = []
        for chunk in chunks:
            h = text_hash(chunk)
            if h not in seen_hashes:
                seen_hashes.add(h)
                unique.append(chunk)
        removed = len(chunks) - len(unique)
        if removed:
            logger.info(
                "Dedup: removed %d duplicate chunks from document %s",
                removed,
                document_id,
            )
        return unique, removed

    # ------------------------------------------------------------------
    # Qdrant storage
    # ------------------------------------------------------------------

    def store_vectors(
        self,
        document_id: str,
        filename: str,
        department: str,
        chunks: List[str],
        vectors: List[List[float]],
    ) -> int:
        """
        Upsert vectors + payloads to Qdrant. Returns count of stored vectors.
        """
        if self.qdrant_client is None:
            raise RuntimeError("Qdrant client not initialized")

        from qdrant_client.models import PointStruct

        collection = settings.QDRANT_COLLECTION_NAME
        file_ext = os.path.splitext(filename)[1].lower()
        now = time.time()

        points = []
        for idx, (chunk, vector) in enumerate(zip(chunks, vectors)):
            chunk_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{document_id}_{idx}"))
            point = PointStruct(
                id=chunk_id,
                vector=vector,
                payload={
                    "document_id": document_id,
                    "filename": filename,
                    "department": department or "general",
                    "chunk_index": idx,
                    "chunk_text": chunk,
                    "text_hash": text_hash(chunk),
                    "file_type": file_ext,
                    "processed_at": now,
                    "chunk_id": chunk_id,
                },
            )
            points.append(point)

        self.qdrant_client.upsert(collection_name=collection, points=points)
        return len(points)

    # ------------------------------------------------------------------
    # Full pipeline
    # ------------------------------------------------------------------

    def ingest(
        self,
        document_id: str,
        file_path: str,
        filename: str,
        department: str = "",
    ) -> Dict:
        """
        Run the full ingestion pipeline for a single document.

        Returns a summary dict with chunk/vector counts and timing.
        """
        t0 = time.time()

        file_ext = os.path.splitext(filename)[1].lower()
        raw_text = self.extract_text(file_path, file_ext)
        if not raw_text.strip():
            return {"status": "error", "reason": "no_text_extracted"}

        normalized = normalize_text(raw_text)
        chunks = chunk_text(normalized)
        chunks, dups = self.deduplicate_chunks(chunks, document_id)

        if not chunks:
            return {"status": "error", "reason": "no_chunks_after_dedup"}

        vectors = self.embed_chunks(chunks)
        stored = self.store_vectors(document_id, filename, department, chunks, vectors)

        elapsed = round(time.time() - t0, 2)
        logger.info(
            "Ingested %s: %d chunks, %d vectors in %.2fs (dedup removed %d)",
            filename,
            len(chunks),
            stored,
            elapsed,
            dups,
        )
        return {
            "status": "completed",
            "chunks": len(chunks),
            "vectors_stored": stored,
            "duplicates_removed": dups,
            "processing_time_s": elapsed,
        }

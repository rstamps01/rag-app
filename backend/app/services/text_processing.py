"""
Unified text processing: normalization, chunking, and deduplication.

Addresses ISS-001, ISS-003, ISS-004.
"""

import hashlib
import re
import unicodedata
from typing import List, Optional

from app.core.config import settings


def normalize_text(text: str) -> str:
    """
    Normalize text before embedding (ISS-001).

    - Unicode NFC normalization
    - Collapse whitespace runs
    - Strip control characters (except newline)
    """
    text = unicodedata.normalize("NFC", text)
    text = re.sub(r"[^\S\n]+", " ", text)
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()


def _split_sentences(text: str) -> List[str]:
    """
    Split text into sentences using regex heuristics (ISS-004).

    Handles abbreviations (Dr., Mr., etc.), decimal numbers, and
    common sentence-ending punctuation.
    """
    abbrev = r"(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|Inc|Ltd|Co|Corp|Dept|Univ|Est)"
    pattern = rf"(?<!\b{abbrev})(?<!\d)[.!?]+(?=\s+[A-Z]|\s*$)"
    parts = re.split(pattern, text)
    sentences = [s.strip() for s in parts if s and s.strip()]
    return sentences


def chunk_text(
    text: str,
    chunk_size: Optional[int] = None,
    overlap: Optional[int] = None,
    strategy: Optional[str] = None,
) -> List[str]:
    """
    Split text into overlapping chunks (ISS-003).

    Supports strategies:
      - "character": fixed-size character windows
      - "sentence": tries to break at sentence boundaries (default)
    """
    chunk_size = chunk_size or getattr(settings, "CHUNK_SIZE", 1000)
    overlap = overlap or getattr(settings, "CHUNK_OVERLAP", 200)
    strategy = strategy or getattr(settings, "CHUNK_STRATEGY", "sentence")

    text = text.strip()
    if not text:
        return []
    if len(text) <= chunk_size:
        return [text]

    if strategy == "sentence":
        return _chunk_by_sentence(text, chunk_size, overlap)
    return _chunk_by_character(text, chunk_size, overlap)


def _chunk_by_character(text: str, chunk_size: int, overlap: int) -> List[str]:
    chunks: List[str] = []
    start = 0
    while start < len(text):
        end = min(start + chunk_size, len(text))
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        start = end - overlap
        if start >= len(text):
            break
    return chunks


def _chunk_by_sentence(text: str, chunk_size: int, overlap: int) -> List[str]:
    sentences = _split_sentences(text)
    if not sentences:
        return _chunk_by_character(text, chunk_size, overlap)

    chunks: List[str] = []
    current: List[str] = []
    current_len = 0

    for sent in sentences:
        sent_len = len(sent)
        if current_len + sent_len > chunk_size and current:
            chunks.append(" ".join(current))
            overlap_text = " ".join(current)
            overlap_sents: List[str] = []
            overlap_len = 0
            for s in reversed(current):
                if overlap_len + len(s) > overlap:
                    break
                overlap_sents.insert(0, s)
                overlap_len += len(s) + 1
            current = overlap_sents
            current_len = sum(len(s) for s in current) + max(len(current) - 1, 0)

        current.append(sent)
        current_len += sent_len + (1 if current_len else 0)

    if current:
        chunks.append(" ".join(current))

    return chunks


def text_hash(text: str) -> str:
    """SHA-256 hash of normalized text for deduplication (ISS-002)."""
    return hashlib.sha256(normalize_text(text).encode("utf-8")).hexdigest()

"""
Declarative Base — shared across all models.

Engine and SessionLocal live in session.py; import them from there.
"""

from sqlalchemy.ext.declarative import declarative_base

Base = declarative_base()

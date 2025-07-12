# File Path: backend/app/db/base.py
# OPTIONAL: Simplified version to remove duplication with session.py
# This file can be simplified since session.py already handles everything

from sqlalchemy.ext.declarative import declarative_base

# Create base class for models
Base = declarative_base()

# Note: Session management and get_db function are now in session.py
# This avoids duplication and follows single responsibility principle

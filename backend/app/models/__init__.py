# Import all database models to make them accessible from app.models
from .models import User, Document, QueryHistory, Base

# Make models available at package level
__all__ = ["User", "Document", "QueryHistory", "Base"]

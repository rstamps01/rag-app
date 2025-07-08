# File Path: /home/ubuntu/rag_app_v2/rag-app/backend/app/schemas/token.py
from pydantic import BaseModel

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: str | None = None


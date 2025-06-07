# Pydantic models (DocumentSign, DocumentVerify)
from pydantic import BaseModel
from datetime import datetime
from uuid import UUID

class DocumentCreate(BaseModel):
    user_id: UUID
    filename: str
    status: str
    filehash: str

class DocumentResponse(DocumentCreate):
    document_id: int
    created_at: datetime

class SignPosition(BaseModel):
    x: float
    y: float
    page_number: int

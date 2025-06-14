# Pydantic models (DocumentSign, DocumentVerify)
from pydantic import BaseModel, validator
from datetime import datetime
from uuid import UUID
from typing import Optional

class DocumentCreate(BaseModel):
    user_id: UUID
    filename: str
    status: str
    filehash: str

class DocumentResponse(DocumentCreate):
    document_id: int
    created_at: datetime

class SignPosition(BaseModel):
    page: int
    x: float
    y: float

    @validator('page', pre=True)
    def parse_page(cls, v):
        try:
            return int(float(v))
        except (ValueError, TypeError):
            raise ValueError('page must be convertible to int')

class VerifyPDFResponse(BaseModel):
    valid: bool
    message: str
    original_hash: Optional[str] = None
    signed_hash: Optional[str] = None
    signing_time: Optional[str] = None
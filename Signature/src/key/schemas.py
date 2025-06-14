# Pydantic models (KeyCreate, KeyRevoke)
from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from uuid import UUID

class KeyBase(BaseModel):
    user_id: UUID
 
class SignRequest(BaseModel):
    data: str

class VerifyRequest(BaseModel):
    data: str
    signature: str
    public_key: bytes

class KeyCreate(KeyBase):
    public_key: str
    encrypted_private: str
    salt: str
    nonce: str

class KeyResponse(KeyBase):
    key_id: int
    revoked_at: Optional[datetime] = None
    created_at: datetime

class PublicResponse(KeyResponse):
    public_key: bytes

class PrivateResponse(KeyResponse):
    encrypted_private: bytes

    class Config:
        from_attributes = True  # Cho phép đọc từ SQLAlchemy model


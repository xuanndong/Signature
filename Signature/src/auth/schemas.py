# Pydantic models (UserCreate, Token)
from pydantic import BaseModel, EmailStr
from uuid import UUID

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    user_id: UUID
    username: str
    email: EmailStr

    class Config:
        from_attributes = True # Cho phép đọc từ SQLAlchemy model

class ChangePassword(BaseModel):
    password: str
    newpassword: str
    verifypassword: str

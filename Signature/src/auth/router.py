# API endpoints (register, login, refresh token)
from fastapi import APIRouter, Depends, HTTPException
# from fastapi.security import OAuth2PasswordBearer
from src.auth.utils import create_access_token
from sqlalchemy.ext.asyncio import AsyncSession
from src.auth.schemas import UserCreate, UserLogin, UserResponse
from src.auth.service import create_user, authenticate_user
from src.database import get_db

router = APIRouter(tags=["Auth"])

@router.post("/signup", response_model=UserResponse)
async def signup(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    try:
        user = await create_user(db, user_data)
        return user
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    

@router.post("/login")
async def login(login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    user = await authenticate_user(db, login_data)
    if not user:
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")
    
    token = create_access_token({"sub": str(user.user_id)})
    return {"access_token": token, "token_type": "bearer"}
# API tạo khoá, thu hồi khoá
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from src.database import get_db
from src.key.service import get_public_key, get_private_key, sign_data, verify_data
from src.auth.dependencies import get_current_user_id
from src.key.schemas import VerifyRequest, SignRequest
from dotenv import load_dotenv
from src.key.schemas import PublicResponse, PrivateResponse


import os
 

# Load env
load_dotenv()
aes_key = os.getenv('AES_KEY')
if not aes_key:
    raise HTTPException(
        status_code=404,
        detail="Not found aes key"
    )

router = APIRouter(tags=["Key"])

@router.get("/public", response_model=str)
async def get_user_public_key(
    user_id: str = Depends(get_current_user_id),  # Lấy user_id từ token
    db: AsyncSession = Depends(get_db)
):
    public_key = await get_public_key(db, user_id)

    if not public_key:
        raise HTTPException(
            status_code=404,
            detail="Not found public key"
        )
    
    return public_key


@router.get("/private", response_model=str)
async def get_user_private_key(
    user_id: str = Depends(get_current_user_id),  # Lấy user_id từ token
    db: AsyncSession = Depends(get_db)
):
    
    private_key = await get_private_key(db, user_id, aes_key)
        
    return private_key


@router.post("/sign", response_model=dict)
async def sign(
    request: SignRequest,
    user_id: str = Depends(get_current_user_id),  # Lấy user_id từ token
    db: AsyncSession = Depends(get_db),
):
    signed = await sign_data(db, user_id, os.getenv("AES_KEY"), request.data.encode('utf-8'))
    if signed is None:
        return {"notification": "Failess"}
    else:
        return {"notification": "Success", "signature": signed}
    

@router.post("/verify", response_model=dict)
async def verify(
    signed_data: VerifyRequest,
    user_id: str = Depends(get_current_user_id),  # Lấy user_id từ token
    db: AsyncSession = Depends(get_db),
):
    verify = await verify_data(db, user_id, signed_data.public_key, signed_data.data.encode('utf-8'), signed_data.signature)
    return verify

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from src.auth.utils import decode_token, oauth2_scheme

# Lấy từ router.py
from src.database import get_db

# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

# async def get_current_user_id(token: str = Depends(oauth2_scheme)):
#     payload = decode_token(token)
#     jti = payload.get("jti")
    
#     if jti in token_blacklist:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Token đã bị thu hồi"
#         )
    
#     user_id = payload.get("sub")
#     if not user_id:
#         raise HTTPException(
#             status_code=status.HTTP_401_UNAUTHORIZED,
#             detail="Không thể xác thực người dùng"
#         )
    
#     user = await get_user_by_id(db, user_id)
#     if not user:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Người dùng không tồn tại"
#         )
    
#     return user

async def get_current_user_id(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated!")
    
    try:
        payload = decode_token(token)
        # jti = payload.get("jti")
        
        # if jti in token_blacklist:
        #     raise HTTPException(
        #         status_code=status.HTTP_401_UNAUTHORIZED,
        #         detail="Token đã bị thu hồi"
        #     )
        
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Không thể xác thực người dùng"
            )
        
        return str(user_id)
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Xác thực thất bại: {str(e)}"
        )
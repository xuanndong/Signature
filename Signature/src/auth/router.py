# API endpoints (register, login, refresh token)
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from src.auth.utils import create_access_token, create_refresh_token, decode_token
from sqlalchemy.ext.asyncio import AsyncSession
from src.auth.schemas import UserCreate, UserLogin, TokenResponse, UserResponse, UserUpdate
from src.auth.service import create_user, authenticate_user, get_current_user
from src.database import get_db
from src.auth.utils import oauth2_scheme
from src.auth.dependencies import get_current_user_id

router = APIRouter(tags=["Auth"])

# Danh sách token bị thu hồi (trong production nên dùng Redis)
token_blacklist = set()

@router.post("/signup", response_model=TokenResponse)
async def signup(user_data: UserCreate, db: AsyncSession = Depends(get_db)):
    """
    Đăng ký tài khoản mới
    
    - Tạo user
    - Tạo key pair
    - Trả về tokens ngay sau khi đăng ký
    """
    user = await create_user(db, user_data)
    
    return {
        "access_token": create_access_token({"sub": str(user.user_id)}),
        "refresh_token": create_refresh_token({"sub": str(user.user_id)}),
        "token_type": "bearer"
    }


@router.post("/login", response_model=TokenResponse)
async def login(login_data: UserLogin, db: AsyncSession = Depends(get_db)):
    """
    Đăng nhập bằng email và mật khẩu
    
    - Xác thực thông tin đăng nhập
    - Trả về tokens nếu thành công
    """
    user = await authenticate_user(db, login_data)
    
    return {
        "access_token": create_access_token({"sub": str(user.user_id)}),
        "refresh_token": create_refresh_token({"sub": str(user.user_id)}),
        "token_type": "bearer"
    }


@router.post("/logout")
async def logout(token: str = Depends(oauth2_scheme)):
    """
    Đăng xuất và thêm token vào danh sách đen
    """
    try:
        payload = decode_token(token)
        jti = payload.get("jti")  # JWT ID để định danh token
        
        if jti:
            token_blacklist.add(jti)

        return {"message": "Đăng xuất thành công"}
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Lỗi khi đăng xuất: {str(e)}"
        )


# @router.patch("/update")
# async def update_user(
#     user_update: UserUpdate,
#     current_user = Depends(get_current_user),
#     db: AsyncSession = Depends(get_db)
# ):
#     """
#     Cập nhật thông tin người dùng
    
#     - Yêu cầu token JWT hợp lệ
#     - Chỉ cần gửi các trường muốn cập nhật
#     """
#     update_data = user_update.dict(exclude_unset=True)
    
#     for field, value in update_data.items():
#         setattr(current_user, field, value)
    
#     await db.commit()
#     await db.refresh(current_user)
    
#     return {
#         "message": "User updated successfully",
#         "updated_fields": list(update_data.keys()),
#         "user_id": current_user.id
#     }
    

async def verify_token_not_blacklisted(token: str = Depends(oauth2_scheme)):
    payload = decode_token(token)
    jti = payload.get("jti")
    
    if jti and jti in token_blacklist:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token đã bị thu hồi"
        )
    return payload

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    payload: dict = Depends(verify_token_not_blacklisted),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    user = await get_current_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user


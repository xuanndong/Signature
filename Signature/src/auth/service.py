# Logic đăng ký, đăng nhập, JWT
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.models import User
from src.models import Key
from src.auth.utils import hash_password, verify_password
from src.key.service import generate_rsa_key_pair
from src.key.utils import encrypt_private_key, base_public_key
from src.auth.schemas import UserCreate, UserLogin, UserResponse
from src.key.schemas import KeyCreate
from dotenv import load_dotenv
import os
import re
from fastapi import HTTPException, status
 
# Load env
load_dotenv()

def validate_user_input(username: str, password: str) -> None:
    username_pattern = r'^[a-zA-Z0-9_]{4,20}$'
    password_pattern = r'^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$'
    
    if not re.match(username_pattern, username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username phải từ 4-20 ký tự và chỉ chứa chữ cái, số hoặc gạch dưới"
        )
    if not re.match(password_pattern, password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mật khẩu phải có ít nhất 8 ký tự, bao gồm cả chữ và số"
        )
    

# Đăng ký
async def create_user(db: AsyncSession, user_data: UserCreate) -> User:

    validate_user_input(username=user_data.username, password=user_data.password)

    existing_user = await db.execute(
        select(User).where(
            (User.email == user_data.email) |
            (User.username == user_data.username)
        )
    )

    if existing_user.scalar_one_or_none():
        raise HTTPException(
            status_code=400,
            detail="Email hoặc username đã được sử dụng"
        )

    try:
        # Create new user
        new_user = User(
            username = user_data.username,
            email = user_data.email,
            password_hash = hash_password(user_data.password)
        )
        db.add(new_user)
        await db.flush()  # Lấy user_id

        # Sinh cặp khoá
        private_key, public_key = generate_rsa_key_pair()
        encrypted_data = encrypt_private_key(private_key, os.getenv('AES_KEY'))

        # Create new key
        new_key: KeyCreate = Key(
            user_id = new_user.user_id,
            public_key = base_public_key(public_key),
            encrypted_private = encrypted_data["encrypted_key"],
            salt = encrypted_data["salt"],
            nonce = encrypted_data["nonce"]
        )
        db.add(new_key)
        await db.commit()

        await db.refresh(new_user)
        await db.refresh(new_key)

        return new_user

    except Exception as e:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Lỗi khi tạo người dùng: {str(e)}"
        )

# Đăng nhập
async def authenticate_user(db: AsyncSession, login_data: UserLogin) -> User:
    """Xác thực user và trả về model User nếu thành công"""
    user = await db.execute(
        select(User).where(User.email == login_data.email)
    )
    user = user.scalar_one_or_none()
    
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email hoặc mật khẩu không đúng",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return user


# Lấy thông tin ngừoi dùng
async def get_current_user(db: AsyncSession, user_id: str) -> UserResponse:
    """Lấy thông tin user dựa trên user_id"""
    user = await db.execute(
        select(User).where(User.user_id == user_id)
    )
    user = user.scalar_one_or_none()
    
    if not user:
        return None
    
    return UserResponse(
        user_id=str(user.user_id),
        username=user.username,
        email=user.email,
        created_at=user.created_at
    )


# có thể thêm password reset flow, email verification, session management

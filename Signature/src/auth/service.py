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
from fastapi import HTTPException

# Load env
load_dotenv()

# Đăng ký
async def create_user(db: AsyncSession, user_data: UserCreate) -> UserResponse:

    username_patten = r'^[a-zA-Z0-9_]{4,20}$'
    if not re.match(username_patten, user_data.username):
        raise HTTPException(
            status_code=400,
            detail="Tên người dùng phải từ 4-20 ký tự và chỉ chứa chữ cái, số và dấu gạch dưới"
        )
    
    # Validate password (min 8 chars, at least 1 letter and 1 number)
    password_pattern = r'^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$'
    if not re.match(password_pattern, user_data.password):
        raise HTTPException(
            status_code=400,
            detail="Mật khẩu phải có ít nhất 8 ký tự, bao gồm cả chữ và số"
        )

    existing_user = await db.execute(
        select(User).where(
            (User.email == user_data.email) |
            (User.username == user_data.username)
        )
    )
    if existing_user.scalar_one_or_none():
        raise ValueError("Email hoặc username đã được sử dụng")
    
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

# Đăng nhập
async def authenticate_user(db: AsyncSession, login_data: UserLogin):
    user = await db.execute(
        select(User).where(User.email == login_data.email)
    )
    user = user.scalar_one_or_none()
    
    if not user or not verify_password(login_data.password, user.password_hash):
        return None
    
    return user

# Lấy thông tin ngừoi dùng
async def get_current_user(db: AsyncSession, user_id: str):
    user = await db.execute(
        select(User).where(User.user_id == user_id)
    )
    user = user.scalar_one_or_none()

    if not user:
        return None
    
    return user

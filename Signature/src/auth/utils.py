# Hàm băm mật khẩu, tạo token
from datetime import datetime, timedelta, timezone
import jwt
import bcrypt
from fastapi import HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from dotenv import load_dotenv
from src.auth.schemas import AuthConfig
import uuid

load_dotenv()

# Password hashing
def hash_password(password: str) -> str:
    """Băm mật khẩu sử dụng bcrypt"""
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Xác minh mật khẩu đã băm"""
    return bcrypt.checkpw(plain_password.encode(), hashed_password.encode())

# JWT Configuration
auth: AuthConfig = AuthConfig()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def create_access_token(data: dict) -> str:
    """Tạo JWT token với JTI (JWT ID)"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({
        "exp": expire,
        "jti": str(uuid.uuid4()),  # Thêm JTI để quản lý token
        "type": "access"
    })
    return jwt.encode(
        payload=to_encode,
        key=auth.SECRET_KEY,
        algorithm=auth.ALGORITHM
    )


# refresh token
REFRESH_TOKEN_EXPIRE_DAYS = 7

def create_refresh_token(data: dict) -> str:
    """Tạo refresh token với JTI"""
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({
        "exp": expire,
        "jti": str(uuid.uuid4()),  # Thêm JTI để quản lý token
        "type": "refresh"
    })
    return jwt.encode(to_encode, auth.SECRET_KEY, algorithm=auth.ALGORITHM)


# Các biến cấu hình (phải giống với khi tạo token)

def decode_token(token: str) -> dict:
    """
    Giải mã JWT token và trả về payload
    - Kiểm tra chữ ký và thời gian hết hạn
    - Trả về HTTPException nếu token không hợp lệ
    """
    try:
        payload = jwt.decode(
            token,
            auth.SECRET_KEY,
            algorithms=[auth.ALGORITHM],
            options={"verify_exp": True}  # Tự động kiểm tra thời hạn token
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token đã hết hạn",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token không hợp lệ: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Lỗi xác thực token: {str(e)}",
            headers={"WWW-Authenticate": "Bearer"},
        )
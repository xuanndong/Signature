# Logic sinh khoá, mã hoá private key
from cryptography.hazmat.primitives.asymmetric import rsa
from src.key.utils import decrypt_private_key
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.models import Key
import base64
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.serialization import load_pem_private_key, load_pem_public_key
from src.key.schemas import PublicResponse, PrivateResponse
from cryptography.exceptions import InvalidSignature



def generate_rsa_key_pair():
    """ Tạo cặp khoá RSA 2048-bit """
    private_key = rsa.generate_private_key ( 
        public_exponent=65537, 
        key_size=2048
    )
    public_key = private_key.public_key()
    return private_key, public_key



async def get_public_key(db: AsyncSession, user_id: str):
    """
    Lấy public key của người dùng hiện tại
    - Yêu cầu đăng nhập (có valid JWT token)
    - Trả về public_key tương ứng với user_id trong token
    """
    result = await db.execute(
        select(Key.public_key).where(Key.user_id == user_id)
    )

    public_key = result.scalar_one_or_none()

    if not public_key:
        return None
    
    public_key = base64.b64decode(public_key)

    return public_key

# Get private key from db and decode
async def get_private_key(db: AsyncSession, user_id: str, aes_key: str):

    key = await db.execute(select(Key).where(Key.user_id == user_id))
    key = key.scalar_one_or_none()

    if not key:
        raise ValueError("Không tìm thấy khoá cho người dùng này")
    
    try:
        private_key = decrypt_private_key(
            {
                "encrypted_key": key.encrypted_private,
                "salt": key.salt,
                "nonce": key.nonce
            },
            aes_key
        )

        return private_key
    
    except ValueError as e:
        raise ValueError("Giải mã thất bại") from e
    except Exception as e:
        raise ValueError(f"Lỗi khi giải mã private key: {str(e)}") from e
    

# Ký số
async def sign_data(db: AsyncSession, user_id: str, aes_key: str, data: bytes):
    """
    Ký dữ liệu bằng private key của người dùng
    """
    private_key = await get_private_key(db, user_id, aes_key)
    private_key_obj = load_pem_private_key(private_key, password=None)

    signature = private_key_obj.sign(
        data,
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA1()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA1() # sử dụng SHA-1 để hash dữ liệu trước khi ký
    )
    
    return base64.b64encode(signature).decode()



# Xác thực chữ ký
async def verify_data(db: AsyncSession, user_id: str, public_key: bytes, data: bytes, signature: str):
    """
    Xác thực chữ ký bằng public key của người dùng
    """
    if not public_key:
        raise ValueError("Not found public key")

    try:
        public_key_obj = load_pem_public_key(public_key)
        signature_bytes = base64.b64decode(signature)  # Convert from base64 to bytes

        public_key_obj.verify(
            signature_bytes,
            data,  # This should already be bytes
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA1()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA1()
        )

        return {"valid": True, "message": "Chữ ký hợp lệ"}
    except InvalidSignature:
        return {"valid": False, "message": "Chữ ký không hợp lệ"}
    except Exception as e:
        return {"valid": False, "message": f"Lỗi xác thực: {str(e)}"} 



async def get_key(db: AsyncSession, user_id: str):
    result = await db.execute(
        select(Key).where(Key.user_id == user_id)
    )
    return result.scalar_one_or_none()
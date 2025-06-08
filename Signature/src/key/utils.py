# Hàm liên quán đến RSA

from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives import serialization
import base64
import os

def base_public_key(public_key):
    """ Chuyển public key sang PEM format """
    pem_bytes = public_key.public_bytes(
        encoding = serialization.Encoding.PEM,
        format = serialization.PublicFormat.SubjectPublicKeyInfo
    )
    return base64.b64encode(pem_bytes).decode()
 
# ----------------------------
# Tạo key từ password
# ----------------------------
def _derive_key(aes_key: str, salt: bytes) -> bytes:
    """ Tạo key 32-byte từ password """
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32, # AES-256 key
        salt=salt,
        iterations=100000
    )
    return kdf.derive(aes_key.encode())

# ----------------------------
# Mã hoá private key
# ----------------------------
def encrypt_private_key(private_key, aes_key: str) -> dict:
    """ Mã hoá private key bằng mật khẩu người dùng """
    # Tạo salt ngẫu nhiên (16-byte)
    salt = os.urandom(16)

    # Dẫn xuất key từ aes_key + salt
    key = _derive_key(aes_key, salt)

    
    # Serialize private key 
    private_pem = private_key.private_bytes(
        encoding = serialization.Encoding.PEM,
        format = serialization.PrivateFormat.PKCS8,
        encryption_algorithm = serialization.NoEncryption()
    )

    # Mã hoá bằng AES-GCM
    aesgcm = AESGCM(key)
    nonce = os.urandom(12) # 12-byte ngẫu nhiên cho AES-GCM
    encrypted_data = aesgcm.encrypt(nonce, private_pem, None)

    # Trả về dữ liệu mã hoá + salt + nonce (dạng base 64)
    return {
        "encrypted_key": base64.b64encode(encrypted_data).decode(),
        "salt": base64.b64encode(salt).decode(),
        "nonce": base64.b64encode(nonce).decode()
    }

# ----------------------------
# Giải mã private key
# ----------------------------
def decrypt_private_key(encrypted_data: dict, aes_key: str):
    # Decode salt và nonce từ base64
    salt = base64.b64decode(encrypted_data['salt'])
    nonce = base64.b64decode(encrypted_data['nonce'])
    encrypted_key = base64.b64decode(encrypted_data['encrypted_key'])

    # Dẫn xuất key từ aes_key + salt
    key = _derive_key(aes_key, salt)

    # Giải mã bằng AES-GCM
    aesgcm = AESGCM(key)
    
    try:
        private_pem = aesgcm.decrypt(nonce, encrypted_key, None)
    except Exception as e:
        raise ValueError("Giải mã thất bại") from e
    
    return private_pem


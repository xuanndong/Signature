# Kết nối database (AsyncSession)
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.pool import NullPool
from dotenv import load_dotenv
import os

# load dotenv from .env
load_dotenv()

DB_URL = os.getenv('DB_URL')
# Get DB_URL from .env 
DB_URL = os.getenv("DB_URL")
if not DB_URL:
    raise ValueError("DB_URL không tồn tại trong file .env")

# Async engine 
# Connect to database
engine = create_async_engine(
    DB_URL, 
    echo=True,
    poolclass=NullPool,
    connect_args= {
        "ssl": os.getenv("DB_SSL", "false").lower() == "true"  # Support SSL
    }
) # engine manage pool connection and execute queries async

# Async session factory
# Factory make session async
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession, # Class session for async operator
    expire_on_commit=False,
    autoflush=False
) 

# Dependency for FastAPI
async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

"""
1. Ứng dụng khởi động, tạo engine kết nối đến database
2. Khi có request đến, FastAPI gọi get_db() để lấy session
3. Session được sử dụng để thực thi queries
4. Khi request kết thúc, session tự động đóng
5. Connection được trả về pool để tái sử dụng
"""

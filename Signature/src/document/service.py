from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from src.models import Document, Signature
from typing import List
import base64
 
async def get_document_by_filename(db: AsyncSession, filename: str, user_id: str) -> Document:
    """Kiểm tra xem document đã tồn tại theo filename"""
    result = await db.execute(
        select(Document).where((Document.filename == filename) & (Document.user_id == user_id))
    )
    return result.scalar_one_or_none()


async def get_document_by_id(db: AsyncSession, document_id: str, user_id: str) -> Document:
    """Kiểm tra xem document đã tồn tại theo document_id"""
    result = await db.execute(
        select(Document).where((Document.document_id == document_id) & (Document.user_id == user_id))
    )
    return result.scalar_one_or_none()


async def get_documents_by_user(db: AsyncSession, user_id: str) -> List[Document]:
    result = await db.execute(
        select(Document).where(Document.user_id == user_id)
    )
    return result.scalars().all()  # Trả về tất cả kết quả dạng list



async def get_signature(db: AsyncSession, document_id: str, user_id: str) -> Signature:
    result = await db.execute(
        select(Signature).where((Signature.document_id == document_id) & (Signature.user_id == user_id))
    )
    return result.scalar_one_or_none()


async def create_document(db: AsyncSession, user_id: str, filename: str, file_bytes: bytes, status: str = 'uploaded') -> Document:
    existing_doc = await db.execute(
        select(Document).where(
            (Document.user_id == user_id) & 
            (Document.filename == filename)
        )
    )
    if existing_doc.scalar_one_or_none():
        return None
    
    try:
        new_document = Document(
            user_id=user_id,
            filename=filename,
            status=status,
            file_bytes=base64.b64encode(file_bytes).decode('utf-8'),
        )

        db.add(new_document)
        await db.commit()
        await db.refresh(new_document)
        return new_document
        
    except Exception:
        await db.rollback()
        raise

async def delete_document_by_id(db: AsyncSession, document_id: int) -> bool:

    try:
        # Tìm document cần xóa
        result = await db.execute(
            select(Document)
            .where(Document.document_id == document_id)
        )
        document = result.scalar_one_or_none()
        
        if not document:
            return False  
            
        # Thực hiện xóa
        await db.delete(document)
        await db.commit()
        return True
        
    except Exception as e:
        await db.rollback()
        raise
import base64
import os
from sqlalchemy import select
from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter
from sqlalchemy.ext.asyncio import AsyncSession
from src.key.service import sign_data, verify_data

from io import BytesIO
from datetime import datetime, timezone
from pyhanko.pdf_utils.generic import DictionaryObject
from pyhanko.pdf_utils.text import TextBoxStyle
from pyhanko.stamp import TextStamp
from pyhanko.stamp.text import TextStampStyle
from pyhanko.pdf_utils.font import opentype
from pyhanko.pdf_utils.reader import PdfFileReader
from src.auth.service import get_current_user
from src.auth.schemas import UserResponse
from src.document.schemas import SignPosition, DocumentCreate
from src.models import Document

async def add_document(
    db: AsyncSession,
    user_id: str,
    upload_data: DocumentCreate
):
    try:
        document = Document(
            user_id=user_id,
            filename=upload_data.filename,
            status=upload_data.status,
            filehash=upload_data.filehash
        )

        db.add(document)
        await db.commit()
        await db.refresh(document)


        return {
            "success": True,
            "message": "Document added successfully",
            "info": upload_data.filehash
        }
    except Exception as e:
        await db.rollback()
        return {
            "success": False,
            "error": str(e)
        }
    

async def sign_pdf_preserve_hash(
    db: AsyncSession,
    user_id: str,
    aes_key: str, # from .env 
    pdf_bytes: bytes,
    position: SignPosition
) -> tuple[bytes, str]:
    """
    Ký PDF mà không thay đổi hash nội dung gốc
    Trả về: (pdf_bytes_modified, signature_base64)
    """

    try:

        # Ký hash
        signature = await sign_data(db, user_id, aes_key, pdf_bytes)
        sig_bytes = base64.b64decode(signature)

        # ---- Lam viec de ghep chu ky vao pdf ----
        writer = IncrementalPdfFileWriter(BytesIO(pdf_bytes))

        factory = opentype.GlyphAccumulatorFactory(
            font_file=os.path.expanduser("/usr/share/fonts/truetype/ubuntu/Ubuntu-Th.ttf"),
            font_size=14,
        )

        user: UserResponse = await get_current_user(db, user_id)
        if not user:
            return {
                "message": "Not found user"
            }

        # Tạo text stamp
        stamp_style = TextStampStyle(
            stamp_text=f"Người ký: {user.username}\n\nThời gian: {datetime.now().strftime('%d/%m/%Y %H:%M')}",
            text_box_style=TextBoxStyle(
                font=factory,
                font_size=14
            ),
            background=False
        )

        # Áp dụng stamp vào trang
        stamp = TextStamp(writer=writer, style=stamp_style)
        stamp.apply(dest_page=position.page_number, x=int(position.x/2), y=int(position.y/2))

        # Nhúng chữ ký vào metadata
                
        metadata = DictionaryObject()
        metadata.update({
            '/Signature': {
                '/Type': '/SigData',
                '/Value': sig_bytes.hex(),
                '/HashAlgorithm': '/SHA1',
                '/Time': datetime.now(timezone.utc).isoformat()
            }
        })
        writer.root['/Metadata'] = metadata
        
        # Xuất file
        output = BytesIO()
        writer.write(output)
        return output.getvalue(), signature
        
    except Exception as e:
        raise ValueError(f"Lỗi khi ký PDF: {str(e)}")
    

async def extract_and_verify(
    db: AsyncSession,
    pdf_bytes: bytes,
    user_id: str
) -> dict:
    """
    Tách và xác thực chữ ký từ PDF
    Trả về dictionary gồm:
    - valid: bool
    - message: str
    - original_hash: str (hex)
    - signed_hash: str (hex)
    """
    
    try:
        # Đọc PDF và kiểm tra metadata
        reader = PdfFileReader(BytesIO(pdf_bytes))
        if "/Metadata" not in reader.root:
            return {
                "valid": False,
                "message": "Không tìm thấy metadata trong file PDF",
                "original_hash": None,
                "signed_hash": None,
                "signing_time": None
            }

        metadata = reader.root["/Metadata"]

        # Kiểm tra chữ ký 
        if "/Signature" not in metadata:
            return {
                "valid": False,
                "message": "Không tìm thấy dữ liệu chữ ký trong metadata",
                "original_hash": None,
                "signed_hash": None,
                "signing_time": None
            }
 
        # Trích xuất chữ ký
        sig_data = metadata["/Signature"]

        signature = bytes.fromhex(sig_data["/Value"])

        signature_b64 = base64.b64encode(signature).decode()
        signing_time = sig_data.get("/Time", "Không rõ thời gian ký")


        # Tạo bản sao PDF không chứa metadata chữ ký để tính hash gốc
        writer = IncrementalPdfFileWriter(BytesIO(pdf_bytes))
        clean_metadata = DictionaryObject({
            k: v for k, v in metadata.items()
            if k != "/Signature"
        })
        writer.root["/Metadata"] = clean_metadata
        

        clean_pdf = BytesIO()
        writer.write(clean_pdf)
        clean_bytes = clean_pdf.getvalue()
        # sig = "Gm2d7jf3xlfuT5AwQ04Br0Fsk8yOmFJYvyYmIh5S2HWij3V5bAuJ4z5fW7QN4pXEOWPuU4hC7PUNQjRizye/kO/mbCvVTrjZb4cbS7glphKNIxNCiQuofjvz/z/9m0bv14yLT8ZOKiLSZfWO4rZlg7KlibvycafXoDzdoLOLa2EUIdWiAe1YdHWd6fMq6UOybIuqGHS2+yaNW1wwOzphAbO7WFwX87K+p+CQ4UvUR15G1rjxdsZKMTDYXWg4AH6PI/u2EIwxKvq7uNwgZ/UZ/7bOjQccFVdF1FGJPUO/hvYiopHQO230CjdL3URqBmekRHW1y83SO7f19eOZyWcsrA=="

        
        verify_result = await verify_data(db, user_id, clean_bytes, signature_b64)
        
        return verify_result
        
    except Exception as e:
        return {
            "valid": False,
            "message": f"Lỗi khi xác thực: {str(e)}",
            "original_hash": None,
            "signed_hash": None,
            "signing_time": None
        }
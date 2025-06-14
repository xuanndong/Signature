from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
import io
from datetime import datetime
from fastapi import HTTPException
from reportlab.lib.colors import white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from pypdf import PageObject
import os
import re
import hashlib

from sqlalchemy.ext.asyncio import AsyncSession
from src.document.schemas import SignPosition
from src.key.service import sign_data, verify_data
from src.auth.service import get_current_user


async def sign_pdf_with_stamp(
    db: AsyncSession,
    user_id: str,
    aes_key: str,
    pdf_bytes: bytes,
    position: SignPosition
) -> bytes:
    """
    Thêm chữ ký số và stamp vào PDF (Phiên bản đã sửa lỗi)
    - Sử dụng đúng chuẩn PdfObject
    - Xử lý lỗi chi tiết
    - Tối ưu hiệu suất
    """
    try:
        # 1. Tạo bản PDF sạch để ký (không metadata)
        clean_reader = PdfReader(io.BytesIO(pdf_bytes))
        clean_writer = PdfWriter()
        
        for page in clean_reader.pages:
            clean_writer.add_page(page)
        
        clean_pdf = io.BytesIO()
        clean_writer.write(clean_pdf)
        clean_bytes = clean_pdf.getvalue()

        # 2. Tạo chữ ký số
        signature_b64 = await sign_data(db, user_id, aes_key, clean_bytes)
        
        # 3. Lấy thông tin user
        user = await get_current_user(db, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # 4. Chuẩn bị nội dung stamp
        stamp_content = f"From: {user.username}\nDate: {datetime.now().strftime('%d/%m/%Y %H:%M')}"
        stamp_hash = hashlib.sha256(stamp_content.encode()).hexdigest()

        # 5. Tạo PDF cuối cùng với stamp (Sửa lỗi chính ở đây)
        final_reader = PdfReader(io.BytesIO(pdf_bytes))
        final_writer = PdfWriter()
        
        for i, page in enumerate(final_reader.pages):
            if i == (position.page - 1 if position.page > 0 else 0):
                # Import các class cần thiết
                from pypdf.generic import (
                    RectangleObject,
                    NameObject,
                    DictionaryObject,
                    ArrayObject,
                    FloatObject
                )
                
                # Tạo annotation đúng chuẩn
                stamp_annotation = DictionaryObject()
                stamp_annotation.update({
                    NameObject("/Type"): NameObject("/Annot"),
                    NameObject("/Subtype"): NameObject("/Text"),
                    NameObject("/Rect"): RectangleObject([
                        FloatObject(float(position.x)),
                        FloatObject(float(position.y)),
                        FloatObject(float(position.x + 200)),
                        FloatObject(float(position.y + 60))
                    ]),
                    NameObject("/Contents"): stamp_content,
                    NameObject("/Name"): NameObject("/Note"),
                    NameObject("/T"): "Digital Stamp",
                    NameObject("/C"): ArrayObject([
                        FloatObject(1.0),  # R
                        FloatObject(1.0),  # G
                        FloatObject(0.0)   # B
                    ]),
                    NameObject("/Open"): False
                })
                
                # Thêm annotation vào trang
                if NameObject("/Annots") in page:
                    page[NameObject("/Annots")].append(stamp_annotation)
                else:
                    page[NameObject("/Annots")] = ArrayObject([stamp_annotation])
            
            final_writer.add_page(page)

        # 6. Thêm metadata (dạng text đơn giản)
        metadata = {
            "/CustomSignature": signature_b64,
            "/SignerID": user_id,
            "/SignDate": datetime.now().isoformat(),
            "/StampInfo": f"page={position.page},x={position.x},y={position.y},hash={stamp_hash}"
        }
        final_writer.add_metadata(metadata)

        # 7. Xuất file PDF
        output = io.BytesIO()
        final_writer.write(output)
        return output.getvalue()

    except Exception as e:
        import traceback
        traceback.print_exc()  # In traceback để debug
        raise HTTPException(
            status_code=500,
            detail=f"Failed to sign PDF: {type(e).__name__}: {str(e)}"
        )



async def extract_and_verify(
    db: AsyncSession,
    pdf_bytes: bytes,
    public_key: bytes,
    user_id: str
) -> dict:
    """
    Xác thực PDF đã được ký và có stamp
    - Kiểm tra chữ ký số trên nội dung gốc (trước khi thêm stamp)
    - Xác minh metadata và stamp
    - Đảm bảo tính toàn vẹn của tài liệu
    """
    try:
        # 1. Đọc PDF và metadata
        reader = PdfReader(io.BytesIO(pdf_bytes))
        metadata = dict(reader.metadata or {})
        
        # 2. Kiểm tra trường bắt buộc trong metadata
        required_fields = ["/CustomSignature", "/SignerID", "/SignDate"]
        if not all(field in metadata for field in required_fields):
            return {
                "valid": False,
                "message": "Thiếu thông tin chữ ký trong metadata",
                "missing_fields": [f for f in required_fields if f not in metadata]
            }

        # 3. Kiểm tra người ký có khớp không
        if metadata["/SignerID"] != user_id:
            return {
                "valid": False,
                "message": "Người ký không khớp",
                "expected_signer": user_id,
                "actual_signer": metadata["/SignerID"]
            }

        # 4. Tạo bản PDF gốc để xác thực (không stamp và metadata)
        clean_writer = PdfWriter()
        
        # Lấy thông tin stamp từ metadata nếu có
        stamp_info = metadata.get("/StampInfo", {})
        stamp_page = stamp_info.get("page", 0)
        
        for i, page in enumerate(reader.pages):
            # Nếu là trang có stamp, tạo trang mới không chứa stamp
            if i == (stamp_page - 1 if stamp_page > 0 else 0):
                new_page = PageObject.create_blank_page(
                    width=page.mediabox[2],
                    height=page.mediabox[3]
                )
                new_page.merge_page(page)
                
                # Xóa stamp (nếu là annotation)
                if '/Annots' in new_page:
                    del new_page['/Annots']
                
                clean_writer.add_page(new_page)
            else:
                clean_writer.add_page(page)
        
        clean_pdf = io.BytesIO()
        clean_writer.write(clean_pdf)
        clean_bytes = clean_pdf.getvalue()

        # 5. Xác thực chữ ký số
        verify_result = await verify_data(
            db=db,
            user_id=user_id,
            public_key=public_key,
            data=clean_bytes,
            signature=metadata["/CustomSignature"]
        )

        # 6. Kiểm tra stamp (nếu có thông tin trong metadata)
        stamp_valid = False
        if "/StampInfo" in metadata:
            try:
                user = await get_current_user(db, user_id)
                if user:
                    target_page = reader.pages[stamp_page - 1 if stamp_page > 0 else 0]
                    page_text = target_page.extract_text()
                    
                    expected_content = f"From: {user.username}\nDate: {metadata['/SignDate'][:10]}"
                    stamp_valid = expected_content in page_text
            except Exception:
                pass

        return {
            **verify_result,
            "signer": metadata["/SignerID"],
            "sign_date": metadata.get("/SignDate"),
            "stamp_valid": stamp_valid,
            "content_valid": verify_result.get("valid", False),
            "content_hash": hashlib.sha256(clean_bytes).hexdigest() if verify_result.get("valid") else None
        }

    except Exception as e:
        return {
            "valid": False,
            "message": f"Lỗi xác thực: {str(e)}",
            "error_type": type(e).__name__
        }
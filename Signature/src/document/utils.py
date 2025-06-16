from pypdf import PdfReader, PdfWriter
import io
from fastapi import HTTPException
import fitz  # PyMuPDF
import hashlib
import json
from datetime import datetime


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
) -> tuple[bytes, str]:
    # 1. Lấy thông tin người dùng
    user = await get_current_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # 2. Loại bỏ vùng watermark từ bản gốc trước khi ký
    doc = fitz.open("pdf", pdf_bytes)
    page = doc[position.page - 1 if position.page > 0 else 0]
    
    # Xác định vùng sẽ thêm watermark (để loại bỏ tạm)
    exclusion_rect = fitz.Rect(
        position.x - 5, position.y - 5,  # Thêm lề để chắc chắn
        position.x + 205, position.y + 65
    )
    
    # Lấy nội dung không bao gồm vùng watermark
    text_blocks = page.get_text("blocks", clip=page.rect - exclusion_rect)
    clean_content = "\n".join([block[4] for block in text_blocks if len(block) > 4]).encode()
    clean_hash = hashlib.sha256(clean_content).hexdigest()

    # 3. Tạo chữ ký từ nội dung đã làm sạch
    signature = await sign_data(db, user_id, aes_key, clean_content)

    # 4. Thêm watermark vào bản gốc
    stamp_rect = fitz.Rect(position.x, position.y, position.x + 200, position.y + 60)
    page.draw_rect(stamp_rect, color=(1, 1, 0.8), fill=(1, 1, 0.8), overlay=True)
    page.insert_text((position.x + 10, position.y + 20), f"From: {user.username}", fontname="helv", fontsize=14)
    page.insert_text((position.x + 10, position.y + 40), datetime.now().strftime('%d/%m/%Y %H:%M'), fontname="helv", fontsize=14)

    # Lưu PDF đã có watermark
    watermarked_pdf = io.BytesIO()
    doc.save(watermarked_pdf)
    doc.close()

    # 5. Thêm metadata
    final_reader = PdfReader(watermarked_pdf)
    final_writer = PdfWriter()
    for page in final_reader.pages:
        final_writer.add_page(page)
    
    final_writer.add_metadata({
        "/CustomSignature": signature,
        "/SignerID": user_id,
        "/SignDate": datetime.now().isoformat(),
        "/OriginalHash": clean_hash,
        "/ExclusionZone": json.dumps({
            "x": position.x, "y": position.y,
            "width": 200, "height": 60,
            "page": position.page
        })
    })
    
    output = io.BytesIO()
    final_writer.write(output)
    return output.getvalue(), signature

async def extract_and_verify(
    db: AsyncSession,
    pdf_bytes: bytes,
    public_key: bytes,
    user_id: str
) -> dict:
    try:
        # 1. Đọc metadata
        reader = PdfReader(io.BytesIO(pdf_bytes))
        metadata = dict(reader.metadata or {})
        
        # 2. Kiểm tra trường bắt buộc
        required_fields = ["/CustomSignature", "/SignerID", "/OriginalHash", "/ExclusionZone"]
        if not all(field in metadata for field in required_fields):
            return {"valid": False, "message": "Thiếu thông tin xác thực"}

        # 3. Loại bỏ vùng watermark
        exclusion_zone = json.loads(metadata["/ExclusionZone"])
        doc = fitz.open("pdf", pdf_bytes)
        page = doc[exclusion_zone["page"] - 1 if exclusion_zone["page"] > 0 else 0]
        
        # Lấy nội dung không bao gồm vùng watermark
        exclusion_rect = fitz.Rect(
            exclusion_zone["x"] - 5, exclusion_zone["y"] - 5,
            exclusion_zone["x"] + exclusion_zone["width"] + 5,
            exclusion_zone["y"] + exclusion_zone["height"] + 5
        )
        text_blocks = page.get_text("blocks", clip=page.rect - exclusion_rect)
        clean_content = "\n".join([block[4] for block in text_blocks if len(block) > 4]).encode()
        doc.close()

        # 4. Kiểm tra hash
        current_hash = hashlib.sha256(clean_content).hexdigest()
        if current_hash != metadata["/OriginalHash"]:
            return {"valid": False, "message": "Nội dung đã bị thay đổi"}

        # 5. Xác thực chữ ký
        verify_result = await verify_data(
            db=db,
            user_id=user_id,
            public_key=public_key,
            data=clean_content,
            signature=metadata["/CustomSignature"]
        )

        return {
            **verify_result,
            "signer": metadata["/SignerID"],
            "sign_date": metadata.get("/SignDate")
        }

    except Exception as e:
        return {"valid": False, "message": f"Lỗi xác thực: {str(e)}"}




# async def sign_pdf_with_stamp(
#     db: AsyncSession,
#     user_id: str,
#     aes_key: str,
#     pdf_bytes: bytes,
#     position: SignPosition
# ) -> bytes:
#     """
#     Thêm chữ ký số vào PDF (không có stamp)
#     - Tạo bản sao không chứa metadata để ký
#     - Sau đó thêm metadata chứa chữ ký
#     """
#     # 1. Tạo bản PDF tạm không chứa metadata để ký
#     clean_reader = PdfReader(io.BytesIO(pdf_bytes))
#     clean_writer = PdfWriter()
    
#     for page in clean_reader.pages:
#         clean_writer.add_page(page)
    
#     clean_pdf = io.BytesIO()
#     clean_writer.write(clean_pdf)
#     clean_bytes = clean_pdf.getvalue()
    
#     # 2. Tạo chữ ký số từ nội dung sạch
#     signature_b64 = await sign_data(db, user_id, aes_key, clean_bytes)
    
#     # 3. Tạo PDF cuối cùng với metadata
#     final_reader = PdfReader(io.BytesIO(pdf_bytes))
#     final_writer = PdfWriter()
    
#     for page in final_reader.pages:
#         final_writer.add_page(page)
    
#     # 4. Thêm metadata
#     final_writer.add_metadata({
#         "/CustomSignature": signature_b64,
#         "/SignerID": user_id,
#         "/SignDate": datetime.now().isoformat(),
#         "/ContentLength": str(len(clean_bytes))  # Optional: để kiểm tra kích thước
#     })
    
#     # 5. Trả về PDF hoàn chỉnh
#     output = io.BytesIO()
#     final_writer.write(output)
#     return output.getvalue()


# async def extract_and_verify(
#     db: AsyncSession,
#     pdf_bytes: bytes,  # This is already bytes
#     public_key: bytes,  # This should be bytes
#     user_id: str
# ) -> dict:
#     """
#     Xác thực PDF đã được ký
#     """
#     try:
#         # 1. Tách metadata và tạo bản PDF sạch để xác thực
#         reader = PdfReader(io.BytesIO(pdf_bytes))
#         metadata = dict(reader.metadata or {})
        
#         # 2. Kiểm tra trường bắt buộc
#         required_fields = ["/CustomSignature", "/SignerID"]
#         if not all(field in metadata for field in required_fields):
#             return {
#                 "valid": False,
#                 "message": "Thiếu thông tin chữ ký trong metadata",
#                 "missing_fields": [f for f in required_fields if f not in metadata]
#             }

#         # 3. Tạo bản PDF không chứa metadata để xác thực
#         clean_writer = PdfWriter()
#         for page in reader.pages:
#             clean_writer.add_page(page)
        
#         clean_pdf = io.BytesIO()
#         clean_writer.write(clean_pdf)
#         clean_bytes = clean_pdf.getvalue()  # This is bytes
        
#         # 4. Get the signature from metadata
#         signature_str = metadata["/CustomSignature"]
        
#         # 5. Xác thực chữ ký
#         verify_result = await verify_data(
#             db=db,
#             user_id=user_id,
#             public_key=public_key,
#             data=clean_bytes,  # Passing bytes
#             signature=signature_str  # This is base64 string
#         )

#         return {
#             **verify_result,
#             "signer": metadata["/SignerID"],
#             "sign_date": metadata.get("/SignDate"),
#             "content_length": int(metadata.get("/ContentLength", "0")) if "/ContentLength" in metadata else None
#         }
#     except Exception as e:
#         return {
#             "valid": False,
#             "message": f"Lỗi xác thực: {str(e)}",
#             "error_type": type(e).__name__
#         }
    

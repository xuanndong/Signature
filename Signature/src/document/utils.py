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
    # Lấy thông tin người dùng
    user = await get_current_user(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Mở PDF và chọn trang
    doc = fitz.open("pdf", pdf_bytes)
    page = doc[position.page - 1 if position.page > 0 else 0]
    
    # Tính toán vị trí chính xác (chuyển từ tọa độ frontend sang backend)
    # Giả sử frontend gửi tọa độ đã tính toán đúng với PDF gốc
    x, y = position.x, position.y - 45
    
    # Kích thước watermark
    stamp_width = 180
    stamp_height = 50
    
    # Tạo vùng loại trừ (lớn hơn stamp một chút để đảm bảo)
    exclusion_rect = fitz.Rect(
        x - 5, y - 5,  
        x + stamp_width + 5, y + stamp_height + 5
    )
    
    # Lấy nội dung không bao gồm vùng watermark
    text_blocks = page.get_text("blocks", clip=page.rect - exclusion_rect)
    clean_content = "\n".join([block[4] for block in text_blocks if len(block) > 4]).encode()
    clean_hash = hashlib.sha256(clean_content).hexdigest()

    # Tạo chữ ký từ nội dung đã làm sạch
    signature = await sign_data(db, user_id, aes_key, clean_content)

    # Thêm watermark vào vị trí chính xác
    stamp_rect = fitz.Rect(x, y, x + stamp_width, y + stamp_height)
    
    # Vẽ nền watermark
    page.draw_rect(stamp_rect, color=(1, 1, 1), fill=(1, 1, 1), overlay=True)
    
    # Thêm border
    page.draw_rect(stamp_rect, color=(0, 0, 0), fill=None, width=1, overlay=True)
    
    # Thêm thông tin chữ ký
    page.insert_text(
        (x + 10, y + 20), 
        f"From: {user.username}",
        fontname="helv",
        fontsize=11,
        color=(0, 0, 0),
        overlay=True
    )
    page.insert_text(
        (x + 10, y + 40), 
        f"Date: {datetime.now().strftime('%d/%m/%Y %H:%M')}",
        fontname="helv",
        fontsize=11,
        color=(0, 0, 0),
        overlay=True
    )

    # Lưu PDF đã có watermark
    watermarked_pdf = io.BytesIO()
    doc.save(watermarked_pdf)
    doc.close()

    # Thêm metadata
    final_reader = PdfReader(watermarked_pdf)
    final_writer = PdfWriter()
    for page in final_reader.pages:
        final_writer.add_page(page)
    
    final_writer.add_metadata({
        "/Signature": signature,
        "/Signer": user.username,
        "/SignerID": user_id,
        "/SignDate": datetime.now().isoformat(),
        "/ContentHash": clean_hash,
        "/SignatureArea": json.dumps({
            "page": position.page,
            "x": x,
            "y": y,
            "width": stamp_width,
            "height": stamp_height
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
        required_fields = ["/Signature", "/SignerID", "/ContentHash", "/SignatureArea"]
        if not all(field in metadata for field in required_fields):
            return {
                "valid": False,
                "code": "MISSING_FIELDS",
                "message": "Tài liệu thiếu thông tin xác thực cần thiết"
            }

        # 3. Lấy thông tin vùng chữ ký
        try:
            sig_area = json.loads(metadata["/SignatureArea"])
            page_num = sig_area["page"] - 1 if sig_area["page"] > 0 else 0
        except (json.JSONDecodeError, KeyError):
            return {
                "valid": False,
                "code": "INVALID_SIGNATURE_AREA",
                "message": "Thông tin vùng chữ ký không hợp lệ"
            }

        # 4. Loại bỏ vùng chữ ký để lấy nội dung gốc
        doc = fitz.open("pdf", pdf_bytes)
        page = doc[page_num]
        
        # Tạo vùng loại trừ (thêm padding 5px xung quanh)
        exclusion_rect = fitz.Rect(
            sig_area["x"] - 5,
            sig_area["y"] - 5,
            sig_area["x"] + sig_area["width"] + 5,
            sig_area["y"] + sig_area["height"] + 5
        )
        
        # Lấy nội dung không bao gồm vùng chữ ký
        text_blocks = page.get_text("blocks", clip=page.rect - exclusion_rect)
        clean_content = "\n".join([block[4] for block in text_blocks if len(block) > 4]).encode()
        doc.close()

        # 5. Kiểm tra hash nội dung
        current_hash = hashlib.sha256(clean_content).hexdigest()
        if current_hash != metadata["/ContentHash"]:
            return {
                "valid": False,
                "code": "CONTENT_MODIFIED",
                "message": "Nội dung tài liệu đã bị thay đổi sau khi ký",
                "original_hash": metadata["/ContentHash"],
                "current_hash": current_hash
            }

        # 6. Xác thực chữ ký
        verify_result = await verify_data(
            db=db,
            user_id=user_id,
            public_key=public_key,
            data=clean_content,
            signature=metadata["/Signature"]
        )

        if not verify_result.get("valid"):
            return {
                **verify_result,
                "code": "INVALID_SIGNATURE",
                "signer": metadata.get("/Signer"),
                "sign_date": metadata.get("/SignDate")
            }

        return {
            "valid": True,
            "code": "VERIFIED",
            "message": "Tài liệu hợp lệ",
            "signer": metadata.get("/Signer"),
            "signer_id": metadata.get("/SignerID"),
            "sign_date": metadata.get("/SignDate"),
            "signature_area": sig_area,
            "content_hash": current_hash
        }

    except Exception as e:
        return {
            "valid": False,
            "code": "VERIFICATION_ERROR",
            "message": f"Lỗi trong quá trình xác thực: {str(e)}"
        }


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
    

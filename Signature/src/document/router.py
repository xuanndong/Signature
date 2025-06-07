from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.responses import StreamingResponse
from io import BytesIO
import os
from src.database import get_db
from src.auth.dependencies import get_current_user_id
from dotenv import load_dotenv
import base64
import hashlib

from src.document.schemas import SignPosition, DocumentCreate
from src.document.service import sign_pdf_preserve_hash, extract_and_verify, add_document


# Load env
load_dotenv()
aes_key = os.getenv('AES_KEY')
if not aes_key:
    raise HTTPException(
        status_code=404,
        detail="Not found aes key"
    )

router = APIRouter(tags=["Document"])

# Dung doc pdf tren fontend --> tra ve base64 va luu thong tin file pdf vao table document
@router.post("/load-pdf")
async def preview_pdf(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),  # Lấy user_id từ token
    db: AsyncSession = Depends(get_db),
):
    """Trả về PDF dạng base64 để frontend hiển thị"""
    pdf_bytes = await file.read()

    # Validate PDF không rỗng
    if not pdf_bytes:
        raise HTTPException(400, "Empty file")
    
    if not file.content_type == "application/pdf":
        raise HTTPException(400, "Chỉ chấp nhận file PDF")
    
    filehash = hashlib.sha1(pdf_bytes).digest()

    upload_data = DocumentCreate(
        filename=file.filename,
        status="uploaded",
        filehash=filehash
    )

    result = await add_document(db, user_id, upload_data)
    
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=f"Lỗi khi lưu thông tin: {result.get('error')}")

    return {
        "base64": base64.b64encode(pdf_bytes).decode(),
        "success": True,
        "message": "Completed",
        "info": filehash
    }

    # return StreamingResponse(
    #     BytesIO(pdf_bytes),
    #     media_type="application/pdf",
    #     headers={
    #         "Content-Disposition": "attachment; filename=signed.pdf",
    #     }
    # )

# O fontend mo file, sau do goi api sign-pdf de ky so khi nguoi dung chon ky so
# Neu nguoi dung chon xac thuc, goi api verify-pdf de xac thuc 
# Neu nguoi dung chon Huy, huy file pdf va quay lai giao dien goc
# Co the luu tuong trung kieu nhu toi da ky tai lieu ten la ...
# Va luu chu ky da ky, Khong luu noi dung file
# Lam sao de dua pdf_byte vaf position den 
@router.post("/sign-pdf")
async def sign_pdf(
    position: SignPosition,
    file: UploadFile = File(...), # Lay tu pdf_byte thay vi chon lai file
    user_id: str = Depends(get_current_user_id),  # Lấy user_id từ token
    db: AsyncSession = Depends(get_db),
):
    
    try:
        pdf_bytes = await file.read() # du thua

        # Validate PDF không rỗng
        if not pdf_bytes:
            raise HTTPException(400, "Empty PDF file")

        signed_pdf, signature = await sign_pdf_preserve_hash(db, user_id, aes_key, pdf_bytes, position)

        return StreamingResponse(
            BytesIO(signed_pdf),
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=signed.pdf",
                "X-Signature": signature 
            }
        )
        # return signature
    
    except ValueError as e:
        raise HTTPException(400, f"Lỗi ký PDF: {str(e)}")
    except Exception as e:
        raise HTTPException(500, f"Lỗi server: {str(e)}")
    

@router.post("/verify-pdf")
async def verify_pdf(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    
    try:
        pdf_bytes = await file.read() # data
        result = await extract_and_verify(db, pdf_bytes, user_id)

        if not result["valid"]:
            raise HTTPException(400, detail=result["message"])
        
        # return {
        #     "valid": True,
        #     "message": "Signature is valid",
        #     "original_hash": result["original_hash"],
        #     "signed_hash": result["signed_hash"]
        # }
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, detail=f"Verification failed: {str(e)}")
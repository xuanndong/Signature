from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Form
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi.responses import StreamingResponse
from io import BytesIO
from typing import Annotated
import os
from src.database import get_db
from src.auth.dependencies import get_current_user_id
from dotenv import load_dotenv

import json
from fastapi.responses import JSONResponse


from src.document.schemas import SignPosition, DocumentCreate, VerifyPDFResponse
# from src.document.service import sign_pdf_preserve_hash, add_document
from src.key.service import verify_data

from src.document.utils import extract_and_verify, sign_pdf_with_stamp

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
# @router.post("/load-pdf")
# async def preview_pdf(
#     file: UploadFile = File(...),
#     user_id: str = Depends(get_current_user_id),  # Lấy user_id từ token
#     db: AsyncSession = Depends(get_db),
# ):
#     """Trả về PDF dạng base64 để frontend hiển thị"""
#     pdf_bytes = await file.read()

#     # Validate PDF không rỗng
#     if not pdf_bytes:
#         raise HTTPException(400, "Empty file")
    
#     if not file.content_type == "application/pdf":
#         raise HTTPException(400, "Chỉ chấp nhận file PDF")
    
#     filehash = hashlib.sha1(pdf_bytes).digest()

#     upload_data = DocumentCreate(
#         filename=file.filename,
#         status="uploaded",
#         filehash=filehash
#     )

#     result = await add_document(db, user_id, upload_data)
    
#     if not result.get("success"):
#         raise HTTPException(status_code=500, detail=f"Lỗi khi lưu thông tin: {result.get('error')}")

#     return {
#         "base64": base64.b64encode(pdf_bytes).decode(),
#         "success": True,
#         "message": "Completed",
#         "info": filehash
#     }

#     # return StreamingResponse(
#     #     BytesIO(pdf_bytes),
#     #     media_type="application/pdf",
#     #     headers={
#     #         "Content-Disposition": "attachment; filename=signed.pdf",
#     #     }
#     # )


@router.post("/sign-pdf", response_model=None)
async def sign_pdf(
    file: Annotated[UploadFile, File(..., description="PDF file to be signed")],
    position: Annotated[str, Form(..., description="JSON string of SignPosition")],
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    """
        Ký PDF và trả về file đã ký kèm chữ ký số
        
        Status Codes:
        - 200: Trả về PDF đã ký
        - 400: Lỗi validate dữ liệu
        - 401: Unauthorized
        - 500: Lỗi server
    """
    
    try:
        # 1. Validate input file
        if not file.content_type == "application/pdf":
            raise HTTPException(400, "Only PDF files are allowed")

        pdf_bytes = await file.read()
        if len(pdf_bytes) == 0:
            raise HTTPException(400, "Empty PDF file")

        # 2. Parse position
        try:
            sign_position = SignPosition(**json.loads(position))
        except json.JSONDecodeError:
            raise HTTPException(422, "Invalid position format")
        except TypeError as e:
            raise HTTPException(422, f"Invalid position data: {str(e)}")


        # 3. Process signing
        try:
            signed_pdf = await sign_pdf_with_stamp(
                db=db,
                user_id=user_id,
                aes_key=aes_key,  
                pdf_bytes=pdf_bytes,
                position=sign_position
            )
        except Exception as e:
            raise HTTPException(500, f"Signing failed: {str(e)}")

        # 4. Return response
        return StreamingResponse(
            BytesIO(signed_pdf),
            media_type="application/pdf",
            headers={
                "Content-Disposition": "attachment; filename=signed_{file.filename}.pdf",
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Internal server error")
    
    

@router.post("/verify")
async def verif(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    pdf_bytes = await file.read()

    # public_key = public_key.encode('utf-8')
    signature = "ZN7CpzHHqlXHDc7bqc7zofim/7c3ZpYR6Iiyu0L97nsoCXrhIZOkssyoxFgzcZbTEzINYFXncf96499gJUqVBTPZKvzIv/gOHs2xPJgOanjiBAxa1Ypl8EobeeYmDV3129HjD1FNN5LOLRZ2SkjyYAGMC25X3/Xq28jDRZrkm7g8zowzTm8uUwvPRvz+p2sXEwo0YOUzznr0gfwNpwvbuWfddxrI3cEM/yriRL+wtcs89iPGgS0jxLITpL3u7mi90xKWY0RprjcgD+23QcEahlvsAbA2Xqw2Qf4W15cleeHnA5R09A0VTfUdxJGHncyuYdujzjAC8iRcle3jzCvNpA=="

    public_key = "-----BEGIN PUBLIC KEY-----\nMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAs1YMS7aJhwjkKbh2+WZy\nDOB7hywbIJYNv0IXwGIQeZbIYklj+EuQvXFzdCW8ydPBHLLx/nf4R9kyKwsisVR8\nlO5eHr6XkMWSff6sai3Mq92nAFvltgHeubkSm9qXjIKtDF/CKZMgK7sCn2T/3rIN\nFo9a4Ef1lgFCD9kA9DrLfXoh9TOyOXYcvUAMUo6y3kg/q2ak4Y/r/A3A9u3OL13T\nkEPVE6LKX8C/q16V8GkOkaGANBQujWbDgDlKdWsBSw2ubbdZDCLC/7GWOUcHfspx\ndKHDUql1SYRkT9kF0GbpKk2NOeca5j4sopWGRDMPp3IWI4ireZXttz+9vRgvnsa/\newIDAQAB\n-----END PUBLIC KEY-----\n"
    pb = public_key.encode('utf-8')

    result = await verify_data(db, user_id, pb, pdf_bytes, signature)

    return result




from src.key.service import get_public_key

@router.post("/verify-pdf", 
             response_model=VerifyPDFResponse,
             responses={
                 200: {"description": "Signature is valid"},
                 400: {"description": "Invalid signature or corrupted file"},
                 401: {"description": "Unauthorized"},
                 500: {"description": "Internal server error"}
             })
async def verify_pdf(
    file: UploadFile = File(..., description="PDF file to verify"),
    public_key: str = Form(..., description="PEM formatted public key"),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    """
    Verify digital signature in PDF
    
    - Performs cryptographic verification using provided public key
    - Checks document integrity
    - Validates signer identity
    """
    try:
        # 1. Validate input
        if not file.content_type == "application/pdf":
            raise HTTPException(400, "Only PDF files are allowed")

        pdf_bytes = await file.read()
        if len(pdf_bytes) == 0:
            raise HTTPException(400, "Empty PDF file")

        # 2. Clean and validate public key
        try:
            cleaned_key = public_key.replace("\\n", "\n").encode()
            if not cleaned_key.startswith(b"-----BEGIN PUBLIC KEY-----"):
                raise ValueError("Invalid public key format")
        except Exception as e:
            raise HTTPException(400, f"Invalid public key: {str(e)}")

        pub = await get_public_key(db, user_id)

        # 3. Process verification
        result = await extract_and_verify(
            db=db,
            pdf_bytes=pdf_bytes,
            public_key=pub,
            user_id=user_id
        )

        # 4. Handle verification result
        if not result["valid"]:
            return JSONResponse(
                status_code=400,
                content={
                    "message": result["message"],
                    "details": {
                        "signer": result.get("signer"),
                        "timestamp": result.get("sign_date")
                    }
                }
            )

        return VerifyPDFResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, "Internal verification error")
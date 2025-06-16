from fastapi import APIRouter, HTTPException, UploadFile, File, Depends, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import func
from typing import Annotated
import os
from src.database import get_db
from dotenv import load_dotenv
import json
import binascii
import base64
import io
from pypdf import PdfReader
from fastapi.responses import JSONResponse
from datetime import datetime

from src.document.schemas import SignPosition, DocumentResponse
from src.document.utils import extract_and_verify, sign_pdf_with_stamp
from src.models.document import Document, Signature
from src.auth.dependencies import get_current_user_id
from src.document.service import get_document_by_filename, get_signature, get_documents_by_user, create_document, get_document_by_id
from src.key.service import get_key
from src.models.verificate import Verification
from typing import List


# Load env
load_dotenv()
aes_key = os.getenv('AES_KEY')
if not aes_key:
    raise HTTPException(
        status_code=404,
        detail="Not found aes key"
    )

router = APIRouter(tags=["Document"])


@router.get("/", response_model=List[DocumentResponse])
async def get_user_documents(
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):
    try:
        documents = await get_documents_by_user(db, user_id)
        if not documents:
            return []
        
        return documents
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching documents: {str(e)}"
        )
    


@router.post('/upload')
async def upload_file(
    file: UploadFile = File(...),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(
            status_code=400,
            detail="Chỉ chấp nhận file PDF"
        )

    try:
        # Validate file size (ví dụ max 10MB)
        file_bytes = await file.read()

        if len(file_bytes) > 10 * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail="File không được vượt quá 10MB"
            )
        
        is_signed = False
        try:
            reader = PdfReader(io.BytesIO(file_bytes))
            metadata = reader.metadata or {}
            if "/Signature" in metadata and "/SignerID" in metadata:
                signer_id = metadata['/SignerID']
                if str(signer_id) == str(user_id):
                    is_signed = True
                
        except Exception as e:
            print(f"Lỗi khi đọc metadata PDF: {str(e)}")


        file_name = os.path.splitext(file.filename)[0]

        document = await create_document(db, user_id, file.filename, file_bytes, status="signed" if is_signed else "uploaded")
        
        if not document:
            return JSONResponse(
                status_code=400,
                content={
                    "status": False,
                    "message": f"File {file_name} đã tồn tại",
                    "document_id": None
                }
            )
        
        return {
            "status": True,
            "message": "Tải lên thành công",
            "document_id": str(document.document_id),
            "filename": document.filename
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Lỗi server: {str(e)}"
        )
    

@router.get('/{document_id}/content')
async def get_document_content(
    document_id: int,
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    document = await get_document_by_id(db, document_id, user_id)
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    if not document.file_bytes:
        raise HTTPException(status_code=404, detail="Document content not available")

    try:
        if not isinstance(document.file_bytes, str):
            raise ValueError("Invalid data format - expected base64 string")

        file_data = base64.b64decode(document.file_bytes)
        
        return {
            "filename": f"{document.filename}",
            "content": base64.b64encode(file_data).decode('utf-8'),  
            "mime_type": "application/pdf"
        }
        
    except (binascii.Error, ValueError) as e:
        raise HTTPException(status_code=422, detail="Invalid file data format")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")



@router.post("/sign-pdf", response_model=None)
async def sign_pdf(
    file: Annotated[UploadFile, File(..., description="PDF file to be signed")],
    position: Annotated[str, Form(..., description="JSON string of SignPosition")],
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db),
):

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
            signed_pdf, sig = await sign_pdf_with_stamp(
                db=db,
                user_id=user_id,
                aes_key=aes_key,  
                pdf_bytes=pdf_bytes,
                position=sign_position
            )

            # Check if document already exists
            document = await get_document_by_filename(db, file.filename, user_id)
            if not document:
                # Create new document record
                document = Document(
                    user_id=user_id,
                    filename=file.filename,
                    status="signed",
                    file_bytes=base64.b64encode(signed_pdf).decode('utf-8')  
                )
                db.add(document)      
            else:
                # Update existing document status
                document.status = "signed"
                document.file_bytes = base64.b64encode(signed_pdf).decode('utf-8')  
                document.created_at = func.now()

            await db.commit()
            await db.refresh(document)

            key = await get_key(db, user_id)

            # Create signature record
            signature = Signature(
                document_id=document.document_id,
                user_id=user_id,
                key_id=key.key_id,
                signature=sig
            )
            db.add(signature)
            await db.commit()
            await db.refresh(signature)

        except Exception as e:
            await db.rollback()
            raise HTTPException(500, f"Signing failed: {str(e)}")

        # 4. Return response
        return {
            "message": "PDF signed successfully",
            "status": "success",
            "data": {
                "document_id": str(document.document_id),
                "filename": document.filename,
                "signature_id": str(signature.signature_id),
                "signed_at": document.created_at.isoformat() if document.created_at else None
            }
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Internal server error")
    


@router.post("/verify-pdf")
async def verify_pdf(
    file: UploadFile = File(..., description="PDF file to verify"),
    public_key: str = Form(..., description="PEM formatted public key"),
    user_id: str = Depends(get_current_user_id),
    db: AsyncSession = Depends(get_db)
):
    try:
        # 1. Validate input
        if not file.content_type == "application/pdf":
            raise HTTPException(400, "Only PDF files are allowed")

        pdf_bytes = await file.read()
        if len(pdf_bytes) == 0:
            raise HTTPException(400, "Empty PDF file")

        # 2. Clean and validate public key
        try:
            cleaned_key = public_key.replace("\\n", "\n").strip().encode()
            if not cleaned_key.startswith(b"-----BEGIN PUBLIC KEY-----"):
                raise ValueError("Invalid public key format")
        except Exception as e:
            raise HTTPException(400, f"Invalid public key: {str(e)}")

        # 3. Process verification
        result = await extract_and_verify(
            db=db,
            pdf_bytes=pdf_bytes,  
            public_key=cleaned_key,
            user_id=user_id
        )

        if result['valid']:

            # 4. Update database based on verification result
            document = await get_document_by_filename(db, file.filename, user_id)
            if not document:
                # Create new document record if it doesn't exist
                document = Document(
                    user_id=user_id,
                    filename=file.filename,
                    status="verified",
                    file_bytes=base64.b64encode(pdf_bytes).decode('utf-8')  
                )
                db.add(document)
                
            else:
                # Update existing document status
                document.status = "verified"
            
            await db.commit()
            await db.refresh(document)
        

            # Get the signature for this document 
            signature = await get_signature(db, document.document_id, user_id)
            
            if signature:
                # Create verification record
                verification = Verification(
                    signature_id=signature.signature_id,
                    user_id=user_id,
                    is_valid=result["valid"],
                )
                db.add(verification)
                await db.commit()
                await db.refresh(verification)


            response_data = {
                "status": "success",
                "code": 200,
                "message": "Verification completed",
                "data": {
                    "is_valid": result["valid"],
                    "verification_time": datetime.now().isoformat(),
                }
            }

        # 5. Handle verification result
        else:
            response_data = {
                "status": "error",
                "code": 400,
                "message": "Document verification failed"
            }

        return response_data

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, "Internal verification error")

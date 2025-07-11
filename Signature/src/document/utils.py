from pypdf import PdfReader, PdfWriter
import io
from fastapi import HTTPException
import fitz  # PyMuPDF
import hashlib
import json
from datetime import datetime
from typing import List, Dict, Optional
from collections import defaultdict

from sqlalchemy.ext.asyncio import AsyncSession
from src.document.schemas import SignPosition
from src.key.service import sign_data, verify_data
from src.auth.service import get_current_user


async def get_existing_signatures(doc: fitz.Document) -> Dict[str, List[Dict]]:
    """Lấy thông tin các chữ ký hiện có từ metadata với xử lý lỗi chi tiết hơn"""
    try:
        metadata = doc.metadata or {}
        if "/SignaturesInfo" not in metadata:
            return {}
            
        try:
            signatures_info = json.loads(metadata["/SignaturesInfo"])
            if not isinstance(signatures_info, list):
                return {}
        except (json.JSONDecodeError, TypeError) as e:
            print(f"Error parsing SignaturesInfo: {e}")
            return {}

        result = defaultdict(list)
        for sig in signatures_info:
            try:
                page = str(sig.get("page", 1))
                result[page].append({
                    'x': float(sig['x']),
                    'y': float(sig['y']),
                    'width': float(sig['width']),
                    'height': float(sig['height']),
                    'signature': sig['signature']
                })
            except (ValueError, KeyError) as e:
                print(f"Invalid signature format: {e}")
                continue
                
        return dict(result)
    except Exception as e:
        print(f"Unexpected error in get_existing_signatures: {e}")
        return {}
    

async def sign_pdf_with_stamp(
    db: AsyncSession,
    user_id: str,
    aes_key: str,
    pdf_bytes: bytes,
    position: SignPosition
) -> tuple[bytes, str]:
    try:
        # Xác thực người dùng
        user = await get_current_user(db, user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        # Mở PDF và kiểm tra trang
        doc = fitz.open("pdf", pdf_bytes)
        if position.page < 1 or position.page > len(doc):
            raise HTTPException(status_code=400, detail="Invalid page number")
        page = doc[position.page - 1]

        # Kích thước cố định cho chữ ký
        stamp_width, stamp_height = 180, 50
        x, y = position.x - 48, position.y - 200
        new_rect = fitz.Rect(x, y, x + stamp_width, y + stamp_height)

        # Kiểm tra chồng chéo với các chữ ký hiện có
        existing_signatures = await get_existing_signatures(doc)
        for sig in existing_signatures.get(str(position.page), []):
            sig_rect = fitz.Rect(sig['x'], sig['y'], 
                               sig['x'] + sig['width'], 
                               sig['y'] + sig['height'])
            if new_rect.intersects(sig_rect):
                raise HTTPException(
                    status_code=400,
                    detail="Signature position overlaps existing signature"
                )

        # Tạo danh sách tất cả vùng loại trừ (bao gồm chữ ký mới)
        all_exclusion_rects = [fitz.Rect(x-5, y-5, x+stamp_width+5, y+stamp_height+5)]
        for sig in existing_signatures.get(str(position.page), []):
            all_exclusion_rects.append(fitz.Rect(
                sig['x'] - 5,
                sig['y'] - 5,
                sig['x'] + sig['width'] + 5,
                sig['y'] + sig['height'] + 5
            ))

        # Tính toán vùng nội dung
        content_rect = page.rect
        for rect in all_exclusion_rects:
            content_rect -= rect
        
        # Lấy nội dung không bao gồm tất cả vùng chữ ký
        text_blocks = page.get_text("blocks", clip=content_rect) or []
        clean_content = "\n".join([block[4] for block in text_blocks if len(block) > 4]).encode()
        clean_hash = hashlib.sha256(clean_content).hexdigest()

        # Tạo chữ ký số
        signature = await sign_data(db, user_id, aes_key, clean_content)

        # Thêm watermark vào PDF
        stamp_rect = fitz.Rect(x, y, x + stamp_width, y + stamp_height)
        page.draw_rect(stamp_rect, color=(1, 1, 1), fill=(1, 1, 1), overlay=True)
        page.draw_rect(stamp_rect, color=(0, 0, 0), fill=None, width=1, overlay=True)
        
        page.insert_text(
            (x + 10, y + 20), 
            f"From: {user.username}",
            fontname="helv",
            fontsize=14,
            color=(0, 0, 0),
            overlay=True
        )
        page.insert_text(
            (x + 10, y + 40), 
            f"Date: {datetime.now().strftime('%d/%m/%Y %H:%M')}",
            fontname="helv",
            fontsize=14,
            color=(0, 0, 0),
            overlay=True
        )

        # Lưu PDF và cập nhật metadata
        watermarked_pdf = io.BytesIO()
        doc.save(watermarked_pdf)
        doc.close()

        final_reader = PdfReader(watermarked_pdf)
        final_writer = PdfWriter()
        for p in final_reader.pages:
            final_writer.add_page(p)
        
        existing_metadata = dict(final_reader.metadata or {})
        signatures_info = json.loads(existing_metadata.get("/SignaturesInfo", "[]"))
        
        new_signature_info = {
            "signature": signature,
            "signer": user.username,
            "signer_id": user.user_id,
            "sign_date": datetime.now().isoformat(),
            "content_hash": clean_hash,
            "signed_content": clean_content.decode('utf-8'),  # Lưu nội dung đã ký
            "page": position.page,
            "x": x,
            "y": y,
            "width": stamp_width,
            "height": stamp_height,
            "version": 2  # Phiên bản mới
        }
        signatures_info.append(new_signature_info)
        
        final_writer.add_metadata({
            **existing_metadata,
            "/SignaturesInfo": json.dumps(signatures_info, ensure_ascii=False),
            "/LastSignature": signature,
            "/LastSigner": user.username,
            "/LastSignerID": user_id,
            "/LastSignDate": datetime.now().isoformat(),
        })
        
        output = io.BytesIO()
        final_writer.write(output)
        return output.getvalue(), signature

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error during signing: {str(e)}"
        )



async def extract_and_verify(
    db: AsyncSession,
    pdf_bytes: bytes,
    public_key: bytes,
    user_id: str,
    signature_to_verify: Optional[str] = None
) -> dict:
    try:
        # 1. Đọc metadata
        reader = PdfReader(io.BytesIO(pdf_bytes))
        metadata = dict(reader.metadata or {})
        
        # 2. Kiểm tra thông tin chữ ký
        signatures_info = json.loads(metadata.get("/SignaturesInfo", "[]"))
        if not signatures_info:
            return {
                "valid": False,
                "code": "NO_SIGNATURES",
                "message": "Tài liệu không có chữ ký nào"
            }

        # 3. Tìm chữ ký cần xác thực
        target_sig = None
        if signature_to_verify:
            target_sig = next((sig for sig in signatures_info if sig.get("signer_id") == signature_to_verify), None)
        else:
            target_sig = next((sig for sig in signatures_info if sig.get("signer_id") == user_id), None)

        if not target_sig:
            return {
                "valid": False,
                "code": "SIGNATURE_NOT_FOUND",
                "message": "Không tìm thấy chữ ký cần xác thực"
            }

        # 4. Lấy nội dung đã ký từ chính chữ ký đó
        if "signed_content" not in target_sig:
            return {
                "valid": False,
                "code": "MISSING_SIGNED_CONTENT",
                "message": "Không tìm thấy nội dung đã ký"
            }

        clean_content = target_sig["signed_content"].encode()
        current_hash = hashlib.sha256(clean_content).hexdigest()

        # 5. Kiểm tra hash
        if current_hash != target_sig["content_hash"]:
            return {
                "valid": False,
                "code": "CONTENT_MODIFIED",
                "message": "Nội dung đã bị thay đổi sau khi ký",
                "original_hash": target_sig["content_hash"],
                "current_hash": current_hash
            }

        # 6. Xác thực chữ ký số
        verify_result = await verify_data(
            db=db,
            user_id=user_id,
            public_key=public_key,
            data=clean_content,
            signature=target_sig["signature"]
        )

        if not verify_result.get("valid"):
            return {
                **verify_result,
                "code": "INVALID_SIGNATURE",
                "signer": target_sig.get("signer"),
                "sign_date": target_sig.get("sign_date")
            }

        return {
            "valid": True,
            "code": "VERIFIED",
            "message": "Tài liệu hợp lệ",
            "signer": target_sig.get("signer"),
            "signer_id": target_sig.get("signer_id"),
            "sign_date": target_sig.get("sign_date"),
            "signature_area": {
                "page": target_sig["page"],
                "x": target_sig["x"],
                "y": target_sig["y"],  
                "width": target_sig["width"],
                "height": target_sig["height"]
            },
            "total_signatures": len(signatures_info)
        }

    except Exception as e:
        return {
            "valid": False,
            "code": "VERIFICATION_ERROR",
            "message": f"Lỗi xác thực: {str(e)}"
        }
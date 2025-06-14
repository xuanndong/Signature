# import base64
# import os
# import json
# import re
# import hashlib
# from sqlalchemy import select
# from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter
# from sqlalchemy.ext.asyncio import AsyncSession
# from src.key.service import sign_data, verify_data

# from io import BytesIO
# from datetime import datetime, timezone
# from pyhanko.pdf_utils.generic import DictionaryObject, NameObject, TextStringObject, IndirectObject, StreamObject, ArrayObject
# from pyhanko.pdf_utils.text import TextBoxStyle
# from pyhanko.stamp import TextStamp
# from pyhanko.stamp.text import TextStampStyle
# from pyhanko.pdf_utils.font import opentype
# from pyhanko.pdf_utils.reader import PdfFileReader
# from src.auth.service import get_current_user
# from src.auth.schemas import UserResponse
# from src.document.schemas import SignPosition, DocumentCreate
# from src.models import Document

# #
# from pyhanko.sign import fields, signers
# from pyhanko.sign.general import load_cert_from_pemder
# from pyhanko_certvalidator import ValidationContext
# from src.key.service import get_private_key, get_public_key
# from dotenv import load_dotenv
# from fastapi import HTTPException

# # Load env
# load_dotenv()
# aes_key = os.getenv('AES_KEY')
# if not aes_key:
#     raise HTTPException(
#         status_code=404,
#         detail="Not found aes key"
#     )
# #

# async def add_document(
#     db: AsyncSession,
#     user_id: str,
#     upload_data: DocumentCreate
# ):
#     try:
#         document = Document(
#             user_id=user_id,
#             filename=upload_data.filename,
#             status=upload_data.status,
#             filehash=upload_data.filehash
#         )

#         db.add(document)
#         await db.commit()
#         await db.refresh(document)


#         return {
#             "success": True,
#             "message": "Document added successfully",
#             "info": upload_data.filehash
#         }
#     except Exception as e:
#         await db.rollback()
#         return {
#             "success": False,
#             "error": str(e)
#         }
    

# async def sign_pdf_preserve_hash(
#     db: AsyncSession,
#     user_id: str,
#     aes_key: str, # from .env 
#     pdf_bytes: bytes,
#     position: SignPosition
# ) -> tuple[bytes, str]:
#     """
#     Ký PDF mà không thay đổi hash nội dung gốc
#     Trả về: (pdf_bytes_modified, signature_base64)
#     """

#     try:

#         pdf_copy = BytesIO(pdf_bytes)
#         pdf_copy_bytes = pdf_copy.getvalue()

#         # Ký hash
#         signature = await sign_data(db, user_id, aes_key, pdf_copy_bytes)

#         # ---- Lam viec de ghep chu ky vao pdf ----
#         writer = IncrementalPdfFileWriter(pdf_copy)

#         factory = opentype.GlyphAccumulatorFactory(
#             font_file=os.path.expanduser("/usr/share/fonts/truetype/ubuntu/Ubuntu-Th.ttf"),
#             font_size=14,
#         )

#         user: UserResponse = await get_current_user(db, user_id)
#         if not user:
#             return {
#                 "message": "Not found user"
#             }

#         # Tạo text stamp
#         stamp_style = TextStampStyle(
#             stamp_text=f"Người ký: {user.username}\n\nThời gian: {datetime.now().strftime('%d/%m/%Y %H:%M')}",
#             text_box_style=TextBoxStyle(
#                 font=factory,
#                 font_size=14
#             ),
#             background=False
#         )
        
#         # Áp dụng stamp vào trang
#         stamp = TextStamp(writer=writer, style=stamp_style)
#         stamp.apply(dest_page=position.page - 1, x=int(position.x), y=int(842 - position.y - 70))

#         # Tạo metadata stream
#         # metadata_stream = StreamObject()
#         # metadata_stream.update({
#         #     NameObject('/Type'): NameObject('/Metadata'),
#         #     NameObject('/Subtype'): NameObject('/XML'),
#         # })

#         # # Tạo nội dung XML cho metadata
#         # metadata_content = f"""<?xpacket begin='' id='W5M0MpCehiHzreSzNTczkc9d'?>
#         #     <x:xmpmeta xmlns:x='adobe:ns:meta/'>
#         #         <rdf:RDF xmlns:rdf='http://www.w3.org/1999/02/22-rdf-syntax-ns#'>
#         #             <rdf:Description rdf:about='' xmlns:dc='http://purl.org/dc/elements/1.1/'>
#         #                 <dc:creator>{user.username}</dc:creator>
#         #                 <dc:date>{datetime.now(timezone.utc).isoformat()}</dc:date>
#         #             </rdf:Description>
#         #             <rdf:Description rdf:about='' xmlns:pdf='http://ns.adobe.com/pdf/1.3/'>
#         #                 <pdf:Producer>PyHanko</pdf:Producer>
#         #             </rdf:Description>
#         #             <rdf:Description rdf:about='' xmlns:sign='http://ns.adobe.com/xfa/signature/1.0/'>
#         #                 <sign:Signature>
#         #                     <sign:Contents>{signature}</sign:Contents>
#         #                     <sign:Date>{datetime.now(timezone.utc).isoformat()}</sign:Date>
#         #                 </sign:Signature>
#         #             </rdf:Description>
#         #         </rdf:RDF>
#         #     </x:xmpmeta>
#         #     <?xpacket end='w'?>"""
        
#         # # Set stream data (encode as UTF-8)
#         # metadata_stream = StreamObject(stream_data=bytes(metadata_content, 'utf-8'))
        
#         # # Thêm metadata vào PDF
#         # metadata_ref = writer.add_object(metadata_stream)
#         # writer.root[NameObject('/Metadata')] = metadata_ref                

#         # Xuất file
#         output = BytesIO()
#         writer.write(output)
        
#         return output.getvalue(), signature
        
#     except Exception as e:
#         raise ValueError(f"Lỗi khi ký PDF: {str(e)}")
    

# async def extract_and_verify(
#     db: AsyncSession,
#     pdf_bytes: bytes,
#     public_key: bytes,
#     user_id: str
# ) -> dict:
#     """
#     Tách và xác thực chữ ký từ PDF
#     Trả về dictionary gồm:
#     - valid: bool
#     - message: str
#     - original_content: str
#     - signature: str 
#     - signing_time: str
#     """
#     try:        
#         # 1. Đọc PDF
#         reader = PdfFileReader(BytesIO(pdf_bytes))
        
#         # 2. Tạo bản sao không có metadata và stamp để xác thực
#         writer = IncrementalPdfFileWriter(BytesIO(pdf_bytes))
        
#         def is_our_stamp(annot):
#             try:
#                 annot_obj = annot.get_object() if hasattr(annot, 'get_object') else annot
#                 contents = annot_obj.get('/Contents', '')
#                 if isinstance(contents, TextStringObject):
#                     contents = contents.original_bytes.decode('utf-8')
#                 return (
#                     annot_obj.get('/Subtype') == '/Stamp' and
#                     "Người ký:" in contents and
#                     "Thời gian:" in contents
#                 )
#             except:
#                 return False
        
#         for page_num in range(len(reader.root['/Pages']['/Kids'])):
#             page_ref = reader.root['/Pages']['/Kids'][page_num]
#             page = page_ref.get_object()
            
#             if '/Annots' in page:
#                 annots = page['/Annots']
#                 new_annots = ArrayObject()
                
#                 # Kiểm tra từng annotation
#                 for annot in annots:
#                     if not is_our_stamp(annot):
#                         new_annots.append(annot)
                
#                 # Nếu số lượng annotation thay đổi, cập nhật trang
#                 if len(new_annots) != len(annots):
#                     page[NameObject('/Annots')] = new_annots
#                     writer.update_container(page_ref)
            

#         clean_pdf = BytesIO()
#         writer.write(clean_pdf)
#         original_content = clean_pdf.getvalue()

#         # 3. Trích xuất signature từ metadata (nếu cần cho thông báo)
#         # signature_b64 = None
#         # signing_time = None
#         # if '/Metadata' in reader.root:
#             # try:
#             #     metadata_stream = reader.root['/Metadata'].get_object()
#             #     metadata_content = metadata_stream.get_data().decode('utf-8')
#             #     metadata_dict = json.loads(metadata_content)
                
#             #     if "Signature" in metadata_dict:
#             #         sig_info = metadata_dict["Signature"]
#             #         signature_b64 = sig_info.get("Contents")
#             #         signing_time = sig_info.get("Date")
#             # except:
#             #     pass  # Không bắt buộc phải có thông tin này để xác thực
        
#         signature = "GRll1+801qr6caaHYl169dGGTGCC/x80mGU+cgq1vKhBVPgFQWJPMZshb/bY9UKF0VQLbnoQc9dwecPYX12ULG3fbt65zQF9hzl9KvU/5nvkmki56dDanU1VxM9CvqhrVMZhVx0s3e9C1dLhSt18cQSTfGJm9uC9xPkfVzR3Wm7RddKC3f03LqGzioDKVV5B2MGqHTWQaguRi5d7SQ9hHluMh9nAwzWUMrrYDKt9j7emxHz1/+XPpvdcS3O+9hlYczU01keZ0vlV5IBJnA/hQbWkyNpBfcpxRW5/q1Bgo+uDRw1VYPSZ4i7QKwAUWKJxe/fJMGWvT/QWohnvK+R3Eg=="

#         # 4. Xác thực chữ ký với bản PDF gốc (không stamp, không metadata)
#         verify_result = await verify_data(
#             db, user_id, public_key, 
#             pdf_bytes, signature
#         )
        
#         # 8. Trả về kết quả
#         return {
#             "valid": verify_result.get("valid", False),
#             "message": verify_result.get("message", ""),
#             "original_content": original_content,
#             "signature": signature,
#             "signing_time": datetime.now(timezone.utc).isoformat(),
#         }

#     except Exception as e:
#         return {
#             "valid": False,
#             "message": f"Lỗi xác thực: {str(e)}",
#             "original_content": None,
#             "signature": None,
#             "signing_time": None,
#         }
    


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
#     pdf_bytes: bytes,
#     public_key: bytes,
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
#         clean_bytes = clean_pdf.getvalue()
        
#         # 4. Xác thực chữ ký
#         verify_result = await verify_data(
#             db=db,
#             user_id=user_id,
#             public_key=public_key,
#             data=clean_bytes,  # Dùng bản đã làm sạch
#             signature=metadata["/CustomSignature"]
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
    
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from src.auth.router import router as auth_router
from src.key.router import router as key_router
from src.document.router import router as document_router

app = FastAPI()

# Cấu hình CORS
origins = [
    "http://localhost:5173",  # Địa chỉ frontend React
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],  # Rõ ràng hơn
    allow_headers=["*"],
    expose_headers=["X-Signature", "Content-Disposition"]  # Thêm headers cần expose
)

app.include_router(auth_router, prefix="/auth")
app.include_router(key_router, prefix="/key")
app.include_router(document_router, prefix="/document")

@app.get('/')
async def root():
    return {"message": "Welcome you to my app"}
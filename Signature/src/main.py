from fastapi import FastAPI
from src.auth.router import router as auth_router
from src.key.router import router as key_router
from src.document.router import router as document_router

app = FastAPI()
app.include_router(auth_router, prefix="/auth")
app.include_router(key_router, prefix="/key")
app.include_router(document_router, prefix="/document")

@app.get('/')
async def root():
    return {"message": "Welcome you to my app"}
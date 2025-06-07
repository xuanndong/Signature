# SQLAlchemy models (User)

from sqlalchemy import Column, UUID, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from src.models import Base
import uuid

class User(Base):
    __tablename__ = "users"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True, index=True)
    password_hash = Column(String(255))
    two_factor_secret = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())
    last_login = Column(DateTime, index=True)

    # Relationships
    key = relationship("Key", back_populates="user", uselist=False)
    documents = relationship("Document", back_populates="user")
    signatures = relationship("Signature", back_populates="signer")
    verifications = relationship("Verification", back_populates="verifier")
    shared_documents = relationship("SharedDocument", back_populates="user")
    activity_logs = relationship("ActivityLog", back_populates="user")

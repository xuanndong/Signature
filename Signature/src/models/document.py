# SQLAlchemy models (Document, Signature)

from sqlalchemy import Column, UUID, Text, String, DateTime, ForeignKey, Integer
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from src.models import Base

class Document(Base):
    __tablename__ = "documents"

    document_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID, ForeignKey('users.user_id', ondelete='CASCADE'))
    filename = Column(String(255))
    status = Column(String(255))
    file_bytes = Column(Text)
    created_at = Column(DateTime, server_default=func.now())

    # Relationship
    user = relationship("User", back_populates="documents")
    signature = relationship("Signature", back_populates="document", uselist=False)
    shared_documents = relationship("SharedDocument", back_populates="document")
    activity_logs = relationship("ActivityLog", back_populates="document")
    
class Signature(Base):
    __tablename__ = "signatures"

    signature_id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(Integer, ForeignKey("documents.document_id", ondelete="CASCADE"))
    user_id = Column(UUID, ForeignKey('users.user_id', ondelete='SET NULL'))
    key_id = Column(Integer, ForeignKey('keys.key_id', ondelete='SET NULL'))
    signature = Column(Text)
    signed_at = Column(DateTime, server_default=func.now())

    # Relationship
    document = relationship("Document", back_populates="signature")
    key = relationship('Key', back_populates='signatures')
    verifications = relationship('Verification', back_populates='signature')
    signer = relationship('User', back_populates='signatures')

class SharedDocument(Base):
    __tablename__ = 'shared_documents'

    share_id = Column(Integer, primary_key=True, autoincrement=True)
    document_id = Column(Integer, ForeignKey('documents.document_id', ondelete='CASCADE'))
    user_id = Column(UUID, ForeignKey('users.user_id', ondelete='CASCADE'))
    token = Column(String(64), unique=True)
    expires_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())

    # Relationship
    document = relationship('Document', back_populates='shared_documents')
    user = relationship('User', back_populates='shared_documents')
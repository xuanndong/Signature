# SQLAlchemy models (Verification)

from sqlalchemy import Column, Boolean, UUID, DateTime, ForeignKey, Text, Integer
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from src.models import Base

class Verification(Base):
    __tablename__ = "verifications"

    verification_id = Column(Integer, primary_key=True, autoincrement=True)
    signature_id = Column(Integer, ForeignKey('signatures.signature_id', ondelete='CASCADE'))
    user_id = Column(UUID, ForeignKey("users.user_id", ondelete='SET NULL'))
    is_valid = Column(Boolean)
    verified_at = Column(DateTime, server_default=func.now())
    
    # Relationship
    signature = relationship("Signature", back_populates="verifications")
    verifier = relationship('User', back_populates='verifications')
    

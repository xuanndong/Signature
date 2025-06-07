# SQLAlchemy models (Key)

from sqlalchemy import Column, UUID, DateTime, ForeignKey, Text, Integer
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from src.models import Base

class Key(Base):
    __tablename__ = "keys"

    key_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID, ForeignKey('users.user_id', ondelete='CASCADE'), unique=True)
    public_key = Column(Text)
    encrypted_private = Column(Text) 
    salt = Column(Text)
    nonce = Column(Text)
    revoked_at = Column(DateTime)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationship
    user = relationship("User", back_populates="key")
    signatures = relationship("Signature", back_populates="key")
 
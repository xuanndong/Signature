# SQLAlchemy models (Key)

from sqlalchemy import Column, String, UUID, DateTime, ForeignKey, Text, Integer
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from src.models import Base

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    log_id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(UUID, ForeignKey('users.user_id', ondelete='CASCADE'), unique=True)
    activity_type = Column(String(50)) # 'SIGN', 'VERIFY', 'SHARE'
    document_id = Column(Integer, ForeignKey('documents.document_id', ondelete='SET NULL'))
    ip_address = Column(String(45))
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationship
    user = relationship("User", back_populates="activity_logs")
    document = relationship("Document", back_populates="activity_logs")

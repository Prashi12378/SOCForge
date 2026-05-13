from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from app.core.database import Base

class Upload(Base):
    __tablename__ = "uploads"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, index=True)
    upload_date = Column(DateTime, default=datetime.utcnow)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    file_type = Column(String)
    status = Column(String, default="processed")  # pending, processed, failed

    incidents = relationship("Incident", back_populates="source_upload")


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, index=True)
    severity = Column(String, index=True)  # Low, Medium, High, Critical
    source_ip = Column(String, index=True)
    destination_ip = Column(String, index=True)
    hostname = Column(String)
    username = Column(String)
    event_type = Column(String, index=True)
    status = Column(String)
    description = Column(Text)
    
    upload_id = Column(Integer, ForeignKey("uploads.id"))
    source_upload = relationship("Upload", back_populates="incidents")

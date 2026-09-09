import enum
import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base

class ComplaintStatus(str, enum.Enum):
    PENDING = "PENDING"
    ASSIGNED = "ASSIGNED"
    IN_PROGRESS = "IN_PROGRESS"
    RESOLVED = "RESOLVED"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"
    CANCELLED = "CANCELLED"

class ComplaintCategory(str, enum.Enum):
    GARBAGE_COLLECTION = "Garbage Collection"
    DRAIN_BLOCKAGE = "Drain Blockage"
    HAZARDOUS_WASTE = "Hazardous Waste"
    STREET_LIGHTING = "Street Lighting"
    POTHOLE = "Pothole"
    WATER_LEAKAGE = "Water Leakage"
    STRAY_ANIMALS = "Stray Animals"
    OTHER = "Other"

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    citizen_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
    category = Column(Enum(ComplaintCategory), default=ComplaintCategory.GARBAGE_COLLECTION)
    severity = Column(Float, default=5.0)  # 0.0 to 10.0 scale
    ai_confidence = Column(Float, nullable=True) # Confidence from MobileNetV2 AI
    ai_category = Column(String, nullable=True) # Category predicted by AI
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String, nullable=True)
    image_url = Column(Text, nullable=True)  # Base64 or Cloud URL
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.PENDING, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    # Relationships
    citizen = relationship("User", back_populates="complaints", foreign_keys=[citizen_id])
    assignment = relationship("Assignment", back_populates="complaint", uselist=False, cascade="all, delete-orphan")
    resolution = relationship("Resolution", back_populates="complaint", uselist=False, cascade="all, delete-orphan")
    rating = relationship("Rating", back_populates="complaint", uselist=False, cascade="all, delete-orphan")

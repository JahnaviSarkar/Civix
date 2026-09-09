import enum
import datetime
from sqlalchemy import Column, String, DateTime, Enum, Integer
from sqlalchemy.orm import relationship
from app.database import Base

class UserRole(str, enum.Enum):
    CITIZEN = "citizen"
    CREW = "crew"
    ADMIN = "admin"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    firebase_uid = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False, default="Civix User")
    email = Column(String, unique=True, index=True, nullable=False)
    role = Column(Enum(UserRole), nullable=False, default=UserRole.CITIZEN)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    complaints = relationship("Complaint", back_populates="citizen", foreign_keys="Complaint.citizen_id")
    assignments = relationship("Assignment", back_populates="crew", foreign_keys="Assignment.crew_id")
    resolutions = relationship("Resolution", back_populates="crew", foreign_keys="Resolution.crew_id")
    ratings = relationship("Rating", back_populates="citizen", foreign_keys="Rating.citizen_id")

import enum

class UserRole(str, enum.Enum):
    CITIZEN = "citizen"
    CREW = "crew"
    ADMIN = "admin"

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

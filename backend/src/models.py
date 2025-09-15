from sqlalchemy import Column, Integer, String, DateTime, func, Enum
from .database import Base
from sqlalchemy.dialects.postgresql import UUID
import uuid,enum

class GenderEnum(str, enum.Enum):
    female = "female"
    male = "male"
    other = "other"
    na = "na"

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False )
    name = Column(String, nullable=False)
    age = Column(Integer, nullable=False)
    gender = Column(Enum(GenderEnum, native_enum=False), nullable=False)
    phone = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    photo_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    
import uuid
from beanie import Document, Indexed
from pydantic import BaseModel, Field, StringConstraints, validator
from enum import Enum
from datetime import datetime
from typing import Optional, Annotated # <-- Import Annotated

# --- Forget Password Schema ---
class ForgotPasswordRequest(BaseModel):
    """Schema for the forgot password request payload."""
    phoneOrEmail: str

class ForgotPasswordResponse(BaseModel):
    """Schema for the mock forgot password response."""
    message: str


# --- Shared Enum ---
class GenderEnum(str, Enum):
    female = "female"
    male = "male"
    other = "other"
    na = "na"

# --- Database Model ---
class User(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    # --- ANNOTATED for Beanie Indexes ---
    username: Annotated[str, Indexed(unique=True)]
    name: str = Field(min_length=2, max_length=50)
    age: int = Field(gt=12, lt=121)
    gender: GenderEnum
    # --- ANNOTATED for Beanie Indexes ---
    phone: Annotated[str, Indexed(unique=True)]
    password_hash: str
    photo_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

    class Settings:
        name = "users"

# --- API Schemas ---
class UserCreate(BaseModel):
    # --- ANNOTATED for Pydantic String Constraints ---
    username: Annotated[str, StringConstraints(min_length=2, max_length=50)]
    name: Annotated[str, StringConstraints(min_length=2, max_length=50)]
    age: int = Field(..., gt=12, lt=121)
    gender: GenderEnum
    phone: Annotated[str, StringConstraints(strip_whitespace=True, pattern=r'^\+?[0-9]{10,15}$')]
    password: str

    @validator('password')
    def password_complexity(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        # Add other checks here if needed
        return v

class UserLogin(BaseModel):
    username: str
    password: str

class TokenRefresh(BaseModel):
    refresh_token: str

class UserResponse(BaseModel):
    id: uuid.UUID
    username: str
    name: str
    class Config:
        from_attributes = True

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class SignupResponse(BaseModel):
    user: UserResponse
    tokens: TokenResponse
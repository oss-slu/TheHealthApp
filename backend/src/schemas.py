from pydantic import BaseModel, Field, constr, validator
from uuid import UUID
from .models import GenderEnum
from typing import Annotated

# --- Validation Schemas ---

class UserCreate(BaseModel):
   
    username: Annotated[str, constr(min_length=2, max_length=50)]
    name: Annotated[str, constr(min_length=2, max_length=50)]
    age: Annotated[int, Field(gt=12, lt=121)]  # Must be between 13 and 120
    gender: GenderEnum
    phone: Annotated[str, constr(strip_whitespace=True, pattern=r'^\+?[0-9]{10,15}$')]
    password: str

    # Custom validator to check for password complexity rules
    @validator('password')
    def password_complexity(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        return v

# --- Response Schemas ---

class UserResponse(BaseModel):
    """
    Schema for the user data returned FROM the API.
    Notice it does NOT include the password or password_hash.
    """
    id: UUID
    username: str
    name: str
    age: int
    gender: GenderEnum
    phone: str

    class Config:
        from_orm = True # Allows Pydantic to read data from ORM models

class TokenResponse(BaseModel):
    """
    Schema for the JWT tokens returned FROM the API.
    """
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class SignupResponse(BaseModel):
    """
    Schema for the final, nested response object returned FROM the API.
    """
    user: UserResponse
    tokens: TokenResponse


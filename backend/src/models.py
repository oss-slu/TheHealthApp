import uuid
from beanie import Document, Indexed
from pydantic import BaseModel, Field, StringConstraints, field_validator, model_validator
from enum import Enum
from datetime import datetime
from typing import Optional, Annotated, Generic, TypeVar

# --- Consent (must match frontend CURRENT_CONSENT_VERSION) ---
CURRENT_CONSENT_VERSION = "v1.0"

# --- Shared Enum ---
class GenderEnum(str, Enum):
    female = "female"; male = "male"; other = "other"; na = "na"

# --- Database Model ---
class User(Document):
    id: uuid.UUID = Field(default_factory=uuid.uuid4)
    username: Annotated[str, Indexed(unique=True)]
    name: str = Field(min_length=2, max_length=50)
    age: int = Field(gt=12, lt=121)
    gender: GenderEnum
    phone: Annotated[str, Indexed(unique=True)]
    password_hash: str
    photo_url: Optional[str] = None
    consent_given: bool = False
    consent_timestamp: Optional[datetime] = None
    consent_version: Optional[str] = None
    data_usage: Optional[bool] = None
    marketing: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    class Settings:
        name = "users"


def user_has_valid_consent(user: User) -> bool:
    """True when user may access health features for the current policy version."""
    return bool(
        user.consent_given
        and user.data_usage is True
        and (user.consent_version or "") == CURRENT_CONSENT_VERSION
    )


class RevokedToken(Document):
    """Stores JWT IDs (jti) of revoked tokens until expiry. Used for logout / token blacklist."""
    jti: Annotated[str, Indexed(unique=True)]
    exp_at: datetime
    class Settings:
        name = "revoked_tokens"

# --- API Schemas ---
class UserCreate(BaseModel):
    username: Annotated[str, StringConstraints(min_length=2, max_length=50)]
    name: Annotated[str, StringConstraints(min_length=2, max_length=50)]
    age: int = Field(..., gt=12, lt=121)
    gender: GenderEnum
    phone: Annotated[str, StringConstraints(strip_whitespace=True, pattern=r'^\+?[0-9]{10,15}$')]
    password: str
    @field_validator('password', mode='after')
    def password_complexity(cls, v: str) -> str:
        if len(v) < 8: raise ValueError('Password must be at least 8 characters long')
        if not any(char.isdigit() for char in v): raise ValueError('Password must contain at least one digit')
        if not any(char.isupper() for char in v): raise ValueError('Password must contain at least one uppercase letter')
        return v

class UserUpdate(BaseModel):
    name: Optional[Annotated[str, StringConstraints(min_length=2, max_length=50)]] = None
    age: Optional[int] = Field(None, gt=12, lt=121)
    phone: Optional[Annotated[str, StringConstraints(strip_whitespace=True, pattern=r'^\+?[0-9]{10,15}$')]] = None

class UserLogin(BaseModel):
    username: str; password: str

class TokenRefresh(BaseModel):
    refresh_token: str


class LogoutRequest(BaseModel):
    refresh_token: str
    access_token: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    phoneOrEmail: str

class ForgotPasswordResponse(BaseModel):
    message: str

class UserResponse(BaseModel):
    id: uuid.UUID
    username: str
    name: str
    age: int
    gender: GenderEnum
    phone: str
    photo_url: Optional[str] = None
    consent_given: bool = False
    consent_version: Optional[str] = None
    data_usage: Optional[bool] = None
    marketing: bool = False
    class Config:
        from_attributes = True


class ConsentSubmit(BaseModel):
    consent_given: bool
    data_usage: bool
    marketing: bool = False
    version: str = CURRENT_CONSENT_VERSION

    @model_validator(mode="after")
    def validate_required_consents(self):
        if self.version != CURRENT_CONSENT_VERSION:
            raise ValueError(f"Consent version must be {CURRENT_CONSENT_VERSION}")
        if not self.consent_given or not self.data_usage:
            raise ValueError("Terms and data usage consent are required")
        return self


class ConsentStatusData(BaseModel):
    consent_given: bool
    version: str

class TokenResponse(BaseModel):
    access_token: str; refresh_token: str; token_type: str = "bearer"

class SignupResponse(BaseModel):
    user: UserResponse; tokens: TokenResponse

T = TypeVar('T')
class ErrorDetail(BaseModel):
   
    code: str
    message: str
    details: Optional[dict | list] = None

class ErrorResponse(BaseModel):
   
    success: bool = False
    error: ErrorDetail

class SuccessResponse(BaseModel, Generic[T]):
   
    success: bool = True
    data: T


# --- Health Risk Assessment Schemas ---
class BloodPressureTreatmentEnum(str, Enum):
    yes = "yes"
    no = "no"


class SmokingStatusEnum(str, Enum):
    current = "current"
    former = "former"
    never = "never"


class DiabetesStatusEnum(str, Enum):
    yes = "yes"
    no = "no"
    prediabetes = "prediabetes"


class RiskCategoryEnum(str, Enum):
    low = "low"
    moderate = "moderate"
    high = "high"
    very_high = "very_high"


class HealthRiskInput(BaseModel):
    """Input schema for health risk calculation based on simplified Framingham model."""
    
    age: int = Field(
        ..., 
        ge=20, 
        le=120,
        description="Age in years (20-120)"
    )
    gender: GenderEnum = Field(
        ...,
        description="Biological sex for risk calculation"
    )
    total_cholesterol: float = Field(
        ..., 
        ge=100, 
        le=500,
        description="Total cholesterol in mg/dL (100-500)"
    )
    hdl_cholesterol: float = Field(
        ..., 
        ge=10, 
        le=150,
        description="HDL cholesterol in mg/dL (10-150)"
    )
    systolic_blood_pressure: int = Field(
        ..., 
        ge=70, 
        le=250,
        description="Systolic blood pressure in mmHg (70-250)"
    )
    blood_pressure_treatment: BloodPressureTreatmentEnum = Field(
        ...,
        description="Whether currently on blood pressure medication"
    )
    smoking_status: SmokingStatusEnum = Field(
        ...,
        description="Current smoking status"
    )
    diabetes_status: DiabetesStatusEnum = Field(
        ...,
        description="Diabetes status"
    )

    @field_validator('gender', mode='after')
    def validate_gender_for_risk(cls, v: GenderEnum) -> GenderEnum:
        if v in (GenderEnum.other, GenderEnum.na):
            raise ValueError(
                "Risk calculation requires biological sex (male or female). "
                "For 'other' or 'na', please select the closest biological match for accurate risk assessment."
            )
        return v

    @field_validator('hdl_cholesterol', mode='after')
    def validate_hdl_vs_total(cls, v: float, info) -> float:
        total = info.data.get('total_cholesterol')
        if total is not None and v >= total:
            raise ValueError("HDL cholesterol must be less than total cholesterol")
        return v


class RiskFactorBreakdown(BaseModel):
    """Breakdown of individual risk factor contributions."""
    
    age_factor: float = Field(..., description="Risk contribution from age")
    cholesterol_factor: float = Field(..., description="Risk contribution from cholesterol ratio")
    blood_pressure_factor: float = Field(..., description="Risk contribution from blood pressure")
    smoking_factor: float = Field(..., description="Risk contribution from smoking status")
    diabetes_factor: float = Field(..., description="Risk contribution from diabetes status")


class HealthRiskOutput(BaseModel):
    """Output schema for health risk calculation results."""
    
    risk_score: float = Field(
        ..., 
        ge=0, 
        le=100,
        description="10-year cardiovascular risk percentage (0-100)"
    )
    risk_category: RiskCategoryEnum = Field(
        ...,
        description="Risk category classification"
    )
    risk_category_description: str = Field(
        ...,
        description="Human-readable description of the risk category"
    )
    factor_breakdown: RiskFactorBreakdown = Field(
        ...,
        description="Breakdown of individual risk factor contributions"
    )
    recommendations: list[str] = Field(
        ...,
        description="Personalized health recommendations based on risk factors"
    )
    disclaimer: str = Field(
        default="This is an estimated risk score for educational purposes only. "
                "Please consult a healthcare professional for medical advice.",
        description="Medical disclaimer"
    )
import os
import uuid
import bcrypt
from pathlib import Path
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import FastAPI, HTTPException, status, Depends, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic_settings import BaseSettings
from dotenv import load_dotenv
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import motor.motor_asyncio
from beanie import init_beanie
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from fastapi.encoders import jsonable_encoder
from fastapi.staticfiles import StaticFiles

# --- 1. CONFIGURATION ---
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))
class Settings(BaseSettings):
    MONGO_URL: str
    MONGO_DB_NAME: str
    JWT_ACCESS_SECRET: str
    JWT_REFRESH_SECRET: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    REFRESH_TOKEN_EXPIRE_DAYS: int
    ALLOWED_ORIGINS: str
    ALLOWED_ORIGIN_REGEX: str | None = None

settings = Settings()

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_PHOTO_TYPES = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
}
MAX_PHOTO_SIZE_BYTES = 5 * 1024 * 1024  # 5 MB

# --- 2. MODELS & SCHEMAS ---
from .models import (
    User, UserCreate, UserLogin, SignupResponse, 
    TokenRefresh, TokenResponse, ForgotPasswordRequest, ForgotPasswordResponse,
    UserResponse, UserUpdate, ErrorDetail, ErrorResponse, SuccessResponse
)

limiter = Limiter(key_func=get_remote_address,default_limits=["100 per 15 minutes"])
security = HTTPBearer()
# --- 3. SECURITY & DEPENDENCIES ---

def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = {"exp": expire, "sub": user_id}
    return jwt.encode(to_encode, settings.JWT_ACCESS_SECRET, algorithm="HS256")

def create_refresh_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode = {"exp": expire, "sub": user_id}
    return jwt.encode(to_encode, settings.JWT_REFRESH_SECRET, algorithm="HS256")

def verify_access_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.JWT_ACCESS_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
        return user_id
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired access token")

def verify_refresh_token(token: str) -> str:
    try:
        payload = jwt.decode(token, settings.JWT_REFRESH_SECRET, algorithms=["HS256"])
        user_id = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)]
) -> User:
    token = credentials.credentials
    user_id = verify_access_token(token)
    user = await User.get(uuid.UUID(user_id))
    if not user:
       raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

# --- 4. DATABASE LIFESPAN ---
@asynccontextmanager
async def lifespan(app: FastAPI):
    client = motor.motor_asyncio.AsyncIOMotorClient(settings.MONGO_URL)
    await init_beanie(database=client[settings.MONGO_DB_NAME], document_models=[User])
    print("Database connection established.")
    yield

# --- 5. MAIN APP & ENDPOINTS ---
app = FastAPI(title="Simple Health App API (MongoDB)", lifespan=lifespan)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
allowed_origins = [origin.strip() for origin in settings.ALLOWED_ORIGINS.split(',') if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=settings.ALLOWED_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    error = exc.errors()[0]
    message = f"Validation error in field '{error['loc'][-1]}': {error['msg']}"
    details = jsonable_encoder(exc.errors())
    
    error_detail = ErrorDetail(
        code="VALIDATION_ERROR",
        message=message,
        details=details
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"success": False, "error": error_detail.model_dump()}
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    error_detail = ErrorDetail(code="HTTP_ERROR", message=str(exc.detail))
    return JSONResponse(status_code=exc.status_code, content={"success": False, "error": error_detail.model_dump()})


@app.post("/api/v1/auth/signup", response_model=SuccessResponse[SignupResponse], tags=["Authentication"])
@limiter.limit("5 per minute")
async def signup_user(request: Request, payload: UserCreate):
    if await User.find_one(User.username == payload.username):
        raise HTTPException(status_code=409, detail="Username already exists")
    hashed_password = bcrypt.hashpw(payload.password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    new_user = User(**payload.model_dump(exclude={"password"}), password_hash=hashed_password)
    await new_user.insert()
    return SuccessResponse(data={
        "user": new_user,
        "tokens": {
            "access_token": create_access_token(str(new_user.id)),
            "refresh_token": create_refresh_token(str(new_user.id))
        }
    })



@app.patch("/api/v1/users/me", response_model=SuccessResponse[UserResponse], tags=["User"])
async def update_own_profile(payload: UserUpdate, current_user: Annotated[User, Depends(get_current_user)]):
    update_data = payload.model_dump(exclude_unset=True)
    if not update_data: return current_user
    if "phone" in update_data and update_data["phone"] != current_user.phone:
        if await User.find_one(User.phone == update_data["phone"]):
            raise HTTPException(status_code=409, detail="Phone number is already in use.")
    for key, value in update_data.items():
        setattr(current_user, key, value)
    current_user.updated_at = datetime.utcnow()
    await current_user.save()
    return SuccessResponse(data=current_user)


@app.post("/api/v1/auth/login", response_model=SuccessResponse[SignupResponse], tags=["Authentication"])
@limiter.limit("5 per minute")
async def login_user(request: Request, payload: UserLogin):
    user = await User.find_one(User.username == payload.username)
    if not user or not bcrypt.checkpw(payload.password.encode('utf-8'), user.password_hash.encode('utf-8')):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    return SuccessResponse(data={
        "user": user,
        "tokens": {
            "access_token": create_access_token(str(user.id)),
            "refresh_token": create_refresh_token(str(user.id))
        }
    })


@app.post("/api/v1/auth/refresh", response_model=SuccessResponse[TokenResponse], tags=["Authentication"])
@limiter.limit("10/minute")
async def refresh_access_token(request: Request, payload: TokenRefresh):
    user_id = verify_refresh_token(payload.refresh_token)
    return SuccessResponse(data={
        "access_token": create_access_token(user_id),
        "refresh_token": payload.refresh_token,
        "token_type": "bearer"
    })

@app.post("/api/v1/auth/logout", status_code=204, tags=["Authentication"])
async def logout_user():
    return None

@app.post("/api/v1/auth/forgot-password", response_model=SuccessResponse[ForgotPasswordResponse], tags=["Authentication"])
async def forgot_password(payload: ForgotPasswordRequest):
    print(f"Received forgot password request for: {payload.phoneOrEmail}")
    return SuccessResponse(data={
        "message": "If an account with this information exists, a reset link has been sent."
    })
@app.get("/api/v1/users/me", response_model=SuccessResponse[UserResponse], tags=["User"])
async def get_own_profile(current_user: Annotated[User, Depends(get_current_user)]):
    return SuccessResponse(data=current_user)

@app.post("/api/v1/users/me/photo", response_model=SuccessResponse[UserResponse], tags=["User"])
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: Annotated[User, Depends(get_current_user)] = None,
):
    if file.content_type not in ALLOWED_PHOTO_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file type. Please upload a JPG, PNG, or WEBP image.",
        )

    contents = await file.read()
    if not contents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded file is empty.",
        )

    if len(contents) > MAX_PHOTO_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Image is too large. Maximum allowed size is 5MB.",
        )

    extension = ALLOWED_PHOTO_TYPES[file.content_type]
    filename = f"{uuid.uuid4()}{extension}"
    filepath = UPLOAD_DIR / filename

    with open(filepath, "wb") as buffer:
        buffer.write(contents)

    if current_user.photo_url and current_user.photo_url.startswith("/uploads/"):
        old_path = BASE_DIR / current_user.photo_url.lstrip("/")
        if old_path.exists():
            try:
                old_path.unlink()
            except OSError:
                pass

    current_user.photo_url = f"/uploads/{filename}"
    current_user.updated_at = datetime.utcnow()
    await current_user.save()

    return SuccessResponse(data=current_user)

@app.get("/healthz", tags=["System"])
def health_check():
    return {"success": True, "data": {"status": "ok"}}
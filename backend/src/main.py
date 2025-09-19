import os
import uuid
import bcrypt
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from typing import Annotated

import motor.motor_asyncio
from beanie import init_beanie
from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from jose import jwt, JWTError
from pydantic_settings import BaseSettings

# --- 1. CONFIGURATION ---
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

class Settings(BaseSettings):
    MONGO_URL: str
    MONGO_DB_NAME: str
    JWT_ACCESS_SECRET: str
    JWT_REFRESH_SECRET: str

settings = Settings()

# --- 2. MODELS & SCHEMAS ---
from .models import (
    User, UserCreate, UserLogin, SignupResponse, TokenRefresh, TokenResponse,
    ForgotPasswordRequest, ForgotPasswordResponse, UserResponse, UserUpdate, GenderEnum
)

# --- 3. SECURITY & DEPENDENCIES ---
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def create_access_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode = {"exp": expire, "sub": user_id}
    return jwt.encode(to_encode, settings.JWT_ACCESS_SECRET, algorithm="HS256")

def create_refresh_token(user_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=7)
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

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]) -> User:
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

@app.patch("/api/v1/users/me", response_model=UserResponse, tags=["User"])
async def update_own_profile(
    payload: UserUpdate, 
    current_user: Annotated[User, Depends(get_current_user)]
):
    update_data = payload.model_dump(exclude_unset=True)
    if "phone" in update_data and update_data["phone"] != current_user.phone:
        if await User.find_one(User.phone == update_data["phone"]):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="This phone number is already in use."
            )
    for key, value in update_data.items():
        setattr(current_user, key, value)
    current_user.updated_at = datetime.utcnow()
    await current_user.save()
    return current_user


@app.post("/api/v1/auth/signup", response_model=SignupResponse, tags=["Authentication"])
async def signup_user(payload: UserCreate):
    if await User.find_one(User.username == payload.username):
        raise HTTPException(status_code=409, detail="Username already exists")
    
    pwd_bytes = payload.password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')
    
    user_data = payload.model_dump(exclude={"password"})
    new_user = User(**user_data, password_hash=hashed_password)
    await new_user.insert()

    return {
        "user": new_user,
        "tokens": {
            "access_token": create_access_token(str(new_user.id)),
            "refresh_token": create_refresh_token(str(new_user.id))
        }
    }

@app.post("/api/v1/auth/login", response_model=SignupResponse, tags=["Authentication"])
async def login_user(payload: UserLogin):
    user = await User.find_one(User.username == payload.username)
    
    password_is_valid = False
    if user:
        password_is_valid = bcrypt.checkpw(
            payload.password.encode('utf-8'), 
            user.password_hash.encode('utf-8')
        )

    if not user or not password_is_valid:
        raise HTTPException(status_code=401, detail="Incorrect username or password")

    return {
        "user": user,
        "tokens": {
            "access_token": create_access_token(str(user.id)),
            "refresh_token": create_refresh_token(str(user.id))
        }
    }

@app.post("/api/v1/auth/refresh", response_model=TokenResponse, tags=["Authentication"])
async def refresh_access_token(payload: TokenRefresh):
    user_id = verify_refresh_token(payload.refresh_token)
    return {
        "access_token": create_access_token(user_id),
        "refresh_token": payload.refresh_token,
        "token_type": "bearer"
    }

@app.post("/api/v1/auth/logout", status_code=204, tags=["Authentication"])
async def logout_user():
    return None

@app.post("/api/v1/auth/forgot-password", response_model=ForgotPasswordResponse, tags=["Authentication"])
async def forgot_password(payload: ForgotPasswordRequest):
    print(f"Received forgot password request for: {payload.phoneOrEmail}")
    return {"message": "If an account with this information exists, a reset link has been sent."}

@app.get("/api/v1/users/me", response_model=UserResponse, tags=["User"])
async def get_own_profile(current_user: Annotated[User, Depends(get_current_user)]):
    return current_user

@app.get("/healthz", tags=["System"])
def health_check():
    return {"status": "ok"}
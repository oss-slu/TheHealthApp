import bcrypt
from datetime import datetime, timedelta, timezone
from jose import jwt
from .config import settings

def hash_password(password: str) -> str:
    """Hashes a plain-text password using bcrypt."""
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_password = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_password.decode('utf-8')

def create_access_token(user_id: str) -> str:
    """Creates a new JWT access token for a user."""
    token_data = {"sub": user_id}
    expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    token_data.update({"exp": expire})
    return jwt.encode(token_data, settings.JWT_SECRET, algorithm="HS256")

def create_refresh_token(user_id: str) -> str:
    """Creates a new JWT refresh token for a user."""
    token_data = {"sub": user_id}
    expire = datetime.now(timezone.utc) + timedelta(days=7)
    token_data.update({"exp": expire})
    return jwt.encode(token_data, settings.JWT_SECRET, algorithm="HS256")

from fastapi import FastAPI, Request, status, HTTPException, Depends
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from .database import SessionLocal
from . import models, schemas, security
from sqlalchemy.orm import Session


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

app = FastAPI(
    title="Health App Backend API",
    description="API for core user and account features.",
    version="1.0.0"
)

@app.post("/api/v1/auth/signup", status_code=status.HTTP_201_CREATED, response_model=schemas.SignupResponse, tags=["Authentication"])
def signup_user(user_payload: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == user_payload.username).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already exists."
        )
    
    if db.query(models.User).filter(models.User.phone == user_payload.phone).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Phone number already registered."
        )

    hashed_password = security.hash_password(user_payload.password)
    
    user_data = user_payload.model_dump(exclude={"password"})
    new_user = models.User(**user_data, password_hash=hashed_password)
    
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    access_token = security.create_access_token(user_id=str(new_user.id))
    refresh_token = security.create_refresh_token(user_id=str(new_user.id))

    return {
        "user": new_user,
        "tokens": {
            "access_token": access_token,
            "refresh_token": refresh_token
        }
    }

@app.post("/api/v1/auth/login", response_model=schemas.SignupResponse, tags=["Authentication"])
def login_user(login_payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == login_payload.username).first()
    
    if not user or not security.verify_password(login_payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token = security.create_access_token(user_id=str(user.id))
    refresh_token = security.create_refresh_token(user_id=str(user.id))

    return {
        "user": user,
        "tokens": {
            "access_token": access_token,
            "refresh_token": refresh_token
        }
    }


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"message": "Invalid input data", "errors": exc.errors()}
    )

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"message": exc.detail}
    )

@app.get("/healthz")
async def health_check():    
    return {"status": "ok"} 

@app.get("/")
async def read_root():
    return {"message": "Hello, World!"}
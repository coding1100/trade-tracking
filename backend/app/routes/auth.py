from fastapi import APIRouter, HTTPException, Depends
from passlib.context import CryptContext
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime, timedelta
from app.models import User
from app.database import get_db
from app.schemas import UserCreate, UserLogin, Token
import logging

router = APIRouter()

# Security settings
SECRET_KEY = "12345678"  # Replace with env variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 3000

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
logger = logging.getLogger("auth")
logger.setLevel(logging.INFO)

def create_access_token(data: dict, expires_delta: timedelta = None):
    """
    Create a JWT access token.
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str, db: Session = Depends(get_db)):
    """
    Decode JWT and fetch the current user.
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid authentication credentials")
        
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        
        return user
    except JWTError as e:
        logger.error(f"JWT decode error: {e}")
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")

@router.post("/auth/register", response_model=Token)
def register(user: UserCreate, db: Session = Depends(get_db)):
    """
    Register a new user.
    """
    try:
        logger.info(f"Registering user: {user.email}")
        
        # Check if user exists
        db_user = db.query(User).filter(User.email == user.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email is already registered")

        # Create new user
        hashed_password = pwd_context.hash(user.password)
        new_user = User(email=user.email, name=user.name, password=hashed_password)
        db.add(new_user)
        db.commit()
        db.refresh(new_user)

        # Create token
        access_token = create_access_token(data={"sub": new_user.email, "user_id": new_user.id})
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        logger.error(f"Error during registration: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred")

@router.post("/auth/login", response_model=Token)
def login(user: UserLogin, db: Session = Depends(get_db)):
    """
    Authenticate a user and return a JWT.
    """
    try:
        logger.info(f"User login attempt: {user.email}")
        
        # Fetch user from database
        db_user = db.query(User).filter(User.email == user.email).first()
        if not db_user or not pwd_context.verify(user.password, db_user.password):
            raise HTTPException(status_code=400, detail="Invalid credentials")
        
        # Create access token with both email and user_id
        access_token = create_access_token(data={"sub": db_user.email, "user_id": db_user.id})
        
        return {"access_token": access_token, "token_type": "bearer"}
    except Exception as e:
        logger.error(f"Error during login: {e}")
        raise HTTPException(status_code=500, detail="An internal server error occurred")

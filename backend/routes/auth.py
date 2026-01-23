from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from models import UserCreate, UserResponse, UserInDB, UserLogin, Token, TokenData
from database import get_collection
import os
from dotenv import load_dotenv

load_dotenv()

router = APIRouter()

# Security configurations
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/login")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Generate password hash"""
    # Truncate password to 72 bytes max for bcrypt compatibility
    password_bytes = password.encode('utf-8')
    if len(password_bytes) > 72:
        password_bytes = password_bytes[:72]
        password = password_bytes.decode('utf-8', errors='ignore')
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    """Get current user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = TokenData(email=email)
    except JWTError:
        raise credentials_exception
    
    users_collection = get_collection("users")
    user = await users_collection.find_one({"email": token_data.email})
    if user is None:
        raise credentials_exception
    return user

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user: UserCreate):
    """Register a new user"""
    print(f"🔍 DEBUG: Registration request received for user: {user.email}")
    
    try:
        users_collection = get_collection("users")
        if users_collection is None:
            print("❌ DEBUG: Database collection is None!")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database connection failed"
            )
        
        print(f"🔍 DEBUG: Checking if user {user.email} already exists")
        # Check if user already exists
        existing_user = await users_collection.find_one({"email": user.email})
        if existing_user:
            print(f"❌ DEBUG: User {user.email} already exists")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        print(f"🔍 DEBUG: Creating new user {user.email}")
        # Validate password length before hashing
        password_bytes = user.password.encode('utf-8')
        if len(password_bytes) > 72:
            print(f"❌ DEBUG: Password too long: {len(password_bytes)} bytes")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password cannot be longer than 72 bytes (bcrypt limitation). Please use a shorter password."
            )
        
        # Hash password and create user document
        hashed_password = get_password_hash(user.password)
        user_doc = {
            "username": user.username,
            "email": user.email,
            "full_name": user.full_name,
            "age": user.age,
            "learning_language": user.learning_language,
            "hashed_password": hashed_password,
            "created_at": datetime.utcnow(),
            "is_active": True
        }
        
        print(f"🔍 DEBUG: Inserting user into database")
        # Insert user into database
        result = await users_collection.insert_one(user_doc)
        print(f"🔍 DEBUG: User inserted with ID: {result.inserted_id}")
        
        # Return user response (without password)
        user_response = UserResponse(
            id=result.inserted_id,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            age=user.age,
            learning_language=user.learning_language,
            created_at=user_doc["created_at"],
            is_active=True
        )
        
        print(f"✅ DEBUG: Registration successful for {user.email}")
        return user_response
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ DEBUG: Unexpected error during registration: {str(e)}")
        print(f"❌ DEBUG: Error type: {type(e)}")
        import traceback
        print(f"❌ DEBUG: Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=Token)
async def login_user(user_credentials: UserLogin):
    """Authenticate user and return JWT token"""
    users_collection = get_collection("users")
    
    # Find user by email
    user = await users_collection.find_one({"email": user_credentials.email})
    if not user or not verify_password(user_credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"]}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def read_users_me(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(
        id=current_user["_id"],
        username=current_user["username"],
        email=current_user["email"],
        full_name=current_user.get("full_name"),
        age=current_user.get("age"),
        learning_language=current_user.get("learning_language"),
        created_at=current_user["created_at"],
        is_active=current_user["is_active"]
    )

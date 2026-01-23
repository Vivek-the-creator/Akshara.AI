from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, Dict, Any
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    """Custom ObjectId class for Pydantic"""
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v, _info=None):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")

class UserBase(BaseModel):
    """Base user model"""
    username: str
    email: EmailStr
    full_name: Optional[str] = None
    age: Optional[int] = None
    learning_language: Optional[str] = None

class UserCreate(UserBase):
    """User creation model"""
    password: str
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v):
        if len(v.encode('utf-8')) > 72:
            raise ValueError('Password cannot be longer than 72 bytes (bcrypt limitation)')
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v

class UserResponse(UserBase):
    """User response model"""
    id: Optional[PyObjectId] = None
    created_at: Optional[datetime] = None
    is_active: bool = True

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserLogin(BaseModel):
    """User login model"""
    email: EmailStr
    password: str

class UserInDB(UserBase):
    """User as stored in database"""
    id: PyObjectId
    hashed_password: str
    created_at: datetime
    is_active: bool = True

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class WritingSessionBase(BaseModel):
    """Base writing session model"""
    user_id: str
    title: Optional[str] = None
    content: Optional[str] = None
    language: Optional[str] = None

class WritingSessionCreate(WritingSessionBase):
    """Writing session creation model"""
    pass

class WritingSessionResponse(WritingSessionBase):
    """Writing session response model"""
    id: Optional[PyObjectId] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class WritingProgressBase(BaseModel):
    """Base writing progress model"""
    user_id: str
    language: str
    stage: str  # Beginner, Intermediate, Pro
    category: str  # Uyir Ezhuthugal, etc.
    level_number: int
    expected_character: str
    attempts_count: int = 0
    stars_awarded: int = 0
    completed_at: Optional[datetime] = None

class WritingProgressCreate(WritingProgressBase):
    """Writing progress creation model"""
    pass

class WritingProgressResponse(WritingProgressBase):
    """Writing progress response model"""
    id: Optional[PyObjectId] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class Token(BaseModel):
    """JWT Token model"""
    access_token: str
    token_type: str

class TokenData(BaseModel):
    """Token data model"""
    email: Optional[str] = None

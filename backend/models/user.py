from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
import uuid

class BikeInfo(BaseModel):
    make: str
    model: str
    year: int
    type: str  # Sport, Cruiser, Adventure, etc.

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=20)
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=50)
    bio: Optional[str] = Field(None, max_length=500)
    location: Optional[str] = Field(None, max_length=100)
    bike_info: Optional[BikeInfo] = None
    profile_image_url: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=50)
    bio: Optional[str] = Field(None, max_length=500)
    location: Optional[str] = Field(None, max_length=100)
    bike_info: Optional[BikeInfo] = None
    profile_image_url: Optional[str] = None

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True
    friends: List[str] = Field(default_factory=list)  # List of user IDs
    garages: List[str] = Field(default_factory=list)  # List of garage IDs
    ride_count: int = 0
    post_count: int = 0

class UserInDB(User):
    hashed_password: str

class UserResponse(User):
    """User response model without sensitive data"""
    pass

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse
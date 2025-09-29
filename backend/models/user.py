from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
import uuid

class BikeInfo(BaseModel):
    make: str
    model: str
    year: int
    type: str  # Sport, Cruiser, Adventure, etc.
    color: Optional[str] = None
    engine_size: Optional[str] = None
    modifications: Optional[List[str]] = Field(default_factory=list)

class SocialLoginInfo(BaseModel):
    provider: str  # google, facebook, apple
    provider_id: str
    email: str
    verified: bool = False

class UserPreferences(BaseModel):
    privacy_level: str = "public"  # public, friends, private
    email_notifications: bool = True
    push_notifications: bool = True
    show_online_status: bool = True
    allow_messages: str = "everyone"  # everyone, friends, none

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=20)
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=50)
    bio: Optional[str] = Field(None, max_length=500)
    location: Optional[str] = Field(None, max_length=100)
    bike_info: Optional[BikeInfo] = None
    profile_image_url: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None
    riding_experience: Optional[str] = None  # beginner, intermediate, advanced, expert
    preferences: Optional[UserPreferences] = Field(default_factory=UserPreferences)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserUpdate(BaseModel):
    full_name: Optional[str] = Field(None, min_length=1, max_length=50)
    bio: Optional[str] = Field(None, max_length=500)
    location: Optional[str] = Field(None, max_length=100)
    bike_info: Optional[BikeInfo] = None
    profile_image_url: Optional[str] = None
    website: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[datetime] = None
    gender: Optional[str] = None
    riding_experience: Optional[str] = None
    preferences: Optional[UserPreferences] = None

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    last_seen: Optional[datetime] = None
    is_active: bool = True
    is_verified: bool = False
    is_private: bool = False
    
    # Social features
    followers: List[str] = Field(default_factory=list)  # List of user IDs following this user
    following: List[str] = Field(default_factory=list)  # List of user IDs this user follows
    blocked_users: List[str] = Field(default_factory=list)  # List of blocked user IDs
    friends: List[str] = Field(default_factory=list)  # List of user IDs (mutual follows)
    
    # Content
    garages: List[str] = Field(default_factory=list)  # List of garage IDs
    saved_posts: List[str] = Field(default_factory=list)  # List of saved post IDs
    liked_posts: List[str] = Field(default_factory=list)  # List of liked post IDs
    
    # Statistics
    followers_count: int = 0
    following_count: int = 0
    friends_count: int = 0
    ride_count: int = 0
    post_count: int = 0
    garage_count: int = 0
    
    # Social login info
    social_logins: List[SocialLoginInfo] = Field(default_factory=list)
    
    # Additional metadata
    badges: List[str] = Field(default_factory=list)  # Achievement badges
    total_miles: int = 0
    favorite_routes: List[str] = Field(default_factory=list)

class UserInDB(User):
    hashed_password: Optional[str] = None  # Optional for social login users

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

class FollowRequest(BaseModel):
    user_id: str

class UserSearchResult(BaseModel):
    id: str
    username: str
    full_name: str
    profile_image_url: Optional[str] = None
    bio: Optional[str] = None
    followers_count: int = 0
    is_following: bool = False
    is_private: bool = False

class UserStats(BaseModel):
    followers_count: int
    following_count: int
    post_count: int
    garage_count: int
    ride_count: int
    total_miles: int

class SocialLoginRequest(BaseModel):
    provider: str  # google, facebook, apple
    access_token: str
    provider_data: Optional[Dict[str, Any]] = None
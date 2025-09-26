from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

class GarageBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    image_url: Optional[str] = None
    location: Optional[str] = Field(None, max_length=100)
    is_private: bool = False

class GarageCreate(GarageBase):
    pass

class GarageUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=3, max_length=50)
    description: Optional[str] = Field(None, max_length=500)
    image_url: Optional[str] = None
    location: Optional[str] = Field(None, max_length=100)
    is_private: Optional[bool] = None

class Garage(GarageBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    owner_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    members: List[str] = Field(default_factory=list)  # List of user IDs
    admins: List[str] = Field(default_factory=list)   # List of admin user IDs
    member_count: int = 0
    post_count: int = 0

class GarageResponse(Garage):
    """Garage response model"""
    pass

class GarageMembership(BaseModel):
    garage_id: str
    user_id: str
    role: str = "member"  # member, admin, owner
    joined_at: datetime = Field(default_factory=datetime.utcnow)

class JoinGarageRequest(BaseModel):
    garage_id: str
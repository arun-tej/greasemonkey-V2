from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

class PostBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)
    image_urls: Optional[List[str]] = Field(default_factory=list)
    hashtags: Optional[List[str]] = Field(default_factory=list)
    garage_id: Optional[str] = None  # None for general posts, specific ID for garage posts

class PostCreate(PostBase):
    pass

class PostUpdate(BaseModel):
    content: Optional[str] = Field(None, min_length=1, max_length=2000)
    image_urls: Optional[List[str]] = None
    hashtags: Optional[List[str]] = None

class Post(PostBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    author_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    likes: List[str] = Field(default_factory=list)  # List of user IDs who liked
    dislikes: List[str] = Field(default_factory=list)  # List of user IDs who disliked
    like_count: int = 0
    dislike_count: int = 0
    comment_count: int = 0
    score: int = 0  # like_count - dislike_count

class PostResponse(Post):
    """Post response model with author info"""
    author_username: Optional[str] = None
    author_full_name: Optional[str] = None
    garage_name: Optional[str] = None
    user_vote: Optional[str] = None  # "like", "dislike", or None

class PostVote(BaseModel):
    vote_type: str = Field(..., pattern="^(like|dislike|remove)$")
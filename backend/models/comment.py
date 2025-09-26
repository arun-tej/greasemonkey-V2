from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

class CommentBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)
    post_id: str

class CommentCreate(CommentBase):
    pass

class CommentUpdate(BaseModel):
    content: str = Field(..., min_length=1, max_length=1000)

class Comment(CommentBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    author_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    likes: List[str] = Field(default_factory=list)  # List of user IDs who liked
    like_count: int = 0

class CommentResponse(Comment):
    """Comment response model with author info"""
    author_username: Optional[str] = None
    author_full_name: Optional[str] = None
    user_liked: bool = False
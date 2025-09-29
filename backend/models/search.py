from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid

class MediaUploadBase(BaseModel):
    filename: str
    content_type: str
    size: int
    url: str
    uploaded_by: str

class MediaUpload(MediaUploadBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    is_public: bool = True
    alt_text: Optional[str] = None
    width: Optional[int] = None
    height: Optional[int] = None

class MediaUploadResponse(MediaUpload):
    pass

class SearchQuery(BaseModel):
    q: str = Field(..., min_length=1, max_length=100)
    type: Optional[str] = None  # users, posts, garages, hashtags
    limit: int = Field(20, le=50)
    offset: int = Field(0, ge=0)

class SearchResult(BaseModel):
    type: str
    id: str
    title: str
    subtitle: Optional[str] = None
    image_url: Optional[str] = None
    url: str
    metadata: Optional[dict] = None

class HashtagResult(BaseModel):
    tag: str
    post_count: int
    recent_posts: List[dict] = Field(default_factory=list)

class SearchResponse(BaseModel):
    query: str
    total_results: int
    results: List[SearchResult]
    suggestions: List[str] = Field(default_factory=list)
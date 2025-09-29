from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime
import uuid

class NotificationType:
    LIKE = "like"
    COMMENT = "comment"
    FOLLOW = "follow"
    MENTION = "mention"
    GARAGE_INVITE = "garage_invite"
    NEW_POST = "new_post"
    FRIEND_REQUEST = "friend_request"

class NotificationBase(BaseModel):
    recipient_id: str
    sender_id: str
    type: str
    title: str
    message: str
    data: Optional[Dict[str, Any]] = None  # Additional data like post_id, garage_id, etc.

class NotificationCreate(NotificationBase):
    pass

class Notification(NotificationBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=datetime.utcnow)
    read: bool = False
    read_at: Optional[datetime] = None

class NotificationResponse(Notification):
    sender_username: Optional[str] = None
    sender_full_name: Optional[str] = None
    sender_profile_image: Optional[str] = None

class NotificationUpdate(BaseModel):
    read: bool
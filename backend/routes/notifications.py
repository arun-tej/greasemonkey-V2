from fastapi import APIRouter, HTTPException, status, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from datetime import datetime

from models.user import UserInDB
from models.notification import (
    Notification, NotificationResponse, NotificationCreate, 
    NotificationUpdate, NotificationType
)
from auth import get_current_active_user
from database import get_database

router = APIRouter(prefix="/notifications", tags=["notifications"])

class NotificationService:
    @staticmethod
    async def create_notification(
        db: AsyncIOMotorDatabase,
        notification_data: NotificationCreate
    ) -> Notification:
        """Create a new notification"""
        notification = Notification(**notification_data.dict())
        await db.notifications.insert_one(notification.dict())
        return notification

    @staticmethod
    async def create_like_notification(
        db: AsyncIOMotorDatabase,
        post_id: str,
        post_author_id: str,
        liker_id: str,
        liker_username: str
    ):
        """Create notification for post like"""
        if post_author_id == liker_id:
            return  # Don't notify self
        
        notification = NotificationCreate(
            recipient_id=post_author_id,
            sender_id=liker_id,
            type=NotificationType.LIKE,
            title="New Like",
            message=f"{liker_username} liked your post",
            data={"post_id": post_id}
        )
        await NotificationService.create_notification(db, notification)

    @staticmethod
    async def create_comment_notification(
        db: AsyncIOMotorDatabase,
        post_id: str,
        post_author_id: str,
        commenter_id: str,
        commenter_username: str,
        comment_content: str
    ):
        """Create notification for new comment"""
        if post_author_id == commenter_id:
            return  # Don't notify self
        
        # Truncate comment for notification
        content_preview = comment_content[:50] + "..." if len(comment_content) > 50 else comment_content
        
        notification = NotificationCreate(
            recipient_id=post_author_id,
            sender_id=commenter_id,
            type=NotificationType.COMMENT,
            title="New Comment",
            message=f"{commenter_username} commented: {content_preview}",
            data={"post_id": post_id}
        )
        await NotificationService.create_notification(db, notification)

    @staticmethod
    async def create_follow_notification(
        db: AsyncIOMotorDatabase,
        followed_user_id: str,
        follower_id: str,
        follower_username: str
    ):
        """Create notification for new follower"""
        notification = NotificationCreate(
            recipient_id=followed_user_id,
            sender_id=follower_id,
            type=NotificationType.FOLLOW,
            title="New Follower",
            message=f"{follower_username} started following you",
            data={"user_id": follower_id}
        )
        await NotificationService.create_notification(db, notification)

    @staticmethod
    async def create_mention_notification(
        db: AsyncIOMotorDatabase,
        mentioned_user_id: str,
        mentioner_id: str,
        mentioner_username: str,
        post_id: str,
        context: str = "post"
    ):
        """Create notification for mention in post or comment"""
        notification = NotificationCreate(
            recipient_id=mentioned_user_id,
            sender_id=mentioner_id,
            type=NotificationType.MENTION,
            title="You were mentioned",
            message=f"{mentioner_username} mentioned you in a {context}",
            data={"post_id": post_id, "context": context}
        )
        await NotificationService.create_notification(db, notification)

    @staticmethod
    async def create_garage_invite_notification(
        db: AsyncIOMotorDatabase,
        invited_user_id: str,
        inviter_id: str,
        inviter_username: str,
        garage_id: str,
        garage_name: str
    ):
        """Create notification for garage invitation"""
        notification = NotificationCreate(
            recipient_id=invited_user_id,
            sender_id=inviter_id,
            type=NotificationType.GARAGE_INVITE,
            title="Garage Invitation",
            message=f"{inviter_username} invited you to join {garage_name}",
            data={"garage_id": garage_id}
        )
        await NotificationService.create_notification(db, notification)

@router.get("/", response_model=List[NotificationResponse])
async def get_notifications(
    limit: int = Query(20, le=50, description="Number of notifications to return"),
    offset: int = Query(0, ge=0, description="Number of notifications to skip"),
    unread_only: bool = Query(False, description="Return only unread notifications"),
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get user's notifications"""
    # Build query filter
    query_filter = {"recipient_id": current_user.id}
    if unread_only:
        query_filter["read"] = False
    
    # Get notifications
    notifications_cursor = db.notifications.find(query_filter)\
        .sort("created_at", -1)\
        .skip(offset)\
        .limit(limit)
    
    notifications = await notifications_cursor.to_list(length=limit)
    
    # Enrich with sender info
    enriched_notifications = []
    for notification in notifications:
        sender = await db.users.find_one({"id": notification["sender_id"]})
        
        enriched_notification = NotificationResponse(
            **notification,
            sender_username=sender.get("username") if sender else "Unknown",
            sender_full_name=sender.get("full_name") if sender else "Unknown",
            sender_profile_image=sender.get("profile_image_url") if sender else None
        )
        enriched_notifications.append(enriched_notification)
    
    return enriched_notifications

@router.get("/unread-count", response_model=dict)
async def get_unread_count(
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get count of unread notifications"""
    count = await db.notifications.count_documents({
        "recipient_id": current_user.id,
        "read": False
    })
    
    return {"unread_count": count}

@router.put("/{notification_id}/read", response_model=dict)
async def mark_notification_read(
    notification_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Mark notification as read"""
    notification = await db.notifications.find_one({"id": notification_id})
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    # Check if user owns the notification
    if notification["recipient_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only read your own notifications"
        )
    
    # Mark as read
    await db.notifications.update_one(
        {"id": notification_id},
        {
            "$set": {
                "read": True,
                "read_at": datetime.utcnow()
            }
        }
    )
    
    return {"message": "Notification marked as read"}

@router.put("/mark-all-read", response_model=dict)
async def mark_all_notifications_read(
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Mark all user's notifications as read"""
    result = await db.notifications.update_many(
        {
            "recipient_id": current_user.id,
            "read": False
        },
        {
            "$set": {
                "read": True,
                "read_at": datetime.utcnow()
            }
        }
    )
    
    return {
        "message": f"Marked {result.modified_count} notifications as read"
    }

@router.delete("/{notification_id}", response_model=dict)
async def delete_notification(
    notification_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete a notification"""
    notification = await db.notifications.find_one({"id": notification_id})
    if not notification:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Notification not found"
        )
    
    # Check if user owns the notification
    if notification["recipient_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own notifications"
        )
    
    # Delete notification
    await db.notifications.delete_one({"id": notification_id})
    
    return {"message": "Notification deleted"}

@router.delete("/clear-all", response_model=dict)
async def clear_all_notifications(
    older_than_days: Optional[int] = Query(None, description="Delete notifications older than N days"),
    read_only: bool = Query(True, description="Only delete read notifications"),
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Clear user's notifications"""
    # Build delete filter
    delete_filter = {"recipient_id": current_user.id}
    
    if read_only:
        delete_filter["read"] = True
    
    if older_than_days:
        from datetime import timedelta
        cutoff_date = datetime.utcnow() - timedelta(days=older_than_days)
        delete_filter["created_at"] = {"$lt": cutoff_date}
    
    # Delete notifications
    result = await db.notifications.delete_many(delete_filter)
    
    return {
        "message": f"Deleted {result.deleted_count} notifications"
    }

@router.get("/settings", response_model=dict)
async def get_notification_settings(
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get user's notification preferences"""
    user = await db.users.find_one({"id": current_user.id})
    preferences = user.get("preferences", {})
    
    return {
        "email_notifications": preferences.get("email_notifications", True),
        "push_notifications": preferences.get("push_notifications", True),
        "likes": True,  # Default notification types
        "comments": True,
        "follows": True,
        "mentions": True,
        "garage_invites": True
    }

@router.put("/settings", response_model=dict)
async def update_notification_settings(
    settings: dict,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update user's notification preferences"""
    # Update user preferences
    await db.users.update_one(
        {"id": current_user.id},
        {
            "$set": {
                "preferences.email_notifications": settings.get("email_notifications", True),
                "preferences.push_notifications": settings.get("push_notifications", True),
                "preferences.notification_types": {
                    "likes": settings.get("likes", True),
                    "comments": settings.get("comments", True),
                    "follows": settings.get("follows", True),
                    "mentions": settings.get("mentions", True),
                    "garage_invites": settings.get("garage_invites", True)
                }
            }
        }
    )
    
    return {"message": "Notification settings updated"}

# Helper function to create notifications from other modules
async def create_notification_helper(
    db: AsyncIOMotorDatabase,
    notification_type: str,
    recipient_id: str,
    sender_id: str,
    title: str,
    message: str,
    data: dict = None
):
    """Helper function to create notifications from other parts of the app"""
    notification = NotificationCreate(
        recipient_id=recipient_id,
        sender_id=sender_id,
        type=notification_type,
        title=title,
        message=message,
        data=data or {}
    )
    return await NotificationService.create_notification(db, notification)
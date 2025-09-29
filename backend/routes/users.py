from fastapi import APIRouter, HTTPException, status, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from datetime import datetime

from models.user import (
    UserResponse, UserUpdate, UserInDB, FollowRequest, 
    UserSearchResult, UserStats
)
from models.notification import NotificationCreate, Notification
from auth import get_current_active_user
from database import get_database

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Get current user profile"""
    return UserResponse(**current_user.dict())

@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    user_update: UserUpdate,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update current user profile"""
    # Update user data
    update_data = {k: v for k, v in user_update.dict().items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await db.users.update_one(
            {"id": current_user.id},
            {"$set": update_data}
        )
    
    # Get updated user
    updated_user = await db.users.find_one({"id": current_user.id})
    return UserResponse(**updated_user)

@router.get("/{user_id}", response_model=UserResponse)
async def get_user_profile(
    user_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get user profile by ID"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check privacy settings
    user_obj = UserInDB(**user)
    if user_obj.is_private and current_user.id not in user_obj.followers and current_user.id != user_id:
        # Return limited profile for private users
        return UserResponse(
            id=user_obj.id,
            username=user_obj.username,
            full_name=user_obj.full_name,
            profile_image_url=user_obj.profile_image_url,
            is_private=True,
            followers_count=user_obj.followers_count,
            following_count=user_obj.following_count,
            created_at=user_obj.created_at,
            email="",  # Hide email for privacy
            bio="This account is private",
            location=None
        )
    
    return UserResponse(**user_obj.dict())

@router.post("/{user_id}/follow", response_model=dict)
async def follow_user(
    user_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Follow a user"""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot follow yourself"
        )
    
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if already following
    if user_id in current_user.following:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already following this user"
        )
    
    # Update current user's following list
    await db.users.update_one(
        {"id": current_user.id},
        {
            "$push": {"following": user_id},
            "$inc": {"following_count": 1}
        }
    )
    
    # Update target user's followers list
    await db.users.update_one(
        {"id": user_id},
        {
            "$push": {"followers": current_user.id},
            "$inc": {"followers_count": 1}
        }
    )
    
    # Check if it's mutual follow (becomes friends)
    if current_user.id in target_user.get("following", []):
        # Add to friends list for both users
        await db.users.update_one(
            {"id": current_user.id},
            {
                "$push": {"friends": user_id},
                "$inc": {"friends_count": 1}
            }
        )
        await db.users.update_one(
            {"id": user_id},
            {
                "$push": {"friends": current_user.id},
                "$inc": {"friends_count": 1}
            }
        )
    
    # Create notification
    notification = NotificationCreate(
        recipient_id=user_id,
        sender_id=current_user.id,
        type="follow",
        title="New Follower",
        message=f"{current_user.username} started following you",
        data={"user_id": current_user.id}
    )
    await db.notifications.insert_one(Notification(**notification.dict()).dict())
    
    return {"message": "Successfully followed user", "is_mutual": current_user.id in target_user.get("following", [])}

@router.delete("/{user_id}/follow", response_model=dict)
async def unfollow_user(
    user_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Unfollow a user"""
    if user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot unfollow yourself"
        )
    
    target_user = await db.users.find_one({"id": user_id})
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if currently following
    if user_id not in current_user.following:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not following this user"
        )
    
    was_friend = user_id in current_user.friends
    
    # Update current user's following list
    await db.users.update_one(
        {"id": current_user.id},
        {
            "$pull": {"following": user_id, "friends": user_id},
            "$inc": {"following_count": -1, "friends_count": -1 if was_friend else 0}
        }
    )
    
    # Update target user's followers list
    await db.users.update_one(
        {"id": user_id},
        {
            "$pull": {"followers": current_user.id, "friends": current_user.id},
            "$inc": {"followers_count": -1, "friends_count": -1 if was_friend else 0}
        }
    )
    
    return {"message": "Successfully unfollowed user"}

@router.get("/{user_id}/followers", response_model=List[UserSearchResult])
async def get_user_followers(
    user_id: str,
    limit: int = Query(20, le=50),
    offset: int = Query(0, ge=0),
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get user's followers list"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check privacy
    if user.get("is_private", False) and current_user.id not in user.get("followers", []) and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot view followers of private account"
        )
    
    followers_ids = user.get("followers", [])[offset:offset + limit]
    if not followers_ids:
        return []
    
    # Get follower details
    followers_cursor = db.users.find({"id": {"$in": followers_ids}})
    followers = await followers_cursor.to_list(length=limit)
    
    # Format response
    result = []
    for follower in followers:
        result.append(UserSearchResult(
            id=follower["id"],
            username=follower["username"],
            full_name=follower["full_name"],
            profile_image_url=follower.get("profile_image_url"),
            bio=follower.get("bio"),
            followers_count=follower.get("followers_count", 0),
            is_following=follower["id"] in current_user.following,
            is_private=follower.get("is_private", False)
        ))
    
    return result

@router.get("/{user_id}/following", response_model=List[UserSearchResult])
async def get_user_following(
    user_id: str,
    limit: int = Query(20, le=50),
    offset: int = Query(0, ge=0),
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get user's following list"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check privacy
    if user.get("is_private", False) and current_user.id not in user.get("followers", []) and current_user.id != user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot view following list of private account"
        )
    
    following_ids = user.get("following", [])[offset:offset + limit]
    if not following_ids:
        return []
    
    # Get following details
    following_cursor = db.users.find({"id": {"$in": following_ids}})
    following_users = await following_cursor.to_list(length=limit)
    
    # Format response
    result = []
    for followed_user in following_users:
        result.append(UserSearchResult(
            id=followed_user["id"],
            username=followed_user["username"],
            full_name=followed_user["full_name"],
            profile_image_url=followed_user.get("profile_image_url"),
            bio=followed_user.get("bio"),
            followers_count=followed_user.get("followers_count", 0),
            is_following=followed_user["id"] in current_user.following,
            is_private=followed_user.get("is_private", False)
        ))
    
    return result

@router.get("/{user_id}/stats", response_model=UserStats)
async def get_user_stats(
    user_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get user statistics"""
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return UserStats(
        followers_count=user.get("followers_count", 0),
        following_count=user.get("following_count", 0),
        post_count=user.get("post_count", 0),
        garage_count=user.get("garage_count", 0),
        ride_count=user.get("ride_count", 0),
        total_miles=user.get("total_miles", 0)
    )
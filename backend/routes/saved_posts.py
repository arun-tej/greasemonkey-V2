from fastapi import APIRouter, HTTPException, status, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from datetime import datetime

from models.user import UserInDB
from models.post import PostResponse
from auth import get_current_active_user
from database import get_database

router = APIRouter(prefix="/saved", tags=["saved-posts"])

@router.post("/posts/{post_id}", response_model=dict)
async def save_post(
    post_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Save a post to user's saved collection"""
    # Check if post exists
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check if post is accessible (privacy check)
    if post.get("garage_id"):
        garage = await db.garages.find_one({"id": post["garage_id"]})
        if garage and garage.get("is_private", False) and current_user.id not in garage.get("members", []):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Cannot save post from private garage you're not a member of"
            )
    
    # Check if already saved
    if post_id in current_user.saved_posts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Post already saved"
        )
    
    # Add to saved posts
    await db.users.update_one(
        {"id": current_user.id},
        {"$push": {"saved_posts": post_id}}
    )
    
    # Create notification for post author (optional)
    if post["author_id"] != current_user.id:
        # Import here to avoid circular imports
        from routes.notifications import create_notification_helper
        await create_notification_helper(
            db,
            "save",
            post["author_id"],
            current_user.id,
            "Post Saved",
            f"{current_user.username} saved your post",
            {"post_id": post_id}
        )
    
    return {"message": "Post saved successfully"}

@router.delete("/posts/{post_id}", response_model=dict)
async def unsave_post(
    post_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Remove a post from user's saved collection"""
    # Check if post is in saved list
    if post_id not in current_user.saved_posts:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Post not in saved list"
        )
    
    # Remove from saved posts
    await db.users.update_one(
        {"id": current_user.id},
        {"$pull": {"saved_posts": post_id}}
    )
    
    return {"message": "Post removed from saved list"}

@router.get("/posts", response_model=List[PostResponse])
async def get_saved_posts(
    limit: int = Query(20, le=50, description="Number of posts to return"),
    offset: int = Query(0, ge=0, description="Number of posts to skip"),
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get user's saved posts"""
    saved_post_ids = current_user.saved_posts[offset:offset + limit]
    
    if not saved_post_ids:
        return []
    
    # Get saved posts
    posts_cursor = db.posts.find({"id": {"$in": saved_post_ids}})
    posts = await posts_cursor.to_list(length=limit)
    
    # Sort by save order (maintain original order from saved_posts list)
    posts_dict = {post["id"]: post for post in posts}
    ordered_posts = [posts_dict[post_id] for post_id in saved_post_ids if post_id in posts_dict]
    
    # Enrich posts with author and garage info
    enriched_posts = []
    for post in ordered_posts:
        # Get author info
        author = await db.users.find_one({"id": post["author_id"]})
        
        # Get garage info if it's a garage post
        garage_name = None
        if post.get("garage_id"):
            garage = await db.garages.find_one({"id": post["garage_id"]})
            garage_name = garage.get("name") if garage else None
        
        # Determine user's vote on this post
        user_vote = None
        if current_user.id in post.get("likes", []):
            user_vote = "like"
        elif current_user.id in post.get("dislikes", []):
            user_vote = "dislike"
        
        enriched_post = PostResponse(
            **post,
            author_username=author.get("username") if author else "Unknown",
            author_full_name=author.get("full_name") if author else "Unknown",
            garage_name=garage_name,
            user_vote=user_vote
        )
        enriched_posts.append(enriched_post)
    
    return enriched_posts

@router.get("/posts/count", response_model=dict)
async def get_saved_posts_count(
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Get count of saved posts"""
    return {"saved_count": len(current_user.saved_posts)}

@router.get("/posts/{post_id}/check", response_model=dict)
async def check_post_saved(
    post_id: str,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Check if a specific post is saved by the user"""
    is_saved = post_id in current_user.saved_posts
    return {"is_saved": is_saved}

@router.delete("/posts/clear", response_model=dict)
async def clear_saved_posts(
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Clear all saved posts"""
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"saved_posts": []}}
    )
    
    return {"message": "All saved posts cleared"}

# Additional endpoints for saved post collections/folders (future enhancement)
@router.post("/collections", response_model=dict)
async def create_saved_collection(
    collection_data: dict,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a saved posts collection (folder)"""
    # This is a future enhancement - for now, just acknowledge
    return {"message": "Collections feature coming soon"}

@router.get("/collections", response_model=List[dict])
async def get_saved_collections(
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get user's saved post collections"""
    # This is a future enhancement - for now, return empty list
    return []
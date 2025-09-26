from fastapi import APIRouter, HTTPException, status, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
from datetime import datetime
from models.post import PostCreate, PostUpdate, PostResponse, Post, PostVote
from models.user import UserInDB
from models.garage import Garage
from auth import get_current_active_user
from database import get_database

router = APIRouter(prefix="/posts", tags=["posts"])

async def get_post_with_details(db: AsyncIOMotorDatabase, post_doc: dict, current_user_id: str) -> PostResponse:
    """Helper function to enrich post data with author and garage info"""
    # Get author info
    author = await db.users.find_one({"id": post_doc["author_id"]})
    
    # Get garage info if it's a garage post
    garage_name = None
    if post_doc.get("garage_id"):
        garage = await db.garages.find_one({"id": post_doc["garage_id"]})
        garage_name = garage.get("name") if garage else None
    
    # Determine user's vote
    user_vote = None
    if current_user_id in post_doc.get("likes", []):
        user_vote = "like"
    elif current_user_id in post_doc.get("dislikes", []):
        user_vote = "dislike"
    
    return PostResponse(
        **post_doc,
        author_username=author.get("username") if author else None,
        author_full_name=author.get("full_name") if author else None,
        garage_name=garage_name,
        user_vote=user_vote
    )

@router.post("/", response_model=PostResponse)
async def create_post(
    post_data: PostCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new post"""
    # If it's a garage post, verify user is a member
    if post_data.garage_id:
        garage = await db.garages.find_one({"id": post_data.garage_id})
        if not garage:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Garage not found"
            )
        
        if current_user.id not in garage["members"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You must be a member to post in this garage"
            )
    
    # Create new post
    post_dict = post_data.dict()
    new_post = Post(**post_dict, author_id=current_user.id)
    
    # Save to database
    await db.posts.insert_one(new_post.dict())
    
    # Update user's post count
    await db.users.update_one(
        {"id": current_user.id},
        {"$inc": {"post_count": 1}}
    )
    
    # Update garage's post count if garage post
    if post_data.garage_id:
        await db.garages.update_one(
            {"id": post_data.garage_id},
            {"$inc": {"post_count": 1}}
        )
    
    # Return enriched post data
    return await get_post_with_details(db, new_post.dict(), current_user.id)

@router.get("/", response_model=List[PostResponse])
async def get_posts(
    garage_id: Optional[str] = Query(None, description="Filter by garage ID"),
    limit: int = Query(20, le=50, description="Number of posts to return"),
    offset: int = Query(0, ge=0, description="Number of posts to skip"),
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get posts feed"""
    query = {}
    
    if garage_id:
        # Get posts from specific garage
        garage = await db.garages.find_one({"id": garage_id})
        if not garage:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Garage not found"
            )
        
        # Check access to garage
        if garage["is_private"] and current_user.id not in garage["members"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to private garage"
            )
        
        query["garage_id"] = garage_id
    else:
        # Get posts from user's garages + general posts
        user_garages = current_user.garages or []
        query = {
            "$or": [
                {"garage_id": None},  # General posts
                {"garage_id": {"$in": user_garages}}  # Posts from user's garages
            ]
        }
    
    # Get posts sorted by creation date (latest first)
    posts = await db.posts.find(query).sort("created_at", -1).skip(offset).limit(limit).to_list(limit)
    
    # Enrich posts with author and garage info
    enriched_posts = []
    for post in posts:
        enriched_post = await get_post_with_details(db, post, current_user.id)
        enriched_posts.append(enriched_post)
    
    return enriched_posts

@router.get("/{post_id}", response_model=PostResponse)
async def get_post(
    post_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get specific post by ID"""
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check access if it's a garage post
    if post["garage_id"]:
        garage = await db.garages.find_one({"id": post["garage_id"]})
        if garage and garage["is_private"] and current_user.id not in garage["members"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to private garage post"
            )
    
    return await get_post_with_details(db, post, current_user.id)

@router.put("/{post_id}", response_model=PostResponse)
async def update_post(
    post_id: str,
    post_update: PostUpdate,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update post (author only)"""
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check if user is the author
    if post["author_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the author can update this post"
        )
    
    # Update post
    update_data = {k: v for k, v in post_update.dict().items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await db.posts.update_one(
            {"id": post_id},
            {"$set": update_data}
        )
    
    # Get updated post
    updated_post = await db.posts.find_one({"id": post_id})
    return await get_post_with_details(db, updated_post, current_user.id)

@router.delete("/{post_id}", response_model=dict)
async def delete_post(
    post_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete post (author only)"""
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check if user is the author
    if post["author_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the author can delete this post"
        )
    
    # Delete post
    await db.posts.delete_one({"id": post_id})
    
    # Delete all comments on this post
    await db.comments.delete_many({"post_id": post_id})
    
    # Update user's post count
    await db.users.update_one(
        {"id": current_user.id},
        {"$inc": {"post_count": -1}}
    )
    
    # Update garage's post count if garage post
    if post["garage_id"]:
        await db.garages.update_one(
            {"id": post["garage_id"]},
            {"$inc": {"post_count": -1}}
        )
    
    return {"message": "Post deleted successfully"}

@router.post("/{post_id}/vote", response_model=dict)
async def vote_on_post(
    post_id: str,
    vote_data: PostVote,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Vote on a post (like/dislike/remove vote)"""
    post = await db.posts.find_one({"id": post_id})
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found"
        )
    
    # Check access if it's a garage post
    if post["garage_id"]:
        garage = await db.garages.find_one({"id": post["garage_id"]})
        if garage and garage["is_private"] and current_user.id not in garage["members"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to private garage post"
            )
    
    user_id = current_user.id
    current_likes = post.get("likes", [])
    current_dislikes = post.get("dislikes", [])
    
    # Remove user from both lists first
    new_likes = [uid for uid in current_likes if uid != user_id]
    new_dislikes = [uid for uid in current_dislikes if uid != user_id]
    
    # Add vote based on vote_type
    if vote_data.vote_type == "like":
        new_likes.append(user_id)
    elif vote_data.vote_type == "dislike":
        new_dislikes.append(user_id)
    # For "remove", we just keep the user removed from both lists
    
    # Calculate new counts and score
    like_count = len(new_likes)
    dislike_count = len(new_dislikes)
    score = like_count - dislike_count
    
    # Update post
    await db.posts.update_one(
        {"id": post_id},
        {
            "$set": {
                "likes": new_likes,
                "dislikes": new_dislikes,
                "like_count": like_count,
                "dislike_count": dislike_count,
                "score": score
            }
        }
    )
    
    return {
        "message": f"Vote {vote_data.vote_type} recorded",
        "like_count": like_count,
        "dislike_count": dislike_count,
        "score": score
    }
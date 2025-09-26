from fastapi import APIRouter, HTTPException, status, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from datetime import datetime
from models.comment import CommentCreate, CommentUpdate, CommentResponse, Comment
from models.user import UserInDB
from auth import get_current_active_user
from database import get_database

router = APIRouter(prefix="/comments", tags=["comments"])

async def get_comment_with_details(db: AsyncIOMotorDatabase, comment_doc: dict, current_user_id: str) -> CommentResponse:
    """Helper function to enrich comment data with author info"""
    # Get author info
    author = await db.users.find_one({"id": comment_doc["author_id"]})
    
    # Check if current user liked this comment
    user_liked = current_user_id in comment_doc.get("likes", [])
    
    return CommentResponse(
        **comment_doc,
        author_username=author.get("username") if author else None,
        author_full_name=author.get("full_name") if author else None,
        user_liked=user_liked
    )

@router.post("/", response_model=CommentResponse)
async def create_comment(
    comment_data: CommentCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new comment on a post"""
    # Verify post exists and user has access
    post = await db.posts.find_one({"id": comment_data.post_id})
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
    
    # Create new comment
    comment_dict = comment_data.dict()
    new_comment = Comment(**comment_dict, author_id=current_user.id)
    
    # Save to database
    await db.comments.insert_one(new_comment.dict())
    
    # Update post's comment count
    await db.posts.update_one(
        {"id": comment_data.post_id},
        {"$inc": {"comment_count": 1}}
    )
    
    # Return enriched comment data
    return await get_comment_with_details(db, new_comment.dict(), current_user.id)

@router.get("/", response_model=List[CommentResponse])
async def get_comments(
    post_id: str = Query(..., description="Post ID to get comments for"),
    limit: int = Query(50, le=100, description="Number of comments to return"),
    offset: int = Query(0, ge=0, description="Number of comments to skip"),
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get comments for a specific post"""
    # Verify post exists and user has access
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
    
    # Get comments sorted by creation date (oldest first for better conversation flow)
    comments = await db.comments.find(
        {"post_id": post_id}
    ).sort("created_at", 1).skip(offset).limit(limit).to_list(limit)
    
    # Enrich comments with author info
    enriched_comments = []
    for comment in comments:
        enriched_comment = await get_comment_with_details(db, comment, current_user.id)
        enriched_comments.append(enriched_comment)
    
    return enriched_comments

@router.get("/{comment_id}", response_model=CommentResponse)
async def get_comment(
    comment_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get specific comment by ID"""
    comment = await db.comments.find_one({"id": comment_id})
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Verify post exists and user has access
    post = await db.posts.find_one({"id": comment["post_id"]})
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated post not found"
        )
    
    # Check access if it's a garage post
    if post["garage_id"]:
        garage = await db.garages.find_one({"id": post["garage_id"]})
        if garage and garage["is_private"] and current_user.id not in garage["members"]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to private garage post"
            )
    
    return await get_comment_with_details(db, comment, current_user.id)

@router.put("/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: str,
    comment_update: CommentUpdate,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update comment (author only)"""
    comment = await db.comments.find_one({"id": comment_id})
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Check if user is the author
    if comment["author_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the author can update this comment"
        )
    
    # Update comment
    update_data = comment_update.dict()
    update_data["updated_at"] = datetime.utcnow()
    
    await db.comments.update_one(
        {"id": comment_id},
        {"$set": update_data}
    )
    
    # Get updated comment
    updated_comment = await db.comments.find_one({"id": comment_id})
    return await get_comment_with_details(db, updated_comment, current_user.id)

@router.delete("/{comment_id}", response_model=dict)
async def delete_comment(
    comment_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete comment (author only)"""
    comment = await db.comments.find_one({"id": comment_id})
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Check if user is the author
    if comment["author_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the author can delete this comment"
        )
    
    # Delete comment
    await db.comments.delete_one({"id": comment_id})
    
    # Update post's comment count
    await db.posts.update_one(
        {"id": comment["post_id"]},
        {"$inc": {"comment_count": -1}}
    )
    
    return {"message": "Comment deleted successfully"}

@router.post("/{comment_id}/like", response_model=dict)
async def toggle_comment_like(
    comment_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Toggle like on a comment"""
    comment = await db.comments.find_one({"id": comment_id})
    if not comment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Comment not found"
        )
    
    # Verify post exists and user has access
    post = await db.posts.find_one({"id": comment["post_id"]})
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Associated post not found"
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
    current_likes = comment.get("likes", [])
    
    # Toggle like
    if user_id in current_likes:
        # Remove like
        new_likes = [uid for uid in current_likes if uid != user_id]
        action = "removed"
    else:
        # Add like
        new_likes = current_likes + [user_id]
        action = "added"
    
    # Update comment
    like_count = len(new_likes)
    await db.comments.update_one(
        {"id": comment_id},
        {
            "$set": {
                "likes": new_likes,
                "like_count": like_count
            }
        }
    )
    
    return {
        "message": f"Like {action}",
        "like_count": like_count,
        "user_liked": action == "added"
    }
from fastapi import APIRouter, HTTPException, status, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional, Dict, Any
import re

from models.user import UserInDB, UserSearchResult
from models.search import SearchQuery, SearchResult, SearchResponse, HashtagResult
from models.post import PostResponse
from auth import get_current_active_user
from database import get_database

router = APIRouter(prefix="/search", tags=["search"])

class SearchService:
    @staticmethod
    def create_search_regex(query: str) -> str:
        """Create regex pattern for search"""
        # Escape special regex characters and create case-insensitive pattern
        escaped_query = re.escape(query)
        return f".*{escaped_query}.*"

    @staticmethod
    async def search_users(
        db: AsyncIOMotorDatabase, 
        query: str, 
        current_user_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> List[UserSearchResult]:
        """Search for users by username, full name, or bio"""
        search_pattern = SearchService.create_search_regex(query)
        
        # Create search query
        search_filter = {
            "$and": [
                {
                    "$or": [
                        {"username": {"$regex": search_pattern, "$options": "i"}},
                        {"full_name": {"$regex": search_pattern, "$options": "i"}},
                        {"bio": {"$regex": search_pattern, "$options": "i"}}
                    ]
                },
                {"id": {"$ne": current_user_id}},  # Exclude current user
                {"is_active": True}
            ]
        }
        
        # Execute search
        users_cursor = db.users.find(search_filter).skip(offset).limit(limit)
        users = await users_cursor.to_list(length=limit)
        
        # Get current user's following list
        current_user = await db.users.find_one({"id": current_user_id})
        following_list = current_user.get("following", []) if current_user else []
        
        # Format results
        results = []
        for user in users:
            # Skip private users unless followed
            if user.get("is_private", False) and user["id"] not in following_list:
                continue
                
            results.append(UserSearchResult(
                id=user["id"],
                username=user["username"],
                full_name=user["full_name"],
                profile_image_url=user.get("profile_image_url"),
                bio=user.get("bio"),
                followers_count=user.get("followers_count", 0),
                is_following=user["id"] in following_list,
                is_private=user.get("is_private", False)
            ))
        
        return results

    @staticmethod
    async def search_posts(
        db: AsyncIOMotorDatabase,
        query: str,
        current_user_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Search for posts by content or hashtags"""
        search_pattern = SearchService.create_search_regex(query)
        
        # Get user's accessible garages
        current_user = await db.users.find_one({"id": current_user_id})
        user_garages = current_user.get("garages", []) if current_user else []
        
        # Create search filter
        search_filter = {
            "$and": [
                {
                    "$or": [
                        {"content": {"$regex": search_pattern, "$options": "i"}},
                        {"hashtags": {"$regex": search_pattern, "$options": "i"}}
                    ]
                },
                {
                    "$or": [
                        {"garage_id": None},  # Public posts
                        {"garage_id": {"$in": user_garages}}  # Posts from user's garages
                    ]
                }
            ]
        }
        
        # Execute search
        posts_cursor = db.posts.find(search_filter).sort("created_at", -1).skip(offset).limit(limit)
        posts = await posts_cursor.to_list(length=limit)
        
        # Enrich posts with author info
        enriched_posts = []
        for post in posts:
            author = await db.users.find_one({"id": post["author_id"]})
            garage_name = None
            
            if post.get("garage_id"):
                garage = await db.garages.find_one({"id": post["garage_id"]})
                garage_name = garage.get("name") if garage else None
            
            enriched_post = {
                **post,
                "author_username": author.get("username") if author else "Unknown",
                "author_full_name": author.get("full_name") if author else "Unknown",
                "garage_name": garage_name
            }
            enriched_posts.append(enriched_post)
        
        return enriched_posts

    @staticmethod
    async def search_garages(
        db: AsyncIOMotorDatabase,
        query: str,
        current_user_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Search for garages by name or description"""
        search_pattern = SearchService.create_search_regex(query)
        
        # Create search filter (only public garages or user's garages)
        search_filter = {
            "$and": [
                {
                    "$or": [
                        {"name": {"$regex": search_pattern, "$options": "i"}},
                        {"description": {"$regex": search_pattern, "$options": "i"}}
                    ]
                },
                {
                    "$or": [
                        {"is_private": False},  # Public garages
                        {"members": current_user_id}  # User's garages
                    ]
                }
            ]
        }
        
        # Execute search
        garages_cursor = db.garages.find(search_filter).skip(offset).limit(limit)
        garages = await garages_cursor.to_list(length=limit)
        
        # Enrich with owner info
        enriched_garages = []
        for garage in garages:
            owner = await db.users.find_one({"id": garage["owner_id"]})
            enriched_garage = {
                **garage,
                "owner_username": owner.get("username") if owner else "Unknown",
                "owner_full_name": owner.get("full_name") if owner else "Unknown"
            }
            enriched_garages.append(enriched_garage)
        
        return enriched_garages

    @staticmethod
    async def search_hashtags(
        db: AsyncIOMotorDatabase,
        query: str,
        current_user_id: str,
        limit: int = 20
    ) -> List[HashtagResult]:
        """Search for hashtags and return popular ones"""
        search_pattern = SearchService.create_search_regex(query)
        
        # Get user's accessible garages
        current_user = await db.users.find_one({"id": current_user_id})
        user_garages = current_user.get("garages", []) if current_user else []
        
        # Aggregate hashtags from accessible posts
        pipeline = [
            {
                "$match": {
                    "$and": [
                        {"hashtags": {"$regex": search_pattern, "$options": "i"}},
                        {
                            "$or": [
                                {"garage_id": None},
                                {"garage_id": {"$in": user_garages}}
                            ]
                        }
                    ]
                }
            },
            {"$unwind": "$hashtags"},
            {
                "$match": {
                    "hashtags": {"$regex": search_pattern, "$options": "i"}
                }
            },
            {
                "$group": {
                    "_id": {"$toLower": "$hashtags"},
                    "count": {"$sum": 1},
                    "recent_posts": {"$push": {"post_id": "$id", "created_at": "$created_at"}}
                }
            },
            {"$sort": {"count": -1}},
            {"$limit": limit}
        ]
        
        results = await db.posts.aggregate(pipeline).to_list(length=limit)
        
        hashtag_results = []
        for result in results:
            # Get recent posts for this hashtag
            recent_posts = sorted(result["recent_posts"], key=lambda x: x["created_at"], reverse=True)[:3]
            
            hashtag_results.append(HashtagResult(
                tag=result["_id"],
                post_count=result["count"],
                recent_posts=recent_posts
            ))
        
        return hashtag_results

@router.get("/", response_model=SearchResponse)
async def search_all(
    q: str = Query(..., min_length=1, max_length=100, description="Search query"),
    type: Optional[str] = Query(None, description="Search type: users, posts, garages, hashtags"),
    limit: int = Query(20, le=50, description="Number of results to return"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Universal search endpoint"""
    results = []
    total_results = 0
    
    if type == "users" or type is None:
        user_results = await SearchService.search_users(db, q, current_user.id, limit, offset)
        for user in user_results:
            results.append(SearchResult(
                type="user",
                id=user.id,
                title=user.full_name,
                subtitle=f"@{user.username}",
                image_url=user.profile_image_url,
                url=f"/users/{user.id}",
                metadata={
                    "followers_count": user.followers_count,
                    "is_following": user.is_following,
                    "is_private": user.is_private
                }
            ))
    
    if type == "posts" or type is None:
        post_results = await SearchService.search_posts(db, q, current_user.id, limit, offset)
        for post in post_results:
            # Truncate content for preview
            content_preview = post["content"][:100] + "..." if len(post["content"]) > 100 else post["content"]
            
            results.append(SearchResult(
                type="post",
                id=post["id"],
                title=content_preview,
                subtitle=f"by @{post['author_username']}",
                image_url=post.get("image_urls", [None])[0],
                url=f"/posts/{post['id']}",
                metadata={
                    "author_id": post["author_id"],
                    "garage_name": post.get("garage_name"),
                    "like_count": post.get("like_count", 0),
                    "created_at": post["created_at"]
                }
            ))
    
    if type == "garages" or type is None:
        garage_results = await SearchService.search_garages(db, q, current_user.id, limit, offset)
        for garage in garage_results:
            results.append(SearchResult(
                type="garage",
                id=garage["id"],
                title=garage["name"],
                subtitle=f"by @{garage['owner_username']}",
                image_url=garage.get("cover_image_url"),
                url=f"/garages/{garage['id']}",
                metadata={
                    "owner_id": garage["owner_id"],
                    "member_count": len(garage.get("members", [])),
                    "post_count": garage.get("post_count", 0),
                    "is_private": garage.get("is_private", False)
                }
            ))
    
    if type == "hashtags" or type is None:
        hashtag_results = await SearchService.search_hashtags(db, q, current_user.id, limit)
        for hashtag in hashtag_results:
            results.append(SearchResult(
                type="hashtag",
                id=hashtag.tag,
                title=f"#{hashtag.tag}",
                subtitle=f"{hashtag.post_count} posts",
                image_url=None,
                url=f"/hashtags/{hashtag.tag}",
                metadata={
                    "post_count": hashtag.post_count,
                    "recent_posts": hashtag.recent_posts
                }
            ))
    
    total_results = len(results)
    
    # Generate search suggestions based on query
    suggestions = await generate_search_suggestions(db, q, current_user.id)
    
    return SearchResponse(
        query=q,
        total_results=total_results,
        results=results[:limit],
        suggestions=suggestions
    )

@router.get("/users", response_model=List[UserSearchResult])
async def search_users(
    q: str = Query(..., min_length=1, max_length=100),
    limit: int = Query(20, le=50),
    offset: int = Query(0, ge=0),
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Search for users only"""
    return await SearchService.search_users(db, q, current_user.id, limit, offset)

@router.get("/hashtags", response_model=List[HashtagResult])
async def search_hashtags(
    q: str = Query(..., min_length=1, max_length=100),
    limit: int = Query(20, le=50),
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Search for hashtags"""
    return await SearchService.search_hashtags(db, q, current_user.id, limit)

@router.get("/trending", response_model=List[HashtagResult])
async def get_trending_hashtags(
    limit: int = Query(10, le=20),
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get trending hashtags based on recent activity"""
    # Get user's accessible garages
    user_garages = current_user.garages or []
    
    # Aggregate trending hashtags from last 7 days
    from datetime import datetime, timedelta
    week_ago = datetime.utcnow() - timedelta(days=7)
    
    pipeline = [
        {
            "$match": {
                "$and": [
                    {"created_at": {"$gte": week_ago}},
                    {"hashtags": {"$exists": True, "$ne": []}},
                    {
                        "$or": [
                            {"garage_id": None},
                            {"garage_id": {"$in": user_garages}}
                        ]
                    }
                ]
            }
        },
        {"$unwind": "$hashtags"},
        {
            "$group": {
                "_id": {"$toLower": "$hashtags"},
                "count": {"$sum": 1},
                "recent_posts": {"$push": {"post_id": "$id", "created_at": "$created_at"}}
            }
        },
        {"$sort": {"count": -1}},
        {"$limit": limit}
    ]
    
    results = await db.posts.aggregate(pipeline).to_list(length=limit)
    
    trending_hashtags = []
    for result in results:
        recent_posts = sorted(result["recent_posts"], key=lambda x: x["created_at"], reverse=True)[:3]
        
        trending_hashtags.append(HashtagResult(
            tag=result["_id"],
            post_count=result["count"],
            recent_posts=recent_posts
        ))
    
    return trending_hashtags

async def generate_search_suggestions(db: AsyncIOMotorDatabase, query: str, user_id: str) -> List[str]:
    """Generate search suggestions based on query"""
    suggestions = []
    
    # Get popular users with similar names
    user_suggestions = await db.users.find(
        {
            "$and": [
                {"username": {"$regex": f".*{query}.*", "$options": "i"}},
                {"id": {"$ne": user_id}},
                {"is_active": True}
            ]
        }
    ).limit(3).to_list(length=3)
    
    for user in user_suggestions:
        suggestions.append(f"@{user['username']}")
    
    # Get popular hashtags
    hashtag_suggestions = await db.posts.aggregate([
        {"$unwind": "$hashtags"},
        {
            "$match": {
                "hashtags": {"$regex": f".*{query}.*", "$options": "i"}
            }
        },
        {
            "$group": {
                "_id": {"$toLower": "$hashtags"},
                "count": {"$sum": 1}
            }
        },
        {"$sort": {"count": -1}},
        {"$limit": 3}
    ]).to_list(length=3)
    
    for hashtag in hashtag_suggestions:
        suggestions.append(f"#{hashtag['_id']}")
    
    return suggestions
from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
import json
from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel

# Import routes (fallback to mock if not available)
try:
    from routes.auth import router as auth_router
    from routes.garage import router as garage_router
    from routes.posts import router as posts_router
    from routes.comments import router as comments_router
    from routes.users import router as users_router
    from routes.social_auth import router as social_auth_router
    from routes.media import router as media_router
    from routes.search import router as search_router
    from routes.notifications import router as notifications_router
    from routes.saved_posts import router as saved_posts_router
    from routes.websocket import router as websocket_router
    from database import create_indexes
    ROUTES_AVAILABLE = True
except ImportError as e:
    print(f"Warning: Route modules not available, using mock endpoints: {e}")
    ROUTES_AVAILABLE = False

# Pydantic models
class User(BaseModel):
    id: str
    username: str
    email: str
    full_name: Optional[str] = None

class Post(BaseModel):
    id: str
    title: str
    content: str
    author_id: str
    author_name: str
    created_at: str
    garage_id: Optional[str] = None

class Garage(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    owner_id: str
    location: Optional[str] = None

# Mock database
MOCK_USERS = [
    {"id": "1", "username": "johnrider", "email": "john@example.com", "full_name": "John Rider"},
    {"id": "2", "username": "janesmith", "email": "jane@example.com", "full_name": "Jane Smith"}
]

MOCK_POSTS = [
    {
        "id": "1",
        "title": "My First Ride",
        "content": "Had an amazing ride today! The weather was perfect and the roads were clear.",
        "author_id": "1",
        "author_name": "John Rider",
        "created_at": "2024-01-15T10:00:00Z",
        "garage_id": "1"
    },
    {
        "id": "2",
        "title": "New Bike Day!",
        "content": "Just got my new motorcycle. Can't wait to take it on the road!",
        "author_id": "2",
        "author_name": "Jane Smith",
        "created_at": "2024-01-14T15:30:00Z",
        "garage_id": "2"
    }
]

MOCK_GARAGES = [
    {"id": "1", "name": "Downtown Motors", "description": "Professional motorcycle service", "owner_id": "1", "location": "Downtown"},
    {"id": "2", "name": "Highway Garage", "description": "Specialized in touring bikes", "owner_id": "2", "location": "Highway 101"}
]

# Create the main app
app = FastAPI(
    title="GreaseMonkey API",
    description="Social networking platform for motorcycle enthusiasts",
    version="1.0.0"
)

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Health check endpoint
@api_router.get("/")
async def root():
    return {"message": "GreaseMonkey API is running!"}

# Include all route modules
if ROUTES_AVAILABLE:
    api_router.include_router(auth_router)
    api_router.include_router(garage_router)
    api_router.include_router(posts_router)
    api_router.include_router(comments_router)
    api_router.include_router(users_router)
    api_router.include_router(social_auth_router)
    api_router.include_router(media_router)
    api_router.include_router(search_router)
    api_router.include_router(notifications_router)
    api_router.include_router(saved_posts_router)
else:
    # Add mock endpoints
    @api_router.get("/posts")
    async def get_posts():
        return {"posts": MOCK_POSTS, "total": len(MOCK_POSTS)}
    
    @api_router.get("/garages")
    async def get_garages():
        return {"garages": MOCK_GARAGES, "total": len(MOCK_GARAGES)}
    
    @api_router.get("/users/me")
    async def get_current_user():
        return MOCK_USERS[0]  # Return first user as current
    
    @api_router.get("/auth/me")
    async def get_current_user_auth():
        return MOCK_USERS[0]  # Return first user as current
    
    @api_router.post("/auth/login")
    async def login(credentials: dict):
        email = credentials.get('email')
        password = credentials.get('password')
        
        if not email:
            raise HTTPException(status_code=400, detail="Email is required")
        
        # Find user by email (mock authentication - accepts any password)
        user = None
        for mock_user in MOCK_USERS:
            if mock_user['email'] == email:
                user = mock_user
                break
        
        if not user:
            raise HTTPException(status_code=401, detail="Invalid email or password")
        
        return {
            "access_token": f"mock_token_{user['id']}",
            "token_type": "bearer",
            "user": user
        }
    
    @api_router.post("/auth/register")
    async def register(user_data: dict):
        # Check if email already exists
        email = user_data.get('email')
        for existing_user in MOCK_USERS:
            if existing_user['email'] == email:
                raise HTTPException(status_code=400, detail="Email already registered")
        
        new_user = {
            "id": str(len(MOCK_USERS) + 1),
            "username": user_data.get("username", "newuser"),
            "email": user_data.get("email", "new@example.com"),
            "full_name": user_data.get("full_name", "New User")
        }
        MOCK_USERS.append(new_user)
        
        return {
            "access_token": f"mock_token_{new_user['id']}",
            "token_type": "bearer",
            "user": new_user
        }
    
    @api_router.post("/auth/social-login")
    async def social_login(social_data: dict):
        provider = social_data.get('provider')
        credentials = social_data.get('credentials', {})
        
        # Mock social login - always succeeds
        social_user = {
            "id": "social_1",
            "username": f"{provider}_user",
            "email": f"social@{provider}.com",
            "full_name": f"Social {provider.title()} User"
        }
        
        return {
            "access_token": "mock_social_token_123",
            "token_type": "bearer",
            "user": social_user
        }

# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],  # In production, specify actual origins
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("startup")
async def startup_event():
    """Create database indexes on startup"""
    logger.info("Starting GreaseMonkey API...")
    if ROUTES_AVAILABLE:
        try:
            logger.info("Creating database indexes...")
            await create_indexes()
            logger.info("Database indexes created successfully!")
        except Exception as e:
            logger.warning(f"Database setup failed: {e}. Running with mock data.")
    else:
        logger.info("Running with mock data - no database connection needed")
    logger.info("GreaseMonkey API started successfully!")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("GreaseMonkey API shutting down...")

if __name__ == "__main__":
    import uvicorn
    logger.info("GreaseMonkey V2 Backend starting...")
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

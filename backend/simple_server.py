#!/usr/bin/env python3
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import uvicorn

# Create a simple FastAPI app for demo
app = FastAPI(
    title="GreaseMonkey API Demo",
    description="Demo version without MongoDB dependency",
    version="1.0.0-demo"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "GreaseMonkey API Demo is running!"}

@app.get("/api/")
async def api_root():
    return {"message": "GreaseMonkey API Demo is running!", "version": "1.0.0-demo"}

@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "service": "greasemonkey-api"}

# Mock data for demo
mock_users = [
    {
        "id": "1",
        "username": "johnrider",
        "email": "john@example.com",
        "full_name": "John Rider",
        "bio": "Love riding motorcycles!",
        "location": "California, USA",
        "created_at": "2024-01-01T10:00:00Z",
        "is_active": True,
        "friends": [],
        "garages": [],
        "ride_count": 5,
        "post_count": 12
    },
    {
        "id": "2",
        "username": "janesmith",
        "email": "jane@example.com",
        "full_name": "Jane Smith",
        "bio": "Adventure rider and photographer",
        "location": "Texas, USA",
        "created_at": "2024-01-02T15:30:00Z",
        "is_active": True,
        "friends": [],
        "garages": [],
        "ride_count": 8,
        "post_count": 6
    }
]

mock_posts = [
    {
        "id": "1",
        "title": "My First Ride",
        "content": "Had an amazing ride today!",
        "author": "John Rider",
        "created_at": "2024-01-15T10:00:00Z"
    },
    {
        "id": "2", 
        "title": "New Bike Day!",
        "content": "Just got my new motorcycle. Can't wait to take it on the road!",
        "author": "Jane Smith",
        "created_at": "2024-01-14T15:30:00Z"
    }
]

@app.get("/api/posts")
async def get_posts():
    return {"posts": mock_posts}

@app.get("/api/garages")
async def get_garages():
    return {
        "garages": [
            {"id": "1", "name": "Downtown Motors", "location": "Downtown"},
            {"id": "2", "name": "Highway Garage", "location": "Highway 101"}
        ]
    }

@app.post("/api/auth/register")
async def register(user_data: dict):
    # Basic validation
    required_fields = ['username', 'email', 'full_name', 'password']
    for field in required_fields:
        if not user_data.get(field):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"{field} is required"
            )
    
    # Check password length
    if len(user_data.get('password', '')) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 8 characters"
        )
    
    # Check if user already exists (mock check)
    for existing_user in mock_users:
        if existing_user['email'] == user_data.get('email'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        if existing_user['username'] == user_data.get('username'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already taken"
            )
    
    new_user = {
        "id": str(len(mock_users) + 1),
        "username": user_data.get("username"),
        "email": user_data.get("email"),
        "full_name": user_data.get("full_name"),
        "bio": user_data.get("bio", ""),
        "location": user_data.get("location", ""),
        "created_at": datetime.utcnow().isoformat() + "Z",
        "is_active": True,
        "friends": [],
        "garages": [],
        "ride_count": 0,
        "post_count": 0
    }
    
    # Add to mock users list
    mock_users.append(new_user)
    
    return {
        "access_token": f"mock_token_{new_user['id']}",
        "token_type": "bearer",
        "user": new_user
    }

@app.post("/api/auth/login")
async def login(credentials: dict):
    email = credentials.get('email')
    password = credentials.get('password')
    
    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email and password are required"
        )
    
    # Find user by email
    user = None
    for mock_user in mock_users:
        if mock_user['email'] == email:
            user = mock_user
            break
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    return {
        "access_token": f"mock_token_{user['id']}",
        "token_type": "bearer",
        "user": user
    }

@app.post("/api/auth/social-login")
async def social_login(login_data: dict):
    provider = login_data.get('provider')
    credentials = login_data.get('credentials')
    
    if not provider or not credentials:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provider and credentials are required"
        )
    
    # Mock social login logic
    social_email = None
    social_name = None
    social_id = None
    
    if provider == 'google':
        # In a real implementation, you would verify the Google JWT token
        # For demo, we'll extract info from mock credentials
        social_email = f"google_user_{datetime.now().timestamp()}@gmail.com"
        social_name = "Google User"
        social_id = f"google_{datetime.now().timestamp()}"
    elif provider == 'facebook':
        # In a real implementation, you would verify Facebook access token
        social_email = credentials.get('email', f"facebook_user_{datetime.now().timestamp()}@facebook.com")
        social_name = credentials.get('name', 'Facebook User')
        social_id = credentials.get('userID', f"facebook_{datetime.now().timestamp()}")
    elif provider == 'apple':
        # In a real implementation, you would verify Apple ID token
        social_email = f"apple_user_{datetime.now().timestamp()}@icloud.com"
        social_name = "Apple User"
        social_id = f"apple_{datetime.now().timestamp()}"
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported provider"
        )
    
    # Check if user exists by social ID or email
    existing_user = None
    for user in mock_users:
        if user.get('social_id') == social_id or user['email'] == social_email:
            existing_user = user
            break
    
    if existing_user:
        # User exists, log them in
        return {
            "access_token": f"mock_token_{existing_user['id']}",
            "token_type": "bearer",
            "user": existing_user
        }
    else:
        # Create new user from social login
        new_user = {
            "id": str(len(mock_users) + 1),
            "username": f"{provider}_user_{len(mock_users) + 1}",
            "email": social_email,
            "full_name": social_name,
            "bio": f"Joined via {provider.title()} Sign In",
            "location": "",
            "social_provider": provider,
            "social_id": social_id,
            "created_at": datetime.utcnow().isoformat() + "Z",
            "is_active": True,
            "friends": [],
            "garages": [],
            "ride_count": 0,
            "post_count": 0
        }
        
        # Add to mock users list
        mock_users.append(new_user)
        
        return {
            "access_token": f"mock_token_{new_user['id']}",
            "token_type": "bearer",
            "user": new_user
        }

@app.get("/api/auth/me")
async def get_current_user():
    # Return first user as current for demo
    return mock_users[0]

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
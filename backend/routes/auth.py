from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import timedelta
from ..models.user import UserCreate, UserResponse, LoginRequest, TokenResponse, UserInDB
from ..auth import AuthService, ACCESS_TOKEN_EXPIRE_MINUTES
from ..database import get_database

router = APIRouter(prefix="/auth", tags=["authentication"])

@router.post("/register", response_model=TokenResponse)
async def register_user(
    user_data: UserCreate,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Register a new user"""
    # Check if user already exists
    existing_user_email = await AuthService.get_user_by_email(db, user_data.email)
    if existing_user_email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    existing_user_username = await AuthService.get_user_by_username(db, user_data.username)
    if existing_user_username:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken"
        )
    
    # Create new user
    hashed_password = AuthService.get_password_hash(user_data.password)
    user_dict = user_data.dict()
    del user_dict["password"]
    
    new_user = UserInDB(**user_dict, hashed_password=hashed_password)
    
    # Save to database
    await db.users.insert_one(new_user.dict())
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = AuthService.create_access_token(
        data={"sub": new_user.email}, expires_delta=access_token_expires
    )
    
    # Return token and user data
    user_response = UserResponse(**new_user.dict())
    return TokenResponse(
        access_token=access_token,
        user=user_response
    )

@router.post("/login", response_model=TokenResponse)
async def login_user(
    login_data: LoginRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Login user with email and password"""
    user = await AuthService.authenticate_user(db, login_data.email, login_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = AuthService.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    # Return token and user data
    user_response = UserResponse(**user.dict())
    return TokenResponse(
        access_token=access_token,
        user=user_response
    )

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(
    current_user: UserInDB = Depends(AuthService.get_current_active_user)
):
    """Get current user information"""
    return UserResponse(**current_user.dict())
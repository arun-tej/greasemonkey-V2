from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional, Dict, Any
from datetime import timedelta
import requests
import os
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
import jwt

from models.user import (
    SocialLoginRequest, TokenResponse, UserResponse, 
    UserInDB, SocialLoginInfo, UserCreate
)
from auth import AuthService, ACCESS_TOKEN_EXPIRE_MINUTES
from database import get_database

router = APIRouter(prefix="/auth/social", tags=["social-authentication"])

class SocialAuthService:
    @staticmethod
    async def verify_google_token(token: str) -> Optional[Dict[str, Any]]:
        """Verify Google OAuth token and return user info"""
        try:
            client_id = os.getenv("GOOGLE_CLIENT_ID")
            if not client_id:
                raise ValueError("Google Client ID not configured")
            
            # Verify the token
            idinfo = id_token.verify_oauth2_token(
                token, google_requests.Request(), client_id
            )
            
            # Check if token is valid
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')
            
            return {
                'provider_id': idinfo['sub'],
                'email': idinfo['email'],
                'verified': idinfo.get('email_verified', False),
                'name': idinfo.get('name', ''),
                'picture': idinfo.get('picture', ''),
                'given_name': idinfo.get('given_name', ''),
                'family_name': idinfo.get('family_name', '')
            }
        except Exception as e:
            print(f"Google token verification failed: {e}")
            return None

    @staticmethod
    async def verify_facebook_token(token: str) -> Optional[Dict[str, Any]]:
        """Verify Facebook OAuth token and return user info"""
        try:
            app_id = os.getenv("FACEBOOK_APP_ID")
            app_secret = os.getenv("FACEBOOK_APP_SECRET")
            
            if not app_id or not app_secret:
                raise ValueError("Facebook credentials not configured")
            
            # Verify token with Facebook
            verify_url = f"https://graph.facebook.com/debug_token"
            verify_params = {
                'input_token': token,
                'access_token': f"{app_id}|{app_secret}"
            }
            
            verify_response = requests.get(verify_url, params=verify_params)
            verify_data = verify_response.json()
            
            if not verify_data.get('data', {}).get('is_valid'):
                return None
            
            # Get user info
            user_url = f"https://graph.facebook.com/me"
            user_params = {
                'access_token': token,
                'fields': 'id,name,email,picture,first_name,last_name'
            }
            
            user_response = requests.get(user_url, params=user_params)
            user_data = user_response.json()
            
            if 'error' in user_data:
                return None
                
            return {
                'provider_id': user_data['id'],
                'email': user_data.get('email', ''),
                'verified': True,  # Facebook emails are typically verified
                'name': user_data.get('name', ''),
                'picture': user_data.get('picture', {}).get('data', {}).get('url', ''),
                'given_name': user_data.get('first_name', ''),
                'family_name': user_data.get('last_name', '')
            }
        except Exception as e:
            print(f"Facebook token verification failed: {e}")
            return None

    @staticmethod
    async def verify_apple_token(token: str) -> Optional[Dict[str, Any]]:
        """Verify Apple OAuth token and return user info"""
        try:
            # Apple JWT token verification is more complex
            # For now, we'll implement a basic version
            # In production, you'd need to fetch Apple's public keys and verify properly
            
            # Decode without verification for demo (NOT SECURE)
            decoded = jwt.decode(token, options={"verify_signature": False})
            
            return {
                'provider_id': decoded.get('sub'),
                'email': decoded.get('email', ''),
                'verified': decoded.get('email_verified', False),
                'name': decoded.get('name', ''),
                'picture': '',
                'given_name': decoded.get('given_name', ''),
                'family_name': decoded.get('family_name', '')
            }
        except Exception as e:
            print(f"Apple token verification failed: {e}")
            return None

@router.post("/google", response_model=TokenResponse)
async def google_login(
    auth_data: SocialLoginRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Login/Register with Google"""
    # Verify Google token
    user_info = await SocialAuthService.verify_google_token(auth_data.access_token)
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token"
        )
    
    email = user_info['email']
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email not provided by Google"
        )
    
    # Check if user exists
    existing_user = await AuthService.get_user_by_email(db, email)
    
    if existing_user:
        # Update social login info if not already present
        social_login_exists = any(
            sl.provider == "google" and sl.provider_id == user_info['provider_id']
            for sl in existing_user.social_logins
        )
        
        if not social_login_exists:
            social_login = SocialLoginInfo(
                provider="google",
                provider_id=user_info['provider_id'],
                email=email,
                verified=user_info['verified']
            )
            await db.users.update_one(
                {"id": existing_user.id},
                {"$push": {"social_logins": social_login.dict()}}
            )
        
        user = existing_user
    else:
        # Create new user
        username = email.split('@')[0]
        # Ensure username is unique
        counter = 1
        original_username = username
        while await AuthService.get_user_by_username(db, username):
            username = f"{original_username}{counter}"
            counter += 1
        
        new_user_data = UserCreate(
            username=username,
            email=email,
            full_name=user_info.get('name', ''),
            password="dummy_password"  # Will be ignored since hashed_password is optional
        )
        
        user_dict = new_user_data.dict()
        del user_dict["password"]  # Remove password since it's social login
        
        # Add social login info
        social_login = SocialLoginInfo(
            provider="google",
            provider_id=user_info['provider_id'],
            email=email,
            verified=user_info['verified']
        )
        
        new_user = UserInDB(
            **user_dict,
            profile_image_url=user_info.get('picture', ''),
            is_verified=user_info['verified'],
            social_logins=[social_login]
        )
        
        # Save to database
        await db.users.insert_one(new_user.dict())
        user = new_user
    
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

@router.post("/facebook", response_model=TokenResponse)
async def facebook_login(
    auth_data: SocialLoginRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Login/Register with Facebook"""
    # Verify Facebook token
    user_info = await SocialAuthService.verify_facebook_token(auth_data.access_token)
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Facebook token"
        )
    
    email = user_info['email']
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email not provided by Facebook"
        )
    
    # Check if user exists
    existing_user = await AuthService.get_user_by_email(db, email)
    
    if existing_user:
        # Update social login info if not already present
        social_login_exists = any(
            sl.provider == "facebook" and sl.provider_id == user_info['provider_id']
            for sl in existing_user.social_logins
        )
        
        if not social_login_exists:
            social_login = SocialLoginInfo(
                provider="facebook",
                provider_id=user_info['provider_id'],
                email=email,
                verified=user_info['verified']
            )
            await db.users.update_one(
                {"id": existing_user.id},
                {"$push": {"social_logins": social_login.dict()}}
            )
        
        user = existing_user
    else:
        # Create new user (similar to Google flow)
        username = email.split('@')[0]
        counter = 1
        original_username = username
        while await AuthService.get_user_by_username(db, username):
            username = f"{original_username}{counter}"
            counter += 1
        
        new_user_data = UserCreate(
            username=username,
            email=email,
            full_name=user_info.get('name', ''),
            password="dummy_password"
        )
        
        user_dict = new_user_data.dict()
        del user_dict["password"]
        
        social_login = SocialLoginInfo(
            provider="facebook",
            provider_id=user_info['provider_id'],
            email=email,
            verified=user_info['verified']
        )
        
        new_user = UserInDB(
            **user_dict,
            profile_image_url=user_info.get('picture', ''),
            is_verified=user_info['verified'],
            social_logins=[social_login]
        )
        
        await db.users.insert_one(new_user.dict())
        user = new_user
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = AuthService.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    user_response = UserResponse(**user.dict())
    return TokenResponse(
        access_token=access_token,
        user=user_response
    )

@router.post("/apple", response_model=TokenResponse)
async def apple_login(
    auth_data: SocialLoginRequest,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Login/Register with Apple"""
    # Verify Apple token
    user_info = await SocialAuthService.verify_apple_token(auth_data.access_token)
    if not user_info:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Apple token"
        )
    
    email = user_info['email']
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email not provided by Apple"
        )
    
    # Check if user exists
    existing_user = await AuthService.get_user_by_email(db, email)
    
    if existing_user:
        # Update social login info if not already present
        social_login_exists = any(
            sl.provider == "apple" and sl.provider_id == user_info['provider_id']
            for sl in existing_user.social_logins
        )
        
        if not social_login_exists:
            social_login = SocialLoginInfo(
                provider="apple",
                provider_id=user_info['provider_id'],
                email=email,
                verified=user_info['verified']
            )
            await db.users.update_one(
                {"id": existing_user.id},
                {"$push": {"social_logins": social_login.dict()}}
            )
        
        user = existing_user
    else:
        # Create new user (similar to other providers)
        username = email.split('@')[0]
        counter = 1
        original_username = username
        while await AuthService.get_user_by_username(db, username):
            username = f"{original_username}{counter}"
            counter += 1
        
        new_user_data = UserCreate(
            username=username,
            email=email,
            full_name=user_info.get('name', ''),
            password="dummy_password"
        )
        
        user_dict = new_user_data.dict()
        del user_dict["password"]
        
        social_login = SocialLoginInfo(
            provider="apple",
            provider_id=user_info['provider_id'],
            email=email,
            verified=user_info['verified']
        )
        
        new_user = UserInDB(
            **user_dict,
            profile_image_url=user_info.get('picture', ''),
            is_verified=user_info['verified'],
            social_logins=[social_login]
        )
        
        await db.users.insert_one(new_user.dict())
        user = new_user
    
    # Create access token
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = AuthService.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    user_response = UserResponse(**user.dict())
    return TokenResponse(
        access_token=access_token,
        user=user_response
    )
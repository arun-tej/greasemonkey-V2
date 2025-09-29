from fastapi import APIRouter, HTTPException, status, Depends, UploadFile, File, Form
from fastapi.responses import FileResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List, Optional
import os
import uuid
import aiofiles
from pathlib import Path
import magic
from PIL import Image
import io

from models.user import UserInDB
from models.search import MediaUpload, MediaUploadResponse
from auth import get_current_active_user
from database import get_database

router = APIRouter(prefix="/media", tags=["media"])

# Configuration
UPLOAD_FOLDER = os.getenv("UPLOAD_FOLDER", "./uploads")
STATIC_URL_PREFIX = os.getenv("STATIC_URL_PREFIX", "/static")
MAX_FILE_SIZE = int(os.getenv("UPLOAD_MAX_SIZE", 10485760))  # 10MB default
ALLOWED_TYPES = os.getenv("ALLOWED_IMAGE_TYPES", "image/jpeg,image/png,image/webp,image/gif").split(",")

# Ensure upload directory exists
Path(UPLOAD_FOLDER).mkdir(parents=True, exist_ok=True)
Path(f"{UPLOAD_FOLDER}/profiles").mkdir(parents=True, exist_ok=True)
Path(f"{UPLOAD_FOLDER}/posts").mkdir(parents=True, exist_ok=True)
Path(f"{UPLOAD_FOLDER}/garages").mkdir(parents=True, exist_ok=True)

class MediaService:
    @staticmethod
    def validate_image(file_content: bytes, content_type: str) -> bool:
        """Validate if file is a valid image"""
        try:
            # Check content type
            if content_type not in ALLOWED_TYPES:
                return False
            
            # Try to open with PIL to verify it's a valid image
            Image.open(io.BytesIO(file_content))
            return True
        except Exception:
            return False

    @staticmethod
    def get_image_dimensions(file_content: bytes) -> tuple:
        """Get image width and height"""
        try:
            with Image.open(io.BytesIO(file_content)) as img:
                return img.size
        except Exception:
            return (0, 0)

    @staticmethod
    async def save_file(file_content: bytes, filename: str, subfolder: str = "") -> str:
        """Save file to disk and return the file path"""
        # Generate unique filename
        file_extension = filename.split('.')[-1] if '.' in filename else ''
        unique_filename = f"{uuid.uuid4()}.{file_extension}"
        
        # Create full path
        if subfolder:
            full_folder = f"{UPLOAD_FOLDER}/{subfolder}"
            Path(full_folder).mkdir(parents=True, exist_ok=True)
            file_path = f"{full_folder}/{unique_filename}"
            url_path = f"{STATIC_URL_PREFIX}/{subfolder}/{unique_filename}"
        else:
            file_path = f"{UPLOAD_FOLDER}/{unique_filename}"
            url_path = f"{STATIC_URL_PREFIX}/{unique_filename}"
        
        # Save file
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(file_content)
        
        return url_path

    @staticmethod
    def resize_image(file_content: bytes, max_width: int = 1920, max_height: int = 1080) -> bytes:
        """Resize image if it's too large"""
        try:
            with Image.open(io.BytesIO(file_content)) as img:
                # Convert to RGB if necessary
                if img.mode in ('RGBA', 'LA', 'P'):
                    img = img.convert('RGB')
                
                # Resize if needed
                img.thumbnail((max_width, max_height), Image.Resampling.LANCZOS)
                
                # Save to bytes
                output = io.BytesIO()
                img.save(output, format='JPEG', quality=85, optimize=True)
                return output.getvalue()
        except Exception:
            return file_content

@router.post("/upload/profile", response_model=MediaUploadResponse)
async def upload_profile_image(
    file: UploadFile = File(...),
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Upload profile image"""
    # Check file size
    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size too large. Maximum size is {MAX_FILE_SIZE} bytes"
        )
    
    # Validate image
    if not MediaService.validate_image(file_content, file.content_type):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image file. Allowed types: " + ", ".join(ALLOWED_TYPES)
        )
    
    # Resize image for profile (500x500 max)
    resized_content = MediaService.resize_image(file_content, 500, 500)
    width, height = MediaService.get_image_dimensions(resized_content)
    
    # Save file
    file_url = await MediaService.save_file(resized_content, file.filename, "profiles")
    
    # Create media record
    media = MediaUpload(
        filename=file.filename,
        content_type=file.content_type,
        size=len(resized_content),
        url=file_url,
        uploaded_by=current_user.id,
        width=width,
        height=height,
        alt_text=f"Profile image for {current_user.username}"
    )
    
    # Save to database
    await db.media.insert_one(media.dict())
    
    # Update user's profile image
    await db.users.update_one(
        {"id": current_user.id},
        {"$set": {"profile_image_url": file_url}}
    )
    
    return MediaUploadResponse(**media.dict())

@router.post("/upload/post", response_model=List[MediaUploadResponse])
async def upload_post_images(
    files: List[UploadFile] = File(...),
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Upload images for posts (multiple files supported)"""
    if len(files) > 10:  # Limit to 10 images per post
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 10 images allowed per post"
        )
    
    uploaded_media = []
    
    for file in files:
        # Check file size
        file_content = await file.read()
        if len(file_content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                detail=f"File {file.filename} is too large. Maximum size is {MAX_FILE_SIZE} bytes"
            )
        
        # Validate image
        if not MediaService.validate_image(file_content, file.content_type):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid image file: {file.filename}. Allowed types: " + ", ".join(ALLOWED_TYPES)
            )
        
        # Resize image for posts (1920x1080 max)
        resized_content = MediaService.resize_image(file_content, 1920, 1080)
        width, height = MediaService.get_image_dimensions(resized_content)
        
        # Save file
        file_url = await MediaService.save_file(resized_content, file.filename, "posts")
        
        # Create media record
        media = MediaUpload(
            filename=file.filename,
            content_type=file.content_type,
            size=len(resized_content),
            url=file_url,
            uploaded_by=current_user.id,
            width=width,
            height=height
        )
        
        # Save to database
        await db.media.insert_one(media.dict())
        uploaded_media.append(MediaUploadResponse(**media.dict()))
    
    return uploaded_media

@router.post("/upload/garage", response_model=MediaUploadResponse)
async def upload_garage_image(
    file: UploadFile = File(...),
    garage_id: str = Form(...),
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Upload garage cover image"""
    # Check if user owns the garage
    garage = await db.garages.find_one({"id": garage_id})
    if not garage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Garage not found"
        )
    
    if garage["owner_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only garage owner can upload cover image"
        )
    
    # Check file size
    file_content = await file.read()
    if len(file_content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size too large. Maximum size is {MAX_FILE_SIZE} bytes"
        )
    
    # Validate image
    if not MediaService.validate_image(file_content, file.content_type):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid image file. Allowed types: " + ", ".join(ALLOWED_TYPES)
        )
    
    # Resize image for garage cover (1920x600 max)
    resized_content = MediaService.resize_image(file_content, 1920, 600)
    width, height = MediaService.get_image_dimensions(resized_content)
    
    # Save file
    file_url = await MediaService.save_file(resized_content, file.filename, "garages")
    
    # Create media record
    media = MediaUpload(
        filename=file.filename,
        content_type=file.content_type,
        size=len(resized_content),
        url=file_url,
        uploaded_by=current_user.id,
        width=width,
        height=height,
        alt_text=f"Cover image for {garage['name']}"
    )
    
    # Save to database
    await db.media.insert_one(media.dict())
    
    # Update garage's cover image
    await db.garages.update_one(
        {"id": garage_id},
        {"$set": {"cover_image_url": file_url}}
    )
    
    return MediaUploadResponse(**media.dict())

@router.get("/files/{subfolder}/{filename}")
async def serve_media_file(subfolder: str, filename: str):
    """Serve uploaded media files"""
    file_path = f"{UPLOAD_FOLDER}/{subfolder}/{filename}"
    
    if not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    return FileResponse(file_path)

@router.delete("/media/{media_id}", response_model=dict)
async def delete_media(
    media_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Delete uploaded media"""
    media = await db.media.find_one({"id": media_id})
    if not media:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Media not found"
        )
    
    # Check if user owns the media
    if media["uploaded_by"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own media"
        )
    
    # Delete file from disk
    try:
        # Extract file path from URL
        url_parts = media["url"].split("/")
        if len(url_parts) >= 2:
            file_path = f"{UPLOAD_FOLDER}/{'/'.join(url_parts[-2:])}"
            if os.path.exists(file_path):
                os.remove(file_path)
    except Exception as e:
        print(f"Error deleting file: {e}")
    
    # Delete from database
    await db.media.delete_one({"id": media_id})
    
    return {"message": "Media deleted successfully"}

@router.get("/media/user/{user_id}", response_model=List[MediaUploadResponse])
async def get_user_media(
    user_id: str,
    limit: int = 20,
    offset: int = 0,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get media uploaded by a specific user"""
    # Check if user can view this media (privacy check can be added here)
    media_cursor = db.media.find(
        {"uploaded_by": user_id, "is_public": True}
    ).sort("created_at", -1).skip(offset).limit(limit)
    
    media_list = await media_cursor.to_list(length=limit)
    
    return [MediaUploadResponse(**media) for media in media_list]
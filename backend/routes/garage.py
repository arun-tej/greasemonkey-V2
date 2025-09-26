from fastapi import APIRouter, HTTPException, status, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import List
from datetime import datetime
from models.garage import GarageCreate, GarageUpdate, GarageResponse, JoinGarageRequest, Garage
from models.user import UserInDB
from auth import get_current_active_user
from database import get_database

router = APIRouter(prefix="/garages", tags=["garages"])

@router.post("/", response_model=GarageResponse)
async def create_garage(
    garage_data: GarageCreate,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Create a new garage"""
    # Check if garage name already exists
    existing_garage = await db.garages.find_one({"name": garage_data.name})
    if existing_garage:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Garage name already exists"
        )
    
    # Create new garage
    garage_dict = garage_data.dict()
    new_garage = Garage(
        **garage_dict,
        owner_id=current_user.id,
        members=[current_user.id],
        admins=[current_user.id],
        member_count=1
    )
    
    # Save to database
    await db.garages.insert_one(new_garage.dict())
    
    # Update user's garage list
    await db.users.update_one(
        {"id": current_user.id},
        {"$addToSet": {"garages": new_garage.id}}
    )
    
    return GarageResponse(**new_garage.dict())

@router.get("/", response_model=List[GarageResponse])
async def get_user_garages(
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get garages user belongs to"""
    garages = await db.garages.find(
        {"members": current_user.id}
    ).to_list(100)
    
    return [GarageResponse(**garage) for garage in garages]

@router.get("/discover", response_model=List[GarageResponse])
async def discover_garages(
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Discover public garages to join"""
    garages = await db.garages.find({
        "is_private": False,
        "members": {"$ne": current_user.id}
    }).limit(20).to_list(20)
    
    return [GarageResponse(**garage) for garage in garages]

@router.get("/{garage_id}", response_model=GarageResponse)
async def get_garage(
    garage_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get garage details"""
    garage = await db.garages.find_one({"id": garage_id})
    if not garage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Garage not found"
        )
    
    # Check if user has access (member or public garage)
    if garage["is_private"] and current_user.id not in garage["members"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to private garage"
        )
    
    return GarageResponse(**garage)

@router.post("/{garage_id}/join", response_model=dict)
async def join_garage(
    garage_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Join a garage"""
    garage = await db.garages.find_one({"id": garage_id})
    if not garage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Garage not found"
        )
    
    # Check if already a member
    if current_user.id in garage["members"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Already a member of this garage"
        )
    
    # Check if private garage (for now, auto-approve public garages)
    if garage["is_private"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot join private garage without invitation"
        )
    
    # Add user to garage
    await db.garages.update_one(
        {"id": garage_id},
        {
            "$addToSet": {"members": current_user.id},
            "$inc": {"member_count": 1}
        }
    )
    
    # Add garage to user's list
    await db.users.update_one(
        {"id": current_user.id},
        {"$addToSet": {"garages": garage_id}}
    )
    
    return {"message": "Successfully joined garage"}

@router.delete("/{garage_id}/leave", response_model=dict)
async def leave_garage(
    garage_id: str,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Leave a garage"""
    garage = await db.garages.find_one({"id": garage_id})
    if not garage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Garage not found"
        )
    
    # Check if user is a member
    if current_user.id not in garage["members"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Not a member of this garage"
        )
    
    # Owner cannot leave their own garage
    if garage["owner_id"] == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Owner cannot leave garage. Transfer ownership first."
        )
    
    # Remove user from garage
    await db.garages.update_one(
        {"id": garage_id},
        {
            "$pull": {"members": current_user.id, "admins": current_user.id},
            "$inc": {"member_count": -1}
        }
    )
    
    # Remove garage from user's list
    await db.users.update_one(
        {"id": current_user.id},
        {"$pull": {"garages": garage_id}}
    )
    
    return {"message": "Successfully left garage"}

@router.put("/{garage_id}", response_model=GarageResponse)
async def update_garage(
    garage_id: str,
    garage_update: GarageUpdate,
    current_user: UserInDB = Depends(get_current_active_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Update garage details (admin only)"""
    garage = await db.garages.find_one({"id": garage_id})
    if not garage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Garage not found"
        )
    
    # Check if user is admin or owner
    if current_user.id not in garage["admins"] and garage["owner_id"] != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update garage details"
        )
    
    # Update garage
    update_data = {k: v for k, v in garage_update.dict().items() if v is not None}
    if update_data:
        update_data["updated_at"] = datetime.utcnow()
        await db.garages.update_one(
            {"id": garage_id},
            {"$set": update_data}
        )
    
    # Get updated garage
    updated_garage = await db.garages.find_one({"id": garage_id})
    return GarageResponse(**updated_garage)
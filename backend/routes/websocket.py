from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Dict, List, Set
import json
import logging
from datetime import datetime

from models.user import UserInDB
from auth import get_current_active_user
from database import get_database

# Set up logging
logger = logging.getLogger(__name__)

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        # Store active connections: {user_id: {websocket1, websocket2, ...}}
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # Store user presence: {user_id: last_seen}
        self.user_presence: Dict[str, datetime] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        """Accept a WebSocket connection and add to active connections"""
        await websocket.accept()
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        
        self.active_connections[user_id].add(websocket)
        self.user_presence[user_id] = datetime.utcnow()
        
        logger.info(f"User {user_id} connected via WebSocket")
        
        # Notify other users that this user is online
        await self.broadcast_user_status(user_id, "online")

    async def disconnect(self, websocket: WebSocket, user_id: str):
        """Remove WebSocket connection"""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            
            # If no more connections for this user, mark as offline
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                if user_id in self.user_presence:
                    del self.user_presence[user_id]
                
                logger.info(f"User {user_id} disconnected from WebSocket")
                
                # Notify other users that this user is offline
                await self.broadcast_user_status(user_id, "offline")

    async def send_personal_message(self, message: dict, user_id: str):
        """Send message to a specific user (all their connections)"""
        if user_id in self.active_connections:
            disconnected_websockets = []
            
            for websocket in self.active_connections[user_id].copy():
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception as e:
                    logger.error(f"Error sending message to {user_id}: {e}")
                    disconnected_websockets.append(websocket)
            
            # Clean up disconnected websockets
            for ws in disconnected_websockets:
                self.active_connections[user_id].discard(ws)

    async def broadcast_to_followers(self, message: dict, user_id: str, db: AsyncIOMotorDatabase):
        """Broadcast message to all followers of a user"""
        user = await db.users.find_one({"id": user_id})
        if user and "followers" in user:
            for follower_id in user["followers"]:
                await self.send_personal_message(message, follower_id)

    async def broadcast_user_status(self, user_id: str, status: str):
        """Broadcast user online/offline status to relevant users"""
        message = {
            "type": "user_status",
            "data": {
                "user_id": user_id,
                "status": status,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
        # For now, broadcast to all connected users
        # In production, you'd want to broadcast only to friends/followers
        for user_connections in self.active_connections.values():
            for websocket in user_connections.copy():
                try:
                    await websocket.send_text(json.dumps(message))
                except Exception:
                    pass  # Handle disconnected websockets

    def get_online_users(self) -> List[str]:
        """Get list of currently online user IDs"""
        return list(self.active_connections.keys())

    def is_user_online(self, user_id: str) -> bool:
        """Check if a user is currently online"""
        return user_id in self.active_connections

# Global connection manager instance
manager = ConnectionManager()

router = APIRouter(prefix="/ws", tags=["websocket"])

@router.websocket("/connect")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str,
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Main WebSocket endpoint for real-time communication"""
    # Authenticate user from token
    try:
        from jose import jwt, JWTError
        from auth import SECRET_KEY, ALGORITHM, AuthService
        
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            await websocket.close(code=4001, reason="Invalid token")
            return
        
        user = await AuthService.get_user_by_email(db, email)
        if user is None:
            await websocket.close(code=4001, reason="User not found")
            return
        
        user_id = user.id
        
    except JWTError:
        await websocket.close(code=4001, reason="Token validation failed")
        return
    
    # Connect user
    await manager.connect(websocket, user_id)
    
    try:
        # Send initial connection confirmation
        await websocket.send_text(json.dumps({
            "type": "connection_established",
            "data": {
                "user_id": user_id,
                "timestamp": datetime.utcnow().isoformat()
            }
        }))
        
        # Listen for messages
        while True:
            data = await websocket.receive_text()
            
            try:
                message = json.loads(data)
                await handle_websocket_message(message, user_id, db)
            except json.JSONDecodeError:
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "data": {"message": "Invalid JSON format"}
                }))
            except Exception as e:
                logger.error(f"Error handling WebSocket message: {e}")
                await websocket.send_text(json.dumps({
                    "type": "error",
                    "data": {"message": "Internal server error"}
                }))
                
    except WebSocketDisconnect:
        await manager.disconnect(websocket, user_id)

async def handle_websocket_message(message: dict, user_id: str, db: AsyncIOMotorDatabase):
    """Handle incoming WebSocket messages"""
    message_type = message.get("type")
    data = message.get("data", {})
    
    if message_type == "ping":
        # Respond to ping with pong
        await manager.send_personal_message({
            "type": "pong",
            "data": {"timestamp": datetime.utcnow().isoformat()}
        }, user_id)

# Real-time notification functions
async def send_real_time_notification(
    user_id: str,
    notification_type: str,
    title: str,
    message: str,
    data: dict = None
):
    """Send real-time notification via WebSocket"""
    notification_message = {
        "type": "notification",
        "data": {
            "notification_type": notification_type,
            "title": title,
            "message": message,
            "data": data or {},
            "timestamp": datetime.utcnow().isoformat()
        }
    }
    
    await manager.send_personal_message(notification_message, user_id)

# REST endpoints for WebSocket management
@router.get("/online-users")
async def get_online_users(
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Get list of online users"""
    online_users = manager.get_online_users()
    return {"online_users": online_users, "count": len(online_users)}

@router.get("/user-status/{user_id}")
async def check_user_status(
    user_id: str,
    current_user: UserInDB = Depends(get_current_active_user)
):
    """Check if a specific user is online"""
    is_online = manager.is_user_online(user_id)
    last_seen = manager.user_presence.get(user_id)
    
    return {
        "user_id": user_id,
        "is_online": is_online,
        "last_seen": last_seen.isoformat() if last_seen else None
    }
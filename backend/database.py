from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import os

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

async def get_database() -> AsyncIOMotorDatabase:
    """Get database instance"""
    return db

async def create_indexes():
    """Create database indexes for optimal performance"""
    # User indexes
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)
    await db.users.create_index("id", unique=True)
    
    # Garage indexes
    await db.garages.create_index("id", unique=True)
    await db.garages.create_index("name")
    await db.garages.create_index("owner_id")
    
    # Post indexes
    await db.posts.create_index("id", unique=True)
    await db.posts.create_index("author_id")
    await db.posts.create_index("garage_id")
    await db.posts.create_index("created_at")
    await db.posts.create_index([("created_at", -1)])  # Descending for latest first
    
    # Comment indexes
    await db.comments.create_index("id", unique=True)
    await db.comments.create_index("post_id")
    await db.comments.create_index("author_id")
    await db.comments.create_index("created_at")
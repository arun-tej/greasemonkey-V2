from fastapi import FastAPI, APIRouter
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path

# Import routes
from routes.auth import router as auth_router
from routes.garage import router as garage_router
from database import create_indexes

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

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
api_router.include_router(auth_router)
api_router.include_router(garage_router)

# Include the router in the main app
app.include_router(api_router)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
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
    logger.info("Creating database indexes...")
    await create_indexes()
    logger.info("GreaseMonkey API started successfully!")

@app.on_event("shutdown")
async def shutdown_event():
    logger.info("GreaseMonkey API shutting down...")

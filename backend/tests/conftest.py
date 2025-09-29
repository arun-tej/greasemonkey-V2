"""
Comprehensive test configuration and fixtures for GreaseMonkey API tests
"""

import pytest
import pytest_asyncio
from httpx import AsyncClient
from motor.motor_asyncio import AsyncIOMotorClient
import os
from typing import AsyncGenerator, Generator
import asyncio

# Test configuration
TEST_DATABASE_URL = os.getenv("TEST_MONGO_URL", "mongodb://localhost:27017")
TEST_DATABASE_NAME = "greasemonkey_test"

@pytest.fixture(scope="session")
def event_loop() -> Generator:
    """Create an instance of the default event loop for the test session."""
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

@pytest_asyncio.fixture
async def test_db():
    """Create test database connection"""
    client = AsyncIOMotorClient(TEST_DATABASE_URL)
    db = client[TEST_DATABASE_NAME]
    
    # Clean database before tests
    collection_names = await db.list_collection_names()
    for collection_name in collection_names:
        await db[collection_name].drop()
    
    yield db
    
    # Clean database after tests
    collection_names = await db.list_collection_names()
    for collection_name in collection_names:
        await db[collection_name].drop()
    
    client.close()

@pytest_asyncio.fixture
async def test_client(test_db) -> AsyncGenerator[AsyncClient, None]:
    """Create test client with test database"""
    from server import app
    from database import get_database
    
    # Override database dependency
    app.dependency_overrides[get_database] = lambda: test_db
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client
    
    # Clean up overrides
    app.dependency_overrides.clear()

@pytest_asyncio.fixture
async def test_user(test_db):
    """Create a test user"""
    from models.user import UserInDB
    from auth import AuthService
    
    user_data = {
        "username": "testuser",
        "email": "test@example.com",
        "full_name": "Test User",
        "bio": "Test bio",
        "is_active": True
    }
    
    user = UserInDB(
        **user_data,
        hashed_password=AuthService.get_password_hash("testpassword123!")
    )
    
    await test_db.users.insert_one(user.dict())
    return user

@pytest_asyncio.fixture
async def authenticated_client(test_client: AsyncClient, test_user):
    """Create authenticated test client"""
    # Login to get token
    login_response = await test_client.post("/api/auth/login", json={
        "email": test_user.email,
        "password": "testpassword123!"
    })
    
    assert login_response.status_code == 200
    token_data = login_response.json()
    access_token = token_data["access_token"]
    
    # Set authorization header for subsequent requests
    test_client.headers.update({"Authorization": f"Bearer {access_token}"})
    
    return test_client

@pytest_asyncio.fixture
async def test_post(test_db, test_user):
    """Create a test post"""
    from models.post import Post
    
    post = Post(
        content="This is a test post",
        author_id=test_user.id,
        hashtags=["test", "greasemonkey"]
    )
    
    await test_db.posts.insert_one(post.dict())
    return post

@pytest_asyncio.fixture
async def test_garage(test_db, test_user):
    """Create a test garage"""
    from models.garage import Garage
    
    garage_data = {
        "name": "Test Garage",
        "description": "A test garage",
        "owner_id": test_user.id,
        "location": "Test Location",
        "is_private": False,
        "members": [test_user.id]
    }
    
    garage = Garage(**garage_data)
    await test_db.garages.insert_one(garage.dict())
    return garage

# Test data factories
class TestDataFactory:
    """Factory for creating test data"""
    
    @staticmethod
    def create_user_data(username: str = None, email: str = None):
        """Create user test data"""
        import uuid
        suffix = str(uuid.uuid4())[:8]
        
        return {
            "username": username or f"user_{suffix}",
            "email": email or f"test_{suffix}@example.com",
            "full_name": f"Test User {suffix}",
            "password": "TestPassword123!",
            "bio": "Test user bio"
        }
    
    @staticmethod
    def create_post_data(content: str = None):
        """Create post test data"""
        return {
            "content": content or "This is a test post content",
            "hashtags": ["test", "motorcycle", "ride"],
            "image_urls": []
        }
    
    @staticmethod
    def create_garage_data(name: str = None):
        """Create garage test data"""
        import uuid
        suffix = str(uuid.uuid4())[:8]
        
        return {
            "name": name or f"Test Garage {suffix}",
            "description": "A test motorcycle garage",
            "location": "Test City",
            "is_private": False
        }

# Test utilities
class TestUtils:
    """Utility functions for tests"""
    
    @staticmethod
    async def create_multiple_users(test_db, count: int = 3):
        """Create multiple test users"""
        from models.user import UserInDB
        from auth import AuthService
        
        users = []
        for i in range(count):
            user_data = TestDataFactory.create_user_data(
                username=f"testuser{i}",
                email=f"test{i}@example.com"
            )
            
            user = UserInDB(
                **{k: v for k, v in user_data.items() if k != "password"},
                hashed_password=AuthService.get_password_hash(user_data["password"])
            )
            
            await test_db.users.insert_one(user.dict())
            users.append(user)
        
        return users
    
    @staticmethod
    async def create_multiple_posts(test_db, author_id: str, count: int = 3):
        """Create multiple test posts"""
        from models.post import Post
        
        posts = []
        for i in range(count):
            post_data = TestDataFactory.create_post_data(
                content=f"Test post content {i}"
            )
            
            post = Post(**post_data, author_id=author_id)
            await test_db.posts.insert_one(post.dict())
            posts.append(post)
        
        return posts
    
    @staticmethod
    async def follow_user(test_db, follower_id: str, followed_id: str):
        """Make one user follow another"""
        await test_db.users.update_one(
            {"id": follower_id},
            {
                "$push": {"following": followed_id},
                "$inc": {"following_count": 1}
            }
        )
        
        await test_db.users.update_one(
            {"id": followed_id},
            {
                "$push": {"followers": follower_id},
                "$inc": {"followers_count": 1}
            }
        )

# Performance test utilities
class PerformanceTestUtils:
    """Utilities for performance testing"""
    
    @staticmethod
    def measure_response_time(func):
        """Decorator to measure response time"""
        import time
        
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            result = await func(*args, **kwargs)
            end_time = time.time()
            
            response_time = end_time - start_time
            print(f"Response time: {response_time:.3f}s")
            
            return result
        
        return wrapper

# Mock data for external services
class MockData:
    """Mock data for external service responses"""
    
    GOOGLE_USER_INFO = {
        "sub": "123456789",
        "email": "test@gmail.com",
        "email_verified": True,
        "name": "Test Google User",
        "picture": "https://example.com/picture.jpg",
        "given_name": "Test",
        "family_name": "User"
    }
    
    FACEBOOK_USER_INFO = {
        "id": "987654321",
        "email": "test@facebook.com",
        "name": "Test Facebook User",
        "first_name": "Test",
        "last_name": "User",
        "picture": {
            "data": {
                "url": "https://example.com/facebook_picture.jpg"
            }
        }
    }

# Test decorators
def skip_if_no_db(func):
    """Skip test if database is not available"""
    def wrapper(*args, **kwargs):
        try:
            # Try to connect to test database
            import pymongo
            client = pymongo.MongoClient(TEST_DATABASE_URL)
            client.admin.command('ping')
            client.close()
            return func(*args, **kwargs)
        except Exception:
            pytest.skip("Database not available")
    
    return wrapper

def integration_test(func):
    """Mark test as integration test"""
    return pytest.mark.integration(func)

def performance_test(func):
    """Mark test as performance test"""
    return pytest.mark.performance(func)

def security_test(func):
    """Mark test as security test"""
    return pytest.mark.security(func)

# Custom assertions
class CustomAssertions:
    """Custom assertion methods for tests"""
    
    @staticmethod
    def assert_valid_response_structure(response_data: dict, required_fields: list):
        """Assert response has required structure"""
        for field in required_fields:
            assert field in response_data, f"Required field '{field}' missing from response"
    
    @staticmethod
    def assert_valid_user_response(user_data: dict):
        """Assert user response has valid structure"""
        required_fields = ["id", "username", "email", "full_name", "created_at"]
        CustomAssertions.assert_valid_response_structure(user_data, required_fields)
        
        # Ensure sensitive data is not exposed
        assert "hashed_password" not in user_data
        assert "password" not in user_data
    
    @staticmethod
    def assert_valid_post_response(post_data: dict):
        """Assert post response has valid structure"""
        required_fields = ["id", "content", "author_id", "created_at", "like_count"]
        CustomAssertions.assert_valid_response_structure(post_data, required_fields)
    
    @staticmethod
    def assert_error_response(response_data: dict, expected_status: int = None):
        """Assert error response has valid structure"""
        assert "error" in response_data
        assert response_data["error"] is True
        assert "message" in response_data
        assert "timestamp" in response_data
        
        if expected_status:
            assert response_data.get("status_code") == expected_status
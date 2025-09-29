"""
Unit tests for user authentication endpoints
"""

import pytest
from httpx import AsyncClient
from tests.conftest import TestDataFactory, CustomAssertions

class TestAuthEndpoints:
    """Test authentication endpoints"""
    
    @pytest.mark.asyncio
    async def test_user_registration_success(self, test_client: AsyncClient):
        """Test successful user registration"""
        user_data = TestDataFactory.create_user_data()
        
        response = await test_client.post("/api/auth/register", json=user_data)
        
        assert response.status_code == 200
        response_data = response.json()
        
        # Check response structure
        assert "access_token" in response_data
        assert "token_type" in response_data
        assert "user" in response_data
        
        # Validate user data
        CustomAssertions.assert_valid_user_response(response_data["user"])
        assert response_data["user"]["username"] == user_data["username"]
        assert response_data["user"]["email"] == user_data["email"]
    
    @pytest.mark.asyncio
    async def test_user_registration_duplicate_email(self, test_client: AsyncClient, test_user):
        """Test registration with duplicate email"""
        user_data = TestDataFactory.create_user_data(email=test_user.email)
        
        response = await test_client.post("/api/auth/register", json=user_data)
        
        assert response.status_code == 400
        response_data = response.json()
        CustomAssertions.assert_error_response(response_data, 400)
        assert "email already registered" in response_data["message"].lower()
    
    @pytest.mark.asyncio
    async def test_user_registration_duplicate_username(self, test_client: AsyncClient, test_user):
        """Test registration with duplicate username"""
        user_data = TestDataFactory.create_user_data(username=test_user.username)
        
        response = await test_client.post("/api/auth/register", json=user_data)
        
        assert response.status_code == 400
        response_data = response.json()
        CustomAssertions.assert_error_response(response_data, 400)
        assert "username already taken" in response_data["message"].lower()
    
    @pytest.mark.asyncio
    async def test_user_registration_invalid_email(self, test_client: AsyncClient):
        """Test registration with invalid email"""
        user_data = TestDataFactory.create_user_data(email="invalid-email")
        
        response = await test_client.post("/api/auth/register", json=user_data)
        
        assert response.status_code == 422
        response_data = response.json()
        CustomAssertions.assert_error_response(response_data, 422)
    
    @pytest.mark.asyncio
    async def test_user_login_success(self, test_client: AsyncClient, test_user):
        """Test successful user login"""
        login_data = {
            "email": test_user.email,
            "password": "testpassword123!"
        }
        
        response = await test_client.post("/api/auth/login", json=login_data)
        
        assert response.status_code == 200
        response_data = response.json()
        
        # Check response structure
        assert "access_token" in response_data
        assert "token_type" in response_data
        assert "user" in response_data
        
        # Validate user data
        CustomAssertions.assert_valid_user_response(response_data["user"])
        assert response_data["user"]["email"] == test_user.email
    
    @pytest.mark.asyncio
    async def test_user_login_invalid_email(self, test_client: AsyncClient):
        """Test login with invalid email"""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "testpassword123!"
        }
        
        response = await test_client.post("/api/auth/login", json=login_data)
        
        assert response.status_code == 401
        response_data = response.json()
        CustomAssertions.assert_error_response(response_data, 401)
    
    @pytest.mark.asyncio
    async def test_user_login_invalid_password(self, test_client: AsyncClient, test_user):
        """Test login with invalid password"""
        login_data = {
            "email": test_user.email,
            "password": "wrongpassword"
        }
        
        response = await test_client.post("/api/auth/login", json=login_data)
        
        assert response.status_code == 401
        response_data = response.json()
        CustomAssertions.assert_error_response(response_data, 401)
    
    @pytest.mark.asyncio
    async def test_get_current_user_authenticated(self, authenticated_client: AsyncClient, test_user):
        """Test getting current user with valid token"""
        response = await authenticated_client.get("/api/auth/me")
        
        assert response.status_code == 200
        response_data = response.json()
        
        CustomAssertions.assert_valid_user_response(response_data)
        assert response_data["email"] == test_user.email
    
    @pytest.mark.asyncio
    async def test_get_current_user_unauthenticated(self, test_client: AsyncClient):
        """Test getting current user without token"""
        response = await test_client.get("/api/auth/me")
        
        assert response.status_code == 401
        response_data = response.json()
        CustomAssertions.assert_error_response(response_data, 401)
    
    @pytest.mark.asyncio
    async def test_get_current_user_invalid_token(self, test_client: AsyncClient):
        """Test getting current user with invalid token"""
        headers = {"Authorization": "Bearer invalid_token"}
        response = await test_client.get("/api/auth/me", headers=headers)
        
        assert response.status_code == 401
        response_data = response.json()
        CustomAssertions.assert_error_response(response_data, 401)

class TestPasswordValidation:
    """Test password validation"""
    
    @pytest.mark.asyncio
    async def test_weak_password_rejected(self, test_client: AsyncClient):
        """Test that weak passwords are rejected"""
        weak_passwords = [
            "123456",
            "password",
            "Password",
            "Password123",
            "password123!",
            "PASSWORD123!"
        ]
        
        for password in weak_passwords:
            user_data = TestDataFactory.create_user_data()
            user_data["password"] = password
            
            response = await test_client.post("/api/auth/register", json=user_data)
            
            # Should fail validation
            assert response.status_code in [400, 422]

class TestTokenValidation:
    """Test JWT token validation"""
    
    @pytest.mark.asyncio
    async def test_expired_token_rejected(self, test_client: AsyncClient):
        """Test that expired tokens are rejected"""
        # This would require mocking time or creating expired tokens
        # Implementation depends on your token generation logic
        pass
    
    @pytest.mark.asyncio
    async def test_malformed_token_rejected(self, test_client: AsyncClient):
        """Test that malformed tokens are rejected"""
        malformed_tokens = [
            "not.a.jwt",
            "Bearer malformed",
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid",
            ""
        ]
        
        for token in malformed_tokens:
            headers = {"Authorization": f"Bearer {token}"}
            response = await test_client.get("/api/auth/me", headers=headers)
            
            assert response.status_code == 401
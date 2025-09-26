import requests
import sys
from datetime import datetime
import json
import uuid

class GreaseMonkeyAPITester:
    def __init__(self, base_url="https://codeflow-9.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.access_token = None
        self.user_data = None
        self.garage_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/{endpoint}"
        default_headers = {'Content-Type': 'application/json'}
        
        if headers:
            default_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    print(f"Response: {json.dumps(response_data, indent=2)}")
                    return True, response_data
                except:
                    print(f"Response: {response.text}")
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_health_check(self):
        """Test health check endpoint"""
        success, response = self.run_test(
            "Health Check Endpoint",
            "GET",
            "api/",
            200
        )
        return success

    def test_user_registration(self):
        """Test user registration"""
        # Generate unique test data
        timestamp = datetime.now().strftime('%H%M%S')
        test_user = {
            "username": f"testbiker{timestamp}",
            "email": f"testbiker{timestamp}@greasemonkey.com",
            "password": "SecurePass123!",
            "full_name": "Test Biker",
            "bio": "Love riding motorcycles and testing APIs",
            "location": "Test City"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "api/auth/register",
            200,
            data=test_user
        )
        
        if success and response:
            self.access_token = response.get('access_token')
            self.user_data = response.get('user')
            print(f"🔑 Access token obtained: {self.access_token[:20]}...")
        
        return success

    def test_user_login(self):
        """Test user login with existing user"""
        if not self.user_data:
            print("⚠️ Skipping login test - no user data from registration")
            return False
            
        login_data = {
            "email": self.user_data['email'],
            "password": "SecurePass123!"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "api/auth/login",
            200,
            data=login_data
        )
        
        if success and response:
            # Update token from login
            self.access_token = response.get('access_token')
            print(f"🔑 Login token obtained: {self.access_token[:20]}...")
        
        return success

    def test_get_current_user(self):
        """Test getting current user info"""
        if not self.access_token:
            print("⚠️ Skipping current user test - no access token")
            return False
            
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        success, response = self.run_test(
            "Get Current User Info",
            "GET",
            "api/auth/me",
            200,
            headers=headers
        )
        
        return success

    def test_create_garage(self):
        """Test creating a garage"""
        if not self.access_token:
            print("⚠️ Skipping garage creation test - no access token")
            return False
            
        timestamp = datetime.now().strftime('%H%M%S')
        garage_data = {
            "name": f"Test Riders Garage {timestamp}",
            "description": "A test garage for motorcycle enthusiasts",
            "location": "Test City, Test State",
            "is_private": False
        }
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        success, response = self.run_test(
            "Create Garage",
            "POST",
            "api/garages/",
            200,
            data=garage_data,
            headers=headers
        )
        
        if success and response:
            self.garage_id = response.get('id')
            print(f"🏠 Garage created with ID: {self.garage_id}")
        
        return success

    def test_get_user_garages(self):
        """Test getting user's garages"""
        if not self.access_token:
            print("⚠️ Skipping get user garages test - no access token")
            return False
            
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        success, response = self.run_test(
            "Get User Garages",
            "GET",
            "api/garages/",
            200,
            headers=headers
        )
        
        return success

    def test_discover_garages(self):
        """Test discovering public garages"""
        if not self.access_token:
            print("⚠️ Skipping discover garages test - no access token")
            return False
            
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        success, response = self.run_test(
            "Discover Public Garages",
            "GET",
            "api/garages/discover",
            200,
            headers=headers
        )
        
        return success

    def test_join_garage(self):
        """Test joining a garage (will fail since user is already owner)"""
        if not self.access_token or not self.garage_id:
            print("⚠️ Skipping join garage test - no access token or garage ID")
            return False
            
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        # This should fail with 400 since user is already a member (owner)
        success, response = self.run_test(
            "Join Garage (Expected to fail - already member)",
            "POST",
            f"api/garages/{self.garage_id}/join",
            400,  # Expecting 400 since user is already owner
            headers=headers
        )
        
        return success

    def test_authentication_failure(self):
        """Test authentication failure scenarios"""
        # Test invalid credentials
        invalid_login = {
            "email": "nonexistent@test.com",
            "password": "wrongpassword"
        }
        
        success, response = self.run_test(
            "Login with Invalid Credentials",
            "POST",
            "api/auth/login",
            401,  # Expecting 401 Unauthorized
            data=invalid_login
        )
        
        return success

    def test_unauthorized_access(self):
        """Test accessing protected endpoints without token"""
        success, response = self.run_test(
            "Access Protected Endpoint Without Token",
            "GET",
            "api/auth/me",
            403  # Expecting 403 Forbidden (FastAPI returns 403 for missing auth)
        )
        
        return success

def main():
    print("🏍️  Starting GreaseMonkey Backend API Tests...")
    print("=" * 60)
    
    # Setup
    tester = GreaseMonkeyAPITester()
    
    # Test sequence following the review request flow
    print("\n📋 Testing API Flow...")
    
    # 1. Test health check endpoint
    health_ok = tester.test_health_check()
    
    # 2. Register a new user
    register_ok = tester.test_user_registration()
    
    # 3. Login with the user
    login_ok = tester.test_user_login()
    
    # 4. Test authenticated endpoints with the token
    current_user_ok = tester.test_get_current_user()
    
    # 5. Create a garage
    create_garage_ok = tester.test_create_garage()
    
    # 6. Test garage operations
    get_garages_ok = tester.test_get_user_garages()
    discover_garages_ok = tester.test_discover_garages()
    join_garage_ok = tester.test_join_garage()
    
    # Additional security tests
    print("\n🔒 Testing Security & Error Handling...")
    auth_failure_ok = tester.test_authentication_failure()
    unauthorized_ok = tester.test_unauthorized_access()

    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    # Detailed results
    print("\n📋 Test Summary:")
    print(f"✅ Health Check: {'PASS' if health_ok else 'FAIL'}")
    print(f"✅ User Registration: {'PASS' if register_ok else 'FAIL'}")
    print(f"✅ User Login: {'PASS' if login_ok else 'FAIL'}")
    print(f"✅ Get Current User: {'PASS' if current_user_ok else 'FAIL'}")
    print(f"✅ Create Garage: {'PASS' if create_garage_ok else 'FAIL'}")
    print(f"✅ Get User Garages: {'PASS' if get_garages_ok else 'FAIL'}")
    print(f"✅ Discover Garages: {'PASS' if discover_garages_ok else 'FAIL'}")
    print(f"✅ Join Garage (Expected Fail): {'PASS' if join_garage_ok else 'FAIL'}")
    print(f"✅ Auth Failure Test: {'PASS' if auth_failure_ok else 'FAIL'}")
    print(f"✅ Unauthorized Access Test: {'PASS' if unauthorized_ok else 'FAIL'}")
    
    if tester.tests_passed == tester.tests_run:
        print("\n🎉 All GreaseMonkey backend tests passed!")
        return 0
    else:
        print(f"\n⚠️  {tester.tests_run - tester.tests_passed} backend tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
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
        self.post_id = None
        self.comment_id = None

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
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers, timeout=10)

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

    # ========== POSTS API TESTS ==========
    
    def test_create_general_post(self):
        """Test creating a general post (not garage-specific)"""
        if not self.access_token:
            print("⚠️ Skipping create general post test - no access token")
            return False
            
        post_data = {
            "content": "Just finished an amazing ride through the mountains! The weather was perfect and the roads were smooth. #MountainRiding #MotorcycleLife",
            "image_urls": ["https://example.com/mountain-ride1.jpg", "https://example.com/mountain-ride2.jpg"],
            "hashtags": ["MountainRiding", "MotorcycleLife", "WeekendRide"]
        }
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        success, response = self.run_test(
            "Create General Post",
            "POST",
            "api/posts/",
            200,
            data=post_data,
            headers=headers
        )
        
        if success and response:
            self.post_id = response.get('id')
            print(f"📝 General post created with ID: {self.post_id}")
        
        return success

    def test_create_garage_post(self):
        """Test creating a garage-specific post"""
        if not self.access_token or not self.garage_id:
            print("⚠️ Skipping create garage post test - no access token or garage ID")
            return False
            
        post_data = {
            "content": "Hey garage members! Planning a group ride this weekend. Who's interested? We'll meet at the usual spot at 8 AM. #GroupRide #GarageRide",
            "garage_id": self.garage_id,
            "hashtags": ["GroupRide", "GarageRide", "WeekendPlans"]
        }
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        success, response = self.run_test(
            "Create Garage Post",
            "POST",
            "api/posts/",
            200,
            data=post_data,
            headers=headers
        )
        
        return success

    def test_get_posts_feed(self):
        """Test getting posts feed"""
        if not self.access_token:
            print("⚠️ Skipping get posts feed test - no access token")
            return False
            
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        success, response = self.run_test(
            "Get Posts Feed",
            "GET",
            "api/posts/?limit=10&offset=0",
            200,
            headers=headers
        )
        
        return success

    def test_get_garage_posts(self):
        """Test getting posts from specific garage"""
        if not self.access_token or not self.garage_id:
            print("⚠️ Skipping get garage posts test - no access token or garage ID")
            return False
            
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        success, response = self.run_test(
            "Get Garage Posts",
            "GET",
            f"api/posts/?garage_id={self.garage_id}&limit=10",
            200,
            headers=headers
        )
        
        return success

    def test_get_specific_post(self):
        """Test getting a specific post by ID"""
        if not self.access_token or not self.post_id:
            print("⚠️ Skipping get specific post test - no access token or post ID")
            return False
            
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        success, response = self.run_test(
            "Get Specific Post",
            "GET",
            f"api/posts/{self.post_id}",
            200,
            headers=headers
        )
        
        return success

    def test_update_post(self):
        """Test updating a post (author only)"""
        if not self.access_token or not self.post_id:
            print("⚠️ Skipping update post test - no access token or post ID")
            return False
            
        update_data = {
            "content": "Updated: Just finished an amazing ride through the mountains! The weather was perfect and the roads were smooth. Added some new photos! #MountainRiding #MotorcycleLife #Updated",
            "hashtags": ["MountainRiding", "MotorcycleLife", "WeekendRide", "Updated"]
        }
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        success, response = self.run_test(
            "Update Post",
            "PUT",
            f"api/posts/{self.post_id}",
            200,
            data=update_data,
            headers=headers
        )
        
        return success

    def test_vote_on_post_like(self):
        """Test voting on a post (like)"""
        if not self.access_token or not self.post_id:
            print("⚠️ Skipping vote on post test - no access token or post ID")
            return False
            
        vote_data = {"vote_type": "like"}
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        success, response = self.run_test(
            "Vote on Post (Like)",
            "POST",
            f"api/posts/{self.post_id}/vote",
            200,
            data=vote_data,
            headers=headers
        )
        
        return success

    def test_vote_on_post_dislike(self):
        """Test voting on a post (dislike)"""
        if not self.access_token or not self.post_id:
            print("⚠️ Skipping vote on post dislike test - no access token or post ID")
            return False
            
        vote_data = {"vote_type": "dislike"}
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        success, response = self.run_test(
            "Vote on Post (Dislike)",
            "POST",
            f"api/posts/{self.post_id}/vote",
            200,
            data=vote_data,
            headers=headers
        )
        
        return success

    def test_vote_on_post_remove(self):
        """Test removing vote on a post"""
        if not self.access_token or not self.post_id:
            print("⚠️ Skipping remove vote on post test - no access token or post ID")
            return False
            
        vote_data = {"vote_type": "remove"}
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        success, response = self.run_test(
            "Remove Vote on Post",
            "POST",
            f"api/posts/{self.post_id}/vote",
            200,
            data=vote_data,
            headers=headers
        )
        
        return success

    # ========== COMMENTS API TESTS ==========
    
    def test_create_comment(self):
        """Test creating a comment on a post"""
        if not self.access_token or not self.post_id:
            print("⚠️ Skipping create comment test - no access token or post ID")
            return False
            
        comment_data = {
            "content": "Great post! I love mountain riding too. Which route did you take? The scenery looks amazing!",
            "post_id": self.post_id
        }
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        success, response = self.run_test(
            "Create Comment",
            "POST",
            "api/comments/",
            200,
            data=comment_data,
            headers=headers
        )
        
        if success and response:
            self.comment_id = response.get('id')
            print(f"💬 Comment created with ID: {self.comment_id}")
        
        return success

    def test_get_comments_for_post(self):
        """Test getting comments for a specific post"""
        if not self.access_token or not self.post_id:
            print("⚠️ Skipping get comments test - no access token or post ID")
            return False
            
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        success, response = self.run_test(
            "Get Comments for Post",
            "GET",
            f"api/comments/?post_id={self.post_id}&limit=20",
            200,
            headers=headers
        )
        
        return success

    def test_get_specific_comment(self):
        """Test getting a specific comment by ID"""
        if not self.access_token or not self.comment_id:
            print("⚠️ Skipping get specific comment test - no access token or comment ID")
            return False
            
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        success, response = self.run_test(
            "Get Specific Comment",
            "GET",
            f"api/comments/{self.comment_id}",
            200,
            headers=headers
        )
        
        return success

    def test_update_comment(self):
        """Test updating a comment (author only)"""
        if not self.access_token or not self.comment_id:
            print("⚠️ Skipping update comment test - no access token or comment ID")
            return False
            
        update_data = {
            "content": "Updated: Great post! I love mountain riding too. Which route did you take? The scenery looks amazing! Hope to join you next time!"
        }
        
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        success, response = self.run_test(
            "Update Comment",
            "PUT",
            f"api/comments/{self.comment_id}",
            200,
            data=update_data,
            headers=headers
        )
        
        return success

    def test_like_comment(self):
        """Test liking a comment"""
        if not self.access_token or not self.comment_id:
            print("⚠️ Skipping like comment test - no access token or comment ID")
            return False
            
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        success, response = self.run_test(
            "Like Comment",
            "POST",
            f"api/comments/{self.comment_id}/like",
            200,
            headers=headers
        )
        
        return success

    def test_unlike_comment(self):
        """Test unliking a comment (toggle like off)"""
        if not self.access_token or not self.comment_id:
            print("⚠️ Skipping unlike comment test - no access token or comment ID")
            return False
            
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        success, response = self.run_test(
            "Unlike Comment (Toggle)",
            "POST",
            f"api/comments/{self.comment_id}/like",
            200,
            headers=headers
        )
        
        return success

    def test_delete_comment(self):
        """Test deleting a comment (author only)"""
        if not self.access_token or not self.comment_id:
            print("⚠️ Skipping delete comment test - no access token or comment ID")
            return False
            
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        success, response = self.run_test(
            "Delete Comment",
            "DELETE",
            f"api/comments/{self.comment_id}",
            200,
            headers=headers
        )
        
        return success

    def test_delete_post(self):
        """Test deleting a post (author only) - should also delete associated comments"""
        if not self.access_token or not self.post_id:
            print("⚠️ Skipping delete post test - no access token or post ID")
            return False
            
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        success, response = self.run_test(
            "Delete Post",
            "DELETE",
            f"api/posts/{self.post_id}",
            200,
            headers=headers
        )
        
        return success

    def test_access_nonexistent_post(self):
        """Test accessing a non-existent post"""
        if not self.access_token:
            print("⚠️ Skipping non-existent post test - no access token")
            return False
            
        fake_post_id = str(uuid.uuid4())
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        success, response = self.run_test(
            "Access Non-existent Post",
            "GET",
            f"api/posts/{fake_post_id}",
            404,
            headers=headers
        )
        
        return success

    def test_access_nonexistent_comment(self):
        """Test accessing a non-existent comment"""
        if not self.access_token:
            print("⚠️ Skipping non-existent comment test - no access token")
            return False
            
        fake_comment_id = str(uuid.uuid4())
        headers = {"Authorization": f"Bearer {self.access_token}"}
        
        success, response = self.run_test(
            "Access Non-existent Comment",
            "GET",
            f"api/comments/{fake_comment_id}",
            404,
            headers=headers
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
    
    # 7. Test Posts API
    print("\n📝 Testing Posts API...")
    create_general_post_ok = tester.test_create_general_post()
    create_garage_post_ok = tester.test_create_garage_post()
    get_posts_feed_ok = tester.test_get_posts_feed()
    get_garage_posts_ok = tester.test_get_garage_posts()
    get_specific_post_ok = tester.test_get_specific_post()
    update_post_ok = tester.test_update_post()
    
    # 8. Test Post Voting
    print("\n👍 Testing Post Voting System...")
    vote_like_ok = tester.test_vote_on_post_like()
    vote_dislike_ok = tester.test_vote_on_post_dislike()
    vote_remove_ok = tester.test_vote_on_post_remove()
    
    # 9. Test Comments API
    print("\n💬 Testing Comments API...")
    create_comment_ok = tester.test_create_comment()
    get_comments_ok = tester.test_get_comments_for_post()
    get_specific_comment_ok = tester.test_get_specific_comment()
    update_comment_ok = tester.test_update_comment()
    
    # 10. Test Comment Liking
    print("\n❤️ Testing Comment Liking System...")
    like_comment_ok = tester.test_like_comment()
    unlike_comment_ok = tester.test_unlike_comment()
    
    # 11. Test Deletion (Comments first, then Posts)
    print("\n🗑️ Testing Deletion Operations...")
    delete_comment_ok = tester.test_delete_comment()
    delete_post_ok = tester.test_delete_post()
    
    # 12. Test Error Handling
    print("\n🚫 Testing Error Handling...")
    nonexistent_post_ok = tester.test_access_nonexistent_post()
    nonexistent_comment_ok = tester.test_access_nonexistent_comment()
    
    # Additional security tests
    print("\n🔒 Testing Security & Error Handling...")
    auth_failure_ok = tester.test_authentication_failure()
    unauthorized_ok = tester.test_unauthorized_access()

    # Print results
    print("\n" + "=" * 60)
    print(f"📊 Final Results: {tester.tests_passed}/{tester.tests_run} tests passed")
    
    # Detailed results
    print("\n📋 Test Summary:")
    print("🔧 Basic API Tests:")
    print(f"  ✅ Health Check: {'PASS' if health_ok else 'FAIL'}")
    print(f"  ✅ User Registration: {'PASS' if register_ok else 'FAIL'}")
    print(f"  ✅ User Login: {'PASS' if login_ok else 'FAIL'}")
    print(f"  ✅ Get Current User: {'PASS' if current_user_ok else 'FAIL'}")
    
    print("\n🏠 Garage API Tests:")
    print(f"  ✅ Create Garage: {'PASS' if create_garage_ok else 'FAIL'}")
    print(f"  ✅ Get User Garages: {'PASS' if get_garages_ok else 'FAIL'}")
    print(f"  ✅ Discover Garages: {'PASS' if discover_garages_ok else 'FAIL'}")
    print(f"  ✅ Join Garage (Expected Fail): {'PASS' if join_garage_ok else 'FAIL'}")
    
    print("\n📝 Posts API Tests:")
    print(f"  ✅ Create General Post: {'PASS' if create_general_post_ok else 'FAIL'}")
    print(f"  ✅ Create Garage Post: {'PASS' if create_garage_post_ok else 'FAIL'}")
    print(f"  ✅ Get Posts Feed: {'PASS' if get_posts_feed_ok else 'FAIL'}")
    print(f"  ✅ Get Garage Posts: {'PASS' if get_garage_posts_ok else 'FAIL'}")
    print(f"  ✅ Get Specific Post: {'PASS' if get_specific_post_ok else 'FAIL'}")
    print(f"  ✅ Update Post: {'PASS' if update_post_ok else 'FAIL'}")
    
    print("\n👍 Post Voting Tests:")
    print(f"  ✅ Vote Like: {'PASS' if vote_like_ok else 'FAIL'}")
    print(f"  ✅ Vote Dislike: {'PASS' if vote_dislike_ok else 'FAIL'}")
    print(f"  ✅ Remove Vote: {'PASS' if vote_remove_ok else 'FAIL'}")
    
    print("\n💬 Comments API Tests:")
    print(f"  ✅ Create Comment: {'PASS' if create_comment_ok else 'FAIL'}")
    print(f"  ✅ Get Comments: {'PASS' if get_comments_ok else 'FAIL'}")
    print(f"  ✅ Get Specific Comment: {'PASS' if get_specific_comment_ok else 'FAIL'}")
    print(f"  ✅ Update Comment: {'PASS' if update_comment_ok else 'FAIL'}")
    
    print("\n❤️ Comment Liking Tests:")
    print(f"  ✅ Like Comment: {'PASS' if like_comment_ok else 'FAIL'}")
    print(f"  ✅ Unlike Comment: {'PASS' if unlike_comment_ok else 'FAIL'}")
    
    print("\n🗑️ Deletion Tests:")
    print(f"  ✅ Delete Comment: {'PASS' if delete_comment_ok else 'FAIL'}")
    print(f"  ✅ Delete Post: {'PASS' if delete_post_ok else 'FAIL'}")
    
    print("\n🚫 Error Handling Tests:")
    print(f"  ✅ Non-existent Post: {'PASS' if nonexistent_post_ok else 'FAIL'}")
    print(f"  ✅ Non-existent Comment: {'PASS' if nonexistent_comment_ok else 'FAIL'}")
    
    print("\n🔒 Security Tests:")
    print(f"  ✅ Auth Failure Test: {'PASS' if auth_failure_ok else 'FAIL'}")
    print(f"  ✅ Unauthorized Access Test: {'PASS' if unauthorized_ok else 'FAIL'}")
    
    if tester.tests_passed == tester.tests_run:
        print("\n🎉 All GreaseMonkey backend tests passed!")
        return 0
    else:
        print(f"\n⚠️  {tester.tests_run - tester.tests_passed} backend tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())
# GreaseMonkey V2 API Documentation

## Overview

GreaseMonkey V2 is a comprehensive social networking platform for motorcycle enthusiasts. This API provides all the backend functionality needed for the platform including user management, social features, content sharing, and real-time communication.

## Base URL
- Development: `http://localhost:8000/api`
- Production: `https://api.greasemonkey.com/api`

## Authentication

The API uses JWT (JSON Web Token) based authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your_jwt_token>
```

## API Endpoints

### Authentication (`/auth`)

#### Register User
- **POST** `/auth/register`
- **Description**: Register a new user account
- **Body**: `UserCreate`
- **Response**: `TokenResponse`

#### Login User  
- **POST** `/auth/login`
- **Description**: Login with email and password
- **Body**: `LoginRequest`
- **Response**: `TokenResponse`

#### Get Current User
- **GET** `/auth/me`
- **Description**: Get current authenticated user info
- **Response**: `UserResponse`

### Social Authentication (`/auth/social`)

#### Google Login
- **POST** `/auth/social/google`
- **Description**: Login/register with Google OAuth
- **Body**: `SocialLoginRequest`
- **Response**: `TokenResponse`

#### Facebook Login
- **POST** `/auth/social/facebook`
- **Description**: Login/register with Facebook OAuth
- **Body**: `SocialLoginRequest`
- **Response**: `TokenResponse`

#### Apple Login
- **POST** `/auth/social/apple`
- **Description**: Login/register with Apple OAuth
- **Body**: `SocialLoginRequest`
- **Response**: `TokenResponse`

### User Management (`/users`)

#### Get User Profile
- **GET** `/users/{user_id}`
- **Description**: Get user profile by ID
- **Response**: `UserResponse`

#### Update Profile
- **PUT** `/users/me`
- **Description**: Update current user profile
- **Body**: `UserUpdate`
- **Response**: `UserResponse`

#### Follow User
- **POST** `/users/{user_id}/follow`
- **Description**: Follow a user
- **Response**: `dict`

#### Unfollow User
- **DELETE** `/users/{user_id}/follow`
- **Description**: Unfollow a user
- **Response**: `dict`

#### Get Followers
- **GET** `/users/{user_id}/followers`
- **Description**: Get user's followers list
- **Response**: `List[UserSearchResult]`

#### Get Following
- **GET** `/users/{user_id}/following`
- **Description**: Get user's following list
- **Response**: `List[UserSearchResult]`

### Posts (`/posts`)

#### Create Post
- **POST** `/posts/`
- **Description**: Create a new post
- **Body**: `PostCreate`
- **Response**: `PostResponse`

#### Get Posts Feed
- **GET** `/posts/`
- **Description**: Get posts feed
- **Query Params**: `garage_id`, `limit`, `offset`
- **Response**: `List[PostResponse]`

#### Get Post
- **GET** `/posts/{post_id}`
- **Description**: Get specific post by ID
- **Response**: `PostResponse`

#### Update Post
- **PUT** `/posts/{post_id}`
- **Description**: Update post (author only)
- **Body**: `PostUpdate`
- **Response**: `PostResponse`

#### Delete Post
- **DELETE** `/posts/{post_id}`
- **Description**: Delete post (author only)
- **Response**: `dict`

#### Vote on Post
- **POST** `/posts/{post_id}/vote`
- **Description**: Like/dislike/remove vote on post
- **Body**: `PostVote`
- **Response**: `dict`

### Media Upload (`/media`)

#### Upload Profile Image
- **POST** `/media/upload/profile`
- **Description**: Upload profile image
- **Body**: `multipart/form-data` with file
- **Response**: `MediaUploadResponse`

#### Upload Post Images
- **POST** `/media/upload/post`
- **Description**: Upload images for posts
- **Body**: `multipart/form-data` with files
- **Response**: `List[MediaUploadResponse]`

#### Serve Media Files
- **GET** `/media/files/{subfolder}/{filename}`
- **Description**: Serve uploaded media files
- **Response**: File content

### Search (`/search`)

#### Universal Search
- **GET** `/search/`
- **Description**: Search across users, posts, garages, hashtags
- **Query Params**: `q`, `type`, `limit`, `offset`
- **Response**: `SearchResponse`

#### Search Users
- **GET** `/search/users`
- **Description**: Search for users
- **Query Params**: `q`, `limit`, `offset`
- **Response**: `List[UserSearchResult]`

#### Search Hashtags
- **GET** `/search/hashtags`
- **Description**: Search for hashtags
- **Query Params**: `q`, `limit`
- **Response**: `List[HashtagResult]`

#### Get Trending Hashtags
- **GET** `/search/trending`
- **Description**: Get trending hashtags
- **Query Params**: `limit`
- **Response**: `List[HashtagResult]`

### Notifications (`/notifications`)

#### Get Notifications
- **GET** `/notifications/`
- **Description**: Get user notifications
- **Query Params**: `limit`, `offset`, `unread_only`
- **Response**: `List[NotificationResponse]`

#### Get Unread Count
- **GET** `/notifications/unread-count`
- **Description**: Get count of unread notifications
- **Response**: `dict`

#### Mark Notification Read
- **PUT** `/notifications/{notification_id}/read`
- **Description**: Mark notification as read
- **Response**: `dict`

#### Mark All Read
- **PUT** `/notifications/mark-all-read`
- **Description**: Mark all notifications as read
- **Response**: `dict`

### Saved Posts (`/saved`)

#### Save Post
- **POST** `/saved/posts/{post_id}`
- **Description**: Save a post to collection
- **Response**: `dict`

#### Unsave Post
- **DELETE** `/saved/posts/{post_id}`
- **Description**: Remove post from saved collection
- **Response**: `dict`

#### Get Saved Posts
- **GET** `/saved/posts`
- **Description**: Get user's saved posts
- **Query Params**: `limit`, `offset`
- **Response**: `List[PostResponse]`

### WebSocket (`/ws`)

#### WebSocket Connection
- **WebSocket** `/ws/connect`
- **Description**: Real-time communication endpoint
- **Query Params**: `token`

#### Get Online Users
- **GET** `/ws/online-users`
- **Description**: Get list of online users
- **Response**: `dict`

## Data Models

### UserCreate
```json
{
  "username": "string",
  "email": "string",
  "full_name": "string", 
  "password": "string",
  "bio": "string (optional)",
  "location": "string (optional)"
}
```

### PostCreate
```json
{
  "content": "string",
  "image_urls": ["string"],
  "hashtags": ["string"],
  "garage_id": "string (optional)"
}
```

### SocialLoginRequest
```json
{
  "provider": "google|facebook|apple",
  "access_token": "string",
  "provider_data": {}
}
```

## Error Handling

All API errors follow a consistent format:

```json
{
  "error": true,
  "status_code": 400,
  "message": "Error description",
  "error_code": "ERROR_TYPE",
  "timestamp": "2024-01-01T00:00:00Z",
  "details": {}
}
```

### Common Error Codes
- `VALIDATION_ERROR` (422): Invalid input data
- `AUTHENTICATION_ERROR` (401): Invalid credentials
- `AUTHORIZATION_ERROR` (403): Access denied
- `NOT_FOUND_ERROR` (404): Resource not found
- `RATE_LIMIT_ERROR` (429): Too many requests

## Rate Limiting

- Default: 100 requests per hour per IP
- Authenticated users: Higher limits apply
- Specific endpoints may have different limits

## Security Features

- JWT authentication with configurable expiration
- Password strength validation
- Input sanitization and XSS prevention
- SQL injection protection
- CSRF protection for state-changing operations
- Rate limiting and DDoS protection
- File upload validation and virus scanning

## Real-time Features

### WebSocket Events

#### Connection Events
- `connection_established`: Sent when WebSocket connects
- `user_status`: User online/offline status updates

#### Notification Events  
- `notification`: Real-time notifications
- `post_update`: Live post like/comment updates

#### Interaction Events
- `user_typing`: Typing indicators
- `ping`/`pong`: Connection health checks

## Development

### Running Tests
```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run all tests
pytest

# Run specific test categories
pytest -m "not integration"  # Unit tests only
pytest -m integration        # Integration tests only
pytest -m performance       # Performance tests only
```

### Environment Setup
```bash
# Copy environment template
cp .env.example .env

# Update configuration
# - Database URLs
# - Social login credentials  
# - Security keys
# - File upload settings
```

## Production Deployment

### Required Environment Variables
- `MONGO_URL`: MongoDB connection string
- `SECRET_KEY`: JWT signing key (32+ characters)
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `FACEBOOK_APP_ID`: Facebook app ID
- `REDIS_URL`: Redis connection for caching

### Performance Considerations
- Database indexing for search operations
- Image optimization and CDN integration
- Caching frequently accessed data
- WebSocket connection pooling
- Rate limiting configuration

### Monitoring
- API response time logging
- Error rate monitoring  
- Database performance metrics
- Real-time connection counts
- Security event logging

## API Versioning

Current version: v2

Future versions will maintain backward compatibility with deprecation notices for breaking changes.
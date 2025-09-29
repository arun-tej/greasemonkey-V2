# Social Login Setup Guide

This guide explains how to set up Apple, Google, and Facebook login functionality in GreaseMonkey.

## Features Added

- **Google Sign In** - OAuth 2.0 integration using @react-oauth/google
- **Facebook Login** - Facebook SDK integration for web
- **Apple Sign In** - Apple ID authentication for web
- **Unified Social Auth** - Single API endpoint handling all providers
- **Automatic Account Creation** - New users created automatically from social profiles

## Frontend Implementation

### Components Added

1. **SocialLoginButtons.js** - Unified component with all three social login options
2. **Social Config** - Centralized configuration for all providers
3. **Updated AuthContext** - Added socialLogin method
4. **Enhanced Forms** - Login and Register forms now include social options

### UI Features

- Clean, consistent button design matching app theme
- Loading states and error handling
- Proper icons for each social provider
- Responsive design that works on all screen sizes

## Backend Implementation

### API Endpoints

- `POST /api/auth/social-login` - Handles authentication for all social providers
- Validates provider credentials (mock implementation for demo)
- Creates new users or logs in existing users
- Returns JWT token and user data

## Setup Instructions

### 1. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized domains: `localhost:3001`, your domain
6. Copy Client ID to environment variables

### 2. Facebook App Setup

1. Go to [Facebook Developers](https://developers.facebook.com/)
2. Create a new app
3. Add Facebook Login product
4. Configure Valid OAuth Redirect URIs
5. Copy App ID to environment variables

### 3. Apple Developer Setup

1. Go to [Apple Developer Portal](https://developer.apple.com/)
2. Create a new App ID
3. Enable Sign In with Apple capability
4. Configure domains and return URLs
5. Update client ID in configuration

### 4. Environment Configuration

Create `.env` file in frontend directory:

```bash
# Google OAuth
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id_here

# Facebook App
REACT_APP_FACEBOOK_APP_ID=your_facebook_app_id_here

# Apple Sign In
REACT_APP_APPLE_CLIENT_ID=com.greasemonkey.app
REACT_APP_APPLE_REDIRECT_URI=http://localhost:3001/auth/apple/callback
```

## Security Considerations

### Production Implementation

For production deployment, implement proper token verification:

1. **Google**: Verify JWT tokens using Google's public keys
2. **Facebook**: Validate access tokens with Facebook Graph API
3. **Apple**: Verify ID tokens using Apple's public keys
4. **Database**: Store social provider IDs for account linking
5. **HTTPS**: Ensure all authentication flows use HTTPS

### Token Verification Example

```python
# Example for Google token verification
from google.oauth2 import id_token
from google.auth.transport import requests

def verify_google_token(token):
    try:
        idinfo = id_token.verify_oauth2_token(
            token, requests.Request(), GOOGLE_CLIENT_ID)
        return idinfo
    except ValueError:
        return None
```

## Testing

### Demo Mode

Currently running in demo mode with mock authentication:
- Google login creates mock user with timestamp
- Facebook login uses provided user data
- Apple login creates mock Apple user
- All return valid tokens for frontend testing

### Production Testing

1. Test each provider on different devices
2. Verify account linking works correctly
3. Test error scenarios (denied permissions, network issues)
4. Ensure proper logout and token cleanup

## User Experience

### First-Time Social Login

1. User clicks social login button
2. Redirected to provider authentication
3. User grants permissions
4. Account automatically created in GreaseMonkey
5. User immediately logged in and redirected to app

### Returning Social Users

1. User clicks social login button
2. Provider recognizes user
3. Immediate authentication without permission screen
4. Logged into existing GreaseMonkey account

### Account Linking

Future enhancement: Allow users to link multiple social accounts to single GreaseMonkey profile.

## Troubleshooting

### Common Issues

1. **Invalid Client ID**: Check environment variables
2. **CORS Errors**: Verify allowed origins in provider settings
3. **Redirect Mismatch**: Ensure redirect URIs match exactly
4. **Missing Scopes**: Verify required permissions are requested

### Debug Mode

Enable debug logging in development:
```javascript
// Add to social config
debug: process.env.NODE_ENV === 'development'
```

## Future Enhancements

- [ ] Account linking between providers
- [ ] Social profile picture import
- [ ] Friend discovery via social connections
- [ ] Social sharing integration
- [ ] SSO with motorcycle forums/communities
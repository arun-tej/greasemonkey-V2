// Social Login Configuration
export const SOCIAL_CONFIG = {
  google: {
    clientId: process.env.REACT_APP_GOOGLE_CLIENT_ID || '1234567890-abcdefghijklmnopqrstuvwxyz123456.apps.googleusercontent.com',
  },
  facebook: {
    appId: process.env.REACT_APP_FACEBOOK_APP_ID || '1234567890123456',
  },
  apple: {
    clientId: process.env.REACT_APP_APPLE_CLIENT_ID || 'com.greasemonkey.app',
    redirectUri: process.env.REACT_APP_APPLE_REDIRECT_URI || `${window.location.origin}/auth/apple/callback`,
  }
};

// Apple Sign In Configuration
export const APPLE_CONFIG = {
  clientId: SOCIAL_CONFIG.apple.clientId,
  scope: 'name email',
  redirectURI: SOCIAL_CONFIG.apple.redirectUri,
  state: 'greasemonkey-login',
  nonce: 'greasemonkey-nonce',
  usePopup: true,
};
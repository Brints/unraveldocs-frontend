# Google Signup Implementation - Usage Guide

## Overview

I've implemented a robust and modular Google signup system that includes:

1. **GoogleAuthService** - Core authentication service with OAuth flow management
2. **GoogleSignupComponent** - Reusable Google signup component
3. **GoogleCallbackComponent** - Handles OAuth redirect callbacks
4. **Complete integration** - Works seamlessly with your existing signup form

## Quick Setup

### 1. Configure Google OAuth

First, set up your Google OAuth credentials in `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  google: {
    clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
    redirectUri: 'http://localhost:4200/auth/google/callback',
    scopes: ['openid', 'email', 'profile']
  },
  features: {
    googleOneTap: true,
    googlePopupAuth: true,
    socialLoginTracking: true
  }
};
```

### 2. Add Routes to Your App

In your main routing configuration:

```typescript
import { authRoutes } from './features/auth/auth-routing.module';

const routes: Routes = [
  {
    path: 'auth',
    children: authRoutes
  },
  // ... other routes
];
```

### 3. Set Up Google Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:4200/auth/google/callback` (development)
   - `https://yourdomain.com/auth/google/callback` (production)

## Component Features

### GoogleSignupComponent

```typescript
// Basic usage
<app-google-signup
  [clientId]="environment.google.clientId"
  [fullWidth]="true"
  [usePopup]="true"
  (signupSuccess)="onGoogleSignupSuccess($event)"
  (signupError)="onGoogleSignupError($event)">
</app-google-signup>

// Advanced configuration
<app-google-signup
  [clientId]="googleClientId"
  [fullWidth]="true"
  [usePopup]="false"
  [signupConfig]="{
    showMarketingConsent: true,
    showReferralCode: true,
    redirectAfterSignup: '/onboarding',
    theme: 'dark',
    size: 'large'
  }"
  [additionalScopes]="['https://www.googleapis.com/auth/calendar']"
  (signupStarted)="onSignupStarted()"
  (signupSuccess)="onSignupSuccess($event)"
  (signupError)="onSignupError($event)"
  (signupCancelled)="onSignupCancelled()">
</app-google-signup>
```

### Available Configuration Options

```typescript
interface GoogleSignupConfig {
  showMarketingConsent?: boolean;  // Show marketing consent checkbox
  showReferralCode?: boolean;      // Show referral code input
  redirectAfterSignup?: string;    // Where to redirect after signup
  additionalScopes?: string[];     // Additional OAuth scopes
  theme?: 'light' | 'dark';        // UI theme
  size?: 'small' | 'medium' | 'large'; // Button size
}
```

## Authentication Flow

### Popup Flow (Default)
1. User clicks "Continue with Google"
2. Popup opens with Google OAuth
3. User authenticates with Google
4. Popup closes, auth code is processed
5. User data is sent to your backend
6. User is redirected to dashboard

### Redirect Flow
1. User clicks "Continue with Google"
2. Page redirects to Google OAuth
3. User authenticates with Google
4. Google redirects to `/auth/google/callback`
5. Callback component processes the response
6. User is redirected to dashboard

## Backend Integration

Your backend needs to handle these endpoints:

### POST /api/auth/google/signup
```typescript
interface GoogleSignupRequest {
  googleToken: string;
  marketingConsent?: boolean;
  referralCode?: string;
}

interface GoogleSignupResponse {
  user: GoogleUser;
  isNewUser: boolean;
  accessToken: string;
  refreshToken: string;
  requiresAdditionalInfo?: boolean;
  missingFields?: string[];
}
```

### Example Backend Implementation (Node.js/Express)
```javascript
app.post('/api/auth/google/signup', async (req, res) => {
  try {
    const { googleToken, marketingConsent, referralCode } = req.body;
    
    // Verify Google token
    const googleUser = await verifyGoogleToken(googleToken);
    
    // Check if user exists
    let user = await User.findOne({ email: googleUser.email });
    let isNewUser = false;
    
    if (!user) {
      // Create new user
      user = await User.create({
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.picture,
        emailVerified: true,
        marketingConsent,
        referralCode,
        provider: 'google',
        googleId: googleUser.id
      });
      isNewUser = true;
    }
    
    // Generate JWT tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        emailVerified: user.emailVerified
      },
      isNewUser,
      accessToken,
      refreshToken
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

## Error Handling

The system includes comprehensive error handling:

```typescript
enum GoogleAuthErrorCodes {
  POPUP_BLOCKED = 'POPUP_BLOCKED',
  POPUP_CLOSED = 'POPUP_CLOSED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  INVALID_CLIENT = 'INVALID_CLIENT',
  ACCESS_DENIED = 'ACCESS_DENIED',
  INVALID_GRANT = 'INVALID_GRANT',
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  SCOPE_INSUFFICIENT = 'SCOPE_INSUFFICIENT',
  USER_CANCELLED = 'USER_CANCELLED',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR'
}
```

## Security Features

1. **CSRF Protection** - State parameter validation
2. **Token Validation** - Google tokens are verified server-side
3. **Secure Storage** - Tokens stored in httpOnly cookies (recommended)
4. **Scope Limitation** - Only request necessary permissions
5. **Error Sanitization** - No sensitive data in error messages

## Analytics Integration

Track Google signup events:

```typescript
onGoogleSignupSuccess(response: GoogleSignupResponse): void {
  // Google Analytics
  gtag('event', 'sign_up', {
    method: 'google',
    user_id: response.user.id,
    is_new_user: response.isNewUser
  });
  
  // Custom analytics
  this.analytics.track('User Signed Up', {
    method: 'google',
    userId: response.user.id,
    email: response.user.email,
    isNewUser: response.isNewUser
  });
}
```

## Testing

### Unit Tests
```typescript
describe('GoogleSignupComponent', () => {
  it('should emit signupStarted when Google signup begins', () => {
    // Test implementation
  });
  
  it('should handle popup blocked error', () => {
    // Test implementation
  });
  
  it('should validate required configuration', () => {
    // Test implementation
  });
});
```

### E2E Tests
```typescript
describe('Google Signup Flow', () => {
  it('should complete signup via popup', () => {
    // E2E test implementation
  });
  
  it('should handle OAuth errors gracefully', () => {
    // E2E test implementation
  });
});
```

## Production Considerations

1. **Environment Variables** - Use different client IDs for dev/prod
2. **Rate Limiting** - Implement signup rate limiting
3. **Monitoring** - Track signup success/failure rates
4. **Fallback** - Always provide email signup option
5. **Privacy** - Clear privacy policy for social login

## Troubleshooting

### Common Issues

1. **Popup Blocked**
   - Solution: Use redirect flow or inform users about popup blockers

2. **Invalid Client ID**
   - Check environment configuration
   - Verify Google Console settings

3. **Redirect URI Mismatch**
   - Ensure URIs match in Google Console
   - Check for trailing slashes

4. **CORS Issues**
   - Configure allowed origins in Google Console
   - Set up proper CORS headers

### Debug Mode
```typescript
// Enable debug logging
GoogleAuthService.setDebugMode(true);
```

This implementation provides a production-ready, secure, and user-friendly Google signup experience that integrates seamlessly with your existing authentication system.

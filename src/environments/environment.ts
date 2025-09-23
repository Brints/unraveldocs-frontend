export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000/api',
  google: {
    clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
    redirectUri: 'http://localhost:4200/auth/google/callback',
    scopes: [
      'openid',
      'email',
      'profile'
    ]
  },
  features: {
    googleOneTap: true,
    googlePopupAuth: true,
    socialLoginTracking: true
  }
};

// For production, create environment.prod.ts with production URLs and client IDs

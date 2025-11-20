export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
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

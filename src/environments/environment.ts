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
  firebase: {
    vapidKey: 'BPIzbDexmYmW18ViA8nPGGAej6alu1Et7xcMEDJGJeuDdD-f0jP5Fd68nwkQzK-2JOZe10Q4z4Uao-jia-sUMpQ'
  },
  features: {
    googleOneTap: true,
    googlePopupAuth: true,
    socialLoginTracking: true
  }
};

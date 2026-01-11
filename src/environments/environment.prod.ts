export const environment = {
  production: true,
  apiUrl: 'https://api.unraveldocs.com/api/v1',
  google: {
    clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
    redirectUri: 'https://unraveldocs.xyz/auth/google/callback',
    scopes: [
      'openid',
      'email',
      'profile'
    ]
  },
  firebase: {
    vapidKey: 'BA9vHlh0UvrISwSjtG-tvA84Y41_h6KYIwfqipL0nAHHFg5uPdBKptQcwFhsc1A673B5bY9mvPC09Sc4Y-_I2Sc'
  },
  features: {
    googleOneTap: true,
    googlePopupAuth: true,
    socialLoginTracking: true
  }
};


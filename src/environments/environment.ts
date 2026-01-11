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
    vapidKey: 'BA9vHlh0UvrISwSjtG-tvA84Y41_h6KYIwfqipL0nAHHFg5uPdBKptQcwFhsc1A673B5bY9mvPC09Sc4Y-_I2Sc'
  },
  features: {
    googleOneTap: true,
    googlePopupAuth: true,
    socialLoginTracking: true
  }
};

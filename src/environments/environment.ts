export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1',
  google: {
    clientId: '958289823754-fleftud0m3c522auk29usajuvf6rom3k.apps.googleusercontent.com',
    redirectUri: 'https://8hw23p5s-4200.uks1.devtunnels.ms/login/oauth2/code/google',
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

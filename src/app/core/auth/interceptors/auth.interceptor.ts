import { HttpInterceptorFn } from '@angular/common/http';

// URLs that should not have the Authorization header added
const AUTH_ENDPOINTS = [
  '/auth/login',
  '/auth/signup',
  '/auth/refresh-token',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/resend-verification'
];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // Check if this is an auth endpoint that shouldn't have the token
  const isAuthEndpoint = AUTH_ENDPOINTS.some(endpoint => req.url.includes(endpoint));

  if (isAuthEndpoint) {
    // Don't add Authorization header for auth endpoints
    return next(req);
  }

  // Get the auth token from localStorage
  const token = localStorage.getItem('accessToken');

  if (token) {
    // Clone the request and add the authorization header
    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    return next(authReq);
  }

  // If no token, proceed with the original request
  return next(req);
};

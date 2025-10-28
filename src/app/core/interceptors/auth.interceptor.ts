import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  // You can inject services here if needed
  // const authService = inject(AuthService);

  // Get the auth token from localStorage or your auth service
  const token = localStorage.getItem('authToken');

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

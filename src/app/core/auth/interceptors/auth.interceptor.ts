import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

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

// State for handling concurrent refresh requests
let isRefreshing = false;
let refreshTokenSubject: BehaviorSubject<string | null> = new BehaviorSubject<string | null>(null);

/**
 * Get access token from the appropriate storage
 */
function getAccessToken(): string | null {
  return localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
}

/**
 * Get refresh token from the appropriate storage
 */
function getRefreshToken(): string | null {
  return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if this is an auth endpoint that shouldn't have the token
  const isAuthEndpoint = AUTH_ENDPOINTS.some(endpoint => req.url.includes(endpoint));

  if (isAuthEndpoint) {
    // Don't add Authorization header for auth endpoints
    return next(req);
  }

  // Get the auth token from localStorage or sessionStorage
  const token = getAccessToken();

  // Clone the request and add the authorization header if token exists
  const authReq = token ? addTokenToRequest(req, token) : req;

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Handle 401 Unauthorized errors
      if (error.status === 401 && !isAuthEndpoint) {
        return handleUnauthorizedError(req, next, authService, router);
      }
      return throwError(() => error);
    })
  );
};

/**
 * Add the authorization token to the request
 */
function addTokenToRequest(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

/**
 * Handle 401 Unauthorized errors by refreshing the token
 */
function handleUnauthorizedError(
  req: HttpRequest<unknown>,
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router
): Observable<any> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    const refreshToken = getRefreshToken();

    if (refreshToken) {
      return new Observable(observer => {
        authService.refreshToken()
          .then((newAccessToken: string) => {
            isRefreshing = false;
            refreshTokenSubject.next(newAccessToken);

            // Retry the original request with the new token
            next(addTokenToRequest(req, newAccessToken)).subscribe({
              next: (response) => observer.next(response),
              error: (err) => observer.error(err),
              complete: () => observer.complete()
            });
          })
          .catch((refreshError) => {
            isRefreshing = false;
            // Refresh failed, logout and redirect to login
            authService.logout().then(() => {
              router.navigate(['/auth/login'], {
                queryParams: { sessionExpired: 'true' }
              });
            });
            observer.error(refreshError);
          });
      });
    } else {
      // No refresh token available, logout
      isRefreshing = false;
      authService.logout().then(() => {
        router.navigate(['/auth/login'], {
          queryParams: { sessionExpired: 'true' }
        });
      });
      return throwError(() => new Error('No refresh token available'));
    }
  } else {
    // Token refresh is already in progress, wait for it to complete
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap((token) => {
        return next(addTokenToRequest(req, token!));
      })
    );
  }
}

import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, filter, take, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

// URLs that should not have the Authorization header added
const PUBLIC_ENDPOINTS = [
  '/auth/login',
  '/auth/signup',
  '/auth/refresh-token',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
  '/auth/resend-verification-email',
  '/auth/generate-password',
  '/plans',
  '/plans/currencies',
];

// Endpoints that need withCredentials: true (for HttpOnly cookie support)
const COOKIE_ENDPOINTS = [
  '/auth/login',
  '/auth/refresh-token',
  '/auth/logout',
  '/auth/logout-all',
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
 * Check if a request URL matches any of the public endpoints
 */
function isPublicEndpoint(url: string): boolean {
  return PUBLIC_ENDPOINTS.some(endpoint => url.includes(endpoint));
}

/**
 * Check if a request URL needs withCredentials for cookie support
 */
function needsCookies(url: string): boolean {
  return COOKIE_ENDPOINTS.some(endpoint => url.includes(endpoint));
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Add withCredentials for cookie-dependent endpoints
  if (needsCookies(req.url)) {
    req = req.clone({ withCredentials: true });
  }

  // Check if this is a public endpoint that shouldn't have the token
  const isPublic = isPublicEndpoint(req.url);

  if (isPublic) {
    return next(req);
  }

  // Get the auth token from localStorage or sessionStorage
  const token = getAccessToken();

  // If there's no token at all, just send the request as-is.
  if (!token) {
    return next(req);
  }

  // Clone the request and add the authorization header
  const authReq = addTokenToRequest(req, token);

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Only handle 401 Unauthorized errors for authenticated requests
      if (error.status === 401) {
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
 * Handle 401 Unauthorized errors by refreshing the token via cookie-based refresh.
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

    // Attempt refresh — the server reads the refresh token from the HttpOnly cookie
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
          refreshTokenSubject.next(null);
          // Refresh failed — session is truly expired, redirect to login
          redirectToLogin(router);
          observer.error(refreshError);
        });
    });
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

/**
 * Redirect to login page with sessionExpired flag.
 * Avoids redirect loops by checking if already on the login page.
 */
function redirectToLogin(router: Router): void {
  const currentPath = window.location.pathname;

  // Don't redirect if already on the login page
  if (currentPath.startsWith('/auth/login')) {
    return;
  }

  // Don't redirect if on a public page (home, pricing, etc.)
  const publicPaths = ['/home', '/pricing', '/terms', '/privacy', '/auth/'];
  const isOnPublicPage = publicPaths.some(p => currentPath.startsWith(p)) || currentPath === '/';
  if (isOnPublicPage) {
    return;
  }

  router.navigate(['/auth/login'], {
    queryParams: {
      sessionExpired: 'true',
      returnUrl: currentPath
    }
  });
}


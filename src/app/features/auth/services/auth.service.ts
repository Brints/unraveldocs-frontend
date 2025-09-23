import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import {
  User,
  SignupRequest,
  LoginRequest,
  AuthResponse,
  SocialAuthProvider,
  PasswordResetRequest,
  PasswordResetConfirm,
  EmailVerificationRequest,
  AuthError,
  AuthErrorCodes
} from '../models/auth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private API_URL = 'https://your-api-url.com/api'; // Replace with your API URL
  private currentUserSubject: BehaviorSubject<User | null> = new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadStoredUser();
  }

  private loadStoredUser() {
    const userJson = localStorage.getItem('currentUser');
    if (userJson) {
      const user: User = JSON.parse(userJson);
      this.currentUserSubject.next(user);
    }
  }

  private setCurrentUser(user: User | null) {
    this.currentUserSubject.next(user);
    if (user) {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
      localStorage.removeItem('currentUser');
    }
  }

  private storeTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  private clearStoredTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Unknown error!';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Error ${error.status}: ${error.error.message}`;
    }
    return throwError(errorMessage);
  }

  private transformError(error: any): AuthError {
    // Transform the error into a user-friendly message
    let message = 'An error occurred';
    let code: AuthErrorCodes = AuthErrorCodes.UnknownError;

    if (error.status === 400) {
      message = 'Invalid request';
      code = AuthErrorCodes.InvalidRequest;
    } else if (error.status === 401) {
      message = 'Unauthorized';
      code = AuthErrorCodes.Unauthorized;
    } else if (error.status === 403) {
      message = 'Forbidden';
      code = AuthErrorCodes.Forbidden;
    } else if (error.status === 404) {
      message = 'Not found';
      code = AuthErrorCodes.NotFound;
    } else if (error.status === 500) {
      message = 'Server error';
      code = AuthErrorCodes.ServerError;
    }

    return { message, code };
  }

  async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await this.http.post<LoginResponse>(`${this.API_URL}/login`, request)
        .pipe(catchError(this.handleError))
        .toPromise();

      if (response) {
        this.storeTokens(response.accessToken, response.refreshToken);
        this.setCurrentUser(response.user);
        return response;
      }
      throw new Error('Login failed');
    } catch (error) {
      throw this.transformError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      // Call logout endpoint to invalidate tokens server-side
      await this.http.post(`${this.API_URL}/logout`, {})
        .pipe(catchError(() => of(null))) // Don't fail if logout endpoint fails
        .toPromise();
    } catch (error) {
      console.warn('Logout endpoint failed:', error);
    } finally {
      this.clearStoredTokens();
      this.setCurrentUser(null);
    }
  }

  async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await this.http.post<{ accessToken: string }>(`${this.API_URL}/refresh`, {
        refreshToken
      }).pipe(catchError(this.handleError)).toPromise();

      if (response) {
        localStorage.setItem('accessToken', response.accessToken);
        return response.accessToken;
      }
      throw new Error('Token refresh failed');
    } catch (error) {
      this.logout(); // Clear invalid tokens
      throw this.transformError(error);
    }
  }

  // ...existing methods
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import {
  User,
  SignupRequest,
  LoginRequest,
  AuthResponse,
  LoginResponse,
  SocialAuthProvider,
  PasswordResetRequest,
  PasswordResetConfirm,
  PasswordResetResponse,
  PasswordResetValidation,
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

  /**
   * Request a password reset email
   */
  async forgotPassword(request: PasswordResetRequest): Promise<PasswordResetResponse> {
    try {
      const response = await this.http.post<PasswordResetResponse>(`${this.API_URL}/forgot-password`, request)
        .pipe(catchError(this.handleError))
        .toPromise();

      if (response) {
        return response;
      }
      throw new Error('Password reset request failed');
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Validate a password reset token
   */
  async validateResetToken(token: string): Promise<PasswordResetValidation> {
    try {
      const response = await this.http.post<PasswordResetValidation>(`${this.API_URL}/validate-reset-token`, { token })
        .pipe(catchError(this.handleError))
        .toPromise();

      if (response) {
        return response;
      }
      throw new Error('Token validation failed');
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Reset password using token
   */
  async resetPassword(request: PasswordResetConfirm): Promise<PasswordResetResponse> {
    try {
      const response = await this.http.post<PasswordResetResponse>(`${this.API_URL}/reset-password`, request)
        .pipe(catchError(this.handleError))
        .toPromise();

      if (response) {
        return response;
      }
      throw new Error('Password reset failed');
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken');
    return !!token && !this.isTokenExpired(token);
  }

  /**
   * Check if token is expired
   */
  private isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Verify email address using token
   */
  async verifyEmail(request: EmailVerificationRequest): Promise<PasswordResetResponse> {
    try {
      const response = await this.http.post<PasswordResetResponse>(`${this.API_URL}/verify-email`, request)
        .pipe(catchError(this.handleError))
        .toPromise();

      if (response) {
        return response;
      }
      throw new Error('Email verification failed');
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Resend email verification
   */
  async resendVerificationEmail(email: string): Promise<PasswordResetResponse> {
    try {
      const response = await this.http.post<PasswordResetResponse>(`${this.API_URL}/resend-verification`, { email })
        .pipe(catchError(this.handleError))
        .toPromise();

      if (response) {
        return response;
      }
      throw new Error('Resend verification failed');
    } catch (error) {
      throw this.transformError(error);
    }
  }
}

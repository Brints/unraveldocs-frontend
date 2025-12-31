import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {BehaviorSubject, firstValueFrom, Observable, of, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {
  AuthError,
  AuthErrorCodes,
  EmailVerificationRequest,
  LoginRequest,
  LoginResponse,
  PasswordResetConfirm,
  PasswordResetRequest,
  PasswordResetResponse,
  PasswordResetValidation,
  SignupRequest,
  User,
} from '../models/auth.model';
import {environment} from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  currentUser() {
    throw new Error('Method not implemented.');
  }
  private API_URL = environment.apiUrl;
  private currentUserSubject: BehaviorSubject<User | null> =
    new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> =
    this.currentUserSubject.asObservable();

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
    // Return the original error to preserve backend error structure
    // This allows transformError to properly extract error messages and codes
    return throwError(() => error);
  }

  private transformError(error: any): AuthError {
    // Transform the error into a user-friendly message
    let message = 'An error occurred';
    let code: AuthErrorCodes = AuthErrorCodes.UnknownError;

    // Extract message from backend - try multiple paths
    if (error.error?.message) {
      // standard error response: { statusCode, error, message }
      message = error.error.message;
    } else if (typeof error.error === 'string') {
      // Sometimes error is a string
      message = error.error;
    } else if (error.message) {
      // Fallback to error.message
      message = error.message;
    }

    // Map status codes to error codes and check for specific patterns
    if (error.status === 400) {
      code = AuthErrorCodes.InvalidRequest;
      // Check for specific error types
      if (message.toLowerCase().includes('disabled') ||
          message.toLowerCase().includes('account is disabled')) {
        code = AuthErrorCodes.ACCOUNT_DISABLED;
      } else if (message.toLowerCase().includes('token has expired') ||
          message.toLowerCase().includes('expired')) {
        code = AuthErrorCodes.TokenExpired;
      } else if (message.toLowerCase().includes('invalid') &&
                 message.toLowerCase().includes('token')) {
        code = AuthErrorCodes.InvalidToken;
      }
    } else if (error.status === 401) {
      code = AuthErrorCodes.Unauthorized;
    } else if (error.status === 403) {
      if (message.toLowerCase().includes('invalid credentials') ||
          message.toLowerCase().includes('attempts left')) {
        code = AuthErrorCodes.InvalidCredentials;
      } else {
        code = AuthErrorCodes.Forbidden;
      }
    } else if (error.status === 404) {
      code = AuthErrorCodes.NotFound;
      if (message.toLowerCase().includes('user')) {
        code = AuthErrorCodes.UserNotFound;
      }
    } else if (error.status === 500) {
      message = 'Server error. Please try again later.';
      code = AuthErrorCodes.ServerError;
    }

    return { message, code };
  }

  async login(request: LoginRequest): Promise<LoginResponse> {
    try {
      const response = await firstValueFrom(
        this.http
          .post<any>(`${this.API_URL}/auth/login`, request)
          .pipe(catchError(this.handleError))
      );

      // Handle the backend response structure which wraps data
      let loginData: any = null;

      // Check if response has a data wrapper (your backend structure)
      if (response && response.data) {
        loginData = response.data;
      } else if (response) {
        loginData = response;
      }

      if (loginData && loginData.accessToken && loginData.refreshToken) {
        // Extract user data and tokens from the response
        const { accessToken, refreshToken, ...userData } = loginData;

        // Map backend user fields to frontend User model
        const user: User = {
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profilePicture: userData.profilePicture || undefined,
          role: userData.role,
          lastLogin: userData.lastLogin,
          isActive: userData.isActive,
          isVerified: userData.isVerified,
          emailVerified: userData.emailVerified ?? userData.isVerified ?? false,
          termsAccepted: userData.termsAccepted,
          marketingOptIn: userData.marketingOptIn,
          isPlatformAdmin: userData.isPlatformAdmin,
          isOrganizationAdmin: userData.isOrganizationAdmin,
          country: userData.country,
          profession: userData.profession,
          organization: userData.organization,
          phoneNumber: userData.phoneNumber,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt,
          plan: userData.plan
        };

        // Store tokens and user
        this.storeTokens(accessToken, refreshToken);
        this.setCurrentUser(user);

        // Return properly formatted response
        return {
          user,
          accessToken,
          refreshToken,
          requiresTwoFactor: loginData.requiresTwoFactor,
          twoFactorMethods: loginData.twoFactorMethods
        };
      }
      throw new Error('Login failed');
    } catch (error) {
      throw this.transformError(error);
    }
  }

  async signup(request: SignupRequest): Promise<User> {
    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${this.API_URL}/auth/signup`, request)
          .pipe(catchError(this.handleError))
      );

      console.log('Signup response:', response); // Debug log

      // Handle different possible response structures
      let user: User | null = null;
      let accessToken: string | null = null;
      let refreshToken: string | null = null;
      let backendUser: any = null;

      // Check if response has a data wrapper (your backend structure)
      if (response && response.data) {
        if (response.data.user) {
          backendUser = response.data.user;
          accessToken = response.data.accessToken || response.data.access_token || response.accessToken || response.access_token;
          refreshToken = response.data.refreshToken || response.data.refresh_token || response.refreshToken || response.refresh_token;
        } else if (response.data.id && response.data.email) {
          backendUser = response.data;
          accessToken = response.accessToken || response.access_token;
          refreshToken = response.refreshToken || response.refresh_token;
        }
      }
      // Check if response has a nested user object
      else if (response && response.user) {
        backendUser = response.user;
        accessToken = response.accessToken || response.access_token;
        refreshToken = response.refreshToken || response.refresh_token;
      }
      // Check if response is the user object directly
      else if (response && response.id && response.email) {
        backendUser = response;
      }

      // Map backend user fields to frontend User model
      if (backendUser && backendUser.id && backendUser.email) {
        user = {
          id: backendUser.id,
          email: backendUser.email,
          firstName: backendUser.firstName,
          lastName: backendUser.lastName,
          profilePicture: backendUser.profilePicture || undefined,
          emailVerified: backendUser.emailVerified ?? backendUser.isVerified ?? false,
          createdAt: backendUser.createdAt,
          updatedAt: backendUser.updatedAt,
          plan: backendUser.plan
        };

        // Store tokens if available
        if (accessToken && refreshToken) {
          this.storeTokens(accessToken, refreshToken);
        }
        this.setCurrentUser(user);
        return user;
      }

      throw new Error('Signup failed: Invalid response from server');
    } catch (error) {
      throw this.transformError(error);
    }
  }

  async socialAuth(request: { provider: string; redirectUrl: string }): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ authUrl: string }>(`${this.API_URL}/auth/social/${request.provider}`, {
          redirectUrl: request.redirectUrl
        }).pipe(catchError(this.handleError))
      );

      if (response) {
        return response.authUrl;
      }
      throw new Error('Social auth initialization failed');
    } catch (error) {
      throw this.transformError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      // Call logout endpoint to invalidate tokens server-side
      await firstValueFrom(
        this.http
          .post(`${this.API_URL}/auth/logout`, {})
          .pipe(catchError(() => of(null)))
      );
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
      const response = await firstValueFrom(
        this.http
          .post<{ accessToken: string }>(`${this.API_URL}/auth/refresh-token`, {
            refreshToken,
          })
          .pipe(catchError(this.handleError))
      );

      if (response) {
        localStorage.setItem('accessToken', response.accessToken);
        return response.accessToken;
      }
      throw new Error('Token refresh failed');
    } catch (error) {
      await this.logout();
      throw this.transformError(error);
    }
  }

  /**
   * Request a password reset email
   */
  async forgotPassword(
    request: PasswordResetRequest
  ): Promise<PasswordResetResponse> {
    try {
      const response = await firstValueFrom(
        this.http
          .post<PasswordResetResponse>(`${this.API_URL}/user/forgot-password`, request)
          .pipe(catchError(this.handleError))
      );

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
      const response = await firstValueFrom(
        this.http
          .post<PasswordResetValidation>(`${this.API_URL}/validate-reset-token`, {
            token,
          })
          .pipe(catchError(this.handleError))
      );

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
  async resetPassword(
    request: PasswordResetConfirm
  ): Promise<PasswordResetResponse> {
    try {
      const response = await firstValueFrom(
        this.http
          .post<PasswordResetResponse>(`${this.API_URL}/user/reset-password`, request)
          .pipe(catchError(this.handleError))
      );

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
  async verifyEmail(
    request: EmailVerificationRequest
  ): Promise<PasswordResetResponse> {
    try {
      const response = await firstValueFrom(
        this.http
          .post<PasswordResetResponse>(`${this.API_URL}/auth/verify-email`, request)
          .pipe(catchError(this.handleError))
      );

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
      const response = await firstValueFrom(
        this.http
          .post<PasswordResetResponse>(`${this.API_URL}/auth/resend-verification-email`, {
            email,
          })
          .pipe(catchError(this.handleError))
      );

      if (response) {
        return response;
      }
      throw new Error('Resend verification failed');
    } catch (error) {
      throw this.transformError(error);
    }
  }
}

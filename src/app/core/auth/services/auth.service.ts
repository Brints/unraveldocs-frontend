import {Injectable} from '@angular/core';
import {HttpClient, HttpErrorResponse} from '@angular/common/http';
import {BehaviorSubject, firstValueFrom, Observable, of, throwError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {
  ApiResponse,
  AuthError,
  AuthErrorCodes,
  EmailVerificationRequest,
  LoginData,
  LoginRequest,
  PasswordResetConfirm,
  PasswordResetRequest,
  PasswordResetResponse,
  PasswordResetValidation,
  RefreshTokenData,
  SignupRequest,
  User,
} from '../models/auth.model';
import {environment} from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private API_URL = environment.apiUrl;
  private currentUserSubject: BehaviorSubject<User | null> =
    new BehaviorSubject<User | null>(null);
  public currentUser$: Observable<User | null> =
    this.currentUserSubject.asObservable();

  // Track which storage type is being used (rememberMe = localStorage, otherwise sessionStorage)
  private useLocalStorage = true;
  private readonly STORAGE_TYPE_KEY = 'authStorageType';

  constructor(private http: HttpClient) {
    this.loadStoredUser();
  }

  private getStorage(): Storage {
    return this.useLocalStorage ? localStorage : sessionStorage;
  }

  private loadStoredUser() {
    // Check which storage type was used
    const storageType = localStorage.getItem(this.STORAGE_TYPE_KEY) || sessionStorage.getItem(this.STORAGE_TYPE_KEY);
    this.useLocalStorage = storageType !== 'session';

    const storage = this.getStorage();
    const accessToken = storage.getItem('accessToken');
    const userJson = storage.getItem('currentUser');

    if (!accessToken) {
      // No token at all — user is not logged in
      return;
    }

    // Load cached user data immediately for instant UI
    if (userJson) {
      const user: User = JSON.parse(userJson);
      this.currentUserSubject.next(user);
    }

    if (this.isTokenExpired(accessToken)) {
      // Access token is expired but the HttpOnly refresh cookie may still be valid.
      // Attempt a silent refresh in the background instead of clearing the session.
      this.attemptSilentRefresh();
    }
  }

  /**
   * Attempt to refresh the access token silently on app startup.
   * If the refresh cookie is still valid, the user stays logged in.
   * If it fails, clear the session — the user will need to log in again.
   */
  private async attemptSilentRefresh(): Promise<void> {
    try {
      await this.refreshToken();
      // Refresh succeeded — also re-fetch user profile to ensure it's current
      try {
        const user = await this.fetchCurrentUserProfile();
        this.setCurrentUser(user);
      } catch {
        // Profile fetch failed but token is valid — keep cached user data
      }
    } catch {
      // Refresh cookie is also expired/invalid — session is truly over
      this.clearSession();
    }
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

  private setCurrentUser(user: User | null) {
    this.currentUserSubject.next(user);
    const storage = this.getStorage();
    if (user) {
      storage.setItem('currentUser', JSON.stringify(user));
    } else {
      storage.removeItem('currentUser');
    }
  }

  /**
   * Store only the access token. Refresh token is an HttpOnly cookie managed by the server.
   */
  private storeAccessToken(accessToken: string, rememberMe: boolean = true) {
    // Update storage preference
    this.useLocalStorage = rememberMe;

    // Clear tokens from both storages first
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUser');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('currentUser');

    // Store in the appropriate storage
    const storage = this.getStorage();
    storage.setItem('accessToken', accessToken);

    // Remember which storage type is being used
    if (rememberMe) {
      localStorage.setItem(this.STORAGE_TYPE_KEY, 'local');
      sessionStorage.removeItem(this.STORAGE_TYPE_KEY);
    } else {
      sessionStorage.setItem(this.STORAGE_TYPE_KEY, 'session');
      localStorage.removeItem(this.STORAGE_TYPE_KEY);
    }
  }

  private clearStoredTokens() {
    // Clear from both storages
    localStorage.removeItem('accessToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem(this.STORAGE_TYPE_KEY);
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('currentUser');
    sessionStorage.removeItem(this.STORAGE_TYPE_KEY);
  }

  /**
   * Clear local session state without making an API call.
   * Used by the interceptor to avoid calling logout() (which makes an HTTP request
   * that would itself go through the interceptor and potentially cause loops).
   */
  clearSession(): void {
    this.clearStoredTokens();
    this.setCurrentUser(null);
  }

  private handleError(error: HttpErrorResponse) {
    return throwError(() => error);
  }

  private transformError(error: any): AuthError {
    let message = 'An error occurred';
    let code: AuthErrorCodes = AuthErrorCodes.UnknownError;

    // Extract message from backend response envelope
    if (error.error?.message) {
      message = error.error.message;
    } else if (typeof error.error === 'string') {
      message = error.error;
    } else if (error.message) {
      message = error.message;
    }

    // Extract errorCode from backend if available
    const backendErrorCode = error.error?.errorCode || error.error?.error;

    // Map HTTP status + backend error codes to AuthErrorCodes
    if (error.status === 400) {
      code = AuthErrorCodes.InvalidRequest;
      if (backendErrorCode === 'ACCOUNT_DEACTIVATED') {
        code = AuthErrorCodes.AccountDeactivated;
      } else if (backendErrorCode === 'EMAIL_ALREADY_VERIFIED') {
        code = AuthErrorCodes.EmailAlreadyVerified;
      } else if (backendErrorCode === 'VERIFICATION_FAILED') {
        code = AuthErrorCodes.VerificationFailed;
      } else if (backendErrorCode === 'TOKEN_EXPIRED') {
        code = AuthErrorCodes.TokenExpired;
      }
    } else if (error.status === 401) {
      code = AuthErrorCodes.Unauthorized;
      if (backendErrorCode === 'INVALID_CREDENTIALS') {
        code = AuthErrorCodes.InvalidCredentials;
      } else if (backendErrorCode === 'TOKEN_MISSING') {
        code = AuthErrorCodes.TokenMissing;
      } else if (backendErrorCode === 'TOKEN_INVALID') {
        code = AuthErrorCodes.TokenInvalid;
      } else if (backendErrorCode === 'ACCOUNT_NOT_VERIFIED') {
        code = AuthErrorCodes.AccountNotVerified;
      }
    } else if (error.status === 403) {
      code = AuthErrorCodes.Forbidden;
      if (backendErrorCode === 'ACCOUNT_NOT_VERIFIED') {
        code = AuthErrorCodes.AccountNotVerified;
      } else if (backendErrorCode === 'ACCOUNT_LOCKED') {
        code = AuthErrorCodes.AccountLocked;
      }
    } else if (error.status === 404) {
      code = AuthErrorCodes.NotFound;
      if (message.toLowerCase().includes('user')) {
        code = AuthErrorCodes.UserNotFound;
      }
    } else if (error.status === 409) {
      code = AuthErrorCodes.USER_EXISTS;
    } else if (error.status === 500) {
      message = 'Server error. Please try again later.';
      code = AuthErrorCodes.ServerError;
    } else if (error.status === 0) {
      message = 'Network error. Please check your connection.';
      code = AuthErrorCodes.NETWORK_ERROR;
    }

    // Fallback: check message content for hint if no explicit errorCode
    if (code === AuthErrorCodes.InvalidRequest || code === AuthErrorCodes.Forbidden) {
      const msgLower = message.toLowerCase();
      if (msgLower.includes('not verified') || msgLower.includes('verify your email') || msgLower.includes('disabled')) {
        code = AuthErrorCodes.AccountNotVerified;
      } else if (msgLower.includes('locked')) {
        code = AuthErrorCodes.AccountLocked;
      } else if (msgLower.includes('deactivated') || msgLower.includes('deleted')) {
        code = AuthErrorCodes.AccountDeactivated;
      }
    }

    return { message, code };
  }

  /**
   * Fetch the current user's profile from GET /api/v1/user/me
   */
  private async fetchCurrentUserProfile(): Promise<User> {
    const response = await firstValueFrom(
      this.http.get<any>(`${this.API_URL}/user/me`).pipe(catchError(this.handleError))
    );

    const userData = response?.data || response;

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
      plan: userData.plan,
    };

    return user;
  }

  /**
   * Login user. API returns { userId, accessToken, tokenType, accessExpiresIn }.
   * Refresh token is set as an HttpOnly cookie by the server.
   * User profile is fetched separately via GET /api/v1/user/me.
   *
   * @param request LoginRequest (email + password)
   * @param rememberMe UI-only preference: true = localStorage, false = sessionStorage
   */
  async login(request: LoginRequest, rememberMe: boolean = true): Promise<LoginData> {
    try {
      const response = await firstValueFrom(
        this.http
          .post<ApiResponse<LoginData>>(`${this.API_URL}/auth/login`, request, {
            withCredentials: true, // Allow server to set HttpOnly refresh token cookie
          })
          .pipe(catchError(this.handleError))
      );

      const loginData: LoginData = response?.data || response;

      if (loginData && loginData.accessToken) {
        // Store only the access token (refresh token is an HttpOnly cookie)
        this.storeAccessToken(loginData.accessToken, rememberMe);

        // Fetch user profile from GET /api/v1/user/me
        try {
          const user = await this.fetchCurrentUserProfile();
          this.setCurrentUser(user);
        } catch (profileError) {
          console.warn('Failed to fetch user profile after login:', profileError);
          // Don't fail the login — user can still navigate
        }

        return loginData;
      }
      throw new Error('Login failed: no access token received');
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

      // Handle different possible response structures
      let user: User | null = null;
      let backendUser: any = null;

      // Check if response has a data wrapper (backend structure)
      if (response && response.data) {
        if (response.data.id && response.data.email) {
          backendUser = response.data;
        }
      } else if (response && response.id && response.email) {
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
          role: backendUser.role,
          isActive: backendUser.isActive,
          isVerified: backendUser.isVerified,
          emailVerified: backendUser.emailVerified ?? backendUser.isVerified ?? false,
          termsAccepted: backendUser.termsAccepted,
          marketingOptIn: backendUser.marketingOptIn,
          country: backendUser.country,
          profession: backendUser.profession,
          organization: backendUser.organization,
          createdAt: backendUser.createdAt,
          updatedAt: backendUser.updatedAt,
        };

        // Note: Signup does NOT return tokens or auto-login.
        // User must verify their email first, then log in.
        return user;
      }

      throw new Error('Signup failed: Invalid response from server');
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Logout current session. Server invalidates tokens and clears the HttpOnly cookie.
   * Expects 204 No Content.
   */
  async logout(): Promise<void> {
    try {
      await firstValueFrom(
        this.http
          .post(`${this.API_URL}/auth/logout`, {}, {
            withCredentials: true,
            observe: 'response',
          })
          .pipe(catchError(() => of(null)))
      );
    } catch (error) {
      console.warn('Logout endpoint failed:', error);
    } finally {
      this.clearStoredTokens();
      this.setCurrentUser(null);
    }
  }

  /**
   * Logout from all devices. Server invalidates all refresh tokens.
   * Expects 204 No Content.
   */
  async logoutAllDevices(): Promise<void> {
    try {
      await firstValueFrom(
        this.http
          .post(`${this.API_URL}/auth/logout-all`, {}, {
            withCredentials: true,
            observe: 'response',
          })
          .pipe(catchError(() => of(null)))
      );
    } catch (error) {
      console.warn('Logout all devices endpoint failed:', error);
    } finally {
      this.clearStoredTokens();
      this.setCurrentUser(null);
    }
  }

  /**
   * Refresh the access token. The server reads the refresh token from the HttpOnly cookie.
   * No request body needed. Returns a new access token.
   */
  async refreshToken(): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.http
          .post<ApiResponse<RefreshTokenData>>(`${this.API_URL}/auth/refresh-token`, {}, {
            withCredentials: true, // Send the HttpOnly refresh token cookie
          })
          .pipe(catchError(this.handleError))
      );

      const tokenData: RefreshTokenData = response?.data || response;

      if (tokenData && tokenData.accessToken) {
        // Store only the access token (new refresh token set as HttpOnly cookie by server)
        const storage = this.getStorage();
        storage.setItem('accessToken', tokenData.accessToken);
        return tokenData.accessToken;
      }
      throw new Error('Token refresh failed');
    } catch (error) {
      // Clear local session state — the caller (interceptor / token-refresh service)
      // is responsible for redirecting to login.
      this.clearSession();
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
   * Check if user is authenticated.
   * Returns true if the access token is valid, OR if a cached user + token exist
   * (expired token being silently refreshed in the background).
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    if (!token) return false;

    // Token is valid — clearly authenticated
    if (!this.isTokenExpired(token)) return true;

    // Token is expired but we have a cached user — silent refresh may be in progress
    // The interceptor will handle refreshing on the next API call
    return this.currentUserSubject.value !== null;
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
          .post<any>(`${this.API_URL}/auth/verify-email`, request)
          .pipe(catchError(this.handleError))
      );

      // Backend returns { statusCode, status, message, data: null }
      if (response) {
        return {
          message: response.message || response.data?.message || 'Email verified successfully',
          success: response.status === 'success' || response.statusCode === 200,
        };
      }
      throw new Error('Email verification failed');
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Resend email verification.
   * Note: API always returns 200 OK regardless of email existence (anti-enumeration).
   */
  async resendVerificationEmail(email: string): Promise<PasswordResetResponse> {
    try {
      const response = await firstValueFrom(
        this.http
          .post<any>(`${this.API_URL}/auth/resend-verification-email`, {
            email,
          })
          .pipe(catchError(this.handleError))
      );

      if (response) {
        return {
          message: response.message || 'If an account with this email exists and is unverified, a verification email has been sent.',
          success: true,
        };
      }
      throw new Error('Resend verification failed');
    } catch (error) {
      throw this.transformError(error);
    }
  }

  /**
   * Update the stored user profile (e.g., after profile edits)
   */
  updateStoredUser(user: User): void {
    this.setCurrentUser(user);
  }

  /**
   * Re-fetch and update the current user profile from the server
   */
  async refreshUserProfile(): Promise<User> {
    const user = await this.fetchCurrentUserProfile();
    this.setCurrentUser(user);
    return user;
  }
}

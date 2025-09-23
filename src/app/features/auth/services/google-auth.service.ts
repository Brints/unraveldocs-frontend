import { Injectable, signal, computed } from '@angular/core';
import { Observable, BehaviorSubject, throwError, fromEvent, timer } from 'rxjs';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, timeout, switchMap } from 'rxjs/operators';
import {
  GoogleAuthConfig,
  GoogleUser,
  GoogleAuthResponse,
  GoogleSignupRequest,
  GoogleSignupResponse,
  GoogleAuthError,
  GoogleAuthErrorCodes
} from '../models/google-auth.model';

declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

@Injectable({
  providedIn: 'root'
})
export class GoogleAuthService {
  private readonly GOOGLE_API_URL = 'https://accounts.google.com/oauth/v2/auth';
  private readonly GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
  private readonly GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo';
  private readonly GOOGLE_SDK_URL = 'https://apis.google.com/js/api.js';
  private readonly GOOGLE_GSI_URL = 'https://accounts.google.com/gsi/client';

  private isInitializedSubject = new BehaviorSubject<boolean>(false);
  private currentUserSubject = new BehaviorSubject<GoogleUser | null>(null);
  private authStatusSubject = new BehaviorSubject<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  public isInitialized$ = this.isInitializedSubject.asObservable();
  public currentUser$ = this.currentUserSubject.asObservable();
  public authStatus$ = this.authStatusSubject.asObservable();

  // Reactive state
  private isLoading = signal(false);
  private initializationError = signal<GoogleAuthError | null>(null);

  // Computed state
  public loading = computed(() => this.isLoading());
  public error = computed(() => this.initializationError());
  public isReady = computed(() => this.isInitializedSubject.value && !this.isLoading());

  private config: GoogleAuthConfig = {
    clientId: '', // Will be set from environment
    redirectUri: `${window.location.origin}/auth/google/callback`,
    scope: [
      'openid',
      'email',
      'profile'
    ],
    responseType: 'code',
    accessType: 'offline',
    prompt: 'select_account'
  };

  private googleAuth: any = null;
  private popupWindow: Window | null = null;

  constructor(private http: HttpClient) {}

  /**
   * Initialize Google authentication with configuration
   */
  async initialize(config: Partial<GoogleAuthConfig>): Promise<void> {
    try {
      this.isLoading.set(true);
      this.initializationError.set(null);

      // Merge with default config
      this.config = { ...this.config, ...config };

      if (!this.config.clientId) {
        throw this.createError(
          GoogleAuthErrorCodes.CONFIGURATION_ERROR,
          'Google Client ID is required'
        );
      }

      // Load Google Identity Services
      await this.loadGoogleSDK();

      // Initialize Google Auth
      await this.initializeGoogleAuth();

      this.isInitializedSubject.next(true);
      this.authStatusSubject.next('unauthenticated');

    } catch (error) {
      const googleError = error as GoogleAuthError;
      this.initializationError.set(googleError);
      this.authStatusSubject.next('unauthenticated');
      throw googleError;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Sign up with Google using popup flow
   */
  async signupWithPopup(): Promise<GoogleSignupResponse> {
    if (!this.isInitializedSubject.value) {
      throw this.createError(
        GoogleAuthErrorCodes.CONFIGURATION_ERROR,
        'Google Auth not initialized'
      );
    }

    try {
      this.isLoading.set(true);

      // Get Google auth code using popup
      const authCode = await this.getAuthCodeViaPopup();

      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(authCode);

      // Get user info from Google
      const googleUser = await this.getUserInfo(tokens.access_token);

      // Send to your backend for user creation/authentication
      const signupResponse = await this.signupWithBackend({
        googleToken: tokens.access_token,
        marketingConsent: false // This can be set from a form
      });

      // Update current user state
      this.currentUserSubject.next(googleUser);
      this.authStatusSubject.next('authenticated');

      return signupResponse;

    } catch (error) {
      this.handleAuthError(error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Sign up with Google using redirect flow
   */
  signupWithRedirect(): void {
    if (!this.isInitializedSubject.value) {
      throw this.createError(
        GoogleAuthErrorCodes.CONFIGURATION_ERROR,
        'Google Auth not initialized'
      );
    }

    const authUrl = this.buildAuthUrl();
    window.location.href = authUrl;
  }

  /**
   * Handle redirect callback
   */
  async handleRedirectCallback(urlParams: URLSearchParams): Promise<GoogleSignupResponse> {
    const code = urlParams.get('code');
    const error = urlParams.get('error');
    const state = urlParams.get('state');

    if (error) {
      throw this.createError(
        GoogleAuthErrorCodes.ACCESS_DENIED,
        `Google OAuth error: ${error}`
      );
    }

    if (!code) {
      throw this.createError(
        GoogleAuthErrorCodes.INVALID_GRANT,
        'No authorization code received'
      );
    }

    try {
      this.isLoading.set(true);

      // Exchange code for tokens
      const tokens = await this.exchangeCodeForTokens(code);

      // Get user info
      const googleUser = await this.getUserInfo(tokens.access_token);

      // Complete signup with backend
      const signupResponse = await this.signupWithBackend({
        googleToken: tokens.access_token
      });

      this.currentUserSubject.next(googleUser);
      this.authStatusSubject.next('authenticated');

      return signupResponse;

    } catch (error) {
      this.handleAuthError(error);
      throw error;
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Sign out from Google
   */
  async signOut(): Promise<void> {
    try {
      if (this.googleAuth) {
        await this.googleAuth.signOut();
      }

      this.currentUserSubject.next(null);
      this.authStatusSubject.next('unauthenticated');

    } catch (error) {
      console.error('Error signing out:', error);
    }
  }

  /**
   * Revoke Google access
   */
  async revokeAccess(): Promise<void> {
    try {
      if (this.googleAuth) {
        await this.googleAuth.disconnect();
      }

      this.currentUserSubject.next(null);
      this.authStatusSubject.next('unauthenticated');

    } catch (error) {
      console.error('Error revoking access:', error);
    }
  }

  /**
   * Get current authentication status
   */
  getCurrentUser(): GoogleUser | null {
    return this.currentUserSubject.value;
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return this.authStatusSubject.value === 'authenticated';
  }

  // Private methods

  private async loadGoogleSDK(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.google?.accounts) {
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = this.GOOGLE_GSI_URL;
      script.async = true;
      script.defer = true;

      script.onload = () => {
        // Wait for Google object to be available
        const checkGoogle = () => {
          if (window.google?.accounts) {
            resolve();
          } else {
            setTimeout(checkGoogle, 100);
          }
        };
        checkGoogle();
      };

      script.onerror = () => {
        reject(this.createError(
          GoogleAuthErrorCodes.NETWORK_ERROR,
          'Failed to load Google SDK'
        ));
      };

      document.head.appendChild(script);
    });
  }

  private async initializeGoogleAuth(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        window.google.accounts.id.initialize({
          client_id: this.config.clientId,
          callback: this.handleCredentialResponse.bind(this),
          auto_select: false,
          cancel_on_tap_outside: true
        });

        // Initialize OAuth for popup flow
        this.googleAuth = window.google.accounts.oauth2.initTokenClient({
          client_id: this.config.clientId,
          scope: this.config.scope.join(' '),
          callback: () => {} // Will be overridden per request
        });

        resolve();
      } catch (error) {
        reject(this.createError(
          GoogleAuthErrorCodes.CONFIGURATION_ERROR,
          'Failed to initialize Google Auth'
        ));
      }
    });
  }

  private async getAuthCodeViaPopup(): Promise<string> {
    return new Promise((resolve, reject) => {
      const authUrl = this.buildAuthUrl();

      // Open popup
      this.popupWindow = window.open(
        authUrl,
        'google-auth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      );

      if (!this.popupWindow) {
        reject(this.createError(
          GoogleAuthErrorCodes.POPUP_BLOCKED,
          'Popup was blocked by browser'
        ));
        return;
      }

      // Monitor popup
      const checkClosed = setInterval(() => {
        if (this.popupWindow?.closed) {
          clearInterval(checkClosed);
          reject(this.createError(
            GoogleAuthErrorCodes.POPUP_CLOSED,
            'Popup was closed before authentication completed'
          ));
        }
      }, 1000);

      // Listen for message from popup
      const messageHandler = (event: MessageEvent) => {
        if (event.origin !== window.location.origin) return;

        if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          this.popupWindow?.close();
          resolve(event.data.code);
        } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
          clearInterval(checkClosed);
          window.removeEventListener('message', messageHandler);
          this.popupWindow?.close();
          reject(this.createError(
            GoogleAuthErrorCodes.ACCESS_DENIED,
            event.data.error
          ));
        }
      };

      window.addEventListener('message', messageHandler);

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        if (this.popupWindow && !this.popupWindow.closed) {
          this.popupWindow.close();
        }
        reject(this.createError(
          GoogleAuthErrorCodes.USER_CANCELLED,
          'Authentication timed out'
        ));
      }, 300000);
    });
  }

  private buildAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: this.config.responseType,
      scope: this.config.scope.join(' '),
      access_type: this.config.accessType || 'offline',
      prompt: this.config.prompt || 'select_account',
      state: this.generateState()
    });

    return `${this.GOOGLE_API_URL}?${params.toString()}`;
  }

  private async exchangeCodeForTokens(code: string): Promise<GoogleAuthResponse> {
    const tokenRequest = {
      client_id: this.config.clientId,
      code: code,
      grant_type: 'authorization_code',
      redirect_uri: this.config.redirectUri
    };

    try {
      const response = await this.http.post<GoogleAuthResponse>(
        this.GOOGLE_TOKEN_URL,
        tokenRequest
      ).pipe(
        timeout(10000),
        catchError(this.handleHttpError.bind(this))
      ).toPromise();

      if (!response) {
        throw this.createError(
          GoogleAuthErrorCodes.NETWORK_ERROR,
          'No response from Google token endpoint'
        );
      }

      return response;
    } catch (error) {
      throw this.createError(
        GoogleAuthErrorCodes.INVALID_GRANT,
        'Failed to exchange code for tokens'
      );
    }
  }

  private async getUserInfo(accessToken: string): Promise<GoogleUser> {
    try {
      const response = await this.http.get<GoogleUser>(
        `${this.GOOGLE_USERINFO_URL}?access_token=${accessToken}`
      ).pipe(
        timeout(10000),
        catchError(this.handleHttpError.bind(this))
      ).toPromise();

      if (!response) {
        throw this.createError(
          GoogleAuthErrorCodes.NETWORK_ERROR,
          'No response from Google userinfo endpoint'
        );
      }

      return response;
    } catch (error) {
      throw this.createError(
        GoogleAuthErrorCodes.SCOPE_INSUFFICIENT,
        'Failed to get user information from Google'
      );
    }
  }

  private async signupWithBackend(request: GoogleSignupRequest): Promise<GoogleSignupResponse> {
    try {
      const response = await this.http.post<GoogleSignupResponse>(
        '/api/auth/google/signup',
        request
      ).pipe(
        timeout(15000),
        catchError(this.handleHttpError.bind(this))
      ).toPromise();

      if (!response) {
        throw this.createError(
          GoogleAuthErrorCodes.NETWORK_ERROR,
          'No response from backend'
        );
      }

      return response;
    } catch (error) {
      throw error;
    }
  }

  private handleCredentialResponse(response: any): void {
    // Handle One Tap or button flow response
    console.log('Credential response:', response);
  }

  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) +
           Math.random().toString(36).substring(2, 15);
  }

  private handleAuthError(error: any): void {
    console.error('Google Auth Error:', error);
    this.authStatusSubject.next('unauthenticated');
  }

  private handleHttpError(error: HttpErrorResponse): Observable<never> {
    let googleError: GoogleAuthError;

    if (error.status === 0) {
      googleError = this.createError(
        GoogleAuthErrorCodes.NETWORK_ERROR,
        'Network error - please check your connection'
      );
    } else if (error.status === 400) {
      googleError = this.createError(
        GoogleAuthErrorCodes.INVALID_GRANT,
        'Invalid request to Google'
      );
    } else if (error.status === 401) {
      googleError = this.createError(
        GoogleAuthErrorCodes.INVALID_CLIENT,
        'Invalid client configuration'
      );
    } else {
      googleError = this.createError(
        GoogleAuthErrorCodes.NETWORK_ERROR,
        `HTTP ${error.status}: ${error.message}`
      );
    }

    return throwError(() => googleError);
  }

  private createError(code: GoogleAuthErrorCodes, message: string, details?: any): GoogleAuthError {
    return {
      code,
      message,
      details
    };
  }
}

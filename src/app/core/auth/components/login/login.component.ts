import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';

import { FormBuilder, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';

import { AuthService } from '../../services/auth.service';
import { GoogleAuthService } from '../../services/google-auth.service';
import { GoogleSignupComponent } from '../google-signup/google-signup.component';

import {
  GoogleSignupResponse,
  GoogleAuthError
} from '../../models/google-auth.model';
import {
  AuthError,
  AuthErrorCodes,
  LoginRequest,
  LoginResponse,
  LoginError,
  LoginErrorCodes
} from '../../models/auth.model';
import {FooterComponent} from '../../../../shared/components/navbar/footer/footer.component';
import {FormInputComponent} from '../../../../shared/ui/form-input/form-input.component';
import {ButtonComponent} from '../../../../shared/ui/button/button.component';
import {environment} from '../../../../../environments/environment';

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    GoogleSignupComponent,
    FooterComponent,
    FormInputComponent,
    ButtonComponent
],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit, OnDestroy {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly googleAuth = inject(GoogleAuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Reactive form with improved validation
  loginForm = this.fb.group({
    email: ['', [
      Validators.required,
      Validators.email,
      Validators.maxLength(254)
    ]],
    password: ['', [
      Validators.required,
      Validators.minLength(6),
      Validators.maxLength(128)
    ]],
    rememberMe: [false]
  });

  // Reactive state
  private loginError = signal<LoginError | null>(null);
  private isLoading = signal(false);
  private socialLoading = signal<'google' | 'github' | null>(null);

  // Make these public for template access
  public googleError = signal<GoogleAuthError | null>(null);
  public loginAttempts = signal(0);
  public attemptsRemaining = signal<number | null>(null);
  public isRateLimited = signal(false);
  public retryAfter = signal(0);
  public isFormValidSignal = signal(false);

  private showForgotPassword = signal(false);
  private redirectUrl = signal<string | null>(null);
  public showPassword = signal(false);
  public sessionExpired = signal(false);

  // Computed properties
  public error = computed(() => this.loginError());
  public loading = computed(() => this.isLoading());
  public isFormValid = computed(() => this.isFormValidSignal());
  public canAttemptLogin = computed(() =>
    !this.isLoading() &&
    !this.isRateLimited() &&
    this.isFormValidSignal()
  );
  public showAttemptsWarning = computed(() => {
    const remaining = this.attemptsRemaining();
    return remaining !== null && remaining > 0 && remaining <= 3;
  });

  // Form controls for easier access
  get emailControl() { return this.loginForm.get('email') as FormControl; }
  get passwordControl() { return this.loginForm.get('password') as FormControl; }
  get rememberMeControl() { return this.loginForm.get('rememberMe') as FormControl; }

  // Google configuration
  googleConfig = {
    showMarketingConsent: false,
    showReferralCode: false,
    redirectAfterSignup: '/dashboard',
    theme: 'light' as const,
    size: 'medium' as const
  };

  // Make environment available to template
  environment = environment;

  private subscriptions = new Subscription();

  ngOnInit(): void {
    this.setupRedirectUrl();
    this.setupFormSubscriptions();
    this.checkForAutoLogin();
    // Initialize form validity
    this.isFormValidSignal.set(this.loginForm.valid);
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private setupRedirectUrl(): void {
    // Get redirect URL from query params
    const returnUrl = this.route.snapshot.queryParams['returnUrl'];
    if (returnUrl) {
      this.redirectUrl.set(decodeURIComponent(returnUrl));
    }

    // Check if session expired
    const sessionExpired = this.route.snapshot.queryParams['sessionExpired'];
    if (sessionExpired === 'true') {
      this.sessionExpired.set(true);
    }
  }

  private setupFormSubscriptions(): void {
    // Track form validity reactively
    this.subscriptions.add(
      this.loginForm.statusChanges.subscribe(() => {
        this.isFormValidSignal.set(this.loginForm.valid);
      })
    );

    // Track form validity on value changes too
    this.subscriptions.add(
      this.loginForm.valueChanges.subscribe(() => {
        this.isFormValidSignal.set(this.loginForm.valid);
      })
    );

    // Clear errors when form changes
    this.subscriptions.add(
      this.loginForm.valueChanges.subscribe(() => {
        if (this.loginError()) {
          this.loginError.set(null);
        }
        if (this.googleError()) {
          this.googleError.set(null);
        }
      })
    );

    // Reset rate limiting after time expires
    this.subscriptions.add(
      // Implementation for retry timer would go here
    );
  }

  private checkForAutoLogin(): void {
    // Check if user is already authenticated
    if (this.authService.isAuthenticated()) {
      this.navigateAfterLogin();
    }
  }

  // Email/Password Login
  async onSubmit(): Promise<void> {
    if (!this.canAttemptLogin()) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading.set(true);
    this.loginError.set(null);

    try {
      const formValue = this.loginForm.value as LoginFormData;

      const loginRequest: LoginRequest = {
        email: formValue.email.toLowerCase().trim(),
        password: formValue.password,
        rememberMe: formValue.rememberMe
      };

      const response = await this.authService.login(loginRequest);

      this.handleLoginSuccess(response);

    } catch (error) {
      this.handleLoginError(error as AuthError);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Google Login Methods
  onGoogleLoginStarted(): void {
    this.socialLoading.set('google');
    this.loginError.set(null);
    this.googleError.set(null);
  }

  onGoogleLoginSuccess(response: GoogleSignupResponse): void {
    this.socialLoading.set(null);
    console.log('Google login successful:', response);

    // Track login event
    if (environment.features.socialLoginTracking) {
      this.trackSocialLogin('google', response);
    }

    this.navigateAfterLogin();
  }

  onGoogleLoginError(error: GoogleAuthError): void {
    this.socialLoading.set(null);
    this.googleError.set(error);
    console.error('Google login error:', error);
  }

  onGoogleLoginCancelled(): void {
    this.socialLoading.set(null);
    this.googleError.set(null);
  }

  // GitHub Login (placeholder for future implementation)
  async loginWithGitHub(): Promise<void> {
    this.socialLoading.set('github');
    this.loginError.set(null);

    try {
      // Implementation would go here
      console.log('GitHub login not yet implemented');
    } catch (error) {
      this.handleLoginError(error as AuthError);
    } finally {
      this.socialLoading.set(null);
    }
  }

  // Password Reset
  showForgotPasswordForm(): void {
    this.showForgotPassword.set(true);
  }

  hideForgotPasswordForm(): void {
    this.showForgotPassword.set(false);
  }

  async resetPassword(email: string): Promise<void> {
    try {
      // TODO: Implement password reset when service method is available
      // await this.authService.requestPasswordReset({ email });
      console.log('Password reset requested for:', email);
      // Show success message
      console.log('Password reset email sent');
    } catch (error) {
      console.error('Password reset error:', error);
    }
  }

  // Form Helpers
  toggleRememberMe(): void {
    const current = this.rememberMeControl.value;
    this.rememberMeControl.patchValue(!current);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(current => !current);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  // Success/Error Handlers
  private handleLoginSuccess(response: LoginResponse): void {
    // Reset login attempts
    this.loginAttempts.set(0);
    this.attemptsRemaining.set(null);
    this.isRateLimited.set(false);

    // Handle two-factor authentication if required
    if (response.requiresTwoFactor) {
      this.router.navigate(['/auth/two-factor'], {
        queryParams: {
          returnUrl: this.redirectUrl() || '/dashboard',
          methods: response.twoFactorMethods?.join(',')
        }
      });
      return;
    }

    this.navigateAfterLogin();
  }

  private handleLoginError(error: AuthError | LoginError): void {
    // Increment login attempts
    this.loginAttempts.update(count => count + 1);

    // Convert AuthError to LoginError if needed
    const loginError = this.convertToLoginError(error);
    this.loginError.set(loginError);

    // Handle specific error types
    switch (loginError.code) {
      case LoginErrorCodes.TOO_MANY_ATTEMPTS:
        this.isRateLimited.set(true);
        if (loginError.retryAfter) {
          this.retryAfter.set(loginError.retryAfter);
          this.startRetryTimer();
        }
        break;

      case LoginErrorCodes.EMAIL_NOT_VERIFIED:
        // Offer to resend verification email
        break;

      case LoginErrorCodes.ACCOUNT_LOCKED:
        // Show account recovery options
        break;

      case LoginErrorCodes.INVALID_CREDENTIALS:
        // Focus on password field for retry - removed invalid focus() call
        this.passwordControl.markAsTouched();
        break;
    }
  }

  private convertToLoginError(error: AuthError | LoginError): LoginError {
    if ('code' in error && Object.values(LoginErrorCodes).includes(error.code as LoginErrorCodes)) {
      return error as LoginError;
    }

    // Convert AuthError to LoginError
    const authError = error as AuthError;

    // Use the actual backend message instead of hardcoded messages
    const backendMessage = authError.message;

    switch (authError.code) {
      case AuthErrorCodes.Forbidden:
      case AuthErrorCodes.InvalidCredentials:
        // Keep the backend message which includes attempt count
        return {
          code: LoginErrorCodes.INVALID_CREDENTIALS,
          message: backendMessage || 'Invalid email or password. Please try again.'
        };
      case AuthErrorCodes.RATE_LIMITED:
        return {
          code: LoginErrorCodes.TOO_MANY_ATTEMPTS,
          message: backendMessage || 'Too many login attempts. Please try again later.',
          retryAfter: 300 // 5 minutes
        };
      default:
        return {
          code: LoginErrorCodes.SERVER_ERROR,
          message: backendMessage || 'An unexpected error occurred.'
        };
    }
  }

  private startRetryTimer(): void {
    const timer = setInterval(() => {
      this.retryAfter.update(time => {
        const newTime = time - 1;
        if (newTime <= 0) {
          clearInterval(timer);
          this.isRateLimited.set(false);
          return 0;
        }
        return newTime;
      });
    }, 1000);
  }

  private navigateAfterLogin(): void {
    const destination = this.redirectUrl() || '/user/dashboard';
    // Use navigateByUrl for full URL paths (handles /teams/join/token correctly)
    this.router.navigateByUrl(destination);
  }

  private trackSocialLogin(provider: string, response: GoogleSignupResponse): void {
    // Analytics tracking
    console.log('Tracking social login:', {
      provider,
      userId: response.user.id,
      isNewUser: response.isNewUser
    });
  }

  // Template Helper Methods
  getErrorMessage(): string {
    const error = this.loginError();
    if (!error) return '';

    // For most cases, use the backend message directly as it's more descriptive
    // Only add retry timer info for TOO_MANY_ATTEMPTS if we have a countdown
    if (error.code === LoginErrorCodes.TOO_MANY_ATTEMPTS) {
      const retry = this.retryAfter();
      if (retry > 0) {
        return `${error.message} Please try again in ${retry} seconds.`;
      }
    }

    // Return the backend message directly - it's already descriptive
    return error.message || 'An unexpected error occurred. Please try again.';
  }

  getGoogleErrorMessage(): string {
    const error = this.googleError();
    return error?.message || '';
  }

  getSocialButtonText(provider: 'google' | 'github'): string {
    const loading = this.socialLoading();
    if (loading === provider) {
      return `Signing in with ${provider}...`;
    }
    return `Continue with ${provider.charAt(0).toUpperCase() + provider.slice(1)}`;
  }

  isSocialLoading(provider: 'google' | 'github'): boolean {
    return this.socialLoading() === provider;
  }

  isAnyLoginInProgress(): boolean {
    return this.loading() || !!this.socialLoading();
  }

  formatRetryTime(): string {
    const seconds = this.retryAfter();
    if (seconds <= 0) return '';

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${remainingSeconds}s`;
  }

  // Public methods for testing
  public retry(): void {
    this.loginError.set(null);
    this.googleError.set(null);
    this.isRateLimited.set(false);
    this.retryAfter.set(0);
  }

  public clearForm(): void {
    this.loginForm.reset();
    this.loginError.set(null);
    this.googleError.set(null);
  }
}

import { Component, Input, Output, EventEmitter, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormControl } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { GoogleAuthService } from '../../services/google-auth.service';
import {
  GoogleSignupResponse,
  GoogleAuthError,
  GoogleAuthErrorCodes,
  GoogleAuthConfig
} from '../../models/google-auth.model';
import {ButtonComponent} from '../../../../shared/ui/button/button.component';
import {FormInputComponent} from '../../../../shared/ui/form-input/form-input.component';

export interface GoogleSignupConfig {
  showMarketingConsent?: boolean;
  showReferralCode?: boolean;
  redirectAfterSignup?: string;
  additionalScopes?: string[];
  theme?: 'light' | 'dark';
  size?: 'small' | 'medium' | 'large';
}

@Component({
  selector: 'app-google-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonComponent,
    FormInputComponent
  ],
  template: `
    <div class="google-signup-container" [attr.data-theme]="config().theme">

      <!-- Google One-Tap (if enabled) -->
      @if (showOneTap()) {
        <div id="g_id_onload" class="one-tap-container"></div>
      }

      <!-- Main Google Signup Button -->
      <div class="google-button-container">
        <app-button
          [variant]="config().theme === 'dark' ? 'secondary' : 'outline'"
          [fullWidth]="fullWidth"
          [isLoading]="isLoading()"
          [disabled]="!isReady() || isLoading()"
          (clicked)="handleGoogleSignup()"
          class="google-signup-btn">

          <!-- Google Icon -->
          <svg slot="icon-left" width="20" height="20" viewBox="0 0 24 24" class="google-icon">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>

          {{ getButtonText() }}
        </app-button>
      </div>

      <!-- Error Display -->
      @if (authError()) {
        <div class="error-message" role="alert">
          <svg class="error-icon" width="16" height="16" viewBox="0 0 24 24">
            <path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
          </svg>
          {{ getErrorMessage() }}
        </div>
      }

      <!-- Additional Options Form (shown after Google auth if needed) -->
      @if (showAdditionalOptions()) {
        <div class="additional-options">
          <h3>Complete Your Profile</h3>
          <form [formGroup]="additionalForm" (ngSubmit)="completeSignup()" class="additional-form">

            @if (config().showMarketingConsent) {
              <app-form-input
                label="Marketing Communications"
                type="checkbox"
                helpText="Receive product updates and special offers"
                [control]="marketingControl">
              </app-form-input>
            }

            @if (config().showReferralCode) {
              <app-form-input
                label="Referral Code (Optional)"
                type="text"
                placeholder="Enter referral code"
                [control]="referralCodeControl"
                helpText="Have a referral code? Enter it here for special benefits">
              </app-form-input>
            }

            <div class="form-actions">
              <app-button
                type="submit"
                variant="primary"
                [isLoading]="isCompletingSignup()"
                [disabled]="additionalForm.invalid || isCompletingSignup()">
                Complete Signup
              </app-button>

              <app-button
                type="button"
                variant="ghost"
                (clicked)="skipAdditionalOptions()"
                [disabled]="isCompletingSignup()">
                Skip for now
              </app-button>
            </div>
          </form>
        </div>
      }

      <!-- Privacy Notice -->
      @if (showPrivacyNotice) {
        <div class="privacy-notice">
          <p class="privacy-text">
            By continuing with Google, you agree to our
            <a href="/terms" target="_blank" class="privacy-link">Terms of Service</a>
            and
            <a href="/privacy" target="_blank" class="privacy-link">Privacy Policy</a>.
          </p>
        </div>
      }

      <!-- Loading Overlay -->
      @if (isLoading()) {
        <div class="loading-overlay">
          <div class="loading-spinner">
            <svg class="animate-spin" width="24" height="24" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.25" fill="none"/>
              <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
            </svg>
          </div>
        </div>
      }
    </div>
  `,
  styleUrls: ['./google-signup.component.css']
})
export class GoogleSignupComponent implements OnInit, OnDestroy {
  @Input() fullWidth = false;
  @Input() showPrivacyNotice = true;
  @Input() usePopup = true;
  @Input() clientId = '';
  @Input() additionalScopes: string[] = [];
  @Input() signupConfig: GoogleSignupConfig = {};

  @Output() signupSuccess = new EventEmitter<GoogleSignupResponse>();
  @Output() signupError = new EventEmitter<GoogleAuthError>();
  @Output() signupStarted = new EventEmitter<void>();
  @Output() signupCancelled = new EventEmitter<void>();

  private readonly googleAuth = inject(GoogleAuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // Reactive state - made public for template access
  public authError = signal<GoogleAuthError | null>(null);
  public isLoading = signal(false);
  public isCompletingSignup = signal(false);
  private showAdditionalForm = signal(false);
  private pendingSignupData = signal<any>(null);
  private subscriptions = new Subscription();

  // Configuration - made public for template access
  public config = signal<GoogleSignupConfig>({
    showMarketingConsent: true,
    showReferralCode: false,
    redirectAfterSignup: '/dashboard',
    theme: 'light',
    size: 'medium',
    ...this.signupConfig
  });

  // Computed properties
  public isReady = computed(() => this.googleAuth.isReady());
  public showOneTap = computed(() => !this.usePopup && this.isReady());
  public showAdditionalOptions = computed(() => this.showAdditionalForm());

  // Additional options form with proper typing
  additionalForm = this.fb.group({
    marketingConsent: [false],
    referralCode: ['', [Validators.maxLength(20)]]
  });

  get marketingControl(): FormControl<boolean | null> {
    return this.additionalForm.get('marketingConsent') as FormControl<boolean | null>;
  }

  get referralCodeControl(): FormControl<string | null> {
    return this.additionalForm.get('referralCode') as FormControl<string | null>;
  }

  ngOnInit(): void {
    // Update config signal when input changes
    this.config.set({
      ...this.config(),
      ...this.signupConfig
    });

    this.initializeGoogleAuth();
    this.setupSubscriptions();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private async initializeGoogleAuth(): Promise<void> {
    if (!this.clientId) {
      this.authError.set({
        code: GoogleAuthErrorCodes.CONFIGURATION_ERROR,
        message: 'Google Client ID is required'
      });
      return;
    }

    try {
      const authConfig: GoogleAuthConfig = {
        clientId: this.clientId,
        redirectUri: `${window.location.origin}/auth/google/callback`,
        scope: [
          'openid',
          'email',
          'profile',
          ...this.additionalScopes
        ],
        responseType: 'code',
        accessType: 'offline',
        prompt: 'select_account'
      };

      await this.googleAuth.initialize(authConfig);
    } catch (error) {
      this.authError.set(error as GoogleAuthError);
      this.signupError.emit(error as GoogleAuthError);
    }
  }

  private setupSubscriptions(): void {
    // Listen to auth service state changes
    this.subscriptions.add(
      this.googleAuth.authStatus$.subscribe(status => {
        if (status === 'loading') {
          this.isLoading.set(true);
        } else {
          this.isLoading.set(false);
        }
      })
    );

    // Listen to errors from auth service - fixed subscription
    const errorSignal = this.googleAuth.error();
    if (errorSignal && typeof errorSignal === 'object' && 'subscribe' in errorSignal) {
      this.subscriptions.add(
        (errorSignal as any).subscribe((error: GoogleAuthError) => {
          if (error) {
            this.authError.set(error);
            this.signupError.emit(error);
          }
        })
      );
    }
  }

  async handleGoogleSignup(): Promise<void> {
    try {
      this.isLoading.set(true);
      this.authError.set(null);
      this.signupStarted.emit();

      let signupResponse: GoogleSignupResponse;

      if (this.usePopup) {
        signupResponse = await this.googleAuth.signupWithPopup();
      } else {
        // Use redirect flow
        this.googleAuth.signupWithRedirect();
        return; // Will complete after redirect
      }

      await this.handleSignupSuccess(signupResponse);

    } catch (error) {
      this.handleSignupError(error as GoogleAuthError);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async handleSignupSuccess(response: GoogleSignupResponse): Promise<void> {
    // Check if additional information is required
    if (response.requiresAdditionalInfo || this.config().showMarketingConsent || this.config().showReferralCode) {
      this.pendingSignupData.set(response);
      this.showAdditionalForm.set(true);
    } else {
      await this.completeSignupFlow(response);
    }
  }

  async completeSignup(): Promise<void> {
    const pendingData = this.pendingSignupData();
    if (!pendingData) return;

    try {
      this.isCompletingSignup.set(true);

      const formData = this.additionalForm.value;

      // Send additional data to backend if needed
      const updatedResponse = await this.updateUserProfile({
        userId: pendingData.user.id,
        marketingConsent: formData.marketingConsent ?? undefined,
        referralCode: formData.referralCode ?? undefined
      });

      await this.completeSignupFlow({
        ...pendingData,
        ...updatedResponse
      });

    } catch (error) {
      this.handleSignupError(error as GoogleAuthError);
    } finally {
      this.isCompletingSignup.set(false);
    }
  }

  skipAdditionalOptions(): void {
    const pendingData = this.pendingSignupData();
    if (pendingData) {
      this.completeSignupFlow(pendingData);
    }
  }

  private async completeSignupFlow(response: GoogleSignupResponse): Promise<void> {
    // Emit success event
    this.signupSuccess.emit(response);

    // Navigate to configured route
    const redirectRoute = this.config().redirectAfterSignup;
    if (redirectRoute) {
      await this.router.navigate([redirectRoute]);
    }

    // Reset form state
    this.showAdditionalForm.set(false);
    this.pendingSignupData.set(null);
  }

  private handleSignupError(error: GoogleAuthError): void {
    this.authError.set(error);
    this.signupError.emit(error);

    // Reset states
    this.showAdditionalForm.set(false);
    this.pendingSignupData.set(null);
  }

  private async updateUserProfile(data: { userId: string; marketingConsent?: boolean; referralCode?: string }): Promise<any> {
    // This would call your backend to update user profile
    // Implementation depends on your backend API
    console.log('Updating user profile with:', data);
    return {};
  }

  // Template helper methods
  getButtonText(): string {
    if (this.isLoading()) {
      return 'Connecting to Google...';
    }
    return 'Continue with Google';
  }

  getErrorMessage(): string {
    const error = this.authError();
    if (!error) return '';

    switch (error.code) {
      case GoogleAuthErrorCodes.POPUP_BLOCKED:
        return 'Please allow popups for this site and try again.';
      case GoogleAuthErrorCodes.POPUP_CLOSED:
        return 'Sign-in was cancelled. Please try again.';
      case GoogleAuthErrorCodes.ACCESS_DENIED:
        return 'Access was denied. Please grant permission to continue.';
      case GoogleAuthErrorCodes.NETWORK_ERROR:
        return 'Network error. Please check your connection and try again.';
      case GoogleAuthErrorCodes.INVALID_CLIENT:
        return 'Configuration error. Please contact support.';
      case GoogleAuthErrorCodes.USER_CANCELLED:
        return 'Sign-in was cancelled.';
      case GoogleAuthErrorCodes.CONFIGURATION_ERROR:
        return 'Service configuration error. Please contact support.';
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }

  // Public methods for parent components
  public async retry(): Promise<void> {
    this.authError.set(null);
    await this.handleGoogleSignup();
  }
}

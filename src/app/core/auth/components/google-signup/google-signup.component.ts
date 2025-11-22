import { Component, Input, Output, EventEmitter, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';

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
    ReactiveFormsModule,
    ButtonComponent,
    FormInputComponent
],
  templateUrl: 'google-signup.component.html',
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
  // Fix: Changed to a standard signal so we can update it manually after init
  public isReady = signal(false);

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

  async ngOnInit(): Promise<void> {
    // Update config signal when input changes
    this.config.set({
      ...this.config(),
      ...this.signupConfig
    });

    await this.initializeGoogleAuth();
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
      // Fix: Explicitly set ready state after initialization succeeds
      //this.isReady.set(true);
      this.isReady.set(false)

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
        return;
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

  async skipAdditionalOptions(): Promise<void> {
    const pendingData = this.pendingSignupData();
    if (pendingData) {
      await this.completeSignupFlow(pendingData);
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

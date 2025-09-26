import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { FormInputComponent } from '../../../../shared/ui/form-input.component';
import { PasswordGeneratorComponent } from '../../../../shared/ui/password-generator.component';
import { ButtonComponent } from '../../../../shared/ui/button.component';
import { PasswordStrengthComponent } from '../../../../shared/ui/password-strength.component';
import { CustomValidators } from '../../../../shared/validators/custom-validators';
import { AuthError, AuthErrorCodes } from '../../models/auth.model';
import { GoogleSignupComponent } from '../google-signup/google-signup.component';
import { GoogleSignupResponse, GoogleAuthError } from '../../models/google-auth.model';
import { environment } from '../../../../../environments/environment';
import {FooterComponent} from '../../../../shared/components/navbar/footer/footer.component';
import {HeaderComponent} from '../../../../shared/components/navbar/header/header.component';

interface SignupFormData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
  marketing: boolean;
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FormInputComponent,
    ButtonComponent,
    PasswordStrengthComponent,
    PasswordGeneratorComponent,
    GoogleSignupComponent,
    FooterComponent,
    HeaderComponent
  ],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Form setup with improved validators
  signupForm = this.fb.group({
    fullName: ['', [
      Validators.required,
      Validators.minLength(2),
      Validators.maxLength(50),
      CustomValidators.noWhitespace()
    ]],
    email: ['', [
      Validators.required,
      Validators.email,
      Validators.maxLength(100)
    ]],
    password: ['', [
      Validators.required,
      CustomValidators.strongPassword()
    ]],
    confirmPassword: ['', [Validators.required]],
    terms: [false, [Validators.requiredTrue]],
    marketing: [false]
  }, {
    validators: [CustomValidators.passwordMatch('password', 'confirmPassword')]
  });

  // Reactive state
  currentPassword = signal('');
  authError = signal<AuthError | null>(null);
  isLoading = signal(false);
  showPasswordGen = signal(false);

  // Google signup configuration
  googleConfig = {
    showMarketingConsent: true,
    showReferralCode: false,
    redirectAfterSignup: '/dashboard',
    theme: 'light' as const,
    size: 'medium' as const
  };

  // Google signup state
  googleSignupInProgress = signal(false);
  googleError = signal<GoogleAuthError | null>(null);

  // Computed properties for better UX
  isFormValid = computed(() => this.signupForm.valid);

  // Form controls for easier access
  get fullNameControl() { return this.signupForm.get('fullName') as FormControl; }
  get emailControl() { return this.signupForm.get('email') as FormControl; }
  get passwordControl() { return this.signupForm.get('password') as FormControl; }
  get confirmPasswordControl() { return this.signupForm.get('confirmPassword') as FormControl; }
  get termsControl() { return this.signupForm.get('terms') as FormControl; }
  get marketingControl() { return this.signupForm.get('marketing') as FormControl; }

  // Make environment available to template
  environment = environment;

  constructor() {
    // Subscribe to password changes for strength indicator
    this.passwordControl.valueChanges.subscribe(value => {
      this.currentPassword.set(value || '');
    });

    // Clear auth errors when form changes
    this.signupForm.valueChanges.subscribe(() => {
      if (this.authError()) {
        this.authError.set(null);
      }
    });
  }

  // Form submission with comprehensive error handling
  async onSubmit(): Promise<void> {
    if (this.signupForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading.set(true);
    this.authError.set(null);

    try {
      const formValue = this.signupForm.value as SignupFormData;

      const user = await this.authService.signup({
        name: formValue.fullName.trim(),
        email: formValue.email.toLowerCase().trim(),
        password: formValue.password
      });

      // Success - navigate to dashboard or email verification
      if (user.emailVerified) {
        await this.router.navigate(['/dashboard']);
      } else {
        await this.router.navigate(['/auth/verify-email'], {
          queryParams: { email: user.email }
        });
      }
    } catch (error) {
      this.handleAuthError(error as AuthError);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Password generator methods
  showPasswordGenerator(): void {
    this.showPasswordGen.set(true);
  }

  hidePasswordGenerator(): void {
    this.showPasswordGen.set(false);
  }

  onPasswordGenerated(password: string): void {
    this.signupForm.patchValue({
      password: password,
      confirmPassword: password
    });
    this.currentPassword.set(password);
    this.hidePasswordGenerator();

    // Mark password fields as touched to show validation
    this.passwordControl.markAsTouched();
    this.confirmPasswordControl.markAsTouched();
  }

  // Checkbox toggle methods
  toggleTerms(): void {
    const current = this.termsControl.value;
    this.termsControl.patchValue(!current);
    this.termsControl.markAsTouched();
  }

  toggleMarketing(): void {
    const current = this.marketingControl.value;
    this.marketingControl.patchValue(!current);
  }

  // Google signup handlers
  onGoogleSignupStarted(): void {
    this.googleSignupInProgress.set(true);
    this.authError.set(null);
    this.googleError.set(null);
  }

  onGoogleSignupSuccess(response: GoogleSignupResponse): void {
    this.googleSignupInProgress.set(false);

    // Handle successful Google signup
    console.log('Google signup successful:', response);

    // You can add analytics tracking here
    if (environment.features.socialLoginTracking) {
      this.trackGoogleSignup(response);
    }

    // Navigate is handled by the Google component
  }

  onGoogleSignupError(error: GoogleAuthError): void {
    this.googleSignupInProgress.set(false);
    this.googleError.set(error);

    // Log error for debugging
    console.error('Google signup error:', error);
  }

  onGoogleSignupCancelled(): void {
    this.googleSignupInProgress.set(false);
    this.googleError.set(null);
  }

  private trackGoogleSignup(response: GoogleSignupResponse): void {
    // Add your analytics tracking here
    console.log('Tracking Google signup:', {
      userId: response.user.id,
      isNewUser: response.isNewUser,
      email: response.user.email
    });
  }

  // Helper method to check if any signup is in progress
  isAnySignupInProgress(): boolean {
    return this.isLoading() || this.googleSignupInProgress();
  }

  // Utility methods
  private markFormGroupTouched(): void {
    Object.keys(this.signupForm.controls).forEach(key => {
      const control = this.signupForm.get(key);
      control?.markAsTouched();
    });
  }

  private handleAuthError(error: AuthError): void {
    this.authError.set(error);

    // Handle specific error types
    switch (error.code) {
      case AuthErrorCodes.USER_EXISTS:
        this.emailControl.setErrors({ userExists: true });
        break;
      case AuthErrorCodes.WEAK_PASSWORD:
        this.passwordControl.setErrors({ weakPassword: true });
        break;
      case AuthErrorCodes.RATE_LIMITED:
        // Form-level error, already set in authError signal
        break;
      default:
        // Generic error handling
        break;
    }
  }

  getErrorMessage(): string {
    const error = this.authError();
    if (!error) return '';

    switch (error.code) {
      case AuthErrorCodes.USER_EXISTS:
        return 'An account with this email already exists. Try logging in instead.';
      case AuthErrorCodes.WEAK_PASSWORD:
        return 'Password is too weak. Please choose a stronger password.';
      case AuthErrorCodes.RATE_LIMITED:
        return 'Too many signup attempts. Please try again later.';
      case AuthErrorCodes.NETWORK_ERROR:
        return 'Network error occurred. Please check your connection and try again.';
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }
}

import { Component, signal, inject, OnInit } from '@angular/core';
import {
  FormBuilder,
  Validators,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthError, AuthErrorCodes } from '../../models/auth.model';
import { GoogleSignupComponent } from '../google-signup/google-signup.component';
import {
  GoogleSignupResponse,
  GoogleAuthError,
} from '../../models/google-auth.model';
import {FooterComponent} from '../../../../shared/components/navbar/footer/footer.component';
import {PasswordGeneratorComponent} from '../../../../shared/ui/password-generator/password-generator.component';
import {ButtonComponent} from '../../../../shared/ui/button/button.component';
import {FormInputComponent} from '../../../../shared/ui/form-input/form-input.component';
import {FormSelectComponent} from '../../../../shared/ui/form-select/form-select.component';
import {PasswordStrengthComponent} from '../../../../shared/ui/password-strength/password-strength.component';
import {Logo} from '../../../../shared/components/logo/logo';
import {environment} from '../../../../../environments/environment';
import {CustomValidators} from '../../../../shared/validators/custom-validators';
import {Professions} from '../../../../shared/ui/form-select/data/professions';
import {Countries, Country} from '../../../../shared/ui/form-select/data/countries';

interface SignupFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  terms_accepted: boolean;
  marketing_opt_in: boolean;
  dateOfBirth?: Date | string;
  profession?: string;
  organization?: string;
  country: string;
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterModule,
    FormInputComponent,
    FormSelectComponent,
    ButtonComponent,
    PasswordStrengthComponent,
    PasswordGeneratorComponent,
    GoogleSignupComponent,
    FooterComponent,
    Logo,
  ],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css'],
})
export class SignupComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Form setup with improved validators
  signupForm = this.fb.group(
    {
      firstName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(80),
          CustomValidators.noWhitespace(),
        ],
      ],
      lastName: [
        '',
        [
          Validators.required,
          Validators.minLength(2),
          Validators.maxLength(80),
          CustomValidators.noWhitespace(),
        ],
      ],
      email: [
        '',
        [Validators.required, Validators.email, Validators.maxLength(100)],
      ],
      password: ['', [Validators.required, CustomValidators.strongPassword()]],
      confirmPassword: ['', [Validators.required]],
      terms_accepted: [false, [Validators.requiredTrue]],
      marketing_opt_in: [false],
      dateOfBirth: [''],
      profession: [''],
      organization: ['', [Validators.maxLength(100)]],
      country: ['', [Validators.required]],
    },
    {
      validators: [
        CustomValidators.passwordMatch('password', 'confirmPassword'),
      ],
    }
  );

  // Reactive state
  currentPassword = signal('');
  authError = signal<AuthError | null>(null);
  isLoading = signal(false);
  showPasswordGen = signal(false);
  isFormValid = signal(false);
  passwordTouched = signal(false);
  formSubmitted = signal(false);
  showSuccessModal = signal(false);
  userEmail = signal('');

  // Multi-step form state
  currentStep = signal(1);
  isStep1Valid = signal(false);
  isStep2Valid = signal(false);
  isStep3Valid = signal(false);

  // Google signup configuration
  googleConfig = {
    showMarketingConsent: true,
    showReferralCode: false,
    redirectAfterSignup: '/dashboard',
    theme: 'light' as const,
    size: 'medium' as const,
  };

  // Google signup state
  googleSignupInProgress = signal(false);
  googleError = signal<GoogleAuthError | null>(null);


  // Form controls for easier access
  get firsNameControl() {
    return this.signupForm.get('firstName') as unknown as FormControl;
  }
  get lastNameControl() {
    return this.signupForm.get('lastName') as unknown as FormControl;
  }
  get emailControl() {
    return this.signupForm.get('email') as unknown as FormControl;
  }
  get passwordControl() {
    return this.signupForm.get('password') as unknown as FormControl;
  }
  get confirmPasswordControl() {
    return this.signupForm.get('confirmPassword') as unknown as FormControl;
  }
  get termsControl() {
    return this.signupForm.get('terms_accepted') as unknown as FormControl;
  }
  get marketingControl() {
    return this.signupForm.get('marketing_opt_in') as unknown as FormControl;
  }
  get professionControl() {
    return this.signupForm.get('profession') as unknown as FormControl;
  }
  get organizationControl() {
    return this.signupForm.get('organization') as unknown as FormControl;
  }
  get countryControl() {
    return this.signupForm.get('country') as unknown as FormControl;
  }
  get dateOfBirthControl() {
    return this.signupForm.get('dateOfBirth') as unknown as FormControl;
  }

  // Make environment available to template
  environment = environment;

  // Profession options for select dropdown
  professionOptions = Professions;

  // Country options for select dropdown with proper typing
  countryOptions = Countries.map((country: Country) => ({
    value: country.code,
    label: country.name,
    code: country.code,
    dial_code: country.dial_code,
    flag: country.flag
  }));

  constructor() {
    // Subscribe to password changes for strength indicator
    this.passwordControl.valueChanges.subscribe((value) => {
      this.currentPassword.set(value || '');
      console.log('Password changed:', value);
      console.log('Current password signal:', this.currentPassword());
      // Mark as touched when user starts typing
      if (value && value.length > 0) {
        this.passwordTouched.set(true);
      }
    });

    // Track form validity reactively
    this.signupForm.statusChanges.subscribe(() => {
      const isValid = this.signupForm.valid;
      console.log('Form status changed - Valid:', isValid);
      this.isFormValid.set(isValid);
      console.log('isFormValid signal:', this.isFormValid());

      // Update step validations
      this.updateStepValidations();
    });

    // Clear auth errors when form changes
    this.signupForm.valueChanges.subscribe(() => {
      if (this.authError()) {
        this.authError.set(null);
      }
      // Update form validity on value changes too
      const isValid = this.signupForm.valid;
      console.log('Form value changed - Valid:', isValid);
      this.isFormValid.set(isValid);

      // Update step validations
      this.updateStepValidations();
    });

    // Debug form validation (development only)
    if (!environment.production) {
      this.signupForm.statusChanges.subscribe(() => {
        console.log('Form Valid:', this.signupForm.valid);
        console.log('Form Errors:', this.getFormValidationErrors());
      });
    }
  }

  ngOnInit(): void {
    // Initialize form validity
    console.log('ngOnInit - Form valid:', this.signupForm.valid);
    this.isFormValid.set(this.signupForm.valid);
    console.log('ngOnInit - isFormValid signal:', this.isFormValid());

    // Initialize step validations
    this.updateStepValidations();
  }

  // Multi-step form methods
  private updateStepValidations(): void {
    // Step 1 fields: firstName, lastName, email
    const step1Valid =
      this.firsNameControl.valid &&
      this.lastNameControl.valid &&
      this.emailControl.valid;

    this.isStep1Valid.set(step1Valid);

    // Step 2 fields: password, confirmPassword, country
    const step2Valid =
      this.passwordControl.valid &&
      this.confirmPasswordControl.valid &&
      this.countryControl.valid;

    this.isStep2Valid.set(step2Valid);

    // Step 3 fields: terms_accepted (profession and organization are optional)
    const step3Valid = this.termsControl.valid;
    this.isStep3Valid.set(step3Valid);
  }

  goToNextStep(): void {
    if (this.currentStep() === 1) {
      // Mark step 1 fields as touched
      this.firsNameControl.markAsTouched();
      this.lastNameControl.markAsTouched();
      this.emailControl.markAsTouched();

      if (this.isStep1Valid()) {
        this.currentStep.set(2);
        this.authError.set(null);
      }
    } else if (this.currentStep() === 2) {
      // Mark step 2 fields as touched
      this.passwordControl.markAsTouched();
      this.confirmPasswordControl.markAsTouched();
      this.countryControl.markAsTouched();

      if (this.isStep2Valid()) {
        this.currentStep.set(3);
        this.authError.set(null);
      }
    }
  }

  goToPreviousStep(): void {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
      this.authError.set(null);
    }
  }

  // Helper method to get all form validation errors (for debugging)
  private getFormValidationErrors() {
    const errors: any = {};
    Object.keys(this.signupForm.controls).forEach(key => {
      const control = this.signupForm.get(key);
      if (control && control.errors) {
        errors[key] = control.errors;
      }
    });
    return errors;
  }

  // Form submission with comprehensive error handling
  async onSubmit(): Promise<void> {
    this.formSubmitted.set(true);

    if (this.signupForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading.set(true);
    this.authError.set(null);

    try {
      const formValue = this.signupForm.value as SignupFormData;

      // Convert dateOfBirth to ISO string if it's a Date object
      let dateOfBirthString: string | undefined;
      if (formValue.dateOfBirth) {
        if (formValue.dateOfBirth instanceof Date) {
          dateOfBirthString = formValue.dateOfBirth.toISOString().split('T')[0];
        } else {
          dateOfBirthString = formValue.dateOfBirth;
        }
      }

      const user = await this.authService.signup({
        firstName: formValue.firstName.trim(),
        lastName: formValue.lastName.trim(),
        email: formValue.email.toLowerCase().trim(),
        password: formValue.password,
        confirmPassword: formValue.confirmPassword,
        acceptTerms: formValue.terms_accepted,
        subscribeToMarketing: formValue.marketing_opt_in,
        profession: formValue.profession?.trim() || undefined,
        organization: formValue.organization?.trim() || undefined,
        country: formValue.country,
      });

      // Success - show success modal
      if (user && user.email) {
        this.userEmail.set(user.email);
        this.showSuccessModal.set(true);
      }
    } catch (error) {
      this.handleAuthError(error as AuthError);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Success modal methods
  closeSuccessModal(): void {
    this.showSuccessModal.set(false);
    this.resetForm();
  }

  resetForm(): void {
    this.signupForm.reset({
      terms_accepted: false,
      marketing_opt_in: false,
      country: '',
    });
    this.currentPassword.set('');
    this.passwordTouched.set(false);
    this.formSubmitted.set(false);
    this.authError.set(null);
    this.userEmail.set('');
    this.currentStep.set(1); // Reset to first step
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
      confirmPassword: password,
    });
    this.currentPassword.set(password);
    this.passwordTouched.set(true);
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
      email: response.user.email,
    });
  }

  // Helper method to check if any signup is in progress
  isAnySignupInProgress(): boolean {
    return this.isLoading() || this.googleSignupInProgress();
  }

  // Utility methods
  private markFormGroupTouched(): void {
    Object.keys(this.signupForm.controls).forEach((key) => {
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
        return (
          error.message || 'An unexpected error occurred. Please try again.'
        );
    }
  }

  // Helper method for date picker - max date is today (must be born in the past)
  getMaxBirthDate(): Date {
    return new Date();
  }
}

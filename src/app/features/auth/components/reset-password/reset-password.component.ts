import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PasswordResetConfirm, AuthError, PasswordResetValidation } from '../../models/auth.model';
import { PasswordStrengthComponent } from '../../../../shared/ui/password-strength/password-strength.component';

interface ResetPasswordState {
  isLoading: boolean;
  isValidatingToken: boolean;
  isSuccess: boolean;
  error: string | null;
  tokenValid: boolean;
  userEmail: string | null;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <img class="mx-auto h-12 w-auto" src="/assets/logo.svg" alt="UnravelDocs">
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          @if (state().userEmail) {
            <p class="mt-2 text-center text-sm text-gray-600">
              Setting new password for <strong>{{ state().userEmail }}</strong>
            </p>
          }
        </div>

        @if (state().isValidatingToken) {
          <div class="flex justify-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
          <p class="text-center text-gray-600">Validating reset link...</p>
        } @else if (!state().tokenValid) {
          <div class="rounded-md bg-red-50 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">
                  Invalid or expired reset link
                </h3>
                <div class="mt-2 text-sm text-red-700">
                  <p>This password reset link is invalid or has expired. Please request a new one.</p>
                </div>
                <div class="mt-4">
                  <a
                    routerLink="/auth/forgot-password"
                    class="text-sm font-medium text-red-800 underline hover:text-red-600"
                  >
                    Request new reset link
                  </a>
                </div>
              </div>
            </div>
          </div>
        } @else if (state().isSuccess) {
          <div class="rounded-md bg-green-50 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-green-800">
                  Password reset successful!
                </h3>
                <div class="mt-2 text-sm text-green-700">
                  <p>Your password has been successfully updated. You can now sign in with your new password.</p>
                </div>
                <div class="mt-4">
                  <a
                    routerLink="/auth/login"
                    class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Go to sign in
                  </a>
                </div>
              </div>
            </div>
          </div>
        } @else {
          <form class="mt-8 space-y-6" [formGroup]="resetPasswordForm" (ngSubmit)="onSubmit()">
            @if (state().error) {
              <div class="rounded-md bg-red-50 p-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                    </svg>
                  </div>
                  <div class="ml-3">
                    <h3 class="text-sm font-medium text-red-800">
                      {{ state().error }}
                    </h3>
                  </div>
                </div>
              </div>
            }

            <div class="space-y-4">
              <div>
                <label for="newPassword" class="block text-sm font-medium text-gray-700">
                  New Password
                </label>
                <input
                  id="newPassword"
                  name="newPassword"
                  type="password"
                  autocomplete="new-password"
                  required
                  formControlName="newPassword"
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  [class.border-red-300]="resetPasswordForm.get('newPassword')?.invalid && resetPasswordForm.get('newPassword')?.touched"
                  placeholder="Enter new password"
                >
                @if (resetPasswordForm.get('newPassword')?.invalid && resetPasswordForm.get('newPassword')?.touched) {
                  <div class="mt-1 text-sm text-red-600">
                    @if (resetPasswordForm.get('newPassword')?.errors?.['required']) {
                      Password is required
                    }
                    @if (resetPasswordForm.get('newPassword')?.errors?.['minlength']) {
                      Password must be at least 8 characters long
                    }
                    @if (resetPasswordForm.get('newPassword')?.errors?.['pattern']) {
                      Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character
                    }
                  </div>
                }
              </div>

              <div>
                <label for="confirmPassword" class="block text-sm font-medium text-gray-700">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autocomplete="new-password"
                  required
                  formControlName="confirmPassword"
                  class="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  [class.border-red-300]="resetPasswordForm.get('confirmPassword')?.invalid && resetPasswordForm.get('confirmPassword')?.touched"
                  placeholder="Confirm new password"
                >
                @if (resetPasswordForm.get('confirmPassword')?.invalid && resetPasswordForm.get('confirmPassword')?.touched) {
                  <div class="mt-1 text-sm text-red-600">
                    @if (resetPasswordForm.get('confirmPassword')?.errors?.['required']) {
                      Please confirm your password
                    }
                    @if (resetPasswordForm.get('confirmPassword')?.errors?.['passwordMismatch']) {
                      Passwords do not match
                    }
                  </div>
                }
              </div>

              <!-- Password strength indicator -->
              @if (resetPasswordForm.get('newPassword')?.value) {
                <div class="space-y-2">
                  <div class="text-sm font-medium text-gray-700">Password strength:</div>
                  <div class="flex space-x-1">
                    @for (strength of passwordStrengthLevels; track strength.id) {
                      <div
                        class="h-2 flex-1 rounded"
                        [class]="getStrengthBarClass(strength.level)"
                      ></div>
                    }
                  </div>
                  <div class="text-xs text-gray-600">
                    {{ getPasswordStrengthText() }}
                  </div>
                </div>
              }
            </div>

            <div>
              <button
                type="submit"
                [disabled]="resetPasswordForm.invalid || state().isLoading"
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                @if (state().isLoading) {
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating password...
                } @else {
                  Update password
                }
              </button>
            </div>

            <div class="text-center">
              <a
                routerLink="/auth/login"
                class="font-medium text-blue-600 hover:text-blue-500"
              >
                Back to sign in
              </a>
            </div>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  private resetToken = '';

  // Using signals for reactive state management
  state = signal<ResetPasswordState>({
    isLoading: false,
    isValidatingToken: true,
    isSuccess: false,
    error: null,
    tokenValid: false,
    userEmail: null
  });

  passwordStrengthLevels = [
    { id: 1, level: 1 },
    { id: 2, level: 2 },
    { id: 3, level: 3 },
    { id: 4, level: 4 }
  ];

  resetPasswordForm: FormGroup = this.fb.group({
    newPassword: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    ]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: this.passwordMatchValidator });

  async ngOnInit(): Promise<void> {
    // Get token from query parameters
    this.route.queryParams.subscribe(async params => {
      const token = params['token'];
      if (token) {
        this.resetToken = token;
        await this.validateToken(token);
      } else {
        this.updateState({
          isValidatingToken: false,
          tokenValid: false,
          error: 'No reset token provided'
        });
      }
    });
  }

  private async validateToken(token: string): Promise<void> {
    try {
      const validation: PasswordResetValidation = await this.authService.validateResetToken(token);

      this.updateState({
        isValidatingToken: false,
        tokenValid: validation.isValid,
        userEmail: validation.email || null,
        error: validation.isValid ? null : 'Invalid or expired reset token'
      });
    } catch (error) {
      const authError = error as AuthError;
      this.updateState({
        isValidatingToken: false,
        tokenValid: false,
        error: this.getErrorMessage(authError)
      });
    }
  }

  async onSubmit(): Promise<void> {
    if (this.resetPasswordForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const { newPassword, confirmPassword } = this.resetPasswordForm.value;
    this.updateState({ isLoading: true, error: null });

    try {
      const request: PasswordResetConfirm = {
        token: this.resetToken,
        newPassword,
        confirmPassword
      };

      await this.authService.resetPassword(request);

      this.updateState({
        isLoading: false,
        isSuccess: true
      });
    } catch (error) {
      const authError = error as AuthError;
      this.updateState({
        isLoading: false,
        error: this.getErrorMessage(authError)
      });
    }
  }

  private passwordMatchValidator(control: AbstractControl): { [key: string]: any } | null {
    const password = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value
      ? null
      : { passwordMismatch: true };
  }

  getPasswordStrength(): number {
    const password = this.resetPasswordForm.get('newPassword')?.value || '';
    let strength = 0;

    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[@$!%*?&]/.test(password)) strength++;

    return Math.min(strength, 4);
  }

  getStrengthBarClass(level: number): string {
    const strength = this.getPasswordStrength();
    const baseClass = 'transition-colors duration-200 ';

    if (level <= strength) {
      if (strength <= 1) return baseClass + 'bg-red-500';
      if (strength <= 2) return baseClass + 'bg-yellow-500';
      if (strength <= 3) return baseClass + 'bg-blue-500';
      return baseClass + 'bg-green-500';
    }

    return baseClass + 'bg-gray-200';
  }

  getPasswordStrengthText(): string {
    const strength = this.getPasswordStrength();
    const texts = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong'];
    return texts[strength] || 'Very weak';
  }

  private updateState(partialState: Partial<ResetPasswordState>): void {
    this.state.update(current => ({ ...current, ...partialState }));
  }

  private markFormGroupTouched(): void {
    Object.keys(this.resetPasswordForm.controls).forEach(key => {
      const control = this.resetPasswordForm.get(key);
      control?.markAsTouched();
    });
  }

  private getErrorMessage(error: AuthError): string {
    switch (error.code) {
      case 'INVALID_TOKEN':
      case 'TOKEN_EXPIRED':
        return 'This reset link is invalid or has expired. Please request a new one.';
      case 'PASSWORD_TOO_WEAK':
        return 'Password does not meet security requirements.';
      case 'INVALID_REQUEST':
        return 'Invalid request. Please check your input and try again.';
      case 'SERVER_ERROR':
        return 'Server error. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }
}

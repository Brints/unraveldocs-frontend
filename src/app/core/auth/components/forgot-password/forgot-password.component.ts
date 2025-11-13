import { Component, signal, inject } from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PasswordResetRequest, AuthError } from '../../models/auth.model';

interface ForgotPasswordState {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  email: string;
}

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule, NgOptimizedImage],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <img class="mx-auto h-12 w-auto" ngSrc="/assets/logo.svg" alt="UnravelDocs" fill>
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Reset your password
          </h2>
          <p class="mt-2 text-center text-sm text-gray-600">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        @if (state().isSuccess) {
          <div class="rounded-md bg-green-50 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-green-800">
                  Email sent successfully!
                </h3>
                <div class="mt-2 text-sm text-green-700">
                  <p>
                    We've sent a password reset link to <strong>{{ state().email }}</strong>.
                    Please check your email and follow the instructions to reset your password.
                  </p>
                </div>
                <div class="mt-4">
                  <button
                    type="button"
                    (click)="resetForm()"
                    class="text-sm font-medium text-green-800 underline hover:text-green-600"
                  >
                    Send another email
                  </button>
                </div>
              </div>
            </div>
          </div>
        } @else {
          <form class="mt-8 space-y-6" [formGroup]="forgotPasswordForm" (ngSubmit)="onSubmit()">
            @if (state().error) {
              <div class="rounded-md bg-red-50 p-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clip-rule="evenodd"/>
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

            <div class="rounded-md shadow-sm -space-y-px">
              <div>
                <label for="email" class="sr-only">Email address</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autocomplete="email"
                  required
                  formControlName="email"
                  class="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  [class.border-red-300]="forgotPasswordForm.get('email')?.invalid && forgotPasswordForm.get('email')?.touched"
                  placeholder="Email address"
                >
                @if (forgotPasswordForm.get('email')?.invalid && forgotPasswordForm.get('email')?.touched) {
                  <div class="mt-1 text-sm text-red-600">
                    @if (forgotPasswordForm.get('email')?.errors?.['required']) {
                      Email is required
                    }
                    @if (forgotPasswordForm.get('email')?.errors?.['email']) {
                      Please enter a valid email address
                    }
                  </div>
                }
              </div>
            </div>

            <div>
              <button
                type="submit"
                [disabled]="forgotPasswordForm.invalid || state().isLoading"
                class="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                @if (state().isLoading) {
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none"
                       viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Sending...
                } @else {
                  Send reset link
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
export class ForgotPasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // Using signals for reactive state management
  state = signal<ForgotPasswordState>({
    isLoading: false,
    isSuccess: false,
    error: null,
    email: ''
  });

  forgotPasswordForm: FormGroup = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  async onSubmit(): Promise<void> {
    if (this.forgotPasswordForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const email = this.forgotPasswordForm.value.email;
    this.updateState({ isLoading: true, error: null });

    try {
      const request: PasswordResetRequest = { email };
      const response = await this.authService.forgotPassword(request);

      this.updateState({
        isLoading: false,
        isSuccess: true,
        email: email
      });
    } catch (error) {
      const authError = error as AuthError;
      this.updateState({
        isLoading: false,
        error: this.getErrorMessage(authError)
      });
    }
  }

  resetForm(): void {
    this.forgotPasswordForm.reset();
    this.updateState({
      isLoading: false,
      isSuccess: false,
      error: null,
      email: ''
    });
  }

  private updateState(partialState: Partial<ForgotPasswordState>): void {
    this.state.update(current => ({ ...current, ...partialState }));
  }

  private markFormGroupTouched(): void {
    Object.keys(this.forgotPasswordForm.controls).forEach(key => {
      const control = this.forgotPasswordForm.get(key);
      control?.markAsTouched();
    });
  }

  private getErrorMessage(error: AuthError): string {
    switch (error.code) {
      case 'USER_NOT_FOUND':
        return 'No account found with this email address.';
      case 'INVALID_REQUEST':
        return 'Please enter a valid email address.';
      case 'SERVER_ERROR':
        return 'Server error. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred. Please try again.';
    }
  }
}

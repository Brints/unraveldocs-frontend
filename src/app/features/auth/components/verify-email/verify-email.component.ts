import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EmailVerificationRequest, AuthError } from '../../models/auth.model';

interface EmailVerificationState {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  email: string | null;
}

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full space-y-8">
        <div>
          <img class="mx-auto h-12 w-auto" src="/assets/logo.svg" alt="UnravelDocs">
          <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Email Verification
          </h2>
        </div>

        @if (state().isLoading) {
          <div class="text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p class="mt-4 text-gray-600">Verifying your email address...</p>
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
                  Email verified successfully!
                </h3>
                <div class="mt-2 text-sm text-green-700">
                  <p>Your email address has been verified. You can now access all features of your account.</p>
                </div>
                <div class="mt-4">
                  <a
                    routerLink="/auth/login"
                    class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Continue to Sign In
                  </a>
                </div>
              </div>
            </div>
          </div>
        } @else if (state().error) {
          <div class="rounded-md bg-red-50 p-4">
            <div class="flex">
              <div class="flex-shrink-0">
                <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
              </div>
              <div class="ml-3">
                <h3 class="text-sm font-medium text-red-800">
                  Email verification failed
                </h3>
                <div class="mt-2 text-sm text-red-700">
                  <p>{{ state().error }}</p>
                </div>
                <div class="mt-4 space-x-2">
                  <button
                    type="button"
                    (click)="resendVerification()"
                    class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Resend verification email
                  </button>
                  <a
                    routerLink="/auth/signup"
                    class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Back to signup
                  </a>
                </div>
              </div>
            </div>
          </div>
        }

        <div class="text-center">
          <a
            routerLink="/auth/login"
            class="font-medium text-blue-600 hover:text-blue-500"
          >
            Back to sign in
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class VerifyEmailComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Using signals for reactive state management
  state = signal<EmailVerificationState>({
    isLoading: true,
    isSuccess: false,
    error: null,
    email: null
  });

  async ngOnInit(): Promise<void> {
    // Get verification token from query parameters
    this.route.queryParams.subscribe(async params => {
      const token = params['token'];
      const email = params['email'];

      if (token) {
        await this.verifyEmail(token);
      } else {
        this.updateState({
          isLoading: false,
          error: 'No verification token provided'
        });
      }

      if (email) {
        this.updateState({ email: decodeURIComponent(email) });
      }
    });
  }

  private async verifyEmail(token: string): Promise<void> {
    try {
      const request: EmailVerificationRequest = { token };
      await this.authService.verifyEmail(request);

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

  async resendVerification(): Promise<void> {
    if (!this.state().email) {
      this.updateState({ error: 'No email address available for resending verification' });
      return;
    }

    try {
      this.updateState({ isLoading: true, error: null });

      await this.authService.resendVerificationEmail(this.state().email!);

      this.updateState({
        isLoading: false,
        error: null
      });

      // Show success message
      alert('Verification email has been resent to ' + this.state().email);

    } catch (error) {
      const authError = error as AuthError;
      this.updateState({
        isLoading: false,
        error: this.getErrorMessage(authError)
      });
    }
  }

  private updateState(partialState: Partial<EmailVerificationState>): void {
    this.state.update(current => ({ ...current, ...partialState }));
  }

  private getErrorMessage(error: AuthError): string {
    switch (error.code) {
      case 'INVALID_TOKEN':
        return 'This verification link is invalid or has expired.';
      case 'TOKEN_EXPIRED':
        return 'This verification link has expired. Please request a new one.';
      case 'USER_NOT_FOUND':
        return 'No account found with this verification token.';
      case 'SERVER_ERROR':
        return 'Server error. Please try again later.';
      default:
        return error.message || 'An unexpected error occurred during email verification.';
    }
  }
}

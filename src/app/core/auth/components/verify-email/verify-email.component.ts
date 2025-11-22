import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { EmailVerificationRequest, AuthError, AuthErrorCodes } from '../../models/auth.model';

interface EmailVerificationState {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  email: string | null;
  resendSuccess: boolean;
  resendLoading: boolean;
  redirectCountdown: number;
}

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [RouterModule, NgOptimizedImage],
  templateUrl: 'verify-email.component.html',
  styleUrl: 'verify-email.component.css'
})
export class VerifyEmailComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private redirectTimer?: number;

  // Using signals for reactive state management
  state = signal<EmailVerificationState>({
    isLoading: true,
    isSuccess: false,
    error: null,
    email: null,
    resendSuccess: false,
    resendLoading: false,
    redirectCountdown: 5
  });

  async ngOnInit(): Promise<void> {
    // Get verification token from query parameters
    this.route.queryParams.subscribe(async params => {
      const token = params['token'];
      const email = params['email'];

      if (email) {
        this.updateState({ email: decodeURIComponent(email) });
      }

      if (token) {
        await this.verifyEmail(token, email);
      } else {
        this.updateState({
          isLoading: false,
          error: 'No verification token provided. Please use the link from your verification email.'
        });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.redirectTimer) {
      window.clearInterval(this.redirectTimer);
    }
  }

  private async verifyEmail(token: string, email: string): Promise<void> {
    try {
      const request: EmailVerificationRequest = { token, email };
      await this.authService.verifyEmail(request);

      this.updateState({
        isLoading: false,
        isSuccess: true
      });

      // Start countdown and redirect to login
      this.startRedirectCountdown();

    } catch (error) {
      const authError = error as AuthError;
      this.updateState({
        isLoading: false,
        error: this.getErrorMessage(authError)
      });
    }
  }

  private startRedirectCountdown(): void {
    this.redirectTimer = window.setInterval(async () => {
      const currentCountdown = this.state().redirectCountdown;
      if (currentCountdown > 1) {
        this.updateState({ redirectCountdown: currentCountdown - 1 });
      } else {
        if (this.redirectTimer) {
          window.clearInterval(this.redirectTimer);
        }
        await this.router.navigate(['/auth/login']);
      }
    }, 1000);
  }

  async redirectNow(): Promise<void> {
    if (this.redirectTimer) {
      window.clearInterval(this.redirectTimer);
    }
    await this.router.navigate(['/auth/login']);
  }

  async resendVerification(): Promise<void> {
    if (!this.state().email) {
      this.updateState({ error: 'No email address available for resending verification. Please sign up again.' });
      return;
    }

    try {
      this.updateState({ resendLoading: true, resendSuccess: false, error: null });

      await this.authService.resendVerificationEmail(this.state().email!);

      this.updateState({
        resendLoading: false,
        resendSuccess: true,
        error: null
      });

      // Clear success message after 5 seconds
      setTimeout(() => {
        this.updateState({ resendSuccess: false });
      }, 5000);

    } catch (error) {
      const authError = error as AuthError;
      this.updateState({
        resendLoading: false,
        resendSuccess: false,
        error: this.getErrorMessage(authError)
      });
    }
  }

  private updateState(partialState: Partial<EmailVerificationState>): void {
    this.state.update(current => ({ ...current, ...partialState }));
  }

  private getErrorMessage(error: AuthError): string {
    // Map specific backend messages
    const message = error.message?.toLowerCase() || '';

    if (message.includes('user does not exist')) {
      return 'No account found with this email address. Please sign up first.';
    }

    if (message.includes('token has expired')) {
      return 'This verification link has expired. Please request a new verification email.';
    }

    if (message.includes('invalid') && message.includes('token')) {
      return 'This verification link is invalid. Please check your email or request a new verification link.';
    }

    // Fallback to error codes
    switch (error.code) {
      case AuthErrorCodes.InvalidToken:
        return 'This verification link is invalid or has been used already.';
      case AuthErrorCodes.TokenExpired:
        return 'This verification link has expired. Please request a new one.';
      case AuthErrorCodes.UserNotFound:
        return 'No account found. Please check your email or sign up again.';
      case AuthErrorCodes.ServerError:
        return 'Server error. Please try again later.';
      case AuthErrorCodes.NotFound:
        return 'Verification failed. The requested resource was not found.';
      default:
        return error.message || 'An unexpected error occurred during email verification. Please try again.';
    }
  }
}

import { Component, signal, inject } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PasswordResetRequest, AuthError } from '../../models/auth.model';

interface ForgotPasswordState {
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
  email: string;
  isRateLimited: boolean;
  rateLimitMessage: string | null;
}

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, NgOptimizedImage],
  templateUrl: 'forgot-password.component.html',
  styleUrl: 'forgot-password.component.css'
})
export class ForgotPasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  // Using signals for reactive state management
  state = signal<ForgotPasswordState>({
    isLoading: false,
    isSuccess: false,
    error: null,
    email: '',
    isRateLimited: false,
    rateLimitMessage: null
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
      await this.authService.forgotPassword(request);

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
      email: '',
      isRateLimited: false,
      rateLimitMessage: null
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
    // Extract backend message first
    const message = error.message?.toLowerCase() || '';

    // Check for rate limiting / duplicate reset request
    if (message.includes('already been sent') || message.includes('token expires in')) {
      // Extract the time remaining if present
      const timeMatch = error.message?.match(/expires in[:\s]+([^.]+)/i);
      const timeRemaining = timeMatch ? timeMatch[1] : '1 hour';

      this.updateState({
        isRateLimited: true,
        rateLimitMessage: `A password reset link has already been sent to your email. Please check your inbox and spam folder. The link expires in ${timeRemaining}.`
      });

      return this.state().rateLimitMessage!;
    }

    // Use error codes as fallback
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


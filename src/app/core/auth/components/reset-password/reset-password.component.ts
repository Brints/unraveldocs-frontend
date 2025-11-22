import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PasswordResetConfirm, AuthError } from '../../models/auth.model';

interface ResetPasswordState {
  isLoading: boolean;
  isValidatingToken: boolean;
  isSuccess: boolean;
  error: string | null;
  tokenValid: boolean;
  userEmail: string | null;
  redirectCountdown: number;
  showPassword: boolean;
  showConfirmPassword: boolean;
}

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule, NgOptimizedImage],
  templateUrl: 'reset-password.component.html',
  styleUrl: 'reset-password.component.css'
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(FormBuilder);

  private resetToken = '';
  private redirectTimer?: number;

  // Using signals for reactive state management
  state = signal<ResetPasswordState>({
    isLoading: false,
    isValidatingToken: true,
    isSuccess: false,
    error: null,
    tokenValid: false,
    userEmail: null,
    redirectCountdown: 5,
    showPassword: false,
    showConfirmPassword: false
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
    // Get token and email from query parameters
    this.route.queryParams.subscribe(params => {
      const token = params['token'];
      const email = params['email'];

      if (token && email) {
        this.resetToken = token;
        this.updateState({
          isValidatingToken: false,
          tokenValid: true,
          userEmail: email
        });
      } else {
        this.updateState({
          isValidatingToken: false,
          tokenValid: false,
          error: 'Invalid reset link. Missing token or email parameter.'
        });
      }
    });
  }

  ngOnDestroy(): void {
    if (this.redirectTimer) {
      window.clearInterval(this.redirectTimer);
    }
  }


  async onSubmit(): Promise<void> {
    if (this.resetPasswordForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    const { newPassword, confirmPassword } = this.resetPasswordForm.value;
    const email = this.state().userEmail;

    if (!email) {
      this.updateState({
        error: 'Email is missing. Please use the link from your email.'
      });
      return;
    }

    this.updateState({ isLoading: true, error: null });

    try {
      const request: PasswordResetConfirm = {
        email: email,
        token: this.resetToken,
        newPassword: newPassword,
        confirmNewPassword: confirmPassword
      };

      await this.authService.resetPassword(request);

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
    this.redirectTimer = window.setInterval(() => {
      const currentCountdown = this.state().redirectCountdown;
      if (currentCountdown > 1) {
        this.updateState({ redirectCountdown: currentCountdown - 1 });
      } else {
        if (this.redirectTimer) {
          window.clearInterval(this.redirectTimer);
        }
        this.router.navigate(['/auth/login']);
      }
    }, 1000);
  }

  redirectNow(): void {
    if (this.redirectTimer) {
      window.clearInterval(this.redirectTimer);
    }
    this.router.navigate(['/auth/login']);
  }

  togglePasswordVisibility(): void {
    this.updateState({ showPassword: !this.state().showPassword });
  }

  toggleConfirmPasswordVisibility(): void {
    this.updateState({ showConfirmPassword: !this.state().showConfirmPassword });
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
    // Extract backend message first
    const message = error.message?.toLowerCase() || '';

    // Check for specific backend messages
    if (message.includes('invalid') && message.includes('token')) {
      return 'This reset link is invalid or has already been used. Please request a new one.';
    }

    if (message.includes('expired')) {
      return 'This reset link has expired. Please request a new one.';
    }

    // Use error codes as fallback
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


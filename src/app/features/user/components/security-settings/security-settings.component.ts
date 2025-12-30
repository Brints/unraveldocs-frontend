import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { UserApiService } from '../../services/user-api.service';
import { UserStateService } from '../../services/user-state.service';
import { ChangePasswordRequest, LoginHistoryEntry, Session } from '../../models/user.model';

@Component({
  selector: 'app-security-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './security-settings.component.html',
  styleUrls: ['./security-settings.component.css']
})
export class SecuritySettingsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly userApi = inject(UserApiService);
  private readonly userState = inject(UserStateService);

  // Forms
  passwordForm!: FormGroup;

  // State
  isChangingPassword = signal(false);
  passwordSuccess = signal(false);
  passwordError = signal<string | null>(null);

  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  twoFactorEnabled = signal(false);
  isEnabling2FA = signal(false);
  twoFactorQRCode = signal<string | null>(null);
  twoFactorSecret = signal<string | null>(null);

  loginHistory = signal<LoginHistoryEntry[]>([]);
  activeSessions = signal<Session[]>([]);
  isLoadingSessions = signal(true);

  // Password strength
  passwordStrength = signal<{ score: number; label: string; color: string }>({
    score: 0,
    label: 'Enter a password',
    color: 'gray'
  });

  ngOnInit(): void {
    this.initPasswordForm();
    this.loadSecurityData();
  }

  private initPasswordForm(): void {
    this.passwordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        this.passwordStrengthValidator.bind(this)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });

    // Watch new password for strength calculation
    this.passwordForm.get('newPassword')?.valueChanges.subscribe(value => {
      this.calculatePasswordStrength(value);
    });
  }

  private loadSecurityData(): void {
    this.isLoadingSessions.set(true);

    // Load mock data for now
    setTimeout(() => {
      this.loadMockLoginHistory();
      this.loadMockSessions();
      this.isLoadingSessions.set(false);
    }, 1000);
  }

  private loadMockLoginHistory(): void {
    this.loginHistory.set([
      {
        id: '1',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        ipAddress: '192.168.1.1',
        location: 'Lagos, Nigeria',
        device: 'MacBook Pro',
        browser: 'Chrome 120',
        status: 'success'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        ipAddress: '192.168.1.1',
        location: 'Lagos, Nigeria',
        device: 'iPhone 15',
        browser: 'Safari Mobile',
        status: 'success'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        ipAddress: '10.0.0.5',
        location: 'Unknown',
        device: 'Windows PC',
        browser: 'Firefox 121',
        status: 'failed'
      },
      {
        id: '4',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        ipAddress: '192.168.1.1',
        location: 'Lagos, Nigeria',
        device: 'MacBook Pro',
        browser: 'Chrome 120',
        status: 'success'
      }
    ]);
  }

  private loadMockSessions(): void {
    this.activeSessions.set([
      {
        id: '1',
        device: 'MacBook Pro',
        browser: 'Chrome 120',
        location: 'Lagos, Nigeria',
        ipAddress: '192.168.1.1',
        lastActive: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        isCurrent: true
      },
      {
        id: '2',
        device: 'iPhone 15',
        browser: 'Safari Mobile',
        location: 'Lagos, Nigeria',
        ipAddress: '192.168.1.2',
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        isCurrent: false
      }
    ]);
  }

  // Password validation
  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(value);

    const isValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecial;

    return isValid ? null : { weakPassword: true };
  }

  private passwordMatchValidator(group: FormGroup): ValidationErrors | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  private calculatePasswordStrength(password: string): void {
    if (!password) {
      this.passwordStrength.set({ score: 0, label: 'Enter a password', color: 'gray' });
      return;
    }

    let score = 0;

    // Length checks
    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (password.length >= 16) score += 1;

    // Character type checks
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score += 1;

    const strengthMap: { [key: number]: { label: string; color: string } } = {
      0: { label: 'Very Weak', color: 'red' },
      1: { label: 'Very Weak', color: 'red' },
      2: { label: 'Weak', color: 'orange' },
      3: { label: 'Fair', color: 'yellow' },
      4: { label: 'Good', color: 'lime' },
      5: { label: 'Strong', color: 'green' },
      6: { label: 'Very Strong', color: 'green' },
      7: { label: 'Excellent', color: 'emerald' }
    };

    const strength = strengthMap[Math.min(score, 7)];
    this.passwordStrength.set({ score: Math.min(score, 7), ...strength });
  }

  // Form submission
  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.markFormTouched();
      return;
    }

    this.isChangingPassword.set(true);
    this.passwordSuccess.set(false);
    this.passwordError.set(null);

    const formValue = this.passwordForm.value;
    const request: ChangePasswordRequest = {
      currentPassword: formValue.currentPassword,
      newPassword: formValue.newPassword,
      confirmPassword: formValue.confirmPassword
    };

    this.userApi.changePassword(request).subscribe({
      next: () => {
        this.isChangingPassword.set(false);
        this.passwordSuccess.set(true);
        this.passwordForm.reset();
        this.passwordStrength.set({ score: 0, label: 'Enter a password', color: 'gray' });

        setTimeout(() => this.passwordSuccess.set(false), 5000);
      },
      error: (error) => {
        this.isChangingPassword.set(false);
        this.passwordError.set(error.error?.message || 'Failed to change password');
      }
    });
  }

  // Two-Factor Authentication
  toggleTwoFactor(): void {
    if (this.twoFactorEnabled()) {
      this.disable2FA();
    } else {
      this.enable2FA();
    }
  }

  private enable2FA(): void {
    this.isEnabling2FA.set(true);

    this.userApi.enableTwoFactor('authenticator').subscribe({
      next: (response) => {
        this.twoFactorQRCode.set(response.qrCode);
        this.twoFactorSecret.set(response.secret);
        this.isEnabling2FA.set(false);
      },
      error: (error) => {
        this.isEnabling2FA.set(false);
        console.error('Enable 2FA error:', error);
      }
    });
  }

  private disable2FA(): void {
    this.userApi.disableTwoFactor().subscribe({
      next: () => {
        this.twoFactorEnabled.set(false);
        this.twoFactorQRCode.set(null);
        this.twoFactorSecret.set(null);
      },
      error: (error) => {
        console.error('Disable 2FA error:', error);
      }
    });
  }

  confirm2FASetup(): void {
    this.twoFactorEnabled.set(true);
    this.twoFactorQRCode.set(null);
    this.twoFactorSecret.set(null);
  }

  cancel2FASetup(): void {
    this.twoFactorQRCode.set(null);
    this.twoFactorSecret.set(null);
  }

  // Session management
  revokeSession(sessionId: string): void {
    this.userApi.revokeSession(sessionId).subscribe({
      next: () => {
        this.activeSessions.update(sessions =>
          sessions.filter(s => s.id !== sessionId)
        );
      },
      error: (error) => {
        console.error('Revoke session error:', error);
      }
    });
  }

  revokeAllOtherSessions(): void {
    this.userApi.revokeAllOtherSessions().subscribe({
      next: () => {
        this.activeSessions.update(sessions =>
          sessions.filter(s => s.isCurrent)
        );
      },
      error: (error) => {
        console.error('Revoke all sessions error:', error);
      }
    });
  }

  // Helpers
  private markFormTouched(): void {
    Object.keys(this.passwordForm.controls).forEach(key => {
      this.passwordForm.get(key)?.markAsTouched();
    });
  }

  togglePasswordVisibility(field: 'current' | 'new' | 'confirm'): void {
    switch (field) {
      case 'current':
        this.showCurrentPassword.update(v => !v);
        break;
      case 'new':
        this.showNewPassword.update(v => !v);
        break;
      case 'confirm':
        this.showConfirmPassword.update(v => !v);
        break;
    }
  }

  getErrorMessage(controlName: string): string | null {
    const control = this.passwordForm.get(controlName);
    if (!control?.touched || !control.errors) return null;

    if (control.errors['required']) return 'This field is required';
    if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} characters required`;
    if (control.errors['weakPassword']) return 'Password must include uppercase, lowercase, number, and special character';

    return null;
  }

  hasError(controlName: string): boolean {
    const control = this.passwordForm.get(controlName);
    return !!(control?.touched && control?.errors);
  }

  hasFormError(errorName: string): boolean {
    return this.passwordForm.hasError(errorName) &&
           this.passwordForm.get('confirmPassword')?.touched === true;
  }

  formatTimeAgo(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  }

  getDeviceIcon(device: string): string {
    const lower = device.toLowerCase();
    if (lower.includes('iphone') || lower.includes('android') || lower.includes('mobile')) {
      return 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z';
    }
    if (lower.includes('ipad') || lower.includes('tablet')) {
      return 'M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z';
    }
    return 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z';
  }
}


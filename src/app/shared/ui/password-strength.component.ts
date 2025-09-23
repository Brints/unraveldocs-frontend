import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  color: string;
  label: string;
}

@Component({
  selector: 'app-password-strength',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="password()" class="password-strength-container">
      <div class="strength-header">
        <span class="strength-label">Password Strength:</span>
        <span class="strength-score" [style.color]="strength().color">
          {{ strength().label }}
        </span>
      </div>

      <div class="strength-bar">
        <div
          class="strength-fill"
          [style.width.%]="(strength().score / 4) * 100"
          [style.background-color]="strength().color">
        </div>
      </div>

      <div *ngIf="showFeedback && strength().feedback.length > 0" class="feedback">
        <ul class="feedback-list">
          <li *ngFor="let item of strength().feedback" class="feedback-item">
            {{ item }}
          </li>
        </ul>
      </div>

      <div class="requirements" *ngIf="showRequirements">
        <div class="requirement" [class.met]="hasUppercase()">
          <span class="requirement-icon">{{ hasUppercase() ? '✓' : '○' }}</span>
          Uppercase letter
        </div>
        <div class="requirement" [class.met]="hasLowercase()">
          <span class="requirement-icon">{{ hasLowercase() ? '✓' : '○' }}</span>
          Lowercase letter
        </div>
        <div class="requirement" [class.met]="hasNumber()">
          <span class="requirement-icon">{{ hasNumber() ? '✓' : '○' }}</span>
          Number
        </div>
        <div class="requirement" [class.met]="hasSpecialChar()">
          <span class="requirement-icon">{{ hasSpecialChar() ? '✓' : '○' }}</span>
          Special character
        </div>
        <div class="requirement" [class.met]="hasMinLength()">
          <span class="requirement-icon">{{ hasMinLength() ? '✓' : '○' }}</span>
          At least 8 characters
        </div>
      </div>
    </div>
  `,
  styles: [`
    .password-strength-container {
      margin-top: 0.5rem;
      padding: 0.75rem;
      background-color: #f9fafb;
      border-radius: 0.5rem;
      border: 1px solid #e5e7eb;
    }

    .strength-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .strength-label {
      font-size: 0.875rem;
      color: #374151;
      font-weight: 500;
    }

    .strength-score {
      font-size: 0.875rem;
      font-weight: 600;
    }

    .strength-bar {
      width: 100%;
      height: 0.25rem;
      background-color: #e5e7eb;
      border-radius: 0.125rem;
      overflow: hidden;
      margin-bottom: 0.75rem;
    }

    .strength-fill {
      height: 100%;
      transition: all 0.3s ease;
      border-radius: 0.125rem;
    }

    .feedback {
      margin-bottom: 0.75rem;
    }

    .feedback-list {
      margin: 0;
      padding-left: 1rem;
      font-size: 0.875rem;
      color: #6b7280;
    }

    .feedback-item {
      margin-bottom: 0.25rem;
    }

    .requirements {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 0.5rem;
    }

    .requirement {
      display: flex;
      align-items: center;
      font-size: 0.875rem;
      color: #6b7280;
      transition: color 0.2s ease;
    }

    .requirement.met {
      color: #059669;
    }

    .requirement-icon {
      margin-right: 0.5rem;
      font-weight: bold;
      width: 1rem;
      text-align: center;
    }

    .requirement.met .requirement-icon {
      color: #059669;
    }
  `]
})
export class PasswordStrengthComponent {
  @Input() showFeedback = true;
  @Input() showRequirements = true;

  password = signal('');

  @Input() set value(password: string) {
    this.password.set(password || '');
  }

  // Individual requirement checks
  hasUppercase = computed(() => /[A-Z]/.test(this.password()));
  hasLowercase = computed(() => /[a-z]/.test(this.password()));
  hasNumber = computed(() => /[0-9]/.test(this.password()));
  hasSpecialChar = computed(() => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(this.password()));
  hasMinLength = computed(() => this.password().length >= 8);

  strength = computed((): PasswordStrength => {
    const pwd = this.password();
    if (!pwd) {
      return {
        score: 0,
        feedback: [],
        color: '#e5e7eb',
        label: 'No password'
      };
    }

    let score = 0;
    const feedback: string[] = [];

    // Length check
    if (pwd.length >= 8) {
      score += 1;
    } else {
      feedback.push('Use at least 8 characters');
    }

    // Character variety checks
    if (this.hasUppercase()) score += 1;
    else feedback.push('Add uppercase letters');

    if (this.hasLowercase()) score += 1;
    else feedback.push('Add lowercase letters');

    if (this.hasNumber()) score += 1;
    else feedback.push('Add numbers');

    if (this.hasSpecialChar()) score += 1;
    else feedback.push('Add special characters');

    // Additional complexity checks
    if (pwd.length >= 12) score += 1;
    if (this.hasNoRepeatingChars(pwd)) score += 1;
    if (this.hasNoDictionaryWords(pwd)) score += 1;

    // Cap at 4 for display purposes
    score = Math.min(score, 4);

    return {
      score,
      feedback,
      ...this.getStrengthDisplay(score)
    };
  });

  private getStrengthDisplay(score: number): { color: string; label: string } {
    switch (score) {
      case 0:
      case 1:
        return { color: '#dc2626', label: 'Very Weak' };
      case 2:
        return { color: '#ea580c', label: 'Weak' };
      case 3:
        return { color: '#ca8a04', label: 'Fair' };
      case 4:
        return { color: '#059669', label: 'Strong' };
      default:
        return { color: '#16a34a', label: 'Very Strong' };
    }
  }

  private hasNoRepeatingChars(password: string): boolean {
    // Check for 3+ consecutive repeating characters
    return !/(.)\1{2,}/.test(password);
  }

  private hasNoDictionaryWords(password: string): boolean {
    // Basic check for common dictionary words
    const commonWords = [
      'password', 'admin', 'user', 'login', 'welcome', 'hello',
      'qwerty', 'abc123', '123456', 'password123', 'admin123'
    ];

    const lowerPassword = password.toLowerCase();
    return !commonWords.some(word => lowerPassword.includes(word));
  }
}

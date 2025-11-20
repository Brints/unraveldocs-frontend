import { Component, Input, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface PasswordStrengthCriteria {
  minLength: boolean;
  hasLowercase: boolean;
  hasUppercase: boolean;
  hasNumber: boolean;
  hasSpecialChar: boolean;
}

@Component({
  selector: 'app-password-strength',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'password-strength.component.html',
  styleUrls: ['password-strength.component.css'],
})
export class PasswordStrengthComponent {
  @Input() set password(value: string) {
    this._password.set(value || '');
  }

  get password(): string {
    return this._password();
  }

  private _password = signal('');
  @Input() minLength = 8;
  @Input() showCriteria = true;

  maxScore = 5;
  strengthLevels = [1, 2, 3, 4, 5];

  // Computed password criteria
  criteria = computed((): PasswordStrengthCriteria => {
    const pwd = this._password();
    return {
      minLength: pwd.length >= this.minLength,
      hasLowercase: /[a-z]/.test(pwd),
      hasUppercase: /[A-Z]/.test(pwd),
      hasNumber: /\d/.test(pwd),
      hasSpecialChar: /[@$!%*?&]/.test(pwd),
    };
  });

  // Computed strength score
  score = computed((): number => {
    const c = this.criteria();
    let score = 0;

    if (c.minLength) score++;
    if (c.hasLowercase) score++;
    if (c.hasUppercase) score++;
    if (c.hasNumber) score++;
    if (c.hasSpecialChar) score++;

    return score;
  });

  getStrengthBarClass(level: number): string {
    const score = this.score();
    const baseClass = 'transition-colors duration-200 ';

    if (level <= score) {
      if (score <= 1) return baseClass + 'bg-red-500';
      if (score <= 2) return baseClass + 'bg-yellow-500';
      if (score <= 3) return baseClass + 'bg-blue-500';
      if (score <= 4) return baseClass + 'bg-green-400';
      return baseClass + 'bg-green-500';
    }

    return baseClass + 'bg-gray-200';
  }

  getStrengthText(): string {
    const score = this.score();
    const texts = [
      'Very weak',
      'Weak',
      'Fair',
      'Good',
      'Strong',
      'Very strong',
    ];
    return texts[score] || 'Very weak';
  }

  getStrengthTextClass(): string {
    const score = this.score();

    if (score <= 1) return 'text-red-600';
    if (score <= 2) return 'text-yellow-600';
    if (score <= 3) return 'text-blue-600';
    if (score <= 4) return 'text-green-600';
    return 'text-green-700';
  }
}

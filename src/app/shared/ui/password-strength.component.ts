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
  template: `
    <div class="password-strength-indicator">
      <!-- Strength bars -->
      <div class="flex space-x-1 mb-2">
        @for (level of strengthLevels; track level) {
          <div
            class="h-2 flex-1 rounded transition-colors duration-200"
            [class]="getStrengthBarClass(level)"
          ></div>
        }
      </div>

      <!-- Strength text -->
      <div class="flex justify-between items-center mb-2">
        <span class="text-sm font-medium" [class]="getStrengthTextClass()">
          {{ getStrengthText() }}
        </span>
        <span class="text-xs text-gray-500">
          {{ score() }}/{{ maxScore }}
        </span>
      </div>

      <!-- Criteria checklist -->
      @if (showCriteria && password()) {
        <div class="space-y-1">
          <div class="flex items-center space-x-2">
            <svg
              class="w-4 h-4"
              [class]="criteria().minLength ? 'text-green-500' : 'text-gray-400'"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            <span class="text-xs" [class]="criteria().minLength ? 'text-green-700' : 'text-gray-600'">
              At least {{ minLength }} characters
            </span>
          </div>

          <div class="flex items-center space-x-2">
            <svg
              class="w-4 h-4"
              [class]="criteria().hasLowercase ? 'text-green-500' : 'text-gray-400'"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            <span class="text-xs" [class]="criteria().hasLowercase ? 'text-green-700' : 'text-gray-600'">
              One lowercase letter
            </span>
          </div>

          <div class="flex items-center space-x-2">
            <svg
              class="w-4 h-4"
              [class]="criteria().hasUppercase ? 'text-green-500' : 'text-gray-400'"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            <span class="text-xs" [class]="criteria().hasUppercase ? 'text-green-700' : 'text-gray-600'">
              One uppercase letter
            </span>
          </div>

          <div class="flex items-center space-x-2">
            <svg
              class="w-4 h-4"
              [class]="criteria().hasNumber ? 'text-green-500' : 'text-gray-400'"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            <span class="text-xs" [class]="criteria().hasNumber ? 'text-green-700' : 'text-gray-600'">
              One number
            </span>
          </div>

          <div class="flex items-center space-x-2">
            <svg
              class="w-4 h-4"
              [class]="criteria().hasSpecialChar ? 'text-green-500' : 'text-gray-400'"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
            </svg>
            <span class="text-xs" [class]="criteria().hasSpecialChar ? 'text-green-700' : 'text-gray-600'">
              One special character
            </span>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class PasswordStrengthComponent {
  @Input() password = signal('');
  @Input() minLength = 8;
  @Input() showCriteria = true;

  maxScore = 5;
  strengthLevels = [1, 2, 3, 4, 5];

  // Computed password criteria
  criteria = computed((): PasswordStrengthCriteria => {
    const pwd = this.password();
    return {
      minLength: pwd.length >= this.minLength,
      hasLowercase: /[a-z]/.test(pwd),
      hasUppercase: /[A-Z]/.test(pwd),
      hasNumber: /\d/.test(pwd),
      hasSpecialChar: /[@$!%*?&]/.test(pwd)
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
    const texts = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
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

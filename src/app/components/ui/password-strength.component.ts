import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

interface PasswordRule {
  id: string;
  text: string;
  regex: RegExp;
  met: boolean;
}

@Component({
  selector: 'app-password-strength',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-xl" *ngIf="password">
      <div class="flex items-center justify-between mb-3">
        <h4 class="text-sm font-semibold text-gray-700">Password Requirements</h4>
        <div class="flex-1 mx-3 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            class="h-full transition-all duration-500 ease-out rounded-full"
            [style.width.%]="strengthPercentage"
            [class]="strengthClass"
          ></div>
        </div>
        <span
          class="text-xs font-medium uppercase tracking-wide"
          [class]="strengthClass"
        >{{ strengthLabel }}</span>
      </div>

      <ul class="space-y-2">
        <li
          *ngFor="let rule of passwordRules"
          class="flex items-center gap-2 text-sm transition-colors duration-200"
          [class]="rule.met ? 'text-green-600' : 'text-red-500'"
        >
          <div class="w-4 h-4 flex-shrink-0">
            <svg *ngIf="rule.met" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
            <svg *ngIf="!rule.met" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </div>
          <span>{{ rule.text }}</span>
        </li>
      </ul>
    </div>
  `
})
export class PasswordStrengthComponent implements OnChanges {
  @Input() password: string = '';

  passwordRules: PasswordRule[] = [
    {
      id: 'minLength',
      text: 'At least 8 characters',
      regex: /.{8,}/,
      met: false
    },
    {
      id: 'uppercase',
      text: 'Contains uppercase letter',
      regex: /[A-Z]/,
      met: false
    },
    {
      id: 'lowercase',
      text: 'Contains lowercase letter',
      regex: /[a-z]/,
      met: false
    },
    {
      id: 'number',
      text: 'Contains number',
      regex: /[0-9]/,
      met: false
    },
    {
      id: 'special',
      text: 'Contains special character',
      regex: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/,
      met: false
    }
  ];

  strengthPercentage: number = 0;
  strengthLabel: string = 'Weak';
  strengthClass: string = 'weak';

  ngOnChanges(changes: SimpleChanges) {
    if (changes['password']) {
      this.checkPasswordStrength();
    }
  }

  private checkPasswordStrength() {
    if (!this.password) {
      this.resetStrength();
      return;
    }

    // Check each rule
    this.passwordRules.forEach(rule => {
      rule.met = rule.regex.test(this.password);
    });

    // Calculate strength
    const metRules = this.passwordRules.filter(rule => rule.met).length;
    this.strengthPercentage = (metRules / this.passwordRules.length) * 100;

    // Set strength label and class
    if (metRules <= 1) {
      this.strengthLabel = 'Weak';
      this.strengthClass = 'weak text-red-600 bg-red-500';
    } else if (metRules <= 2) {
      this.strengthLabel = 'Fair';
      this.strengthClass = 'fair text-yellow-600 bg-yellow-500';
    } else if (metRules <= 4) {
      this.strengthLabel = 'Good';
      this.strengthClass = 'good text-blue-600 bg-blue-500';
    } else {
      this.strengthLabel = 'Strong';
      this.strengthClass = 'strong text-green-600 bg-green-500';
    }
  }

  private resetStrength() {
    this.passwordRules.forEach(rule => {
      rule.met = false;
    });
    this.strengthPercentage = 0;
    this.strengthLabel = 'Weak';
    this.strengthClass = 'weak text-red-600 bg-red-500';
  }

  get isStrong(): boolean {
    return this.passwordRules.every(rule => rule.met);
  }

  get metRequirements(): number {
    return this.passwordRules.filter(rule => rule.met).length;
  }
}

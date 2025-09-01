import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface CharacterSet {
  id: string;
  label: string;
  chars: string;
  enabled: boolean;
  required: boolean;
}

@Component({
  selector: 'app-password-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Backdrop -->
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" (click)="onBackdropClick($event)">
      <!-- Modal -->
      <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md" (click)="$event.stopPropagation()">
        <!-- Header -->
        <div class="flex items-center justify-between p-6 border-b border-gray-200">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl flex items-center justify-center">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900">Password Generator</h3>
              <p class="text-sm text-gray-600">Create a secure password</p>
            </div>
          </div>
          <button class="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500 hover:text-gray-700" (click)="closeModal()">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Content -->
        <div class="p-6 space-y-6">
          <!-- Generated Password Display -->
          <div class="space-y-3">
            <label class="block text-sm font-semibold text-gray-700">Generated Password</label>
            <div class="relative">
              <input
                type="text"
                [value]="generatedPassword"
                readonly
                class="w-full px-4 py-3 pr-20 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50 font-mono text-sm"
                placeholder="Click 'Generate Password' to create a password"
              >
              <button
                *ngIf="generatedPassword"
                class="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200"
                [class]="isCopied ? 'bg-green-50 border-green-300 text-green-700 border' : 'bg-white border border-gray-300 hover:bg-gray-50'"
                (click)="copyToClipboard()"
              >
                <svg *ngIf="!isCopied" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                </svg>
                <svg *ngIf="isCopied" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                </svg>
                <span class="ml-1 text-xs">{{ isCopied ? 'Copied!' : 'Copy' }}</span>
              </button>
            </div>
          </div>

          <!-- Password Length -->
          <div class="space-y-3">
            <label class="block text-sm font-semibold text-gray-700">
              Password Length: <span class="text-blue-600">{{ passwordLength }}</span>
            </label>
            <input
              type="range"
              min="8"
              max="32"
              [(ngModel)]="passwordLength"
              (input)="onLengthChange()"
              class="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            >
            <div class="flex justify-between text-xs text-gray-500">
              <span>8</span>
              <span>32</span>
            </div>
          </div>

          <!-- Character Sets -->
          <div class="space-y-4">
            <label class="block text-sm font-semibold text-gray-700">Character Types</label>
            <div class="space-y-3">
              <div *ngFor="let charset of characterSets" class="flex items-start gap-3">
                <label class="flex items-start gap-3 cursor-pointer group">
                  <div class="relative">
                    <input
                      type="checkbox"
                      [(ngModel)]="charset.enabled"
                      [disabled]="charset.required"
                      (change)="generatePassword()"
                      class="sr-only"
                    >
                    <div
                      class="w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center"
                      [class]="charset.enabled
                        ? 'bg-blue-600 border-blue-600'
                        : 'bg-white border-gray-300 group-hover:border-blue-400'"
                    >
                      <svg *ngIf="charset.enabled" class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                      </svg>
                    </div>
                  </div>
                  <div class="flex-1">
                    <span class="text-sm font-medium text-gray-700">{{ charset.label }}</span>
                    <div class="text-xs text-gray-500 mt-1 font-mono">{{ getCharPreview(charset.chars) }}</div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <!-- Exclude Similar Characters -->
          <div class="flex items-start gap-3">
            <label class="flex items-start gap-3 cursor-pointer group">
              <div class="relative">
                <input
                  type="checkbox"
                  [(ngModel)]="excludeSimilar"
                  (change)="generatePassword()"
                  class="sr-only"
                >
                <div
                  class="w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center"
                  [class]="excludeSimilar
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white border-gray-300 group-hover:border-blue-400'"
                >
                  <svg *ngIf="excludeSimilar" class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <span class="text-sm font-medium text-gray-700">Exclude similar characters</span>
                <div class="text-xs text-gray-500 mt-1 font-mono">Excludes: 0, O, l, I, 1</div>
              </div>
            </label>
          </div>

          <!-- Exclude Ambiguous Characters -->
          <div class="flex items-start gap-3">
            <label class="flex items-start gap-3 cursor-pointer group">
              <div class="relative">
                <input
                  type="checkbox"
                  [(ngModel)]="excludeAmbiguous"
                  (change)="generatePassword()"
                  class="sr-only"
                >
                <div
                  class="w-5 h-5 border-2 rounded transition-all duration-200 flex items-center justify-center"
                  [class]="excludeAmbiguous
                    ? 'bg-blue-600 border-blue-600'
                    : 'bg-white border-gray-300 group-hover:border-blue-400'"
                >
                  <svg *ngIf="excludeAmbiguous" class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                  </svg>
                </div>
              </div>
              <div class="flex-1">
                <span class="text-sm font-medium text-gray-700">Exclude ambiguous characters</span>
                <div class="text-xs text-gray-500 mt-1 font-mono">{{ ambiguousCharsText }}</div>
              </div>
            </label>
          </div>
        </div>

        <!-- Footer -->
        <div class="flex gap-3 p-6 bg-gray-50 rounded-b-2xl">
          <button
            class="flex-1 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:bg-gray-50 hover:border-gray-400"
            (click)="generatePassword()"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Generate Password
          </button>
          <button
            class="flex-1 bg-gradient-to-r from-blue-500 to-blue-700 text-white px-4 py-2 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            (click)="usePassword()"
            [disabled]="!generatedPassword"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Use Password
          </button>
        </div>
      </div>
    </div>
  `
})
export class PasswordGeneratorComponent {
  @Output() passwordGenerated = new EventEmitter<string>();
  @Output() modalClosed = new EventEmitter<void>();

  generatedPassword = '';
  passwordLength = 12;
  isCopied = false;
  excludeSimilar = false;
  excludeAmbiguous = false;

  characterSets: CharacterSet[] = [
    {
      id: 'lowercase',
      label: 'Lowercase letters',
      chars: 'abcdefghijklmnopqrstuvwxyz',
      enabled: true,
      required: true
    },
    {
      id: 'uppercase',
      label: 'Uppercase letters',
      chars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
      enabled: true,
      required: false
    },
    {
      id: 'numbers',
      label: 'Numbers',
      chars: '0123456789',
      enabled: true,
      required: false
    },
    {
      id: 'symbols',
      label: 'Symbols',
      chars: '!@#$%^&*()_+-=[]{}|;:,.<>?',
      enabled: true,
      required: false
    }
  ];

  similarChars = '0Ol1I';
  ambiguousChars = '{}[]()/\\\'"`~,;.<>';

  get ambiguousCharsText(): string {
    return `Excludes: ${this.ambiguousChars}`;
  }

  ngOnInit() {
    this.generatePassword();
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  closeModal() {
    this.modalClosed.emit();
  }

  onLengthChange() {
    this.generatePassword();
  }

  getCharPreview(chars: string): string {
    return chars.length > 20 ? chars.substring(0, 20) + '...' : chars;
  }

  generatePassword() {
    let availableChars = '';

    // Build character set
    this.characterSets.forEach(set => {
      if (set.enabled) {
        availableChars += set.chars;
      }
    });

    // Remove excluded characters
    if (this.excludeSimilar) {
      availableChars = availableChars.split('').filter(char =>
        !this.similarChars.includes(char)
      ).join('');
    }

    if (this.excludeAmbiguous) {
      availableChars = availableChars.split('').filter(char =>
        !this.ambiguousChars.includes(char)
      ).join('');
    }

    if (availableChars.length === 0) {
      this.generatedPassword = '';
      return;
    }

    // Generate password ensuring at least one character from each enabled set
    let password = '';
    const enabledSets = this.characterSets.filter(set => set.enabled);

    // Add one character from each enabled set
    enabledSets.forEach(set => {
      let setChars = set.chars;
      if (this.excludeSimilar) {
        setChars = setChars.split('').filter(char => !this.similarChars.includes(char)).join('');
      }
      if (this.excludeAmbiguous) {
        setChars = setChars.split('').filter(char => !this.ambiguousChars.includes(char)).join('');
      }
      if (setChars.length > 0) {
        password += setChars.charAt(Math.floor(Math.random() * setChars.length));
      }
    });

    // Fill remaining length with random characters
    for (let i = password.length; i < this.passwordLength; i++) {
      password += availableChars.charAt(Math.floor(Math.random() * availableChars.length));
    }

    // Shuffle the password
    this.generatedPassword = password.split('').sort(() => Math.random() - 0.5).join('');
  }

  async copyToClipboard() {
    try {
      await navigator.clipboard.writeText(this.generatedPassword);
      this.isCopied = true;
      setTimeout(() => {
        this.isCopied = false;
      }, 2000);
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  }

  usePassword() {
    this.passwordGenerated.emit(this.generatedPassword);
    this.closeModal();
  }
}


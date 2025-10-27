import { Component, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from './button.component';

@Component({
  selector: 'app-password-generator',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  template: `
    <div class="password-generator">
      <div class="generator-header">
        <h3>Password Generator</h3>
        <button
          type="button"
          class="close-btn"
          (click)="close()"
          aria-label="Close password generator">
          ×
        </button>
      </div>

      <div class="generator-options">
        <div class="option">
          <label for="length-slider">Length: {{ length() }}</label>
          <input
            id="length-slider"
            type="range"
            min="8"
            max="32"
            [value]="length()"
            (input)="updateLength($event)"
            class="length-slider">
        </div>

        <div class="checkbox-options">
          <label class="checkbox-option">
            <input
              type="checkbox"
              [checked]="includeUppercase()"
              (change)="toggleUppercase()">
            <span>Uppercase letters (A-Z)</span>
          </label>

          <label class="checkbox-option">
            <input
              type="checkbox"
              [checked]="includeLowercase()"
              (change)="toggleLowercase()">
            <span>Lowercase letters (a-z)</span>
          </label>

          <label class="checkbox-option">
            <input
              type="checkbox"
              [checked]="includeNumbers()"
              (change)="toggleNumbers()">
            <span>Numbers (0-9)</span>
          </label>

          <label class="checkbox-option">
            <input
              type="checkbox"
              [checked]="includeSymbols()"
              (change)="toggleSymbols()">
            <span>Symbols (!&#64;#$%^&*)</span>
          </label>

          <label class="checkbox-option">
            <input
              type="checkbox"
              [checked]="excludeSimilar()"
              (change)="toggleExcludeSimilar()">
            <span>Exclude similar characters (0, O, l, I)</span>
          </label>
        </div>
      </div>

      <div class="generated-password">
        <label for="generated-pwd">Generated Password:</label>
        <div class="password-display">
          <input
            id="generated-pwd"
            type="text"
            [value]="generatedPassword()"
            readonly
            class="password-input">
          <app-button
            variant="outline"
            size="sm"
            (clicked)="copyToClipboard()"
            [disabled]="!generatedPassword()">
            {{ copySuccess() ? 'Copied!' : 'Copy' }}
          </app-button>
        </div>
      </div>

      <div class="generator-actions">
        <app-button
          variant="secondary"
          (clicked)="generatePassword()"
          [disabled]="!hasValidOptions()">
          Generate Password
        </app-button>

        <app-button
          variant="primary"
          (clicked)="usePassword()"
          [disabled]="!generatedPassword()">
          Use This Password
        </app-button>
      </div>
    </div>
  `,
  styles: [`
    .password-generator {
      background: white;
      border-radius: 0.75rem;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
      padding: 1.5rem;
      width: 100%;
      max-width: 500px;
      margin: 0 auto;
    }

    .generator-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .generator-header h3 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 600;
      color: #111827;
    }

    .close-btn {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #6b7280;
      padding: 0.25rem;
      line-height: 1;
    }

    .close-btn:hover {
      color: #374151;
    }

    .generator-options {
      margin-bottom: 1.5rem;
    }

    .option {
      margin-bottom: 1rem;
    }

    .option label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .length-slider {
      width: 100%;
      height: 0.5rem;
      border-radius: 0.25rem;
      background: #e5e7eb;
      outline: none;
      cursor: pointer;
    }

    .checkbox-options {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .checkbox-option {
      display: flex;
      align-items: center;
      cursor: pointer;
      font-size: 0.875rem;
    }

    .checkbox-option input[type="checkbox"] {
      margin-right: 0.75rem;
      cursor: pointer;
    }

    .generated-password {
      margin-bottom: 1.5rem;
    }

    .generated-password label {
      display: block;
      font-weight: 500;
      color: #374151;
      margin-bottom: 0.5rem;
    }

    .password-display {
      display: flex;
      gap: 0.5rem;
    }

    .password-input {
      flex: 1;
      padding: 0.75rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-family: monospace;
      font-size: 0.875rem;
      background-color: #f9fafb;
    }

    .generator-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: flex-end;
    }

    @media (max-width: 640px) {
      .generator-actions {
        flex-direction: column;
      }

      .password-display {
        flex-direction: column;
      }
    }
  `]
})
export class PasswordGeneratorComponent {
  @Output() passwordGenerated = new EventEmitter<string>();
  @Output() closed = new EventEmitter<void>();

  length = signal(12);
  includeUppercase = signal(true);
  includeLowercase = signal(true);
  includeNumbers = signal(true);
  includeSymbols = signal(true);
  excludeSimilar = signal(false);
  generatedPassword = signal('');
  copySuccess = signal(false);

  private readonly UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  private readonly LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
  private readonly NUMBERS = '0123456789';
  private readonly SYMBOLS = '!@#$%^&*()_+-=[]{}|;:,.<>?';
  private readonly SIMILAR = '0Ol1I';

  ngOnInit() {
    this.generatePassword();
  }

  updateLength(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.length.set(parseInt(target.value));
    this.generatePassword();
  }

  toggleUppercase(): void {
    this.includeUppercase.update(val => !val);
    this.generatePassword();
  }

  toggleLowercase(): void {
    this.includeLowercase.update(val => !val);
    this.generatePassword();
  }

  toggleNumbers(): void {
    this.includeNumbers.update(val => !val);
    this.generatePassword();
  }

  toggleSymbols(): void {
    this.includeSymbols.update(val => !val);
    this.generatePassword();
  }

  toggleExcludeSimilar(): void {
    this.excludeSimilar.update(val => !val);
    this.generatePassword();
  }

  hasValidOptions(): boolean {
    return this.includeUppercase() || this.includeLowercase() ||
      this.includeNumbers() || this.includeSymbols();
  }

  generatePassword(): void {
    if (!this.hasValidOptions()) {
      this.generatedPassword.set('');
      return;
    }

    let charset = '';
    const requiredChars: string[] = [];

    if (this.includeUppercase()) {
      const chars = this.excludeSimilar() ?
        this.UPPERCASE.replace(/[OI]/g, '') : this.UPPERCASE;
      charset += chars;
      requiredChars.push(this.getRandomChar(chars));
    }

    if (this.includeLowercase()) {
      const chars = this.excludeSimilar() ?
        this.LOWERCASE.replace(/[ol]/g, '') : this.LOWERCASE;
      charset += chars;
      requiredChars.push(this.getRandomChar(chars));
    }

    if (this.includeNumbers()) {
      const chars = this.excludeSimilar() ?
        this.NUMBERS.replace(/[0]/g, '') : this.NUMBERS;
      charset += chars;
      requiredChars.push(this.getRandomChar(chars));
    }

    if (this.includeSymbols()) {
      charset += this.SYMBOLS;
      requiredChars.push(this.getRandomChar(this.SYMBOLS));
    }

    // Generate remaining characters
    const remainingLength = this.length() - requiredChars.length;
    const randomChars = Array.from({ length: remainingLength }, () =>
      this.getRandomChar(charset)
    );

    // Combine and shuffle
    const allChars = [...requiredChars, ...randomChars];
    const password = this.shuffleArray(allChars).join('');

    this.generatedPassword.set(password);
  }

  private getRandomChar(charset: string): string {
    const randomIndex = Math.floor(Math.random() * charset.length);
    return charset[randomIndex];
  }

  private shuffleArray(array: string[]): string[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  async copyToClipboard(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.generatedPassword());
      this.copySuccess.set(true);
      setTimeout(() => this.copySuccess.set(false), 2000);
    } catch (err) {
      console.error('Failed to copy password:', err);
    }
  }

  usePassword(): void {
    this.passwordGenerated.emit(this.generatedPassword());
  }

  close(): void {
    this.closed.emit();
  }
}

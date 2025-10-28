import { Component, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-password-generator',
  standalone: true,
  imports: [CommonModule, ButtonComponent],
  templateUrl: 'password-generator.component.html',
  styleUrls: ['password-generator.component.css'],
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
    this.includeUppercase.update((val) => !val);
    this.generatePassword();
  }

  toggleLowercase(): void {
    this.includeLowercase.update((val) => !val);
    this.generatePassword();
  }

  toggleNumbers(): void {
    this.includeNumbers.update((val) => !val);
    this.generatePassword();
  }

  toggleSymbols(): void {
    this.includeSymbols.update((val) => !val);
    this.generatePassword();
  }

  toggleExcludeSimilar(): void {
    this.excludeSimilar.update((val) => !val);
    this.generatePassword();
  }

  hasValidOptions(): boolean {
    return (
      this.includeUppercase() ||
      this.includeLowercase() ||
      this.includeNumbers() ||
      this.includeSymbols()
    );
  }

  generatePassword(): void {
    if (!this.hasValidOptions()) {
      this.generatedPassword.set('');
      return;
    }

    let charset = '';
    const requiredChars: string[] = [];

    if (this.includeUppercase()) {
      const chars = this.excludeSimilar()
        ? this.UPPERCASE.replace(/[OI]/g, '')
        : this.UPPERCASE;
      charset += chars;
      requiredChars.push(this.getRandomChar(chars));
    }

    if (this.includeLowercase()) {
      const chars = this.excludeSimilar()
        ? this.LOWERCASE.replace(/[ol]/g, '')
        : this.LOWERCASE;
      charset += chars;
      requiredChars.push(this.getRandomChar(chars));
    }

    if (this.includeNumbers()) {
      const chars = this.excludeSimilar()
        ? this.NUMBERS.replace(/[0]/g, '')
        : this.NUMBERS;
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

import { Component, Input, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl } from '@angular/forms';

@Component({
  selector: 'app-form-input',
  standalone: true,
  imports: [CommonModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormInputComponent),
      multi: true
    }
  ],
  template: `
    <div class="form-input-container">
      <label *ngIf="label" [for]="id" class="form-label"
             [class.required]="required"
             [class.error]="hasError()">
        {{ label }}
        <span *ngIf="required" class="required-asterisk">*</span>
      </label>

      <div class="input-wrapper" [class.error]="hasError()">
        <input
          [id]="id"
          [type]="type"
          [placeholder]="placeholder"
          [disabled]="disabled"
          [value]="value()"
          (input)="onInput($event)"
          (blur)="onBlur()"
          (focus)="onFocus()"
          class="form-input"
          [class.error]="hasError()"
          [attr.aria-describedby]="hasError() ? id + '-error' : null"
          [attr.aria-invalid]="hasError()"
        />

        <div *ngIf="icon" class="input-icon">
          <ng-content select="[slot=icon]"></ng-content>
        </div>

        <button
          *ngIf="type === 'password'"
          type="button"
          class="toggle-password"
          (click)="togglePasswordVisibility()"
          [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'">
          {{ showPassword() ? '👁️' : '👁️‍🗨️' }}
        </button>
      </div>

      <div *ngIf="hasError()" class="error-message" [id]="id + '-error'" role="alert">
        {{ errorMessage() }}
      </div>

      <div *ngIf="helpText && !hasError()" class="help-text">
        {{ helpText }}
      </div>
    </div>
  `,
  styles: [`
    .form-input-container {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      width: 100%;
    }

    .form-label {
      font-weight: 500;
      color: #374151;
      font-size: 0.875rem;
      transition: color 0.2s ease;
    }

    .form-label.required {
      font-weight: 600;
    }

    .form-label.error {
      color: #dc2626;
    }

    .required-asterisk {
      color: #dc2626;
      margin-left: 0.125rem;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .form-input {
      width: 100%;
      padding: 0.75rem 1rem;
      border: 1px solid #d1d5db;
      border-radius: 0.5rem;
      font-size: 1rem;
      transition: all 0.2s ease;
      background-color: white;
    }

    .form-input:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }

    .form-input:disabled {
      background-color: #f9fafb;
      color: #6b7280;
      cursor: not-allowed;
    }

    .form-input.error {
      border-color: #dc2626;
    }

    .input-wrapper.error .form-input:focus {
      border-color: #dc2626;
      box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
    }

    .input-icon {
      position: absolute;
      right: 0.75rem;
      display: flex;
      align-items: center;
      pointer-events: none;
    }

    .toggle-password {
      position: absolute;
      right: 0.75rem;
      background: none;
      border: none;
      cursor: pointer;
      padding: 0.25rem;
      border-radius: 0.25rem;
      transition: background-color 0.2s ease;
    }

    .toggle-password:hover {
      background-color: #f3f4f6;
    }

    .error-message {
      color: #dc2626;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .help-text {
      color: #6b7280;
      font-size: 0.875rem;
    }
  `]
})
export class FormInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() helpText = '';
  @Input() icon = false;
  @Input() control: FormControl | null = null;
  @Input() id = `input-${Math.random().toString(36).substr(2, 9)}`;

  value = signal('');
  showPassword = signal(false);
  errorMessage = signal('');
  touched = signal(false);

  private onChange = (value: string) => {};
  private onTouched = () => {};

  ngOnInit() {
    if (this.control) {
      // Subscribe to control value and validation state changes
      this.control.valueChanges.subscribe(value => {
        this.value.set(value || '');
      });

      this.control.statusChanges.subscribe(() => {
        this.updateErrorMessage();
      });
    }
  }

  writeValue(value: string): void {
    this.value.set(value || '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    this.value.set(value);
    this.onChange(value);
    this.updateErrorMessage();
  }

  onBlur(): void {
    this.touched.set(true);
    this.onTouched();
    this.updateErrorMessage();
  }

  onFocus(): void {
    // Clear error message on focus for better UX
    if (this.hasError()) {
      this.errorMessage.set('');
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(show => !show);
    this.type = this.showPassword() ? 'text' : 'password';
  }

  hasError(): boolean {
    return this.control ?
      !!(this.control.invalid && (this.control.dirty || this.control.touched)) :
      false;
  }

  private updateErrorMessage(): void {
    if (!this.control || !this.hasError()) {
      this.errorMessage.set('');
      return;
    }

    const errors = this.control.errors;
    if (errors) {
      if (errors['required']) {
        this.errorMessage.set(`${this.label || 'This field'} is required`);
      } else if (errors['email']) {
        this.errorMessage.set('Please enter a valid email address');
      } else if (errors['minlength']) {
        this.errorMessage.set(`Must be at least ${errors['minlength'].requiredLength} characters`);
      } else if (errors['maxlength']) {
        this.errorMessage.set(`Must be no more than ${errors['maxlength'].requiredLength} characters`);
      } else if (errors['pattern']) {
        this.errorMessage.set('Please enter a valid format');
      } else if (errors['strongPassword']) {
        this.errorMessage.set(this.getPasswordErrorMessage(errors['strongPassword']));
      } else if (errors['passwordMatch']) {
        this.errorMessage.set('Passwords do not match');
      } else {
        this.errorMessage.set('Please enter a valid value');
      }
    }
  }

  private getPasswordErrorMessage(passwordErrors: any): string {
    const missing = [];
    if (!passwordErrors.hasUpperCase) missing.push('uppercase letter');
    if (!passwordErrors.hasLowerCase) missing.push('lowercase letter');
    if (!passwordErrors.hasNumeric) missing.push('number');
    if (!passwordErrors.hasSpecialChar) missing.push('special character');
    if (!passwordErrors.isValidLength) missing.push('8+ characters');

    return `Password must contain: ${missing.join(', ')}`;
  }
}

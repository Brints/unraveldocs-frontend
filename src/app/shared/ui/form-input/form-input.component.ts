import { Component, Input, OnInit, forwardRef, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormControl, ReactiveFormsModule,
} from '@angular/forms';

@Component({
  selector: 'app-form-input',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormInputComponent),
      multi: true,
    },
  ],
  templateUrl: 'form-input.component.html',
  styleUrls: ['form-input.component.css'],
})
export class FormInputComponent implements ControlValueAccessor, OnInit {
  @Input() label = '';
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() required = false;
  @Input() disabled = false;
  @Input() helpText = '';
  @Input() icon = false;
  @Input() control: FormControl | null = null;
  @Input() id = `input-${Math.random().toString(36).substring(2, 9)}`;

  value = signal('');
  showPassword = signal(false);
  errorMessage = signal('');
  touched = signal(false);

  // Track the original type and current displayed type
  private originalType = 'text';
  currentType = signal('text');

  private onChange = (value: string) => {};
  private onTouched = () => {};

  ngOnInit() {
    // Store the original type
    this.originalType = this.type;
    this.currentType.set(this.type);

    if (this.control) {
      // Sync initial value from control to local state
      this.value.set(this.control.value || '');

      // Subscribe to control value and validation state changes
      this.control.valueChanges.subscribe((value) => {
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

    if (this.control) {
      this.control.setValue(value, { emitEvent: true });
      this.control.markAsDirty();
    }

    this.updateErrorMessage();
  }

  onBlur(): void {
    this.touched.set(true);
    this.onTouched();

    if (this.control) {
      this.control.markAsTouched();
    }

    this.updateErrorMessage();
  }

  onFocus(): void {
    // Clear error message on focus for better UX
    if (this.hasError()) {
      this.errorMessage.set('');
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((show) => !show);
    this.currentType.set(this.showPassword() ? 'text' : 'password');
  }

  hasError(): boolean {
    return this.control
      ? //!!(this.control.invalid && (this.control.dirty || this.control.touched))
        this.control.invalid && (this.control.dirty || this.control.touched)
      : false;
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
        this.errorMessage.set(
          `Must be at least ${errors['minlength'].requiredLength} characters`
        );
      } else if (errors['maxlength']) {
        this.errorMessage.set(
          `Must be no more than ${errors['maxlength'].requiredLength} characters`
        );
      } else if (errors['pattern']) {
        this.errorMessage.set('Please enter a valid format');
      } else if (errors['strongPassword']) {
        this.errorMessage.set(
          this.getPasswordErrorMessage(errors['strongPassword'])
        );
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

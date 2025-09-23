import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

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
    <div class="space-y-2">
      <label *ngIf="label" [for]="id" class="block text-sm font-semibold text-gray-700">
        {{ label }}
        <span *ngIf="required" class="text-red-500 ml-1">*</span>
      </label>

      <div class="relative">
        <!-- Icon -->
        <div *ngIf="icon" class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none z-10">
          <div class="w-5 h-5 text-gray-400" [innerHTML]="icon"></div>
        </div>

        <!-- Input Field -->
        <input
          [id]="id"
          [type]="currentType"
          [placeholder]="placeholder"
          [value]="value"
          [disabled]="disabled"
          [readonly]="readonly"
          [autocomplete]="autocomplete"
          class="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          [class.pl-10]="icon"
          [class.pr-10]="type === 'password' || showGenerateButton"
          [class.border-red-300]="hasError"
          [class.focus:ring-red-500]="hasError"
          [class.focus:border-red-500]="hasError"
          [class.bg-gray-50]="disabled"
          [class.cursor-not-allowed]="disabled"
          (input)="onInput($event)"
          (blur)="onTouched()"
          (focus)="onFocus()"
        />

        <!-- Password Toggle or Generate Button -->
        <div *ngIf="type === 'password'" class="absolute inset-y-0 right-0 flex items-center">
          <!-- Generate Password Button -->
          <button
            *ngIf="showGenerateButton"
            type="button"
            class="px-2 py-1 mr-1 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors"
            (click)="onGeneratePassword()"
            title="Generate strong password"
          >
            Generate
          </button>

          <!-- Password Visibility Toggle -->
          <button
            type="button"
            class="px-3 flex items-center"
            (click)="togglePasswordVisibility()"
            title="Toggle password visibility"
          >
            <svg *ngIf="!showPassword" class="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
            </svg>
            <svg *ngIf="showPassword" class="w-5 h-5 text-gray-400 hover:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L8.464 8.464M9.878 9.878A3.001 3.001 0 0012 9c.597 0 1.155.16 1.635.44m-1.635-.44l4.243 4.243M15.121 15.121L19.536 19.536"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Error Message -->
      <p *ngIf="errorMessage && hasError" class="text-sm text-red-600 mt-1">
        {{ errorMessage }}
      </p>

      <!-- Helper Text -->
      <p *ngIf="helperText && !hasError" class="text-sm text-gray-500 mt-1">
        {{ helperText }}
      </p>
    </div>
  `
})
export class FormInputComponent implements ControlValueAccessor {
  @Input() id: string = '';
  @Input() label: string = '';
  @Input() type: 'text' | 'email' | 'password' | 'tel' | 'url' = 'text';
  @Input() placeholder: string = '';
  @Input() icon: string = '';
  @Input() required: boolean = false;
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Input() autocomplete: string = '';
  @Input() errorMessage: string = '';
  @Input() helperText: string = '';
  @Input() hasError: boolean = false;
  @Input() showGenerateButton: boolean = false;

  @Output() generatePassword = new EventEmitter<void>();

  value: string = '';
  showPassword: boolean = false;

  get currentType(): string {
    if (this.type === 'password') {
      return this.showPassword ? 'text' : 'password';
    }
    return this.type;
  }

  // ControlValueAccessor implementation
  private onChange = (value: string) => {};
  onTouched = () => {};

  writeValue(value: string): void {
    this.value = value || '';
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
    this.value = target.value;
    this.onChange(this.value);
  }

  onFocus(): void {
    // Optional: Handle focus events
    this.onTouched();
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onGeneratePassword(): void {
    this.generatePassword.emit();
  }
}

import { Component, Input, OnInit, forwardRef, signal } from '@angular/core';

import {
  ControlValueAccessor,
  NG_VALUE_ACCESSOR,
  FormControl,
} from '@angular/forms';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  code?: string;
  dial_code?: string;
  flag?: string;
}

@Component({
  selector: 'app-form-select',
  standalone: true,
  imports: [],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => FormSelectComponent),
      multi: true,
    },
  ],
  templateUrl: './form-select.component.html',
  styleUrls: ['./form-select.component.css'],
})
export class FormSelectComponent implements ControlValueAccessor, OnInit {
  @Input() label = '';
  @Input() placeholder = 'Select an option';
  @Input() required = false;
  @Input() disabled = false;
  @Input() helpText = '';
  @Input() control: FormControl | null = null;
  @Input() id = `select-${Math.random().toString(36).substring(2, 9)}`;
  @Input() options: SelectOption[] | string[] = [];
  @Input() displayMode: 'default' | 'country' = 'default';

  value = signal('');
  errorMessage = signal('');
  touched = signal(false);
  isOpen = signal(false);
  filteredOptions = signal<SelectOption[]>([]);
  searchTerm = signal('');

  private onChange = (_value: string) => {};
  private onTouched = () => {};

  ngOnInit() {
    this.updateFilteredOptions();

    if (this.control) {
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

  toggleDropdown(): void {
    if (this.disabled) return;
    this.isOpen.update((open) => !open);
    if (!this.isOpen()) {
      this.onBlur();
    }
  }

  selectOption(option: SelectOption): void {
    if (option.disabled) return;

    this.value.set(option.value);
    this.onChange(option.value);
    this.isOpen.set(false);
    this.searchTerm.set('');
    this.updateFilteredOptions();
    this.updateErrorMessage();
  }

  onBlur(): void {
    setTimeout(() => {
      this.isOpen.set(false);
      this.touched.set(true);
      this.onTouched();
      this.updateErrorMessage();
    }, 200);
  }

  onSearchInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
    this.updateFilteredOptions();
  }

  clearSelection(event: Event): void {
    event.stopPropagation();
    this.value.set('');
    this.onChange('');
    this.updateErrorMessage();
  }

  hasError(): boolean {
    return this.control
      ? this.control.invalid && (this.control.dirty || this.control.touched)
      : false;
  }

  getSelectedLabel(): string {
    const selectedValue = this.value();
    if (!selectedValue) return '';

    const option = this.normalizedOptions().find((opt) => opt.value === selectedValue);
    return option ? option.label : selectedValue;
  }

  getFlagEmoji(countryCode: string): string {
    if (!countryCode || countryCode.length !== 2) return '🏳️';

    try {
      const code = countryCode.toUpperCase();
      // Convert to Regional Indicator Symbols (🇦-🇿)
      // Base is 0x1F1E6 (🇦) - 65 (A) = 0x1F1A5
      const OFFSET = 127397; // 0x1F1E6 - 0x41

      const codePoints = code.split('').map(char => {
        const charCode = char.charCodeAt(0);
        // Ensure it's a valid letter A-Z
        if (charCode < 65 || charCode > 90) return null;
        return OFFSET + charCode;
      });

      // If any code point is invalid, return fallback
      if (codePoints.some(cp => cp === null)) return '🏳️';

      return String.fromCodePoint(...codePoints as number[]);
    } catch (error) {
      console.warn('Error generating flag emoji for:', countryCode, error);
      return '🏳️';
    }
  }

  getSelectedOption(): SelectOption | undefined {
    const selectedValue = this.value();
    if (!selectedValue) return undefined;
    return this.normalizedOptions().find((opt) => opt.value === selectedValue);
  }

  private normalizedOptions(): SelectOption[] {
    return this.options.map((opt) => {
      if (typeof opt === 'string') {
        return { value: opt, label: opt };
      }
      return opt;
    });
  }

  private updateFilteredOptions(): void {
    const normalized = this.normalizedOptions();
    const search = this.searchTerm().toLowerCase();

    if (!search) {
      this.filteredOptions.set(normalized);
      return;
    }

    const filtered = normalized.filter((opt) => {
      const labelMatch = opt.label.toLowerCase().includes(search);
      const dialCodeMatch = opt.dial_code?.toLowerCase().includes(search);
      const codeMatch = opt.code?.toLowerCase().includes(search);
      return labelMatch || dialCodeMatch || codeMatch;
    });
    this.filteredOptions.set(filtered);
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
      } else {
        this.errorMessage.set('Please select a valid option');
      }
    }
  }
}


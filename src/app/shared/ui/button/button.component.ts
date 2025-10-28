import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: 'button.component.html',
  styleUrl: 'button.component.css',
})
export class ButtonComponent {
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() disabled = false;
  @Input() fullWidth = false;
  @Input() iconLeft = false;
  @Input() iconRight = false;
  @Input() loadingText = '';
  @Input() ariaLabel = '';

  @Output() clicked = new EventEmitter<Event>();

  loading = signal(false);

  @Input() set isLoading(value: boolean) {
    this.loading.set(value);
  }

  getButtonClasses(): string {
    return [
      'button-base',
      `size-${this.size}`,
      `variant-${this.variant}`,
      this.fullWidth ? 'full-width' : '',
    ]
      .filter(Boolean)
      .join(' ');
  }

  handleClick(event: Event): void {
    if (!this.disabled && !this.loading()) {
      this.clicked.emit(event);
    }
  }
}

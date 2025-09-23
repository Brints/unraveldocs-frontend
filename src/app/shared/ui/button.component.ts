import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [type]="type"
      [disabled]="disabled || loading()"
      [class]="getButtonClasses()"
      (click)="handleClick($event)"
      [attr.aria-label]="ariaLabel">

      <span *ngIf="loading()" class="loading-spinner" aria-hidden="true">
        <svg class="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" opacity="0.25"/>
          <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" fill="currentColor"/>
        </svg>
      </span>

      <span *ngIf="iconLeft && !loading()" class="icon-left">
        <ng-content select="[slot=icon-left]"></ng-content>
      </span>

      <span class="button-text" [class.sr-only]="loading() && loadingText">
        <ng-content></ng-content>
      </span>

      <span *ngIf="loading() && loadingText" class="loading-text">
        {{ loadingText }}
      </span>

      <span *ngIf="iconRight && !loading()" class="icon-right">
        <ng-content select="[slot=icon-right]"></ng-content>
      </span>
    </button>
  `,
  styles: [`
    .button-base {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-weight: 500;
      border-radius: 0.5rem;
      transition: all 0.2s ease;
      cursor: pointer;
      border: 1px solid transparent;
      text-decoration: none;
      white-space: nowrap;
      position: relative;
      overflow: hidden;
    }

    .button-base:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      pointer-events: none;
    }

    .button-base:focus {
      outline: none;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
    }

    /* Sizes */
    .size-sm {
      padding: 0.5rem 0.75rem;
      font-size: 0.875rem;
      min-height: 2rem;
    }

    .size-md {
      padding: 0.75rem 1rem;
      font-size: 1rem;
      min-height: 2.5rem;
    }

    .size-lg {
      padding: 1rem 1.5rem;
      font-size: 1.125rem;
      min-height: 3rem;
    }

    /* Variants */
    .variant-primary {
      background-color: #3b82f6;
      color: white;
      border-color: #3b82f6;
    }

    .variant-primary:hover:not(:disabled) {
      background-color: #2563eb;
      border-color: #2563eb;
    }

    .variant-secondary {
      background-color: #6b7280;
      color: white;
      border-color: #6b7280;
    }

    .variant-secondary:hover:not(:disabled) {
      background-color: #4b5563;
      border-color: #4b5563;
    }

    .variant-outline {
      background-color: transparent;
      color: #3b82f6;
      border-color: #3b82f6;
    }

    .variant-outline:hover:not(:disabled) {
      background-color: #3b82f6;
      color: white;
    }

    .variant-ghost {
      background-color: transparent;
      color: #374151;
      border-color: transparent;
    }

    .variant-ghost:hover:not(:disabled) {
      background-color: #f3f4f6;
    }

    .variant-destructive {
      background-color: #dc2626;
      color: white;
      border-color: #dc2626;
    }

    .variant-destructive:hover:not(:disabled) {
      background-color: #b91c1c;
      border-color: #b91c1c;
    }

    .full-width {
      width: 100%;
    }

    .loading-spinner {
      display: flex;
      align-items: center;
    }

    .animate-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .icon-left,
    .icon-right {
      display: flex;
      align-items: center;
    }

    .sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `]
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
      this.fullWidth ? 'full-width' : ''
    ].filter(Boolean).join(' ');
  }

  handleClick(event: Event): void {
    if (!this.disabled && !this.loading()) {
      this.clicked.emit(event);
    }
  }
}

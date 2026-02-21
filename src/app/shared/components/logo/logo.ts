import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type LogoVariant = 'full' | 'icon' | 'text';
export type LogoSize = 'sm' | 'md' | 'lg' | 'xl';
export type LogoTheme = 'light' | 'dark';

@Component({
  selector: 'app-logo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './logo.html',
  styleUrl: './logo.css',
})
export class Logo {
  @Input() variant: LogoVariant = 'full';
  @Input() size: LogoSize = 'md';
  @Input() theme: LogoTheme = 'light';
  @Input() showTagline: boolean = false;

  readonly tagline = 'Unlock Your Text. Edit Anything.';

  get iconSize(): { width: number; height: number } {
    const sizes = {
      sm: { width: 24, height: 24 },
      md: { width: 32, height: 32 },
      lg: { width: 48, height: 48 },
      xl: { width: 64, height: 64 },
    };
    return sizes[this.size];
  }

  get textClass(): string {
    const sizeClasses = {
      sm: 'text-lg',
      md: 'text-xl',
      lg: 'text-2xl',
      xl: 'text-3xl',
    };
    return sizeClasses[this.size];
  }

  get taglineClass(): string {
    const sizeClasses = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
      xl: 'text-lg',
    };
    return sizeClasses[this.size];
  }
}


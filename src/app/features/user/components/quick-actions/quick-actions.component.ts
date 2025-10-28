import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface QuickActionItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  route?: string;
  action?: () => void;
  color: string;
  disabled?: boolean;
}

@Component({
  selector: 'app-quick-actions',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="dashboard-section quick-actions-section">
      <div class="section-header">
        <h2 class="section-title">Quick Actions</h2>
        <p class="section-description">Get started with these common tasks</p>
      </div>

      <div class="quick-actions-grid">
        @for (action of actions(); track action.id) {
          <div class="quick-action-card">
            @if (action.route && !action.disabled) {
              <a [routerLink]="action.route" class="action-link" [class]="action.color">
                <div class="action-icon">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="getIconPath(action.icon)"/>
                  </svg>
                </div>
                <div class="action-content">
                  <h3 class="action-title">{{ action.title }}</h3>
                  <p class="action-description">{{ action.description }}</p>
                </div>
                <div class="action-arrow">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
              </a>
            } @else {
              <button
                type="button"
                (click)="handleActionClick(action)"
                class="action-link"
                [class]="action.color"
                [disabled]="action.disabled">
                <div class="action-icon">
                  <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="getIconPath(action.icon)"/>
                  </svg>
                </div>
                <div class="action-content">
                  <h3 class="action-title">{{ action.title }}</h3>
                  <p class="action-description">{{ action.description }}</p>
                </div>
                <div class="action-arrow">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
              </button>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .action-link:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }

    .action-link:disabled:hover {
      transform: none !important;
    }
  `]
})
export class QuickActionsComponent {
  @Input() actions = signal<QuickActionItem[]>([]);
  @Output() actionClicked = new EventEmitter<QuickActionItem>();

  handleActionClick(action: QuickActionItem): void {
    if (action.disabled) return;

    if (action.action) {
      action.action();
    }
    this.actionClicked.emit(action);
  }

  getIconPath(icon: string): string {
    const iconPaths = {
      'document-plus': 'M12 4v16m8-8H4',
      'cloud-arrow-up': 'M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12',
      'user-plus': 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
      'squares-2x2': 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z',
      'folder': 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z',
      'chart-bar': 'M3 13l4-4L11 13l4-4 4 4',
      'cog': 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z'
    };
    return iconPaths[icon as keyof typeof iconPaths] || iconPaths['document-plus'];
  }
}

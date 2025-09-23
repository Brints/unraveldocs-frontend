import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface StatCard {
  id: string;
  title: string;
  value: number | string;
  change?: {
    value: string;
    type: 'positive' | 'negative' | 'neutral';
  };
  icon: string;
  color: 'blue' | 'green' | 'orange' | 'purple';
  loading?: boolean;
}

@Component({
  selector: 'app-stats-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="stat-card" [class.skeleton]="loading()">
      @if (loading()) {
        <div class="skeleton-stat-icon"></div>
        <div class="skeleton-stat-content">
          <div class="skeleton-stat-number"></div>
          <div class="skeleton-stat-label"></div>
        </div>
      } @else {
        <div class="stat-icon" [class]="getIconClass()">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="getIconPath()"/>
          </svg>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stat().value }}</div>
          <div class="stat-label">{{ stat().title }}</div>
          @if (stat().change) {
            <div class="stat-change" [class]="getChangeClass()">
              {{ stat().change!.value }}
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class StatsCardComponent {
  @Input() stat = signal<StatCard>({
    id: '',
    title: '',
    value: 0,
    icon: 'document',
    color: 'blue'
  });

  @Input() loading = signal(false);

  getIconClass(): string {
    const colorClasses = {
      blue: 'documents',
      green: 'activity',
      orange: 'storage',
      purple: 'collaborations'
    };
    return colorClasses[this.stat().color] || 'documents';
  }

  getChangeClass(): string {
    const change = this.stat().change;
    if (!change) return '';

    const typeClasses = {
      positive: 'positive',
      negative: 'negative',
      neutral: 'neutral'
    };
    return typeClasses[change.type] || 'neutral';
  }

  getIconPath(): string {
    const iconPaths = {
      document: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      activity: 'M13 10V3L4 14h7v7l9-11h-7z',
      storage: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4',
      users: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z'
    };
    return iconPaths[this.stat().icon as keyof typeof iconPaths] || iconPaths.document;
  }
}

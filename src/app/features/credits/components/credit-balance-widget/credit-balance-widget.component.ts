import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CreditStateService } from '../../services/credit-state.service';

@Component({
  selector: 'app-credit-balance-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="credit-widget">
      <div class="widget-header">
        <div class="widget-icon">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        </div>
        <span class="widget-title">Credits</span>
        <a routerLink="/credits/packs" class="widget-link">
          View All
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
          </svg>
        </a>
      </div>

      <div class="widget-body">
        <div class="widget-balance">
          <span class="widget-balance-value" [class.low]="isLowBalance()">
            {{ creditBalance() }}
          </span>
          <span class="widget-balance-label">credits available</span>
        </div>

        @if (isLowBalance()) {
          <div class="widget-warning">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            <span>Low balance — buy more credits</span>
          </div>
        }

        <div class="widget-stats">
          <div class="widget-stat">
            <span class="stat-value purchased">{{ totalPurchased() }}</span>
            <span class="stat-label">Purchased</span>
          </div>
          <div class="widget-divider"></div>
          <div class="widget-stat">
            <span class="stat-value used">{{ totalUsed() }}</span>
            <span class="stat-label">Used</span>
          </div>
        </div>
      </div>

      <div class="widget-footer">
        <a routerLink="/credits/packs" class="widget-buy-btn">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Buy Credits
        </a>
        <a routerLink="/credits/transfer" class="widget-transfer-btn">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
          </svg>
          Transfer
        </a>
      </div>
    </div>
  `,
  styles: [`
    .w-4 { width: 1rem; height: 1rem; }
    .w-5 { width: 1.25rem; height: 1.25rem; }
    .h-4 { height: 1rem; }
    .h-5 { height: 1.25rem; }

    .credit-widget {
      background: white;
      border-radius: 1rem;
      border: 1px solid #f3f4f6;
      box-shadow: 0 1px 3px rgba(0,0,0,0.05);
      overflow: hidden;
    }
    .widget-header {
      display: flex;
      align-items: center;
      gap: 0.625rem;
      padding: 1rem 1.25rem;
      border-bottom: 1px solid #f9fafb;
    }
    .widget-icon {
      width: 2rem;
      height: 2rem;
      border-radius: 0.5rem;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }
    .widget-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #111827;
      flex: 1;
    }
    .widget-link {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: #4f46e5;
      text-decoration: none;
      transition: color 0.2s;
    }
    .widget-link:hover { color: #4338ca; }
    .widget-body {
      padding: 1rem 1.25rem;
    }
    .widget-body > * + * { margin-top: 1rem; }
    .widget-balance {
      display: flex;
      align-items: baseline;
      gap: 0.5rem;
    }
    .widget-balance-value {
      font-size: 1.875rem;
      font-weight: 700;
      color: #4f46e5;
    }
    .widget-balance-value.low {
      color: #d97706;
    }
    .widget-balance-label {
      font-size: 0.875rem;
      color: #9ca3af;
    }
    .widget-warning {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 0.75rem;
      background: #fffbeb;
      border-radius: 0.5rem;
      font-size: 0.75rem;
      color: #b45309;
      font-weight: 500;
      border: 1px solid #fef3c7;
    }
    .widget-warning svg { color: #f59e0b; }
    .widget-stats {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .widget-stat {
      display: flex;
      flex-direction: column;
    }
    .stat-value {
      font-size: 1.125rem;
      font-weight: 700;
    }
    .stat-value.purchased { color: #16a34a; }
    .stat-value.used { color: #d97706; }
    .stat-label {
      font-size: 0.75rem;
      color: #9ca3af;
    }
    .widget-divider {
      width: 1px;
      height: 2rem;
      background: #f3f4f6;
    }
    .widget-footer {
      display: flex;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: #f9fafb;
      border-top: 1px solid #f3f4f6;
    }
    .widget-buy-btn {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 600;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white;
      border-radius: 0.5rem;
      text-decoration: none;
      transition: all 0.2s;
    }
    .widget-buy-btn:hover {
      filter: brightness(1.1);
    }
    .widget-transfer-btn {
      flex: 1;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.375rem;
      padding: 0.5rem 0.75rem;
      font-size: 0.75rem;
      font-weight: 500;
      color: #374151;
      background: white;
      border: 1px solid #e5e7eb;
      border-radius: 0.5rem;
      text-decoration: none;
      transition: all 0.2s;
    }
    .widget-transfer-btn:hover {
      background: #f9fafb;
    }
  `]
})
export class CreditBalanceWidgetComponent implements OnInit {
  private readonly creditState = inject(CreditStateService);

  readonly creditBalance = this.creditState.creditBalance;
  readonly totalPurchased = this.creditState.totalPurchased;
  readonly totalUsed = this.creditState.totalUsed;
  readonly isLowBalance = this.creditState.isLowBalance;

  ngOnInit(): void {
    this.creditState.loadBalance();
  }
}


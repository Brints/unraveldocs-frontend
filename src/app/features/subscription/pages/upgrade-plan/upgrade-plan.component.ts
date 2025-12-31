import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SubscriptionStateService } from '../../services/subscription-state.service';

@Component({
  selector: 'app-upgrade-plan',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="upgrade-page">
      <div class="upgrade-content">
        <div class="upgrade-icon">
          <svg class="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
          </svg>
        </div>
        <h1 class="upgrade-title">Upgrade Your Plan</h1>
        <p class="upgrade-description">
          Get more features, higher limits, and priority support with our premium plans.
        </p>

        <div class="current-plan">
          <span class="label">Current Plan:</span>
          <span class="plan-name">{{ currentTier() | titlecase }}</span>
        </div>

        <div class="upgrade-actions">
          <a routerLink="/subscriptions/plans" class="btn-primary">
            View All Plans
          </a>
          <a routerLink="/subscriptions" class="btn-secondary">
            Back to Overview
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .upgrade-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      padding: 2rem;
    }

    .upgrade-content {
      text-align: center;
      max-width: 32rem;
    }

    .upgrade-icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 6rem;
      height: 6rem;
      background: linear-gradient(135deg, #e0e7ff, #c7d2fe);
      color: #6366f1;
      border-radius: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .upgrade-title {
      font-size: 2rem;
      font-weight: 800;
      color: #111827;
      margin: 0 0 0.75rem;
    }

    .upgrade-description {
      font-size: 1.125rem;
      color: #6b7280;
      margin: 0 0 2rem;
      line-height: 1.6;
    }

    .current-plan {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      background: #f9fafb;
      border-radius: 9999px;
      margin-bottom: 2rem;
    }

    .current-plan .label {
      font-size: 0.875rem;
      color: #6b7280;
    }

    .current-plan .plan-name {
      font-weight: 600;
      color: #6366f1;
    }

    .upgrade-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      align-items: center;
    }

    .btn-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 1rem 2rem;
      font-size: 1rem;
      font-weight: 600;
      color: white;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border: none;
      border-radius: 0.75rem;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
      min-width: 200px;
    }

    .btn-primary:hover {
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
      transform: translateY(-1px);
    }

    .btn-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.75rem 1.5rem;
      font-size: 0.9375rem;
      font-weight: 600;
      color: #6b7280;
      background: transparent;
      border: none;
      text-decoration: none;
    }

    .btn-secondary:hover {
      color: #374151;
    }

    .w-16 { width: 4rem; }
    .h-16 { height: 4rem; }
  `]
})
export class UpgradePlanComponent implements OnInit {
  protected readonly subState = inject(SubscriptionStateService);
  private readonly router = inject(Router);

  readonly currentTier = this.subState.currentTier;

  ngOnInit(): void {
    this.subState.loadSubscriptionData();
  }
}


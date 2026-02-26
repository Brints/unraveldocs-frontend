import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CreditStateService } from '../../services/credit-state.service';

@Component({
  selector: 'app-credit-purchase-callback',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="callback-page">
      <div class="callback-card">
        @if (isLoading()) {
          <div class="callback-loading">
            <div class="spinner-lg"></div>
            <h2 class="callback-title">Processing your purchase...</h2>
            <p class="callback-subtitle">Please wait while we verify your payment.</p>
          </div>
        } @else if (isSuccess()) {
          <div class="callback-success">
            <div class="success-icon">
              <svg style="width:3rem;height:3rem;color:white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h2 class="callback-title" style="color:#166534">Purchase Successful!</h2>
            <p class="callback-subtitle">{{ packName() }} — {{ credits() }} credits have been added to your account.</p>
            <div class="callback-actions">
              <a routerLink="/credits/packs" class="btn-primary">View Credits</a>
              <a routerLink="/user/dashboard" class="btn-secondary">Go to Dashboard</a>
            </div>
          </div>
        } @else {
          <div class="callback-info">
            <div class="info-icon">
              <svg style="width:3rem;height:3rem;color:white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h2 class="callback-title">Payment Received</h2>
            <p class="callback-subtitle">Your payment is being processed. Credits will be added shortly.</p>
            <div class="callback-actions">
              <a routerLink="/credits/packs" class="btn-primary">View Credit Packs</a>
              <a routerLink="/credits/transactions" class="btn-secondary">View Transactions</a>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .callback-page {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      padding: 1rem;
    }
    .callback-card {
      background: white;
      border-radius: 1rem;
      border: 1px solid #f3f4f6;
      box-shadow: 0 10px 30px rgba(0,0,0,0.1);
      padding: 2.5rem;
      max-width: 28rem;
      width: 100%;
      text-align: center;
    }
    .callback-loading,
    .callback-success,
    .callback-info {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }
    .spinner-lg {
      width: 2.5rem;
      height: 2.5rem;
      border: 4px solid #e0e7ff;
      border-top-color: #4f46e5;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .success-icon {
      width: 5rem;
      height: 5rem;
      border-radius: 50%;
      background: linear-gradient(135deg, #4ade80, #059669);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(5, 150, 105, 0.3);
    }
    .info-icon {
      width: 5rem;
      height: 5rem;
      border-radius: 50%;
      background: linear-gradient(135deg, #60a5fa, #4f46e5);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
    }
    .callback-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }
    .callback-subtitle {
      font-size: 0.875rem;
      color: #6b7280;
      margin: 0;
    }
    .callback-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 1rem;
      width: 100%;
    }
    @media (min-width: 640px) {
      .callback-actions { flex-direction: row; justify-content: center; }
    }
    .btn-primary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.75rem 1.5rem;
      background: linear-gradient(135deg, #4f46e5, #7c3aed);
      color: white;
      font-size: 0.875rem;
      font-weight: 600;
      border-radius: 0.75rem;
      text-decoration: none;
      box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);
      transition: all 0.2s;
    }
    .btn-primary:hover {
      box-shadow: 0 6px 16px rgba(79, 70, 229, 0.4);
    }
    .btn-secondary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 0.75rem 1.5rem;
      background: white;
      color: #374151;
      font-size: 0.875rem;
      font-weight: 500;
      border: 1px solid #d1d5db;
      border-radius: 0.75rem;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-secondary:hover { background: #f9fafb; }
  `]
})
export class CreditPurchaseCallbackComponent implements OnInit {
  private readonly creditState = inject(CreditStateService);

  isLoading = signal(true);
  isSuccess = signal(false);
  packName = signal('');
  credits = signal('');

  ngOnInit(): void {
    // Retrieve purchase info from session storage
    const reference = sessionStorage.getItem('credit_purchase_reference');
    const pack = sessionStorage.getItem('credit_purchase_pack');
    const creditsStr = sessionStorage.getItem('credit_purchase_credits');

    if (pack) this.packName.set(pack);
    if (creditsStr) this.credits.set(creditsStr);

    // Refresh credit balance
    this.creditState.loadBalance();

    // Simulate verification delay
    setTimeout(() => {
      this.isLoading.set(false);
      this.isSuccess.set(!!reference);

      // Cleanup session storage
      sessionStorage.removeItem('credit_purchase_reference');
      sessionStorage.removeItem('credit_purchase_pack');
      sessionStorage.removeItem('credit_purchase_credits');
      sessionStorage.removeItem('credit_purchase_gateway');
    }, 2000);
  }
}

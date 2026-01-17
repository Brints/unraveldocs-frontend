import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

/**
 * PaymentCancelComponent
 * Handles the cancel callback redirect from payment gateways (PayPal)
 *
 * This component is loaded when the payment provider redirects the user back to our app
 * after they cancelled the payment/subscription process.
 */
@Component({
  selector: 'app-payment-cancel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="callback-page">
      <div class="callback-card">
        <div class="callback-cancelled">
          <div class="cancelled-icon">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </div>
          <h2>Payment Cancelled</h2>
          <p>You cancelled the {{ gateway() }} payment process. No charges were made to your account.</p>

          <div class="info-box">
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p>If you experienced any issues during checkout, please contact our support team.</p>
          </div>

          <div class="callback-actions">
            <a routerLink="/settings/billing" class="btn btn-primary">
              Try Again
            </a>
            <a routerLink="/dashboard" class="btn btn-outline">
              Go to Dashboard
            </a>
            <a href="mailto:support@unraveldocs.com" class="btn btn-text">
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .callback-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
    }

    .callback-card {
      background: white;
      border-radius: 1.5rem;
      padding: 3rem;
      max-width: 32rem;
      width: 100%;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    .callback-cancelled {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .callback-cancelled h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .callback-cancelled p {
      font-size: 1rem;
      color: #6b7280;
      margin: 0;
      max-width: 20rem;
    }

    .cancelled-icon {
      width: 5rem;
      height: 5rem;
      background: #f3f4f6;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.5rem;
    }

    .cancelled-icon svg {
      width: 3rem;
      height: 3rem;
      color: #6b7280;
    }

    .info-box {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-radius: 0.75rem;
      padding: 1rem;
      width: 100%;
      text-align: left;
      margin: 0.5rem 0;
    }

    .info-box svg {
      width: 1.25rem;
      height: 1.25rem;
      color: #0284c7;
      flex-shrink: 0;
      margin-top: 0.125rem;
    }

    .info-box p {
      font-size: 0.875rem;
      color: #0369a1;
      margin: 0;
      max-width: none;
    }

    /* Actions */
    .callback-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      width: 100%;
      margin-top: 1rem;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.875rem 1.5rem;
      font-size: 1rem;
      font-weight: 600;
      border-radius: 0.75rem;
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
      border: none;
    }

    .btn-primary {
      background: linear-gradient(135deg, #3b82f6, #2563eb);
      color: white;
    }

    .btn-primary:hover {
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      transform: translateY(-1px);
    }

    .btn-outline {
      background: white;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .btn-outline:hover {
      background: #f9fafb;
      border-color: #9ca3af;
    }

    .btn-text {
      background: transparent;
      color: #3b82f6;
      padding: 0.5rem;
    }

    .btn-text:hover {
      text-decoration: underline;
    }

    @media (max-width: 480px) {
      .callback-page {
        padding: 1rem;
      }

      .callback-card {
        padding: 2rem;
      }
    }
  `]
})
export class PaymentCancelComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  gateway = signal<string>('PayPal');

  ngOnInit(): void {
    // Get gateway from query params
    const gatewayParam = this.route.snapshot.queryParamMap.get('gateway');
    if (gatewayParam) {
      this.gateway.set(gatewayParam.charAt(0).toUpperCase() + gatewayParam.slice(1));
    }

    // Clear any stored session data
    sessionStorage.removeItem('paypal_plan_id');
    sessionStorage.removeItem('paypal_subscription_id');
  }
}

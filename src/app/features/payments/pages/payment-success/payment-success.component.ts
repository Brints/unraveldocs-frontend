import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PayPalApiService } from '../../services/paypal-api.service';
import { PayPalSubscriptionDetails, getPayPalStatusLabel } from '../../models/paypal.model';
import { catchError, of, tap, finalize } from 'rxjs';

/**
 * PaymentSuccessComponent
 * Handles the success callback redirect from payment gateways (PayPal)
 *
 * This component is loaded when the payment provider redirects the user back to our app
 * after a successful payment/subscription approval.
 */
@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="callback-page">
      <div class="callback-card">
        <!-- Loading State -->
        @if (isVerifying()) {
          <div class="callback-loading">
            <div class="spinner"></div>
            <h2>Verifying Payment</h2>
            <p>Please wait while we confirm your {{ gateway() }} payment...</p>
          </div>
        }

        <!-- Success State -->
        @if (isSuccess()) {
          <div class="callback-success">
            <div class="success-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h2>Subscription Activated!</h2>
            <p>Your {{ gateway() }} subscription has been set up successfully.</p>

            @if (subscriptionDetails()) {
              <div class="subscription-details">
                <div class="detail-row">
                  <span class="label">Subscription ID:</span>
                  <span class="value">{{ subscriptionDetails()!.id }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Status:</span>
                  <span class="value status-success">{{ getStatusLabel(subscriptionDetails()!.status) }}</span>
                </div>
                @if (subscriptionDetails()!.billingInfo?.nextBillingTime) {
                  <div class="detail-row">
                    <span class="label">Next Billing:</span>
                    <span class="value">{{ formatDate(subscriptionDetails()!.billingInfo!.nextBillingTime!) }}</span>
                  </div>
                }
              </div>
            }

            <div class="callback-actions">
              <a routerLink="/settings/billing" class="btn btn-primary">
                Go to Billing
              </a>
              <a routerLink="/dashboard" class="btn btn-outline">
                Go to Dashboard
              </a>
            </div>
          </div>
        }

        <!-- Pending Approval State -->
        @if (isPending()) {
          <div class="callback-pending">
            <div class="pending-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h2>Subscription Pending</h2>
            <p>Your subscription is pending approval. This may take a few moments.</p>

            @if (subscriptionDetails()) {
              <div class="subscription-details">
                <div class="detail-row">
                  <span class="label">Subscription ID:</span>
                  <span class="value">{{ subscriptionDetails()!.id }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Status:</span>
                  <span class="value status-pending">{{ getStatusLabel(subscriptionDetails()!.status) }}</span>
                </div>
              </div>
            }

            <div class="callback-actions">
              <a routerLink="/settings/billing" class="btn btn-primary">
                Go to Billing
              </a>
              <button type="button" class="btn btn-outline" (click)="retryVerification()">
                Check Again
              </button>
            </div>
          </div>
        }

        <!-- Error State -->
        @if (isError()) {
          <div class="callback-error">
            <div class="error-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h2>Something Went Wrong</h2>
            <p>{{ errorMessage() }}</p>

            <div class="callback-actions">
              <a routerLink="/settings/billing" class="btn btn-primary">
                Go to Billing
              </a>
              <a href="mailto:support@unraveldocs.com" class="btn btn-text">
                Contact Support
              </a>
            </div>
          </div>
        }
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
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
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

    /* Loading */
    .callback-loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .spinner {
      width: 64px;
      height: 64px;
      border: 4px solid #e5e7eb;
      border-top-color: #10b981;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .callback-loading h2,
    .callback-success h2,
    .callback-pending h2,
    .callback-error h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .callback-loading p,
    .callback-success p,
    .callback-pending p,
    .callback-error p {
      font-size: 1rem;
      color: #6b7280;
      margin: 0;
      max-width: 20rem;
    }

    /* Success */
    .callback-success,
    .callback-pending,
    .callback-error {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
    }

    .success-icon {
      width: 5rem;
      height: 5rem;
      background: #dcfce7;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.5rem;
    }

    .success-icon svg {
      width: 3rem;
      height: 3rem;
      color: #16a34a;
    }

    /* Pending */
    .pending-icon {
      width: 5rem;
      height: 5rem;
      background: #fef3c7;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.5rem;
    }

    .pending-icon svg {
      width: 3rem;
      height: 3rem;
      color: #d97706;
    }

    /* Error */
    .error-icon {
      width: 5rem;
      height: 5rem;
      background: #fee2e2;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.5rem;
    }

    .error-icon svg {
      width: 3rem;
      height: 3rem;
      color: #dc2626;
    }

    /* Subscription Details */
    .subscription-details {
      background: #f9fafb;
      border-radius: 0.75rem;
      padding: 1rem;
      width: 100%;
      margin: 0.5rem 0;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      padding: 0.5rem 0;
      font-size: 0.875rem;
    }

    .detail-row:not(:last-child) {
      border-bottom: 1px solid #e5e7eb;
    }

    .detail-row .label {
      color: #6b7280;
    }

    .detail-row .value {
      font-weight: 500;
      color: #111827;
    }

    .status-success {
      color: #16a34a !important;
    }

    .status-pending {
      color: #d97706 !important;
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
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
    }

    .btn-primary:hover {
      box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
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
      color: #10b981;
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
export class PaymentSuccessComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly paypalApi = inject(PayPalApiService);

  // Component state
  gateway = signal<string>('PayPal');
  isVerifying = signal(true);
  isSuccess = signal(false);
  isPending = signal(false);
  isError = signal(false);
  errorMessage = signal('');
  subscriptionDetails = signal<PayPalSubscriptionDetails | null>(null);

  private subscriptionId: string | null = null;

  ngOnInit(): void {
    this.handleCallback();
  }

  private handleCallback(): void {
    // Get gateway from query params
    const gatewayParam = this.route.snapshot.queryParamMap.get('gateway');
    if (gatewayParam) {
      this.gateway.set(gatewayParam.charAt(0).toUpperCase() + gatewayParam.slice(1));
    }

    // Get subscription ID from query params or session storage
    const subscriptionId = this.route.snapshot.queryParamMap.get('subscription_id')
      || this.route.snapshot.queryParamMap.get('token')
      || sessionStorage.getItem('paypal_subscription_id');

    if (subscriptionId) {
      this.subscriptionId = subscriptionId;
      this.verifySubscription(subscriptionId);
    } else {
      // Try to get from subscription history
      this.checkActiveSubscription();
    }
  }

  private verifySubscription(subscriptionId: string): void {
    this.paypalApi.getSubscriptionDetails(subscriptionId).pipe(
      tap(subscription => {
        this.subscriptionDetails.set(subscription);

        if (subscription.active) {
          this.isSuccess.set(true);
        } else if (subscription.pendingApproval) {
          this.isPending.set(true);
        } else if (subscription.cancelled) {
          this.isError.set(true);
          this.errorMessage.set('Subscription was cancelled.');
        } else {
          // Show as pending for other states
          this.isPending.set(true);
        }

        // Clear session storage
        sessionStorage.removeItem('paypal_plan_id');
        sessionStorage.removeItem('paypal_subscription_id');
      }),
      catchError(error => {
        console.error('Failed to verify subscription:', error);
        this.isError.set(true);
        this.errorMessage.set(
          error.error?.message ||
          'Unable to verify subscription. Please contact support.'
        );
        return of(null);
      }),
      finalize(() => {
        this.isVerifying.set(false);
      })
    ).subscribe();
  }

  private checkActiveSubscription(): void {
    // Use subscription history to find the most recent subscription
    this.paypalApi.getSubscriptionHistory(0, 10).pipe(
      tap(response => {
        if (response.content && response.content.length > 0) {
          // Get the most recent subscription (first in list)
          const latestSub = response.content[0];

          // Convert to subscription details format
          const subscription: PayPalSubscriptionDetails = {
            id: latestSub.subscription_id,
            planId: latestSub.plan_id,
            status: latestSub.status,
            startTime: latestSub.start_time,
            createTime: latestSub.created_at,
            updateTime: null,
            approvalUrl: null,
            customId: latestSub.custom_id,
            billingInfo: {
              outstandingBalance: latestSub.outstanding_balance || 0,
              currency: latestSub.currency || 'USD',
              cycleExecutionsCount: latestSub.cycles_completed,
              failedPaymentsCount: latestSub.failed_payments_count || 0,
              lastPaymentTime: latestSub.last_payment_time,
              lastPaymentAmount: latestSub.last_payment_amount,
              nextBillingTime: latestSub.next_billing_time
            },
            subscriber: null,
            links: [],
            active: latestSub.status === 'ACTIVE',
            approvalLink: null,
            cancelled: latestSub.status === 'CANCELLED',
            pendingApproval: latestSub.status === 'APPROVAL_PENDING',
            suspended: latestSub.status === 'SUSPENDED'
          };

          this.subscriptionDetails.set(subscription);

          if (subscription.active) {
            this.isSuccess.set(true);
          } else if (subscription.pendingApproval) {
            this.isPending.set(true);
          } else {
            this.isPending.set(true);
          }
        } else {
          this.isError.set(true);
          this.errorMessage.set('No subscription found. Please try again.');
        }
      }),
      catchError(error => {
        console.error('Failed to get subscription history:', error);
        this.isError.set(true);
        this.errorMessage.set('Unable to find subscription. Please try again.');
        return of(null);
      }),
      finalize(() => {
        this.isVerifying.set(false);
      })
    ).subscribe();
  }

  retryVerification(): void {
    if (this.subscriptionId) {
      this.isVerifying.set(true);
      this.isPending.set(false);
      this.verifySubscription(this.subscriptionId);
    } else {
      this.isVerifying.set(true);
      this.isPending.set(false);
      this.checkActiveSubscription();
    }
  }

  getStatusLabel(status: string): string {
    return getPayPalStatusLabel(status as any);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

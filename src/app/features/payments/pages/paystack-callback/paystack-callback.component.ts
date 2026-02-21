import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { PaystackApiService } from '../../services/paystack-api.service';
import { PaymentApiService } from '../../services/payment-api.service';
import { catchError, of, tap, finalize } from 'rxjs';
import { Receipt } from '../../models/payment.model';

/**
 * PaystackCallbackComponent
 * Handles the callback redirect from Paystack after payment
 *
 * This component is loaded when Paystack redirects the user back to our app
 * after payment. It:
 * 1. Extracts the transaction reference from URL params
 * 2. Verifies the transaction with our backend
 * 3. Shows appropriate success/error UI
 * 4. Allows users to download their receipt
 * 5. Provides navigation back to billing page
 */
@Component({
  selector: 'app-paystack-callback',
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
            <p>Please wait while we confirm your payment...</p>
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
            <h2>Payment Successful!</h2>
            <p>Your payment has been processed successfully.</p>

            @if (transactionDetails()) {
              <div class="transaction-details">
                <div class="detail-row">
                  <span class="label">Reference:</span>
                  <span class="value">{{ transactionDetails()!.reference }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Amount:</span>
                  <span class="value">{{ formatAmount(transactionDetails()!.amount, transactionDetails()!.currency) }}</span>
                </div>
                @if (transactionDetails()!.channel) {
                  <div class="detail-row">
                    <span class="label">Payment Method:</span>
                    <span class="value capitalize">{{ transactionDetails()!.channel }}</span>
                  </div>
                }
                @if (transactionDetails()!.paidAt) {
                  <div class="detail-row">
                    <span class="label">Paid At:</span>
                    <span class="value">{{ formatDate(transactionDetails()!.paidAt!) }}</span>
                  </div>
                }
                <div class="detail-row">
                  <span class="label">Status:</span>
                  <span class="value status-success">{{ transactionDetails()!.status }}</span>
                </div>
              </div>
            }

            <div class="callback-actions">
              @if (receipt()) {
                <button
                  type="button"
                  class="btn btn-secondary"
                  [disabled]="isDownloadingReceipt()"
                  (click)="downloadReceipt()">
                  @if (isDownloadingReceipt()) {
                    <svg class="btn-spinner" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                    </svg>
                    Downloading...
                  } @else {
                    <svg class="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
                    </svg>
                    Download Receipt
                  }
                </button>
              }
              <a routerLink="/settings/billing" class="btn btn-primary">
                Go to Billing
              </a>
              <a routerLink="/payments/history" class="btn btn-outline">
                View Payment History
              </a>
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
            <h2>Payment Issue</h2>
            <p>{{ errorMessage() }}</p>

            @if (transactionDetails()) {
              <div class="transaction-details">
                <div class="detail-row">
                  <span class="label">Reference:</span>
                  <span class="value">{{ transactionDetails()!.reference }}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Status:</span>
                  <span class="value status-error">{{ transactionDetails()!.status }}</span>
                </div>
                @if (transactionDetails()!.gatewayResponse) {
                  <div class="detail-row">
                    <span class="label">Reason:</span>
                    <span class="value">{{ transactionDetails()!.gatewayResponse }}</span>
                  </div>
                }
              </div>
            }

            <div class="callback-actions">
              <a routerLink="/settings/billing" class="btn btn-primary">
                Try Again
              </a>
              <a routerLink="/payments/history" class="btn btn-outline">
                View Payment History
              </a>
              <a href="mailto:support@unraveldocs.xyz" class="btn btn-text">
                Contact Support
              </a>
            </div>
          </div>
        }

        <!-- No Reference State -->
        @if (noReference()) {
          <div class="callback-error">
            <div class="error-icon">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h2>Invalid Callback</h2>
            <p>No payment reference was provided. Please try making your payment again.</p>

            <div class="callback-actions">
              <a routerLink="/settings/billing" class="btn btn-primary">
                Go to Billing
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
      background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%);
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
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .callback-loading h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .callback-loading p {
      font-size: 1rem;
      color: #6b7280;
      margin: 0;
    }

    /* Success */
    .callback-success,
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

    .callback-success h2,
    .callback-error h2 {
      font-size: 1.5rem;
      font-weight: 700;
      color: #111827;
      margin: 0;
    }

    .callback-success p,
    .callback-error p {
      font-size: 1rem;
      color: #6b7280;
      margin: 0;
      max-width: 20rem;
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

    /* Transaction Details */
    .transaction-details {
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

    .capitalize {
      text-transform: capitalize;
    }

    .status-success {
      color: #16a34a !important;
      text-transform: capitalize;
    }

    .status-error {
      color: #dc2626 !important;
      text-transform: capitalize;
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

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-icon {
      width: 1.25rem;
      height: 1.25rem;
    }

    .btn-spinner {
      width: 1.25rem;
      height: 1.25rem;
      animation: spin 1s linear infinite;
    }

    .btn-primary {
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
      transform: translateY(-1px);
    }

    .btn-secondary {
      background: #f3f4f6;
      color: #374151;
      border: 1px solid #d1d5db;
    }

    .btn-secondary:hover:not(:disabled) {
      background: #e5e7eb;
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
      color: #6366f1;
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
export class PaystackCallbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly paystackApi = inject(PaystackApiService);
  private readonly paymentApi = inject(PaymentApiService);

  // Component state
  isVerifying = signal(true);
  isSuccess = signal(false);
  isError = signal(false);
  noReference = signal(false);
  isDownloadingReceipt = signal(false);
  errorMessage = signal('');
  transactionDetails = signal<{
    reference: string;
    amount: number;
    currency: string;
    status: string;
    channel?: string;
    paidAt?: string;
    gatewayResponse?: string;
  } | null>(null);
  receipt = signal<Receipt | null>(null);

  ngOnInit(): void {
    this.handleCallback();
  }

  private handleCallback(): void {
    // Get reference from query params
    // Paystack sends either 'reference' or 'trxref'
    const reference = this.route.snapshot.queryParamMap.get('reference')
      || this.route.snapshot.queryParamMap.get('trxref')
      || sessionStorage.getItem('paystack_reference');

    if (!reference) {
      this.isVerifying.set(false);
      this.noReference.set(true);
      return;
    }

    // Verify the transaction
    this.verifyTransaction(reference);
  }

  private verifyTransaction(reference: string): void {
    this.paystackApi.verifyTransaction(reference).pipe(
      tap(response => {
        this.transactionDetails.set({
          reference: response.reference,
          amount: response.amount,
          currency: response.currency,
          status: response.status,
          channel: response.channel,
          paidAt: response.paidAt,
          gatewayResponse: response.gatewayResponse,
        });

        if (response.status === 'success') {
          this.isSuccess.set(true);

          // Clear session storage
          sessionStorage.removeItem('paystack_reference');
          sessionStorage.removeItem('paystack_plan');
          sessionStorage.removeItem('paystack_interval');

          // Try to fetch receipt for this transaction
          this.fetchReceipt(reference);
        } else {
          this.isError.set(true);
          this.errorMessage.set(
            response.status === 'failed'
              ? 'Your payment could not be processed. Please try again.'
              : response.status === 'abandoned'
              ? 'Payment was cancelled. No charges were made.'
              : `Payment status: ${response.status}. Please contact support if you need assistance.`
          );
        }
      }),
      catchError(error => {
        console.error('Failed to verify transaction:', error);
        this.isError.set(true);
        this.errorMessage.set(
          error.error?.message ||
          'Unable to verify payment. Please contact support if you were charged.'
        );
        return of(null);
      }),
      finalize(() => {
        this.isVerifying.set(false);
      })
    ).subscribe();
  }

  private fetchReceipt(reference: string): void {
    // Try to get receipts and find one matching this reference
    this.paymentApi.getReceipts(0, 10).pipe(
      tap(receipts => {
        // Find receipt that matches this payment reference
        // The receipt might be created with a slight delay, so we check by amount/date as fallback
        const matchingReceipt = receipts.find(r =>
          r.receiptNumber?.includes(reference) ||
          (r.paidAt && new Date(r.paidAt).getTime() > Date.now() - 60000) // Within last minute
        );
        if (matchingReceipt) {
          this.receipt.set(matchingReceipt);
        }
      }),
      catchError(error => {
        console.error('Failed to fetch receipt:', error);
        // Don't show error to user - receipt might not be generated yet
        return of(null);
      })
    ).subscribe();
  }

  downloadReceipt(): void {
    const currentReceipt = this.receipt();
    if (!currentReceipt?.receiptNumber) return;

    this.isDownloadingReceipt.set(true);

    this.paymentApi.downloadReceipt(currentReceipt.receiptNumber).pipe(
      tap(url => {
        if (url) {
          window.open(url, '_blank');
        }
      }),
      catchError(error => {
        console.error('Failed to download receipt:', error);
        // Fallback: try using the receiptUrl directly
        if (currentReceipt.receiptUrl) {
          window.open(currentReceipt.receiptUrl, '_blank');
        }
        return of(null);
      }),
      finalize(() => {
        this.isDownloadingReceipt.set(false);
      })
    ).subscribe();
  }

  formatAmount(amount: number, currency: string): string {
    // Amount from Paystack is in kobo (smallest currency unit)
    const mainAmount = amount / 100;
    const currencySymbols: Record<string, string> = {
      NGN: '₦',
      GHS: '₵',
      ZAR: 'R',
      KES: 'KSh',
      USD: '$',
    };
    const symbol = currencySymbols[currency] || currency;
    return `${symbol}${mainAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}


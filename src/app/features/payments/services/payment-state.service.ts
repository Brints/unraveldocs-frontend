import { Injectable, inject, signal, computed } from '@angular/core';
import { catchError, of, tap, finalize, forkJoin } from 'rxjs';
import { PaymentApiService } from './payment-api.service';
import { PaystackApiService } from './paystack-api.service';
import {
  Payment,
  PaymentMethod,
  Receipt,
  PaymentStatus,
  PaymentProvider,
  PaymentFilterOptions,
} from '../models/payment.model';
import { PaystackPaymentHistoryItem } from '../models/paystack.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentStateService {
  private readonly api = inject(PaymentApiService);
  private readonly paystackApi = inject(PaystackApiService);

  // ==================== State Signals ====================

  private readonly _payments = signal<Payment[]>([]);
  private readonly _paymentMethods = signal<PaymentMethod[]>([]);
  private readonly _receipts = signal<Receipt[]>([]);
  private readonly _selectedPayment = signal<Payment | null>(null);
  private readonly _selectedReceipt = signal<Receipt | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _isProcessing = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _successMessage = signal<string | null>(null);
  private readonly _filter = signal<PaymentFilterOptions>({});
  private readonly _pagination = signal({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0
  });

  // ==================== Public Readonly Signals ====================

  readonly payments = this._payments.asReadonly();
  readonly paymentMethods = this._paymentMethods.asReadonly();
  readonly receipts = this._receipts.asReadonly();
  readonly selectedPayment = this._selectedPayment.asReadonly();
  readonly selectedReceipt = this._selectedReceipt.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isProcessing = this._isProcessing.asReadonly();
  readonly error = this._error.asReadonly();
  readonly successMessage = this._successMessage.asReadonly();
  readonly filter = this._filter.asReadonly();
  readonly pagination = this._pagination.asReadonly();

  // ==================== Computed Properties ====================

  readonly filteredPayments = computed(() => {
    let payments = this._payments();
    const currentFilter = this._filter();

    if (currentFilter.status) {
      payments = payments.filter(p => p.status === currentFilter.status);
    }

    if (currentFilter.provider) {
      payments = payments.filter(p => p.provider === currentFilter.provider);
    }

    if (currentFilter.searchQuery) {
      const query = currentFilter.searchQuery.toLowerCase();
      payments = payments.filter(p =>
        p.receiptNumber?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }

    return payments;
  });

  readonly totalPayments = computed(() => this._payments().length);

  readonly totalAmount = computed(() => {
    return this._payments()
      .filter(p => p.status === 'succeeded')
      .reduce((sum, p) => sum + p.amount, 0);
  });

  readonly successfulPayments = computed(() =>
    this._payments().filter(p => p.status === 'succeeded')
  );

  readonly failedPayments = computed(() =>
    this._payments().filter(p => p.status === 'failed')
  );

  readonly refundedPayments = computed(() =>
    this._payments().filter(p => p.status === 'refunded')
  );

  readonly defaultPaymentMethod = computed(() =>
    this._paymentMethods().find(pm => pm.isDefault)
  );

  readonly hasPaymentMethod = computed(() =>
    this._paymentMethods().length > 0
  );

  // ==================== Load Actions ====================

  /**
   * Load all payment data (payments, methods, receipts)
   */
  loadAllPaymentData(): void {
    this._isLoading.set(true);
    this._error.set(null);

    // Load real data from APIs
    forkJoin({
      paystackHistory: this.paystackApi.getPaymentHistory(0, 50).pipe(
        catchError(error => {
          console.error('Failed to load Paystack history:', error);
          return of({ content: [], totalElements: 0, totalPages: 0, pageable: { pageNumber: 0, pageSize: 20 } });
        })
      ),
      receipts: this.api.getReceipts(0, 50).pipe(
        catchError(error => {
          console.error('Failed to load receipts:', error);
          return of([]);
        })
      )
    }).pipe(
      tap(({ paystackHistory, receipts }) => {
        // Convert Paystack history to Payment format
        const payments = this.convertPaystackHistoryToPayments(paystackHistory.content || []);
        this._payments.set(payments);
        this._receipts.set(receipts);

        // Update pagination
        this._pagination.update(p => ({
          ...p,
          totalElements: paystackHistory.totalElements || 0,
          totalPages: paystackHistory.totalPages || 0
        }));
      }),
      catchError(error => {
        console.error('Failed to load payment data:', error);
        this._error.set('Failed to load payment data. Please try again.');
        return of(null);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  /**
   * Load payment history
   */
  loadPaymentHistory(page = 0, size = 20): void {
    this._isLoading.set(true);

    this.paystackApi.getPaymentHistory(page, size).pipe(
      tap(response => {
        const payments = this.convertPaystackHistoryToPayments(response.content || []);
        this._payments.set(payments);
        this._pagination.update(p => ({
          ...p,
          page: response.pageable?.pageNumber || 0,
          size: response.pageable?.pageSize || size,
          totalElements: response.totalElements || 0,
          totalPages: response.totalPages || 0
        }));
      }),
      catchError(error => {
        console.error('Failed to load payment history:', error);
        this._error.set('Failed to load payment history. Please try again.');
        return of(null);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  /**
   * Convert Paystack payment history items to unified Payment format
   */
  private convertPaystackHistoryToPayments(items: PaystackPaymentHistoryItem[]): Payment[] {
    return items.map(item => this.convertPaystackItemToPayment(item));
  }

  /**
   * Convert a single Paystack history item to Payment format
   */
  private convertPaystackItemToPayment(item: PaystackPaymentHistoryItem): Payment {
    return {
      id: item.id,
      provider: 'paystack',
      amount: item.amount,
      currency: item.currency,
      status: this.mapPaystackStatus(item.status),
      description: item.description || `Payment - ${item.reference}`,
      paymentMethodBrand: item.channel || undefined,
      paymentMethodLast4: undefined,
      receiptNumber: item.reference,
      refundedAmount: item.amount_refunded || undefined,
      createdAt: item.created_at || item.createdAt || new Date().toISOString(),
      updatedAt: item.paid_at || item.paidAt || item.created_at || item.createdAt
    };
  }

  /**
   * Map Paystack transaction status to unified PaymentStatus
   */
  private mapPaystackStatus(status: string): PaymentStatus {
    const normalizedStatus = status?.toUpperCase();
    const statusMap: Record<string, PaymentStatus> = {
      'SUCCESS': 'succeeded',
      'SUCCEEDED': 'succeeded',
      'SUCCESSFUL': 'succeeded',
      'FAILED': 'failed',
      'ABANDONED': 'canceled',
      'PENDING': 'pending',
      'REVERSED': 'refunded',
      'QUEUED': 'processing',
      'PROCESSING': 'processing'
    };
    return statusMap[normalizedStatus] || 'pending';
  }

  /**
   * Load payment methods
   */
  loadPaymentMethods(): void {
    this._isLoading.set(true);

    this.api.getStripeCustomer().pipe(
      tap(customer => {
        this._paymentMethods.set(customer.paymentMethods || []);
      }),
      catchError(error => {
        console.error('Failed to load payment methods:', error);
        this.loadMockPaymentMethods();
        return of(null);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  /**
   * Load receipts
   */
  loadReceipts(page = 0, size = 10): void {
    this._isLoading.set(true);

    this.api.getReceipts(page, size).pipe(
      tap(receipts => {
        this._receipts.set(receipts);
      }),
      catchError(error => {
        console.error('Failed to load receipts:', error);
        this.loadMockReceipts();
        return of([]);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  /**
   * Load receipt by number
   */
  loadReceipt(receiptNumber: string): void {
    this._isLoading.set(true);

    this.api.getReceipt(receiptNumber).pipe(
      tap(receipt => {
        this._selectedReceipt.set(receipt);
      }),
      catchError(error => {
        this._error.set('Failed to load receipt');
        console.error('Load receipt error:', error);
        return of(null);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  // ==================== Payment Method Actions ====================

  /**
   * Add new payment method
   */
  addPaymentMethod(paymentMethodId: string): void {
    this._isProcessing.set(true);
    this._error.set(null);

    this.api.attachPaymentMethod(paymentMethodId).pipe(
      tap(() => {
        this.loadPaymentMethods();
        this._successMessage.set('Payment method added successfully');
        this.clearMessageAfterDelay();
      }),
      catchError(error => {
        this._error.set('Failed to add payment method');
        console.error('Add payment method error:', error);
        return of(null);
      }),
      finalize(() => this._isProcessing.set(false))
    ).subscribe();
  }

  /**
   * Set default payment method
   */
  setDefaultPaymentMethod(paymentMethodId: string): void {
    this._isProcessing.set(true);

    this.api.setDefaultPaymentMethod(paymentMethodId).pipe(
      tap(() => {
        this._paymentMethods.update(methods =>
          methods.map(pm => ({
            ...pm,
            isDefault: pm.id === paymentMethodId
          }))
        );
        this._successMessage.set('Default payment method updated');
        this.clearMessageAfterDelay();
      }),
      catchError(error => {
        this._error.set('Failed to update default payment method');
        console.error('Set default payment method error:', error);
        return of(null);
      }),
      finalize(() => this._isProcessing.set(false))
    ).subscribe();
  }

  /**
   * Remove payment method
   */
  removePaymentMethod(paymentMethodId: string): void {
    this._isProcessing.set(true);

    this.api.removePaymentMethod(paymentMethodId).pipe(
      tap(() => {
        this._paymentMethods.update(methods =>
          methods.filter(pm => pm.id !== paymentMethodId)
        );
        this._successMessage.set('Payment method removed');
        this.clearMessageAfterDelay();
      }),
      catchError(error => {
        this._error.set('Failed to remove payment method');
        console.error('Remove payment method error:', error);
        return of(null);
      }),
      finalize(() => this._isProcessing.set(false))
    ).subscribe();
  }

  // ==================== Receipt Actions ====================

  /**
   * Download receipt
   */
  downloadReceipt(receiptNumber: string): void {
    this._isProcessing.set(true);

    this.api.downloadReceipt(receiptNumber).pipe(
      tap(url => {
        window.open(url, '_blank');
      }),
      catchError(error => {
        this._error.set('Failed to download receipt');
        console.error('Download receipt error:', error);
        return of(null);
      }),
      finalize(() => this._isProcessing.set(false))
    ).subscribe();
  }

  // ==================== Selection Actions ====================

  selectPayment(payment: Payment | null): void {
    this._selectedPayment.set(payment);
  }

  selectReceipt(receipt: Receipt | null): void {
    this._selectedReceipt.set(receipt);
  }

  // ==================== Filter Actions ====================

  setFilter(filter: PaymentFilterOptions): void {
    this._filter.set(filter);
  }

  updateFilter(partialFilter: Partial<PaymentFilterOptions>): void {
    this._filter.update(current => ({ ...current, ...partialFilter }));
  }

  clearFilter(): void {
    this._filter.set({});
  }

  // ==================== Utility ====================

  clearError(): void {
    this._error.set(null);
  }

  clearSuccessMessage(): void {
    this._successMessage.set(null);
  }

  private clearMessageAfterDelay(): void {
    setTimeout(() => this._successMessage.set(null), 5000);
  }

  // ==================== Mock Data ====================

  private loadMockData(): void {
    this.loadMockPayments();
    this.loadMockPaymentMethods();
    this.loadMockReceipts();
    this._isLoading.set(false);
  }

  private loadMockPayments(): void {
    this._payments.set([
      {
        id: 'pay-1',
        provider: 'stripe',
        amount: 2999,
        currency: 'USD',
        status: 'succeeded',
        description: 'Pro Plan - Monthly Subscription',
        paymentMethodBrand: 'visa',
        paymentMethodLast4: '4242',
        receiptNumber: 'RCP-2024-0012',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
      },
      {
        id: 'pay-2',
        provider: 'stripe',
        amount: 2999,
        currency: 'USD',
        status: 'succeeded',
        description: 'Pro Plan - Monthly Subscription',
        paymentMethodBrand: 'visa',
        paymentMethodLast4: '4242',
        receiptNumber: 'RCP-2024-0011',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString()
      },
      {
        id: 'pay-3',
        provider: 'stripe',
        amount: 2999,
        currency: 'USD',
        status: 'succeeded',
        description: 'Pro Plan - Monthly Subscription',
        paymentMethodBrand: 'visa',
        paymentMethodLast4: '4242',
        receiptNumber: 'RCP-2024-0010',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString()
      },
      {
        id: 'pay-4',
        provider: 'paystack',
        amount: 500000,
        currency: 'NGN',
        status: 'succeeded',
        description: 'One-time document processing',
        paymentMethodBrand: 'mastercard',
        paymentMethodLast4: '5555',
        receiptNumber: 'RCP-2024-0009',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString()
      },
      {
        id: 'pay-5',
        provider: 'stripe',
        amount: 999,
        currency: 'USD',
        status: 'refunded',
        description: 'Starter Plan - Monthly Subscription',
        paymentMethodBrand: 'visa',
        paymentMethodLast4: '4242',
        refundedAmount: 999,
        receiptNumber: 'RCP-2024-0008',
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 120).toISOString()
      }
    ]);
  }

  private loadMockPaymentMethods(): void {
    this._paymentMethods.set([
      {
        id: 'pm-1',
        type: 'card',
        provider: 'stripe',
        brand: 'visa',
        last4: '4242',
        expiryMonth: 12,
        expiryYear: 2026,
        isDefault: true,
        createdAt: '2024-06-01T00:00:00Z'
      },
      {
        id: 'pm-2',
        type: 'card',
        provider: 'stripe',
        brand: 'mastercard',
        last4: '5555',
        expiryMonth: 8,
        expiryYear: 2025,
        isDefault: false,
        createdAt: '2024-09-01T00:00:00Z'
      }
    ]);
  }

  private loadMockReceipts(): void {
    this._receipts.set([
      {
        id: 'rec-1',
        receiptNumber: 'RCP-2024-0012',
        paymentProvider: 'stripe',
        amount: 2999,
        currency: 'USD',
        paymentMethod: 'Visa •••• 4242',
        description: 'Pro Plan - Monthly Subscription',
        paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
      },
      {
        id: 'rec-2',
        receiptNumber: 'RCP-2024-0011',
        paymentProvider: 'stripe',
        amount: 2999,
        currency: 'USD',
        paymentMethod: 'Visa •••• 4242',
        description: 'Pro Plan - Monthly Subscription',
        paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString()
      },
      {
        id: 'rec-3',
        receiptNumber: 'RCP-2024-0010',
        paymentProvider: 'stripe',
        amount: 2999,
        currency: 'USD',
        paymentMethod: 'Visa •••• 4242',
        description: 'Pro Plan - Monthly Subscription',
        paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString(),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60).toISOString()
      },
      {
        id: 'rec-4',
        receiptNumber: 'RCP-2024-0009',
        paymentProvider: 'paystack',
        amount: 500000,
        currency: 'NGN',
        paymentMethod: 'Mastercard •••• 5555',
        description: 'One-time document processing',
        paidAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString()
      }
    ]);
  }
}


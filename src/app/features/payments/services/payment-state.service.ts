import { Injectable, inject, signal, computed } from '@angular/core';
import { catchError, of, tap, finalize, forkJoin } from 'rxjs';
import { PaymentApiService } from './payment-api.service';
import { PaystackApiService } from './paystack-api.service';
import { PayPalApiService } from './paypal-api.service';
import {
  Payment,
  PaymentMethod,
  Receipt,
  PaymentStatus,
  PaymentProvider,
  PaymentFilterOptions,
  StripePaymentHistoryItem,
} from '../models/payment.model';
import { PaystackPaymentHistoryItem } from '../models/paystack.model';
import { PayPalPaymentHistoryItem } from '../models/paypal.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentStateService {
  private readonly api = inject(PaymentApiService);
  private readonly paystackApi = inject(PaystackApiService);
  private readonly paypalApi = inject(PayPalApiService);

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

  private readonly _receiptPagination = signal({
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
  readonly receiptPagination = this._receiptPagination.asReadonly();

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

    if (currentFilter.dateFrom) {
      const fromDate = new Date(currentFilter.dateFrom).getTime();
      payments = payments.filter(p => new Date(p.createdAt).getTime() >= fromDate);
    }

    if (currentFilter.dateTo) {
      const toDate = new Date(currentFilter.dateTo).getTime();
      const toDateEnd = toDate + 24 * 60 * 60 * 1000 - 1;
      payments = payments.filter(p => new Date(p.createdAt).getTime() <= toDateEnd);
    }

    return payments;
  });

  readonly totalPayments = computed(() => this._payments().length);

  readonly hasMorePayments = computed(() => {
    return this._payments().length < this._pagination().totalElements;
  });

  readonly totalsByCurrency = computed(() => {
    const totals = new Map<string, number>();
    for (const p of this._payments().filter(p => p.status === 'succeeded')) {
      const currency = p.currency?.toUpperCase() || 'USD';
      totals.set(currency, (totals.get(currency) || 0) + p.amount);
    }
    return totals;
  });

  // Keep for backward compat — sums all currencies (not meaningful for mixed currencies)
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
   * Load all payment data (payments from all providers, receipts)
   * Fetches from Paystack, PayPal, and Stripe in parallel and merges results
   */
  loadAllPaymentData(): void {
    this._isLoading.set(true);
    this._error.set(null);

    const emptyPaginated = {
      content: [] as any[],
      totalElements: 0,
      totalPages: 0,
      pageable: { pageNumber: 0, pageSize: 50 }
    };

    forkJoin({
      paystackHistory: this.paystackApi.getPaymentHistory(0, 20).pipe(
        catchError(error => {
          console.error('Failed to load Paystack history:', error);
          return of(emptyPaginated);
        })
      ),
      paypalHistory: this.paypalApi.getPaymentHistory(0, 20).pipe(
        catchError(error => {
          console.error('Failed to load PayPal history:', error);
          return of(emptyPaginated);
        })
      ),
      stripeHistory: this.api.getStripePaymentHistory(0, 20).pipe(
        catchError(error => {
          console.error('Failed to load Stripe history:', error);
          return of(emptyPaginated);
        })
      ),
      receipts: this.api.getReceipts(0, 20).pipe(
        catchError(error => {
          console.error('Failed to load receipts:', error);
          return of({ content: [], totalElements: 0, totalPages: 0, page: 0, size: 20, number: 0, numberOfElements: 0, first: true, last: true, empty: true });
        })
      )
    }).pipe(
      tap(({ paystackHistory, paypalHistory, stripeHistory, receipts }) => {
        // Convert each provider's history to unified Payment format
        const paystackPayments = this.convertPaystackHistoryToPayments(
          paystackHistory.content || []
        );
        const paypalPayments = this.convertPayPalHistoryToPayments(
          paypalHistory.content || []
        );
        const stripePayments = this.convertStripeHistoryToPayments(
          stripeHistory.content || []
        );

        // Merge all payments and sort by date (newest first)
        const allPayments = [...paystackPayments, ...paypalPayments, ...stripePayments]
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        this._payments.set(allPayments);
        this._receipts.set(receipts.content || []);

        // Update pagination with combined totals
        const totalElements =
          (paystackHistory.totalElements || 0) +
          (paypalHistory.totalElements || 0) +
          (stripeHistory.totalElements || 0);

        this._pagination.update(p => ({
          ...p,
          page: 0,
          size: 20,
          totalElements,
          totalPages: Math.ceil(totalElements / 20) || 1
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
   * Load payment history from all providers
   */
  loadPaymentHistory(page = 0, size = 20, append = false): void {
    this._isLoading.set(true);

    const emptyPaginated = {
      content: [] as any[],
      totalElements: 0,
      totalPages: 0,
      pageable: { pageNumber: 0, pageSize: size }
    };

    forkJoin({
      paystackHistory: this.paystackApi.getPaymentHistory(page, size).pipe(
        catchError(() => of(emptyPaginated))
      ),
      paypalHistory: this.paypalApi.getPaymentHistory(page, size).pipe(
        catchError(() => of(emptyPaginated))
      ),
      stripeHistory: this.api.getStripePaymentHistory(page, size).pipe(
        catchError(() => of(emptyPaginated))
      ),
    }).pipe(
      tap(({ paystackHistory, paypalHistory, stripeHistory }) => {
        const paystackPayments = this.convertPaystackHistoryToPayments(paystackHistory.content || []);
        const paypalPayments = this.convertPayPalHistoryToPayments(paypalHistory.content || []);
        const stripePayments = this.convertStripeHistoryToPayments(stripeHistory.content || []);

        const newPayments = [...paystackPayments, ...paypalPayments, ...stripePayments];
        let allPayments = append ? [...this._payments(), ...newPayments] : newPayments;

        if (append) {
          const uniqueIds = new Set<string>();
          allPayments = allPayments.filter(p => {
             if (uniqueIds.has(p.id)) return false;
             uniqueIds.add(p.id);
             return true;
          });
        }

        allPayments.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        this._payments.set(allPayments);

        const totalElements =
          (paystackHistory.totalElements || 0) +
          (paypalHistory.totalElements || 0) +
          (stripeHistory.totalElements || 0);

        this._pagination.update(p => ({
          ...p,
          page,
          size,
          totalElements,
          totalPages: Math.ceil(totalElements / size) || 1
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
   * Load more payments for infinite scroll
   */
  loadMorePayments(): void {
    if (this._isLoading() || !this.hasMorePayments()) return;
    const nextPage = this._pagination().page + 1;
    this.loadPaymentHistory(nextPage, this._pagination().size, true);
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
    // Build a meaningful description from payment_type
    const typeLabel = item.payment_type === 'CREDIT_PURCHASE' ? 'Credit Purchase' :
                      item.payment_type === 'SUBSCRIPTION' ? 'Subscription Payment' : 'Payment';
    const desc = item.description || `${typeLabel} - ${item.reference}`;

    return {
      id: item.id,
      provider: 'paystack',
      amount: item.amount,
      currency: item.currency,
      status: this.mapPaystackStatus(item.status),
      description: desc,
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
   * Convert PayPal payment history items to unified Payment format
   */
  private convertPayPalHistoryToPayments(items: PayPalPaymentHistoryItem[]): Payment[] {
    return items.map(item => this.convertPayPalItemToPayment(item));
  }

  /**
   * Convert a single PayPal history item to Payment format
   */
  private convertPayPalItemToPayment(item: PayPalPaymentHistoryItem): Payment {
    return {
      id: item.id,
      provider: 'paypal',
      amount: item.amount,
      currency: item.currency?.toUpperCase() || 'USD',
      status: this.mapPayPalStatus(item.status),
      description: item.description || `PayPal Payment - ${item.order_id || item.capture_id || 'N/A'}`,
      paymentMethodBrand: 'PayPal',
      paymentMethodLast4: item.payer_email ? item.payer_email.substring(0, 4) : undefined,
      receiptNumber: item.order_id || item.capture_id || undefined,
      refundedAmount: item.amount_refunded || undefined,
      createdAt: item.created_at,
      updatedAt: item.completed_at || item.created_at,
    };
  }

  /**
   * Map PayPal transaction status to unified PaymentStatus
   */
  private mapPayPalStatus(status: string): PaymentStatus {
    const normalizedStatus = status?.toUpperCase();
    const statusMap: Record<string, PaymentStatus> = {
      'SUCCEEDED': 'succeeded',
      'COMPLETED': 'succeeded',
      'CAPTURED': 'succeeded',
      'APPROVED': 'succeeded',
      'FAILED': 'failed',
      'VOIDED': 'canceled',
      'PENDING': 'pending',
      'CREATED': 'pending',
      'SAVED': 'pending',
      'PAYER_ACTION_REQUIRED': 'pending',
      'REFUNDED': 'refunded',
      'PARTIALLY_REFUNDED': 'refunded',
    };
    return statusMap[normalizedStatus] || 'pending';
  }

  /**
   * Convert Stripe payment history items to unified Payment format
   */
  private convertStripeHistoryToPayments(items: StripePaymentHistoryItem[]): Payment[] {
    return items.map(item => this.convertStripeItemToPayment(item));
  }

  /**
   * Convert a single Stripe history item to Payment format
   */
  private convertStripeItemToPayment(item: StripePaymentHistoryItem): Payment {
    return {
      id: item.id,
      provider: 'stripe',
      amount: item.amount,
      currency: item.currency?.toUpperCase() || 'USD',
      status: this.mapStripeStatus(item.status),
      description: `Stripe Payment - ${item.stripePaymentIntentId || 'N/A'}`,
      paymentMethodBrand: 'Stripe',
      paymentMethodLast4: undefined,
      receiptNumber: item.stripePaymentIntentId || undefined,
      createdAt: item.createdAt,
      updatedAt: item.createdAt,
    };
  }

  /**
   * Map Stripe status to unified PaymentStatus
   */
  private mapStripeStatus(status: string): PaymentStatus {
    const normalizedStatus = status?.toLowerCase();
    const statusMap: Record<string, PaymentStatus> = {
      'succeeded': 'succeeded',
      'requires_payment_method': 'failed',
      'requires_action': 'pending',
      'processing': 'processing',
      'canceled': 'canceled',
      'requires_confirmation': 'pending',
      'requires_capture': 'pending',
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
      tap(response => {
        this._receipts.set(response.content || []);
        this._receiptPagination.set({
          page: response.number ?? response.page ?? page,
          size: response.size ?? size,
          totalElements: response.totalElements ?? 0,
          totalPages: response.totalPages ?? 0
        });
      }),
      catchError(error => {
        console.error('Failed to load receipts:', error);
        this.loadMockReceipts();
        return of(null);
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

  /**
   * Convert currency
   */
  convertCurrency(amountInCents: number, from: string, to: string) {
    return this.api.convertCurrency(amountInCents, from, to);
  }

  /**
   * Delete a single receipt
   */
  deleteReceipt(receiptNumber: string): void {
    this._isProcessing.set(true);
    this._error.set(null);

    this.api.deleteReceipt(receiptNumber).pipe(
      tap(() => {
        this._receipts.update(receipts =>
          receipts.filter(r => r.receiptNumber !== receiptNumber)
        );
        this._receiptPagination.update(p => ({
          ...p,
          totalElements: Math.max(0, p.totalElements - 1)
        }));
        this._selectedReceipt.set(null);
        this._successMessage.set('Receipt deleted successfully');
        this.clearMessageAfterDelay();
      }),
      catchError(error => {
        this._error.set('Failed to delete receipt');
        console.error('Delete receipt error:', error);
        return of(null);
      }),
      finalize(() => this._isProcessing.set(false))
    ).subscribe();
  }

  /**
   * Bulk delete receipts
   */
  bulkDeleteReceipts(receiptNumbers: string[]): void {
    this._isProcessing.set(true);
    this._error.set(null);

    this.api.bulkDeleteReceipts(receiptNumbers).pipe(
      tap(() => {
        this._receipts.update(receipts =>
          receipts.filter(r => !receiptNumbers.includes(r.receiptNumber))
        );
        this._receiptPagination.update(p => ({
          ...p,
          totalElements: Math.max(0, p.totalElements - receiptNumbers.length)
        }));
        this._successMessage.set(`${receiptNumbers.length} receipt${receiptNumbers.length > 1 ? 's' : ''} deleted successfully`);
        this.clearMessageAfterDelay();
      }),
      catchError(error => {
        this._error.set('Failed to delete receipts');
        console.error('Bulk delete receipts error:', error);
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


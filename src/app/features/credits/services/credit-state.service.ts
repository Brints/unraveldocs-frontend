import { Injectable, inject, signal, computed } from '@angular/core';
import { catchError, of, tap, finalize, forkJoin } from 'rxjs';
import { CreditApiService } from './credit-api.service';
import { CouponStateService } from '../../payments/services/coupon-state.service';
import {
  CreditPack,
  CreditBalance,
  CreditTransaction,
  CreditTransferResponse,
  CreditGateway
} from '../models/credit.model';

/**
 * Credit State Service
 * Manages state for credit pack operations using signal-based state management
 */
@Injectable({
  providedIn: 'root'
})
export class CreditStateService {
  private readonly api = inject(CreditApiService);
  private readonly couponState = inject(CouponStateService);

  // ==================== Private State Signals ====================

  private readonly _packs = signal<CreditPack[]>([]);
  private readonly _balance = signal<CreditBalance | null>(null);
  private readonly _transactions = signal<CreditTransaction[]>([]);
  private readonly _selectedPack = signal<CreditPack | null>(null);
  private readonly _selectedGateway = signal<CreditGateway>(this.loadPersistedGateway());
  private readonly _isLoading = signal(false);
  private readonly _isProcessing = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _successMessage = signal<string | null>(null);
  private readonly _lastTransfer = signal<CreditTransferResponse | null>(null);
  private readonly _pagination = signal({
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0,
  });

  // ==================== Public Readonly Signals ====================

  readonly packs = this._packs.asReadonly();
  readonly balance = this._balance.asReadonly();
  readonly transactions = this._transactions.asReadonly();
  readonly selectedPack = this._selectedPack.asReadonly();
  readonly selectedGateway = this._selectedGateway.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isProcessing = this._isProcessing.asReadonly();
  readonly error = this._error.asReadonly();
  readonly successMessage = this._successMessage.asReadonly();
  readonly lastTransfer = this._lastTransfer.asReadonly();
  readonly pagination = this._pagination.asReadonly();

  // ==================== Computed Properties ====================

  readonly creditBalance = computed(() => this._balance()?.balance ?? 0);

  readonly totalPurchased = computed(() => this._balance()?.totalPurchased ?? 0);

  readonly totalUsed = computed(() => this._balance()?.totalUsed ?? 0);
  readonly isLowBalance = computed(() => {
    const balance = this.creditBalance();
    return balance > 0 && balance <= 5;
  });

  readonly selectedPackWithDiscount = computed(() => {
    const pack = this._selectedPack();
    const coupon = this.couponState.appliedCoupon();
    if (!pack) return null;

    const originalPrice = pack.priceInCents / 100;
    if (coupon) {
      return {
        ...pack,
        originalPrice,
        finalPrice: coupon.finalAmount,
        discountAmount: coupon.discountAmount,
        couponCurrency: coupon.currency,
        hasDiscount: true,
      };
    }
    return {
      ...pack,
      originalPrice,
      finalPrice: originalPrice,
      discountAmount: 0,
      couponCurrency: pack.currency,
      hasDiscount: false,
    };
  });

  readonly hasMorePages = computed(() => {
    const p = this._pagination();
    return p.page < p.totalPages - 1;
  });

  // ==================== Actions ====================

  /**
   * Load available credit packs with optional currency conversion
   */
  loadPacks(currency?: string): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api.getPacks(currency).pipe(
      tap(packs => {
        this._packs.set(packs);
      }),
      catchError(error => {
        console.error('Failed to load credit packs:', error);
        this._error.set('Failed to load credit packs. Please try again.');
        return of([]);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  /**
   * Load credit balance
   */
  loadBalance(): void {
    this.api.getBalance().pipe(
      tap(balance => {
        this._balance.set(balance);
      }),
      catchError(error => {
        console.error('Failed to load credit balance:', error);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Load all credit data (packs + balance) with optional currency conversion
   */
  loadAllData(currency?: string): void {
    this._isLoading.set(true);
    this._error.set(null);

    forkJoin({
      packs: this.api.getPacks(currency).pipe(catchError(() => of([]))),
      balance: this.api.getBalance().pipe(catchError(() => of(null))),
    }).pipe(
      tap(({ packs, balance }) => {
        this._packs.set(packs);
        if (balance) this._balance.set(balance);
      }),
      catchError(error => {
        console.error('Failed to load credit data:', error);
        this._error.set('Failed to load credit data. Please try again.');
        return of(null);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  /**
   * Load transaction history
   */
  loadTransactions(page: number = 0, size: number = 20): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api.getTransactions(page, size).pipe(
      tap(response => {
        if (page === 0) {
          this._transactions.set(response.content);
        } else {
          this._transactions.update(prev => [...prev, ...response.content]);
        }
        this._pagination.set({
          page: response.number,
          size: response.size,
          totalElements: response.totalElements,
          totalPages: response.totalPages,
        });
      }),
      catchError(error => {
        console.error('Failed to load transactions:', error);
        this._error.set('Failed to load transaction history.');
        return of(null);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  /**
   * Load more transactions (next page)
   */
  loadMoreTransactions(): void {
    const currentPage = this._pagination().page;
    this.loadTransactions(currentPage + 1);
  }

  /**
   * Select a credit pack for purchase
   */
  selectPack(pack: CreditPack): void {
    this._selectedPack.set(pack);
    this._error.set(null);
    this._successMessage.set(null);
    this.couponState.clearCoupon();
  }

  /**
   * Clear selected pack
   */
  clearSelectedPack(): void {
    this._selectedPack.set(null);
    this.couponState.clearCoupon();
  }

  /**
   * Set payment gateway
   */
  setGateway(gateway: CreditGateway): void {
    this._selectedGateway.set(gateway);
    localStorage.setItem('credit_payment_gateway', gateway);
  }

  /**
   * Purchase the selected credit pack via the backend.
   * The backend handles currency conversion and payment gateway initialization.
   *
   * @param currency - The currency code the user selected for payment (e.g. 'NGN', 'USD', 'GBP')
   */
  purchasePack(currency: string = 'USD'): void {
    const pack = this._selectedPack();
    const gateway = this._selectedGateway();

    if (!pack) {
      this._error.set('Please select a credit pack.');
      return;
    }

    this._isProcessing.set(true);
    this._error.set(null);

    const coupon = this.couponState.appliedCoupon();

    // Generate callback URLs
    const callbackUrl = `${window.location.origin}/credits/purchase/callback`;
    const cancelUrl = `${window.location.origin}/credits/packs`;

    this.api.purchasePack({
      creditPackId: pack.id,
      gateway,
      couponCode: coupon?.code,
      callbackUrl,
      cancelUrl,
      currency,
    }).pipe(
      tap(response => {
        // Store purchase info for callback verification
        sessionStorage.setItem('credit_purchase_reference', response.reference);
        sessionStorage.setItem('credit_purchase_pack', pack.displayName);
        sessionStorage.setItem('credit_purchase_credits', response.creditsToReceive.toString());
        sessionStorage.setItem('credit_purchase_gateway', gateway);

        if (response.paymentUrl) {
          // Redirect to payment gateway
          window.location.href = response.paymentUrl;
        } else {
          this._successMessage.set(`Successfully purchased ${pack.displayName}! ${response.creditsToReceive} credits added.`);
          this.loadBalance();
          this.clearSelectedPack();
        }
      }),
      catchError(error => {
        console.error('Failed to purchase credit pack:', error);
        const errorMessage = error?.error?.message || 'Failed to initialize payment. Please try again.';
        this._error.set(errorMessage);
        return of(null);
      }),
      finalize(() => this._isProcessing.set(false))
    ).subscribe();
  }

  /**
   * Transfer credits to another user
   */
  transferCredits(recipientEmail: string, amount: number): void {
    if (!recipientEmail || amount <= 0) {
      this._error.set('Please provide a valid email and amount.');
      return;
    }

    this._isProcessing.set(true);
    this._error.set(null);
    this._successMessage.set(null);

    this.api.transferCredits({ recipientEmail, amount }).pipe(
      tap(response => {
        this._lastTransfer.set(response);
        this._successMessage.set(
          `Successfully transferred ${response.creditsTransferred} credits to ${response.recipientName} (${response.recipientEmail}).`
        );
        // Refresh balance
        this.loadBalance();
      }),
      catchError(error => {
        console.error('Failed to transfer credits:', error);
        const errorMessage = error?.error?.message || 'Failed to transfer credits. Please try again.';
        this._error.set(errorMessage);
        return of(null);
      }),
      finalize(() => this._isProcessing.set(false))
    ).subscribe();
  }

  /**
   * Clear error message
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Clear success message
   */
  clearSuccessMessage(): void {
    this._successMessage.set(null);
  }

  /**
   * Clear last transfer
   */
  clearLastTransfer(): void {
    this._lastTransfer.set(null);
  }

  // ==================== Persistence ====================

  private loadPersistedGateway(): CreditGateway {
    const persisted = localStorage.getItem('credit_payment_gateway') as CreditGateway | null;
    if (persisted && ['STRIPE', 'PAYSTACK', 'PAYPAL'].includes(persisted)) {
      return persisted;
    }
    return 'PAYSTACK';
  }
}




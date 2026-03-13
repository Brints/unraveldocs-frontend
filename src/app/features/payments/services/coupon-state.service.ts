import { Injectable, inject, signal, computed } from '@angular/core';
import { catchError, of, tap, finalize } from 'rxjs';
import { CouponApiService } from './coupon-api.service';
import {
  CouponValidationStatus,
  AppliedCouponState,
  AvailableCoupon,
  CouponData,
  getCouponErrorMessage,
  CouponErrorCode,
} from '../models/coupon.model';

/**
 * Coupon State Service
 * Manages state for coupon validation, application, and display
 */
@Injectable({
  providedIn: 'root'
})
export class CouponStateService {
  private readonly api = inject(CouponApiService);

  // ==================== Private State Signals ====================
  private readonly _couponInput = signal<string>('');
  private readonly _validationStatus = signal<CouponValidationStatus>('idle');
  private readonly _validatedCoupon = signal<CouponData | null>(null);
  private readonly _appliedCoupon = signal<AppliedCouponState | null>(null);
  private readonly _availableCoupons = signal<AvailableCoupon[]>([]);
  private readonly _error = signal<string | null>(null);
  private readonly _isLoading = signal(false);

  // ==================== Public Readonly Signals ====================
  readonly validationStatus = this._validationStatus.asReadonly();
  readonly appliedCoupon = this._appliedCoupon.asReadonly();
  readonly availableCoupons = this._availableCoupons.asReadonly();
  readonly error = this._error.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();

  // ==================== Computed Properties ====================

  /**
   * Check if coupon input is being validated
   */
  readonly isValidating = computed(() => this._validationStatus() === 'validating');

  /**
   * Check if coupon is being applied
   */
  readonly isApplying = computed(() => this._validationStatus() === 'applying');

  /**
   * Check if a coupon has been applied successfully
   */
  readonly hasCouponApplied = computed(() => this._appliedCoupon() !== null);

  /**
   * Get the discount percentage
   */
  readonly discountPercentage = computed(() => this._appliedCoupon()?.discountPercentage || 0);

  /**
   * Get the discount amount
   */
  readonly discountAmount = computed(() => this._appliedCoupon()?.discountAmount || 0);

  /**
   * Get the original amount
   */
  readonly originalAmount = computed(() => this._appliedCoupon()?.originalAmount || 0);

  /**
   * Get the final amount after discount
   */
  readonly finalAmount = computed(() => this._appliedCoupon()?.finalAmount || 0);

  /**
   * Check if there are available coupons
   */
  readonly hasAvailableCoupons = computed(() => this._availableCoupons().length > 0);

  // ==================== Actions ====================
  /**
   * Apply a coupon to an amount
   */
  applyCoupon(code: string, amount: number, currency: string = 'USD'): void {
    if (!code || code.trim().length === 0) {
      this._error.set('Please enter a coupon code');
      return;
    }

    if (amount <= 0) {
      this._error.set('Invalid amount');
      return;
    }

    const trimmedCode = code.trim().toUpperCase();
    this._couponInput.set(trimmedCode);
    this._validationStatus.set('applying');
    this._error.set(null);

    this.api.applyCoupon(trimmedCode, amount).pipe(
      tap(response => {
        // Handle direct error structure or wrapped structure
        const data = response?.data || response;
        const statusCode = response?.statusCode || response?.status;

        if (data?.minPurchaseRequirementMet && (!statusCode || statusCode < 400)) {
          this._appliedCoupon.set({
            code: data.couponCode,
            discountPercentage: data.discountPercentage,
            discountAmount: data.discountAmount,
            originalAmount: data.originalAmount,
            finalAmount: data.finalAmount,
            currency: data.currency || currency,
            minPurchaseAmount: data.minPurchaseAmount,
            minPurchaseRequirementMet: data.minPurchaseRequirementMet,
          });
          this._validationStatus.set('applied');
        } else {
          this._validationStatus.set('invalid');
          const errorMessage = data?.message ||
                               (data?.minPurchaseAmount ? `Minimum purchase amount of ${data.minPurchaseAmount} not met` : null) ||
                               'Invalid promo code';
          this._error.set(errorMessage);
        }
      }),
      catchError(error => {
        console.error('Failed to apply coupon:', error);
        this._validationStatus.set('error');
        // Extract error message from various possible response structures
        const errorMessage = this.extractErrorMessage(error);
        this._error.set(errorMessage);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Clear applied coupon
   */
  clearCoupon(): void {
    this._couponInput.set('');
    this._validationStatus.set('idle');
    this._validatedCoupon.set(null);
    this._appliedCoupon.set(null);
    this._error.set(null);
  }

  /**
   * Load available coupons for current user
   */
  loadAvailableCoupons(): void {
    this._isLoading.set(true);

    this.api.getAvailableCoupons().pipe(
      tap(coupons => {
        this._availableCoupons.set(coupons);
      }),
      catchError(error => {
        console.error('Failed to load available coupons:', error);
        // Silently fail - available coupons is optional
        return of([]);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  /**
   * Clear any error message
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Helper to extract error message from API response
   */
  private extractErrorMessage(error: any): string {
    const errorBody = error?.error || error;

    if (typeof errorBody === 'string') return errorBody;

    // Direct extraction as requested
    const message = errorBody?.message || errorBody?.errorMessage || errorBody?.error;
    if (typeof message === 'string' && message.length > 0) {
      return message;
    }

    // Fallback to error code translation
    const errorCode = errorBody?.errorCode || errorBody?.data?.errorCode;
    if (errorCode) {
      return getCouponErrorMessage(errorCode as CouponErrorCode);
    }

    return 'Invalid coupon code. Please try again.';
  }
}

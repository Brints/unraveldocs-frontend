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

  readonly couponInput = this._couponInput.asReadonly();
  readonly validationStatus = this._validationStatus.asReadonly();
  readonly validatedCoupon = this._validatedCoupon.asReadonly();
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
   * Check if a coupon has been validated successfully
   */
  readonly hasValidCoupon = computed(() => this._validationStatus() === 'valid');

  /**
   * Check if a coupon has been applied successfully
   */
  readonly hasCouponApplied = computed(() => this._appliedCoupon() !== null);

  /**
   * Get the applied coupon code
   */
  readonly appliedCouponCode = computed(() => this._appliedCoupon()?.code || null);

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
   * Set coupon input value
   */
  setCouponInput(value: string): void {
    this._couponInput.set(value.toUpperCase().trim());
    // Reset validation when input changes
    if (this._validationStatus() !== 'applied') {
      this._validationStatus.set('idle');
      this._validatedCoupon.set(null);
      this._error.set(null);
    }
  }

  /**
   * Validate a coupon code
   */
  validateCoupon(code: string): void {
    if (!code || code.trim().length === 0) {
      this._error.set('Please enter a coupon code');
      return;
    }

    const trimmedCode = code.trim().toUpperCase();
    this._couponInput.set(trimmedCode);
    this._validationStatus.set('validating');
    this._error.set(null);

    this.api.validateCoupon(trimmedCode).pipe(
      tap(response => {
        if (response.valid && response.couponData) {
          this._validatedCoupon.set(response.couponData);
          this._validationStatus.set('valid');
        } else {
          this._validatedCoupon.set(null);
          this._validationStatus.set('invalid');
          this._error.set(getCouponErrorMessage(response.errorCode as CouponErrorCode));
        }
      }),
      catchError(error => {
        console.error('Failed to validate coupon:', error);
        this._validatedCoupon.set(null);
        this._validationStatus.set('error');
        // Extract error message from various possible response structures
        const errorMessage = 
          error.error?.data?.message ||
          error.error?.message ||
          error.message ||
          (error.error?.data?.errorCode ? getCouponErrorMessage(error.error?.data?.errorCode as CouponErrorCode) : null) ||
          'Invalid coupon code. Please try again.';
        this._error.set(errorMessage);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Apply a coupon to an amount
   */
  applyCoupon(code: string, amount: number): void {
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
        if (response.minPurchaseRequirementMet) {
          this._appliedCoupon.set({
            code: response.couponCode,
            discountPercentage: response.discountPercentage,
            discountAmount: response.discountAmount,
            originalAmount: response.originalAmount,
            finalAmount: response.finalAmount,
            minPurchaseAmount: response.minPurchaseAmount,
            minPurchaseRequirementMet: response.minPurchaseRequirementMet,
          });
          this._validationStatus.set('applied');
        } else {
          this._validationStatus.set('invalid');
          this._error.set(
            `Minimum purchase amount of ${response.minPurchaseAmount} not met`
          );
        }
      }),
      catchError(error => {
        console.error('Failed to apply coupon:', error);
        this._validationStatus.set('error');
        // Extract error message from various possible response structures
        const errorMessage = 
          error.error?.data?.message ||
          error.error?.message ||
          error.message ||
          (error.error?.data?.errorCode ? getCouponErrorMessage(error.error?.data?.errorCode as CouponErrorCode) : null) ||
          'Invalid coupon code. Please try again.';
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
   * Select an available coupon and apply it
   */
  selectAvailableCoupon(coupon: AvailableCoupon, amount: number): void {
    this._couponInput.set(coupon.code);
    this.applyCoupon(coupon.code, amount);
  }

  /**
   * Clear any error message
   */
  clearError(): void {
    this._error.set(null);
  }

  /**
   * Reset all coupon state
   */
  reset(): void {
    this._couponInput.set('');
    this._validationStatus.set('idle');
    this._validatedCoupon.set(null);
    this._appliedCoupon.set(null);
    this._availableCoupons.set([]);
    this._error.set(null);
    this._isLoading.set(false);
  }

  /**
   * Get formatted discount display string
   */
  getFormattedDiscount(): string {
    const appliedCoupon = this._appliedCoupon();
    if (!appliedCoupon) return '';
    return `${appliedCoupon.discountPercentage}% off`;
  }

  /**
   * Get formatted savings display string
   */
  getFormattedSavings(currencySymbol: string = '$'): string {
    const appliedCoupon = this._appliedCoupon();
    if (!appliedCoupon) return '';
    return `${currencySymbol}${appliedCoupon.discountAmount.toFixed(2)}`;
  }
}

import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, of, tap, finalize, forkJoin } from 'rxjs';
import { PaystackApiService } from './paystack-api.service';
import { PricingService } from '../../../shared/services/pricing.service';
import { UserApiService } from '../../user/services/user-api.service';
import { IndividualPlan, TeamPlan } from '../../../shared/models/pricing.model';
import { StorageInfo } from '../../user/models/user.model';
import {
  PaystackSubscription,
  PaystackPaymentHistoryItem,
  PaystackCurrency,
  PAYSTACK_CURRENCIES,
  toKobo,
} from '../models/paystack.model';

/**
 * Paystack Billing State Service
 * Manages state for Paystack billing and payment operations
 * Uses the pricing service for plans and storage API for current subscription
 */
@Injectable({
  providedIn: 'root'
})
export class PaystackStateService {
  private readonly api = inject(PaystackApiService);
  private readonly pricingService = inject(PricingService);
  private readonly userApi = inject(UserApiService);
  private readonly router = inject(Router);

  // ==================== Private State Signals ====================

  private readonly _userEmail = signal<string>('');
  private readonly _storageInfo = signal<StorageInfo | null>(null);
  private readonly _selectedPlanId = signal<string | null>(null);
  private readonly _billingInterval = signal<'monthly' | 'yearly'>('monthly');
  private readonly _paystackSubscription = signal<PaystackSubscription | null>(null);
  private readonly _paymentHistory = signal<PaystackPaymentHistoryItem[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _isProcessing = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _successMessage = signal<string | null>(null);
  private readonly _pagination = signal({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0
  });

  // Coupon-related state
  private readonly _couponCode = signal<string | null>(null);
  private readonly _discountAmount = signal<number>(0);
  private readonly _originalAmount = signal<number>(0);
  private readonly _discountedAmount = signal<number>(0);
  private readonly _discountPercentage = signal<number>(0);

  // ==================== Public Readonly Signals ====================

  readonly userEmail = this._userEmail.asReadonly();
  readonly storageInfo = this._storageInfo.asReadonly();
  readonly selectedPlanId = this._selectedPlanId.asReadonly();
  readonly billingInterval = this._billingInterval.asReadonly();
  readonly paystackSubscription = this._paystackSubscription.asReadonly();
  readonly paymentHistory = this._paymentHistory.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isProcessing = this._isProcessing.asReadonly();
  readonly error = this._error.asReadonly();
  readonly successMessage = this._successMessage.asReadonly();
  readonly pagination = this._pagination.asReadonly();

  // Coupon readonly signals
  readonly couponCode = this._couponCode.asReadonly();
  readonly discountAmount = this._discountAmount.asReadonly();
  readonly originalAmount = this._originalAmount.asReadonly();
  readonly discountedAmount = this._discountedAmount.asReadonly();
  readonly discountPercentage = this._discountPercentage.asReadonly();
  readonly hasCoupon = computed(() => !!this._couponCode());

  // Plans from pricing service
  readonly individualPlans = this.pricingService.individualPlans;
  readonly teamPlans = this.pricingService.teamPlans;
  readonly selectedCurrency = this.pricingService.selectedCurrency;
  readonly plansLoading = this.pricingService.isLoading;

  // ==================== Computed Properties ====================

  /**
   * Get current subscription plan name from storage info
   */
  readonly currentPlanName = computed(() => {
    const storage = this._storageInfo();
    return storage?.subscriptionPlan || 'FREE';
  });

  /**
   * Get current billing interval from storage info
   */
  readonly currentBillingInterval = computed(() => {
    const storage = this._storageInfo();
    return storage?.billingInterval?.toLowerCase() as 'monthly' | 'yearly' || 'monthly';
  });

  /**
   * Filter individual plans by billing interval
   */
  readonly filteredIndividualPlans = computed(() => {
    const interval = this._billingInterval();
    const plans = this.individualPlans();
    return plans.filter(p =>
      interval === 'monthly'
        ? p.billingInterval === 'MONTH'
        : p.billingInterval === 'YEAR'
    );
  });

  /**
   * Check if user has an active paid subscription
   */
  readonly hasActiveSubscription = computed(() => {
    const planName = this.currentPlanName();
    return planName !== 'FREE' && planName !== null;
  });

  /**
   * Get selected individual plan
   */
  readonly selectedIndividualPlan = computed(() => {
    const planId = this._selectedPlanId();
    if (!planId) return null;
    return this.individualPlans().find(p => p.planId === planId) || null;
  });

  /**
   * Get selected team plan
   */
  readonly selectedTeamPlan = computed(() => {
    const planId = this._selectedPlanId();
    if (!planId) return null;
    return this.teamPlans().find(p => p.planId === planId) || null;
  });

  /**
   * Get selected plan (individual or team)
   */
  readonly selectedPlan = computed(() => {
    return this.selectedIndividualPlan() || this.selectedTeamPlan();
  });

  /**
   * Get selected plan price
   */
  readonly selectedPlanPrice = computed(() => {
    const individualPlan = this.selectedIndividualPlan();
    if (individualPlan) {
      return individualPlan.price.convertedAmount;
    }

    const teamPlan = this.selectedTeamPlan();
    if (teamPlan) {
      const interval = this._billingInterval();
      return interval === 'monthly'
        ? teamPlan.monthlyPrice.convertedAmount
        : teamPlan.yearlyPrice.convertedAmount;
    }

    return 0;
  });

  /**
   * Get formatted selected plan price
   */
  readonly formattedSelectedPrice = computed(() => {
    const individualPlan = this.selectedIndividualPlan();
    if (individualPlan) {
      return individualPlan.price.formattedPrice;
    }

    const teamPlan = this.selectedTeamPlan();
    if (teamPlan) {
      const interval = this._billingInterval();
      return interval === 'monthly'
        ? teamPlan.monthlyPrice.formattedPrice
        : teamPlan.yearlyPrice.formattedPrice;
    }

    return '';
  });

  // ==================== Actions ====================

  /**
   * Initialize billing state with user data
   */
  initialize(email: string): void {
    this._userEmail.set(email);
  }

  /**
   * Load all billing data
   */
  loadBillingData(currency: string = 'NGN'): void {
    this._isLoading.set(true);
    this._error.set(null);

    // Load plans from pricing service
    this.pricingService.loadPlans(currency);

    // Load storage info and payment history in parallel
    forkJoin({
      storage: this.userApi.getStorageInfo().pipe(
        catchError(err => {
          console.error('Failed to load storage info:', err);
          return of(null);
        })
      ),
      paystackSub: this.api.getActiveSubscription().pipe(
        catchError(() => of(null))
      ),
      history: this.api.getPaymentHistory(0, 10).pipe(
        catchError(() => of({
          content: [],
          totalElements: 0,
          totalPages: 0,
          pageable: { pageNumber: 0, pageSize: 10 }
        }))
      )
    }).pipe(
      tap(({ storage, paystackSub, history }) => {
        if (storage) {
          this._storageInfo.set(storage);
        }
        if (paystackSub) {
          this._paystackSubscription.set(paystackSub);
        }
        this._paymentHistory.set(this.normalizePaymentHistory(history.content));
        this._pagination.set({
          page: history.pageable.pageNumber,
          size: history.pageable.pageSize,
          totalElements: history.totalElements,
          totalPages: history.totalPages
        });
      }),
      catchError(error => {
        console.error('Failed to load billing data:', error);
        this._error.set('Failed to load billing data. Please try again.');
        return of(null);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  /**
   * Change currency and reload plans
   */
  setCurrency(currency: string): void {
    this.pricingService.loadPlans(currency);
  }

  /**
   * Set billing interval
   */
  setBillingInterval(interval: 'monthly' | 'yearly'): void {
    this._billingInterval.set(interval);
  }

  /**
   * Select a plan for checkout
   */
  selectPlan(planId: string): void {
    this._selectedPlanId.set(planId);
    this._error.set(null);
  }

  /**
   * Clear selected plan
   */
  clearSelectedPlan(): void {
    this._selectedPlanId.set(null);
  }

  // ==================== Coupon Management ====================

  /**
   * Set coupon code and discount details
   */
  setCoupon(
    couponCode: string,
    discountPercentage: number,
    discountAmount: number,
    originalAmount: number
  ): void {
    this._couponCode.set(couponCode);
    this._discountPercentage.set(discountPercentage);
    this._discountAmount.set(discountAmount);
    this._originalAmount.set(originalAmount);
    this._discountedAmount.set(originalAmount - discountAmount);
  }

  /**
   * Clear coupon
   */
  clearCoupon(): void {
    this._couponCode.set(null);
    this._discountPercentage.set(0);
    this._discountAmount.set(0);
    this._originalAmount.set(0);
    this._discountedAmount.set(0);
  }

  /**
   * Start checkout process - initializes Paystack transaction and redirects
   */
  startCheckout(): void {
    const email = this._userEmail();
    const individualPlan = this.selectedIndividualPlan();
    const teamPlan = this.selectedTeamPlan();
    const currency = this.selectedCurrency() as PaystackCurrency;

    if (!email) {
      this._error.set('Please ensure you are logged in.');
      return;
    }

    if (!individualPlan && !teamPlan) {
      this._error.set('Please select a plan.');
      return;
    }

    this._isProcessing.set(true);
    this._error.set(null);

    let amount: number;
    let planName: string;
    let planDisplayName: string;

    if (individualPlan) {
      amount = individualPlan.price.convertedAmount;
      planName = individualPlan.planName;
      planDisplayName = individualPlan.displayName;
    } else if (teamPlan) {
      const interval = this._billingInterval();
      amount = interval === 'monthly'
        ? teamPlan.monthlyPrice.convertedAmount
        : teamPlan.yearlyPrice.convertedAmount;
      planName = `${teamPlan.planName}_${interval.toUpperCase()}`;
      planDisplayName = teamPlan.displayName;
    } else {
      this._error.set('Invalid plan selection.');
      this._isProcessing.set(false);
      return;
    }

    // Convert to kobo (amount from API is already in main currency unit)
    // If coupon is applied, use the discounted amount
    const couponCode = this._couponCode();
    const finalAmount = couponCode ? this._discountedAmount() : amount;
    const amountInKobo = toKobo(finalAmount);

    // Generate callback URL
    const callbackUrl = `${window.location.origin}/settings/billing/paystack/callback`;

    this.api.initializeTransaction({
      email,
      amount: amountInKobo,
      currency,
      callbackUrl,
      planCode: planName,
      metadata: {
        planName: planDisplayName,
        planCode: planName,
        billingInterval: this._billingInterval(),
        userId: email,
        source: 'billing_page',
        ...(couponCode && {
          couponCode,
          originalAmount: amount,
          discountAmount: this._discountAmount(),
          discountPercentage: this._discountPercentage()
        })
      }
    }).pipe(
      tap(response => {
        console.log('Paystack initialize response:', response);

        // Handle both snake_case and camelCase response formats
        const authUrl = response.authorizationUrl || response.authorization_url;

        if (!authUrl) {
          console.error('No authorization URL in response:', response);
          this._error.set('Payment initialization failed - no redirect URL received.');
          return;
        }

        // Store reference in session storage for verification later
        sessionStorage.setItem('paystack_reference', response.reference);
        sessionStorage.setItem('paystack_plan_name', planName);
        sessionStorage.setItem('paystack_interval', this._billingInterval());
        if (couponCode) {
          sessionStorage.setItem('paystack_coupon_code', couponCode);
        }

        // Redirect to Paystack checkout page
        console.log('Redirecting to:', authUrl);
        window.location.href = authUrl;
      }),
      catchError(error => {
        console.error('Failed to initialize transaction:', error);
        this._error.set(
          error.error?.message ||
          'Failed to initialize payment. Please try again.'
        );
        return of(null);
      }),
      finalize(() => this._isProcessing.set(false))
    ).subscribe();
  }

  /**
   * Verify transaction after callback
   */
  verifyTransaction(reference: string): void {
    this._isProcessing.set(true);
    this._error.set(null);

    this.api.verifyTransaction(reference).pipe(
      tap(response => {
        if (response.status === 'success') {
          this._successMessage.set('Payment successful! Your subscription has been activated.');

          // Clear session storage
          sessionStorage.removeItem('paystack_reference');
          sessionStorage.removeItem('paystack_plan_name');
          sessionStorage.removeItem('paystack_interval');
          sessionStorage.removeItem('paystack_coupon_code');

          // Clear coupon state
          this.clearCoupon();

          // Reload billing data to get updated subscription
          const currency = this.selectedCurrency();
          this.loadBillingData(currency);

          // Navigate to billing page with success flag
          setTimeout(() => {
            this.router.navigate(['/settings/billing'], {
              queryParams: { success: 'true' }
            });
          }, 2000);
        } else {
          this._error.set(`Payment ${response.status}. ${response.gatewayResponse || ''}`);
        }
      }),
      catchError(error => {
        console.error('Failed to verify transaction:', error);
        this._error.set(
          error.error?.message ||
          'Failed to verify payment. Please contact support if you were charged.'
        );
        return of(null);
      }),
      finalize(() => this._isProcessing.set(false))
    ).subscribe();
  }

  /**
   * Cancel current subscription
   */
  cancelSubscription(): void {
    const subscription = this._paystackSubscription();

    if (!subscription) {
      this._error.set('No active subscription to cancel.');
      return;
    }

    this._isProcessing.set(true);
    this._error.set(null);

    this.api.disableSubscription(subscription.subscriptionCode, subscription.emailToken).pipe(
      tap(response => {
        this._paystackSubscription.set(response);
        this._successMessage.set('Subscription cancelled successfully. You can continue using the service until the end of your billing period.');

        setTimeout(() => this._successMessage.set(null), 5000);
      }),
      catchError(error => {
        console.error('Failed to cancel subscription:', error);
        this._error.set(
          error.error?.message ||
          'Failed to cancel subscription. Please try again or contact support.'
        );
        return of(null);
      }),
      finalize(() => this._isProcessing.set(false))
    ).subscribe();
  }

  /**
   * Reactivate cancelled subscription
   */
  reactivateSubscription(): void {
    const subscription = this._paystackSubscription();

    if (!subscription) {
      this._error.set('No subscription to reactivate.');
      return;
    }

    this._isProcessing.set(true);
    this._error.set(null);

    this.api.enableSubscription(subscription.subscriptionCode, subscription.emailToken).pipe(
      tap(response => {
        this._paystackSubscription.set(response);
        this._successMessage.set('Subscription reactivated successfully!');

        setTimeout(() => this._successMessage.set(null), 5000);
      }),
      catchError(error => {
        console.error('Failed to reactivate subscription:', error);
        this._error.set(
          error.error?.message ||
          'Failed to reactivate subscription. Please try again.'
        );
        return of(null);
      }),
      finalize(() => this._isProcessing.set(false))
    ).subscribe();
  }

  /**
   * Load payment history with pagination
   */
  loadPaymentHistory(page: number = 0, size: number = 10): void {
    this._isLoading.set(true);

    this.api.getPaymentHistory(page, size).pipe(
      tap(response => {
        this._paymentHistory.set(this.normalizePaymentHistory(response.content));
        this._pagination.set({
          page: response.pageable.pageNumber,
          size: response.pageable.pageSize,
          totalElements: response.totalElements,
          totalPages: response.totalPages
        });
      }),
      catchError(error => {
        console.error('Failed to load payment history:', error);
        this._error.set('Failed to load payment history.');
        return of(null);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  /**
   * Normalize payment history items to ensure consistent field names
   * Maps snake_case API fields to camelCase for template compatibility
   */
  private normalizePaymentHistory(items: PaystackPaymentHistoryItem[]): PaystackPaymentHistoryItem[] {
    return items.map(item => ({
      ...item,
      createdAt: item.created_at || item.createdAt || new Date().toISOString(),
      paidAt: item.paid_at || item.paidAt || undefined,
      // Normalize status to lowercase for consistent display
      status: this.normalizeStatus(item.status)
    }));
  }

  /**
   * Normalize status to a display-friendly format
   */
  private normalizeStatus(status: string): string {
    const statusMap: Record<string, string> = {
      'SUCCEEDED': 'Succeeded',
      'SUCCESS': 'Succeeded',
      'SUCCESSFUL': 'Succeeded',
      'PENDING': 'Pending',
      'FAILED': 'Failed',
      'ABANDONED': 'Cancelled',
      'REVERSED': 'Refunded',
      'QUEUED': 'Processing',
      'PROCESSING': 'Processing'
    };
    return statusMap[status?.toUpperCase()] || status;
  }

  // ==================== Utility Methods ====================

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
   * Check if a plan is the current plan
   */
  isCurrentPlan(planName: string): boolean {
    const currentPlan = this.currentPlanName();
    // Normalize plan names for comparison
    const normalizedCurrent = currentPlan.replace('_Monthly', '_MONTHLY').replace('_Yearly', '_YEARLY');
    const normalizedTarget = planName.replace('_Monthly', '_MONTHLY').replace('_Yearly', '_YEARLY');
    return normalizedCurrent === normalizedTarget;
  }

  /**
   * Get button text for plan
   */
  getPlanButtonText(planName: string): string {
    if (this.isCurrentPlan(planName)) {
      return 'Current Plan';
    }

    const currentPlan = this.currentPlanName();
    if (currentPlan === 'FREE') {
      return 'Subscribe';
    }

    // Could add upgrade/downgrade logic here based on plan hierarchy
    return 'Change Plan';
  }
}


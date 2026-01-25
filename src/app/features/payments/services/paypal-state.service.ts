import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, of, tap, finalize, forkJoin } from 'rxjs';
import { PayPalApiService } from './paypal-api.service';
import { PricingService } from '../../../shared/services/pricing.service';
import { UserApiService } from '../../user/services/user-api.service';
import { StorageInfo } from '../../user/models/user.model';
import {
  PayPalSubscriptionDetails,
  PayPalSubscriptionHistoryItem,
  PayPalCreateSubscriptionRequest,
  PayPalBillingPlan,
  PayPalCreateOrderRequest,
  getPayPalStatusLabel,
  canCancelSubscription,
  canSuspendSubscription,
  canActivateSubscription,
} from '../models/paypal.model';

/**
 * PayPal Billing State Service
 * Manages state for PayPal billing and subscription operations
 */
@Injectable({
  providedIn: 'root'
})
export class PayPalStateService {
  private readonly api = inject(PayPalApiService);
  private readonly pricingService = inject(PricingService);
  private readonly userApi = inject(UserApiService);
  private readonly router = inject(Router);

  // ==================== Private State Signals ====================

  private readonly _userEmail = signal<string>('');
  private readonly _storageInfo = signal<StorageInfo | null>(null);
  private readonly _selectedPlanId = signal<string | null>(null);
  private readonly _billingInterval = signal<'monthly' | 'yearly'>('monthly');
  private readonly _activeSubscription = signal<PayPalSubscriptionDetails | null>(null);
  private readonly _subscriptionHistory = signal<PayPalSubscriptionHistoryItem[]>([]);
  private readonly _paypalPlans = signal<PayPalBillingPlan[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _isProcessing = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _successMessage = signal<string | null>(null);
  private readonly _pagination = signal({
    page: 0,
    size: 20,
    totalElements: 0,
    totalPages: 0
  });

  // Coupon-related state
  private readonly _couponCode = signal<string | null>(null);
  private readonly _discountAmount = signal<number>(0);
  private readonly _originalAmount = signal<number>(0);
  private readonly _discountedAmount = signal<number>(0);
  private readonly _lastOrderId = signal<string | null>(null);

  // ==================== Public Readonly Signals ====================

  readonly userEmail = this._userEmail.asReadonly();
  readonly storageInfo = this._storageInfo.asReadonly();
  readonly selectedPlanId = this._selectedPlanId.asReadonly();
  readonly billingInterval = this._billingInterval.asReadonly();
  readonly activeSubscription = this._activeSubscription.asReadonly();
  readonly subscriptionHistory = this._subscriptionHistory.asReadonly();
  readonly paypalPlans = this._paypalPlans.asReadonly();
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
  readonly lastOrderId = this._lastOrderId.asReadonly();
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
    const sub = this._activeSubscription();
    return sub !== null && sub.active;
  });

  /**
   * Check if current subscription can be cancelled
   */
  readonly canCancel = computed(() => {
    const sub = this._activeSubscription();
    return sub ? canCancelSubscription(sub.status) : false;
  });

  /**
   * Check if current subscription can be suspended
   */
  readonly canSuspend = computed(() => {
    const sub = this._activeSubscription();
    return sub ? canSuspendSubscription(sub.status) : false;
  });

  /**
   * Check if current subscription can be activated
   */
  readonly canActivate = computed(() => {
    const sub = this._activeSubscription();
    return sub ? canActivateSubscription(sub.status) : false;
  });

  /**
   * Get formatted subscription status
   */
  readonly subscriptionStatusLabel = computed(() => {
    const sub = this._activeSubscription();
    return sub ? getPayPalStatusLabel(sub.status) : 'No Subscription';
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
   * Get formatted price for selected plan
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

    return null;
  });

  // ==================== Initialization ====================

  /**
   * Initialize user email from auth state
   */
  setUserEmail(email: string): void {
    this._userEmail.set(email);
  }

  /**
   * Load all billing data including PayPal plans
   */
  loadBillingData(): void {
    this._isLoading.set(true);
    this._error.set(null);

    // Load currency preference
    const savedCurrency = localStorage.getItem('preferred_currency') || 'USD';
    this.pricingService.loadPlans(savedCurrency);

    forkJoin({
      storage: this.userApi.getStorageInfo().pipe(
        catchError(() => of(null))
      ),
      history: this.api.getSubscriptionHistory(0, 20).pipe(
        catchError(() => of({
          content: [],
          totalElements: 0,
          totalPages: 0,
          pageable: { pageNumber: 0, pageSize: 20 }
        } as any))
      ),
      paypalPlans: this.api.getPlans().pipe(
        catchError(() => of([]))
      )
    }).pipe(
      tap(({ storage, history, paypalPlans }) => {
        if (storage) {
          this._storageInfo.set(storage);
        }

        // Normalize and store subscription history
        const normalizedHistory = this.normalizeSubscriptionHistory(history.content || []);
        this._subscriptionHistory.set(normalizedHistory);

        // Find the active subscription from history (status = ACTIVE or APPROVED)
        const activeSubscription = normalizedHistory.find(
          sub => sub.status === 'ACTIVE' || sub.status === 'APPROVED'
        );
        if (activeSubscription) {
          // Convert history item to subscription details format
          this._activeSubscription.set({
            id: activeSubscription.subscription_id ?? activeSubscription.subscriptionId ?? '',
            planId: activeSubscription.plan_id ?? activeSubscription.planId ?? '',
            status: activeSubscription.status as any,
            startTime: activeSubscription.start_time ?? activeSubscription.startTime ?? null,
            createTime: activeSubscription.created_at ?? activeSubscription.createdAt ?? '',
            updateTime: null,
            approvalUrl: null,
            customId: activeSubscription.custom_id ?? null,
            billingInfo: {
              outstandingBalance: activeSubscription.outstanding_balance ?? 0,
              currency: activeSubscription.currency ?? 'USD',
              cycleExecutionsCount: activeSubscription.cycles_completed ?? null,
              failedPaymentsCount: activeSubscription.failed_payments_count ?? 0,
              lastPaymentTime: activeSubscription.last_payment_time ?? null,
              lastPaymentAmount: activeSubscription.last_payment_amount ?? null,
              nextBillingTime: activeSubscription.next_billing_time ?? activeSubscription.nextBillingTime ?? null
            },
            subscriber: null,
            links: [],
            active: activeSubscription.status === 'ACTIVE',
            approvalLink: null,
            cancelled: activeSubscription.status === 'CANCELLED',
            pendingApproval: activeSubscription.status === 'APPROVAL_PENDING',
            suspended: activeSubscription.status === 'SUSPENDED'
          });
        } else {
          // Clear stale subscription data when no active record exists
          this._activeSubscription.set(null);
        }

        this._pagination.set({
          page: history.pageable?.pageNumber || 0,
          size: history.pageable?.pageSize || 20,
          totalElements: history.totalElements || 0,
          totalPages: history.totalPages || 0
        });

        // Store PayPal billing plans
        if (paypalPlans && paypalPlans.length > 0) {
          this._paypalPlans.set(paypalPlans);
          console.log('Loaded PayPal plans:', paypalPlans);
        }
      }),
      catchError(error => {
        console.error('Failed to load billing data:', error);
        this._error.set('Failed to load billing data. Please try again.');
        return of(null);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  // ==================== Plan Selection ====================

  /**
   * Select a plan for subscription
   */
  selectPlan(planId: string): void {
    this._selectedPlanId.set(planId);
  }

  /**
   * Clear selected plan
   */
  clearSelectedPlan(): void {
    this._selectedPlanId.set(null);
  }

  /**
   * Set billing interval
   */
  setBillingInterval(interval: 'monthly' | 'yearly'): void {
    this._billingInterval.set(interval);
  }

  /**
   * Change currency and reload plans
   */
  setCurrency(currency: string): void {
    localStorage.setItem('preferred_currency', currency);
    this.pricingService.loadPlans(currency);
  }

  // ==================== Coupon Management ====================

  /**
   * Set coupon code and calculate discount
   */
  setCoupon(couponCode: string, discountAmount: number, originalAmount: number): void {
    this._couponCode.set(couponCode);
    this._discountAmount.set(discountAmount);
    this._originalAmount.set(originalAmount);
    this._discountedAmount.set(originalAmount - discountAmount);
  }

  /**
   * Clear coupon
   */
  clearCoupon(): void {
    this._couponCode.set(null);
    this._discountAmount.set(0);
    this._originalAmount.set(0);
    this._discountedAmount.set(0);
  }

  // ==================== Subscription Actions ====================

  /**
   * Map internal plan name to PayPal billing plan ID
   * The PayPal plans have names like "Starter Monthly", "Pro Yearly", etc.
   */
  private getPayPalPlanId(internalPlanId: string): string | null {
    // First, find the internal plan by ID
    const individualPlan = this.individualPlans().find(p => p.planId === internalPlanId);
    const teamPlan = this.teamPlans().find(p => p.planId === internalPlanId);

    let planName: string | null = null;

    if (individualPlan) {
      // Convert plan name like "PRO_MONTHLY" to "Pro Monthly"
      planName = individualPlan.displayName;
    } else if (teamPlan) {
      // For team plans, determine billing based on selected interval
      const interval = this._billingInterval();
      planName = `${teamPlan.displayName} ${interval === 'monthly' ? 'Monthly' : 'Yearly'}`;
    }

    if (!planName) {
      console.error('Could not find internal plan with ID:', internalPlanId);
      return null;
    }

    console.log('Looking for PayPal plan matching:', planName);

    // Find the matching PayPal plan by name
    const paypalPlans = this._paypalPlans();
    const matchingPlan = paypalPlans.find(p =>
      p.name.toLowerCase() === planName!.toLowerCase() ||
      p.name.toLowerCase().includes(planName!.toLowerCase()) ||
      planName!.toLowerCase().includes(p.name.toLowerCase())
    );

    if (matchingPlan) {
      console.log('Found matching PayPal plan:', matchingPlan);
      return matchingPlan.id;
    }

    // Try a more flexible match based on keywords
    const keywords = planName.toLowerCase().split(' ');
    const flexibleMatch = paypalPlans.find(p => {
      const paypalName = p.name.toLowerCase();
      return keywords.every(k => paypalName.includes(k));
    });

    if (flexibleMatch) {
      console.log('Found flexible match PayPal plan:', flexibleMatch);
      return flexibleMatch.id;
    }

    console.error('No matching PayPal plan found for:', planName);
    console.log('Available PayPal plans:', paypalPlans);
    return null;
  }

  /**
   * Create a new PayPal subscription
   * If a coupon code is set, uses the orders endpoint for one-time discounted payment
   * Otherwise, uses the subscriptions endpoint for recurring billing
   */
  createSubscription(internalPlanId: string): void {
    console.log('PayPal createSubscription called with internal planId:', internalPlanId);

    // Check if we have a coupon code - if so, use orders endpoint
    const couponCode = this._couponCode();
    if (couponCode) {
      this.createOrderWithCoupon(internalPlanId);
      return;
    }

    // Map internal plan ID to PayPal billing plan ID
    const paypalPlanId = this.getPayPalPlanId(internalPlanId);

    if (!paypalPlanId) {
      this._error.set('Could not find the corresponding PayPal plan. Please try again or contact support.');
      return;
    }

    console.log('Mapped to PayPal billing plan ID:', paypalPlanId);

    this._isProcessing.set(true);
    this._error.set(null);

    const baseUrl = window.location.origin;
    const request: PayPalCreateSubscriptionRequest = {
      planId: paypalPlanId,
      returnUrl: `${baseUrl}/payment/success?gateway=paypal`,
      cancelUrl: `${baseUrl}/payment/cancel?gateway=paypal`,
      autoRenewal: true
    };

    console.log('PayPal subscription request:', request);

    // Store subscription info in session for callback
    sessionStorage.setItem('paypal_plan_id', paypalPlanId);
    sessionStorage.setItem('paypal_payment_type', 'subscription');

    this.api.createSubscription(request).pipe(
      tap(response => {
        console.log('PayPal subscription response:', response);
        if (response.approvalUrl) {
          // Redirect to PayPal for approval
          console.log('Redirecting to PayPal:', response.approvalUrl);
          window.location.href = response.approvalUrl;
        } else {
          this._error.set('Failed to get PayPal approval URL');
        }
      }),
      catchError(error => {
        console.error('Failed to create subscription:', error);
        this._error.set(
          error.error?.message ||
          'Failed to create subscription. Please try again.'
        );
        return of(null);
      }),
      finalize(() => this._isProcessing.set(false))
    ).subscribe();
  }

  /**
   * Create a PayPal order with coupon discount
   * Used for one-time discounted payments instead of subscriptions
   */
  private createOrderWithCoupon(internalPlanId: string): void {
    console.log('Creating PayPal order with coupon for planId:', internalPlanId);

    // Map internal plan ID to PayPal billing plan ID
    const paypalPlanId = this.getPayPalPlanId(internalPlanId);

    if (!paypalPlanId) {
      this._error.set('Could not find the corresponding PayPal plan. Please try again or contact support.');
      return;
    }

    // Get plan details for description and currency
    const selectedPlan = this.selectedPlan();
    if (!selectedPlan) {
      this._error.set('No plan selected. Please try again.');
      return;
    }

    const couponCode = this._couponCode()!;
    const discountAmount = this._discountAmount();
    const originalAmount = this._originalAmount();
    const discountedAmount = this._discountedAmount();
    const currency = this.selectedCurrency() || 'USD';

    this._isProcessing.set(true);
    this._error.set(null);

    const baseUrl = window.location.origin;
    const billingInterval = this._billingInterval();
    const description = `${selectedPlan.displayName} - ${billingInterval === 'yearly' ? 'Yearly' : 'Monthly'} (with ${couponCode} coupon)`;

    const request: PayPalCreateOrderRequest = {
      amount: discountedAmount,
      currency: currency.toUpperCase(),
      description: description,
      returnUrl: `${baseUrl}/payment/success?gateway=paypal&type=order`,
      cancelUrl: `${baseUrl}/payment/cancel?gateway=paypal&type=order`,
      metadata: {
        planId: paypalPlanId,
        couponCode: couponCode,
        discountAmount: discountAmount.toFixed(2),
        originalAmount: originalAmount.toFixed(2)
      },
      intent: 'CAPTURE'
    };

    console.log('PayPal order request:', request);

    // Store order info in session for callback
    sessionStorage.setItem('paypal_plan_id', paypalPlanId);
    sessionStorage.setItem('paypal_payment_type', 'order');
    sessionStorage.setItem('paypal_coupon_code', couponCode);

    this.api.createOrder(request).pipe(
      tap(response => {
        console.log('PayPal order response:', response);
        this._lastOrderId.set(response.orderId);
        sessionStorage.setItem('paypal_order_id', response.orderId);

        if (response.approvalUrl) {
          // Redirect to PayPal for approval
          console.log('Redirecting to PayPal for order approval:', response.approvalUrl);
          window.location.href = response.approvalUrl;
        } else {
          this._error.set('Failed to get PayPal approval URL');
        }
      }),
      catchError(error => {
        console.error('Failed to create order:', error);
        this._error.set(
          error.error?.message ||
          'Failed to create order. Please try again.'
        );
        return of(null);
      }),
      finalize(() => this._isProcessing.set(false))
    ).subscribe();
  }

  /**
   * Capture a PayPal order after approval
   */
  captureOrder(orderId: string): void {
    this._isProcessing.set(true);
    this._error.set(null);

    this.api.captureOrder(orderId).pipe(
      tap(response => {
        console.log('PayPal order capture response:', response);
        this._successMessage.set('Payment completed successfully!');
        this.clearMessageAfterDelay();

        // Clear coupon and session data
        this.clearCoupon();
        sessionStorage.removeItem('paypal_plan_id');
        sessionStorage.removeItem('paypal_payment_type');
        sessionStorage.removeItem('paypal_order_id');
        sessionStorage.removeItem('paypal_coupon_code');

        // Refresh billing data
        this.loadBillingData();
      }),
      catchError(error => {
        console.error('Failed to capture order:', error);
        this._error.set(
          error.error?.message ||
          'Failed to complete payment. Please contact support.'
        );
        return of(null);
      }),
      finalize(() => this._isProcessing.set(false))
    ).subscribe();
  }

  /**
   * Cancel a subscription
   */
  cancelSubscription(subscriptionId: string, reason?: string): void {
    this._isProcessing.set(true);
    this._error.set(null);

    this.api.cancelSubscription(subscriptionId, reason).pipe(
      tap(response => {
        this._successMessage.set('Subscription cancelled successfully');
        this.clearMessageAfterDelay();
        // Refresh subscription data
        this.loadBillingData();
      }),
      catchError(error => {
        console.error('Failed to cancel subscription:', error);
        this._error.set(
          error.error?.message ||
          'Failed to cancel subscription. Please try again.'
        );
        return of(null);
      }),
      finalize(() => this._isProcessing.set(false))
    ).subscribe();
  }

  /**
   * Suspend a subscription
   */
  suspendSubscription(subscriptionId: string, reason?: string): void {
    this._isProcessing.set(true);
    this._error.set(null);

    this.api.suspendSubscription(subscriptionId, reason).pipe(
      tap(response => {
        this._successMessage.set('Subscription suspended successfully');
        this.clearMessageAfterDelay();
        // Refresh subscription data
        this.loadBillingData();
      }),
      catchError(error => {
        console.error('Failed to suspend subscription:', error);
        this._error.set(
          error.error?.message ||
          'Failed to suspend subscription. Please try again.'
        );
        return of(null);
      }),
      finalize(() => this._isProcessing.set(false))
    ).subscribe();
  }

  /**
   * Activate/Resume a suspended subscription
   */
  activateSubscription(subscriptionId: string, reason?: string): void {
    this._isProcessing.set(true);
    this._error.set(null);

    this.api.activateSubscription(subscriptionId, reason).pipe(
      tap(response => {
        this._successMessage.set('Subscription activated successfully');
        this.clearMessageAfterDelay();
        // Refresh subscription data
        this.loadBillingData();
      }),
      catchError(error => {
        console.error('Failed to activate subscription:', error);
        this._error.set(
          error.error?.message ||
          'Failed to activate subscription. Please try again.'
        );
        return of(null);
      }),
      finalize(() => this._isProcessing.set(false))
    ).subscribe();
  }

  /**
   * Verify subscription status after PayPal redirect
   */
  verifySubscription(subscriptionId: string): void {
    this._isLoading.set(true);
    this._error.set(null);

    this.api.getSubscriptionDetails(subscriptionId).pipe(
      tap(subscription => {
        this._activeSubscription.set(subscription);

        if (subscription.active) {
          this._successMessage.set('Subscription activated successfully!');
        } else if (subscription.pendingApproval) {
          this._successMessage.set('Subscription is pending approval.');
        }

        this.clearMessageAfterDelay();
        sessionStorage.removeItem('paypal_plan_id');
      }),
      catchError(error => {
        console.error('Failed to verify subscription:', error);
        this._error.set(
          error.error?.message ||
          'Failed to verify subscription. Please contact support.'
        );
        return of(null);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  /**
   * Load subscription history
   */
  loadSubscriptionHistory(page: number = 0, size: number = 20): void {
    this._isLoading.set(true);

    this.api.getSubscriptionHistory(page, size).pipe(
      tap(response => {
        this._subscriptionHistory.set(this.normalizeSubscriptionHistory(response.content || []));
        this._pagination.set({
          page: response.pageable?.pageNumber || 0,
          size: response.pageable?.pageSize || size,
          totalElements: response.totalElements || 0,
          totalPages: response.totalPages || 0
        });
      }),
      catchError(error => {
        console.error('Failed to load subscription history:', error);
        this._error.set('Failed to load subscription history.');
        return of(null);
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();
  }

  // ==================== Utility Methods ====================

  /**
   * Normalize subscription history items for template compatibility
   */
  private normalizeSubscriptionHistory(
    items: PayPalSubscriptionHistoryItem[]
  ): PayPalSubscriptionHistoryItem[] {
    return items.map(item => ({
      ...item,
      subscriptionId: item.subscription_id,
      planId: item.plan_id,
      startTime: item.start_time || undefined,
      nextBillingTime: item.next_billing_time || undefined,
      createdAt: item.created_at
    }));
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
   * Clear messages after delay
   */
  private clearMessageAfterDelay(): void {
    setTimeout(() => {
      this._successMessage.set(null);
    }, 5000);
  }

  /**
   * Format amount with currency
   */
  formatAmount(amount: number | null, currency: string | null): string {
    if (amount === null) return '—';

    const currencySymbols: Record<string, string> = {
      'USD': '$',
      'EUR': '€',
      'GBP': '£',
      'CAD': 'CA$',
      'AUD': 'A$'
    };

    const symbol = currencySymbols[currency || 'USD'] || '$';
    return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string | null): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Format date with time for display
   */
  formatDateTime(dateString: string | null): string {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}

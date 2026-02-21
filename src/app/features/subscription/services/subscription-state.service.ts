import { Injectable, inject, signal, computed } from '@angular/core';
import { catchError, of, tap, finalize, forkJoin } from 'rxjs';
import { SubscriptionApiService } from './subscription-api.service';
import {
  SubscriptionPlan,
  UserSubscription,
  PaymentMethod,
  Invoice,
  SubscriptionUsage,
  PlanTier,
  DEFAULT_PLANS,
  CreateCheckoutRequest,
  UserSubscriptionDetails,
  StorageInfo,
} from '../models/subscription.model';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionStateService {
  private readonly api = inject(SubscriptionApiService);

  // ==================== State Signals ====================

  private readonly _plans = signal<SubscriptionPlan[]>([]);
  private readonly _currentSubscription = signal<UserSubscription | null>(null);
  private readonly _subscriptionDetails = signal<UserSubscriptionDetails | null>(null);
  private readonly _storageInfo = signal<StorageInfo | null>(null);
  private readonly _usage = signal<SubscriptionUsage | null>(null);
  private readonly _paymentMethods = signal<PaymentMethod[]>([]);
  private readonly _invoices = signal<Invoice[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _isProcessing = signal(false);
  private readonly _error = signal<string | null>(null);
  private readonly _successMessage = signal<string | null>(null);
  private readonly _selectedPlanId = signal<string | null>(null);
  private readonly _billingInterval = signal<'monthly' | 'yearly'>('monthly');

  // ==================== Public Readonly Signals ====================

  readonly plans = this._plans.asReadonly();
  readonly currentSubscription = this._currentSubscription.asReadonly();
  readonly subscriptionDetails = this._subscriptionDetails.asReadonly();
  readonly storageInfo = this._storageInfo.asReadonly();
  readonly usage = this._usage.asReadonly();
  readonly paymentMethods = this._paymentMethods.asReadonly();
  readonly invoices = this._invoices.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly isProcessing = this._isProcessing.asReadonly();
  readonly error = this._error.asReadonly();
  readonly successMessage = this._successMessage.asReadonly();
  readonly selectedPlanId = this._selectedPlanId.asReadonly();
  readonly billingInterval = this._billingInterval.asReadonly();

  // ==================== Computed Properties ====================

  readonly currentPlan = computed(() => {
    const sub = this._currentSubscription();
    if (!sub) return null;
    return this._plans().find(p => p.id === sub.planId) || null;
  });

  readonly currentTier = computed<PlanTier>(() => {
    const details = this._subscriptionDetails();
    if (!details) return 'free';
    const planName = details.planName.toLowerCase();
    if (planName.includes('enterprise')) return 'enterprise';
    if (planName.includes('pro')) return 'pro';
    if (planName.includes('starter')) return 'starter';
    return 'free';
  });

  readonly isSubscribed = computed(() => {
    const details = this._subscriptionDetails();
    return details !== null && ['active', 'trial'].includes(details.status);
  });

  readonly isTrialing = computed(() => {
    const details = this._subscriptionDetails();
    return details?.isOnTrial === true || details?.status === 'trial';
  });

  readonly isCanceled = computed(() => {
    const details = this._subscriptionDetails();
    return details?.autoRenew === false || details?.status === 'cancelled';
  });

  readonly trialDaysRemaining = computed(() => {
    const details = this._subscriptionDetails();
    if (!details?.trialEndsAt) return details?.trialDaysRemaining || 0;
    const trialEnd = new Date(details.trialEndsAt);
    const now = new Date();
    const diffMs = trialEnd.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  });

  readonly daysUntilRenewal = computed(() => {
    const details = this._subscriptionDetails();
    if (!details?.currentPeriodEnd) return 0;
    const periodEnd = new Date(details.currentPeriodEnd);
    const now = new Date();
    const diffMs = periodEnd.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  });

  readonly defaultPaymentMethod = computed(() => {
    return this._paymentMethods().find(pm => pm.isDefault) || null;
  });

  readonly hasPaymentMethod = computed(() => {
    return this._paymentMethods().length > 0;
  });

  readonly selectedPlan = computed(() => {
    const planId = this._selectedPlanId();
    if (!planId) return null;
    return this._plans().find(p => p.id === planId) || null;
  });

  readonly displayPlans = computed(() => {
    const interval = this._billingInterval();
    return this._plans().filter(p => p.interval === interval || p.interval === 'one_time');
  });

  // Usage computations
  readonly documentsUsagePercent = computed(() => {
    const storage = this._storageInfo();
    if (!storage || storage.documentsUnlimited || storage.documentUploadLimit <= 0) return 0;
    return Math.min(100, Math.round((storage.documentsUploaded / storage.documentUploadLimit) * 100));
  });

  readonly ocrUsagePercent = computed(() => {
    const storage = this._storageInfo();
    if (!storage || storage.ocrUnlimited || storage.ocrPageLimit <= 0) return 0;
    return Math.min(100, Math.round((storage.ocrPagesUsed / storage.ocrPageLimit) * 100));
  });

  readonly storageUsagePercent = computed(() => {
    const storage = this._storageInfo();
    if (!storage || storage.unlimited || storage.storageLimit <= 0) return 0;
    return storage.percentageUsed;
  });

  // ==================== Actions ====================

  /**
   * Load all subscription data
   */
  loadSubscriptionData(): void {
    this._isLoading.set(true);
    this._error.set(null);

    // Load subscription details and storage info from real APIs
    forkJoin({
      subscription: this.api.getUserSubscriptionDetails().pipe(
        catchError(error => {
          console.error('Failed to load subscription details:', error);
          return of(null);
        })
      ),
      storage: this.api.getStorageInfo().pipe(
        catchError(error => {
          console.error('Failed to load storage info:', error);
          return of(null);
        })
      )
    }).pipe(
      tap(({ subscription, storage }) => {
        if (subscription) {
          this._subscriptionDetails.set(subscription);
          // Also update the usage signal with data from subscription for backwards compatibility
          this._usage.set({
            documentsUsed: subscription.documentsUploaded,
            documentsLimit: subscription.documentUploadLimit,
            ocrPagesUsed: subscription.ocrPagesUsed,
            ocrPagesLimit: subscription.ocrPageLimit,
            storageUsedBytes: subscription.storageUsed,
            storageLimitBytes: subscription.storageLimit,
            apiCallsUsed: 0,
            apiCallsLimit: 0,
            teamMembersUsed: 0,
            teamMembersLimit: 0,
            periodStart: subscription.currentPeriodStart,
            periodEnd: subscription.currentPeriodEnd,
          });
        }
        if (storage) {
          this._storageInfo.set(storage);
          // Update usage signal with more accurate storage data
          if (storage) {
            this._usage.update(u => u ? {
              ...u,
              documentsUsed: storage.documentsUploaded,
              documentsLimit: storage.documentsUnlimited ? -1 : storage.documentUploadLimit,
              ocrPagesUsed: storage.ocrPagesUsed,
              ocrPagesLimit: storage.ocrUnlimited ? -1 : storage.ocrPageLimit,
              storageUsedBytes: storage.storageUsed,
              storageLimitBytes: storage.unlimited ? -1 : storage.storageLimit,
            } : u);
          }
        }
      }),
      finalize(() => this._isLoading.set(false))
    ).subscribe();

    // Load plans for reference
    this.loadPlans();
  }

  /**
   * Load plans
   */
  loadPlans(): void {
    this._isLoading.set(true);

    // Use default plans for now
    const plans = DEFAULT_PLANS.map((p, index) => ({
      ...p,
      id: `plan-${index + 1}`,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    })) as SubscriptionPlan[];

    this._plans.set(plans);
    this._isLoading.set(false);
  }

  /**
   * Load current subscription
   */
  loadCurrentSubscription(): void {
    // Mock implementation - replace with actual API call
    this.loadMockSubscription();
  }

  /**
   * Load usage data
   */
  loadUsage(): void {
    this.loadMockUsage();
  }

  /**
   * Load payment methods
   */
  loadPaymentMethods(): void {
    this.api.getStripeCustomer().pipe(
      tap(customer => {
        this._paymentMethods.set(customer.paymentMethods || []);
      }),
      catchError(error => {
        console.error('Failed to load payment methods:', error);
        this.loadMockPaymentMethods();
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Load invoices/receipts
   */
  loadInvoices(): void {
    this.api.getReceipts().pipe(
      tap(invoices => {
        this._invoices.set(invoices);
      }),
      catchError(error => {
        console.error('Failed to load invoices:', error);
        this.loadMockInvoices();
        return of([]);
      })
    ).subscribe();
  }

  /**
   * Select a plan for checkout
   */
  selectPlan(planId: string): void {
    this._selectedPlanId.set(planId);
  }

  /**
   * Set billing interval
   */
  setBillingInterval(interval: 'monthly' | 'yearly'): void {
    this._billingInterval.set(interval);
  }

  /**
   * Start checkout process
   */
  startCheckout(planId: string): void {
    const plan = this._plans().find(p => p.id === planId);
    if (!plan?.stripePriceId) {
      this._error.set('Invalid plan selected');
      return;
    }

    this._isProcessing.set(true);
    this._error.set(null);

    const request: CreateCheckoutRequest = {
      priceId: plan.stripePriceId,
      successUrl: `${window.location.origin}/subscription/success`,
      cancelUrl: `${window.location.origin}/subscription/plans`,
      trialPeriodDays: plan.trialDays,
    };

    this.api.createCheckoutSession(request).pipe(
      tap(session => {
        // Redirect to Stripe Checkout
        window.location.href = session.url;
      }),
      catchError(error => {
        this._error.set('Failed to start checkout. Please try again.');
        console.error('Checkout error:', error);
        return of(null);
      }),
      finalize(() => this._isProcessing.set(false))
    ).subscribe();
  }

  /**
   * Cancel subscription
   */
  cancelSubscription(immediately = false): void {
    const sub = this._currentSubscription();
    if (!sub) return;

    this._isProcessing.set(true);
    this._error.set(null);

    this.api.cancelSubscription(sub.providerSubscriptionId, immediately).pipe(
      tap(updatedSub => {
        this._currentSubscription.set(updatedSub);
        this._successMessage.set(
          immediately
            ? 'Subscription canceled successfully'
            : 'Subscription will be canceled at the end of the billing period'
        );
        setTimeout(() => this._successMessage.set(null), 5000);
      }),
      catchError(error => {
        this._error.set('Failed to cancel subscription. Please try again.');
        console.error('Cancel subscription error:', error);
        return of(null);
      }),
      finalize(() => this._isProcessing.set(false))
    ).subscribe();
  }

  /**
   * Resume subscription
   */
  resumeSubscription(): void {
    const sub = this._currentSubscription();
    if (!sub) return;

    this._isProcessing.set(true);
    this._error.set(null);

    this.api.resumeSubscription(sub.providerSubscriptionId).pipe(
      tap(updatedSub => {
        this._currentSubscription.set(updatedSub);
        this._successMessage.set('Subscription resumed successfully');
        setTimeout(() => this._successMessage.set(null), 5000);
      }),
      catchError(error => {
        this._error.set('Failed to resume subscription. Please try again.');
        console.error('Resume subscription error:', error);
        return of(null);
      }),
      finalize(() => this._isProcessing.set(false))
    ).subscribe();
  }

  /**
   * Add payment method
   */
  addPaymentMethod(paymentMethodId: string): void {
    this._isProcessing.set(true);
    this._error.set(null);

    this.api.attachPaymentMethod(paymentMethodId).pipe(
      tap(() => {
        this.loadPaymentMethods();
        this._successMessage.set('Payment method added successfully');
        setTimeout(() => this._successMessage.set(null), 5000);
      }),
      catchError(error => {
        this._error.set('Failed to add payment method. Please try again.');
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
        setTimeout(() => this._successMessage.set(null), 3000);
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
   * Download invoice
   */
  downloadInvoice(receiptNumber: string): void {
    this.api.downloadReceipt(receiptNumber).pipe(
      tap(url => {
        window.open(url, '_blank');
      }),
      catchError(error => {
        this._error.set('Failed to download invoice');
        console.error('Download invoice error:', error);
        return of(null);
      })
    ).subscribe();
  }

  // ==================== Utility ====================

  clearError(): void {
    this._error.set(null);
  }

  clearSuccessMessage(): void {
    this._successMessage.set(null);
  }

  // ==================== Mock Data ====================

  private loadMockData(): void {
    this.loadPlans();
    this.loadMockSubscription();
    this.loadMockUsage();
    this.loadMockPaymentMethods();
    this.loadMockInvoices();
    this._isLoading.set(false);
  }

  private loadMockSubscription(): void {
    this._currentSubscription.set({
      id: 'sub-123',
      planId: 'plan-3',
      planName: 'Pro',
      planTier: 'pro',
      status: 'active',
      provider: 'stripe',
      providerSubscriptionId: 'sub_stripe_123',
      currentPeriodStart: '2024-12-01T00:00:00Z',
      currentPeriodEnd: '2025-01-01T00:00:00Z',
      cancelAtPeriodEnd: false,
      createdAt: '2024-06-01T00:00:00Z',
      updatedAt: '2024-12-01T00:00:00Z',
    });
  }

  private loadMockUsage(): void {
    this._usage.set({
      documentsUsed: 156,
      documentsLimit: -1, // Unlimited
      ocrPagesUsed: 847,
      ocrPagesLimit: 2000,
      storageUsedBytes: 12884901888, // ~12 GB
      storageLimitBytes: 53687091200, // 50 GB
      apiCallsUsed: 1234,
      apiCallsLimit: 5000,
      teamMembersUsed: 4,
      teamMembersLimit: 10,
      periodStart: '2024-12-01T00:00:00Z',
      periodEnd: '2025-01-01T00:00:00Z',
    });
  }

  private loadMockPaymentMethods(): void {
    this._paymentMethods.set([
      {
        id: 'pm-1',
        type: 'card',
        brand: 'visa',
        last4: '4242',
        expiryMonth: 12,
        expiryYear: 2026,
        isDefault: true,
        createdAt: '2024-06-01T00:00:00Z',
      },
      {
        id: 'pm-2',
        type: 'card',
        brand: 'mastercard',
        last4: '5555',
        expiryMonth: 8,
        expiryYear: 2025,
        isDefault: false,
        createdAt: '2024-09-01T00:00:00Z',
      },
    ]);
  }

  private loadMockInvoices(): void {
    this._invoices.set([
      {
        id: 'inv-1',
        number: 'INV-2024-0012',
        amount: 2999,
        currency: 'USD',
        status: 'paid',
        provider: 'stripe',
        description: 'Pro Plan - Monthly',
        paidAt: '2024-12-01T00:00:00Z',
        createdAt: '2024-12-01T00:00:00Z',
      },
      {
        id: 'inv-2',
        number: 'INV-2024-0011',
        amount: 2999,
        currency: 'USD',
        status: 'paid',
        provider: 'stripe',
        description: 'Pro Plan - Monthly',
        paidAt: '2024-11-01T00:00:00Z',
        createdAt: '2024-11-01T00:00:00Z',
      },
      {
        id: 'inv-3',
        number: 'INV-2024-0010',
        amount: 2999,
        currency: 'USD',
        status: 'paid',
        provider: 'stripe',
        description: 'Pro Plan - Monthly',
        paidAt: '2024-10-01T00:00:00Z',
        createdAt: '2024-10-01T00:00:00Z',
      },
    ]);
  }
}


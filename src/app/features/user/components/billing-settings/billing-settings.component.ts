import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { UserStateService } from '../../services/user-state.service';
import { UserApiService } from '../../services/user-api.service';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { PaystackStateService } from '../../../payments/services/paystack-state.service';
import { PayPalStateService } from '../../../payments/services/paypal-state.service';
import { CouponStateService } from '../../../payments/services/coupon-state.service';
import { PricingService } from '../../../../shared/services/pricing.service';
import { LoggerService } from '../../../../core/services/logger.service';
import { PaymentMethod, Invoice } from '../../models/user.model';
import { IndividualPlan, TeamPlan, POPULAR_CURRENCIES } from '../../../../shared/models/pricing.model';

@Component({
  selector: 'app-billing-settings',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './billing-settings.component.html',
  styleUrls: ['./billing-settings.component.css']
})
export class BillingSettingsComponent implements OnInit, OnDestroy {
  private readonly userState = inject(UserStateService);
  private readonly userApi = inject(UserApiService);
  private readonly authService = inject(AuthService);
  private readonly paystackState = inject(PaystackStateService);
  private readonly paypalState = inject(PayPalStateService);
  private readonly couponState = inject(CouponStateService);
  private readonly pricingService = inject(PricingService);
  private readonly route = inject(ActivatedRoute);
  private readonly logger = inject(LoggerService);

  private userSubscription?: Subscription;

  // State from user state service
  readonly subscription = this.userState.subscription;
  readonly subscriptionStatus = this.userState.subscriptionStatus;

  // Payment methods and invoices (local state)
  paymentMethods = signal<PaymentMethod[]>([]);
  invoices = signal<Invoice[]>([]);
  isLoadingPayments = signal(true);
  isLoadingInvoices = signal(true);

  // Paystack state
  readonly storageInfo = this.paystackState.storageInfo;
  readonly currentPlanName = this.paystackState.currentPlanName;
  readonly currentBillingInterval = this.paystackState.currentBillingInterval;
  readonly individualPlans = this.paystackState.individualPlans;
  readonly teamPlans = this.paystackState.teamPlans;
  readonly filteredIndividualPlans = this.paystackState.filteredIndividualPlans;
  readonly selectedPlanId = this.paystackState.selectedPlanId;
  readonly billingInterval = this.paystackState.billingInterval;
  readonly selectedCurrency = this.paystackState.selectedCurrency;
  readonly isLoading = this.paystackState.isLoading;
  readonly paymentHistory = this.paystackState.paymentHistory;
  readonly hasActiveSubscription = this.paystackState.hasActiveSubscription;
  readonly formattedSelectedPrice = this.paystackState.formattedSelectedPrice;
  readonly selectedPlan = this.paystackState.selectedPlan;

  // Combined state for processing/errors across payment gateways
  readonly isProcessing = computed(() =>
    this.paystackState.isProcessing() || this.paypalState.isProcessing()
  );
  readonly error = computed(() =>
    this.paystackState.error() || this.paypalState.error()
  );
  readonly successMessage = computed(() =>
    this.paystackState.successMessage() || this.paypalState.successMessage()
  );

  // UI state
  showCheckoutModal = signal(false);
  showCancelModal = signal(false);
  activeTab = signal<'individual' | 'team'>('individual');
  couponInput = signal('');
  
  // Local currency signal for dropdown - initialized directly from localStorage
  // This ensures the dropdown shows the correct value immediately, bypassing async signal chain
  readonly displayCurrency = signal<string>(this.getPersistedCurrencySync());

  // Coupon state from coupon service
  readonly couponValidationStatus = this.couponState.validationStatus;
  readonly couponError = this.couponState.error;
  readonly appliedCoupon = this.couponState.appliedCoupon;
  readonly hasCouponApplied = this.couponState.hasCouponApplied;
  readonly isValidatingCoupon = this.couponState.isValidating;
  readonly isApplyingCoupon = this.couponState.isApplying;
  readonly availableCoupons = this.couponState.availableCoupons;
  readonly hasAvailableCoupons = this.couponState.hasAvailableCoupons;

  // Computed: display price (with or without coupon discount)
  readonly displayPrice = computed(() => {
    const appliedCoupon = this.appliedCoupon();
    if (appliedCoupon) {
      return this.formatCurrency(appliedCoupon.finalAmount, this.selectedCurrency());
    }
    return this.formattedSelectedPrice();
  });

  // Payment Gateway Selection
  readonly paymentGateways = [
    {
      type: 'paystack' as const,
      name: 'Paystack',
      description: 'Pay with card, bank transfer, or USSD',
      icon: '💳',
      supportedCurrencies: ['NGN', 'GHS', 'KES', 'ZAR'],
      isAvailable: true
    },
    {
      type: 'paypal' as const,
      name: 'PayPal',
      description: 'Pay with PayPal account or card',
      icon: '🅿️',
      supportedCurrencies: ['USD', 'EUR', 'GBP'],
      isAvailable: true
    },
    {
      type: 'stripe' as const,
      name: 'Stripe',
      description: 'International cards and payment methods',
      icon: '💎',
      supportedCurrencies: ['USD', 'EUR', 'GBP'],
      isAvailable: false // Coming soon
    }
  ];

  selectedGateway = signal<'paystack' | 'stripe' | 'paypal'>(this.loadPersistedGateway());

  // Available currencies - filtered based on selected gateway
  readonly filteredCurrencies = computed(() => {
    const gateway = this.selectedGateway();
    const gatewayInfo = this.paymentGateways.find(g => g.type === gateway);
    const supportedCodes = gatewayInfo?.supportedCurrencies || ['USD', 'EUR', 'GBP'];
    return POPULAR_CURRENCIES.filter(c => supportedCodes.includes(c.code));
  });

  // Keep full list for reference (used internally)
  readonly currencies = POPULAR_CURRENCIES;

  // Display plans based on tab and interval
  readonly displayPlans = computed(() => {
    if (this.activeTab() === 'individual') {
      return this.filteredIndividualPlans();
    }
    return this.teamPlans();
  });

  ngOnInit(): void {
    // CRITICAL: Load and set persisted currency IMMEDIATELY before any async operations
    // This ensures the dropdown shows the correct currency on first render
    const persistedCurrency = this.loadPersistedCurrency();
    this.paystackState.setCurrency(persistedCurrency);

    // Check for success query param from callback
    this.route.queryParams.subscribe(params => {
      if (params['success'] === 'true') {
        // Success message is handled by state service
      }
    });

    // Subscribe to current user to get email
    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      if (user?.email) {
        this.paystackState.initialize(user.email);
        // Load billing data with the persisted currency (already set above)
        this.paystackState.loadBillingData(persistedCurrency);
        // Also load PayPal billing data and plans
        this.paypalState.loadBillingData();
      }
    });

    this.loadPaymentMethods();
    this.loadInvoices();
  }

  ngOnDestroy(): void {
    this.userSubscription?.unsubscribe();
  }

  private loadPaymentMethods(): void {
    this.isLoadingPayments.set(true);

    // Return empty array - payment methods will be populated from actual saved payment methods
    setTimeout(() => {
      this.paymentMethods.set([]);
      this.isLoadingPayments.set(false);
    }, 500);
  }

  private loadInvoices(): void {
    this.isLoadingInvoices.set(true);

    // Mock data - replace with actual API call when available
    setTimeout(() => {
      this.invoices.set([]);
      this.isLoadingInvoices.set(false);
    }, 1200);
  }

  // ==================== Currency & Interval ====================

  setCurrency(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const currency = select.value;
    // Persist currency to localStorage
    localStorage.setItem('billing_currency', currency);
    // Update local signal for dropdown
    this.displayCurrency.set(currency);
    // Update paystack state to reload plans
    this.paystackState.setCurrency(currency);
  }

  setBillingInterval(interval: 'monthly' | 'yearly'): void {
    this.paystackState.setBillingInterval(interval);
  }

  setActiveTab(tab: 'individual' | 'team'): void {
    this.activeTab.set(tab);
  }

  selectGateway(gateway: 'paystack' | 'stripe' | 'paypal'): void {
    const gatewayInfo = this.paymentGateways.find(g => g.type === gateway);
    if (gatewayInfo?.isAvailable) {
      // Persist gateway to localStorage
      localStorage.setItem('billing_payment_gateway', gateway);
      this.selectedGateway.set(gateway);
      
      // Check if current currency is supported by the new gateway
      const currentCurrency = this.displayCurrency();
      const supportedCurrencies = gatewayInfo.supportedCurrencies;
      
      if (!supportedCurrencies.includes(currentCurrency)) {
        // Switch to the first supported currency for this gateway
        const defaultCurrency = supportedCurrencies[0];
        this.displayCurrency.set(defaultCurrency);
        localStorage.setItem('billing_currency', defaultCurrency);
        this.paystackState.setCurrency(defaultCurrency);
      }
    }
  }

  // ==================== Plan Selection & Checkout ====================

  selectPlan(planId: string): void {
    if (this.paystackState.isCurrentPlan(this.getPlanNameById(planId))) return;
    // Select plan in both state services so it's available regardless of gateway chosen
    this.paystackState.selectPlan(planId);
    this.paypalState.selectPlan(planId);
    // Clear any previously applied coupon when selecting a new plan
    this.couponState.clearCoupon();
    this.couponInput.set('');
    // Load available coupons for the user
    this.couponState.loadAvailableCoupons();
    this.showCheckoutModal.set(true);
  }

  getPlanNameById(planId: string): string {
    const individual = this.individualPlans().find(p => p.planId === planId);
    if (individual) return individual.planName;
    const team = this.teamPlans().find(p => p.planId === planId);
    if (team) return team.planName;
    return '';
  }

  proceedToCheckout(): void {
    this.showCheckoutModal.set(false);

    const selectedGateway = this.selectedGateway();

    // Get selected plan from the appropriate state based on gateway
    const selectedPlan = selectedGateway === 'paypal'
      ? this.paypalState.selectedPlan()
      : this.paystackState.selectedPlan();

    if (!selectedPlan) {
      this.logger.warn('Checkout attempted without selected plan', undefined, 'BillingSettings');
      return;
    }

    // Sync coupon state to payment gateways before checkout
    const appliedCoupon = this.appliedCoupon();
    if (appliedCoupon) {
      if (selectedGateway === 'paystack') {
        this.paystackState.setCoupon(
          appliedCoupon.code,
          appliedCoupon.discountPercentage,
          appliedCoupon.discountAmount,
          appliedCoupon.originalAmount
        );
      } else if (selectedGateway === 'paypal') {
        this.paypalState.setCoupon(
          appliedCoupon.code,
          appliedCoupon.discountAmount,
          appliedCoupon.originalAmount
        );
      }
    }

    this.logger.debug('Proceeding to checkout', { 
      gateway: selectedGateway, 
      planId: selectedPlan.planId,
      hasCoupon: !!appliedCoupon,
      couponCode: appliedCoupon?.code
    }, 'BillingSettings');

    if (selectedGateway === 'paystack') {
      this.paystackState.startCheckout();
    } else if (selectedGateway === 'paypal') {
      // For PayPal, we need to use the PayPal plan ID
      // The planId from the pricing service is the internal ID
      // We need to map it to a PayPal billing plan ID
      this.paypalState.createSubscription(selectedPlan.planId);
    } else {
      this.logger.warn('Unsupported payment gateway selected', { gateway: selectedGateway }, 'BillingSettings');
    }
  }

  cancelCheckout(): void {
    this.showCheckoutModal.set(false);
    this.paystackState.clearSelectedPlan();
    this.paypalState.clearSelectedPlan();
    // Clear coupon state when cancelling checkout
    this.couponState.clearCoupon();
    this.couponInput.set('');
    this.paystackState.clearCoupon();
    this.paypalState.clearCoupon();
  }

  // ==================== Coupon Management ====================

  /**
   * Update coupon input value (called from template)
   */
  updateCouponInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.couponInput.set(input.value.toUpperCase());
  }

  /**
   * Apply coupon to the current plan
   */
  applyCoupon(): void {
    const code = this.couponInput();
    if (!code || code.trim().length === 0) {
      return;
    }

    // Get the plan price to apply the coupon to
    const selectedPlan = this.selectedPlan();
    if (!selectedPlan) {
      return;
    }

    // Get the plan price
    let amount: number;
    if ('price' in selectedPlan) {
      amount = (selectedPlan as IndividualPlan).price.convertedAmount;
    } else {
      const interval = this.billingInterval();
      const teamPlan = selectedPlan as TeamPlan;
      amount = interval === 'monthly'
        ? teamPlan.monthlyPrice.convertedAmount
        : teamPlan.yearlyPrice.convertedAmount;
    }

    this.couponState.applyCoupon(code.trim(), amount);
  }

  /**
   * Remove applied coupon
   */
  removeCoupon(): void {
    this.couponState.clearCoupon();
    this.couponInput.set('');
    this.paystackState.clearCoupon();
    this.paypalState.clearCoupon();
  }

  /**
   * Select an available coupon from the list
   */
  selectAvailableCoupon(couponCode: string): void {
    this.couponInput.set(couponCode);
    this.applyCoupon();
  }

  /**
   * Clear coupon error
   */
  clearCouponError(): void {
    this.couponState.clearError();
  }

  /**
   * Get currency symbol for display
   */
  getCurrencySymbol(): string {
    const currency = this.selectedCurrency();
    // Find symbol from the full currency list
    const currencyInfo = POPULAR_CURRENCIES.find(c => c.code === currency);
    return currencyInfo?.symbol || '$';
  }

  // ==================== Subscription Management ====================

  openCancelModal(): void {
    this.showCancelModal.set(true);
  }

  closeCancelModal(): void {
    this.showCancelModal.set(false);
  }

  confirmCancelSubscription(): void {
    const gateway = this.selectedGateway();
    if (gateway === 'paypal') {
      const subscription = this.paypalState.activeSubscription();
      if (subscription) {
        this.paypalState.cancelSubscription(subscription.id);
      }
    } else {
      this.paystackState.cancelSubscription();
    }
    this.closeCancelModal();
  }

  reactivateSubscription(): void {
    const gateway = this.selectedGateway();
    if (gateway === 'paypal') {
      const subscription = this.paypalState.activeSubscription();
      if (subscription) {
        this.paypalState.activateSubscription(subscription.id);
      }
    } else {
      this.paystackState.reactivateSubscription();
    }
  }

  // ==================== Payment Methods ====================

  setDefaultPaymentMethod(paymentMethodId: string): void {
    this.paymentMethods.update(methods =>
      methods.map(m => ({ ...m, isDefault: m.id === paymentMethodId }))
    );
  }

  removePaymentMethod(paymentMethodId: string): void {
    this.paymentMethods.update(methods =>
      methods.filter(m => m.id !== paymentMethodId)
    );
  }

  // ==================== Utility Methods ====================

  isCurrentPlan(planName: string): boolean {
    return this.paystackState.isCurrentPlan(planName);
  }

  getPlanButtonText(planName: string): string {
    return this.paystackState.getPlanButtonText(planName);
  }

  getButtonClass(plan: IndividualPlan | TeamPlan): string {
    const planName = (plan as IndividualPlan).planName || (plan as TeamPlan).planName;
    if (this.isCurrentPlan(planName)) return 'plan-btn current';
    return 'plan-btn upgrade';
  }

  getCardBrandIcon(brand: string): string {
    const icons: Record<string, string> = {
      'visa': 'M3 10h2l.5-2h3l.5 2h2l-1-4h-2l-.5 2h-1l-.5-2h-2l-1 4zm10 0h2l1-4h-2l-1 4zm4-2a2 2 0 104 0 2 2 0 00-4 0z',
      'mastercard': 'M16 12a4 4 0 11-8 0 4 4 0 018 0zm-4-2a2 2 0 100 4 2 2 0 000-4z',
      'amex': 'M3 10h18v4H3v-4z',
      'default': 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z'
    };
    return icons[brand.toLowerCase()] || icons['default'];
  }

  getCardBrandName(brand: string): string {
    const names: Record<string, string> = {
      'visa': 'Visa',
      'mastercard': 'Mastercard',
      'amex': 'American Express',
      'discover': 'Discover'
    };
    return names[brand.toLowerCase()] || brand;
  }

  formatCurrency(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatPaystackAmount(amount: number, currency: string): string {
    // Amount from Paystack API is in kobo, convert to main unit
    const mainAmount = amount / 100;
    const currencyInfo = POPULAR_CURRENCIES.find(c => c.code === currency);
    const symbol = currencyInfo?.symbol || currency;
    return `${symbol}${mainAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
  }

  getCurrentPlan() {
    const planName = this.currentPlanName();

    // Try to find matching individual plan
    const individual = this.individualPlans().find(p =>
      p.planName === planName ||
      p.planName.replace('_MONTHLY', '').replace('_YEARLY', '') === planName.replace('_Monthly', '').replace('_Yearly', '')
    );

    if (individual) {
      return {
        name: individual.displayName,
        monthlyPrice: individual.price.convertedAmount,
        features: individual.features
      };
    }

    // Try to find matching team plan
    const team = this.teamPlans().find(p =>
      p.planName === planName ||
      p.planName.toUpperCase() === planName.toUpperCase() ||
      p.displayName.toUpperCase().includes(planName.toUpperCase())
    );

    if (team) {
      // For team plans, use the monthly price by default
      return {
        name: team.displayName,
        monthlyPrice: team.monthlyPrice.convertedAmount,
        features: team.features
      };
    }

    // Only return free plan if no active subscription
    if (!this.hasActiveSubscription()) {
      return {
        name: 'Free',
        monthlyPrice: 0,
        features: ['Basic document processing', 'Limited OCR pages', 'Email support']
      };
    }

    // If we have an active subscription but can't find the plan, return plan name as-is
    return {
      name: planName || 'Unknown Plan',
      monthlyPrice: 0,
      features: []
    };
  }

  clearError(): void {
    this.paystackState.clearError();
    this.paypalState.clearError();
  }

  clearSuccessMessage(): void {
    this.paystackState.clearSuccessMessage();
    this.paypalState.clearSuccessMessage();
  }

  canUpgrade(planId: string): boolean {
    // Check if plan is upgradeable (not current plan)
    const planName = this.getPlanNameById(planId);
    return !this.isCurrentPlan(planName);
  }

  // Plan display helpers
  getDisplayPlans() {
    return this.displayPlans();
  }

  // ==================== Persistence ====================

  /**
   * Get persisted currency synchronously - used for initial signal value
   * This is called during class property initialization before ngOnInit
   */
  private getPersistedCurrencySync(): string {
    const persisted = localStorage.getItem('billing_currency');
    if (persisted && POPULAR_CURRENCIES.some(c => c.code === persisted)) {
      return persisted;
    }
    return 'USD';
  }

  private loadPersistedCurrency(): string {
    const persisted = localStorage.getItem('billing_currency');
    // Validate persisted currency is in the supported currency list
    if (persisted && POPULAR_CURRENCIES.some(c => c.code === persisted)) {
      return persisted;
    }
    return 'USD'; // Default to USD
  }

  private loadPersistedGateway(): 'paystack' | 'stripe' | 'paypal' {
    const persisted = localStorage.getItem('billing_payment_gateway') as 'paystack' | 'stripe' | 'paypal' | null;
    // Validate persisted gateway is available
    if (persisted) {
      const gateway = this.paymentGateways.find(g => g.type === persisted);
      if (gateway?.isAvailable) {
        return persisted;
      }
    }
    return 'paystack'; // Default to paystack
  }
}


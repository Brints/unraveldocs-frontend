import { Component, inject, signal, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserStateService } from '../../services/user-state.service';
import { UserApiService } from '../../services/user-api.service';
import { AuthService } from '../../../../core/auth/services/auth.service';
import { PaystackStateService } from '../../../payments/services/paystack-state.service';
import { PayPalStateService } from '../../../payments/services/paypal-state.service';
import { PricingService } from '../../../../shared/services/pricing.service';
import { PaymentMethod, Invoice } from '../../models/user.model';
import { IndividualPlan, TeamPlan, POPULAR_CURRENCIES } from '../../../../shared/models/pricing.model';

@Component({
  selector: 'app-billing-settings',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './billing-settings.component.html',
  styleUrls: ['./billing-settings.component.css']
})
export class BillingSettingsComponent implements OnInit, OnDestroy {
  private readonly userState = inject(UserStateService);
  private readonly userApi = inject(UserApiService);
  private readonly authService = inject(AuthService);
  private readonly paystackState = inject(PaystackStateService);
  private readonly paypalState = inject(PayPalStateService);
  private readonly pricingService = inject(PricingService);
  private readonly route = inject(ActivatedRoute);

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

  // Payment Gateway Selection
  readonly paymentGateways = [
    {
      type: 'paystack' as const,
      name: 'Paystack',
      description: 'Pay with card, bank transfer, or USSD',
      icon: '💳',
      supportedCurrencies: ['NGN', 'GHS', 'ZAR', 'KES', 'USD'],
      isAvailable: true
    },
    {
      type: 'paypal' as const,
      name: 'PayPal',
      description: 'Pay with PayPal account or card',
      icon: '🅿️',
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
      isAvailable: true
    },
    {
      type: 'stripe' as const,
      name: 'Stripe',
      description: 'International cards and payment methods',
      icon: '💎',
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD'],
      isAvailable: false // Coming soon
    }
  ];

  selectedGateway = signal<'paystack' | 'stripe' | 'paypal'>('paystack');

  // Available currencies
  readonly currencies = POPULAR_CURRENCIES.filter(c =>
    ['NGN', 'GHS', 'ZAR', 'KES', 'USD'].includes(c.code)
  );

  // Display plans based on tab and interval
  readonly displayPlans = computed(() => {
    if (this.activeTab() === 'individual') {
      return this.filteredIndividualPlans();
    }
    return this.teamPlans();
  });

  ngOnInit(): void {
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
        // Load billing data with NGN as default for African users
        this.paystackState.loadBillingData('NGN');
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
    this.paystackState.setCurrency(select.value);
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
      this.selectedGateway.set(gateway);
    }
  }

  // ==================== Plan Selection & Checkout ====================

  selectPlan(planId: string): void {
    if (this.paystackState.isCurrentPlan(this.getPlanNameById(planId))) return;
    // Select plan in both state services so it's available regardless of gateway chosen
    this.paystackState.selectPlan(planId);
    this.paypalState.selectPlan(planId);
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
      console.error('No plan selected');
      return;
    }

    console.log('Proceeding to checkout with gateway:', selectedGateway, 'plan:', selectedPlan.planId);

    if (selectedGateway === 'paystack') {
      this.paystackState.startCheckout();
    } else if (selectedGateway === 'paypal') {
      // For PayPal, we need to use the PayPal plan ID
      // The planId from the pricing service is the internal ID
      // We need to map it to a PayPal billing plan ID
      this.paypalState.createSubscription(selectedPlan.planId);
    } else {
      console.error('Unsupported payment gateway:', selectedGateway);
    }
  }

  cancelCheckout(): void {
    this.showCheckoutModal.set(false);
    this.paystackState.clearSelectedPlan();
    this.paypalState.clearSelectedPlan();
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

  getCurrentPlan() {
    const planName = this.currentPlanName();
    // Find matching plan from individual or team plans
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
    // Default to free plan display
    return {
      name: 'Free',
      monthlyPrice: 0,
      features: ['Basic document processing', 'Limited OCR pages', 'Email support']
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
}


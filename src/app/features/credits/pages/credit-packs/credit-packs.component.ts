import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CreditStateService } from '../../services/credit-state.service';
import { CouponStateService } from '../../../payments/services/coupon-state.service';
import { PricingService } from '../../../../shared/services/pricing.service';
import { POPULAR_CURRENCIES } from '../../../../shared/models/pricing.model';
import {
  CreditPack,
  CreditGateway,
  formatCentsToPrice,
} from '../../models/credit.model';

@Component({
  selector: 'app-credit-packs',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './credit-packs.component.html',
  styleUrls: ['./credit-packs.component.css']
})
export class CreditPacksComponent implements OnInit {
  private readonly creditState = inject(CreditStateService);
  private readonly couponState = inject(CouponStateService);
  private readonly pricingService = inject(PricingService);

  // State from service
  readonly packs = this.creditState.packs;
  readonly balance = this.creditState.balance;
  readonly creditBalance = this.creditState.creditBalance;
  readonly totalPurchased = this.creditState.totalPurchased;
  readonly totalUsed = this.creditState.totalUsed;
  readonly selectedPack = this.creditState.selectedPack;
  readonly selectedGateway = this.creditState.selectedGateway;
  readonly isLoading = this.creditState.isLoading;
  readonly isProcessing = this.creditState.isProcessing;
  readonly error = this.creditState.error;
  readonly successMessage = this.creditState.successMessage;
  readonly selectedPackWithDiscount = this.creditState.selectedPackWithDiscount;

  // Coupon state
  readonly appliedCoupon = this.couponState.appliedCoupon;
  readonly hasCouponApplied = this.couponState.hasCouponApplied;
  readonly isValidatingCoupon = this.couponState.isValidating;
  readonly couponError = this.couponState.error;
  readonly availableCoupons = this.couponState.availableCoupons;
  readonly hasAvailableCoupons = this.couponState.hasAvailableCoupons;

  // UI state
  showCheckoutModal = signal(false);
  couponInput = signal('');

  // Currency state for page-level display
  readonly displayCurrency = signal<string>(this.loadPersistedCurrency());

  // Currency state for the checkout modal (gateway-specific)
  readonly modalCurrency = signal<string>('NGN');

  // All currencies reference
  readonly allCurrencies = POPULAR_CURRENCIES;

  // Payment gateways with supported currencies
  readonly paymentGateways: {
    type: CreditGateway;
    name: string;
    description: string;
    icon: string;
    available: boolean;
    supportedCurrencies: string[];
    defaultCurrency: string;
  }[] = [
    {
      type: 'PAYSTACK',
      name: 'Paystack',
      description: 'Pay with card, bank transfer, or USSD',
      icon: '💳',
      available: true,
      supportedCurrencies: ['NGN', 'GHS', 'KES', 'ZAR'],
      defaultCurrency: 'NGN',
    },
    {
      type: 'PAYPAL',
      name: 'PayPal',
      description: 'Pay with PayPal account or card',
      icon: '🅿️',
      available: true,
      supportedCurrencies: ['USD', 'EUR', 'GBP'],
      defaultCurrency: 'USD',
    },
    {
      type: 'STRIPE',
      name: 'Stripe',
      description: 'International cards & payment methods',
      icon: '💎',
      available: false,
      supportedCurrencies: ['USD', 'EUR', 'GBP'],
      defaultCurrency: 'USD',
    },
  ];

  // Filtered currencies for the modal dropdown (based on selected gateway)
  readonly filteredModalCurrencies = computed(() => {
    const gateway = this.selectedGateway();
    const gatewayInfo = this.paymentGateways.find(g => g.type === gateway);
    const supportedCodes = gatewayInfo?.supportedCurrencies || ['USD', 'EUR', 'GBP'];
    return POPULAR_CURRENCIES.filter(c => supportedCodes.includes(c.code));
  });


  // Computed
  readonly usagePercentage = computed(() => {
    const purchased = this.totalPurchased();
    if (purchased === 0) return 0;
    return Math.round((this.totalUsed() / purchased) * 100);
  });

  ngOnInit(): void {
    // Load packs with the persisted display currency for server-side conversion
    const currency = this.displayCurrency();
    this.creditState.loadAllData(currency !== 'USD' ? currency : undefined);
    this.couponState.loadAvailableCoupons();
    // Set initial modal currency based on persisted gateway
    const gateway = this.selectedGateway();
    const gatewayInfo = this.paymentGateways.find(g => g.type === gateway);
    if (gatewayInfo) {
      this.modalCurrency.set(gatewayInfo.defaultCurrency);
    }
  }

  selectPack(pack: CreditPack): void {
    this.creditState.selectPack(pack);
    // Reset modal currency to gateway default when opening modal
    const gateway = this.selectedGateway();
    const gatewayInfo = this.paymentGateways.find(g => g.type === gateway);
    if (gatewayInfo) {
      this.modalCurrency.set(gatewayInfo.defaultCurrency);
    }
    this.showCheckoutModal.set(true);
  }

  closeCheckout(): void {
    this.showCheckoutModal.set(false);
    this.creditState.clearSelectedPack();
    this.couponInput.set('');
  }

  setGateway(gateway: CreditGateway): void {
    this.creditState.setGateway(gateway);
    // Auto-set modal currency to the gateway's default
    const gatewayInfo = this.paymentGateways.find(g => g.type === gateway);
    if (gatewayInfo) {
      this.modalCurrency.set(gatewayInfo.defaultCurrency);
    }
    // Clear coupon since the currency changed and amounts are no longer valid
    this.removeCoupon();
  }

  purchasePack(): void {
    const currency = this.modalCurrency();
    this.creditState.purchasePack(currency);
  }

  // ==================== Currency Methods ====================

  /**
   * Set page-level display currency (header dropdown)
   * Reloads packs from the backend with server-side currency conversion
   */
  setPageCurrency(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const currency = select.value;
    localStorage.setItem('credit_display_currency', currency);
    this.displayCurrency.set(currency);
    // Reload packs with the new currency for server-side conversion
    this.creditState.loadPacks(currency !== 'USD' ? currency : undefined);
  }

  /**
   * Set modal currency (checkout modal dropdown)
   */
  setModalCurrency(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.modalCurrency.set(select.value);
    // Clear coupon since the currency changed and amounts are no longer valid
    this.removeCoupon();
  }

  /**
   * Format price in the display currency for the page.
   * Uses the backend's pre-converted price when available.
   */
  formatDisplayPrice(pack: CreditPack): string {
    const currency = this.displayCurrency();
    // If backend returned converted data for this currency, use it
    if (pack.formattedPrice && pack.convertedCurrency === currency) {
      return pack.formattedPrice;
    }
    // Otherwise show the original USD price
    return formatCentsToPrice(pack.priceInCents, pack.currency);
  }

  /**
   * Format cost per credit in the display currency for the page.
   * Uses the backend's exchange rate when available.
   */
  formatDisplayCostPerCredit(pack: CreditPack): string {
    const currency = this.displayCurrency();
    if (pack.exchangeRate && pack.convertedCurrency === currency && currency !== 'USD') {
      const convertedCost = Math.round(pack.costPerCredit * pack.exchangeRate);
      return formatCentsToPrice(convertedCost, currency);
    }
    return formatCentsToPrice(pack.costPerCredit, pack.currency);
  }

  /**
   * Format price in the modal currency for the checkout modal.
   * Uses the backend's exchange rate when available, otherwise uses PricingService fallback.
   */
  formatModalPrice(amountInCents: number): string {
    const currency = this.modalCurrency();
    if (currency === 'USD') {
      return formatCentsToPrice(amountInCents, 'USD');
    }
    // Use the selected pack's exchange rate from the backend if the currencies match
    const pack = this.selectedPack();
    if (pack?.exchangeRate && pack.convertedCurrency === currency) {
      const converted = Math.round(amountInCents * pack.exchangeRate);
      return formatCentsToPrice(converted, currency);
    }
    // Fallback: use PricingService approximate conversion
    return this.pricingService.convertFromUSD(amountInCents, currency).formattedPrice;
  }

  /**
   * Get the current modal currency symbol
   */
  getModalCurrencySymbol(): string {
    const code = this.modalCurrency();
    const info = POPULAR_CURRENCIES.find(c => c.code === code);
    return info?.symbol || '$';
  }

  private loadPersistedCurrency(): string {
    const persisted = localStorage.getItem('credit_display_currency');
    if (persisted && POPULAR_CURRENCIES.some(c => c.code === persisted)) {
      return persisted;
    }
    return 'USD';
  }

  // Coupon methods
  updateCouponInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.couponInput.set(input.value.toUpperCase());
  }

  applyCoupon(): void {
    const code = this.couponInput();
    const pack = this.selectedPack();
    if (!code || !pack) return;

    // Calculate the amount in the current modal currency
    const currency = this.modalCurrency();
    let amount: number;

    if (currency === 'USD') {
      amount = pack.priceInCents / 100;
    } else if (pack.exchangeRate && pack.convertedCurrency === currency) {
      // Use the backend's exchange rate for accurate conversion
      amount = Math.round(pack.priceInCents * pack.exchangeRate) / 100;
    } else {
      // Fallback: use PricingService approximate conversion
      const converted = this.pricingService.convertFromUSD(pack.priceInCents, currency);
      amount = converted.convertedCents / 100;
    }

    this.couponState.applyCoupon(code.trim(), amount, currency);
  }

  removeCoupon(): void {
    this.couponState.clearCoupon();
    this.couponInput.set('');
  }

  selectAvailableCoupon(code: string): void {
    this.couponInput.set(code);
    this.applyCoupon();
  }

  clearError(): void {
    this.creditState.clearError();
  }

  clearSuccess(): void {
    this.creditState.clearSuccessMessage();
  }

  formatPrice(cents: number, currency: string = 'USD'): string {
    return formatCentsToPrice(cents, currency);
  }

  /**
   * Format a main currency unit amount (not cents) for display.
   * e.g. formatCurrencyAmount(199.95, 'NGN') => '₦199.95'
   */
  formatCurrencyAmount(amount: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(amount);
  }

  getPackIcon(name: string): string {
    const icons: Record<string, string> = {
      'STARTER_PACK': 'M13 10V3L4 14h7v7l9-11h-7z',
      'VALUE_PACK': 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      'POWER_PACK': 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
    };
    return icons[name] || icons['STARTER_PACK'];
  }

  getPackGradient(index: number): string {
    const gradients = [
      'from-blue-500 to-cyan-500',
      'from-purple-500 to-pink-500',
      'from-amber-500 to-orange-500',
    ];
    return gradients[index % gradients.length];
  }

  getBestValueIndex(): number {
    const packList = this.packs();
    if (packList.length === 0) return -1;
    let bestIdx = 0;
    let bestCost = packList[0].costPerCredit;
    packList.forEach((p, i) => {
      if (p.costPerCredit < bestCost) {
        bestCost = p.costPerCredit;
        bestIdx = i;
      }
    });
    return bestIdx;
  }
}


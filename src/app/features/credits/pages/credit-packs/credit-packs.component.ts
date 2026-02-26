import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CreditStateService } from '../../services/credit-state.service';
import { CouponStateService } from '../../../payments/services/coupon-state.service';
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

  // Payment gateways
  readonly paymentGateways: { type: CreditGateway; name: string; description: string; icon: string; available: boolean }[] = [
    {
      type: 'PAYSTACK',
      name: 'Paystack',
      description: 'Pay with card, bank transfer, or USSD',
      icon: '💳',
      available: true,
    },
    {
      type: 'PAYPAL',
      name: 'PayPal',
      description: 'Pay with PayPal account or card',
      icon: '🅿️',
      available: true,
    },
    {
      type: 'STRIPE',
      name: 'Stripe',
      description: 'International cards & payment methods',
      icon: '💎',
      available: false,
    },
  ];

  // Computed
  readonly usagePercentage = computed(() => {
    const purchased = this.totalPurchased();
    if (purchased === 0) return 0;
    return Math.round((this.totalUsed() / purchased) * 100);
  });

  ngOnInit(): void {
    this.creditState.loadAllData();
    this.couponState.loadAvailableCoupons();
  }

  selectPack(pack: CreditPack): void {
    this.creditState.selectPack(pack);
    this.showCheckoutModal.set(true);
  }

  closeCheckout(): void {
    this.showCheckoutModal.set(false);
    this.creditState.clearSelectedPack();
    this.couponInput.set('');
  }

  setGateway(gateway: CreditGateway): void {
    this.creditState.setGateway(gateway);
  }

  purchasePack(): void {
    this.creditState.purchasePack();
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
    const amount = pack.priceInCents / 100;
    this.couponState.applyCoupon(code.trim(), amount);
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


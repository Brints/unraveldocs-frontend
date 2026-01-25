import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SubscriptionStateService } from '../../services/subscription-state.service';
import { SubscriptionPlan, PlanTier } from '../../models/subscription.model';
import { CouponApiService } from '../../../coupon/services/coupon-api.service';
import { AppliedCoupon } from '../../../coupon/models/coupon.model';
import { catchError, finalize, of, tap } from 'rxjs';

@Component({
  selector: 'app-plans-comparison',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  templateUrl: './plans-comparison.component.html',
  styleUrls: ['./plans-comparison.component.css']
})
export class PlansComparisonComponent implements OnInit {
  protected readonly subState = inject(SubscriptionStateService);
  private readonly couponApi = inject(CouponApiService);

  // Local state
  showConfirmModal = signal(false);
  selectedPlanForCheckout = signal<SubscriptionPlan | null>(null);

  // Coupon state
  couponCode = signal('');
  appliedCoupon = signal<AppliedCoupon | null>(null);
  isValidatingCoupon = signal(false);
  couponError = signal<string | null>(null);
  couponSuccess = signal<string | null>(null);

  // From state service
  readonly plans = this.subState.plans;
  readonly currentSubscription = this.subState.currentSubscription;
  readonly currentTier = this.subState.currentTier;
  readonly billingInterval = this.subState.billingInterval;
  readonly isLoading = this.subState.isLoading;
  readonly isProcessing = this.subState.isProcessing;
  readonly error = this.subState.error;
  readonly successMessage = this.subState.successMessage;

  ngOnInit(): void {
    this.subState.loadSubscriptionData();
  }

  setBillingInterval(interval: 'monthly' | 'yearly'): void {
    this.subState.setBillingInterval(interval);
  }

  selectPlan(plan: SubscriptionPlan): void {
    if (plan.tier === this.currentTier()) return;
    if (plan.tier === 'enterprise') {
      window.location.href = 'mailto:sales@unraveldocs.com?subject=Enterprise%20Plan%20Inquiry';
      return;
    }

    this.selectedPlanForCheckout.set(plan);
    this.showConfirmModal.set(true);
  }

  confirmSubscription(): void {
    const plan = this.selectedPlanForCheckout();
    if (plan) {
      this.subState.startCheckout(plan.id);
      this.closeConfirmModal();
    }
  }

  closeConfirmModal(): void {
    this.showConfirmModal.set(false);
    this.selectedPlanForCheckout.set(null);
    this.removeCoupon();
  }

  isCurrentPlan(plan: SubscriptionPlan): boolean {
    return plan.tier === this.currentTier();
  }

  isUpgrade(plan: SubscriptionPlan): boolean {
    const tierOrder: PlanTier[] = ['free', 'starter', 'pro', 'enterprise'];
    const currentIndex = tierOrder.indexOf(this.currentTier());
    const planIndex = tierOrder.indexOf(plan.tier);
    return planIndex > currentIndex;
  }

  getButtonText(plan: SubscriptionPlan): string {
    if (this.isCurrentPlan(plan)) return 'Current Plan';
    if (plan.tier === 'free') return 'Downgrade';
    if (plan.tier === 'enterprise') return 'Contact Sales';
    if (this.isUpgrade(plan)) return 'Upgrade';
    return 'Switch Plan';
  }

  getButtonClass(plan: SubscriptionPlan): string {
    if (this.isCurrentPlan(plan)) return 'btn-current';
    if (plan.isPopular) return 'btn-primary';
    return 'btn-outline';
  }

  formatPrice(price: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: price % 1 === 0 ? 0 : 2,
    }).format(price);
  }

  getYearlyPrice(plan: SubscriptionPlan): number {
    return Math.round(plan.price * 12 * 0.8 * 100) / 100;
  }

  getYearlySavings(plan: SubscriptionPlan): number {
    return Math.round(plan.price * 12 * 0.2 * 100) / 100;
  }

  getTierIcon(tier: PlanTier): string {
    switch (tier) {
      case 'free': return 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
      case 'starter': return 'M13 10V3L4 14h7v7l9-11h-7z';
      case 'pro': return 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z';
      case 'enterprise': return 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4';
      default: return 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z';
    }
  }

  // ==================== Coupon Methods ====================

  applyCoupon(): void {
    const code = this.couponCode().trim();
    const plan = this.selectedPlanForCheckout();

    if (!code) {
      this.couponError.set('Please enter a coupon code');
      return;
    }

    if (!plan) {
      this.couponError.set('No plan selected');
      return;
    }

    this.isValidatingCoupon.set(true);
    this.couponError.set(null);
    this.couponSuccess.set(null);

    this.couponApi.validateCoupon({
      code,
      planId: plan.id,
      currency: plan.currency
    }).pipe(
      tap(response => {
        if (response.valid && response.coupon) {
          this.appliedCoupon.set({
            code: response.coupon.code,
            type: response.coupon.type,
            value: response.coupon.value,
            description: response.coupon.description,
            originalAmount: response.originalAmount,
            discountAmount: response.discountAmount,
            finalAmount: response.finalAmount,
            currency: response.currency
          });
          this.couponSuccess.set(
            response.coupon.type === 'PERCENTAGE'
              ? `${response.coupon.value}% discount applied!`
              : `${this.formatPrice(response.discountAmount, response.currency)} discount applied!`
          );
          this.couponError.set(null);
        } else {
          this.couponError.set(response.message || 'Invalid coupon code');
          this.appliedCoupon.set(null);
        }
      }),
      catchError(error => {
        console.error('Coupon validation error:', error);
        this.couponError.set(
          error.error?.message || 'Failed to validate coupon. Please try again.'
        );
        this.appliedCoupon.set(null);
        return of(null);
      }),
      finalize(() => this.isValidatingCoupon.set(false))
    ).subscribe();
  }

  removeCoupon(): void {
    this.appliedCoupon.set(null);
    this.couponCode.set('');
    this.couponSuccess.set(null);
    this.couponError.set(null);
  }

  getFinalPrice(): number {
    const coupon = this.appliedCoupon();
    if (coupon) {
      return coupon.finalAmount / (this.billingInterval() === 'yearly' ? 12 : 1);
    }
    const plan = this.selectedPlanForCheckout();
    if (!plan) return 0;
    return this.billingInterval() === 'yearly'
      ? this.getYearlyPrice(plan) / 12
      : plan.price;
  }
}

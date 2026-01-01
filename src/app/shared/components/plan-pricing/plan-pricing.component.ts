import { Component, inject, OnInit, signal, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PricingService } from '../../services/pricing.service';
import { Currency } from '../../models/pricing.model';

@Component({
  selector: 'app-plan-pricing',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './plan-pricing.component.html',
  styleUrls: ['./plan-pricing.component.css']
})
export class PlanPricingComponent implements OnInit {
  protected readonly pricingService = inject(PricingService);

  // Inputs
  showIndividual = input(true);
  showTeam = input(true);
  compact = input(false);

  // State
  readonly currencies = this.pricingService.currencies;
  readonly selectedCurrency = this.pricingService.selectedCurrency;
  readonly selectedCurrencyInfo = this.pricingService.selectedCurrencyInfo;
  readonly individualMonthlyPlans = this.pricingService.individualMonthlyPlans;
  readonly individualYearlyPlans = this.pricingService.individualYearlyPlans;
  readonly teamPlans = this.pricingService.teamPlans;
  readonly isLoading = this.pricingService.isLoading;
  readonly error = this.pricingService.error;
  readonly exchangeRateTimestamp = this.pricingService.exchangeRateTimestamp;

  // Local state
  billingInterval = signal<'monthly' | 'yearly'>('monthly');
  showCurrencyDropdown = signal(false);
  searchQuery = signal('');

  ngOnInit(): void {
    this.pricingService.initialize();
  }

  toggleBillingInterval(): void {
    this.billingInterval.update(v => v === 'monthly' ? 'yearly' : 'monthly');
  }

  setBillingInterval(interval: 'monthly' | 'yearly'): void {
    this.billingInterval.set(interval);
  }

  selectCurrency(currency: Currency): void {
    this.pricingService.changeCurrency(currency.code);
    this.showCurrencyDropdown.set(false);
    this.searchQuery.set('');
  }

  toggleDropdown(): void {
    this.showCurrencyDropdown.update(v => !v);
    if (!this.showCurrencyDropdown()) {
      this.searchQuery.set('');
    }
  }

  closeDropdown(): void {
    this.showCurrencyDropdown.set(false);
    this.searchQuery.set('');
  }

  get filteredCurrencies(): Currency[] {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.currencies();
    return this.currencies().filter(c =>
      c.code.toLowerCase().includes(query) ||
      c.name.toLowerCase().includes(query)
    );
  }

  getIndividualPlans() {
    return this.billingInterval() === 'monthly'
      ? this.individualMonthlyPlans()
      : this.individualYearlyPlans();
  }

  getTeamPrice(plan: any) {
    return this.billingInterval() === 'monthly'
      ? plan.monthlyPrice
      : plan.yearlyPrice;
  }

  formatLastUpdated(): string {
    const timestamp = this.exchangeRateTimestamp();
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getPlanTier(planName: string): 'free' | 'basic' | 'pro' | 'business' | 'premium' | 'enterprise' {
    const name = planName.toLowerCase();
    if (name.includes('free')) return 'free';
    if (name.includes('basic') || name.includes('starter')) return 'basic';
    if (name.includes('pro')) return 'pro';
    if (name.includes('business')) return 'business';
    if (name.includes('premium')) return 'premium';
    if (name.includes('enterprise')) return 'enterprise';
    return 'basic';
  }

  isPopularPlan(planName: string): boolean {
    const name = planName.toLowerCase();
    return name.includes('pro') || name.includes('premium');
  }
}


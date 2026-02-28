import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  Currency,
  CurrenciesResponse,
  PlansResponse,
  POPULAR_CURRENCIES
} from '../models/pricing.model';

@Injectable({
  providedIn: 'root'
})
export class PricingService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/plans`;

  // State
  private readonly _currencies = signal<Currency[]>(POPULAR_CURRENCIES);
  private readonly _selectedCurrency = signal<string>('USD');
  private readonly _plans = signal<PlansResponse | null>(null);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly signals
  readonly currencies = this._currencies.asReadonly();
  readonly selectedCurrency = this._selectedCurrency.asReadonly();
  readonly plans = this._plans.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed
  readonly individualPlans = computed(() => this._plans()?.individualPlans ?? []);
  readonly teamPlans = computed(() => this._plans()?.teamPlans ?? []);
  readonly exchangeRateTimestamp = computed(() => this._plans()?.exchangeRateTimestamp);

  readonly selectedCurrencyInfo = computed(() => {
    const code = this._selectedCurrency();
    return this._currencies().find(c => c.code === code) || { code: 'USD', symbol: '$', name: 'US Dollar' };
  });

  // Group individual plans by type (monthly/yearly)
  readonly individualMonthlyPlans = computed(() =>
    this.individualPlans().filter(p => p.billingInterval === 'MONTH')
  );

  readonly individualYearlyPlans = computed(() =>
    this.individualPlans().filter(p => p.billingInterval === 'YEAR')
  );

  /**
   * Load supported currencies
   */
  loadCurrencies(): void {
    this.http.get<CurrenciesResponse>(`${this.apiUrl}/currencies`).pipe(
      catchError(err => {
        console.warn('Failed to load currencies, using defaults:', err);
        return of({ currencies: POPULAR_CURRENCIES, totalCount: POPULAR_CURRENCIES.length });
      })
    ).subscribe(response => {
      this._currencies.set(response.currencies);
    });
  }

  /**
   * Load plans with pricing in specified currency
   */
  loadPlans(currency: string = 'USD'): void {
    this._isLoading.set(true);
    this._error.set(null);
    this._selectedCurrency.set(currency);

    this.http.get<PlansResponse>(`${this.apiUrl}`, {
      params: { currency }
    }).pipe(
      catchError(err => {
        console.warn('Failed to load plans from API, using fallback data:', err);
        // Return fallback data instead of showing error
        return of(this.getFallbackPlans(currency));
      })
    ).subscribe(response => {
      if (response) {
        this._plans.set(response);
      }
      this._isLoading.set(false);
    });
  }

  /**
   * Get fallback pricing data when API is unavailable
   */
  private getFallbackPlans(currency: string): PlansResponse {
    const currencyInfo = this._currencies().find(c => c.code === currency) || { code: 'USD', symbol: '$', name: 'US Dollar' };
    const timestamp = new Date().toISOString();
    const rate = this.getFallbackExchangeRate(currency);

    const convert = (usd: number) => {
      const converted = Math.round(usd * rate * 100) / 100;
      return {
        originalAmountUsd: usd,
        convertedAmount: converted,
        currency,
        formattedPrice: this.formatFallbackPrice(converted, currency, currencyInfo.symbol),
        exchangeRate: rate,
        rateTimestamp: timestamp,
      };
    };

    return {
      individualPlans: [
        {
          planId: 'free-plan',
          planName: 'FREE',
          displayName: 'Free',
          billingInterval: 'MONTH',
          price: convert(0),
          documentUploadLimit: 5,
          ocrPageLimit: 25,
          isActive: true,
          features: ['Basic document processing', 'Limited OCR pages', 'Email support']
        },
        {
          planId: 'starter-monthly',
          planName: 'STARTER_MONTHLY',
          displayName: 'Starter',
          billingInterval: 'MONTH',
          price: convert(9),
          documentUploadLimit: 30,
          ocrPageLimit: 150,
          isActive: true,
          features: ['Standard document processing', 'Increased OCR pages', 'Priority email support', 'API access']
        },
        {
          planId: 'pro-monthly',
          planName: 'PRO_MONTHLY',
          displayName: 'Pro',
          billingInterval: 'MONTH',
          price: convert(19),
          documentUploadLimit: 100,
          ocrPageLimit: 500,
          isActive: true,
          features: ['Advanced document processing', 'High OCR page limit', 'Priority support', 'Full API access', 'Custom integrations']
        },
        {
          planId: 'business-monthly',
          planName: 'BUSINESS_MONTHLY',
          displayName: 'Business',
          billingInterval: 'MONTH',
          price: convert(49),
          documentUploadLimit: 500,
          ocrPageLimit: 2500,
          isActive: true,
          features: ['Unlimited document processing', 'Unlimited OCR pages', '24/7 premium support', 'Full API access', 'Custom integrations', 'Dedicated account manager']
        },
        {
          planId: 'starter-yearly',
          planName: 'STARTER_YEARLY',
          displayName: 'Starter',
          billingInterval: 'YEAR',
          price: convert(90),
          documentUploadLimit: 360,
          ocrPageLimit: 1800,
          isActive: true,
          features: ['Standard document processing', 'Increased OCR pages', 'Priority email support', 'API access']
        },
        {
          planId: 'pro-yearly',
          planName: 'PRO_YEARLY',
          displayName: 'Pro',
          billingInterval: 'YEAR',
          price: convert(190),
          documentUploadLimit: 1200,
          ocrPageLimit: 6000,
          isActive: true,
          features: ['Advanced document processing', 'High OCR page limit', 'Priority support', 'Full API access', 'Custom integrations']
        },
        {
          planId: 'business-yearly',
          planName: 'BUSINESS_YEARLY',
          displayName: 'Business',
          billingInterval: 'YEAR',
          price: convert(490),
          documentUploadLimit: 6000,
          ocrPageLimit: 30000,
          isActive: true,
          features: ['Unlimited document processing', 'Unlimited OCR pages', '24/7 premium support', 'Full API access', 'Custom integrations', 'Dedicated account manager']
        }
      ],
      teamPlans: [
        {
          planId: 'team-premium',
          planName: 'TEAM_PREMIUM',
          displayName: 'Team Premium',
          description: 'Perfect for small teams. Includes 200 documents per month with up to 10 members.',
          monthlyPrice: convert(29),
          yearlyPrice: convert(290),
          maxMembers: 10,
          monthlyDocumentLimit: 200,
          hasAdminPromotion: false,
          hasEmailInvitations: false,
          trialDays: 10,
          isActive: true,
          features: ['Up to 10 team members', '200 documents per month', '10-day free trial', 'Team collaboration', 'Shared workspace']
        },
        {
          planId: 'team-enterprise',
          planName: 'TEAM_ENTERPRISE',
          displayName: 'Team Enterprise',
          description: 'For larger teams that need unlimited documents, admin roles, and email invitations.',
          monthlyPrice: convert(79),
          yearlyPrice: convert(790),
          maxMembers: 15,
          monthlyDocumentLimit: -1, // Unlimited
          hasAdminPromotion: true,
          hasEmailInvitations: true,
          trialDays: 10,
          isActive: true,
          features: ['Up to 15 team members', 'Unlimited documents', 'Admin role promotion', 'Email invitations', '10-day free trial', 'Team collaboration', 'Shared workspace']
        }
      ],
      displayCurrency: currency,
      exchangeRateTimestamp: timestamp
    };
  }

  /**
   * Approximate fallback exchange rates (USD → target)
   * Used only when the API is unreachable
   */
  private getFallbackExchangeRate(currency: string): number {
    const rates: Record<string, number> = {
      'USD': 1,
      'EUR': 0.92,
      'GBP': 0.79,
      'NGN': 1550,
      'GHS': 14.5,
      'KES': 129,
      'ZAR': 18.2,
      'INR': 83.5,
      'CAD': 1.36,
      'AUD': 1.53,
      'JPY': 150,
      'CNY': 7.24,
      'BRL': 4.97,
      'MXN': 17.1,
      'AED': 3.67,
      'SGD': 1.34,
      'CHF': 0.88,
    };
    return rates[currency] ?? 1;
  }

  /**
   * Format a price for fallback display
   */
  private formatFallbackPrice(amount: number, currency: string, symbol: string): string {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch {
      // If Intl doesn't recognise the currency code, fall back to symbol + number
      return `${symbol}${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
    }
  }

  /**
   * Public exchange rate accessor for currency conversion
   * Returns the approximate exchange rate from USD to the target currency
   */
  getExchangeRate(currency: string): number {
    return this.getFallbackExchangeRate(currency);
  }

  /**
   * Convert an amount in USD cents to the target currency
   * Returns the converted amount in cents and a formatted price string
   */
  convertFromUSD(amountInCents: number, targetCurrency: string): { convertedCents: number; formattedPrice: string } {
    const rate = this.getFallbackExchangeRate(targetCurrency);
    const convertedCents = Math.round(amountInCents * rate);
    const amount = convertedCents / 100;
    const currencyInfo = this._currencies().find(c => c.code === targetCurrency) || { code: targetCurrency, symbol: targetCurrency, name: targetCurrency };
    const formattedPrice = this.formatFallbackPrice(amount, targetCurrency, currencyInfo.symbol);
    return { convertedCents, formattedPrice };
  }

  /**
   * Change currency and reload plans
   */
  changeCurrency(currency: string): void {
    if (currency !== this._selectedCurrency()) {
      this.loadPlans(currency);
    }
  }

  /**
   * Get user's preferred currency from browser locale
   */
  detectUserCurrency(): string {
    try {
      const locale = navigator.language || 'en-US';
      const regionCode = locale.split('-')[1]?.toUpperCase();

      // Map region codes to currencies
      const regionToCurrency: Record<string, string> = {
        'US': 'USD',
        'GB': 'GBP',
        'EU': 'EUR',
        'DE': 'EUR',
        'FR': 'EUR',
        'IT': 'EUR',
        'ES': 'EUR',
        'NG': 'NGN',
        'IN': 'INR',
        'CA': 'CAD',
        'AU': 'AUD',
        'JP': 'JPY',
        'CN': 'CNY',
        'ZA': 'ZAR',
        'GH': 'GHS',
        'KE': 'KES',
        'BR': 'BRL',
        'MX': 'MXN',
        'AE': 'AED',
        'SG': 'SGD',
        'CH': 'CHF'
      };

      return regionToCurrency[regionCode] || 'USD';
    } catch {
      return 'USD';
    }
  }

  /**
   * Initialize pricing with auto-detected currency
   */
  initialize(): void {
    this.loadCurrencies();
    const detectedCurrency = this.detectUserCurrency();
    this.loadPlans(detectedCurrency);
  }
}


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

    return {
      individualPlans: [
        {
          planId: 'free-plan',
          planName: 'FREE',
          displayName: 'Free',
          billingInterval: 'MONTH',
          price: { originalAmountUsd: 0, convertedAmount: 0, currency, formattedPrice: `${currencyInfo.symbol}0`, exchangeRate: 1, rateTimestamp: timestamp },
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
          price: { originalAmountUsd: 9, convertedAmount: 9, currency, formattedPrice: `${currencyInfo.symbol}9`, exchangeRate: 1, rateTimestamp: timestamp },
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
          price: { originalAmountUsd: 19, convertedAmount: 19, currency, formattedPrice: `${currencyInfo.symbol}19`, exchangeRate: 1, rateTimestamp: timestamp },
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
          price: { originalAmountUsd: 49, convertedAmount: 49, currency, formattedPrice: `${currencyInfo.symbol}49`, exchangeRate: 1, rateTimestamp: timestamp },
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
          price: { originalAmountUsd: 90, convertedAmount: 90, currency, formattedPrice: `${currencyInfo.symbol}90`, exchangeRate: 1, rateTimestamp: timestamp },
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
          price: { originalAmountUsd: 190, convertedAmount: 190, currency, formattedPrice: `${currencyInfo.symbol}190`, exchangeRate: 1, rateTimestamp: timestamp },
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
          price: { originalAmountUsd: 490, convertedAmount: 490, currency, formattedPrice: `${currencyInfo.symbol}490`, exchangeRate: 1, rateTimestamp: timestamp },
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
          monthlyPrice: { originalAmountUsd: 29, convertedAmount: 29, currency, formattedPrice: `${currencyInfo.symbol}29`, exchangeRate: 1, rateTimestamp: timestamp },
          yearlyPrice: { originalAmountUsd: 290, convertedAmount: 290, currency, formattedPrice: `${currencyInfo.symbol}290`, exchangeRate: 1, rateTimestamp: timestamp },
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
          monthlyPrice: { originalAmountUsd: 79, convertedAmount: 79, currency, formattedPrice: `${currencyInfo.symbol}79`, exchangeRate: 1, rateTimestamp: timestamp },
          yearlyPrice: { originalAmountUsd: 790, convertedAmount: 790, currency, formattedPrice: `${currencyInfo.symbol}790`, exchangeRate: 1, rateTimestamp: timestamp },
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


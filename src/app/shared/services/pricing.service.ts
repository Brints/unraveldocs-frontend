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
        this._error.set('Failed to load pricing. Please try again.');
        this._isLoading.set(false);
        return of(null);
      })
    ).subscribe(response => {
      if (response) {
        this._plans.set(response);
      }
      this._isLoading.set(false);
    });
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


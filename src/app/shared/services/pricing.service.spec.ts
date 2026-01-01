import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PricingService } from './pricing.service';
import { environment } from '../../../environments/environment';
import { PlansResponse, CurrenciesResponse } from '../models/pricing.model';

describe('PricingService', () => {
  let service: PricingService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/plans`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PricingService]
    });

    service = TestBed.inject(PricingService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('loadCurrencies', () => {
    it('should load currencies from API', () => {
      const mockResponse: CurrenciesResponse = {
        currencies: [
          { code: 'USD', symbol: '$', name: 'US Dollar' },
          { code: 'EUR', symbol: '€', name: 'Euro' },
          { code: 'NGN', symbol: '₦', name: 'Nigerian Naira' }
        ],
        totalCount: 3
      };

      service.loadCurrencies();

      const req = httpMock.expectOne(`${apiUrl}/currencies`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      expect(service.currencies().length).toBe(3);
      expect(service.currencies()[0].code).toBe('USD');
    });

    it('should use default currencies on error', () => {
      service.loadCurrencies();

      const req = httpMock.expectOne(`${apiUrl}/currencies`);
      req.error(new ErrorEvent('Network error'));

      // Should have default currencies
      expect(service.currencies().length).toBeGreaterThan(0);
    });
  });

  describe('loadPlans', () => {
    it('should load plans with default USD currency', () => {
      const mockResponse: PlansResponse = {
        individualPlans: [
          {
            planId: '1',
            planName: 'PRO_MONTHLY',
            displayName: 'Pro Monthly',
            billingInterval: 'MONTH',
            price: {
              originalAmountUsd: 29.99,
              convertedAmount: 29.99,
              currency: 'USD',
              formattedPrice: '$29.99',
              exchangeRate: 1,
              rateTimestamp: '2024-12-31T12:00:00Z'
            },
            documentUploadLimit: 500,
            ocrPageLimit: 2000,
            isActive: true,
            features: ['Feature 1', 'Feature 2']
          }
        ],
        teamPlans: [],
        displayCurrency: 'USD',
        exchangeRateTimestamp: '2024-12-31T12:00:00Z'
      };

      service.loadPlans();

      const req = httpMock.expectOne(`${apiUrl}?currency=USD`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      expect(service.individualPlans().length).toBe(1);
      expect(service.selectedCurrency()).toBe('USD');
    });

    it('should load plans with specified currency', () => {
      const mockResponse: PlansResponse = {
        individualPlans: [
          {
            planId: '1',
            planName: 'PRO_MONTHLY',
            displayName: 'Pro Monthly',
            billingInterval: 'MONTH',
            price: {
              originalAmountUsd: 29.99,
              convertedAmount: 46484.50,
              currency: 'NGN',
              formattedPrice: '₦46,484.50',
              exchangeRate: 1550,
              rateTimestamp: '2024-12-31T12:00:00Z'
            },
            documentUploadLimit: 500,
            ocrPageLimit: 2000,
            isActive: true,
            features: ['Feature 1']
          }
        ],
        teamPlans: [],
        displayCurrency: 'NGN',
        exchangeRateTimestamp: '2024-12-31T12:00:00Z'
      };

      service.loadPlans('NGN');

      const req = httpMock.expectOne(`${apiUrl}?currency=NGN`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);

      expect(service.selectedCurrency()).toBe('NGN');
      expect(service.individualPlans()[0].price.formattedPrice).toBe('₦46,484.50');
    });

    it('should handle error when loading plans', () => {
      service.loadPlans();

      const req = httpMock.expectOne(`${apiUrl}?currency=USD`);
      req.error(new ErrorEvent('Network error'));

      expect(service.error()).toBe('Failed to load pricing. Please try again.');
      expect(service.isLoading()).toBe(false);
    });
  });

  describe('changeCurrency', () => {
    it('should reload plans when currency changes', () => {
      // First load
      service.loadPlans('USD');
      httpMock.expectOne(`${apiUrl}?currency=USD`).flush({
        individualPlans: [],
        teamPlans: [],
        displayCurrency: 'USD',
        exchangeRateTimestamp: ''
      });

      // Change currency
      service.changeCurrency('EUR');

      const req = httpMock.expectOne(`${apiUrl}?currency=EUR`);
      expect(req.request.method).toBe('GET');
    });

    it('should not reload if currency is the same', () => {
      service.loadPlans('USD');
      httpMock.expectOne(`${apiUrl}?currency=USD`).flush({
        individualPlans: [],
        teamPlans: [],
        displayCurrency: 'USD',
        exchangeRateTimestamp: ''
      });

      // Try to change to same currency
      service.changeCurrency('USD');

      // No additional request should be made
      httpMock.expectNone(`${apiUrl}?currency=USD`);
    });
  });

  describe('detectUserCurrency', () => {
    it('should return USD as default', () => {
      const currency = service.detectUserCurrency();
      expect(currency).toBeTruthy();
    });
  });

  describe('computed properties', () => {
    it('should filter monthly plans correctly', () => {
      const mockResponse: PlansResponse = {
        individualPlans: [
          {
            planId: '1',
            planName: 'PRO_MONTHLY',
            displayName: 'Pro Monthly',
            billingInterval: 'MONTH',
            price: { originalAmountUsd: 29.99, convertedAmount: 29.99, currency: 'USD', formattedPrice: '$29.99', exchangeRate: 1, rateTimestamp: '' },
            documentUploadLimit: 500,
            ocrPageLimit: 2000,
            isActive: true,
            features: []
          },
          {
            planId: '2',
            planName: 'PRO_YEARLY',
            displayName: 'Pro Yearly',
            billingInterval: 'YEAR',
            price: { originalAmountUsd: 299.99, convertedAmount: 299.99, currency: 'USD', formattedPrice: '$299.99', exchangeRate: 1, rateTimestamp: '' },
            documentUploadLimit: 500,
            ocrPageLimit: 2000,
            isActive: true,
            features: []
          }
        ],
        teamPlans: [],
        displayCurrency: 'USD',
        exchangeRateTimestamp: ''
      };

      service.loadPlans();
      httpMock.expectOne(`${apiUrl}?currency=USD`).flush(mockResponse);

      expect(service.individualMonthlyPlans().length).toBe(1);
      expect(service.individualMonthlyPlans()[0].billingInterval).toBe('MONTH');
      expect(service.individualYearlyPlans().length).toBe(1);
      expect(service.individualYearlyPlans()[0].billingInterval).toBe('YEAR');
    });
  });
});


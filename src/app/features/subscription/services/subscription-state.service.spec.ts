import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { SubscriptionStateService } from './subscription-state.service';
import { SubscriptionApiService } from './subscription-api.service';
import { of, throwError } from 'rxjs';

describe('SubscriptionStateService', () => {
  let service: SubscriptionStateService;
  let apiService: jasmine.SpyObj<SubscriptionApiService>;

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('SubscriptionApiService', [
      'getStripeCustomer',
      'attachPaymentMethod',
      'setDefaultPaymentMethod',
      'createCheckoutSession',
      'createSubscription',
      'getSubscription',
      'cancelSubscription',
      'pauseSubscription',
      'resumeSubscription',
      'getReceipts',
      'downloadReceipt'
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        SubscriptionStateService,
        { provide: SubscriptionApiService, useValue: apiSpy }
      ]
    });

    service = TestBed.inject(SubscriptionStateService);
    apiService = TestBed.inject(SubscriptionApiService) as jasmine.SpyObj<SubscriptionApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should start with empty plans', () => {
      expect(service.plans().length).toBe(0);
    });

    it('should have no current subscription', () => {
      expect(service.currentSubscription()).toBeNull();
    });

    it('should not be loading initially', () => {
      expect(service.isLoading()).toBeFalse();
    });

    it('should default to monthly billing interval', () => {
      expect(service.billingInterval()).toBe('monthly');
    });
  });

  describe('loadSubscriptionData', () => {
    it('should load mock data', fakeAsync(() => {
      service.loadSubscriptionData();

      expect(service.plans().length).toBeGreaterThan(0);
      expect(service.currentSubscription()).not.toBeNull();
      expect(service.usage()).not.toBeNull();
      expect(service.paymentMethods().length).toBeGreaterThan(0);
      expect(service.invoices().length).toBeGreaterThan(0);
    }));
  });

  describe('Computed Properties', () => {
    beforeEach(() => {
      service.loadSubscriptionData();
    });

    it('should compute current tier', () => {
      expect(service.currentTier()).toBe('pro');
    });

    it('should compute isSubscribed', () => {
      expect(service.isSubscribed()).toBeTrue();
    });

    it('should compute hasPaymentMethod', () => {
      expect(service.hasPaymentMethod()).toBeTrue();
    });

    it('should compute defaultPaymentMethod', () => {
      const defaultPm = service.defaultPaymentMethod();
      expect(defaultPm).not.toBeNull();
      expect(defaultPm?.isDefault).toBeTrue();
    });

    it('should compute usage percentages', () => {
      const ocrPercent = service.ocrUsagePercent();
      expect(ocrPercent).toBeGreaterThan(0);
      expect(ocrPercent).toBeLessThanOrEqual(100);
    });
  });

  describe('setBillingInterval', () => {
    it('should change billing interval to yearly', () => {
      service.setBillingInterval('yearly');
      expect(service.billingInterval()).toBe('yearly');
    });

    it('should change billing interval to monthly', () => {
      service.setBillingInterval('yearly');
      service.setBillingInterval('monthly');
      expect(service.billingInterval()).toBe('monthly');
    });
  });

  describe('selectPlan', () => {
    beforeEach(() => {
      service.loadSubscriptionData();
    });

    it('should select a plan by ID', () => {
      const plans = service.plans();
      const planId = plans[0].id;

      service.selectPlan(planId);

      expect(service.selectedPlanId()).toBe(planId);
      expect(service.selectedPlan()?.id).toBe(planId);
    });
  });

  describe('cancelSubscription', () => {
    beforeEach(() => {
      service.loadSubscriptionData();
    });

    it('should call API to cancel subscription', fakeAsync(() => {
      const mockResponse = {
        id: 'sub-123',
        status: 'canceled' as const,
        planId: 'plan-1',
        planName: 'Pro',
        planTier: 'pro' as const,
        provider: 'stripe' as const,
        providerSubscriptionId: 'sub_stripe_123',
        currentPeriodStart: '2024-12-01T00:00:00Z',
        currentPeriodEnd: '2025-01-01T00:00:00Z',
        cancelAtPeriodEnd: true,
        createdAt: '2024-06-01T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z'
      };
      apiService.cancelSubscription.and.returnValue(of(mockResponse));

      service.cancelSubscription(false);
      tick();

      expect(apiService.cancelSubscription).toHaveBeenCalledWith('sub_stripe_123', false);
      expect(service.successMessage()).toBeTruthy();
    }));

    it('should handle cancel subscription error', fakeAsync(() => {
      apiService.cancelSubscription.and.returnValue(throwError(() => new Error('Failed')));

      service.cancelSubscription(false);
      tick();

      expect(service.error()).toBeTruthy();
    }));
  });

  describe('resumeSubscription', () => {
    beforeEach(() => {
      service.loadSubscriptionData();
    });

    it('should call API to resume subscription', fakeAsync(() => {
      const mockResponse = {
        id: 'sub-123',
        status: 'active' as const,
        planId: 'plan-1',
        planName: 'Pro',
        planTier: 'pro' as const,
        provider: 'stripe' as const,
        providerSubscriptionId: 'sub_stripe_123',
        currentPeriodStart: '2024-12-01T00:00:00Z',
        currentPeriodEnd: '2025-01-01T00:00:00Z',
        cancelAtPeriodEnd: false,
        createdAt: '2024-06-01T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z'
      };
      apiService.resumeSubscription.and.returnValue(of(mockResponse));

      service.resumeSubscription();
      tick();

      expect(apiService.resumeSubscription).toHaveBeenCalledWith('sub_stripe_123');
      expect(service.successMessage()).toBeTruthy();
    }));
  });

  describe('addPaymentMethod', () => {
    it('should attach payment method and reload', fakeAsync(() => {
      apiService.attachPaymentMethod.and.returnValue(of(undefined));
      apiService.getStripeCustomer.and.returnValue(of({
        id: 'cus_123',
        email: 'test@example.com',
        name: 'Test',
        paymentMethods: []
      }));

      service.addPaymentMethod('pm_123');
      tick();

      expect(apiService.attachPaymentMethod).toHaveBeenCalledWith('pm_123');
      expect(service.successMessage()).toBeTruthy();
    }));
  });

  describe('setDefaultPaymentMethod', () => {
    beforeEach(() => {
      service.loadSubscriptionData();
    });

    it('should update default payment method', fakeAsync(() => {
      apiService.setDefaultPaymentMethod.and.returnValue(of(undefined));

      const nonDefaultPm = service.paymentMethods().find(pm => !pm.isDefault);
      if (nonDefaultPm) {
        service.setDefaultPaymentMethod(nonDefaultPm.id);
        tick();

        expect(apiService.setDefaultPaymentMethod).toHaveBeenCalledWith(nonDefaultPm.id);
        const updatedPm = service.paymentMethods().find(pm => pm.id === nonDefaultPm.id);
        expect(updatedPm?.isDefault).toBeTrue();
      }
    }));
  });

  describe('Error Handling', () => {
    it('should clear error', () => {
      // Trigger an error first
      service.loadSubscriptionData();

      service.clearError();
      expect(service.error()).toBeNull();
    });

    it('should clear success message', () => {
      service.clearSuccessMessage();
      expect(service.successMessage()).toBeNull();
    });
  });

  describe('Trial and Renewal Calculations', () => {
    beforeEach(() => {
      service.loadSubscriptionData();
    });

    it('should calculate days until renewal', () => {
      const days = service.daysUntilRenewal();
      expect(days).toBeGreaterThanOrEqual(0);
    });

    it('should correctly identify if canceled', () => {
      expect(service.isCanceled()).toBeFalse();
    });
  });
});


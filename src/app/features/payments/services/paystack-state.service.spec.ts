import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PaystackStateService } from './paystack-state.service';
import { PaystackApiService } from './paystack-api.service';
import { PricingService } from '../../../shared/services/pricing.service';
import { UserApiService } from '../../user/services/user-api.service';
import {
  toKobo,
  fromKobo,
} from '../models/paystack.model';

describe('PaystackStateService', () => {
  let service: PaystackStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PaystackStateService,
        PaystackApiService,
        PricingService,
        UserApiService
      ]
    });
    service = TestBed.inject(PaystackStateService);
  });

  describe('Initialization', () => {
    it('should create the service', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with default values', () => {
      expect(service.billingInterval()).toBe('monthly');
      expect(service.isLoading()).toBeFalsy();
      expect(service.isProcessing()).toBeFalsy();
      expect(service.error()).toBeNull();
    });

    it('should initialize with user email', () => {
      service.initialize('test@example.com');
      expect(service.userEmail()).toBe('test@example.com');
    });
  });

  describe('Billing Interval', () => {
    it('should set billing interval to monthly', () => {
      service.setBillingInterval('monthly');
      expect(service.billingInterval()).toBe('monthly');
    });

    it('should set billing interval to yearly', () => {
      service.setBillingInterval('yearly');
      expect(service.billingInterval()).toBe('yearly');
    });
  });

  describe('Plan Selection', () => {
    it('should select a plan by ID', () => {
      service.selectPlan('plan-123');
      expect(service.selectedPlanId()).toBe('plan-123');
    });

    it('should clear selected plan', () => {
      service.selectPlan('plan-123');
      service.clearSelectedPlan();
      expect(service.selectedPlanId()).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should clear error', () => {
      service.clearError();
      expect(service.error()).toBeNull();
    });

    it('should clear success message', () => {
      service.clearSuccessMessage();
      expect(service.successMessage()).toBeNull();
    });
  });

  describe('Current Plan Detection', () => {
    it('should detect FREE as current plan when no subscription', () => {
      expect(service.currentPlanName()).toBe('FREE');
    });

    it('should check if plan is current plan', () => {
      // Default is FREE
      expect(service.isCurrentPlan('FREE')).toBeTruthy();
      expect(service.isCurrentPlan('PRO_MONTHLY')).toBeFalsy();
    });

    it('should get correct button text for plans', () => {
      expect(service.getPlanButtonText('FREE')).toBe('Current Plan');
      expect(service.getPlanButtonText('PRO_MONTHLY')).toBe('Subscribe');
    });
  });
});

describe('Paystack Model Utilities', () => {
  describe('toKobo', () => {
    it('should convert amount to kobo', () => {
      expect(toKobo(100)).toBe(10000);
      expect(toKobo(1)).toBe(100);
      expect(toKobo(0.01)).toBe(1);
      expect(toKobo(19.99)).toBe(1999);
    });
  });

  describe('fromKobo', () => {
    it('should convert kobo to main currency', () => {
      expect(fromKobo(10000)).toBe(100);
      expect(fromKobo(100)).toBe(1);
      expect(fromKobo(1)).toBe(0.01);
      expect(fromKobo(1999)).toBe(19.99);
    });
  });
});


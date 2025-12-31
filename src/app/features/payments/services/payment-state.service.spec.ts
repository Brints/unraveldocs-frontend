import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PaymentStateService } from './payment-state.service';
import { PaymentApiService } from './payment-api.service';
import { of, throwError } from 'rxjs';

describe('PaymentStateService', () => {
  let service: PaymentStateService;
  let apiService: jasmine.SpyObj<PaymentApiService>;

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('PaymentApiService', [
      'getStripeCustomer',
      'attachPaymentMethod',
      'setDefaultPaymentMethod',
      'removePaymentMethod',
      'getStripePaymentHistory',
      'getPaystackPaymentHistory',
      'getReceipts',
      'downloadReceipt'
    ]);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        PaymentStateService,
        { provide: PaymentApiService, useValue: apiSpy }
      ]
    });

    service = TestBed.inject(PaymentStateService);
    apiService = TestBed.inject(PaymentApiService) as jasmine.SpyObj<PaymentApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Initial State', () => {
    it('should start with empty payments', () => {
      expect(service.payments().length).toBe(0);
    });

    it('should start with empty payment methods', () => {
      expect(service.paymentMethods().length).toBe(0);
    });

    it('should start with empty receipts', () => {
      expect(service.receipts().length).toBe(0);
    });

    it('should not be loading initially', () => {
      expect(service.isLoading()).toBeFalse();
    });
  });

  describe('loadAllPaymentData', () => {
    it('should load mock data', () => {
      service.loadAllPaymentData();

      expect(service.payments().length).toBeGreaterThan(0);
      expect(service.paymentMethods().length).toBeGreaterThan(0);
      expect(service.receipts().length).toBeGreaterThan(0);
    });
  });

  describe('Computed Properties', () => {
    beforeEach(() => {
      service.loadAllPaymentData();
    });

    it('should compute total payments', () => {
      expect(service.totalPayments()).toBeGreaterThan(0);
    });

    it('should compute total amount', () => {
      expect(service.totalAmount()).toBeGreaterThan(0);
    });

    it('should compute successful payments', () => {
      expect(service.successfulPayments().length).toBeGreaterThan(0);
    });

    it('should compute default payment method', () => {
      const defaultPm = service.defaultPaymentMethod();
      expect(defaultPm).not.toBeNull();
      expect(defaultPm?.isDefault).toBeTrue();
    });

    it('should compute hasPaymentMethod', () => {
      expect(service.hasPaymentMethod()).toBeTrue();
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      service.loadAllPaymentData();
    });

    it('should filter by status', () => {
      service.setFilter({ status: 'succeeded' });
      const filtered = service.filteredPayments();
      expect(filtered.every(p => p.status === 'succeeded')).toBeTrue();
    });

    it('should filter by provider', () => {
      service.setFilter({ provider: 'stripe' });
      const filtered = service.filteredPayments();
      expect(filtered.every(p => p.provider === 'stripe')).toBeTrue();
    });

    it('should clear filter', () => {
      service.setFilter({ status: 'succeeded' });
      service.clearFilter();
      expect(service.filter()).toEqual({});
    });
  });

  describe('Payment Methods', () => {
    beforeEach(() => {
      service.loadAllPaymentData();
    });

    it('should set default payment method', fakeAsync(() => {
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

    it('should handle set default payment method error', fakeAsync(() => {
      apiService.setDefaultPaymentMethod.and.returnValue(throwError(() => new Error('Failed')));

      const nonDefaultPm = service.paymentMethods().find(pm => !pm.isDefault);
      if (nonDefaultPm) {
        service.setDefaultPaymentMethod(nonDefaultPm.id);
        tick();

        expect(service.error()).toBeTruthy();
      }
    }));

    it('should remove payment method', fakeAsync(() => {
      apiService.removePaymentMethod.and.returnValue(of(undefined));

      const pmToRemove = service.paymentMethods()[1];
      const originalLength = service.paymentMethods().length;

      service.removePaymentMethod(pmToRemove.id);
      tick();

      expect(apiService.removePaymentMethod).toHaveBeenCalledWith(pmToRemove.id);
      expect(service.paymentMethods().length).toBe(originalLength - 1);
    }));
  });

  describe('Selection', () => {
    beforeEach(() => {
      service.loadAllPaymentData();
    });

    it('should select payment', () => {
      const payment = service.payments()[0];
      service.selectPayment(payment);
      expect(service.selectedPayment()).toBe(payment);
    });

    it('should deselect payment', () => {
      const payment = service.payments()[0];
      service.selectPayment(payment);
      service.selectPayment(null);
      expect(service.selectedPayment()).toBeNull();
    });

    it('should select receipt', () => {
      const receipt = service.receipts()[0];
      service.selectReceipt(receipt);
      expect(service.selectedReceipt()).toBe(receipt);
    });
  });

  describe('Error Handling', () => {
    it('should clear error', () => {
      service.loadAllPaymentData();
      service.clearError();
      expect(service.error()).toBeNull();
    });

    it('should clear success message', () => {
      service.clearSuccessMessage();
      expect(service.successMessage()).toBeNull();
    });
  });
});


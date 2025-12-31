import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SubscriptionApiService } from './subscription-api.service';
import { environment } from '../../../../environments/environment';

describe('SubscriptionApiService', () => {
  let service: SubscriptionApiService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [SubscriptionApiService]
    });

    service = TestBed.inject(SubscriptionApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Stripe Customer', () => {
    it('should get stripe customer details', () => {
      const mockCustomer = {
        id: 'cus_123',
        email: 'test@example.com',
        name: 'Test User',
        paymentMethods: []
      };

      service.getStripeCustomer().subscribe(customer => {
        expect(customer.id).toBe('cus_123');
        expect(customer.email).toBe('test@example.com');
      });

      const req = httpMock.expectOne(`${apiUrl}/stripe/customer/details`);
      expect(req.request.method).toBe('GET');
      req.flush(mockCustomer);
    });

    it('should attach payment method', () => {
      service.attachPaymentMethod('pm_123').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/stripe/customer/payment-method/attach?paymentMethodId=pm_123`);
      expect(req.request.method).toBe('POST');
      req.flush(null);
    });

    it('should set default payment method', () => {
      service.setDefaultPaymentMethod('pm_123').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/stripe/customer/payment-method/set-default?paymentMethodId=pm_123`);
      expect(req.request.method).toBe('POST');
      req.flush(null);
    });
  });

  describe('Stripe Subscription', () => {
    it('should create checkout session', () => {
      const request = {
        priceId: 'price_123',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel'
      };
      const mockResponse = {
        sessionId: 'cs_123',
        url: 'https://checkout.stripe.com/123',
        expiresAt: 123456789
      };

      service.createCheckoutSession(request).subscribe(session => {
        expect(session.sessionId).toBe('cs_123');
        expect(session.url).toContain('stripe.com');
      });

      const req = httpMock.expectOne(`${apiUrl}/stripe/subscription/create-checkout-session`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should cancel subscription', () => {
      const mockResponse = {
        subscriptionId: 'sub_123',
        status: 'canceled'
      };

      service.cancelSubscription('sub_123', true).subscribe(result => {
        expect(result.status).toBe('canceled');
      });

      const req = httpMock.expectOne(`${apiUrl}/stripe/subscription/sub_123/cancel?immediately=true`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should pause subscription', () => {
      const mockResponse = {
        subscriptionId: 'sub_123',
        status: 'paused'
      };

      service.pauseSubscription('sub_123').subscribe(result => {
        expect(result.status).toBe('paused');
      });

      const req = httpMock.expectOne(`${apiUrl}/stripe/subscription/sub_123/pause`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should resume subscription', () => {
      const mockResponse = {
        subscriptionId: 'sub_123',
        status: 'active'
      };

      service.resumeSubscription('sub_123').subscribe(result => {
        expect(result.status).toBe('active');
      });

      const req = httpMock.expectOne(`${apiUrl}/stripe/subscription/sub_123/resume`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should get subscription details', () => {
      const mockResponse = {
        subscriptionId: 'sub_123',
        status: 'active',
        currentPeriodEnd: '2025-02-01T00:00:00Z'
      };

      service.getSubscription('sub_123').subscribe(result => {
        expect(result.status).toBe('active');
      });

      const req = httpMock.expectOne(`${apiUrl}/stripe/subscription/sub_123`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('Paystack', () => {
    it('should initialize paystack transaction', () => {
      const mockResponse = {
        data: {
          authorizationUrl: 'https://checkout.paystack.com/123',
          accessCode: 'abc123',
          reference: 'ref_123'
        }
      };

      service.initializePaystackTransaction(500000, 'test@example.com').subscribe(result => {
        expect(result.reference).toBe('ref_123');
        expect(result.authorizationUrl).toContain('paystack.com');
      });

      const req = httpMock.expectOne(`${apiUrl}/paystack/transaction/initialize`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should verify paystack transaction', () => {
      service.verifyPaystackTransaction('ref_123').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/paystack/transaction/verify/ref_123`);
      expect(req.request.method).toBe('GET');
      req.flush({ status: true });
    });

    it('should create paystack subscription', () => {
      const mockResponse = {
        data: {
          subscriptionCode: 'SUB_123',
          emailToken: 'token_123',
          status: 'active'
        }
      };

      service.createPaystackSubscription('PLN_123', 'test@example.com').subscribe(result => {
        expect(result.subscriptionCode).toBe('SUB_123');
      });

      const req = httpMock.expectOne(`${apiUrl}/paystack/subscription`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('Receipts', () => {
    it('should get receipts', () => {
      const mockResponse = {
        statusCode: 200,
        status: 'success',
        message: 'Receipts retrieved',
        data: [
          { id: '1', number: 'INV-001', amount: 2999 }
        ]
      };

      service.getReceipts().subscribe(receipts => {
        expect(receipts.length).toBe(1);
        expect(receipts[0].number).toBe('INV-001');
      });

      const req = httpMock.expectOne(`${apiUrl}/receipts?page=0&size=10`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should get receipt by number', () => {
      const mockResponse = {
        statusCode: 200,
        status: 'success',
        message: 'Receipt retrieved',
        data: { id: '1', number: 'INV-001', amount: 2999 }
      };

      service.getReceipt('INV-001').subscribe(receipt => {
        expect(receipt.number).toBe('INV-001');
      });

      const req = httpMock.expectOne(`${apiUrl}/receipts/INV-001`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should download receipt', () => {
      const mockResponse = {
        statusCode: 200,
        status: 'success',
        message: 'Download URL',
        data: 'https://s3.amazonaws.com/receipts/INV-001.pdf'
      };

      service.downloadReceipt('INV-001').subscribe(url => {
        expect(url).toContain('s3.amazonaws.com');
      });

      const req = httpMock.expectOne(`${apiUrl}/receipts/INV-001/download`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});


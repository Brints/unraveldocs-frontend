import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PaymentApiService } from './payment-api.service';
import { environment } from '../../../../environments/environment';

describe('PaymentApiService', () => {
  let service: PaymentApiService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PaymentApiService]
    });

    service = TestBed.inject(PaymentApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('Stripe Customer', () => {
    it('should get stripe customer', () => {
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

    it('should remove payment method', () => {
      service.removePaymentMethod('pm_123').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/stripe/customer/payment-method/pm_123`);
      expect(req.request.method).toBe('DELETE');
      req.flush(null);
    });
  });

  describe('Stripe Payments', () => {
    it('should create payment intent', () => {
      const request = {
        amount: 2000,
        currency: 'usd',
        description: 'Test payment'
      };
      const mockResponse = {
        paymentIntentId: 'pi_123',
        clientSecret: 'pi_123_secret',
        amount: 2000,
        currency: 'usd',
        status: 'requires_payment_method'
      };

      service.createPaymentIntent(request).subscribe(intent => {
        expect(intent.paymentIntentId).toBe('pi_123');
      });

      const req = httpMock.expectOne(`${apiUrl}/stripe/payment/create-payment-intent`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should get payment intent', () => {
      const mockResponse = {
        paymentIntentId: 'pi_123',
        amount: 2000,
        currency: 'usd',
        status: 'succeeded'
      };

      service.getPaymentIntent('pi_123').subscribe(intent => {
        expect(intent.status).toBe('succeeded');
      });

      const req = httpMock.expectOne(`${apiUrl}/stripe/payment/intent/pi_123`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should process refund', () => {
      const request = {
        paymentIntentId: 'pi_123',
        amount: 1000,
        reason: 'requested_by_customer' as const
      };
      const mockResponse = {
        refundId: 're_123',
        amount: 1000,
        status: 'succeeded'
      };

      service.processRefund(request).subscribe(refund => {
        expect(refund.refundId).toBe('re_123');
      });

      const req = httpMock.expectOne(`${apiUrl}/stripe/payment/refund`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should get payment history', () => {
      const mockPayments = [
        { id: 'pay_1', amount: 2999 },
        { id: 'pay_2', amount: 999 }
      ];

      service.getStripePaymentHistory(0, 20).subscribe(payments => {
        expect(payments.length).toBe(2);
      });

      const req = httpMock.expectOne(`${apiUrl}/stripe/payment/history?page=0&size=20`);
      expect(req.request.method).toBe('GET');
      req.flush(mockPayments);
    });
  });

  describe('Paystack', () => {
    it('should initialize transaction', () => {
      const request = {
        amount: 500000,
        email: 'test@example.com',
        currency: 'NGN'
      };
      const mockResponse = {
        status: true,
        data: {
          authorizationUrl: 'https://checkout.paystack.com/123',
          accessCode: 'abc123',
          reference: 'ref_123'
        }
      };

      service.initializePaystackTransaction(request).subscribe(result => {
        expect(result.reference).toBe('ref_123');
      });

      const req = httpMock.expectOne(`${apiUrl}/paystack/transaction/initialize`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should verify transaction', () => {
      const mockResponse = {
        status: true,
        data: {
          reference: 'ref_123',
          status: 'success'
        }
      };

      service.verifyPaystackTransaction('ref_123').subscribe(result => {
        expect(result).toBeTruthy();
      });

      const req = httpMock.expectOne(`${apiUrl}/paystack/transaction/verify/ref_123`);
      expect(req.request.method).toBe('GET');
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
          { id: '1', receiptNumber: 'RCP-001', amount: 2999 }
        ]
      };

      service.getReceipts(0, 10).subscribe(receipts => {
        expect(receipts.length).toBe(1);
        expect(receipts[0].receiptNumber).toBe('RCP-001');
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
        data: { id: '1', receiptNumber: 'RCP-001', amount: 2999 }
      };

      service.getReceipt('RCP-001').subscribe(receipt => {
        expect(receipt.receiptNumber).toBe('RCP-001');
      });

      const req = httpMock.expectOne(`${apiUrl}/receipts/RCP-001`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should download receipt', () => {
      const mockResponse = {
        statusCode: 200,
        status: 'success',
        message: 'Download URL',
        data: 'https://s3.amazonaws.com/receipts/RCP-001.pdf'
      };

      service.downloadReceipt('RCP-001').subscribe(url => {
        expect(url).toContain('s3.amazonaws.com');
      });

      const req = httpMock.expectOne(`${apiUrl}/receipts/RCP-001/download`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});


import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PaystackApiService } from './paystack-api.service';
import { environment } from '../../../../environments/environment';
import {
  PaystackInitializeRequest,
  PaystackSubscriptionRequest
} from '../models/paystack.model';

describe('PaystackApiService', () => {
  let service: PaystackApiService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/paystack`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PaystackApiService]
    });
    service = TestBed.inject(PaystackApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Transaction Operations', () => {
    it('should initialize transaction', () => {
      const request: PaystackInitializeRequest = {
        email: 'test@example.com',
        amount: 100000, // 1000 NGN in kobo
        currency: 'NGN',
        callbackUrl: 'https://example.com/callback'
      };

      const mockResponse = {
        status: true,
        message: 'Transaction initialized',
        data: {
          authorizationUrl: 'https://checkout.paystack.com/xxx',
          accessCode: 'xxx',
          reference: 'TXN_123'
        }
      };

      service.initializeTransaction(request).subscribe(response => {
        expect(response.authorizationUrl).toBe(mockResponse.data.authorizationUrl);
        expect(response.reference).toBe(mockResponse.data.reference);
      });

      const req = httpMock.expectOne(`${apiUrl}/transaction/initialize`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(request);
      req.flush(mockResponse);
    });

    it('should verify transaction', () => {
      const reference = 'TXN_123';
      const mockResponse = {
        status: true,
        message: 'Transaction verified',
        data: {
          id: 12345,
          status: 'success',
          reference: reference,
          amount: 100000,
          currency: 'NGN',
          channel: 'card',
          gatewayResponse: 'Successful',
          customer: {
            id: 1,
            email: 'test@example.com',
            customerCode: 'CUS_xxx'
          }
        }
      };

      service.verifyTransaction(reference).subscribe(response => {
        expect(response.status).toBe('success');
        expect(response.reference).toBe(reference);
      });

      const req = httpMock.expectOne(`${apiUrl}/transaction/verify/${reference}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should charge authorization', () => {
      const authCode = 'AUTH_xxx';
      const amount = 50000;
      const currency = 'NGN';

      const mockResponse = {
        status: true,
        message: 'Authorization charged',
        data: {
          id: 12345,
          status: 'success',
          amount: amount,
          currency: currency
        }
      };

      service.chargeAuthorization(authCode, amount, currency).subscribe(response => {
        expect(response.status).toBe('success');
        expect(response.amount).toBe(amount);
      });

      const req = httpMock.expectOne(r =>
        r.url === `${apiUrl}/transaction/charge-authorization` &&
        r.params.get('authorizationCode') === authCode
      );
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should get payment history', () => {
      const mockResponse = {
        content: [
          { id: '1', reference: 'TXN_1', amount: 100000, status: 'success' },
          { id: '2', reference: 'TXN_2', amount: 50000, status: 'success' }
        ],
        pageable: { pageNumber: 0, pageSize: 20 },
        totalElements: 2,
        totalPages: 1
      };

      service.getPaymentHistory(0, 20).subscribe(response => {
        expect(response.content.length).toBe(2);
        expect(response.totalElements).toBe(2);
      });

      const req = httpMock.expectOne(r =>
        r.url === `${apiUrl}/transaction/history` &&
        r.params.get('page') === '0' &&
        r.params.get('size') === '20'
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('Subscription Operations', () => {
    it('should create subscription', () => {
      const request: PaystackSubscriptionRequest = {
        customer: 'test@example.com',
        planName: 'PRO_MONTHLY'
      };

      const mockResponse = {
        status: true,
        message: 'Subscription created',
        data: {
          id: 'sub-123',
          subscriptionCode: 'SUB_xxx',
          status: 'active',
          emailToken: 'token_xxx'
        }
      };

      service.createSubscription(request).subscribe(response => {
        expect(response.subscriptionCode).toBe('SUB_xxx');
        expect(response.status).toBe('active');
      });

      const req = httpMock.expectOne(`${apiUrl}/subscription`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should get active subscription', () => {
      const mockResponse = {
        id: 'sub-123',
        subscriptionCode: 'SUB_xxx',
        status: 'active',
        emailToken: 'token_xxx'
      };

      service.getActiveSubscription().subscribe(response => {
        expect(response.status).toBe('active');
      });

      const req = httpMock.expectOne(`${apiUrl}/subscription/active`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should disable subscription', () => {
      const subscriptionCode = 'SUB_xxx';
      const emailToken = 'token_xxx';

      const mockResponse = {
        status: true,
        message: 'Subscription disabled',
        data: {
          subscriptionCode: subscriptionCode,
          status: 'cancelled'
        }
      };

      service.disableSubscription(subscriptionCode, emailToken).subscribe(response => {
        expect(response.status).toBe('cancelled');
      });

      const req = httpMock.expectOne(r =>
        r.url === `${apiUrl}/subscription/${subscriptionCode}/disable` &&
        r.params.get('emailToken') === emailToken
      );
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });

    it('should enable subscription', () => {
      const subscriptionCode = 'SUB_xxx';
      const emailToken = 'token_xxx';

      const mockResponse = {
        status: true,
        message: 'Subscription enabled',
        data: {
          subscriptionCode: subscriptionCode,
          status: 'active'
        }
      };

      service.enableSubscription(subscriptionCode, emailToken).subscribe(response => {
        expect(response.status).toBe('active');
      });

      const req = httpMock.expectOne(r =>
        r.url === `${apiUrl}/subscription/${subscriptionCode}/enable` &&
        r.params.get('emailToken') === emailToken
      );
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('Callback Handling', () => {
    it('should handle callback', () => {
      const reference = 'TXN_123';
      const mockResponse = {
        status: true,
        message: 'Payment verified',
        data: {
          id: 12345,
          status: 'success',
          reference: reference
        }
      };

      service.handleCallback(reference).subscribe(response => {
        expect(response.status).toBe('success');
      });

      const req = httpMock.expectOne(r =>
        r.url === `${apiUrl}/callback` &&
        r.params.get('reference') === reference
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});


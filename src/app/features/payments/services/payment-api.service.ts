import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  Payment,
  PaymentMethod,
  Receipt,
  StripeCustomer,
  StripePaymentIntent,
  StripeRefund,
  PaystackInitializeResponse,
  PaystackTransaction,
  CreatePaymentIntentRequest,
  RefundRequest,
  PaystackInitializeRequest,
  PaymentApiResponse,
  PaginatedResponse,
} from '../models/payment.model';

@Injectable({
  providedIn: 'root'
})
export class PaymentApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // ==================== Stripe Customer ====================

  /**
   * Get Stripe customer details
   * GET /stripe/customer/details
   */
  getStripeCustomer(): Observable<StripeCustomer> {
    return this.http.get<StripeCustomer>(`${this.apiUrl}/stripe/customer/details`);
  }

  /**
   * Attach payment method to customer
   * POST /stripe/customer/payment-method/attach
   */
  attachPaymentMethod(paymentMethodId: string): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/stripe/customer/payment-method/attach`,
      null,
      { params: { paymentMethodId } }
    );
  }

  /**
   * Set default payment method
   * POST /stripe/customer/payment-method/set-default
   */
  setDefaultPaymentMethod(paymentMethodId: string): Observable<void> {
    return this.http.post<void>(
      `${this.apiUrl}/stripe/customer/payment-method/set-default`,
      null,
      { params: { paymentMethodId } }
    );
  }

  /**
   * Remove payment method
   * DELETE /stripe/customer/payment-method/{paymentMethodId}
   */
  removePaymentMethod(paymentMethodId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/stripe/customer/payment-method/${paymentMethodId}`
    );
  }

  // ==================== Stripe Payments ====================

  /**
   * Create payment intent
   * POST /stripe/payment/create-payment-intent
   */
  createPaymentIntent(request: CreatePaymentIntentRequest): Observable<StripePaymentIntent> {
    return this.http.post<StripePaymentIntent>(
      `${this.apiUrl}/stripe/payment/create-payment-intent`,
      request
    );
  }

  /**
   * Get payment intent
   * GET /stripe/payment/intent/{paymentIntentId}
   */
  getPaymentIntent(paymentIntentId: string): Observable<StripePaymentIntent> {
    return this.http.get<StripePaymentIntent>(
      `${this.apiUrl}/stripe/payment/intent/${paymentIntentId}`
    );
  }

  /**
   * Process refund
   * POST /stripe/payment/refund
   */
  processRefund(request: RefundRequest): Observable<StripeRefund> {
    return this.http.post<StripeRefund>(
      `${this.apiUrl}/stripe/payment/refund`,
      request
    );
  }

  /**
   * Get payment history
   * GET /stripe/payment/history
   */
  getStripePaymentHistory(page = 0, size = 20): Observable<Payment[]> {
    return this.http.get<Payment[]>(
      `${this.apiUrl}/stripe/payment/history`,
      { params: { page: page.toString(), size: size.toString() } }
    );
  }

  // ==================== Paystack Transactions ====================

  /**
   * Initialize transaction
   * POST /paystack/transaction/initialize
   */
  initializePaystackTransaction(request: PaystackInitializeRequest): Observable<PaystackInitializeResponse> {
    return this.http.post<{ status: boolean; data: PaystackInitializeResponse }>(
      `${this.apiUrl}/paystack/transaction/initialize`,
      request
    ).pipe(map(response => response.data));
  }

  /**
   * Verify transaction
   * GET /paystack/transaction/verify/{reference}
   */
  verifyPaystackTransaction(reference: string): Observable<PaystackTransaction> {
    return this.http.get<{ status: boolean; data: PaystackTransaction }>(
      `${this.apiUrl}/paystack/transaction/verify/${reference}`
    ).pipe(map(response => response.data));
  }

  /**
   * Charge authorization
   * POST /paystack/transaction/charge-authorization
   */
  chargeAuthorization(authorizationCode: string, amount: number, currency?: string): Observable<PaystackTransaction> {
    return this.http.post<{ status: boolean; data: PaystackTransaction }>(
      `${this.apiUrl}/paystack/transaction/charge-authorization`,
      null,
      { params: { authorizationCode, amount: amount.toString(), ...(currency && { currency }) } }
    ).pipe(map(response => response.data));
  }

  /**
   * Get Paystack payment history
   * GET /paystack/transaction/history
   */
  getPaystackPaymentHistory(page = 0, size = 20): Observable<Payment[]> {
    return this.http.get<Payment[]>(
      `${this.apiUrl}/paystack/transaction/history`,
      { params: { page: page.toString(), size: size.toString() } }
    );
  }

  /**
   * Get payment by reference
   * GET /paystack/transaction/{reference}
   */
  getPaystackPayment(reference: string): Observable<Payment> {
    return this.http.get<Payment>(
      `${this.apiUrl}/paystack/transaction/${reference}`
    );
  }

  // ==================== Receipts ====================

  /**
   * Get user's receipts
   * GET /receipts
   */
  getReceipts(page = 0, size = 10): Observable<Receipt[]> {
    return this.http.get<PaymentApiResponse<Receipt[]>>(
      `${this.apiUrl}/receipts`,
      { params: { page: page.toString(), size: size.toString() } }
    ).pipe(map(response => response.data));
  }

  /**
   * Get receipt by number
   * GET /receipts/{receiptNumber}
   */
  getReceipt(receiptNumber: string): Observable<Receipt> {
    return this.http.get<PaymentApiResponse<Receipt>>(
      `${this.apiUrl}/receipts/${receiptNumber}`
    ).pipe(map(response => response.data));
  }

  /**
   * Download receipt
   * GET /receipts/{receiptNumber}/download
   */
  downloadReceipt(receiptNumber: string): Observable<string> {
    return this.http.get<PaymentApiResponse<string>>(
      `${this.apiUrl}/receipts/${receiptNumber}/download`
    ).pipe(map(response => response.data));
  }
}


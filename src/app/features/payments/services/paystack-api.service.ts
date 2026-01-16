import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  PaystackInitializeRequest,
  PaystackInitializeResponse,
  PaystackVerifyResponse,
  PaystackPaymentHistoryResponse,
  PaystackPaymentHistoryItem,
  PaystackSubscription,
  PaystackSubscriptionRequest,
  PaystackSubscriptionHistoryResponse,
  PaystackApiResponse,
  PaystackCurrency,
} from '../models/paystack.model';

/**
 * Paystack API Service
 * Handles all Paystack-related API calls
 */
@Injectable({
  providedIn: 'root'
})
export class PaystackApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/paystack`;

  // ==================== Transaction Endpoints ====================

  /**
   * Initialize a Paystack transaction
   * POST /paystack/transaction/initialize
   */
  initializeTransaction(request: PaystackInitializeRequest): Observable<PaystackInitializeResponse> {
    return this.http.post<PaystackApiResponse<PaystackInitializeResponse>>(
      `${this.apiUrl}/transaction/initialize`,
      request
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Verify a transaction by reference
   * GET /paystack/transaction/verify/{reference}
   */
  verifyTransaction(reference: string): Observable<PaystackVerifyResponse> {
    return this.http.get<PaystackApiResponse<PaystackVerifyResponse>>(
      `${this.apiUrl}/transaction/verify/${encodeURIComponent(reference)}`
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Charge a saved authorization for recurring payments
   * POST /paystack/transaction/charge-authorization
   */
  chargeAuthorization(
    authorizationCode: string,
    amount: number,
    currency: PaystackCurrency = 'NGN'
  ): Observable<PaystackVerifyResponse> {
    const params = new HttpParams()
      .set('authorizationCode', authorizationCode)
      .set('amount', amount.toString())
      .set('currency', currency);

    return this.http.post<PaystackApiResponse<PaystackVerifyResponse>>(
      `${this.apiUrl}/transaction/charge-authorization`,
      null,
      { params }
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get payment history
   * GET /paystack/transaction/history
   */
  getPaymentHistory(
    page: number = 0,
    size: number = 20,
    sort: string = 'createdAt,desc'
  ): Observable<PaystackPaymentHistoryResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', sort);

    return this.http.get<PaystackPaymentHistoryResponse>(
      `${this.apiUrl}/transaction/history`,
      { params }
    );
  }

  /**
   * Get a specific payment by reference
   * GET /paystack/transaction/{reference}
   */
  getPaymentByReference(reference: string): Observable<PaystackPaymentHistoryItem> {
    return this.http.get<PaystackPaymentHistoryItem>(
      `${this.apiUrl}/transaction/${encodeURIComponent(reference)}`
    );
  }

  // ==================== Subscription Endpoints ====================

  /**
   * Create a new subscription
   * POST /paystack/subscription
   */
  createSubscription(request: PaystackSubscriptionRequest): Observable<PaystackSubscription> {
    return this.http.post<PaystackApiResponse<PaystackSubscription>>(
      `${this.apiUrl}/subscription`,
      request
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get subscription by code
   * GET /paystack/subscription/{subscriptionCode}
   */
  getSubscriptionByCode(subscriptionCode: string): Observable<PaystackSubscription> {
    return this.http.get<PaystackSubscription>(
      `${this.apiUrl}/subscription/${encodeURIComponent(subscriptionCode)}`
    );
  }

  /**
   * Get active subscription for current user
   * GET /paystack/subscription/active
   */
  getActiveSubscription(): Observable<PaystackSubscription> {
    return this.http.get<PaystackSubscription>(
      `${this.apiUrl}/subscription/active`
    );
  }

  /**
   * Get subscription history
   * GET /paystack/subscriptions
   */
  getSubscriptionHistory(
    page: number = 0,
    size: number = 20
  ): Observable<PaystackSubscriptionHistoryResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PaystackSubscriptionHistoryResponse>(
      `${this.apiUrl}/subscriptions`,
      { params }
    );
  }

  /**
   * Enable a subscription
   * POST /paystack/subscription/{subscriptionCode}/enable
   */
  enableSubscription(subscriptionCode: string, emailToken: string): Observable<PaystackSubscription> {
    const params = new HttpParams().set('emailToken', emailToken);

    return this.http.post<PaystackApiResponse<PaystackSubscription>>(
      `${this.apiUrl}/subscription/${encodeURIComponent(subscriptionCode)}/enable`,
      null,
      { params }
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Disable (cancel) a subscription
   * POST /paystack/subscription/{subscriptionCode}/disable
   */
  disableSubscription(subscriptionCode: string, emailToken: string): Observable<PaystackSubscription> {
    const params = new HttpParams().set('emailToken', emailToken);

    return this.http.post<PaystackApiResponse<PaystackSubscription>>(
      `${this.apiUrl}/subscription/${encodeURIComponent(subscriptionCode)}/disable`,
      null,
      { params }
    ).pipe(
      map(response => response.data)
    );
  }

  // ==================== Callback Endpoint ====================

  /**
   * Handle Paystack callback (used after redirect from Paystack)
   * GET /paystack/callback
   */
  handleCallback(reference: string): Observable<PaystackVerifyResponse> {
    const params = new HttpParams().set('reference', reference);

    return this.http.get<PaystackApiResponse<PaystackVerifyResponse>>(
      `${this.apiUrl}/callback`,
      { params }
    ).pipe(
      map(response => response.data)
    );
  }
}


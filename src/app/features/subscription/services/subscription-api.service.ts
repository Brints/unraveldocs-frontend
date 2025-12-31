import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  SubscriptionApiResponse,
  SubscriptionPlan,
  UserSubscription,
  PaymentMethod,
  Invoice,
  CheckoutSession,
  CreateCheckoutRequest,
  CreateSubscriptionRequest,
  SubscriptionUsage,
  StripeCustomer,
  StripePaymentIntent,
  PaystackInitializeResponse,
  PaystackSubscription,
} from '../models/subscription.model';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;

  // ==================== Stripe Customer ====================

  /**
   * Get customer details
   * GET /stripe/customer/details
   */
  getStripeCustomer(): Observable<StripeCustomer> {
    return this.http.get<StripeCustomer>(`${this.apiUrl}/stripe/customer/details`);
  }

  /**
   * Attach payment method
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

  // ==================== Stripe Subscription ====================

  /**
   * Create checkout session
   * POST /stripe/subscription/create-checkout-session
   */
  createCheckoutSession(request: CreateCheckoutRequest): Observable<CheckoutSession> {
    return this.http.post<CheckoutSession>(
      `${this.apiUrl}/stripe/subscription/create-checkout-session`,
      request
    );
  }

  /**
   * Create subscription directly
   * POST /stripe/subscription/create
   */
  createSubscription(request: CreateSubscriptionRequest): Observable<UserSubscription> {
    return this.http.post<UserSubscription>(
      `${this.apiUrl}/stripe/subscription/create`,
      request
    );
  }

  /**
   * Get subscription details
   * GET /stripe/subscription/{subscriptionId}
   */
  getSubscription(subscriptionId: string): Observable<UserSubscription> {
    return this.http.get<UserSubscription>(
      `${this.apiUrl}/stripe/subscription/${subscriptionId}`
    );
  }

  /**
   * Cancel subscription
   * POST /stripe/subscription/{subscriptionId}/cancel
   */
  cancelSubscription(subscriptionId: string, immediately = false): Observable<UserSubscription> {
    return this.http.post<UserSubscription>(
      `${this.apiUrl}/stripe/subscription/${subscriptionId}/cancel`,
      null,
      { params: { immediately: immediately.toString() } }
    );
  }

  /**
   * Pause subscription
   * POST /stripe/subscription/{subscriptionId}/pause
   */
  pauseSubscription(subscriptionId: string): Observable<UserSubscription> {
    return this.http.post<UserSubscription>(
      `${this.apiUrl}/stripe/subscription/${subscriptionId}/pause`,
      null
    );
  }

  /**
   * Resume subscription
   * POST /stripe/subscription/{subscriptionId}/resume
   */
  resumeSubscription(subscriptionId: string): Observable<UserSubscription> {
    return this.http.post<UserSubscription>(
      `${this.apiUrl}/stripe/subscription/${subscriptionId}/resume`,
      null
    );
  }

  // ==================== Stripe Payments ====================

  /**
   * Create payment intent
   * POST /stripe/payment/create-payment-intent
   */
  createPaymentIntent(amount: number, currency: string, description?: string): Observable<StripePaymentIntent> {
    return this.http.post<StripePaymentIntent>(
      `${this.apiUrl}/stripe/payment/create-payment-intent`,
      { amount, currency, description }
    );
  }

  /**
   * Get payment history
   * GET /stripe/payment/history
   */
  getStripePaymentHistory(page = 0, size = 20): Observable<Invoice[]> {
    return this.http.get<Invoice[]>(
      `${this.apiUrl}/stripe/payment/history`,
      { params: { page: page.toString(), size: size.toString() } }
    );
  }

  // ==================== Paystack ====================

  /**
   * Initialize Paystack transaction
   * POST /paystack/transaction/initialize
   */
  initializePaystackTransaction(
    amount: number,
    email: string,
    currency = 'NGN',
    callbackUrl?: string
  ): Observable<PaystackInitializeResponse> {
    return this.http.post<{ data: PaystackInitializeResponse }>(
      `${this.apiUrl}/paystack/transaction/initialize`,
      { amount, email, currency, callbackUrl }
    ).pipe(map(response => response.data));
  }

  /**
   * Verify Paystack transaction
   * GET /paystack/transaction/verify/{reference}
   */
  verifyPaystackTransaction(reference: string): Observable<unknown> {
    return this.http.get(
      `${this.apiUrl}/paystack/transaction/verify/${reference}`
    );
  }

  /**
   * Create Paystack subscription
   * POST /paystack/subscription
   */
  createPaystackSubscription(planCode: string, email: string): Observable<PaystackSubscription> {
    return this.http.post<{ data: PaystackSubscription }>(
      `${this.apiUrl}/paystack/subscription`,
      { planCode, email }
    ).pipe(map(response => response.data));
  }

  /**
   * Get active Paystack subscription
   * GET /paystack/subscription/active
   */
  getActivePaystackSubscription(): Observable<PaystackSubscription> {
    return this.http.get<PaystackSubscription>(
      `${this.apiUrl}/paystack/subscription/active`
    );
  }

  /**
   * Get Paystack subscription history
   * GET /paystack/subscriptions
   */
  getPaystackSubscriptionHistory(): Observable<PaystackSubscription[]> {
    return this.http.get<PaystackSubscription[]>(
      `${this.apiUrl}/paystack/subscriptions`
    );
  }

  /**
   * Enable Paystack subscription
   * POST /paystack/subscription/{subscriptionCode}/enable
   */
  enablePaystackSubscription(subscriptionCode: string, emailToken: string): Observable<unknown> {
    return this.http.post(
      `${this.apiUrl}/paystack/subscription/${subscriptionCode}/enable`,
      null,
      { params: { emailToken } }
    );
  }

  /**
   * Disable Paystack subscription
   * POST /paystack/subscription/{subscriptionCode}/disable
   */
  disablePaystackSubscription(subscriptionCode: string, emailToken: string): Observable<unknown> {
    return this.http.post(
      `${this.apiUrl}/paystack/subscription/${subscriptionCode}/disable`,
      null,
      { params: { emailToken } }
    );
  }

  // ==================== Receipts ====================

  /**
   * Get user's receipts
   * GET /receipts
   */
  getReceipts(page = 0, size = 10): Observable<Invoice[]> {
    return this.http.get<SubscriptionApiResponse<Invoice[]>>(
      `${this.apiUrl}/receipts`,
      { params: { page: page.toString(), size: size.toString() } }
    ).pipe(map(response => response.data));
  }

  /**
   * Get receipt by number
   * GET /receipts/{receiptNumber}
   */
  getReceipt(receiptNumber: string): Observable<Invoice> {
    return this.http.get<SubscriptionApiResponse<Invoice>>(
      `${this.apiUrl}/receipts/${receiptNumber}`
    ).pipe(map(response => response.data));
  }

  /**
   * Download receipt
   * GET /receipts/{receiptNumber}/download
   */
  downloadReceipt(receiptNumber: string): Observable<string> {
    return this.http.get<SubscriptionApiResponse<string>>(
      `${this.apiUrl}/receipts/${receiptNumber}/download`
    ).pipe(map(response => response.data));
  }
}


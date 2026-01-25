import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import {
  PayPalCreateSubscriptionRequest,
  PayPalCreateSubscriptionResponse,
  PayPalSubscriptionDetails,
  PayPalSubscriptionHistoryResponse,
  PayPalSubscriptionActionResponse,
  PayPalApiResponse,
  PayPalBillingPlan,
  PayPalPlansResponse,
  PayPalCreateOrderRequest,
  PayPalCreateOrderResponse,
  PayPalCaptureOrderResponse,
} from '../models/paypal.model';

/**
 * PayPal API Service
 * Handles all PayPal-related API calls for subscriptions
 */
@Injectable({
  providedIn: 'root'
})
export class PayPalApiService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/paypal`;

  // ==================== Plans Endpoints ====================

  /**
   * Get all PayPal billing plans
   * GET /paypal/plans
   */
  getPlans(): Observable<PayPalBillingPlan[]> {
    return this.http.get<PayPalApiResponse<PayPalPlansResponse>>(
      `${this.apiUrl}/plans`
    ).pipe(
      map(response => response.data.plans)
    );
  }

  // ==================== Order Endpoints (for coupon payments) ====================

  /**
   * Create a new PayPal order (one-time payment with coupon)
   * POST /paypal/orders
   */
  createOrder(request: PayPalCreateOrderRequest): Observable<PayPalCreateOrderResponse> {
    return this.http.post<PayPalApiResponse<PayPalCreateOrderResponse>>(
      `${this.apiUrl}/orders`,
      request
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Capture a PayPal order after approval
   * POST /paypal/orders/{orderId}/capture
   */
  captureOrder(orderId: string): Observable<PayPalCaptureOrderResponse> {
    return this.http.post<PayPalApiResponse<PayPalCaptureOrderResponse>>(
      `${this.apiUrl}/orders/${encodeURIComponent(orderId)}/capture`,
      null
    ).pipe(
      map(response => response.data)
    );
  }

  // ==================== Subscription Endpoints ====================

  /**
   * Create a new PayPal subscription
   * POST /paypal/subscriptions
   */
  createSubscription(request: PayPalCreateSubscriptionRequest): Observable<PayPalCreateSubscriptionResponse> {
    return this.http.post<PayPalApiResponse<PayPalCreateSubscriptionResponse>>(
      `${this.apiUrl}/subscriptions`,
      request
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Get subscription details by ID
   * GET /paypal/subscriptions/{subscriptionId}
   */
  getSubscriptionDetails(subscriptionId: string): Observable<PayPalSubscriptionDetails> {
    return this.http.get<PayPalApiResponse<PayPalSubscriptionDetails>>(
      `${this.apiUrl}/subscriptions/${encodeURIComponent(subscriptionId)}`
    ).pipe(
      map(response => response.data)
    );
  }


  /**
   * Get subscription history with pagination
   * GET /paypal/subscriptions
   */
  getSubscriptionHistory(
    page: number = 0,
    size: number = 20
  ): Observable<PayPalSubscriptionHistoryResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<PayPalSubscriptionHistoryResponse>(
      `${this.apiUrl}/subscriptions`,
      { params }
    );
  }

  /**
   * Cancel a subscription
   * POST /paypal/subscriptions/{subscriptionId}/cancel
   */
  cancelSubscription(
    subscriptionId: string,
    reason?: string
  ): Observable<PayPalSubscriptionActionResponse> {
    let params = new HttpParams();
    if (reason) {
      params = params.set('reason', reason);
    }

    return this.http.post<PayPalApiResponse<PayPalSubscriptionActionResponse>>(
      `${this.apiUrl}/subscriptions/${encodeURIComponent(subscriptionId)}/cancel`,
      null,
      { params }
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Suspend a subscription
   * POST /paypal/subscriptions/{subscriptionId}/suspend
   */
  suspendSubscription(
    subscriptionId: string,
    reason?: string
  ): Observable<PayPalSubscriptionActionResponse> {
    let params = new HttpParams();
    if (reason) {
      params = params.set('reason', reason);
    }

    return this.http.post<PayPalApiResponse<PayPalSubscriptionActionResponse>>(
      `${this.apiUrl}/subscriptions/${encodeURIComponent(subscriptionId)}/suspend`,
      null,
      { params }
    ).pipe(
      map(response => response.data)
    );
  }

  /**
   * Activate/Resume a suspended subscription
   * POST /paypal/subscriptions/{subscriptionId}/activate
   */
  activateSubscription(
    subscriptionId: string,
    reason?: string
  ): Observable<PayPalSubscriptionActionResponse> {
    let params = new HttpParams();
    if (reason) {
      params = params.set('reason', reason);
    }

    return this.http.post<PayPalApiResponse<PayPalSubscriptionActionResponse>>(
      `${this.apiUrl}/subscriptions/${encodeURIComponent(subscriptionId)}/activate`,
      null,
      { params }
    ).pipe(
      map(response => response.data)
    );
  }
}

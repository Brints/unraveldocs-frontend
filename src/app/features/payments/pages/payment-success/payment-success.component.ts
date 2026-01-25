import { Component, OnInit, inject, signal, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ActivatedRoute, RouterModule} from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PayPalApiService } from '../../services/paypal-api.service';
import { PayPalStateService } from '../../services/paypal-state.service';
import { PayPalSubscriptionDetails, PayPalCaptureOrderResponse, getPayPalStatusLabel } from '../../models/paypal.model';
import { catchError, of, tap, finalize } from 'rxjs';

/**
 * PaymentSuccessComponent
 * Handles the success callback redirect from payment gateways (PayPal)
 *
 * This component is loaded when the payment provider redirects the user back to our app
 * after a successful payment/subscription approval.
 */
@Component({
  selector: 'app-payment-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: 'payment-success.component.html',
  styleUrl: 'payment-success.component.css'
})
export class PaymentSuccessComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly paypalApi = inject(PayPalApiService);
  private readonly paypalState = inject(PayPalStateService);
  private readonly destroyRef = inject(DestroyRef);

  // Component state
  gateway = signal<string>('PayPal');
  paymentType = signal<'subscription' | 'order'>('subscription');
  isVerifying = signal(true);
  isSuccess = signal(false);
  isPending = signal(false);
  isError = signal(false);
  errorMessage = signal('');
  subscriptionDetails = signal<PayPalSubscriptionDetails | null>(null);
  orderDetails = signal<PayPalCaptureOrderResponse | null>(null);

  private subscriptionId: string | null = null;
  private orderId: string | null = null;

  ngOnInit(): void {
    this.handleCallback();
  }

  private handleCallback(): void {
    // Get gateway from query params
    const gatewayParam = this.route.snapshot.queryParamMap.get('gateway');
    if (gatewayParam) {
      this.gateway.set(gatewayParam.charAt(0).toUpperCase() + gatewayParam.slice(1));
    }

    // Get payment type from query params or session storage
    const typeParam = this.route.snapshot.queryParamMap.get('type');
    const storedPaymentType = sessionStorage.getItem('paypal_payment_type');
    const paymentType = typeParam || storedPaymentType || 'subscription';

    if (paymentType === 'order') {
      this.paymentType.set('order');
      this.handleOrderCallback();
    } else {
      this.paymentType.set('subscription');
      this.handleSubscriptionCallback();
    }
  }

  private handleOrderCallback(): void {
    // Get order ID from query params (token) or session storage
    const orderId = this.route.snapshot.queryParamMap.get('token')
      || sessionStorage.getItem('paypal_order_id');

    if (orderId) {
      this.orderId = orderId;
      this.captureOrder(orderId);
    } else {
      this.isVerifying.set(false);
      this.isError.set(true);
      this.errorMessage.set('No order ID found. Please try again or contact support.');
    }
  }

  private captureOrder(orderId: string): void {
    this.paypalApi.captureOrder(orderId).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(response => {
        this.orderDetails.set(response);

        if (response.status === 'COMPLETED') {
          this.isSuccess.set(true);

          // Clear session storage
          sessionStorage.removeItem('paypal_plan_id');
          sessionStorage.removeItem('paypal_payment_type');
          sessionStorage.removeItem('paypal_order_id');
          sessionStorage.removeItem('paypal_coupon_code');

          // Clear coupon state
          this.paypalState.clearCoupon();
        } else if (response.status === 'APPROVED') {
          this.isPending.set(true);
        } else {
          this.isError.set(true);
          this.errorMessage.set(`Order status: ${response.status}. Please contact support.`);
        }
      }),
      catchError(error => {
        this.isError.set(true);
        this.errorMessage.set(
          error.error?.message ||
          'Unable to complete payment. Please contact support.'
        );
        return of(null);
      }),
      finalize(() => {
        this.isVerifying.set(false);
      })
    ).subscribe();
  }

  private handleSubscriptionCallback(): void {
    // Get subscription ID from query params or session storage
    const subscriptionId = this.route.snapshot.queryParamMap.get('subscription_id')
      || this.route.snapshot.queryParamMap.get('token')
      || sessionStorage.getItem('paypal_subscription_id');

    if (subscriptionId) {
      this.subscriptionId = subscriptionId;
      this.verifySubscription(subscriptionId);
    } else {
      // Try to get from subscription history
      this.checkActiveSubscription();
    }
  }

  private verifySubscription(subscriptionId: string): void {
    this.paypalApi.getSubscriptionDetails(subscriptionId).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(subscription => {
        this.subscriptionDetails.set(subscription);

        if (subscription.active) {
          this.isSuccess.set(true);
        } else if (subscription.pendingApproval) {
          this.isPending.set(true);
        } else if (subscription.cancelled) {
          this.isError.set(true);
          this.errorMessage.set('Subscription was cancelled.');
        } else {
          // Show as pending for other states
          this.isPending.set(true);
        }

        // Clear session storage
        sessionStorage.removeItem('paypal_plan_id');
        sessionStorage.removeItem('paypal_subscription_id');
      }),
      catchError(error => {
        this.isError.set(true);
        this.errorMessage.set(
          error.error?.message ||
          'Unable to verify subscription. Please contact support.'
        );
        return of(null);
      }),
      finalize(() => {
        this.isVerifying.set(false);
      })
    ).subscribe();
  }

  private checkActiveSubscription(): void {
    // Use subscription history to find the most recent subscription
    this.paypalApi.getSubscriptionHistory(0, 10).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap(response => {
        if (response.content && response.content.length > 0) {
          // Get the most recent subscription (first in list)
          const latestSub = response.content[0];

          // Convert to subscription details format
          const subscription: PayPalSubscriptionDetails = {
            id: latestSub.subscription_id,
            planId: latestSub.plan_id,
            status: latestSub.status,
            startTime: latestSub.start_time,
            createTime: latestSub.created_at,
            updateTime: null,
            approvalUrl: null,
            customId: latestSub.custom_id,
            billingInfo: {
              outstandingBalance: latestSub.outstanding_balance || 0,
              currency: latestSub.currency || 'USD',
              cycleExecutionsCount: latestSub.cycles_completed,
              failedPaymentsCount: latestSub.failed_payments_count || 0,
              lastPaymentTime: latestSub.last_payment_time,
              lastPaymentAmount: latestSub.last_payment_amount,
              nextBillingTime: latestSub.next_billing_time
            },
            subscriber: null,
            links: [],
            active: latestSub.status === 'ACTIVE',
            approvalLink: null,
            cancelled: latestSub.status === 'CANCELLED',
            pendingApproval: latestSub.status === 'APPROVAL_PENDING',
            suspended: latestSub.status === 'SUSPENDED'
          };

          this.subscriptionDetails.set(subscription);

          if (subscription.active) {
            this.isSuccess.set(true);
          } else if (subscription.pendingApproval) {
            this.isPending.set(true);
          } else {
            this.isPending.set(true);
          }
        } else {
          this.isError.set(true);
          this.errorMessage.set('No subscription found. Please try again.');
        }
      }),
      catchError(_error => {
        this.isError.set(true);
        this.errorMessage.set('Unable to find subscription. Please try again.');
        return of(null);
      }),
      finalize(() => {
        this.isVerifying.set(false);
      })
    ).subscribe();
  }

  retryVerification(): void {
    this.isVerifying.set(true);
    this.isPending.set(false);
    this.isError.set(false);

    if (this.paymentType() === 'order') {
      if (this.orderId) {
        this.captureOrder(this.orderId);
      } else {
        this.isVerifying.set(false);
        this.isError.set(true);
        this.errorMessage.set('No order ID found. Please try again.');
      }
    } else {
      if (this.subscriptionId) {
        this.verifySubscription(this.subscriptionId);
      } else {
        this.checkActiveSubscription();
      }
    }
  }

  getStatusLabel(status: string): string {
    return getPayPalStatusLabel(status as any);
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}

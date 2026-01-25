import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {ActivatedRoute, RouterLink, RouterModule} from '@angular/router';

/**
 * PaymentCancelComponent
 * Handles the cancel callback redirect from payment gateways (PayPal)
 *
 * This component is loaded when the payment provider redirects the user back to our app
 * after they cancelled the payment/subscription process.
 */
@Component({
  selector: 'app-payment-cancel',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterLink],
  templateUrl: 'payment-cancel.component.html',
  styleUrl: 'payment-cancel.component.css'
})
export class PaymentCancelComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);

  gateway = signal<string>('PayPal');

  ngOnInit(): void {
    // Get gateway from query params
    const gatewayParam = this.route.snapshot.queryParamMap.get('gateway');
    if (gatewayParam) {
      //this.gateway.set(gatewayParam.charAt(0).toUpperCase() + gatewayParam.slice(1));
      const key = gatewayParam.trim().toLowerCase();
      const displayMap: Record<string, string> = {
        'paypal': 'PayPal',
        'stripe': 'Stripe',
        'paystack': 'Paystack'
      };
      this.gateway.set(displayMap[key] ??
        (gatewayParam.trim().charAt(0).toUpperCase() + gatewayParam.trim().slice(1)));
    }

    // Clear any stored session data
    sessionStorage.removeItem('paypal_plan_id');
    sessionStorage.removeItem('paypal_subscription_id');
  }
}

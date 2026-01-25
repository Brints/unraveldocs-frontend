import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';

export const paymentRoutes: Routes = [
  // Unified payment success route (handles PayPal success callback)
  {
    path: 'payment/success',
    loadComponent: () => import('./pages/payment-success/payment-success.component')
      .then(m => m.PaymentSuccessComponent),
    title: 'Payment Successful - UnravelDocs'
  },
  // Unified payment cancel route (handles PayPal cancel callback)
  {
    path: 'payment/cancel',
    loadComponent: () => import('./pages/payment-cancel/payment-cancel.component')
      .then(m => m.PaymentCancelComponent),
    title: 'Payment Cancelled - UnravelDocs'
  },
  // Paystack callback route (no auth required - user redirected from Paystack)
  {
    path: 'payments/paystack/callback',
    loadComponent: () => import('./pages/paystack-callback/paystack-callback.component')
      .then(m => m.PaystackCallbackComponent),
    title: 'Payment Status - UnravelDocs'
  },
  // PayPal callback route (no auth required - user redirected from PayPal)
  {
    path: 'payments/paypal/callback',
    loadComponent: () => import('./pages/paypal-callback/paypal-callback.component')
      .then(m => m.PayPalCallbackComponent),
    title: 'PayPal Subscription Status - UnravelDocs'
  },
  // Payment routes under /payments prefix
  {
    path: 'payments',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'history',
        pathMatch: 'full'
      },
      {
        path: 'history',
        loadComponent: () => import('./pages/payment-history/payment-history.component')
          .then(m => m.PaymentHistoryComponent),
        title: 'Payment History - UnravelDocs'
      },
      {
        path: 'methods',
        loadComponent: () => import('./pages/payment-methods/payment-methods.component')
          .then(m => m.PaymentMethodsComponent),
        title: 'Payment Methods - UnravelDocs'
      },
      {
        path: 'receipts',
        loadComponent: () => import('./pages/receipts-list/receipts-list.component')
          .then(m => m.ReceiptsListComponent),
        title: 'Receipts - UnravelDocs'
      }
    ]
  }
];


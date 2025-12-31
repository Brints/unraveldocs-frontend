import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';

export const paymentRoutes: Routes = [
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


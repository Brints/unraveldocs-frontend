import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';

export const creditRoutes: Routes = [
  {
    path: 'credits',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'packs',
        pathMatch: 'full'
      },
      {
        path: 'packs',
        loadComponent: () => import('./pages/credit-packs/credit-packs.component')
          .then(m => m.CreditPacksComponent),
        title: 'Credit Packs - ReDraft'
      },
      {
        path: 'transactions',
        loadComponent: () => import('./pages/credit-transactions/credit-transactions.component')
          .then(m => m.CreditTransactionsComponent),
        title: 'Credit Transactions - ReDraft'
      },
      {
        path: 'transfer',
        loadComponent: () => import('./pages/credit-transfer/credit-transfer.component')
          .then(m => m.CreditTransferComponent),
        title: 'Transfer Credits - ReDraft'
      },
      {
        path: 'purchase/callback',
        loadComponent: () => import('./pages/credit-purchase-callback/credit-purchase-callback.component')
          .then(m => m.CreditPurchaseCallbackComponent),
        title: 'Purchase Complete - ReDraft'
      }
    ]
  }
];


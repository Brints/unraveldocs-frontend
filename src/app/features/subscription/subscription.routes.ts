import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';

export const subscriptionRoutes: Routes = [
  {
    path: 'subscription',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        redirectTo: 'manage',
        pathMatch: 'full'
      },
      {
        path: 'plans',
        loadComponent: () => import('./components/subscription-plans/subscription-plans.component')
          .then(m => m.SubscriptionPlansComponent),
        title: 'Subscription Plans - UnravelDocs'
      },
      {
        path: 'manage',
        loadComponent: () => import('./components/subscription-manage/subscription-manage.component')
          .then(m => m.SubscriptionManageComponent),
        title: 'Manage Subscription - UnravelDocs'
      },
      {
        path: 'success',
        loadComponent: () => import('./components/subscription-plans/subscription-plans.component')
          .then(m => m.SubscriptionPlansComponent),
        title: 'Subscription Success - UnravelDocs'
      }
    ]
  }
];


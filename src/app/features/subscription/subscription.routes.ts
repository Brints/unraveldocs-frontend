import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';

export const subscriptionRoutes: Routes = [
  {
    path: 'subscriptions',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/subscription-overview/subscription-overview.component')
          .then(m => m.SubscriptionOverviewComponent),
        title: 'Subscription Overview - UnravelDocs'
      },
      {
        path: 'plans',
        loadComponent: () => import('./pages/plans-comparison/plans-comparison.component')
          .then(m => m.PlansComparisonComponent),
        title: 'Compare Plans - UnravelDocs'
      },
      {
        path: 'upgrade',
        loadComponent: () => import('./pages/upgrade-plan/upgrade-plan.component')
          .then(m => m.UpgradePlanComponent),
        title: 'Upgrade Plan - UnravelDocs'
      }
    ]
  },
  // Keep old routes for backward compatibility
  {
    path: 'subscription',
    redirectTo: 'subscriptions',
    pathMatch: 'full'
  }
];

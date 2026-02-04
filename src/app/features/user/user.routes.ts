import { Routes } from '@angular/router';
import { authGuard } from '../../core/auth/guards/auth.guard';

export const userRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/dashboard-layout/dashboard-layout.component')
      .then(m => m.DashboardLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./components/dashboard-overview/dashboard-overview.component')
          .then(m => m.DashboardOverviewComponent),
        title: 'Dashboard - UnravelDocs'
      },
      {
        path: 'settings',
        children: [
          {
            path: '',
            redirectTo: 'profile',
            pathMatch: 'full'
          },
          {
            path: 'profile',
            loadComponent: () => import('./components/profile-settings/profile-settings.component')
              .then(m => m.ProfileSettingsComponent),
            title: 'Profile Settings - UnravelDocs'
          },
          {
            path: 'security',
            loadComponent: () => import('./components/security-settings/security-settings.component')
              .then(m => m.SecuritySettingsComponent),
            title: 'Security Settings - UnravelDocs'
          },
          {
            path: 'billing',
            loadComponent: () => import('./components/billing-settings/billing-settings.component')
              .then(m => m.BillingSettingsComponent),
            title: 'Billing & Subscription - UnravelDocs'
          },
          {
            path: 'billing/paystack/callback',
            loadComponent: () => import('../payments/pages/paystack-callback/paystack-callback.component')
              .then(m => m.PaystackCallbackComponent),
            title: 'Payment Processing - UnravelDocs'
          },
          {
            path: 'notifications',
            loadComponent: () => import('./components/notification-settings/notification-settings.component')
              .then(m => m.NotificationSettingsComponent),
            title: 'Notification Preferences - UnravelDocs'
          },
          {
            path: 'storage',
            loadComponent: () => import('./components/storage-usage/storage-usage.component')
              .then(m => m.StorageUsageComponent),
            title: 'Storage & Usage - UnravelDocs'
          }
        ]
      }
    ]
  }
];

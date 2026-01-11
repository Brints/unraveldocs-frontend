import { Routes } from '@angular/router';

export const notificationRoutes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/notifications-page/notifications-page.component')
        .then(m => m.NotificationsPageComponent),
  },
  {
    path: 'preferences',
    redirectTo: '/settings/notifications',
    pathMatch: 'full'
  },
];


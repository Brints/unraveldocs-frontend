import {Routes} from '@angular/router';
import {authGuard} from '../../core/auth/guards/auth.guard';

export const userRoutes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./components/user-dashboard/user-dashboard.component')
      .then(m => m.UserDashboardComponent),
    title: 'User Dashboard - UnravelDocs',
    canActivate: [authGuard]
  },
]

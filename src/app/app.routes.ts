import { Routes } from '@angular/router';
import {UserDashboardComponent} from './pages/user/components/user-dashboard/user-dashboard.component';
import {authGuard} from './core/auth/guards/auth.guard';
import {LandingComponent} from './pages/landing-page/components/landing.component';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: LandingComponent },
  {
    path: 'auth',
    loadChildren: () => import('./core/auth/auth.routes').then(m => m.authRoutes)
  },
  {
    path: 'admin',
    loadChildren: () => import('./pages/admin/admin.routes').then(m => m.adminRoutes)
  },
  {
    path: '',
    loadChildren: () => import('./pages/privacy/privacy.routes').then(m => m.privacyRoutes)
  },
  {
    path: '',
    loadChildren: () => import('./pages/user/user.routes').then(m => m.userRoutes)
  },
  { path: '**', redirectTo: '/home' }
];
